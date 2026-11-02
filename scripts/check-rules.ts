import assert from "node:assert/strict";
import { canAssign } from "../src/lib/assign.ts";
import { topicStatus } from "../src/lib/gap.ts";
import { recommend } from "../src/lib/recommend.ts";
import { scoreQuiz } from "../src/lib/score.ts";
import type { Question } from "../src/lib/types.ts";

assert.equal(topicStatus(48), "gap");
assert.equal(topicStatus(59.9), "gap");
assert.equal(topicStatus(60), "watch");
assert.equal(topicStatus(66), "watch");
assert.equal(topicStatus(70), "on_track");
assert.equal(topicStatus(72), "on_track");
assert.equal(topicStatus(81), "on_track");

const questions: Question[] = [
  {
    id: "1",
    prompt: "Where?",
    options: ["Root hairs", "Chloroplasts", "Stomata", "Xylem"],
    answerIndex: 1,
    explanation: "Chloroplasts.",
    subject: "Biology",
    topic: "Photosynthesis",
  },
  {
    id: "2",
    prompt: "Gas?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    answerIndex: 2,
    explanation: "Carbon dioxide.",
    subject: "Biology",
    topic: "Photosynthesis",
  },
];

assert.deepEqual(scoreQuiz("photosynthesis", questions, [1, 2]), {
  quizId: "photosynthesis",
  score: 2,
  total: 2,
  missed: [],
});
assert.deepEqual(scoreQuiz("photosynthesis", questions, [2, 2]).missed, [0]);

assert.equal(recommend({ subject: "Biology", topic: "Photosynthesis", score: 2, total: 4 }).action, "review");
assert.equal(recommend({ subject: "Mathematics", topic: "Quadratics", score: 3, total: 5 }).action, "practice");
assert.equal(recommend({ subject: "English", topic: "Comprehension", score: 4, total: 5 }).action, "stretch");

assert.equal(canAssign("draft").ok, false);
assert.equal(canAssign("reviewed").ok, true);

console.log("rules ok");
