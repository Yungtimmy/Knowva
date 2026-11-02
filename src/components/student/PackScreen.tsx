"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/api-client";
import { readStore, writeStore } from "@/lib/browser-store";
import type { StudyPack } from "@/lib/types";
import { PackView } from "./PackView";

export function PackScreen({ packId, fallback }: { packId: string; fallback: StudyPack | null }) {
  const [pack, setPack] = useState<StudyPack | null>(fallback);

  useEffect(() => {
    const stored = readStore<Record<string, StudyPack>>("knowva.packs", {});
    if (stored[packId]) setPack(stored[packId]);
    getJson<{ materials: StudyPack[] }>("/api/materials")
      .then((data) => {
        const found = data.materials.find((item) => item.id === packId);
        if (!found) return;
        setPack(found);
        const next = readStore<Record<string, StudyPack>>("knowva.packs", {});
        next[found.id] = found;
        writeStore("knowva.packs", next);
      })
      .catch(() => undefined);
  }, [packId]);

  return (
    <>
      <Link className="back" href="/student/materials">
        ← Materials
      </Link>
      {!pack ? (
        <section className="card" style={{ marginTop: 12 }}>
          <h1>No pack saved</h1>
          <p>Make a study pack from your notes, then open it here.</p>
        </section>
      ) : (
        <>
          <h1 style={{ margin: "12px 0" }}>{pack.topic}</h1>
          <p className="meta" style={{ marginBottom: 12 }}>
            {pack.subject}
          </p>
          <PackView pack={pack} />
        </>
      )}
    </>
  );
}
