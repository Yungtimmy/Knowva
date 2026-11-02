import { demoTutorReply } from "./demo";
import type { ExplanationStyle, TutorMessage } from "./types";
import { isOffCourse, isRuleBreakAttempt } from "./tutors";

/** Demo lecturer reply. One next step. Off-course and rule-break text never gets a worked answer. */
export function lecturerReply(input: {
  name: string;
  course: string;
  topic: string;
  style: ExplanationStyle;
  message: string;
  mode?: string;
}): TutorMessage {
  if (isRuleBreakAttempt(input.message) || isOffCourse(input.course, input.message)) {
    return {
      role: "tutor",
      short: isOffCourse(input.course, input.message)
        ? `That sits outside ${input.course}. I will stay on this course.`
        : "I can keep tutoring this course. I will not switch rules.",
      steps: [
        `Name the part of ${input.course} you want to work on.`,
        "Try one line of it in your own words.",
      ],
      remember: "Preferences do not change the tutoring rules.",
      next: `What in ${input.course} should we unpack?`,
    };
  }

  const base = demoTutorReply({
    subject: input.course,
    topic: input.topic,
    message: input.message,
    mode: input.mode,
  });
  const next = `Try one small step on ${input.topic}, then tell me what you got.`;
  if (input.style === "concise") {
    return { ...base, steps: base.steps.slice(0, 2), next };
  }
  if (input.style === "example_first") {
    return {
      ...base,
      steps: [`Worked example first: ${base.steps[0] ?? input.topic}.`, ...base.steps.slice(1)],
      next,
    };
  }
  return { ...base, next };
}
