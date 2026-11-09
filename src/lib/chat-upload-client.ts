/** Puts bytes on a server-issued signed upload URL. The browser does not read the auth session. */
export function uploadSignedChatObject(input: {
  signedUrl: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  const xhr = new XMLHttpRequest();
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", input.file, input.file.name);
  const done = new Promise<void>((resolve, reject) => {
    xhr.open("PUT", input.signedUrl);
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
    xhr.send(body);
  });
  return { done, abort: () => xhr.abort() };
}

function storageError(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    const message = parsed.message || parsed.error || "";
    if (/mime|content.type/i.test(message)) return "Use a PDF, PNG, JPG, or WebP.";
    if (/size|too large|payload/i.test(message)) return "That file is too big. Each file must be 10 MB or smaller.";
  } catch {
    // The body was not JSON.
  }
  return "That upload did not finish.";
}
