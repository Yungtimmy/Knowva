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
    id: "maths",
    subject: "Mathematics",
    level: "SS2",
    topic: "Quadratics",
    status: "in_lesson",
    preview: "Nice, step 3 of completing the square is right. Ready for the next one?",
    updatedAt: "10:42",
  },
  {
    id: "biology",
    subject: "Biology",
    level: "SS2",
    topic: "Photosynthesis",
    status: "needs_review",
    preview: "You scored 2/5 on light reactions. Let's go over it together.",
    updatedAt: "Sat",
  },
  {
    id: "physics",
    subject: "Physics",
    level: "SS2",
    topic: "Motion",
    status: "ready",
    preview: "Ask me about speed, velocity or Newton's laws.",
    updatedAt: "Fri",
  },
  {
    id: "english",
    subject: "English",
    level: "SS2",
    topic: "Comprehension",
    status: "ready",
    preview: "Great work on reading for meaning, 5/5. Want a harder passage?",
    updatedAt: "Thu",
  },
];

export function tutorTitle(subject: string) {
  if (subject === "Mathematics") return "Maths Tutor";
  return `${subject} Tutor`;
}

const PHOTOSYNTHESIS_REPLY: TutorMessage = {
  role: "tutor",
  short: "Light gives the plant the energy to turn water and carbon dioxide into glucose.",
  steps: [
    "Chlorophyll in the leaf traps light.",
    "That energy splits water, releasing oxygen.",
    "The plant uses the stored energy to build glucose from carbon dioxide.",
  ],
  remember: "Light in, sugar made, oxygen out.",
};

