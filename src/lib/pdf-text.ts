import { inflateSync } from "node:zlib";

/** Pull text from a text-based PDF. Scanned pages return an empty string. */
export function extractPdfText(bytes: Uint8Array) {
  const raw = Buffer.from(bytes).toString("latin1");
  const parts: string[] = [];
  const streams = raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g);
  for (const match of streams) {
    const body = match[1] ?? "";
    let decoded = body;
    try {
      decoded = inflateSync(Buffer.from(body, "latin1")).toString("latin1");
    } catch {
      decoded = body;
    }
    parts.push(readPdfLiterals(decoded));
  }
  const joined = cleanup(parts.join(" "));
  if (joined.length >= 8) return joined;
  return cleanup(readPdfLiterals(raw));
}

function readPdfLiterals(source: string) {
  const bits: string[] = [];
  const literal = /\(((?:\\\)|\\.|[^)])*)\)/g;
  for (const match of source.matchAll(literal)) {
    const text = decodePdfLiteral(match[1] ?? "");
    if (text.trim().length > 1 && !/^\/?[A-Z][A-Za-z0-9]{0,12}$/.test(text.trim())) bits.push(text);
  }
  return bits.join(" ");
}

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function cleanup(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 12000);
}
