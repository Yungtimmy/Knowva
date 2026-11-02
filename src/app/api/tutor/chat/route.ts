import { demoTutorReply } from "@/lib/demo";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { modelTutorSchema, tutorChatSchema } from "@/lib/schemas";
import type { TutorMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseBody(tutorChatSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  if (!llmConfigured()) {
    return demoPayload({
      message: demoTutorReply(input) satisfies TutorMessage,
    });
  }

  try {
    const mode = input.mode && input.mode !== "explain" ? ` Reply in this mode: ${input.mode}.` : "";
    const output = await generateStructured(
      modelTutorSchema,
      [
        `Level ${input.level}. Subject ${input.subject}. Topic ${input.topic}.`,
        `Student question: ${input.message}`,
        mode,
        "Return a short answer, 2 to 5 steps, and one line to remember.",
      ].join("\n"),
    );
    const message: TutorMessage = { role: "tutor", ...output };
    return Response.json({ demo: false, message });
  } catch {
    return modelFailed();
  }
}
