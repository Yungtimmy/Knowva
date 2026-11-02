import { z } from "zod";

export const tutorChatSchema = z.object({
  level: z.string().trim().min(1).max(20),
  subject: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(120),
  message: z.string().trim().min(2).max(2000),
  mode: z.enum(["explain", "simpler", "example", "diagram"]).optional(),
});

export const materialsSchema = z.object({
  subject: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(120),
  notes: z.string().trim().min(20).max(12000),
});

const questionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  answerIndex: z.number().int().nonnegative(),
  explanation: z.string().trim().min(1).max(800),
  subject: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(120),
  marks: z.number().int().positive().max(20).optional(),
});

export const scoreSchema = z
  .object({
    quizId: z.string().trim().min(1).max(80),
    subject: z.string().trim().min(1).max(60),
    topic: z.string().trim().min(1).max(120),
    questions: z.array(questionSchema).min(1).max(30),
    answers: z.array(z.number().int().nonnegative()).min(1).max(30),
  })
  .superRefine((value, ctx) => {
    if (value.answers.length !== value.questions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Send one answer index for each question.",
        path: ["answers"],
      });
    }
    value.questions.forEach((question, index) => {
      if (question.answerIndex >= question.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Answer key is outside the options.",
          path: ["questions", index, "answerIndex"],
        });
      }
      const selected = value.answers[index];
      if (selected !== undefined && selected >= question.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selected option does not exist.",
          path: ["answers", index],
        });
      }
    });
  });

export const recommendSchema = z
  .object({
    subject: z.string().trim().min(1).max(60),
    topic: z.string().trim().min(1).max(120),
    score: z.number().int().nonnegative(),
    total: z.number().int().positive().max(50),
    tutorHref: z.string().trim().max(200).optional(),
    quizHref: z.string().trim().max(200).optional(),
  })
  .refine((value) => value.score <= value.total, {
    message: "Score cannot be higher than the total.",
    path: ["score"],
  });

export const teacherGenerateSchema = z.object({
  kind: z.enum(["outline", "notes", "quiz", "marking_guide"]),
  level: z.string().trim().min(1).max(20),
  subject: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(160),
  classId: z.string().trim().min(1).max(40).optional(),
  minutes: z.number().int().min(10).max(120).optional(),
  prompt: z.string().trim().max(500).optional(),
  questionMix: z.string().trim().max(80).optional(),
});

export const signupSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(["student", "teacher"]),
});

export const modelTutorSchema = z.object({
  short: z.string().min(1).max(700),
  steps: z.array(z.string().min(1).max(400)).min(2).max(6),
  remember: z.string().min(1).max(240),
});

export const modelPackSchema = z.object({
  summary: z.array(z.string().min(1).max(300)).min(3).max(6),
  flashcards: z
    .array(z.object({ q: z.string().min(1).max(200), a: z.string().min(1).max(300) }))
    .min(3)
    .max(12),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1).max(400),
        options: z.array(z.string().min(1).max(200)).min(3).max(4),
        answerIndex: z.number().int().nonnegative(),
        explanation: z.string().min(1).max(400),
      }),
    )
    .min(3)
    .max(8),
});

export const modelOutlineSchema = z.object({
  objectives: z.array(z.string().min(1).max(240)).min(2).max(5),
  plan: z
    .array(
      z.object({
        stage: z.string().min(1).max(40),
        minutes: z.number().int().positive().max(60),
        text: z.string().min(1).max(400),
      }),
    )
    .min(3)
    .max(6),
  notes: z.string().min(1).max(1200),
  mistakes: z.array(z.string().min(1).max(240)).min(1).max(5),
});

export const modelQuizSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1).max(400),
        options: z.array(z.string().min(1).max(200)).length(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(1).max(400),
        marks: z.number().int().positive().max(10),
      }),
    )
    .min(2)
    .max(8),
  markingGuide: z
    .array(
      z.object({
        prompt: z.string().min(1).max(400),
        points: z
          .array(z.object({ text: z.string().min(1).max(240), marks: z.number().int().positive().max(10) }))
          .min(2)
          .max(6),
        notes: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(3),
  timeMinutes: z.number().int().min(5).max(90),
});
