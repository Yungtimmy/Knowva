"use client";

import { useRouter } from "next/navigation";
import type { TeacherClass } from "@/lib/types";

export function ClassSwitcher({ classes, current }: { classes: TeacherClass[]; current: string }) {
  const router = useRouter();
  return (
    <select
      style={{ width: "auto" }}
      value={current}
      aria-label="Class"
      onChange={(event) => router.push(`/teacher/class/${event.target.value}`)}
    >
      {classes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name} · {item.subject}
        </option>
      ))}
    </select>
  );
}
