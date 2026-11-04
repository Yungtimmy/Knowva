export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readPayload(response: Response) {
  const text = await response.text();
  if (!text) return { data: {} as { error?: string; demo?: boolean }, message: "" };
  try {
    const data = JSON.parse(text) as { error?: string; demo?: boolean };
    const message = typeof data.error === "string" ? data.error.trim() : "";
    return { data, message };
  } catch {
    return { data: {} as { error?: string; demo?: boolean }, message: "" };
  }
}

function failureMessage(response: Response, message: string) {
  if (message) return message;
  return `That request failed (${response.status}).`;
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const { data, message } = await readPayload(response);
  if (!response.ok) throw new ApiError(response.status, failureMessage(response, message));
  return data as T;
}

export async function sendJson<T>(url: string, method: "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const { data, message } = await readPayload(response);
  if (!response.ok) throw new ApiError(response.status, failureMessage(response, message));
  return data as T;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const { data, message } = await readPayload(response);
  if (response.status === 503 && data.demo) return data as T;
  if (!response.ok) {
    throw new ApiError(response.status, failureMessage(response, message));
  }
  return data as T;
}
