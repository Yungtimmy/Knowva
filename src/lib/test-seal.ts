import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type SealedAnswer = {
  id: string;
  answerIndex: number;
  explanation: string;
};

function sealSecret() {
  return (
    process.env.KNOWVA_SEAL_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.LLM_API_KEY?.trim() ||
    ""
  );
}

function sealKey() {
  const secret = sealSecret();
  if (!secret) return null;
  return createHash("sha256").update(`knowva-test-seal:v1:${secret}`).digest();
}

export function canSealAnswers() {
  return sealKey() !== null;
}

/** Ciphertext only. The browser can read the column and still cannot see the key. */
export function sealAnswers(answers: SealedAnswer[]) {
  const key = sealKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(answers), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${Buffer.concat([iv, tag, body]).toString("base64url")}`;
}

export function openSeal(sealed: string): SealedAnswer[] | null {
  const key = sealKey();
  if (!key || !sealed.startsWith("v1.")) return null;
  try {
    const raw = Buffer.from(sealed.slice(3), "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const body = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    const answers: SealedAnswer[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.explanation !== "string" || typeof row.answerIndex !== "number") {
        return null;
      }
      answers.push({ id: row.id, answerIndex: row.answerIndex, explanation: row.explanation });
    }
    return answers;
  } catch {
    return null;
  }
}
