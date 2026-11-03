/** A same-origin path into the app. Lecturer paths are dropped. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "";
  if (value.includes("\\") || value.includes("://") || value.includes("\0")) return "";
  const path = value.split("#")[0]?.split("?")[0] ?? "";
  if (path.includes("..")) return "";
  const core = path === "/student" || path.startsWith("/student/");
  if (!core) return "";
  return value.split("#")[0] ?? "";
}
