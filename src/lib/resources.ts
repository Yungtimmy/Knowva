import type { ResourceBundle, ResourceItem, ResourcePreference, ResourceType } from "./types";

const NOTES_HOSTS = [
  "freecodecamp.org",
  "udemy.com",
  "developer.mozilla.org",
  "khanacademy.org",
  "openstax.org",
  "deeplearning.ai",
  "promptingguide.ai",
  "dair.ai",
  "react.dev",
  "nextjs.org",
  "javascript.info",
  "theodinproject.com",
  "roadmap.sh",
  "python.org",
  "git-scm.com",
  "sqlite.org",
  "postgresql.org",
  "flutter.dev",
  "nodejs.org",
  "pytorch.org",
  "scikit-learn.org",
  "tensorflow.org",
  "harvard.edu",
  "mit.edu",
  "coursera.org",
  "edx.org",
  "learn.microsoft.com",
  "developer.apple.com",
  "developer.android.com",
  "web.dev",
  "w3.org",
  "brown.edu",
  "wikipedia.org",
];

function hostName(url: URL) {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function hostMatches(url: URL, host: string) {
  const name = hostName(url);
  return name === host || name.endsWith(`.${host}`);
}

function isSearchPage(url: URL) {
  const host = hostName(url);
  const path = url.pathname.toLowerCase();
  if (path === "/results" || path.startsWith("/results/") || path.includes("/search")) return true;
  if (host === "google.com" || host.endsWith(".google.com") || host.includes("bing.com") || host.includes("duckduckgo.")) {
    return true;
  }
  if (url.searchParams.has("search_query")) return true;
  return false;
}

/** A real YouTube watch page, not a channel or a search results URL. */
export function isYoutubeWatchUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || isSearchPage(url)) return false;
  const host = hostName(url);
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return /^[A-Za-z0-9_-]{11}$/.test(id);
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname !== "/watch") return false;
    return /^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get("v") ?? "");
  }
  return false;
}

function isNotesPage(url: URL) {
  if (isSearchPage(url)) return false;
  if (hostMatches(url, "udemy.com") && !url.pathname.startsWith("/course/")) return false;
  if (hostMatches(url, "coursera.org") && !/^\/(learn|specializations|professional-certificates)\//.test(url.pathname)) {
    return false;
  }
  return NOTES_HOSTS.some((host) => hostMatches(url, host));
}

/** Real course or video pages only. Search URLs and channel homepages are rejected. */
export function isCuratedResourceUrl(raw: string | null, type: ResourceType) {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || isSearchPage(url)) return false;
  if (type === "youtube") return isYoutubeWatchUrl(raw);
  if (type === "pdf" || type === "notes" || type === "course") return isNotesPage(url);
  return false;
}

export function isStubCopy(text: string) {
  return /search\s+(youtube|pdf|notes|google|query)|not a checked link|search query|placeholder/i.test(text);
}

