import { isValidMcq } from "@/lib/assessment";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { draftMaterial, MATERIALS_INSTRUCTIONS } from "@/lib/material-draft";
import { resolveOwner } from "@/lib/owner";
import { extractPdfText } from "@/lib/pdf-text";
import { saveMaterial } from "@/lib/persist";
import { materialsSchema, modelPackSchema } from "@/lib/schemas";
import { savePack } from "@/lib/test-repo";
import type { Question, StudyPack } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = parseBody(materialsSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  let notes = input.notes?.trim() ?? "";
  if (input.pdfBase64) {
    let bytes: Buffer;
    try {
      bytes = Buffer.from(input.pdfBase64, "base64");
    } catch {
      return Response.json({ error: "That PDF could not be read." }, { status: 400 });
    }
    if (bytes.length > 1_500_000) {
      return Response.json({ error: "That PDF is too large. Paste the notes instead." }, { status: 400 });
    }
    const extracted = extractPdfText(bytes);
    if (extracted.trim().length < 20) {
      return Response.json(
        { error: "This PDF has no text layer. Paste the notes. Scanned pages need OCR, which this build does not do." },
        { status: 400 },
      );
    }
    notes = extracted.trim();
  }

  const owner = await resolveOwner();

  if (!llmConfigured()) {
    const pack = draftMaterial(input.subject, input.topic, notes);
    await savePack(owner.id, pack);
    await saveMaterial({
      kind: "study_pack",
      title: input.topic,
      subject: input.subject,
      topic: input.topic,
      payload: pack,
    });
    return demoPayload({ pack });
  }

  try {
    const output = await generateStructured(
      modelPackSchema,
      [
        `Course: ${input.subject}. Topic: ${input.topic}.`,
        "Use only the paste below. Do not add facts from outside it.",
        "<paste>",
        notes,
        "</paste>",
      ].join("\n"),
      MATERIALS_INSTRUCTIONS,
    );
    const questions: Question[] = output.questions
      .map((item, index) => ({
        id: `q${index + 1}`,
        prompt: item.prompt,
        options: item.options,
        answerIndex: item.answerIndex,
        explanation: item.explanation,
        subject: input.subject,
        topic: item.topic?.trim() || input.topic,
      }))
      .filter(isValidMcq);
    if (questions.length < 5) throw new Error("The model did not return 5 valid questions.");
    const pack: StudyPack = {
      id: crypto.randomUUID(),
      subject: input.subject,
      topic: input.topic,
      outline: output.outline,
      summary: output.outline.slice(0, 4),
      keyTerms: output.keyTerms,
      flashcards: output.keyTerms.map((term) => ({ q: term.term, a: term.meaning })),
      questions,
    };
    await savePack(owner.id, pack);
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
