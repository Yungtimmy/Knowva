import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import type { z } from "zod";

const INSTRUCTIONS = [
  "You are Knowva, a tutor for secondary school students (SS1 to SS3).",
  "Write short sentences a 15-year-old can read aloud.",
  "Do not use exclamation marks.",
  "Do not diagnose a learning difficulty, rank intelligence, or promise a grade.",
  "If the request is not a school subject, say so briefly and ask for a school topic.",
  "Prefer a correct simple answer over a long one. If you are unsure, say what to check.",
].join(" ");

export function llmApiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  return key?.trim() || undefined;
}

export function llmConfigured() {
  return Boolean(llmApiKey());
}

function chatModel() {
  const openai = createOpenAI({
    apiKey: llmApiKey(),
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || undefined,
  });
  // .chat() uses Chat Completions, which OpenAI-compatible base URLs usually implement.
  return openai.chat(process.env.LLM_MODEL || "gpt-4o-mini");
}

export async function generateStructured<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const result = await generateText({
    model: chatModel(),
    instructions: INSTRUCTIONS,
    prompt,
    output: Output.object({ schema }),
  });
  if (result.output == null) {
    throw new Error("The model returned no structured answer.");
  }
  return result.output;
}
