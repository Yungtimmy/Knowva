import { NextResponse } from "next/server";
import { loadStudentProfile } from "@/lib/profile-server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Use a PNG, JPG, or WebP image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is over 4 MB. Try a smaller one." }, { status: 400 });
  }

  const path = `${data.user.id}/avatar.${extension}`;
  const upload = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: true,
  });
  if (upload.error) {
    console.error("avatar upload", upload.error.message);
    return NextResponse.json({ error: "Photo storage is not set up yet." }, { status: 500 });
  }

  const { data: published } = supabase.storage.from("avatars").getPublicUrl(path);
  // The path is stable per student, so the version suffix keeps caches honest
  // after a replacement upload.
  const avatarUrl = `${published.publicUrl}?v=${Date.now()}`;

  const updated = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", data.user.id)
    .select("id")
    .maybeSingle();
  if (updated.error) return avatarError(updated.error.code);
  if (!updated.data) {
    const inserted = await supabase
      .from("profiles")
      .insert({ id: data.user.id, avatar_url: avatarUrl })
      .select("id")
      .maybeSingle();
    if (inserted.error) return avatarError(inserted.error.code);
  }

  const profile = await loadStudentProfile();
  return NextResponse.json({ avatarUrl, profile });
}

function avatarError(code: string | undefined) {
  console.error("avatar write", code ?? "error");
  if (code === "42703" || code === "42501") {
    return NextResponse.json({ error: "Photo storage is not ready yet." }, { status: 500 });
  }
  return NextResponse.json({ error: "Could not save your photo." }, { status: 500 });
}