export function sourcePill(url: string) {
  try {
    const host = hostName(new URL(url));
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("freecodecamp")) return "freeCodeCamp";
    if (host.includes("udemy")) return "Udemy";
    if (host.includes("mozilla")) return "MDN";
    if (host.includes("deeplearning")) return "DeepLearning.AI";
    if (host.includes("promptingguide") || host.includes("dair")) return "DAIR.AI";
    if (host.includes("khanacademy")) return "Khan Academy";
    if (host.includes("openstax")) return "OpenStax";
    if (host.includes("wikipedia")) return "Wikipedia";
    const label = host.split(".")[0] ?? "Source";
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return "Source";
  }
}

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
    topics: ["bayes", "probability", "statistic", "independence", "evaluation", "metric", "machine"],
    levels: ["beginner", "intermediate"],
    why: "Free video lessons from Khan Academy for probability, which evaluation metrics rely on.",
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
    topics: ["quadratic", "math", "algebra", "probability", "linear", "model", "machine"],
    levels: ["intermediate", "advanced"],
    why: "Video explanations of the maths behind models, including linear algebra and probability.",
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
    title: "MDN HTTP overview",
    type: "notes",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    topics: ["http", "api", "fetch", "web", "status"],
    levels: ["beginner", "intermediate", "advanced"],
    why: "MDN reference for how HTTP requests and status codes work.",
    source: "MDN",
    clarity: 0,
  },
  {
    title: "MDN Fetch guide",
    type: "course",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
    topics: ["fetch", "http", "api", "javascript", "web"],
    levels: ["intermediate", "advanced"],
    why: "MDN guide for calling an API with fetch.",
    source: "MDN",
    clarity: 1,
  },
  {
    title: "git documentation",
    type: "notes",
    url: "https://git-scm.com/docs",
    topics: ["git", "commit", "software", "version"],
    levels: ["beginner", "intermediate", "advanced"],
    why: "Official git reference for commits, branches, and history.",
    source: "git",
    clarity: 1,
  },
  {
    title: "Python tutorial",
    type: "notes",
    url: "https://docs.python.org/3/tutorial/",
    topics: ["python", "pytest", "testing", "software"],
    levels: ["beginner", "intermediate", "advanced"],
    why: "Official Python tutorial, including the language your tests run in.",
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

function normalizeLevel(level: string): "beginner" | "intermediate" | "advanced" {
  const text = level.toLowerCase();
  if (text.includes("begin") || text.includes("ss1") || text.includes("100l")) return "beginner";
  if (text.includes("advanc") || text.includes("ss3") || text.includes("300l") || text.includes("univers")) return "advanced";
  return "intermediate";
}

function matchesTopic(item: CatalogItem, topic: string) {
  const needle = topic.toLowerCase();
  return item.topics.some((token) => token.length >= 4 && (needle.includes(token) || token.includes(needle)));
}

export function typesForPreference(preference: ResourcePreference): ResourceType[] {
  if (preference === "video") return ["youtube"];
  if (preference === "pdf") return ["pdf", "notes", "course"];
  if (preference === "course") return ["course", "notes", "pdf"];
  return ["youtube", "pdf", "notes", "course"];
}

function toDraft(item: CatalogItem, topic: string): ResourceItem | null {
  if (!item.url || !isCuratedResourceUrl(item.url, item.type)) return null;
  return {
    title: item.title,
    type: item.type,
    url: item.url,
    searchQuery: topic.trim(),
    why: item.why,
    confidence: "med",
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

  const allowed = new Set(typesForPreference(input.preference));
  const picked: ResourceItem[] = [];
  for (const { item } of matched) {
    if (picked.length >= 5) break;
    if (!allowed.has(item.type)) continue;
    const draft = toDraft(item, topic);
    if (!draft || isStubCopy(draft.title) || isStubCopy(draft.why)) continue;
    picked.push(draft);
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

async function bodyLooksMissing(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return false;
  try {
    const { value } = await reader.read();
    const text = value ? new TextDecoder().decode(value).slice(0, 4000) : "";
    return /video unavailable|this video isn't available|page not found/i.test(text);
  } catch {
    return false;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export async function verifyUrl(url: string) {
  const headers = { "user-agent": "KnowvaMVP/0.1 (educational link check)" };
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(4000), headers });
    if (head.status === 404 || head.status === 410) return false;
    if (head.ok && !hostName(new URL(url)).includes("youtube") && hostName(new URL(url)) !== "youtu.be") return true;
  } catch {
    // Some hosts reject HEAD. Try GET before calling the link unreachable.
  }
  try {
    const get = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(5000), headers });
    if (!get.ok) return false;
    if (await bodyLooksMissing(get)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Keep a card only when the URL opens. Anything else is omitted, never turned into a search stub. */
export async function verifyBundle(bundle: ResourceBundle): Promise<ResourceBundle> {
  const check = async (item: ResourceItem): Promise<ResourceItem | null> => {
    if (!item.url || !isCuratedResourceUrl(item.url, item.type)) return null;
    if (isStubCopy(item.title) || isStubCopy(item.why) || isStubCopy(item.source)) return null;
    const ok = await verifyUrl(item.url);
    if (!ok) return null;
    return { ...item, verified: true, confidence: "high" };
  };
  const [primary, alternates] = await Promise.all([
    Promise.all(bundle.primary.map(check)),
    Promise.all(bundle.alternates.map(check)),
  ]);
  return {
    ...bundle,
    primary: primary.filter((item): item is ResourceItem => item !== null),
    alternates: alternates.filter((item): item is ResourceItem => item !== null),
  };
}
