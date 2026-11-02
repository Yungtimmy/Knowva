# Knowva AI — Design System v1 (2 Nov 2026)
Source: /workspace/knowva/landing-reference.jpg, PRD.txt. Tokens: tokens.css.

## Palette
| Token | Hex | Use |
|---|---|---|
| cream | #F7F4EC | page bg (with #E4DFD2 dot grid, 22px) |
| surface | #FFFDF8 | cards, nav pill |
| ink | #1C1B19 | headlines (never #000) |
| ink-2 / ink-3 | #4A4740 / #7A766C | body / meta |
| line | #E8E3D6 | borders |
| orange (CTA) | #FF4A1C | primary CTA, logo, hero mascot |
| orange-deep | #C7360F | CTA ledge shadow, pressed |
| orange-soft | #FFE3D8 | highlights, chips |
| cloud blue | #2412B0 | mascot, student accent |
| cloud yellow | #FBE062 | mascot, teacher accent |
| window dots | #2557D6 #E8673C #F2B833 | product frame |

## Type
Poppins. H1 600, 40/1.1 mobile → 64 desktop, tracking -0.02em. Body 400 17/1.5. Meta 500 14. Two weights max per screen.

## Logo
"Knowva" wordmark, Poppins 600, orange #FF4A1C, mortarboard cap tilted on the K. Min height 24px. Never on orange backgrounds; reverse to cream.

## Mascots
Blobby clouds (blue, orange, yellow), two oval eyes with black pupils looking sideways. Hand-drawn speech bubbles (white, 2px ink stroke, offset shadow).

## Button laws
- Primary: pill, orange fill, cream text 600, 4–6px solid orange-deep ledge below.
- Hover: translateY(2px) + ledge shrinks. Active: scale(.98). Buttons never grow.
- One primary per view. Secondary = ink outline pill.
- Labels are verbs: "Create a Tutor", "Start quiz", "Make notes".

## Tone bible
Plain, friendly, direct, like a good older sibling who tutors. Short sentences. No exclamation marks in UI. Speak to the outcome (grades, time saved, understanding).
Banned words: seamless, empower, unlock, revolutionize, leverage, elevate, supercharge, cutting-edge, game-changer, delve.

## Rejection list
No gradient text · no scale(1.02) hover · no pure #000/#FFF as only colors · no SaaS cyan/purple glows · no 3-column feature grids (use stacked beats or 2-up) · no emoji labels · no uppercase tracked eyebrows · no "New ✨" badges.

## Surfaces
- Student: warmer, mascot-led. Blue cloud accent. Big chat input, quiz cards one-at-a-time, streak/progress on dashboard. Mobile first.
- Teacher: calmer, denser. Yellow accent, fewer mascots, tables for classes/quizzes, "Generate lesson outline / quiz / marking guide" actions. Desktop first, still responsive.
