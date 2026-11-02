import { NextResponse } from "next/server";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { resolveOwner } from "@/lib/owner";
import { assembleResources, verifyBundle } from "@/lib/resources";
import { modelTutorSchema, tutorChatSchema } from "@/lib/schemas";
import { hasOpenTest, listMaterials } from "@/lib/test-repo";
import { lecturerReply } from "@/lib/tutor-reply";
import { getTutor } from "@/lib/tutor-repo";
import {
  assertSameCourse,
  buildTutorInstructions,
  buildTutorPrompt,
  detectResourcePreference,
  isOffCourse,
  isRuleBreakAttempt,
  notesForCourse,
} from "@/lib/tutors";
import type { ExplanationStyle, LearningLevel, Tutor, TutorMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = parseBody(tutorChatSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const owner = await resolveOwner();

  if (await hasOpenTest(owner.id)) {
    return NextResponse.json(
      { error: "Tutor chat is locked until you submit the test.", locked: true },
      { status: 423 },
    );
  }

  let tutor: Tutor | null = null;
  if (input.tutorId) {
    tutor = await getTutor(owner, input.tutorId);
    if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
    const same = assertSameCourse(tutor.course, input.subject);
    if (!same.ok) return NextResponse.json({ error: same.error }, { status: 400 });
  }

  const course = tutor?.course ?? input.subject ?? "";
  const topic = input.topic?.trim() || tutor?.focus || course;
  const level: LearningLevel = tutor?.level ?? "intermediate";
  const style: ExplanationStyle = tutor?.explanationStyle ?? "step_by_step";
  const name = tutor?.name ?? `${course} Tutor`;
  const active: Tutor = tutor ?? {
    id: "session",
    name,
    course,
    focus: topic,
    level,
    explanationStyle: style,
    goals: [],
    createdAt: "",
    updatedAt: "",
  };

  const packs = await listMaterials(owner.id);
  const notes = notesForCourse(packs, course);
  const preference = detectResourcePreference(input.message);
  let resources = preference
    ? assembleResources({ subject: course, topic, level, preference })
    : null;
  if (resources) {
    try {
      resources = await verifyBundle(resources);
    } catch {
      resources = { ...resources };
    }
  }

  const guarded = isOffCourse(course, input.message) || isRuleBreakAttempt(input.message);
  const replyInput = { name, course, topic, style, message: input.message, mode: input.mode };

  if (!llmConfigured() || guarded) {
    const message = lecturerReply(replyInput);
    const body = { message, resources, course, tutorId: tutor?.id ?? null, guarded };
    if (!llmConfigured()) return demoPayload(body);
    return NextResponse.json({ demo: false, ...body });
  }

  try {
    const output = await generateStructured(
      modelTutorSchema,
      buildTutorPrompt({
        course,
        topic,
        message: input.message,
        mode: input.mode,
        notes,
        schoolLevel: input.level,
      }),
      buildTutorInstructions(active),
    );
    const message: TutorMessage = {
      role: "tutor",
      short: output.short,
      steps: output.steps,
      remember: output.remember,
      next: output.next ?? output.remember,
    };
    return NextResponse.json({
      demo: false,
      message,
      resources,
      course,
      tutorId: tutor?.id ?? null,
      guarded: false,
    });
  } catch {
    return modelFailed();
  }
}
