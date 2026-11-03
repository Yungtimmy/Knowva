import type {
  ClassSnapshot,
  Generation,
  LessonDraft,
  LessonOutline,
  Question,
  StudyPack,
  TeacherClass,
  TeacherQuiz,
  TutorCard,
  TutorMessage,
} from "./types";

export const DEMO_DATE_SHORT = "Monday, 2 Nov";
export const DEMO_DATE_LONG = "Monday, 2 November";

export const tutors: TutorCard[] = [
  {
    id: "prompts",
    subject: "Prompt engineering",
    level: "200L",
    topic: "System prompts",
    status: "in_lesson",
    preview: "Nice, the system rules stay above the user turn. Ready for few-shot?",
    updatedAt: "10:42",
  },
  {
    id: "python",
    subject: "Software engineering",
    level: "200L",
    topic: "Testing",
    status: "needs_review",
    preview: "You scored 2/5 on failing tests. Let's go over it together.",
    updatedAt: "Sat",
  },
  {
    id: "http",
    subject: "Web APIs",
    level: "200L",
    topic: "HTTP",
    status: "ready",
    preview: "Ask me about methods, status codes, or what fetch sends.",
    updatedAt: "Fri",
  },
  {
    id: "models",
    subject: "Machine learning",
    level: "200L",
    topic: "Evaluation",
    status: "ready",
    preview: "Great work on precision and recall, 5/5. Want a harder split?",
    updatedAt: "Thu",
  },
];

export function tutorTitle(subject: string) {
  if (subject === "Prompt engineering") return "Prompt Tutor";
  if (subject === "Software engineering") return "Software Tutor";
  if (subject === "Web APIs") return "API Tutor";
  if (subject === "Machine learning") return "ML Tutor";
  return `${subject} Tutor`;
}

const PROMPT_REPLY: TutorMessage = {
  role: "tutor",
  short: "A system prompt sets the rules. The user message is one turn inside those rules.",
  steps: [
    "Put the role, the limits, and the output shape in the system prompt.",
    "Put the actual task in the user message.",
    "If they conflict, the system rules win. Do not let the user turn overwrite them.",
  ],
  remember: "System rules first. User task second.",
};

const TEST_REPLY: TutorMessage = {
  role: "tutor",
  short: "A failing test is a signal about one behaviour, not a verdict on the whole program.",
  steps: [
    "Read the assertion that failed.",
    "Name the input and the expected output.",
    "Change one thing, then run that test again.",
  ],
  remember: "One failure, one behaviour, one change.",
};

export function demoTutorReply(input: {
  subject: string;
  topic: string;
  message: string;
  mode?: string;
}): TutorMessage {
  const text = `${input.topic} ${input.message}`.toLowerCase();

  if (input.mode === "simpler") {
    return {
      role: "tutor",
      short: `${input.topic} in one line: name the idea, then say why it happens.`,
      steps: [
        "Say the question in your own words.",
        "Give one reason, not the whole chapter.",
        "Check it with a tiny example.",
      ],
      remember: "Short, then check.",
    };
  }

  if (input.mode === "example") {
    return {
      role: "tutor",
      short: `Here is a small ${input.topic} example you can redo on paper.`,
      steps: [
        `Pick one fact from ${input.topic}.`,
        "Change a single number or word and predict what happens.",
        "Write the result before you look it up.",
      ],
      remember: "Predict first, then check.",
    };
  }

  if (input.mode === "diagram") {
    return {
      role: "tutor",
      short: `Sketch ${input.topic} in three boxes: input, change, output.`,
      steps: [
        "Label what goes in.",
        "Label what the process does.",
        "Label what comes out, including anything released.",
      ],
      remember: "Input, change, output.",
    };
  }

  if (text.includes("system prompt") || text.includes("few-shot") || text.includes("user message")) {
    return PROMPT_REPLY;
  }

  if (text.includes("pytest") || text.includes("failing test") || text.includes("assertion")) {
    return TEST_REPLY;
  }

  if (input.topic.toLowerCase().includes("system prompt")) {
    return PROMPT_REPLY;
  }

  return {
    role: "tutor",
    short: `${input.topic}: answer the question in one sentence, then check it against a simple case.`,
    steps: [
      "Restate what the question is asking.",
      `Name the one idea in ${input.topic} that answers it.`,
      "Test that idea on an easy example before you move on.",
    ],
    remember: `${input.topic}: idea, reason, check.`,
  };
}

