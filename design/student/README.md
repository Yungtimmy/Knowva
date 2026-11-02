# Knowva — student UI mocks (v1, 2 Nov 2026)
Mobile-first, UI-only HTML. Shared styles: `student.css` (imports `../tokens.css`). Bottom tab bar: Home · Tutor · Materials · Quizzes.

| File | Screen | Route to mirror |
|---|---|---|
| dashboard.html | Home: streak, subjects + topic progress, "Do this next" (rules: lowest recent quiz score → tutor/retake), recent tutor chats, study packs, quiz scores | `/student` |
| tutor.html | Level/subject/topic pickers, chat with structured answer (short answer · step by step · remember it), Ask simpler / example chips, practice CTA | `/student/tutor` (`/student/tutor/[sessionId]`) |
| materials.html | Paste notes or PDF stub → summary, flip flashcards, MCQ preview, "Take as a quiz" | `/student/materials` (`/student/materials/[packId]`) |
| quiz.html | One question at a time, live score, per-answer explanation, results with wrong-answer review, tied to subject/topic (`quiz.html#review` shows results state) | `/student/quiz/[quizId]` |

Data shapes implied: Subject{name, topics[{name, progress}]}, TutorMessage{role, short, steps[], remember}, StudyPack{summary[], flashcards[{q,a}], questions[]}, Question{prompt, options[], answerIndex, explanation, subject, topic}, Attempt{quizId, score, missed[]}.
Screenshots: `screens/*.png` (420 wide).
