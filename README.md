# Knowva AI

Knowva AI — Learn Smarter. Grow Further. A hackathon MVP: pick an AI tutor, turn notes into a study pack, and practise with quizzes. The product surface is student-only. `design/teacher/` is an archive and is not linked from the app. `/teacher` redirects to `/student`.

This tree is the app plus the design handoff. Do not deploy it, and do not create paid cloud resources from this repo. Submission target is about 15 November 2026. “Knowva AI” is a working name.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Leave the Groq and Supabase keys blank to use demo mode. Tutor chat, materials, and Test Centre generation still answer: they validate the body and return **503** with a demo payload (`demo: true`). Creating a tutor does not train a model. It stores a config. Quiz scoring, Test Centre scoring, and resource ranking are rules in code. They do not call a model. Resource links are a curated allowlist. `verified` is true only after the server checks that the URL responds. Anything else is a search query, not a link.

| Variable | Where it is used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key. A publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` works when this is blank. Never put a secret key here |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Server only. Not used to grant another role. Every account stays a student |
| `GROQ_API_KEY` | Server only. Turns on Groq for tutor chat, materials, and test generation. Never commit it |
| `OPENAI_API_KEY` or `LLM_API_KEY` | Server only. Used only when `GROQ_API_KEY` is blank |
| `LLM_BASE_URL` or `OPENAI_BASE_URL` | Optional OpenAI-compatible Chat Completions base URL. Groq defaults to `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Model id. Default `openai/gpt-oss-20b` on Groq, otherwise `gpt-4o-mini` |

Apply both files in `supabase/migrations/` in the Supabase SQL editor when you have a project. The migrations expect Supabase Auth (`auth.users`). They do not create a project. Without Supabase, tutors, packs, and tests live in a server session file (`.data/`, gitignored) keyed by an httpOnly cookie.

`npm run build` typechecks and builds. `npm run check:rules` checks the gap rule, quiz scoring, recommendations, and the assign gate.

## Design

System and tokens: [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md), [`design/tokens.css`](design/tokens.css).

| Surface | Path |
|---|---|
| Landing | [`design/landing.html`](design/landing.html) — screenshots `design/landing-desktop.png`, `design/landing-mobile.png` |
| Student | [`design/student/`](design/student/) — `dashboard.html` is Home v2 (stacked tutors). The earlier flat home is `dashboard.prev.html` |
| Teacher | [`design/teacher/`](design/teacher/) |

The Next.js screens load `design/student/student.css` from the repo (served at `/design/...`). Edit that file to change the app chrome. The React pages are the product. The HTML files stay the mocks. Do not link `design/teacher/`.

Student Home is the stacked tutor desk (Ready, Needs review, In a lesson), with the streak and “Do this next” aside, and line icons in the tab bar. It is not the older flat dashboard.

Product requirements: [`docs/PRD.txt`](docs/PRD.txt). Landing photo reference: [`docs/landing-reference.jpg`](docs/landing-reference.jpg).

### Design notes

Cream `#F7F4EC`, CTA orange `#FF4A1C`, orange ledge `#C7360F`, Poppins 400/500/600. Primary buttons are pills with a solid ledge. Hover moves the button down. Buttons do not grow.

unslop credit: Damir Sokolovsky / @heydamir (CC BY 4.0) for the polish pass. See [`design/student/REPORT.md`](design/student/REPORT.md).

## Frontend Dev handoff

Stack: Next.js App Router, TypeScript, Supabase Auth + Postgres, server LLM calls through the Vercel AI SDK (`generateText` + `Output.object`) and `@ai-sdk/openai` Chat Completions. Keys stay in env.

`/login` is Google sign-in and sign-up when Supabase env is set. New accounts are students. There is no role picker and no lecturer sign-in. After Google sign-in, an incomplete profile goes to `/student/onboarding` (name, username, age, interests). Home greets the saved name. It does not use a hard-coded demo name.

### Routes