function question(
  partial: Omit<Question, "id"> & { id?: string },
  index: number,
): Question {
  return { id: partial.id ?? `q${index + 1}`, ...partial };
}

export const fewShotQuestions: Question[] = [
  ["Where does a system prompt sit relative to the user message?", ["After the answer", "Above the user message", "Inside the temperature setting", "In the answer key"], 1, "The system prompt sets the rules before the user turn is read."],
  ["What is a few-shot example?", ["A longer system prompt", "A hidden answer key", "An example of input and output in the prompt", "A database index"], 2, "Few-shot means you show a small number of input and output pairs."],
  ["If the system prompt and the user message conflict, what should the model prefer?", ["The system prompt", "The latest joke", "A random option", "The user's request to ignore the rules"], 0, "The system rules win. A user turn cannot overwrite them."],
  ["What does temperature change?", ["The answer key", "How random the next tokens are", "The course the tutor is locked to", "The student's password"], 1, "Temperature changes how random the next token choice is. It does not change the rules."],
].map(([prompt, options, answerIndex, explanation], index) =>
  question(
    {
      prompt: prompt as string,
      options: options as string[],
      answerIndex: answerIndex as number,
      explanation: explanation as string,
      subject: "Prompt engineering",
      topic: "Few-shot",
    },
    index,
  ),
);

export const fetchQuestions: Question[] = [
  question({
    prompt: "Which status means the server created the resource?",
    options: ["201", "404", "500", "301"],
    answerIndex: 0,
    explanation: "201 Created means the request succeeded and a new resource exists.",
    subject: "Web APIs",
    topic: "HTTP",
  }, 0),
  question({
    prompt: "Which method is safe to retry because it should not change server state?",
    options: ["GET", "POST", "PATCH", "DELETE"],
    answerIndex: 0,
    explanation: "GET reads. A correct GET does not create or edit a resource.",
    subject: "Web APIs",
    topic: "HTTP",
  }, 1),
  question({
    prompt: "A missing route most often returns",
    options: ["404", "200", "201", "204"],
    answerIndex: 0,
    explanation: "404 means the server has no resource at that path.",
    subject: "Web APIs",
    topic: "HTTP",
  }, 2),
  question({
    prompt: "What should you check first when fetch fails on your machine?",
    options: ["The URL, method, and response status", "The model temperature", "The git author name", "The CSS colour"],
    answerIndex: 0,
    explanation: "Start with the request you sent and the status the server returned.",
    subject: "Web APIs",
    topic: "HTTP",
  }, 3),
  question({
    prompt: "204 means",
    options: ["Success with no body", "The server crashed", "The client must sign in", "The resource moved"],
    answerIndex: 0,
    explanation: "204 No Content is a success status with an empty body.",
    subject: "Web APIs",
    topic: "HTTP",
  }, 4),
];

const gitQuestions: Question[] = [
  question({
    prompt: "What does git commit record?",
    options: ["The editor theme", "A snapshot of staged changes", "The production password", "A CSS colour"],
    answerIndex: 1,
    explanation: "A commit stores the staged snapshot, with a message about why it changed.",
    subject: "Software engineering",
    topic: "Git",
  }, 0),
  question({
    prompt: "What does git status show?",
    options: ["The model temperature", "Which files are staged, changed, or untracked", "The HTTP status code", "The exam timetable"],
    answerIndex: 1,
    explanation: "git status lists the working tree against the last commit.",
    subject: "Software engineering",
    topic: "Git",
  }, 1),
  question({
    prompt: "Which command moves a file into the next commit?",
    options: ["git add", "git log", "git clone", "git blame"],
    answerIndex: 0,
    explanation: "git add stages the file. The commit comes after that.",
    subject: "Software engineering",
    topic: "Git",
  }, 2),
  question({
    prompt: "A useful commit message names",
    options: ["The change and why", "Every file in the repo", "Your password", "The lecture hall"],
    answerIndex: 0,
    explanation: "Say what changed and why. The diff already lists the lines.",
    subject: "Software engineering",
    topic: "Git",
  }, 3),
  question({
    prompt: "git log shows",
    options: ["Commit history", "Only untracked files", "The system prompt", "Open pull requests on every host"],
    answerIndex: 0,
    explanation: "git log walks the commits on the current branch.",
    subject: "Software engineering",
    topic: "Git",
  }, 4),
];

