# Knowva — student UI mocks (PRD v1, 2 Nov 2026)
Mobile-first, UI-only HTML. Shared styles: `student.css` (imports `../tokens.css`). Bottom tab bar: Home · Tutors · Learn · Tests · Progress. `test-take.html` hides the tab bar and locks tutor chat.

| File | Screen | Route to mirror |
|---|---|---|
| onboarding.html | First run after Google: name, username, age, searchable interests. No tab bar | `/student/onboarding` |
| dashboard.html | Empty Home. Greeting uses the profile name. One Create a tutor CTA. No seed tutors | `/student` |
| dashboard-filled.html | With-tutors reference only. Not the empty state | `/student` when the student has tutors |
| tutors.html | Tutor library with a colour mascot per tutor | `/student/tutors` |
| create-tutor.html | Create a tutor | `/student/tutors/new` |
| tutor.html | Saved chat history. Mascot opens media. Search sits beside it | `/student/tutor/[sessionId]` |
| tutor-search.html | In-chat search bar under the tutor name. Jump and highlight the match | `/student/tutor/[sessionId]?search=1` |
| tutor-media.html | Links, PDFs, and images from that tutor's thread | `/student/tutor/[sessionId]/media` |
| tutor-profile.html | Level, subject, topic, and other tutor settings. Not on the chat page | `/student/tutor/[sessionId]/profile` |
| learn.html | Discover and Saved | `/student/learn` |
| materials.html | Paste notes or PDF stub → summary, flip flashcards, MCQ preview, "Take as a quiz" | `/student/materials` (`/student/materials/[packId]`) |
| test-centre.html | Formal Test Centre | `/student/tests` |
| test-take.html | Timed test, no tab bar, tutor locked | `/student/tests/[id]` |
| test-results.html | Score and next steps | `/student/tests/[id]/results` |
| progress.html | Scores and test history | `/student/progress` |
| quiz.html | Informal Practice quiz (not a graded test). One question at a time (`quiz.html#review` shows results) | `/student/quiz/[quizId]` |

Data shapes implied: Subject{name, topics[{name, progress}]}, TutorMessage{role, short, steps[], remember}, StudyPack{summary[], flashcards[{q,a}], questions[]}, Question{prompt, options[], answerIndex, explanation, subject, topic}, Attempt{quizId, score, missed[]}.
Screenshots: `screens/*.png` (420 wide).

## Update 4 Nov 2026 — onboarding + empty Home
- `onboarding.html`: first-run after Google sign-up (name, username, age, searchable interests). Save → `/student`.
- `dashboard.html` is now the empty state (no seed tutors; greeting = profile display name). `dashboard-filled.html` keeps the with-tutors reference.
- Course catalog in onboarding is title-only (no course codes). The app keeps the same 55 titles in `src/lib/courses.ts`.
- `learn.html`: Discover shows curated cards (type, Curated badge, title, source, why, Open and Save). No search stubs.

## Update 4 Nov 2026 — tutor chat locks
- Opening a tutor reloads that tutor's saved thread.
- The cloud mascot opens Media. Search is beside it and jumps to the exact word in the thread.
- Level, subject, and topic stay on the tutor profile.
- Each tutor keeps its own mascot colour (Maths `#2412B0`, Biology `#FF4A1C`, Physics `#FBE062`, English `#2F6B4F`).
