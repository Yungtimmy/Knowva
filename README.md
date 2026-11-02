# Knowva AI

Knowva AI — Learn Smarter. Grow Further. A hackathon MVP for secondary students and their teachers. Students pick a subject tutor, turn notes into a study pack, and practise with quizzes. Teachers draft lesson outlines, quizzes, and marking guides, then review them before class.

This tree is the app plus the design handoff. Do not deploy it, and do not create paid cloud resources from this repo. Submission target is about 15 November 2026. “Knowva AI” is a working name.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Leave the LLM and Supabase keys blank to use demo mode. Generation routes still answer: they validate the body and return **503** with a demo payload (`demo: true`). Quiz scoring and recommendations are rules in code. They do not call a model. With no LLM key they also return 503 plus the computed payload so the screens keep working.

| Variable | Where it is used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key. Never put the service role here |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Sets a teacher role at signup. Without it, new accounts stay students |
| `OPENAI_API_KEY` or `LLM_API_KEY` | Server only. Either one turns on the model |
| `LLM_BASE_URL` or `OPENAI_BASE_URL` | Optional OpenAI-compatible Chat Completions base URL |
| `LLM_MODEL` | Model id for that endpoint. Default `gpt-4o-mini` |

Apply `supabase/migrations/20261102120000_profiles_quiz_attempts_saved_materials.sql` in the Supabase SQL editor when you have a project. The migration expects Supabase Auth (`auth.users`). It does not create a project.

`npm run build` typechecks and builds. `npm run check:rules` checks the gap rule, quiz scoring, recommendations, and the assign gate.

## Design

System and tokens: [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md), [`design/tokens.css`](design/tokens.css).

| Surface | Path |
|---|---|
| Landing | [`design/landing.html`](design/landing.html) — screenshots `design/landing-desktop.png`, `design/landing-mobile.png` |
| Student | [`design/student/`](design/student/) — `dashboard.html` is Home v2 (stacked tutors). The earlier flat home is `dashboard.prev.html` |
| Teacher | [`design/teacher/`](design/teacher/) |

The Next.js screens load `design/student/student.css` and `design/teacher/teacher.css` from the repo (served at `/design/...`). Edit those files to change the app chrome. The React pages are the product. The HTML files stay the mocks.

Student Home is the stacked tutor desk (Ready, Needs review, In a lesson), with the streak and “Do this next” aside, and line icons in the tab bar. It is not the older flat dashboard.

Product requirements: [`docs/PRD.txt`](docs/PRD.txt). Landing photo reference: [`docs/landing-reference.jpg`](docs/landing-reference.jpg).

### Design notes

Cream `#F7F4EC`, CTA orange `#FF4A1C`, orange ledge `#C7360F`, Poppins 400/500/600. Primary buttons are pills with a solid ledge. Hover moves the button down. Buttons do not grow.

unslop credit: Damir Sokolovsky / @heydamir (CC BY 4.0) for the polish pass. See [`design/student/REPORT.md`](design/student/REPORT.md).

## Frontend Dev handoff

Stack: Next.js App Router, TypeScript, Supabase Auth + Postgres, server LLM calls through the Vercel AI SDK (`generateText` + `Output.object`) and `@ai-sdk/openai` Chat Completions. Keys stay in env.

Demo personas on the screens are Ada (student) and Mrs. Adeyemi (teacher). `/login` is the real sign-in when Supabase env is set. Role is stored on `profiles`, not in user-editable metadata. New accounts are students. Teacher needs the service role key.

### Routes

