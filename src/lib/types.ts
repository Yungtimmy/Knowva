export type Role = "student" | "teacher";

export type Subject = {
  name: string;
  topics: { name: string; progress: number }[];
};

/** `role` is "user" for the learner and "tutor" for Knowva. User turns leave steps and remember empty. */
export type TutorMessage = {
  role: "user" | "tutor";
  short: string;
  steps: string[];
  remember: string;
};

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  subject: string;
  topic: string;
  /** Present on teacher-authored items. Omitted on student practice questions. */
  marks?: number;
};

export type StudyPack = {
  id: string;
  subject: string;
  topic: string;
  summary: string[];
  flashcards: { q: string; a: string }[];
  questions: Question[];
};

/** `missed` holds indexes into the quiz's question list. `total` is the question count. */
export type Attempt = {
  quizId: string;
  score: number;
  total: number;
  missed: number[];
};

export type TutorStatus = "ready" | "needs_review" | "in_lesson";

/** Home v2 card. One subject tutor on the stacked desk. */
export type TutorCard = {
  id: string;
  subject: string;
  level: string;
  topic: string;
  status: TutorStatus;
  preview: string;
  updatedAt: string;
};

export type TeacherClass = {
  id: string;
  name: string;
  level: string;
  subject: string;
  studentCount: number;
};

export type GenerationType = "lesson" | "quiz" | "marking_guide" | "notes";

/** `draft` is shown as "Needs review". Assigning requires `reviewed`. */
export type GenerationStatus = "draft" | "reviewed";

export type Generation = {
  id: string;
  type: GenerationType;
  title: string;
  classId: string;
  status: GenerationStatus;
  updatedAt: string;
};

export type LessonOutline = {
  objectives: string[];
  plan: { stage: string; minutes: number; text: string }[];
  notes: string;
  mistakes: string[];
};

export type LessonDraft = {
  id: string;
  title: string;
  level: string;
  subject: string;
  topic: string;
  minutes: number;
  classId: string;
  status: GenerationStatus;
  outline: LessonOutline;
  updatedAt: string;
};

export type MarkPoint = { text: string; marks: number };

export type TeacherQuiz = {
  id: string;
  title: string;
  level: string;
  subject: string;
  topic: string;
  classId: string;
  status: GenerationStatus;
  questions: Question[];
  markingGuide: {
    questionId: string;
    prompt: string;
    points: MarkPoint[];
    notes: string;
  }[];
  assignedClassIds: string[];
  /** Sample screens can show a planned paper size that is larger than the drafted questions. */
  questionCount: number;
  totalMarks: number;
  timeMinutes: number;
  reviewedCount: number;
  updatedAt: string;
};

/** Gap is below 60. Watch is 60–69. On track is 70 and above. */
export type TopicStatStatus = "gap" | "watch" | "on_track";

export type TopicStat = {
  topic: string;
  avg: number;
  attempts: number;
  status: TopicStatStatus;
};

export type Recommendation = {
  action: "review" | "practice" | "stretch";
  title: string;
  detail: string;
  href: string;
};

export type ClassSnapshot = {
  classId: string;
  quizzesTaken: number;
  classAverage: number;
  topics: { topic: string; avg: number; attempts: number }[];
  missed: { prompt: string; topic: string; wrongPct: number }[];
  supportCount: number;
};
