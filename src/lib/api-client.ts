export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { demo?: boolean; error?: string };
  if (response.status === 503 && data.demo) return data;
  if (!response.ok) {
    throw new ApiError(response.status, data.error || "That request failed.");
  }
  return data;
}