export const samplePack: StudyPack = {
  id: "git-basics",
  subject: "Software engineering",
  topic: "Git",
  summary: [
    "Git stores snapshots of your project, not just the latest files.",
    "git add stages a change. git commit records that snapshot with a message.",
    "git status shows what is staged, changed, or untracked.",
    "git log shows the history of commits on this branch.",
  ],
  flashcards: [
    { q: "What does git commit record?", a: "A snapshot of the staged changes, plus a message." },
    { q: "What does git status show?", a: "Files that are staged, changed, or untracked." },
    { q: "Which command stages a file?", a: "git add. The commit comes after that." },
    { q: "What belongs in a commit message?", a: "What changed, and why." },
  ],
  questions: gitQuestions,
};

export const quizzes: Record<string, { id: string; subject: string; topic: string; questions: Question[] }> = {
  "few-shot": {
    id: "few-shot",
    subject: "Prompt engineering",
    topic: "Few-shot",
    questions: fewShotQuestions,
  },
  fetch: {
    id: "fetch",
    subject: "Web APIs",
    topic: "HTTP",
    questions: fetchQuestions,
  },
  "git-basics": {
    id: "git-basics",
    subject: "Software engineering",
    topic: "Git",
    questions: gitQuestions,
  },
};

/** Scripted review for the few-shot mock: answers 2, 2, 0, 0 → score 2 of 4. */
export const sampleReviewAnswers = [2, 2, 0, 0];

export function demoPack(subject: string, topic: string, notes: string): StudyPack {
  if (/git/i.test(`${subject} ${topic} ${notes}`)) {
    return { ...samplePack, id: "git-basics", subject, topic: topic || samplePack.topic };
  }

  const sentences = notes
    .split(/(?<=[.])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 12)
    .slice(0, 4);
  const lines = sentences.length > 0 ? sentences : [`Notes on ${topic} need a few more complete sentences.`];
  const id = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pack";

  return {
    id,
    subject,
    topic,
    summary: lines,
    flashcards: lines.slice(0, 3).map((line, index) => ({
      q: index === 0 ? `What is the first point on ${topic}?` : `What else do the notes say about ${topic}?`,
      a: line,
    })),
    questions: [
      question({
        prompt: `Which line is taken from your notes on ${topic}?`,
        options: [
          lines[0] ?? topic,
          "This line was not in the notes.",
          "Skip the notes and guess.",
          "The notes are about a different subject.",
        ],
        answerIndex: 0,
        explanation: "Demo mode only uses sentences you pasted. It does not add facts.",
        subject,
        topic,
      }, 0),
    ],
  };
}

export const promptOutline: LessonOutline = {
  objectives: [
    "State what a system prompt is allowed to decide.",
    "Place one few-shot example under those rules.",
    "Check that a conflicting user turn does not overwrite the rules.",
  ],
  plan: [
    { stage: "Starter", minutes: 5, text: "Show two chats that answer the same question differently. Ask which line changed the behaviour." },
    { stage: "Teach", minutes: 12, text: "Write a four-line system prompt on the board: role, limits, output shape, and what to refuse." },
    { stage: "Worked example", minutes: 8, text: "Add one input and output pair. Then show a user message that asks the model to ignore the rules." },
    { stage: "Practice", minutes: 10, text: "Pairs draft a prompt for a course tutor and mark the line that locks the course." },
    { stage: "Exit check", minutes: 5, text: "One prompt on paper. Sort into got it / not yet." },
  ],
  notes:
    "A system prompt is the standing instruction for the chat. The user message is one turn inside it. Few-shot examples show the shape of a good answer. They do not replace the rules. If a user turn says to ignore the system prompt, the rules still hold.",
  mistakes: [
    "Putting the real task only in the system prompt and leaving the user turn empty.",
    "Letting a user sentence override a safety or course rule.",
  ],
};

