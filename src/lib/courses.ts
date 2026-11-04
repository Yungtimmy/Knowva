export type CourseGroup = "Tech" | "Computer science" | "FUNAAB and university";

export type CourseOption = {
  name: string;
  group: CourseGroup;
};

/** Static catalog from design/student/onboarding.html. Search filters this list. */
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
  { group: "Tech", name: "Databases and SQL" },
  { group: "Tech", name: "UI/UX Design" },
  { group: "Tech", name: "Product Design" },
  { group: "Tech", name: "Product Management" },
  { group: "Tech", name: "Blockchain" },
  { group: "Computer science", name: "CSC 101 Introduction to Computing" },
  { group: "Computer science", name: "CSC 201 Computer Programming I" },
  { group: "Computer science", name: "CSC 202 Computer Programming II" },
  { group: "Computer science", name: "CSC 205 Data Structures" },
  { group: "Computer science", name: "CSC 301 Algorithms" },
  { group: "Computer science", name: "CSC 303 Operating Systems" },
  { group: "Computer science", name: "CSC 305 Computer Networks" },
  { group: "Computer science", name: "CSC 307 Database Systems" },
  { group: "Computer science", name: "CSC 401 Compiler Construction" },
  { group: "Computer science", name: "CSC 405 Human-Computer Interaction" },
  { group: "Computer science", name: "Computer Architecture" },
  { group: "Computer science", name: "Theory of Computation" },
  { group: "Computer science", name: "Discrete Mathematics" },
  { group: "FUNAAB and university", name: "SEN 201 Software Engineering" },
  { group: "FUNAAB and university", name: "SEN 301 Software Requirements" },
  { group: "FUNAAB and university", name: "GNS 101 Use of English" },
  { group: "FUNAAB and university", name: "GNS 102 Nigerian Peoples and Culture" },
  { group: "FUNAAB and university", name: "EMT 201 Entrepreneurship" },
  { group: "FUNAAB and university", name: "Digital Literacy for African Studies" },
  { group: "FUNAAB and university", name: "MTS 101 Calculus I" },
  { group: "FUNAAB and university", name: "MTS 102 Calculus II" },
  { group: "FUNAAB and university", name: "MTS 211 Linear Algebra" },
  { group: "FUNAAB and university", name: "STS 201 Statistics" },
  { group: "FUNAAB and university", name: "Probability" },
  { group: "FUNAAB and university", name: "Physics for Engineers" },
  { group: "FUNAAB and university", name: "General Chemistry" },
  { group: "FUNAAB and university", name: "Technical Report Writing" },
  { group: "FUNAAB and university", name: "Research Methods" },
  { group: "FUNAAB and university", name: "Agricultural Informatics" },
  { group: "FUNAAB and university", name: "Accounting Basics" },
  { group: "FUNAAB and university", name: "Economics Principles" },
];

export const COURSE_SET = new Set(COURSES.map((course) => course.name));

/** Same match as the onboarding mock: ignore case and spaces, include the group. */
export function filterCourses(query: string) {
  const needle = query.toLowerCase().replace(/\s+/g, "");
  if (!needle) return COURSES;
  return COURSES.filter((course) =>
    `${course.name}${course.group}`.toLowerCase().replace(/\s+/g, "").includes(needle),
  );
}
