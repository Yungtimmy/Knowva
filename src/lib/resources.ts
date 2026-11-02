import type { ResourceBundle, ResourceItem, ResourcePreference, ResourceType } from "./types";

/** Only these prefixes may be returned as URLs. Anything else becomes a search query. */
export const ALLOWED_URL_PREFIXES = [
  "https://www.khanacademy.org/",
  "https://www.youtube.com/@",
  "https://openstax.org/",
  "https://docs.python.org/",
  "https://www.sqlite.org/",
  "https://www.postgresql.org/docs/",
  "https://seeing-theory.brown.edu/",
];

type CatalogItem = {
  title: string;
  type: ResourceType;
  url: string | null;
  topics: string[];
  levels: Array<"beginner" | "intermediate" | "advanced">;
  why: string;
  source: string;
  clarity: number;
};

const CATALOG: CatalogItem[] = [
  {
    title: "Khan Academy statistics videos",
    type: "youtube",
    url: "https://www.youtube.com/@khanacademy",
    topics: ["bayes", "probability", "statistic", "independence"],
    levels: ["beginner", "intermediate"],
    why: "Free video lessons from Khan Academy for Bayes' theorem and probability.",
    source: "YouTube · Khan Academy",
    clarity: 0,
  },
  {
    title: "OpenStax Introductory Statistics",
    type: "pdf",
    url: "https://openstax.org/details/books/introductory-statistics",
    topics: ["bayes", "probability", "statistic", "independence"],
    levels: ["intermediate", "advanced"],
    why: "OpenStax textbook for Bayes' theorem, free to read online or as a PDF.",
    source: "OpenStax",
    clarity: 0,
  },
  {
    title: "Khan Academy statistics course",
    type: "course",
    url: "https://www.khanacademy.org/math/statistics-probability",
    topics: ["bayes", "probability", "statistic", "independence"],
    levels: ["beginner", "intermediate", "advanced"],
    why: "A structured course path that includes Bayes' theorem.",
    source: "Khan Academy",
    clarity: 1,
  },
  {
    title: "Seeing Theory",
    type: "notes",
    url: "https://seeing-theory.brown.edu/",
    topics: ["bayes", "probability", "independence"],
    levels: ["intermediate", "advanced"],
    why: "Visual notes for Bayes' theorem and probability. Reachability is checked before this is called verified.",
    source: "Seeing Theory",
    clarity: 2,
  },
  {
    title: "3Blue1Brown channel",
    type: "youtube",
    url: "https://www.youtube.com/@3blue1brown",
    topics: ["quadratic", "math", "algebra", "probability"],
    levels: ["intermediate", "advanced"],
    why: "Video explanations of mathematical ideas, including probability.",
    source: "YouTube · 3Blue1Brown",
    clarity: 1,
  },
  {
    title: "OpenStax College Algebra",
    type: "pdf",
    url: "https://openstax.org/details/books/college-algebra-2e",
    topics: ["quadratic", "algebra", "math"],
    levels: ["intermediate", "advanced"],
    why: "OpenStax algebra textbook with worked examples.",
    source: "OpenStax",
    clarity: 0,
  },
  {
    title: "Khan Academy Algebra",
    type: "course",
    url: "https://www.khanacademy.org/math/algebra",
    topics: ["quadratic", "algebra", "math"],
    levels: ["beginner", "intermediate"],
    why: "Structured algebra course, including quadratic equations.",
    source: "Khan Academy",
    clarity: 1,
  },
  {
    title: "OpenStax Biology 2e",
    type: "pdf",
    url: "https://openstax.org/details/books/biology-2e",
    topics: ["photosynthesis", "biology", "cell"],
    levels: ["intermediate", "advanced"],
    why: "OpenStax biology textbook, including photosynthesis.",
    source: "OpenStax",
    clarity: 0,
  },
  {
    title: "Khan Academy Biology",
    type: "course",
    url: "https://www.khanacademy.org/science/biology",
    topics: ["photosynthesis", "biology", "cell"],
    levels: ["beginner", "intermediate"],
    why: "Structured biology course with video lessons.",
    source: "Khan Academy",
    clarity: 1,
  },
  {
    title: "Khan Academy Physics",
    type: "youtube",
    url: "https://www.youtube.com/@khanacademy",
    topics: ["ohm", "physics", "motion"],
    levels: ["beginner", "intermediate"],
    why: "Khan Academy video channel for physics topics such as Ohm's law.",
    source: "YouTube · Khan Academy",
    clarity: 1,
  },
  {
    title: "OpenStax University Physics",
    type: "pdf",
    url: "https://openstax.org/details/books/university-physics-volume-1",
    topics: ["ohm", "physics", "motion"],
    levels: ["advanced"],
    why: "OpenStax physics textbook.",
    source: "OpenStax",
    clarity: 2,
  },
  {
    title: "Python tutorial",
    type: "notes",
    url: "https://docs.python.org/3/tutorial/",
    topics: ["python"],
    levels: ["beginner", "intermediate", "advanced"],
    why: "Official Python tutorial.",
    source: "Python docs",
    clarity: 0,
  },
  {
    title: "SQLite SELECT reference",
    type: "notes",
    url: "https://www.sqlite.org/lang_select.html",
    topics: ["sql", "join", "database"],
    levels: ["intermediate", "advanced"],
    why: "Official SQLite documentation for SELECT and joins.",
    source: "SQLite",
    clarity: 1,
  },
  {
    title: "PostgreSQL tutorial",
    type: "course",
    url: "https://www.postgresql.org/docs/current/tutorial.html",
    topics: ["sql", "join", "database"],
    levels: ["intermediate", "advanced"],
    why: "Official PostgreSQL tutorial, including queries.",
    source: "PostgreSQL docs",
    clarity: 0,
  },
];

