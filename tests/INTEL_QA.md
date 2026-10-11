# Workout Intel QA

## Requirements and checks

- Dates are exact, not workout-name reuse: published 12, 14, 15 October 2026; ambiguous 13, 16–18 visibly pending.
- Mobile day button -> exercises, ordinary day -> overview, tabs preserve scroll; close and keyboard Escape return to calendar.
- Russian title, English, concise description, equipment and linked Reddit attribution; Hammer has 9 station cards, each with Upper and Lower together, and both successive movements per side. Preserve hand-release variation and identical consecutive Lower variants.
- Mobile 375 and desktop 1280, light/dark; long English wraps, header/close/tabs accessible, single content scroll.
- Admin off -> on -> reload -> off; another account reads same setting. No trainer switch.
- Forged client role, non-admin manager, expired/bad token, demoted admin, API outage, invalid flag, version conflict, lock contention: server denies mutation.
- Settings network error and old backend: exercises hidden, overview still usable; admin sees retry/deployment guidance.
- No requests during tests reach production. Real deployment of Apps Script requires owner action.

Exploratory scenarios: switch tabs while a settings refresh completes; disable globally while a trainer has the exercise list open. Inspect focus return and late settings responses after account change.

## Executed

- Server settings: 10 offline checks passed; previous 51 schedule regression checks remain passing.
- Published data: 39 station cards, 66 movements/variants across 12, 14 and 15 October; four ambiguous days withheld. Exact Hammer pair assertions passed.
- Browser: admin off/on/reload/off; separate trainer has no switch; disabling while trainer list is open returns to overview after settings refresh.
- Browser: old backend hides feature with deployment message; retry recovers. Unchanged polling preserves expanded timing.
- Tab scroll position restored (900px before/after). Keyboard Escape, timing disclosure, pending-day message and next-week no-reuse verified.
- Server login UI tested with synthetic credentials and intercepted responses. No real credentials or production mutations used.
- Mobile 375px and desktop 1280px screenshots reviewed in both themes; no horizontal overflow at these sizes, no page JavaScript errors.

## Setup mode QA inventory

- Two-column equipment cards, no exercise prose; Upper/Lower union removes duplicates but keeps supports and explicit per-exercise quantities.
- Day has Setup and Exercises entry points; click station -> matching detailed station -> Setup returns to previous position.
- Three tabs support keyboard arrows, Home/End, focus trap, Escape and focus return.
- Tomorrow shortcut uses Europe/Moscow, can cross phase/year boundary; unavailable or unreviewed dates never borrow another day's setup.
- Shared admin switch covers both modes; off/error/old backend hide setup and tomorrow shortcut. Unchanged polling preserves the current tab and scroll.
- Screenshots at 375px and 1280px, both themes; verify 320px fit.
- Exploratory: station drilldown followed by refresh of unchanged setting; admin disables while another user's setup is open.

Setup checks executed: Hammer has 9 deduplicated equipment cards; station 3 opens its paired details; Loyals station 18 drilldown restores setup scroll (195px). Tomorrow correctly opens 12 October / Loyals even from Phase 11 / Hammer; pending Romans has no setup cards. Admin off hides both entry points and tomorrow. ArrowRight/Home navigate the three tabs. No page errors or horizontal overflow at 375px/1280px; mobile Hammer's nine cards fit without scrolling at 375×812.

## Equipment naming regression

User screenshot exposed raw Set-based deduplication in the Exercises summary, despite normalization already existing in Setup. All summary and detail equipment labels now use WorkoutEquipment. Loyals summary must be exactly Гантели / Гиря / Диск; bodyweight is a station state, not an equipment type. Singular/plural, case and spaces normalize together. Explicit two-YBell requirement survives on stations but is not presented as a workout-wide quantity.

## Full week 12–18 October completion

The owner supplied the complete numbered RTF. This supersedes the earlier partial-week/pending-day results above. The fixture oct-12-18-2026.json is mechanically extracted from its eight numbered lists; every English movement is compared verbatim, including compound movements and both Hammer sides. Foxtrot fixes restore "under grip" to YBell and "seated" to BikeErg. Devil's Peak has 12 main stations plus four YGIG stages; the source calls the stages erg relays but lists plate burpees for the fourth, preserved with a visible note rather than silently inventing an erg.

QA inventory:
- All seven dates: setup/exercise buttons, correct card counts, populated Russian text/equipment, no pending labels.
- Devil's Peak: 12 + 4 label; Э1–Э4 cards; click Э4 opens plate burpee, return restores setup; all kit appears in summary.
- Romans: Landmine support, deadball + band, two kettlebells, heel/calf supports.
- Mkatz: bench Arnold press remains one station; suspension support + box; GHR composite stays together.
- Mobile 375px light/dark and desktop 1280px screenshots; 320px horizontal fit.
- Off-path: next week does not borrow this week's data; admin flag off hides entries and on restores them.

Executed: all seven dates expose both buttons, with setup/detail card counts 18/9/12/9/10/16/9. All 110 source records match the RTF fixture exactly. Devil's Peak shows 12 stations + 4 stages; Э4 opens plate burpees and returning restores scroll 247px. Reviewed Romans mobile light, Mkatz mobile dark/desktop, and the full relay section. No JS errors or horizontal overflow at 320px. Next week has zero exercise actions and seven no-data labels. Admin off/on hides/restores all seven days. All API actions used intercepted fixture responses; no production settings changed.
