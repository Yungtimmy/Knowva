import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import type { z } from "zod";

const INSTRUCTIONS = [
  "You are Knowva, a tutor for university students and people learning developer tools.",
  "Write short sentences. Use the precise term, then gloss it once.",
  "Do not use exclamation marks.",
  "Do not diagnose a learning difficulty, rank intelligence, or promise a grade.",
  "If the request is not a course, a programming topic, or a prompt-engineering topic, say so briefly and ask for one.",
  "Prefer a correct simple answer over a long one. If you are unsure, say what to check.",
].join(" ");

export function llmApiKey() {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return groq;
  const key = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  return key?.trim() || undefined;
}

export function llmProvider(): "groq" | "openai" | "none" {
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim() || process.env.LLM_API_KEY?.trim()) return "openai";
  return "none";
}

export function llmConfigured() {
  return Boolean(llmApiKey());
}

function chatModel() {
  const provider = llmProvider();
  const baseURL =
    process.env.LLM_BASE_URL?.trim() ||
    (provider === "groq" ? "https://api.groq.com/openai/v1" : process.env.OPENAI_BASE_URL?.trim() || undefined);
  const model =
    process.env.LLM_MODEL?.trim() || (provider === "groq" ? "openai/gpt-oss-20b" : "gpt-4o-mini");
  const openai = createOpenAI({
    apiKey: llmApiKey(),
    baseURL,
  });
  // .chat() uses Chat Completions, which Groq and other OpenAI-compatible base URLs implement.
  return openai.chat(model);
}

type GenerateOptions = {
  timeoutMs?: number;
  maxRetries?: number;
};

function callLimits(options?: GenerateOptions) {
  const extra: { timeout?: number; maxRetries?: number } = {};
  if (options?.timeoutMs !== undefined) extra.timeout = options.timeoutMs;
  if (options?.maxRetries !== undefined) extra.maxRetries = options.maxRetries;
  return extra;
}

function timedOut(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return /timeout|abort/i.test(name) || /timeout|aborted/i.test(message);
}

export async function generateStructured<T>(
  schema: z.ZodType<T>,
  prompt: string,
  instructions?: string,
  options?: GenerateOptions,
): Promise<T> {
  const system = instructions ?? INSTRUCTIONS;
  const limits = callLimits(options);
  try {
    const result = await generateText({
      model: chatModel(),
      instructions: system,
      prompt,
      output: Output.object({ schema }),
      ...limits,
    });
    if (result.output != null) return result.output;
  } catch (error) {
    // Some Groq models reject json_schema. A timeout should not start a second call.
    if (timedOut(error)) throw error;
  }

  const result = await generateText({
    model: chatModel(),
    instructions: `${system}\nReply with one JSON object and no markdown. Use only the keys the schema asks for.`,
    prompt,
    ...limits,
    maxRetries: 0,
  });
  const text = result.text.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model returned no structured answer.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  try {
    return schema.parse(parsed);
  } catch (error) {
    if (!parsed || typeof parsed !== "object") throw error;
    const row = parsed as Record<string, unknown>;
    return schema.parse({
      ...row,
      short: row.short ?? row.explanation,
      remember: row.remember ?? row.memory,
      next: row.next ?? row.next_step ?? row.nextStep,
    });
  }
}