const QUADRATIC_REPLY: TutorMessage = {
  role: "tutor",
  short:
    "A quadratic curve can cross the x-axis in two places. The ± gives you both: one answer adds the square root, the other subtracts it. Want to try one?",
  steps: [
    "Start from ax² + bx + c = 0.",
    "The formula is x = (−b ± √(b² − 4ac)) / 2a.",
    "The plus sign is one crossing. The minus sign is the other.",
  ],
  remember: "± means two possible roots, not a typo.",
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

  if (text.includes("quadratic") && (text.includes("±") || text.includes("formula") || text.includes("plus"))) {
    return QUADRATIC_REPLY;
  }

  if (text.includes("light") || text.includes("photosynthesis") || text.includes("food")) {
    return PHOTOSYNTHESIS_REPLY;
  }

  if (input.topic.toLowerCase().includes("quadratic")) {
    return QUADRATIC_REPLY;
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

export const photosynthesisQuestions: Question[] = [
  ["Where in the leaf does photosynthesis mostly happen?", ["Root hairs", "Chloroplasts", "Stomata", "Xylem"], 1, "Chloroplasts hold chlorophyll, which traps the light energy."],
  ["Which gas do plants take in for photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "Carbon dioxide enters through the stomata and becomes part of glucose."],
  ["What is released as a by-product?", ["Oxygen", "Glucose", "Water", "Starch"], 0, "Splitting water releases oxygen, which leaves through the stomata."],
  ["What does chlorophyll absorb?", ["Heat", "Light", "Minerals", "Sugar"], 1, "Chlorophyll absorbs light, mostly red and blue, and reflects green."],
].map(([prompt, options, answerIndex, explanation], index) =>
  question(
    {
      prompt: prompt as string,
      options: options as string[],
      answerIndex: answerIndex as number,
      explanation: explanation as string,
      subject: "Biology",
      topic: "Photosynthesis",
    },
    index,
  ),
);

export const quadraticsQuestions: Question[] = [
  question({
    prompt: "Solve x² − 5x + 6 = 0.",
    options: ["x = 2 or x = 3", "x = 1 or x = 6", "x = −2 or x = −3", "x = 5 or x = 6"],
    answerIndex: 0,
    explanation: "2 × 3 = 6 and 2 + 3 = 5, so (x − 2)(x − 3) = 0.",
    subject: "Mathematics",
    topic: "Quadratics",
  }, 0),
  question({
    prompt: "Factorise x² + 7x + 12.",
    options: ["(x + 3)(x + 4)", "(x + 2)(x + 6)", "(x + 7)(x + 1)", "(x − 3)(x − 4)"],
    answerIndex: 0,
    explanation: "3 × 4 = 12 and 3 + 4 = 7.",
    subject: "Mathematics",
    topic: "Quadratics",
  }, 1),
  question({
    prompt: "Which pair multiplies to 6 and adds to 5?",
    options: ["2 and 3", "1 and 6", "6 and −1", "3 and 3"],
    answerIndex: 0,
    explanation: "2 × 3 = 6 and 2 + 3 = 5. That pair factorises x² + 5x + 6.",
    subject: "Mathematics",
    topic: "Quadratics",
  }, 2),
  question({
    prompt: "What should you do first with x² + 5x = −6?",
    options: ["Move every term to one side", "Divide by x", "Square both sides", "Take the square root of both sides"],
    answerIndex: 0,
    explanation: "Factorising needs the equation equal to zero: x² + 5x + 6 = 0.",
    subject: "Mathematics",
    topic: "Quadratics",
  }, 3),
  question({
    prompt: "The roots of (x − 2)(x − 3) = 0 are",
    options: ["2 and 3", "−2 and −3", "5 and 6", "2 and −3"],
    answerIndex: 0,
    explanation: "A product is zero when either factor is zero, so x = 2 or x = 3.",
    subject: "Mathematics",
    topic: "Quadratics",
  }, 4),
];

const cellQuestions: Question[] = [
  question({
    prompt: "Which part is found only in plant cells?",
    options: ["Nucleus", "Cell wall", "Mitochondrion", "Cytoplasm"],
    answerIndex: 1,
    explanation: "Plant cells have a cell wall. Animal cells do not.",
    subject: "Biology",
    topic: "Cell structure",
  }, 0),
  question({
    prompt: "What does the mitochondrion do?",
    options: ["Stores the genetic code", "Releases energy from food", "Traps light", "Holds cell sap"],
    answerIndex: 1,
    explanation: "Mitochondria release energy through respiration.",
    subject: "Biology",
    topic: "Cell structure",
  }, 1),
  question({
    prompt: "Which structure controls the cell?",
    options: ["Nucleus", "Cell wall", "Vacuole", "Cytoplasm"],
    answerIndex: 0,
    explanation: "The nucleus holds DNA and controls what the cell does.",
    subject: "Biology",
    topic: "Cell structure",
  }, 2),
  question({
    prompt: "Plant cells usually have a large",
    options: ["Vacuole", "Flagellum", "Capsule", "Nucleoid"],
    answerIndex: 0,
    explanation: "The large permanent vacuole holds cell sap.",
    subject: "Biology",
    topic: "Cell structure",
  }, 3),
  question({
    prompt: "Animal cells do not have",
    options: ["A cell wall", "A nucleus", "Cytoplasm", "Mitochondria"],
    answerIndex: 0,
    explanation: "The cell wall is the plant-cell extra named in the notes.",
    subject: "Biology",
    topic: "Cell structure",
  }, 4),
];

export const cellPack: StudyPack = {
  id: "cell-structure",
  subject: "Biology",
  topic: "Cell structure",
  summary: [
    "Cells are the smallest living units.",
    "Plant cells add a wall, chloroplasts and a big vacuole.",
    "The nucleus holds DNA and runs the cell.",
    "Mitochondria release energy from food.",
  ],
  flashcards: [
    { q: "What does the mitochondrion do?", a: "Releases energy from food through respiration." },
    { q: "What controls the cell?", a: "The nucleus, which holds the DNA." },
    { q: "Name two parts found in plant cells but not animal cells.", a: "A cell wall and chloroplasts. Plant cells also have a large vacuole." },
    { q: "What is a cell?", a: "The basic unit of life." },
  ],
  questions: cellQuestions,
};

export const quizzes: Record<string, { id: string; subject: string; topic: string; questions: Question[] }> = {
  photosynthesis: {
    id: "photosynthesis",
    subject: "Biology",
    topic: "Photosynthesis",
    questions: photosynthesisQuestions,
  },
  quadratics: {
    id: "quadratics",
    subject: "Mathematics",
    topic: "Quadratics",
    questions: quadraticsQuestions,
  },
  "cell-structure": {
    id: "cell-structure",
    subject: "Biology",
    topic: "Cell structure",
    questions: cellQuestions,
  },
};

/** Scripted review for the photosynthesis mock: answers 2, 2, 0, 0 → score 2 of 4. */
export const photosynthesisReviewAnswers = [2, 2, 0, 0];

export function demoPack(subject: string, topic: string, notes: string): StudyPack {
  if (/cell/i.test(`${subject} ${topic} ${notes}`)) {
    return { ...cellPack, id: "cell-structure", subject, topic: topic || cellPack.topic };
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

export const quadraticsOutline: LessonOutline = {
  objectives: [
    "Factorise a quadratic of the form x² + bx + c.",
    "Solve the equation by setting each factor to zero.",
    "Check answers by substitution.",
  ],
  plan: [
    { stage: "Starter", minutes: 5, text: "Expand (x + 2)(x + 3) together. Ask what numbers multiply to 6 and add to 5." },
    { stage: "Teach", minutes: 12, text: "Factorise x² + 7x + 12 on the board. Show the sum-product table." },
    { stage: "Worked example", minutes: 8, text: "Solve x² − 5x + 6 = 0. Roots: x = 2, x = 3." },
    { stage: "Practice", minutes: 10, text: "Five questions in pairs, rising difficulty." },
    { stage: "Exit check", minutes: 5, text: "One question on paper. Collect and sort into got it / not yet." },
  ],
  notes:
    "A quadratic equation has the form ax² + bx + c = 0. When a = 1, look for two numbers that multiply to c and add to b. Write the equation as (x + p)(x + q) = 0. If a product is zero, one of the factors must be zero, so x = −p or x = −q.",
  mistakes: [
    "Mixing up signs when c is negative.",
    "Forgetting to set the equation to zero first.",
  ],
};

export const lessons: Record<string, LessonDraft> = {
  quadratics: {
    id: "quadratics",
    title: "Quadratic equations by factorisation",
    level: "SS2",
    subject: "Mathematics",
    topic: "Quadratic equations by factorisation",
    minutes: 40,
    classId: "ss2a",
    status: "draft",
    outline: quadraticsOutline,
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
  if (/quadratic/i.test(input.topic)) return quadraticsOutline;
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
      { stage: "Starter", minutes: starter, text: `Ask what the class already knows about ${input.topic}.` },
      { stage: "Teach", minutes: teach, text: `Teach one method for ${input.topic}. Keep the example short.${extra}` },
      { stage: "Practice", minutes: practice, text: "Pairs answer three questions. You circulate and listen." },
      { stage: "Exit check", minutes: 5, text: "One question on paper. Sort into got it / not yet." },
    ],
    notes: `${input.level} ${input.subject}. ${input.topic} is drafted for you to edit against your scheme of work.${extra}`,
    mistakes: [
      "Rushing the example before the class can say the idea back.",
      "Leaving the exit check unmarked.",
    ],
  };
}

const teacherPhotosynthesisQuestions: Question[] = [
  question({
    prompt: "Which gas do plants take in for photosynthesis?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answerIndex: 1,
    explanation: "Plants use carbon dioxide and water to make glucose, and release oxygen.",
    subject: "Biology",
    topic: "Photosynthesis",
    marks: 1,
  }, 0),
  question({
    prompt: "Where in the leaf cell does photosynthesis happen?",
    options: ["Nucleus", "Vacuole", "Chloroplast", "Cell wall"],
    answerIndex: 2,
    explanation: "Photosynthesis happens in the chloroplast.",
    subject: "Biology",
    topic: "Photosynthesis",
    marks: 1,
  }, 1),
  question({
    prompt: "Which of these is a product of photosynthesis?",
    options: ["Glucose", "Starch only", "Carbon dioxide", "Chlorophyll"],
    answerIndex: 0,
    explanation: "Glucose is a product. Starch is how many plants store it afterwards.",
    subject: "Biology",
    topic: "Photosynthesis",
    marks: 1,
  }, 2),
];

export const teacherQuizzes: Record<string, TeacherQuiz> = {
  photosynthesis: {
    id: "photosynthesis",
    title: "Photosynthesis quiz",
    level: "SS1",
    subject: "Biology",
    topic: "Photosynthesis",
    classId: "ss1a",
    status: "reviewed",
    questions: teacherPhotosynthesisQuestions,
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "Write the word equation for photosynthesis and name two conditions it needs.",
        points: [
          { text: "Carbon dioxide + water on the left", marks: 1 },
          { text: "Glucose + oxygen on the right", marks: 1 },
          { text: "Light energy and chlorophyll shown over the arrow", marks: 2 },
          { text: "Any two conditions: light, chlorophyll, carbon dioxide, water, suitable temperature", marks: 2 },
        ],
        notes: "Accept the balanced chemical equation in place of the word equation. Do not award marks for oxygen as an input.",
      },
    ],
    assignedClassIds: [],
    questionCount: 12,
    totalMarks: 22,
    timeMinutes: 25,
    reviewedCount: 3,
    updatedAt: "Yesterday",
  },
  indices: {
    id: "indices",
    title: "Indices and logarithms",
    level: "SS2",
    subject: "Mathematics",
    topic: "Indices and logarithms",
    classId: "ss2a",
    status: "reviewed",
    questions: [
      question({
        prompt: "Simplify 8^(2/3).",
        options: ["4", "2", "16", "8"],
        answerIndex: 0,
        explanation: "8^(1/3) is 2, and 2² is 4.",
        subject: "Mathematics",
        topic: "Indices",
        marks: 1,
      }, 0),
      question({
        prompt: "Which is the same as log₁₀ 1000?",
        options: ["3", "10", "100", "1"],
        answerIndex: 0,
        explanation: "10³ = 1000, so the log is 3.",
        subject: "Mathematics",
        topic: "Logarithms",
        marks: 1,
      }, 1),
    ],
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "Evaluate log₂ 32 and show one working step.",
        points: [
          { text: "Writes 32 as a power of 2", marks: 1 },
          { text: "States the answer 5", marks: 1 },
        ],
        notes: "Accept 2⁵ = 32 as the working step.",
      },
    ],
    assignedClassIds: ["ss2a"],
    questionCount: 2,
    totalMarks: 4,
    timeMinutes: 15,
    reviewedCount: 2,
    updatedAt: "Thu",
  },
  ohms: {
    id: "ohms",
    title: "Ohm's law theory paper",
    level: "SS3",
    subject: "Physics",
    topic: "Ohm's law",
    classId: "ss3a",
    status: "draft",
    questions: [
      question({
        prompt: "A lamp draws 0.5 A from a 6 V battery. What is its resistance?",
        options: ["3 Ω", "12 Ω", "6.5 Ω", "0.08 Ω"],
        answerIndex: 1,
        explanation: "R = V / I = 6 / 0.5 = 12 Ω.",
        subject: "Physics",
        topic: "Ohm's law",
        marks: 1,
      }, 0),
    ],
    markingGuide: [
      {
        questionId: "theory-1",
        prompt: "State Ohm's law and calculate the current when 12 V is applied across a 4 Ω resistor.",
        points: [
          { text: "States V = IR, or current is proportional to voltage at constant temperature", marks: 2 },
          { text: "Rearranges to I = V / R", marks: 1 },
          { text: "Substitutes 12 / 4 and gets 3 A with the unit", marks: 2 },
        ],
        notes: "Do not award the calculation mark if the unit is missing. Constant temperature should be mentioned for the full statement.",
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
  if (/photosynthesis/i.test(input.topic)) {
    const sample = teacherQuizzes.photosynthesis;
    if (!sample) throw new Error("Missing photosynthesis sample");
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
      explanation: `Edit this key before class. Demo mode only sketches ${input.topic}.${note}`,
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
      explanation: "Use this slot for a real question from your scheme of work.",
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
        notes: `Check this mark scheme against your scheme of work before you assign it.${note}`,
      },
    ],
    timeMinutes: 20,
    totalMarks: 7,
    questionCount: 3,
    reviewedCount: 0,
  };
}

export const classes: TeacherClass[] = [
  { id: "ss2a", name: "SS2 A", level: "SS2", subject: "Mathematics", studentCount: 34 },
  { id: "ss2b", name: "SS2 B", level: "SS2", subject: "Mathematics", studentCount: 31 },
  { id: "ss1a", name: "SS1 A", level: "SS1", subject: "Biology", studentCount: 36 },
  { id: "ss3a", name: "SS3 A", level: "SS3", subject: "Physics", studentCount: 28 },
];

export const generations: Generation[] = [
  { id: "quadratics", type: "lesson", title: "Quadratic equations by factorisation", classId: "ss2a", status: "draft", updatedAt: "Today, 9:40" },
  { id: "photosynthesis", type: "quiz", title: "Photosynthesis — 15 questions", classId: "ss1a", status: "reviewed", updatedAt: "Yesterday" },
  { id: "ohms", type: "marking_guide", title: "Ohm's law theory paper", classId: "ss3a", status: "draft", updatedAt: "Fri" },
  { id: "indices", type: "quiz", title: "Indices and logarithms", classId: "ss2a", status: "reviewed", updatedAt: "Thu" },
];

export const classSnapshots: Record<string, ClassSnapshot> = {
  ss2a: {
    classId: "ss2a",
    quizzesTaken: 142,
    classAverage: 63,
    topics: [
      { topic: "Completing the square", avg: 48, attempts: 31 },
      { topic: "Quadratic formula", avg: 54, attempts: 28 },
      { topic: "Indices", avg: 66, attempts: 34 },
      { topic: "Factorisation", avg: 72, attempts: 33 },
      { topic: "Linear inequalities", avg: 81, attempts: 30 },
    ],
    missed: [
      { prompt: "Write x² + 6x + 2 as (x + a)² + b", topic: "Completing the square", wrongPct: 71 },
      { prompt: "Solve 2x² − 3x − 5 = 0 with the formula", topic: "Quadratic formula", wrongPct: 58 },
      { prompt: "Simplify 8^(2/3)", topic: "Indices", wrongPct: 44 },
    ],
    supportCount: 6,
  },
  ss2b: {
    classId: "ss2b",
    quizzesTaken: 88,
    classAverage: 71,
    topics: [
      { topic: "Factorisation", avg: 76, attempts: 29 },
      { topic: "Linear inequalities", avg: 69, attempts: 27 },
      { topic: "Indices", avg: 58, attempts: 24 },
    ],
    missed: [
      { prompt: "Simplify 8^(2/3)", topic: "Indices", wrongPct: 49 },
    ],
    supportCount: 3,
  },
  ss1a: {
    classId: "ss1a",
    quizzesTaken: 64,
    classAverage: 67,
    topics: [
      { topic: "Photosynthesis", avg: 71, attempts: 30 },
      { topic: "Cell structure", avg: 64, attempts: 28 },
      { topic: "Diffusion", avg: 52, attempts: 22 },
    ],
    missed: [
      { prompt: "Name the gas plants take in", topic: "Photosynthesis", wrongPct: 38 },
    ],
    supportCount: 4,
  },
  ss3a: {
    classId: "ss3a",
    quizzesTaken: 41,
    classAverage: 74,
    topics: [
      { topic: "Ohm's law", avg: 77, attempts: 26 },
      { topic: "Motion", avg: 69, attempts: 21 },
    ],
    missed: [
      { prompt: "State the unit of resistance", topic: "Ohm's law", wrongPct: 22 },
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
  const subject = found.subject === "Mathematics" ? "Maths" : found.subject;
  return `${found.level} ${subject}`;
}
