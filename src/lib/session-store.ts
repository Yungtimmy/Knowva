import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Question, StudyPack, TestDifficulty, TestResult, Tutor } from "./types";

export type StoredPaper = {
  id: string;
  ownerId: string;
  course: string;
  tutorId: string | null;
  difficulty: TestDifficulty;
  topics: string[];
  kind: "test" | "practice";
  status: "open" | "submitted";
  questions: Question[];
  result: TestResult | null;
  createdAt: string;
  submittedAt: string | null;
};

type Bucket = {
  tutors: Tutor[];
  papers: StoredPaper[];
  materials: StudyPack[];
};

type FileShape = Record<string, Bucket>;

function bucketFile() {
  const root = process.env.KNOWVA_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
  return path.join(root, "knowva-session.json");
}

function emptyBucket(): Bucket {
  return { tutors: [], papers: [], materials: [] };
}

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readFileShape(): Promise<FileShape> {
  try {
    const raw = await readFile(bucketFile(), "utf8");
    const parsed = JSON.parse(raw) as FileShape;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeFileShape(data: FileShape) {
  const filePath = bucketFile();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data));
}

export function readBucket(ownerId: string) {
  return enqueue(async () => {
    const all = await readFileShape();
    return all[ownerId] ?? emptyBucket();
  });
}

export function updateBucket<T>(ownerId: string, fn: (bucket: Bucket) => T) {
  return enqueue(async () => {
    const all = await readFileShape();
    const bucket = all[ownerId] ?? emptyBucket();
    const result = fn(bucket);
    all[ownerId] = bucket;
    await writeFileShape(all);
    return result;
  });
}
