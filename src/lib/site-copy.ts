import { CONTACT_EMAIL, PATH } from "./site";

export type InlinePart = string | { href: string; label: string };

export type FaqItem = {
  id: string;
  question: string;
  startOpen?: boolean;
  paragraphs: InlinePart[][];
};

export type LegalSection = {
  id: string;
  heading: string;
  paragraphs: InlinePart[][];
};

export type LegalPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

const GROQ_SENTENCE = "Chat text and uploaded file contents are sent to Groq to generate answers.";

function deletionParagraph(): InlinePart[] {
  const ask = `There is no delete button in the app yet. Email ${CONTACT_EMAIL} and ask for your account and the tutors, chats, results, and uploads stored for it to be deleted.`;
  if (CONTACT_EMAIL === "TODO") {
    return [`${ask} TODO is a placeholder address, not a working inbox.`];
  }
  return [ask];
}

export const faqIntro = {
  eyebrow: "FAQ",
  title: ["Questions,", "answered."],
  lede: "How tutors, uploads and the Test Centre work, and what Knowva does with your notes.",
  cta: "Create your first tutor",
  ctaHref: PATH.createTutor,
};

export const FAQ: FaqItem[] = [
  {
    id: "what",
    question: "What is Knowva?",
    startOpen: true,
    paragraphs: [
      [
        "Knowva lets you create an AI tutor for each course you study. You learn with it, practise with quick quizzes, then take a test in the Test Centre. Your results show your weak topics and send you back to the right tutor.",
      ],
    ],
  },
  {
    id: "who",
    question: "Who is it for?",
    paragraphs: [
      [
        "Secondary school and university students who want course-specific help, revision and exam practice.",
      ],
    ],
  },
  {
    id: "answers",
    question: "Will the tutor just give me answers?",
    paragraphs: [
      [
        "No. It explains step by step, gives examples, asks you practice questions and nudges you to reason it out. Ask for a simpler explanation whenever you need one.",
      ],
    ],
  },
  {
    id: "uploads",
    question: "Can I upload my own notes?",
    paragraphs: [
      [
        "Yes. Attach a PDF or an image in the tutor chat and the tutor answers from it. Every upload is kept in Media. Text-based PDFs work best; scanned or handwritten pages may not read correctly.",
      ],
    ],
  },
  {
    id: "media",
    question: "What are Media and search?",
    paragraphs: [
      [
        "Each tutor chat has a Media page and a search box. Media lists the links, PDFs, and images from that chat, with filters for each. Search finds words in the conversation and steps through the matches. Open Media from the tutor's picture, and search from the button in the chat header.",
      ],
    ],
  },
  {
    id: "quiz-test",
    question: "What's the difference between a quiz and a test?",
    paragraphs: [
      [
        "A quiz is quick practice inside your tutor. A test runs in the Test Centre with the tutor locked, so you can see what you really know. You get a score, explanations and a list of topics to revise.",
      ],
    ],
  },
  {
    id: "train",
    question: "Does creating a tutor train a new AI?",
    paragraphs: [
      [
        "No. A tutor is a saved setup: your course, what you want to learn and how you like to be taught. You can edit or delete it at any time.",
      ],
    ],
  },
  {
    id: "wrong",
    question: "Can the tutor be wrong?",
    paragraphs: [
      [
        "Yes, AI can make mistakes, and the tutor says when it isn't sure. Check important facts against your course material, and treat one score as a guide, not a final verdict.",
      ],
    ],
  },
  {
    id: "data",
    question: "What happens to my data?",
    paragraphs: [
      [
        "You sign in with Google. Tutors, chats, and test results are stored in Supabase. Uploads are stored privately in Supabase Storage and are visible only to your account. Chat text and the contents of uploaded files are sent to Groq to generate answers. Knowva does not show ads and does not sell your data. Read the ",
        { href: PATH.privacy, label: "Privacy Policy" },
        ".",
      ],
    ],
  },
];

export const footerCopy = {
  wordmark: "Knowva",
  tagline: "Learn smarter. Grow further.",
  cta: "Get started",
  ctaHref: PATH.getStarted,
  copyright: "© 2026 Knowva AI",
  productTitle: "Product",
  helpTitle: "Help",
  product: [
    { label: "Tutors", href: PATH.tutors },
    { label: "Test Centre", href: PATH.tests },
    { label: "Media", href: PATH.media },
  ],
  help: [
    { label: "FAQ", href: PATH.faq },
    { label: "Terms of Service", href: PATH.terms },
    { label: "Privacy Policy", href: PATH.privacy },
  ],
  legal: [
    { label: "Terms", href: PATH.terms },
    { label: "Privacy", href: PATH.privacy },
  ],
};