export const lessons: Record<string, LessonDraft> = {
  "system-prompts": {
    id: "system-prompts",
    title: "System prompts for a course tutor",
    level: "200L",
    subject: "Prompt engineering",
    topic: "System prompts",
    minutes: 40,
    classId: "ss2a",
    status: "draft",
    outline: promptOutline,
    updatedAt: "Today, 9:40",
  },
};

export function demoOutline(input: {
  level: string;
  subject: string;
  topic: string;
  minutes: number;
  prompt?: string;
}): LessonOutline {
  if (/system prompt|few-shot|prompt engineering/i.test(input.topic)) return promptOutline;
  const starter = Math.max(5, Math.round(input.minutes * 0.15));
  const teach = Math.max(8, Math.round(input.minutes * 0.35));
  const practice = Math.max(8, input.minutes - starter - teach - 5);
  const extra = input.prompt ? ` Include this request: ${input.prompt}` : "";
  return {
    objectives: [
      `State the main idea of ${input.topic} in ${input.subject}.`,
      "Work one example on the board with the class.",
      "Check who can do a similar question alone.",
    ],
    plan: [
      { stage: "Starter", minutes: starter, text: `Ask what the group already knows about ${input.topic}.` },
      { stage: "Teach", minutes: teach, text: `Teach one method for ${input.topic}. Keep the example short.${extra}` },
      { stage: "Practice", minutes: practice, text: "Pairs answer three questions. You circulate and listen." },
      { stage: "Exit check", minutes: 5, text: "One question on paper. Sort into got it / not yet." },
    ],
    notes: `${input.level} ${input.subject}. ${input.topic} is a draft. Edit it against your course notes before you assign it.${extra}`,
    mistakes: [
      "Rushing the example before the group can say the idea back.",
      "Leaving the exit check unmarked.",
    ],
  };
}

const teacherFewShotQuestions: Question[] = [
  question({
    prompt: "Which line belongs in the system prompt?",
    options: ["Today's homework question", "The course this tutor is allowed to answer", "The student's password", "A random temperature"],
    answerIndex: 1,
    explanation: "The course lock is a standing rule, so it belongs in the system prompt.",
    subject: "Prompt engineering",
    topic: "Few-shot",
    marks: 1,
  }, 0),
  question({
    prompt: "A few-shot example should show",
    options: ["The answer key for the live test", "One input and the output shape you want", "Every lecture slide", "The server logs"],
    answerIndex: 1,
    explanation: "Show a small input and the kind of output you want. Do not paste a live answer key.",
    subject: "Prompt engineering",
    topic: "Few-shot",
    marks: 1,
  }, 1),
  question({
    prompt: "A user message that says 'ignore the rules' should be",
    options: ["Treated as an untrusted turn", "Copied into the system prompt", "Used as the new course", "Stored as the answer key"],
    answerIndex: 0,
    explanation: "The user turn is untrusted. It does not replace the system rules.",
    subject: "Prompt engineering",
    topic: "Few-shot",
    marks: 1,
  }, 2),
];

