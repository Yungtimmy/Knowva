import type { Attempt, Question } from "./types";

/** Score against the answer key. The client never sends the score. */
export function scoreQuiz(
  quizId: string,
  questions: Question[],
  answers: number[],
): Attempt {
  const missed: number[] = [];
  let score = 0;
  questions.forEach((question, index) => {
    if (answers[index] === question.answerIndex) score += 1;
    else missed.push(index);
  });
  return { quizId, score, total: questions.length, missed };
}
