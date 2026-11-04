import { z } from "zod";
import { generateStructured, llmConfigured } from "./llm";
import {
  assembleResources,
  isCuratedResourceUrl,
  isStubCopy,
  typesForPreference,
  verifyBundle,
} from "./resources";
import type { ResourceBundle, ResourceItem, ResourcePreference, ResourceType } from "./types";

const modelResourceSchema = z.object({
  resources: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        url: z.string().min(8).max(400),
        kind: z.enum(["video", "notes"]),
        why: z.string().min(1).max(300),
        source: z.string().min(1).max(80),
      }),
    )
    .max(6),
});

const RESOURCE_INSTRUCTIONS = [
  "You suggest real learning links for one topic.",
  "Every url must be an existing https page. If you are not sure it exists, omit it.",
  "kind video: only https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID.",
  "kind notes: a course or article page on freecodecamp.org, udemy.com/course/, developer.mozilla.org, deeplearning.ai, promptingguide.ai, khanacademy.org, openstax.org, or official documentation.",
  "Never return a search page, a Google link, a YouTube results link, or a channel homepage.",
  "Do not invent video ids.",
].join(" ");

export class ResourceCurateError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "ResourceCurateError";
    this.status = status;
  }
}

function kindType(kind: "video" | "notes"): ResourceType {
  return kind === "video" ? "youtube" : "notes";
}

/** Turn model rows into cards. Drop anything that is not a real curated URL. */
export function acceptModelResources(
  rows: Array<{ title: string; url: string; kind: "video" | "notes"; why: string; source: string }>,
  preference: ResourcePreference,
  topic: string,
) {
  const allowed = new Set(typesForPreference(preference));
  const seen = new Set<string>();
  const items: ResourceItem[] = [];
  for (const row of rows) {
    const type = kindType(row.kind);
    if (!allowed.has(type)) continue;
    const url = row.url.trim();
    if (!isCuratedResourceUrl(url, type)) continue;
    if (isStubCopy(row.title) || isStubCopy(row.why) || isStubCopy(row.source)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: row.title.trim(),
      type,
      url,
      searchQuery: topic,
      why: row.why.trim(),
      confidence: "med",
      verified: false,
      role: "primary",
      source: row.source.trim(),
    });
  }
  return items;
}

function pack(input: { subject: string; topic: string; level: string; preference: ResourcePreference }, items: ResourceItem[]): ResourceBundle {
  return {
    subject: input.subject,
    topic: input.topic,
    preference: input.preference,
    level: input.level,
    weakTopic: null,
    primary: items.slice(0, 3).map((item) => ({ ...item, role: "primary" })),
    alternates: items.slice(3, 5).map((item) => ({ ...item, role: "alternate" })),
  };
}

export async function curateResources(input: {
  subject: string;
  topic: string;
  level: string;
  preference: ResourcePreference;
  weakTopic?: string;
}): Promise<ResourceBundle> {
  const topic = (input.weakTopic?.trim() || input.topic).trim();
  const catalog = assembleResources({ ...input, topic, weakTopic: topic });
  const seeded = [...catalog.primary, ...catalog.alternates];
  let modelItems: ResourceItem[] = [];
  if (llmConfigured()) {
    const focus = input.preference === "video" ? "video" : input.preference === "mixed" ? "video and notes" : "notes";
    try {
      const output = await generateStructured(
        modelResourceSchema,
        [`Topic: ${topic}.`, input.subject && input.subject !== topic ? `Course: ${input.subject}.` : "", `Return ${focus} links only.`]
          .filter(Boolean)
          .join("\n"),
        RESOURCE_INSTRUCTIONS,
        { timeoutMs: 20_000, maxRetries: 0 },
      );
      modelItems = acceptModelResources(output.resources, input.preference, topic);
    } catch (error) {
      console.error("resource curate", error instanceof Error ? error.name : "error");
      if (seeded.length === 0) {
        const timed = error instanceof Error && /timeout|aborted/i.test(error.message);
        throw new ResourceCurateError(
          timed ? "The model took too long. Try again in a moment." : "The model did not return links. Try again in a moment.",
        );
      }
    }
  } else if (seeded.length === 0) {
    throw new ResourceCurateError("The model key is not configured, so Knowva cannot look up links.", 503);
  }

  const seen = new Set(seeded.map((item) => item.url));
  const merged = [...seeded];
  for (const item of modelItems) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    merged.push(item);
  }
  const checked = await verifyBundle(pack({ ...input, topic }, merged));
  return checked;
}
