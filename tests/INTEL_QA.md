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