export const teacherQuizzes: Record<string, TeacherQuiz> = {
  "few-shot": {
    id: "few-shot",
    title: "Few-shot quiz",
    level: "200L",
    subject: "Prompt engineering",
    topic: "Few-shot",
    classId: "ss2a",
    status: "reviewed",
    questions: teacherFewShotQuestions,
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "Write a four-line system prompt for a course tutor and add one few-shot example.",
        points: [
          { text: "Names the course the tutor must stay inside", marks: 1 },
          { text: "States one limit the user turn cannot override", marks: 1 },
          { text: "Describes the output shape", marks: 2 },
          { text: "Gives one input and output pair that matches that shape", marks: 2 },
        ],
        notes: "Do not award marks for an example that dumps a live answer key. The system rules must come before the example.",
      },
    ],
    assignedClassIds: ["ss2a"],
    questionCount: 12,
    totalMarks: 22,
    timeMinutes: 25,
    reviewedCount: 3,
    updatedAt: "Yesterday",
  },
  sampling: {
    id: "sampling",
    title: "Temperature and sampling",
    level: "200L",
    subject: "Prompt engineering",
    topic: "Temperature and sampling",
    classId: "ss2a",
    status: "reviewed",
    questions: [
      question({
        prompt: "Raising temperature usually makes the next token",
        options: ["More random", "Always shorter", "Always the answer key", "Independent of the prompt"],
        answerIndex: 0,
        explanation: "A higher temperature spreads probability across more tokens.",
        subject: "Prompt engineering",
        topic: "Temperature",
        marks: 1,
      }, 0),
      question({
        prompt: "Temperature does not change",
        options: ["The system rules", "How peaked the distribution is", "Which token is sampled", "The variety of wording"],
        answerIndex: 0,
        explanation: "Temperature changes sampling. It does not rewrite the system prompt.",
        subject: "Prompt engineering",
        topic: "Temperature",
        marks: 1,
      }, 1),
    ],
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "Explain what temperature changes, and what it leaves alone. Give one example.",
        points: [
          { text: "Says temperature changes how random the next token is", marks: 1 },
          { text: "Says the system rules stay in place", marks: 1 },
        ],
        notes: "Accept a short example that contrasts a low and a high temperature on the same prompt.",
      },
    ],
    assignedClassIds: ["ss2a"],
    questionCount: 2,
    totalMarks: 4,
    timeMinutes: 15,
    reviewedCount: 2,
    updatedAt: "Thu",
  },
  "status-codes": {
    id: "status-codes",
    title: "HTTP status codes paper",
    level: "300L",
    subject: "Web APIs",
    topic: "HTTP status codes",
    classId: "ss3a",
    status: "draft",
    questions: [
      question({
        prompt: "A client posts a new note and the server stores it. Which status fits?",
        options: ["200", "201", "404", "500"],
        answerIndex: 1,
        explanation: "201 Created is the status for a successful create.",
        subject: "Web APIs",
        topic: "HTTP status codes",
        marks: 1,
      }, 0),
    ],
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "A fetch call returns 404. State what that means and name one check you would make.",
        points: [
          { text: "Says the path does not match a resource", marks: 2 },
          { text: "Names a check: the URL, the method, or the route", marks: 1 },
          { text: "Does not treat 404 as a server crash", marks: 2 },
        ],
        notes: "A 500 is the crash. A 404 is a missing route or id. Do not award the last point if those are swapped.",
      },
    ],
    assignedClassIds: [],
    questionCount: 1,
    totalMarks: 6,
    timeMinutes: 20,
    reviewedCount: 0,
    updatedAt: "Fri",
  },
};

export function demoTeacherQuiz(input: {
  level: string;
  subject: string;
  topic: string;
  prompt?: string;
}): Pick<TeacherQuiz, "questions" | "markingGuide" | "timeMinutes" | "totalMarks" | "questionCount" | "reviewedCount"> {
  if (/few-shot|system prompt/i.test(input.topic)) {
    const sample = teacherQuizzes["few-shot"];
    if (!sample) throw new Error("Missing few-shot sample");
    return sample;
  }
  const note = input.prompt ? ` ${input.prompt}` : "";
  const questions: Question[] = [
    question({
      prompt: `Which statement best matches ${input.topic}?`,
      options: [
        `It is a core idea in ${input.subject}.`,
        "It belongs to a different subject.",
        "It cannot be tested.",
        "It has no definition.",
      ],
      answerIndex: 0,
      explanation: `Edit this key before you assign it. Demo mode only sketches ${input.topic}.${note}`,
      subject: input.subject,
      topic: input.topic,
      marks: 1,
    }, 0),
    question({
      prompt: `A fair first check for ${input.level} on ${input.topic} is to ask students to`,
      options: [
        "Explain the idea in their own words",
        "Skip the topic",
        "Memorise a page number",
        "Leave the answer blank",
      ],
      answerIndex: 0,
      explanation: "Use this slot for a real question from your course notes.",
      subject: input.subject,
      topic: input.topic,
      marks: 1,
    }, 1),
  ];
  return {
    questions,
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: `Explain ${input.topic} and give one example.`,
        points: [
          { text: "States the idea correctly", marks: 2 },
          { text: "Gives a relevant example", marks: 2 },
          { text: "Uses the right units or terms", marks: 1 },
        ],
        notes: `Check this mark scheme against your course notes before you assign it.${note}`,
      },
    ],
    timeMinutes: 20,
    totalMarks: 7,
    questionCount: 3,
    reviewedCount: 0,
  };
}

