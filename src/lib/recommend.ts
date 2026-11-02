import type { Recommendation } from "./types";

type Input = {
  subject: string;
  topic: string;
  score: number;
  total: number;
  tutorHref?: string;
  quizHref?: string;
};

/**
 * Rules on one quiz only.
 * Below 60% → review with the tutor.
 * 60–79% → more practice.
 * 80% and above → a harder set.
 * Copy always says a single score is not a measure of ability.
 */
export function recommend(input: Input): Recommendation {
  const ratio = input.total <= 0 ? 0 : input.score / input.total;
  const note = "One quiz is a signal, not a measure of ability.";
  const tutorHref = input.tutorHref ?? "/student/tutor";
  const quizHref = input.quizHref ?? "/student";

  if (ratio < 0.6) {
    return {
      action: "review",
      title: `Revise ${input.topic}`,
      detail: `You scored ${input.score} of ${input.total}. Go over it with your ${input.subject} tutor, then try a shorter set. ${note}`,
      href: tutorHref,
    };
  }
  if (ratio < 0.8) {
    return {
      action: "practice",
      title: `Practise ${input.topic} again`,
      detail: `You scored ${input.score} of ${input.total}. One more short quiz will show what stuck. ${note}`,
      href: quizHref,
    };
  }
  return {
    action: "stretch",
    title: `Try a harder ${input.topic} set`,
    detail: `You scored ${input.score} of ${input.total}. Move to a harder question or the next topic when you are ready. ${note}`,
    href: tutorHref,
  };
}