export const termsPage: LegalPageCopy = {
  eyebrow: "Terms",
  title: "Terms of Service",
  description: "The terms for using Knowva, a free AI study tutor for students.",
  updated: "Last updated: November 13, 2026",
  sections: [
    {
      id: "service",
      heading: "The service",
      paragraphs: [
        [
          "Knowva is an AI study tutor for secondary school and university students. You create a tutor for a course, ask questions, turn notes into a study pack, and practise in the Test Centre. This is a hackathon MVP.",
        ],
      ],
    },
    {
      id: "account",
      heading: "Your account",
      paragraphs: [
        [
          "You sign in with Google. Sign-in is handled by Supabase Auth. After the first sign-in you save a display name, username, age, and interests. Those details stay on your account.",
        ],
      ],
    },
    {
      id: "tutors",
      heading: "Tutors, chats, and files",
      paragraphs: [
        [
          "A tutor is a saved setup for one course. It does not train a new model. You can keep up to 8 tutors, and you can edit or delete a tutor from its profile. Deleting a tutor removes that tutor and its chat from your account.",
        ],
        [
          "In a tutor chat you can attach a PDF, PNG, JPG, or WebP, up to 3 files at a time and 10 MB each. Text PDFs work best. Scanned or handwritten pages may not read. Chats, study packs, test scores, and uploads are stored in Supabase. Uploads sit in private Supabase Storage and are visible only to your account.",
        ],
      ],
    },
    {
      id: "answers",
      heading: "How answers are made",
      paragraphs: [
        [
          `${GROQ_SENTENCE} Notes you submit for a study pack, the course text used to build a test, and a Learn topic search are sent to Groq when those features need a generated result. Quiz and test scores are calculated in Knowva from the answer key. They are not marked by the model.`,
        ],
      ],
    },
    {
      id: "accuracy",
      heading: "Accuracy",
      paragraphs: [
        [
          "AI can be wrong, and a tutor may say when it is unsure. Check important facts against your course material. A score is a guide, not a final verdict on what you know. Knowva does not issue official grades.",
        ],
      ],
    },
    {
      id: "price",
      heading: "Price, ads, and your data",
      paragraphs: [
        [
          "This version is free to use. There is no paid plan and no checkout. Knowva does not show ads and does not sell your data. The ",
          { href: PATH.privacy, label: "Privacy Policy" },
          " describes what is stored and how to ask for deletion.",
        ],
      ],
    },
    {
      id: "stopping",
      heading: "Closing an account",
      paragraphs: [deletionParagraph()],
    },
  ],
};

export const privacyPage: LegalPageCopy = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  description: "What Knowva stores, and what is sent to Groq to generate answers.",
  updated: "Last updated: November 13, 2026",
  sections: [
    {
      id: "covers",
      heading: "What this covers",
      paragraphs: [
        [
          "This policy describes the Knowva hackathon MVP: what the app stores for your account, and what is sent to Groq to generate answers.",
        ],
      ],
    },
    {
      id: "signin",
      heading: "Sign-in",
      paragraphs: [
        [
          "You sign in with Google through Supabase Auth. Supabase keeps the sign-in session for your account. Knowva uses that session so tutors, chats, and results stay on the account that created them.",
        ],
      ],
    },
    {
      id: "stored",
      heading: "What is stored",
      paragraphs: [
        [
          "Knowva stores your profile (display name, username, age, and interests), tutors, chat messages, study packs, test papers, and scores in Supabase. Database access is limited to your own rows.",
        ],
      ],
    },
    {
      id: "uploads",
      heading: "Uploads",
      paragraphs: [
        [
          "Files you attach in a tutor chat are stored in a private Supabase Storage bucket. They are visible only to your account. Knowva reads text from PDFs that have a text layer, and sends images to Groq so the tutor can describe them.",
        ],
      ],
    },
    {
      id: "groq",
      heading: "What is sent to Groq",
      paragraphs: [
        [
          `${GROQ_SENTENCE} Notes for a study pack, test prompts, and a Learn topic search are sent to Groq when those features need a generated result. Scores are calculated in Knowva and are not produced by the model.`,
        ],
      ],
    },
    {
      id: "sharing",
      heading: "Ads and selling data",
      paragraphs: [
        [
          "Knowva does not show ads and does not sell your data. The services that run the product are Supabase for accounts, the database, and file storage, Google for sign-in, and Groq for generated answers.",
        ],
      ],
    },
    {
      id: "deletion",
      heading: "Deletion",
      paragraphs: [
        [
          "You can delete a tutor from its profile. That removes the tutor and its chat from your account.",
        ],
        deletionParagraph(),
      ],
    },
  ],
};
