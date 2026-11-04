export type CourseGroup = "Tech" | "Computer science" | "University";

export type CourseOption = {
  name: string;
  group: CourseGroup;
};

/** Titles from design/student/onboarding.html. No course codes. */
export const COURSES: CourseOption[] = [
  { group: "Tech", name: "Web Development" },
  { group: "Tech", name: "Frontend (HTML, CSS, JS)" },
  { group: "Tech", name: "React" },
  { group: "Tech", name: "Backend with Node.js" },
  { group: "Tech", name: "Python Programming" },
  { group: "Tech", name: "Mobile App Development" },
  { group: "Tech", name: "Flutter" },
  { group: "Tech", name: "Data Science" },
  { group: "Tech", name: "Data Analysis with Excel" },
  { group: "Tech", name: "Machine Learning" },
  { group: "Tech", name: "Artificial Intelligence" },
  { group: "Tech", name: "Prompt Engineering" },
  { group: "Tech", name: "Cybersecurity" },
  { group: "Tech", name: "Cloud Computing" },
  { group: "Tech", name: "DevOps" },
  { group: "Tech", name: "Git and GitHub" },
  { group: "Tech", name: "APIs" },
  { group: "Tech", name: "UI/UX Design" },
  { group: "Tech", name: "Product Design" },
  { group: "Tech", name: "Product Management" },
  { group: "Tech", name: "Blockchain" },
  { group: "Computer science", name: "Introduction to Computing" },
  { group: "Computer science", name: "Computer Programming I" },
  { group: "Computer science", name: "Computer Programming II" },
  { group: "Computer science", name: "Algorithms" },
  { group: "Computer science", name: "Data Structures" },
  { group: "Computer science", name: "Discrete Mathematics" },
  { group: "Computer science", name: "Software Engineering" },
  { group: "Computer science", name: "Software Requirements" },
  { group: "Computer science", name: "Computer Networks" },
  { group: "Computer science", name: "Databases" },
  { group: "Computer science", name: "Operating Systems" },
  { group: "Computer science", name: "Computer Architecture" },
  { group: "Computer science", name: "Compiler Construction" },
  { group: "Computer science", name: "Theory of Computation" },
  { group: "Computer science", name: "Human-Computer Interaction" },
  { group: "University", name: "Algebra I" },
  { group: "University", name: "Algebra II" },
  { group: "University", name: "Precalculus" },
  { group: "University", name: "Calculus I" },
  { group: "University", name: "Calculus II" },
  { group: "University", name: "Linear Algebra" },
  { group: "University", name: "Statistics" },
  { group: "University", name: "Probability" },
  { group: "University", name: "Use of English" },
  { group: "University", name: "Nigerian Peoples and Culture" },
  { group: "University", name: "Entrepreneurship" },
  { group: "University", name: "Digital Literacy for African Studies" },
  { group: "University", name: "Physics for Engineers" },
  { group: "University", name: "General Chemistry" },
  { group: "University", name: "Technical Report Writing" },
  { group: "University", name: "Research Methods" },
  { group: "University", name: "Agricultural Informatics" },
  { group: "University", name: "Accounting Basics" },
  { group: "University", name: "Economics Principles" },
];

/** Earlier chips included course codes. Map those saves onto the title catalog. */
const LEGACY_TITLES: Record<string, string> = {
  "Databases and SQL": "Databases",
  "CSC 101 Introduction to Computing": "Introduction to Computing",
  "CSC 201 Computer Programming I": "Computer Programming I",
  "CSC 202 Computer Programming II": "Computer Programming II",
  "CSC 205 Data Structures": "Data Structures",
  "CSC 301 Algorithms": "Algorithms",
  "CSC 303 Operating Systems": "Operating Systems",
  "CSC 305 Computer Networks": "Computer Networks",
  "CSC 307 Database Systems": "Databases",
  "CSC 401 Compiler Construction": "Compiler Construction",
  "CSC 405 Human-Computer Interaction": "Human-Computer Interaction",
  "SEN 201 Software Engineering": "Software Engineering",
  "SEN 301 Software Requirements": "Software Requirements",
  "GNS 101 Use of English": "Use of English",
  "GNS 102 Nigerian Peoples and Culture": "Nigerian Peoples and Culture",
  "EMT 201 Entrepreneurship": "Entrepreneurship",
  "MTS 101 Calculus I": "Calculus I",
  "MTS 102 Calculus II": "Calculus II",
  "MTS 211 Linear Algebra": "Linear Algebra",
  "STS 201 Statistics": "Statistics",
};

export const COURSE_SET = new Set(COURSES.map((course) => course.name));

export function canonicalInterest(name: string) {
  const trimmed = name.trim();
  if (COURSE_SET.has(trimmed)) return trimmed;
  return LEGACY_TITLES[trimmed] ?? null;
}

/** Title search, same as the onboarding mock: ignore case and spaces. */
export function filterCourses(query: string) {
  const needle = query.toLowerCase().replace(/\s+/g, "");
  if (!needle) return COURSES;
  return COURSES.filter((course) => course.name.toLowerCase().replace(/\s+/g, "").includes(needle));
}
