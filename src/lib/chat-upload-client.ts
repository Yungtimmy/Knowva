import { CHAT_BUCKET } from "./chat-files";
import { createClient } from "./supabase/client";
import { supabasePublicEnv } from "./supabase/env";

export async function signedInUserId() {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function chatAccessToken() {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function uploadChatObject(input: {
  path: string;
  file: File;
  contentType: string;
  accessToken: string;
  onProgress: (percent: number) => void;
}) {
  const env = supabasePublicEnv();
  if (!env) {
    return { done: Promise.reject(new Error("Sign in to attach a file.")), abort: () => undefined };
  }
  const xhr = new XMLHttpRequest();
  const url = `${env.url.replace(/\/$/, "")}/storage/v1/object/${CHAT_BUCKET}/${input.path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const done = new Promise<void>((resolve, reject) => {
    xhr.open("POST", url);
    xhr.setRequestHeader("authorization", `Bearer ${input.accessToken}`);
    xhr.setRequestHeader("apikey", env.key);
    xhr.setRequestHeader("content-type", input.contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      input.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(100);
        resolve();
        return;
      }
      reject(new Error(storageError(xhr.responseText)));
    };
    xhr.onerror = () => reject(new Error("That upload did not finish."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(input.file);
  });
  return { done, abort: () => xhr.abort() };
}

export async function removeChatObject(path: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.storage.from(CHAT_BUCKET).remove([path]);
}

function storageError(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    const message = parsed.message || parsed.error || "";
    if (/row-level security|unauthorized|jwt/i.test(message)) return "Sign in to attach a file.";
    if (/mime|content.type|invalid/i.test(message)) return "Use a PDF, PNG, JPG, or WebP.";
    if (/size|too large|payload/i.test(message)) return "That file is too big. Each file must be 10 MB or smaller.";
  } catch {
    // The body was not JSON.
  }
  return "That upload did not finish.";
}
