# BLS Ready — testing guide

The fourth module in the family (Charge the Line, Patient Contact, Bleed Control, BLS Ready). Read this before changing the app.

## Run the tests

You need [Node.js](https://nodejs.org) 18 or newer. No install step needed.

```
node tests/run_all.js          # everything — under a second
for i in 1 2 3 4 5; do node tests/run_all.js | tail -1; done    # before every release
```

**Real-browser check — required before release for this app** (see rule 1):

```
pip install playwright && playwright install chromium
python3 tests/browser_check.py
```

## What the suite checks

| Section | What it proves |
|---|---|
| `syntax` | The script compiles; the trademark notice is present; the app name doesn't use AHA trademarks |
| `content` | **2025 guideline facts can't regress:** two-finger infant compressions are never a right answer; choking teaches back blows first; rate, depth, and ratios are correct; the pulse check is 5–10 seconds |
| `balance` | The right answer is neither usually the longest nor usually the shortest (all 66 questions) |
| `lesson` | All 14 slides work and score correctly |
| `clean` | All 10 activities score 100 for a competent rescuer (110/min, 7-second checks, quick breaths) |
| `mistakes` | Rate 135 or 90, a 12- or 3-second pulse check, a 14-second pause, fast breaths, bagging every 3 or 10 seconds, out-of-order steps, and wrong decisions are all caught |
| `jitter` | Human-like uneven tapping at a good average isn't unfairly punished |
| `quiz` | Exam practice scores 100 when right and 0 when wrong; every question has three distinct options |
| `record` | Results save; the CSV export works |
| `fuzz` | Random actions never crash |
| `browser_check.py` | Every screen at 320 and 390 px, **and all 10 activities played to the end with real taps on buttons found by their visible text** |

Verified to catch planted bugs: two-finger technique marked correct, long pauses not penalized, and an over-long pulse check allowed all fail in `run_all.js`. Broken button markup fails in `browser_check.py`.

## Rules learned the hard way

1. **Bots that skip the buttons can't catch button bugs.** The headless bots hand answers straight to the engine. A skills-test step containing quotation marks ("Are you okay?") broke its button's hidden data, so in the real app the step could never be completed, and all 39 headless checks still passed. Only completing every activity in a real browser, by clicking buttons found by their visible text, catches this. That's why `browser_check.py` is required here.
2. **Measure rate the way a feedback device does.** Scoring each compression on its own interval punished normal human variation. A rolling window of five compressions is fair and realistic.
3. **Everything the rescuer does is timed on the real clock:** pulse checks, pauses, compression rate, breath timing. Tests use a controllable clock (`global.__T` headless, a fake `NOW()` in the browser).
4. **Don't let length give the answer away.** The right answer was longest in 40 of 66 questions before the rebalance. Run `balance` after writing anything.
5. **Write everything independently.** AHA course videos, manuals, exam questions, and skills-test checklists are copyrighted. We follow the published 2025 guideline science and the course's structure, in our own words. Never copy AHA exam questions or checklists.

## How it's organized (one file: `index.html`)

- `LESSON`: 14 slides with checks.
- `DEFS`: every station and scenario as a list of steps. Step types: `info`, `choice`, `seq`, `timer`, `tap`, `breaths`, `rhythm`, `alt`.
- `runStart`/`runAct`/`runRender`: the step engine, with scoring and metrics (rate, time in zone, pauses, time to first compression, pulse-check durations).
- `EXAM` and `DRILLS`: question banks; plus reference, About, and progress/CSV.
