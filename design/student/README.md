# Knowva — student UI mocks (PRD v1, 2 Nov 2026)
Mobile-first, UI-only HTML. Shared styles: `student.css` (imports `../tokens.css`). Bottom tab bar: Home · Tutors · Learn · Tests · Progress. `test-take.html` hides the tab bar and locks tutor chat.

| File | Screen | Route to mirror |
|---|---|---|
| dashboard.html | Home: streak, subjects + topic progress, "Do this next", recent tutor chats, study packs | `/student` |
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