| Route | Screen |
|---|---|
| `/` | Landing |
| `/student` | Home. Empty until this student creates a tutor. No preview tutors |
| `/student/tutors` | Tutor library. Create, edit, delete |
| `/student/tutors/new` | Create a tutor. `?id=` edits one |
| `/student/tutor` | Sample tutor chat |
| `/student/tutor/[sessionId]` | Sample course (`prompts`, `python`, `http`, `models`) or a saved tutor id |
| `/student/learn` | Discover resources and saved packs |
| `/student/materials` | Notes or a text PDF in, study pack out |
| `/student/materials/[packId]` | A saved pack (`git-basics` is the sample) |
| `/student/tests` | Test Centre. Start a course MCQ |
| `/student/tests/[id]` | Take a test. Tab bar hidden. Tutor chat locked |
| `/student/tests/[id]/results` | Score, explanations, weak topics |
| `/student/progress` | Test history and topic percentages |
| `/student/quiz/[quizId]` | Practice quiz, separate from Test Centre. `?review=1` or `#review` opens the few-shot results state |
| `/teacher` and `/teacher/*` | Redirect to `/student`. Lecturer screens are not in the product |
| `/student/onboarding` | Name, username, age, and interests. Required until the profile is complete. No tab bar |
| `/login` | Google sign-in. Required before `/student` |
| `/signup` | Redirects to `/login?mode=signup` |

Student tabs: Home, Tutors, Learn, Tests, Progress. Practice quizzes stay off that bar.

Student screens follow `design/student/` (including the PRD v1 mocks: `tutors.html`, `create-tutor.html`, `learn.html`, `test-centre.html`, `test-take.html`, `test-results.html`, `progress.html`). The React routes are thin wiring over those class names. Timed tests are not in this build. Test take is untimed.

### Rules

- A generation is `draft` (shown as “Needs review”) until someone marks it `reviewed`. Assign is refused until then. Regenerating returns it to draft.
- Gap means class average **below 60%**. 60–69 is Watch. 70 and above is On track. The label is computed from the average.
- Every generator shows “Review and edit before you assign it.”
- One quiz score is a signal, not a measure of ability. Below 60% recommends a tutor review, 60–79% more practice, 80% and above a harder set.
- Quiz scores come from the answer key on the server. The client does not send the score.
- A student can keep 8 tutors. The ninth create returns 409.
- A saved tutor answers only its own course. Student focus, goals, and pasted notes are preferences. They cannot override the safety rules.
- Test Centre hides the answer key until submit. Weak topics are those under 60%, the same gap threshold as class averages.
- An open Test Centre paper locks `/api/tutor/chat` until it is submitted. Practice `/api/quiz/score` stays available.
- Resource Agent returns at most 3 primary and 2 alternate items. Preference order is video → YouTube, pdf → textbook, course → syllabus, mixed → a blend. A weak topic limits the set to that topic.

### Types

Defined in [`src/lib/types.ts`](src/lib/types.ts).

Student:

- `Subject` — `{ name, topics: { name, progress }[] }`
- `Tutor` — `{ id, name, course, focus, level: "beginner" \| "intermediate" \| "advanced", explanationStyle: "step_by_step" \| "example_first" \| "concise", goals: ("pass_exam" \| "understand_basics" \| "practise_problems" \| "revise_fast")[], createdAt, updatedAt }`
- `TutorMessage` — `{ role: "user" \| "tutor", short, steps, remember, next? }`
- `StudyPack` — `{ id, subject, topic, summary, flashcards: { q, a }[], questions, outline?, keyTerms?: { term, meaning }[] }`
- `Question` — `{ id, prompt, options, answerIndex, explanation, subject, topic, marks? }`
- `PublicQuestion` — question without `answerIndex` or `explanation`
- `Attempt` — `{ quizId, score, total, missed }` (`missed` is question indexes)
- `TutorCard` — `{ id, subject, level, topic, status: "ready" \| "needs_review" \| "in_lesson", preview, updatedAt, name? }`
- `ResourceBundle` — `{ subject, topic, preference: "video" \| "pdf" \| "course" \| "mixed", primary[], alternates[] }`. Each item is `{ title, type: "youtube" \| "pdf" \| "course" \| "notes" \| "practice", url, searchQuery, why, confidence, verified, role, source }`
- `TestPaper` — open paper with `PublicQuestion[]`
- `TestResult` — `{ score, total, topicBreakdown, weakTopics, items, recommendations, resources, submittedAt }`
- `ProgressReport` — `{ testsTaken, averagePercent, topics, weakTopics, history }`