const ORDER: Record<ResourcePreference, ResourceType[]> = {
  video: ["youtube", "course", "notes", "pdf", "practice"],
  pdf: ["pdf", "notes", "course", "youtube", "practice"],
  course: ["course", "notes", "pdf", "youtube", "practice"],
  mixed: ["notes", "youtube", "pdf", "course", "practice"],
};

export function preferenceOrder(preference: ResourcePreference) {
  return ORDER[preference];
}

function safeUrl(url: string | null) {
  if (!url) return null;
  return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)) ? url : null;
}

function normalizeLevel(level: string): "beginner" | "intermediate" | "advanced" {
  const text = level.toLowerCase();
  if (text.includes("begin") || text.includes("ss1")) return "beginner";
  if (text.includes("advanc") || text.includes("ss3") || text.includes("univers")) return "advanced";
  return "intermediate";
}

function matchesTopic(item: CatalogItem, topic: string) {
  const needle = topic.toLowerCase();
  return item.topics.some((token) => token.length >= 4 && (needle.includes(token) || token.includes(needle)));
}

function searchStub(type: ResourceType, subject: string, topic: string): ResourceItem {
  const query = `${topic} ${subject}`.trim();
  const why =
    type === "practice"
      ? `Practice on ${topic} inside Knowva. This is not an external link.`
      : `No curated ${type} link was available for ${topic}. This is a search query, not a checked link.`;
  return {
    title: type === "practice" ? `Practice: ${topic}` : `Search ${type}: ${query}`,
    type,
    url: null,
    searchQuery: query,
    why,
    confidence: "low",
    verified: false,
    role: "primary",
    source: type === "youtube" ? "YouTube search" : type === "course" ? "Coursera or edX search" : "Search query",
  };
}

function toDraft(item: CatalogItem, topic: string): ResourceItem {
  const url = safeUrl(item.url);
  return {
    title: item.title,
    type: item.type,
    url,
    searchQuery: `${topic}`.trim(),
    why: item.why,
    confidence: url ? "med" : "low",
    verified: false,
    role: "primary",
    source: item.source,
  };
}

export function assembleResources(input: {
  subject: string;
  topic: string;
  level: string;
  preference: ResourcePreference;
  weakTopic?: string | null;
}): ResourceBundle {
  const topic = (input.weakTopic?.trim() || input.topic).trim();
  const level = normalizeLevel(input.level);
  const order = preferenceOrder(input.preference);
  const matched = CATALOG.filter((item) => matchesTopic(item, topic))
    .map((item) => ({
      item,
      rank: order.indexOf(item.type) * 100 + (item.levels.includes(level) ? 0 : 10) + item.clarity,
    }))
    .sort((a, b) => a.rank - b.rank);

  const picked: ResourceItem[] = [];
  for (const { item } of matched) {
    if (picked.length >= 5) break;
    const draft = toDraft(item, topic);
    if (draft.url === null && item.url) {
      picked.push({
        ...draft,
        why: `${item.why} The link was dropped because it is not on the curated allowlist.`,
        confidence: "low",
      });
    } else {
      picked.push(draft);
    }
  }

  let fill = 0;
  while (picked.length < 5 && fill < 12) {
    const type = order[fill % order.length] ?? "notes";
    fill += 1;
    const stub = searchStub(type, input.subject, topic);
    if (picked.some((item) => item.type === stub.type && item.title === stub.title)) continue;
    picked.push(stub);
  }

  const primary = picked.slice(0, 3).map((item) => ({ ...item, role: "primary" as const }));
  const alternates = picked.slice(3, 5).map((item) => ({ ...item, role: "alternate" as const }));
  return {
    subject: input.subject,
    topic,
    preference: input.preference,
    level: input.level,
    weakTopic: input.weakTopic?.trim() || null,
    primary,
    alternates,
  };
}

export async function verifyUrl(url: string) {
  const headers = { "user-agent": "KnowvaMVP/0.1 (educational link check)" };
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(2500), headers });
    if (head.ok) return true;
    if (head.status === 404) return false;
  } catch {
    // Some hosts reject HEAD. Try GET before calling the link unreachable.
  }
  try {
    const get = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(2500), headers });
    return get.ok;
  } catch {
    return false;
  }
}

/** Marks `verified` only when a check succeeds. Unreachable curated URLs become search queries. */
export async function verifyBundle(bundle: ResourceBundle): Promise<ResourceBundle> {
  const check = async (item: ResourceItem): Promise<ResourceItem> => {
    if (!item.url) return { ...item, verified: false };
    const ok = await verifyUrl(item.url);
    if (!ok) {
      return {
        ...item,
        url: null,
        verified: false,
        confidence: "low",
        why: `${item.why} The curated link was not reachable, so this is a search query instead.`,
      };
    }
    return { ...item, verified: true, confidence: "high" };
  };
  const [primary, alternates] = await Promise.all([
    Promise.all(bundle.primary.map(check)),
    Promise.all(bundle.alternates.map(check)),
  ]);
  return { ...bundle, primary, alternates };
}
