/** A same-origin path into the student or lecturer app. Anything else is dropped. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "";
  if (value.includes("\\") || value.includes("://") || value.includes("\0")) return "";
  const path = value.split("#")[0]?.split("?")[0] ?? "";
  if (path.includes("..")) return "";
  const core = path === "/student" || path.startsWith("/student/") || path === "/teacher" || path.startsWith("/teacher/");
  if (!core) return "";
  return value.split("#")[0] ?? "";
}