export const classes: TeacherClass[] = [
  { id: "ss2a", name: "CSC 201 A", level: "200L", subject: "Prompt engineering", studentCount: 34 },
  { id: "ss2b", name: "CSC 201 B", level: "200L", subject: "Prompt engineering", studentCount: 31 },
  { id: "ss1a", name: "CSC 101 A", level: "100L", subject: "Software engineering", studentCount: 36 },
  { id: "ss3a", name: "CSC 301 A", level: "300L", subject: "Web APIs", studentCount: 28 },
];

export const generations: Generation[] = [
  { id: "system-prompts", type: "lesson", title: "System prompts for a course tutor", classId: "ss2a", status: "draft", updatedAt: "Today, 9:40" },
  { id: "few-shot", type: "quiz", title: "Few-shot examples — 12 questions", classId: "ss2a", status: "reviewed", updatedAt: "Yesterday" },
  { id: "status-codes", type: "marking_guide", title: "HTTP status codes paper", classId: "ss3a", status: "draft", updatedAt: "Fri" },
  { id: "sampling", type: "quiz", title: "Temperature and sampling", classId: "ss2a", status: "reviewed", updatedAt: "Thu" },
];

export const classSnapshots: Record<string, ClassSnapshot> = {
  ss2a: {
    classId: "ss2a",
    quizzesTaken: 142,
    classAverage: 63,
    topics: [
      { topic: "Few-shot examples", avg: 48, attempts: 31 },
      { topic: "Temperature", avg: 54, attempts: 28 },
      { topic: "System prompts", avg: 66, attempts: 34 },
      { topic: "Output shape", avg: 72, attempts: 33 },
      { topic: "Course lock", avg: 81, attempts: 30 },
    ],
    missed: [
      { prompt: "Put one input and output pair under the system rules", topic: "Few-shot examples", wrongPct: 71 },
      { prompt: "Say what temperature changes and what it leaves alone", topic: "Temperature", wrongPct: 58 },
      { prompt: "Name the line that locks the tutor to one course", topic: "System prompts", wrongPct: 44 },
    ],
    supportCount: 6,
  },
  ss2b: {
    classId: "ss2b",
    quizzesTaken: 88,
    classAverage: 71,
    topics: [
      { topic: "Output shape", avg: 76, attempts: 29 },
      { topic: "Course lock", avg: 69, attempts: 27 },
      { topic: "Temperature", avg: 58, attempts: 24 },
    ],
    missed: [
      { prompt: "Say what temperature changes and what it leaves alone", topic: "Temperature", wrongPct: 49 },
    ],
    supportCount: 3,
  },
  ss1a: {
    classId: "ss1a",
    quizzesTaken: 64,
    classAverage: 67,
    topics: [
      { topic: "Git commits", avg: 71, attempts: 30 },
      { topic: "Testing", avg: 64, attempts: 28 },
      { topic: "Branches", avg: 52, attempts: 22 },
    ],
    missed: [
      { prompt: "Name the command that stages a file", topic: "Git commits", wrongPct: 38 },
    ],
    supportCount: 4,
  },
  ss3a: {
    classId: "ss3a",
    quizzesTaken: 41,
    classAverage: 74,
    topics: [
      { topic: "HTTP status codes", avg: 77, attempts: 26 },
      { topic: "Fetch", avg: 69, attempts: 21 },
    ],
    missed: [
      { prompt: "State what 404 means", topic: "HTTP status codes", wrongPct: 22 },
    ],
    supportCount: 2,
  },
};

export function generationHref(item: Generation) {
  if (item.type === "lesson" || item.type === "notes") return `/teacher/lesson/${item.id}`;
  if (item.type === "marking_guide") return `/teacher/quiz/${item.id}?tab=marking`;
  return `/teacher/quiz/${item.id}`;
}

export function classLabel(classId: string) {
  const found = classes.find((item) => item.id === classId);
  if (!found) return classId;
  const subject =
    found.subject === "Prompt engineering"
      ? "Prompts"
      : found.subject === "Software engineering"
        ? "Software"
        : found.subject === "Machine learning"
          ? "ML"
          : found.subject;
  return `${found.name} · ${subject}`;
}
