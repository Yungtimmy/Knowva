/** Swap this placeholder for a real contact address. Legal copy reads it from here. */
export const CONTACT_EMAIL = "TODO";

export const PATH = {
  home: "/",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
  login: "/login",
  signup: "/signup",
  createTutor: "/signup?next=/student/tutors/new",
  getStarted: "/signup?next=/student",
  tutors: "/student/tutors",
  tests: "/student/tests",
  media: "/student/media",
} as const;

/** Signed-out visitors can open these pages. Auth must not redirect them. */
export const PUBLIC_PATHS = [PATH.faq, PATH.terms, PATH.privacy] as const;

export function isPublicPath(pathname: string) {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}