| Route | Screen |
|---|---|
| `/` | Landing |
| `/student` | Home v2, stacked subject tutors |
| `/student/tutor` | Tutor picker and chat |
| `/student/tutor/[sessionId]` | One subject tutor (`maths`, `biology`, `physics`, `english`) |
| `/student/materials` | Notes in, study pack out |
| `/student/materials/[packId]` | A saved pack (`cell-structure` is the sample) |
| `/student/quiz/[quizId]` | One question at a time. `?review=1` or `#review` opens the photosynthesis results state |
| `/teacher` | Teacher home |
| `/teacher/lesson/new` | Lesson generator |
| `/teacher/lesson/[id]` | Editable outline (`quadratics` is the sample) |
| `/teacher/quiz/new` | Quiz / marking-guide generator |
| `/teacher/quiz/[id]` | Questions, key, marking guide, assign (`photosynthesis`, `indices`, `ohms`) |
| `/teacher/class` | Redirects to SS2 A |
| `/teacher/class/[classId]` | Class insights (`ss2a`, `ss2b`, `ss1a`, `ss3a`) |
| `/login` | Email sign-in. Optional |

Bottom tabs: Home, Tutor, Materials, Quizzes. Teacher sidebar: Home, Lesson outlines, Quizzes and marking, Class insights.

### Rules

- A generation is `draft` (shown as “Needs review”) until someone marks it `reviewed`. Assign is refused until then. Regenerating returns it to draft.
- Gap means class average **below 60%**. 60–69 is Watch. 70 and above is On track. The label is computed from the average.
- Every generator shows “Review and edit before classroom use.”
- One quiz score is a signal, not a measure of ability. Below 60% recommends a tutor review, 60–79% more practice, 80% and above a harder set.
- Quiz scores come from the answer key on the server. The client does not send the score.

### Types

Defined in [`src/lib/types.ts`](src/lib/types.ts).

Student:

- `Subject` — `{ name, topics: { name, progress }[] }`
- `TutorMessage` — `{ role: "user" \| "tutor", short, steps, remember }`
- `StudyPack` — `{ id, subject, topic, summary, flashcards: { q, a }[], questions }`
- `Question` — `{ id, prompt, options, answerIndex, explanation, subject, topic, marks? }`
- `Attempt` — `{ quizId, score, total, missed }` (`missed` is question indexes)
- `TutorCard` — `{ id, subject, level, topic, status: "ready" \| "needs_review" \| "in_lesson", preview, updatedAt }`

Teacher:

- `TeacherClass` — `{ id, name, level, subject, studentCount }`
- `Generation` — `{ id, type: "lesson" \| "quiz" \| "marking_guide" \| "notes", title, classId, status: "draft" \| "reviewed", updatedAt }`
- `LessonOutline` — `{ objectives, plan: { stage, minutes, text }[], notes, mistakes }`
- `TeacherQuiz` — `{ questions, markingGuide: { questionId, prompt, points: { text, marks }[], notes }[], assignedClassIds, ... }`
- `TopicStat` — `{ topic, avg, attempts, status: "gap" \| "watch" \| "on_track" }`

### API

All POST. Invalid JSON fields return 400.

| Route | Body | No LLM key |
|---|---|---|
| `/api/tutor/chat` | `level, subject, topic, message, mode?` | 503 + `message: TutorMessage` |
| `/api/materials/generate` | `subject, topic, notes` | 503 + `pack: StudyPack` |
| `/api/quiz/score` | `quizId, subject, topic, questions, answers` | 503 + computed `attempt` and `recommendation` |
| `/api/recommend` | `subject, topic, score, total` | 503 + rules-based `recommendation` |
| `/api/teacher/generate` | `kind: outline \| notes \| quiz \| marking_guide`, plus level, subject, topic | 503 + a draft. Status is always `draft` |

With a key, tutor, materials, and teacher generate call the model and return 200. A model failure is 502. Scoring never calls the model.

Signed-in users get quiz attempts and generated packs written to their own rows. The UI also keeps drafts in `localStorage` so the demo works with no database.

### Database

`profiles` (role `student` or `teacher`), `quiz_attempts`, `saved_materials`. RLS is own-rows only. Clients cannot update `profiles.role`. Text PDF extraction is not in this build. Paste the notes.