Teacher:

- `TeacherClass` — `{ id, name, level, subject, studentCount }`
- `Generation` — `{ id, type: "lesson" \| "quiz" \| "marking_guide" \| "notes", title, classId, status: "draft" \| "reviewed", updatedAt }`
- `LessonOutline` — `{ objectives, plan: { stage, minutes, text }[], notes, mistakes }`
- `TeacherQuiz` — `{ questions, markingGuide: { questionId, prompt, points: { text, marks }[], notes }[], assignedClassIds, ... }`
- `TopicStat` — `{ topic, avg, attempts, status: "gap" \| "watch" \| "on_track" }`

### API

All POST. Invalid JSON fields return 400.

| Route | Body | No Groq key |
|---|---|---|
| `GET/POST /api/tutors` | create: `name, course, focus, level, explanationStyle, goals` | 200 or 201. Cap is 409 |
| `GET/PATCH/DELETE /api/tutors/[id]` | patch: any create field | 200. Unknown id is 404 |
| `POST /api/tutor/chat` | `message`, plus `tutorId` or `level, subject, topic`. `mode?` | 503 + `message`. Wrong course is 400. Open test is 423 |
| `POST /api/materials/generate` | `subject, topic`, and `notes` and/or `pdfBase64` | 503 + `pack` with outline, key terms, and 5 questions |
| `GET /api/materials` | — | 200 + saved packs for this session |
| `POST /api/resources` | `subject, topic, preference`, optional `level`, `weakTopic` | 200. Code ranking, not the model |
| `POST /api/tests` | `course, questionCount (1–20), difficulty: easy \| medium \| hard, topics?, format?` | 503 + public `test` (no answer key) |
| `GET /api/tests` and `GET /api/tests/[id]` | — | 200. Open papers omit the key |
| `POST /api/tests/[id]/submit` | `answers: number[]`. Missing or negative means blank | 200 + `result` |
| `GET /api/tests/[id]/results` | — | 200 after submit. 409 before submit |
| `GET /api/progress` | — | 200 + topic rollup |
| `POST /api/quiz/score` | `quizId, subject, topic, questions, answers` | 503 + computed `attempt`, `topicBreakdown`, and `recommendation` |
| `POST /api/recommend` | `subject, topic, score, total`, optional `preference` | 503 + rules-based `recommendation`. `resources` when `preference` is set |
| `POST /api/teacher/generate` | `kind: outline \| notes \| quiz \| marking_guide`, plus level, subject, topic | 503 + a draft. Status is always `draft` |

With `GROQ_API_KEY`, tutor chat, materials, test generation, and teacher generate call Groq and return 200 (test create returns 201). A model failure is 502. Scoring never calls the model. The Resource Agent never asks the model for URLs.

Signed-in users get tutors, quiz attempts, test results, and generated packs written to their own rows. Open test papers for a signed-in student are stored in `test_papers`. Without Supabase, they stay in the server session file. The UI also keeps drafts in `localStorage` so the demo works with no database.

### Database

`profiles` (role `student` or `teacher`, plus `username`, `age`, `interests`), `quiz_attempts`, `saved_materials`, `tutors`, `test_attempts`, `test_papers`. RLS is own-rows only. Clients cannot update `profiles.role`. Open test answer keys live in `test_papers.answer_seal` (ciphertext), not in a readable column. Apply `supabase/migrations/` before expecting onboarding or Test Centre saves. A trigger refuses a ninth tutor. Text PDFs with a text layer can be extracted on `POST /api/materials/generate`. Scanned pages are refused. OCR is not in this build.
