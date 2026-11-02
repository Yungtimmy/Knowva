export type Role = "student" | "teacher";

/** Saved tutors per student. Creating a tutor stores a config. It does not train a model. */
export const TUTOR_CAP = 8;

export type ExplanationStyle = "step_by_step" | "example_first" | "concise";

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type LearningGoal = "pass_exam" | "understand_basics" | "practise_problems" | "revise_fast";

/** A course tutor is a saved system-prompt template plus preferences. */
export type Tutor = {
  id: string;
  name: string;
  course: string;
  /** "What do you want to learn?" Student preference text. Not a system override. */
  focus: string;
  level: LearningLevel;
  explanationStyle: ExplanationStyle;
  goals: LearningGoal[];
  createdAt: string;
  updatedAt: string;
};

export type ResourcePreference = "video" | "pdf" | "course" | "mixed";

export type ResourceType = "youtube" | "pdf" | "course" | "notes" | "practice";

export type ResourceConfidence = "high" | "med" | "low";

/** `verified` is true only after a server reachability check succeeded. */
export type ResourceItem = {
  title: string;
  type: ResourceType;
  url: string | null;
  searchQuery: string;
  why: string;
  confidence: ResourceConfidence;
  verified: boolean;
  role: "primary" | "alternate";
  source: string;
};

export type ResourceBundle = {
  subject: string;
  topic: string;
  preference: ResourcePreference;
  level: string;
  weakTopic: string | null;
  primary: ResourceItem[];
  alternates: ResourceItem[];
};

export type TestDifficulty = "easy" | "medium" | "hard";

/** Sent before submit. No answer key and no explanation. */
export type PublicQuestion = {
  id: string;
  prompt: string;
  options: string[];
  topic: string;
};

export type TopicBreakdown = {
  topic: string;
  correct: number;
  total: number;
  percent: number;
};

export type GradedItem = {
  questionId: string;
  prompt: string;
  options: string[];
  topic: string;
  selectedIndex: number | null;
  answerIndex: number;
  correct: boolean;
  explanation: string;
};

export type TestSummary = {
  id: string;
  course: string;
  status: "open" | "submitted";
  questionCount: number;
  difficulty: TestDifficulty;
  topics: string[];
  score: number | null;
  total: number | null;
  createdAt: string;
  submittedAt: string | null;
};

export type TestPaper = TestSummary & {
  questions: PublicQuestion[];
};

export type TestResult = {
  id: string;
  course: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  percent: number;
  topicBreakdown: TopicBreakdown[];
  weakTopics: TopicBreakdown[];
  items: GradedItem[];
  recommendations: Recommendation[];
  resources: ResourceBundle | null;
  submittedAt: string;
  tutorId: string | null;
};

export type ProgressTopic = {
  topic: string;
  course: string;
  percent: number;
  correct: number;
  total: number;
};

export type ProgressReport = {
  testsTaken: number;
  averagePercent: number | null;
  topics: ProgressTopic[];
  weakTopics: {
    topic: string;
    course: string;
    percent: number;
    tutorId: string | null;
    tutorName: string | null;
  }[];
  history: TestSummary[];
};

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
  /** One next step or check question. Tutor turns only. */
  next?: string;
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
  /** Section C outline. Present on packs from the materials API. */
  outline?: string[];
  keyTerms?: { term: string; meaning: string }[];
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
  /** Set when the card is a saved tutor rather than a sample desk card. */
  name?: string;
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
