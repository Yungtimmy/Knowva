# Knowva — student UI mocks (PRD v1, 2 Nov 2026)
Mobile-first, UI-only HTML. Shared styles: `student.css` (imports `../tokens.css`). Bottom tab bar: Home · Tutors · Learn · Tests · Progress. `test-take.html` hides the tab bar and locks tutor chat.

| File | Screen | Route to mirror |
|---|---|---|
| onboarding.html | First run after Google: name, username, age, searchable interests. No tab bar | `/student/onboarding` |
| dashboard.html | Empty Home. Greeting uses the profile name. One Create a tutor CTA. No seed tutors | `/student` |
| dashboard-filled.html | With-tutors reference only. Not the empty state | `/student` when the student has tutors |
| tutors.html | Tutor list with edit/delete | `/student/tutors` |
| create-tutor.html | Create or edit a tutor | `/student/tutors/new` |
| tutor.html | Chat with structured answer (short answer · step by step · remember it) | `/student/tutor` (`/student/tutor/[sessionId]`) |
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
- Course catalog in onboarding is static mock data; the app keeps it in `src/lib/courses.ts`.
