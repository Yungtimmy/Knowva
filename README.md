# Knowva AI

Knowva AI is a cream/orange study tutors MVP (hackathon). Students pick a subject tutor, turn notes into materials, and practise with quizzes. Teachers draft lesson outlines, quizzes, and marking guides, then review them before class.

This repository is a UI-only handoff for engineering. Design owner: Frontend Dev. Engineering: Tebas (Tebas owns Next.js). Open the mocks in a browser; do not treat this tree as the app. No deploy until founder go.

## Design

System and tokens: [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md), [`design/tokens.css`](design/tokens.css).

| Surface | Path |
|---|---|
| Landing | [`design/landing.html`](design/landing.html) — screenshots `design/landing-desktop.png`, `design/landing-mobile.png` |
| Student | [`design/student/`](design/student/) — `dashboard.html`, `tutor.html`, `materials.html`, `quiz.html` |
| Teacher | [`design/teacher/`](design/teacher/) — `dashboard.html`, `lesson.html`, `quiz-gen.html`, `class.html` |

Student Home v2 (`design/student/dashboard.html`): stacked subject tutors plus an icon tab bar (Home, Tutor, Materials, Quizzes). The earlier home is kept as `design/student/dashboard.prev.html`.

Product requirements: [`docs/PRD.txt`](docs/PRD.txt). Landing photo reference: [`docs/landing-reference.jpg`](docs/landing-reference.jpg).

## Credit

unslop credit: Damir Sokolovsky / @heydamir (CC BY 4.0) for polish pass.
