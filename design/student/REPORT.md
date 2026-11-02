# Student dashboard — stacked tutor cards
Layout borrow (bones only): vertical stack of agent cards with slight overlap (-14px margin, z-index cascade, small x-offsets), card anatomy = avatar + name + time + status + short message + Expand. Ref colours/glows not used.

Unslop passes (direction by Tebas, method credit: unslop by @heydamir)
1. Spacing: one 14/16px rhythm; aside demoted to thin outlined minis.
2. Colour: cream #F7F4EC, surface #FFFDF8 / #FFF8EC, ink #1C1B19, CTA #FF4A1C (deep #C7360F), cloud blue #2412B0, yellow #FBE062. No gradients, no glows.
3. Icons: no emoji; cloud mascot faces per tutor (blue/orange/yellow/ink tile).
4. Copy: "Morning, Ada", calm, no exclamation marks.
5. Type: Poppins 600/500/400 only, no uppercase tracking.
6. Layout: stack dominates Home; streak + Do this next sit below (mobile) / sticky aside (desktop >=900px).
7. Details: ink 1.5px outlines + 4px ink ledge on cards; wax-ledge status pills (orange In a lesson, yellow Needs review, cream Ready).
8. Visuals: signature cloud mascot on every card.
9. Motion: 3px lift on hover only; buttons press down, never grow. Single orange CTA (Continue lesson).
Previous version kept as dashboard.prev.html.

## PRD v1 update (2 Nov 2026)
New: create-tutor, tutors, learn, test-centre, test-take, test-results, progress (.html, screens/*.png). Tabbar is now Home · Tutors · Learn · Tests · Progress on every page. The dashboard CTA links to create-tutor. quiz.html is labelled Practice.
Suggested routes: /student/tutors, /student/tutors/new, /student/learn, /student/tests, /student/tests/[id], /student/tests/[id]/results, /student/progress.
Test take: hide the tabbar and lock the tutor chat. Back/leave ends the test.
