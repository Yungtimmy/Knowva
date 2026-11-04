import { NextResponse } from "next/server";
import { appendTutorMessages } from "@/lib/chat-repo";
import {
  asStoredMessage,
  attachmentsFromResources,
  attachmentsFromText,
  mergeAttachments,
  messageBody,
} from "@/lib/chat-thread";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { mascotColorFor } from "@/lib/mascot-color";
import { resolveOwner } from "@/lib/owner";
import { assembleResources, verifyBundle } from "@/lib/resources";
import { modelTutorSchema, tutorChatSchema } from "@/lib/schemas";
import { hasOpenTest, listMaterials, TestStoreError } from "@/lib/test-repo";
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

  try {
    if (await hasOpenTest(owner)) {
      return NextResponse.json(
        { error: "Tutor chat is locked until you submit the test.", locked: true },
        { status: 423 },
      );
    }
  } catch (error) {
    if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
    console.error("POST /api/tutor/chat open test", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not check the open test." }, { status: 500 });
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
    mascotColor: mascotColorFor(course, "session"),
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

  async function deliver(message: TutorMessage, flags: { guarded: boolean; demo: boolean }) {
    const sentAt = Date.now();
    const tutorTurn = asStoredMessage(
      { ...message, createdAt: new Date(sentAt + 1).toISOString() },
      {
        attachments: mergeAttachments(
          attachmentsFromResources(resources),
          attachmentsFromText(messageBody(message)),
        ),
      },
    );
    let messages: TutorMessage[] | undefined;
    if (tutor) {
      const userTurn = asStoredMessage({
        role: "user",
        short: input.message,
        steps: [],
        remember: "",
        createdAt: new Date(sentAt).toISOString(),
        attachments: attachmentsFromText(input.message),
      });
      try {
        messages = await appendTutorMessages(owner, tutor.id, [userTurn, tutorTurn]);
      } catch (error) {
        console.error("POST /api/tutor/chat persist", error instanceof Error ? error.name : "error");
        return NextResponse.json({ error: "Could not save this chat." }, { status: 500 });
      }
    }
    const savedTutor = messages?.[messages.length - 1] ?? tutorTurn;
    const body = {
      message: savedTutor,
      messages,
      resources,
      course,
      tutorId: tutor?.id ?? null,
      guarded: flags.guarded,
    };
    if (flags.demo) return demoPayload(body);
    return NextResponse.json({ demo: false, ...body });
  }

  if (!llmConfigured() || guarded) {
    return deliver(lecturerReply(replyInput), { guarded, demo: !llmConfigured() });
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
    return deliver(
      {
        role: "tutor",
        short: output.short,
        steps: output.steps,
        remember: output.remember,
        next: output.next ?? output.remember,
      },
      { guarded: false, demo: false },
    );
  } catch {
    return modelFailed();
  }
}
