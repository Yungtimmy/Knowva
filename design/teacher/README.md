# Knowva — teacher UI mocks (v1, 2 Nov 2026)
Desktop-first (≥1024px; sidebar collapses to a top bar below 1024). UI-only HTML. Styles: `teacher.css` (imports `../tokens.css`). Yellow accent = teacher. Left sidebar nav: Home · Lesson outlines · Quizzes and marking · Class insights. Every generator screen carries the "Review and edit before classroom use" banner; generated bodies are `contenteditable` in the mock.

| File | Screen | Route |
|---|---|---|
| dashboard.html | Quick actions (lesson outline / quiz / marking guide / topic gaps), recent generations table with review status, subjects taught, saved materials, topic-gap nudge | `/teacher` |
| lesson.html | Class/subject/topic/length form, review banner, editable outline (objectives, timed plan, notes, common mistakes), adjust-draft prompt, Save / Export stubs, "Generate quiz from this lesson" | `/teacher/lesson/new`, `/teacher/lesson/[id]` |
| quiz-gen.html | Quiz generator, MCQ with answer key + student explanation, theory marking guide (`#marking`) with point/mark table, assign to class, "Preview as student" → student quiz shape | `/teacher/quiz/new`, `/teacher/quiz/[id]` |
| class.html | Class stats, topic performance table (avg, attempts, Gap/Watch/On track), most-missed questions, support count. Sample data only, no names | `/teacher/class`, `/teacher/class/[classId]` |

Implied shapes: TeacherClass{id, level(SS1–SS3), subject, studentCount}; Generation{id, type: lesson|quiz|marking_guide, title, classId, status: draft|reviewed, updatedAt}; LessonOutline{objectives[], plan[{stage, minutes, text}], notes, mistakes[]}; TeacherQuiz{questions: Question[] (same as student, + marks), markingGuide[{questionId, points[{text, marks}], notes}], assignedClassIds[]}; TopicStat{topic, avg, attempts, status}.
Rules: `status=reviewed` should be required before assigning to students. Gap = avg < 60%.
Screenshots: `screens/*.png` (1280 wide).
