import { demoPack } from "@/lib/demo";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { saveMaterial } from "@/lib/persist";
import { materialsSchema, modelPackSchema } from "@/lib/schemas";
import type { Question, StudyPack } from "@/lib/types";

export const runtime = "nodejs";

function packId(topic: string) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "pack";
}

export async function POST(request: Request) {
  const parsed = parseBody(materialsSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  if (!llmConfigured()) {
    const pack = demoPack(input.subject, input.topic, input.notes);
    return demoPayload({ pack });
  }

  try {
    const output = await generateStructured(
      modelPackSchema,
      [
        `Subject ${input.subject}. Topic ${input.topic}.`,
        "Turn these notes into a summary, flashcards, and multiple-choice questions.",
        "Every question needs one correct option. Do not invent facts that contradict the notes.",
        `Notes:\n${input.notes}`,
      ].join("\n"),
    );
    const questions: Question[] = output.questions.map((item, index) => ({
      id: `q${index + 1}`,
      prompt: item.prompt,
      options: item.options,
      answerIndex: Math.min(item.answerIndex, item.options.length - 1),
      explanation: item.explanation,
      subject: input.subject,
      topic: input.topic,
    }));
    const pack: StudyPack = {
      id: packId(input.topic),
      subject: input.subject,
      topic: input.topic,
      summary: output.summary,
      flashcards: output.flashcards,
      questions,
    };
    await saveMaterial({
      kind: "study_pack",
      title: input.topic,
      subject: input.subject,
      topic: input.topic,
      payload: pack,
    });
    return Response.json({ demo: false, pack });
  } catch {
    return modelFailed();
  }
}
