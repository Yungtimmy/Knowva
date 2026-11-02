import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = path.resolve(process.cwd(), "design");

const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  if (!parts?.length || parts.some((part) => part === ".." || part.includes("\0"))) {
    return new Response("Not found", { status: 404 });
  }

  const file = path.resolve(ROOT, ...parts);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const body = await readFile(file);
    const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    return new Response(body, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
