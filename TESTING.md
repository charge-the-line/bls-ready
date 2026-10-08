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
| `smooth` | No rebuilds while tapping; momentum taps ignored; overshoot never becomes breaths; feedback stays visible; Guided coaches and Recall doesn't; debrief lists your steps |
| `fuzz` | Random actions never crash |
| `browser_check.py` | Every screen at 320 and 390 px, **and all 10 activities played to the end with real taps on buttons found by their visible text** |

Verified to catch planted bugs: two-finger technique marked correct, long pauses not penalized, and an over-long pulse check allowed all fail in `run_all.js`. Broken button markup fails in `browser_check.py`.

## Rules learned the hard way

0. **Design for the finger, not the bot.** A real-person audit of v0.2 found five problems no headless test could: (a) momentum taps after compression #30 landed on the new breath button, delivering both breaths instantly and costing points; (b) penalties appeared and vanished in the same instant, so the score dropped with no explanation; (c) the pad was rebuilt on every compression; (d) an extra tap after a sequence started the pulse-check timer; (e) a 13-second pulse check was penalized silently. The fixes, all guarded by the `smooth` section:
   - **Build once, update in place.** `runBuild()` draws a step one time; `runUpd()` changes only text and colors. 0 rebuilds per compression.
   - **Input guard.** New steps ignore taps for 0.45 s, and their buttons are visibly dimmed (`.cool`).
   - **Mirror the real motion.** After compressions, a "30 ✓ — stop, move to the airway" panel sits where the PUSH pad was, soaking up same-rhythm momentum taps (a timer alone can't, because overshoot arrives at the compression rhythm), and the breath button sits lower.
   - **Feedback persists** in the `run-now` line: every set, pause, pulse check, and penalty, good or bad.
   - **Compressions register on touch-down** (`pointerdown`), the way a feedback manikin measures the push, and pads block scroll and zoom (`touch-action:none`).
   - **Guided coaches live** (rate advice, a visual 110/min metronome, "Breathe now"); **Recall doesn't** (no coaching, and you count the pulse check yourself).

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

## Milestone 1 checks (added October 2026)

Foundation fixes: fonts served from this site, screen wake lock, finger-sized buttons. The `syntax` section (the hub: the plain list) now also proves:
- Fonts self-hosted in `fonts/`, no Google reference, every file in the cache list.
- Screen wake lock: requested when a lesson, station, scenario, or quiz starts, released at home or on the result screen.
- Browser check: any visible button under 44 px tall fails the screen.

## Milestone 2 checks (added October 2026, `record` section)

- Home shows a best-score chip per activity and a readiness count (1 of 15, 7%).
- Score count-up lands on the exact value when animation frames are unavailable; the browser check waits for the number to settle before reading it.
- Haptics follow the shared setting: off means `navigator.vibrate` is never called.
- Settings saved under `preconnect-settings` and applied to `<html>`.
- The debrief uses the report-style `.pc-table`.
- `browser_check.py` also opens the Settings sheet at both widths.

## Milestone 3 checks (added October 2026)

- Shared core: `preconnect-core.js` is loaded before the app script, listed in the service worker's cache, and its header hash matches its body (edit it, re-stamp with the hub's `node tests/core_hash.js`, copy to every repo).
- Spacing: 1, 3, 7, 14, 30 days after each clear at 70+; a miss resets; overdue reads as due.
- Debrief body: compare line (best, last time, new best), metrics table, what cost points, lesson chips, steps table.
- Home chips turn to Due / Again from the spacing schedule and the readiness line counts them; the debrief uses the shared body.

## Milestone 4 checks (added October 2026)

- No new checks; the look CSS moved to the core and `.chip.due` with it.

## Milestone 5 part one checks (added October 2026)

- The existing `lesson` and `quiz` sections now exercise the shared core engines through this module's wrappers; nothing was relaxed.
- The jitter check's floor is 85 per run (average still 97+): with random ±20% tap timing, one run in roughly sixty legitimately earns two or three "aim for steadier" notes, and that feedback is correct, not a bug.

## Milestone 7 checks (added October 2026)

- `drill` section: with a session on, the bar reads "Up: Jo" and the saved lesson is stamped with who, instructor and night. Removing `pcDrillStamp` from `record()` in a scratch copy fails this check.
- Browser check: with a session in storage the picker opens on load and the bar shows after a pick.

## Depth pack checks (added October 2026)

- `content`: the depth-pack facts are the right answer somewhere (drowning = breaths first and a dry chest; pregnancy = belly to her left; pediatric pulse under 60 = CPR; child depth about 2 inches; child pulse carotid or femoral) and "compressions only" is never the right answer for a drowning. The crib scenario's rescue breaths are timed at 1.5–3.5 s, the bag-mask station's at 4.5–8 s.
- `clean`, `human`-style runs and `mistakes` cover the three new activities; infant breaths every 6 s (too slow) and every 1 s (too fast) are caught in the crib scenario. The bot times rescue breaths per step (2.5 s when the step's floor is under 3 s, else 6 s).
- `quiz`: the bank holds 36 questions, exam practice asks 15, every drill's index list resolves to a real question (banks pick by index, so new questions are appended).
- `balance` still runs over the lesson, every choice step and the bank (93 items).
- `record`: readiness is 1 of 19 after one station.
- Browser check plays all 13 activities to the end with real taps; rescue-breath taps follow the step's cadence.

## Milestone 6 checks (added October 2026)

- `sound` section: with sound on, a station run has the metronome ticking during compressions and off afterwards, a bad cue and buzz on a long pulse check, good cues and a closing chime; the Guided bag-mask breathe cue sounds once when the window opens, not before, and again for the next breath; quiz right/wrong tones; with sound off, no metronome and no tones. Removing the penalty cue in a scratch copy fails the station check. The haptics check now expects one preview buzz when the switch is turned on.

## Milestone 9 checks (added October 2026)

- `?drill=special` on load opens the Special situations drill; an unknown id is ignored. Browser check adds a daily-link row.

## Milestone 10 checks (added October 2026)

- Browser check: landscape, Daylight and landscape-settings rows.

## Instructor mode checks (added October 3, 2026)

- `drill`: an adult run on Guided with sound on (a fake AudioContext is armed after boot): the Instructor button is hidden until the switch is on and a run is live; opening the sheet sets `frozenAt` and stops the metronome; a tap 40 s into the freeze is ignored; the pads inject queues exactly one `inj` choice step and a second inject is rendered disabled; after closing, `t0` and the last tap moved by exactly 40 s, the metronome is back, and 20 more compressions at 110/min still score one clean set; Freeze holds until the floating button is tapped; the saved run has `inst:1` and the debrief names the inject.
- Browser check: an `instructor` row at 320 and 390 px (store `{inst:true}`, start Adult CPR, tap the Instructor button).
- Lesson from this row: BLS Ready runs inside the `#runov` overlay (z-index 12), so the floating Instructor button must sit above it (`.fab{z-index:21}`, under `#instov` at 22). At the Charge the Line value of 9 the button rendered but every tap landed on the overlay; the browser check caught it because it taps the button for real.

## Pool patients (added October 8, 2026, `pool` section, BLS Ready 0.15.0)
- Each of the four patients (wet chest, medication patch, implanted device, very hairy chest) scores 100 on Guided and Recall; patients are random (all four seen in 60 starts) and a Drill Night always gets the wet chest.
- The debrief and the saved run name the patient (`v`, `pt`).
- Mistakes happen and cost points (rule 14): a pad over the patch (10, and the step waits for the patch to come off), a pad on the device bulge (10, moved), any other wrong spot (5), analyzing while the AED says Check pads (5). Pressing alone doesn't fix the hairy chest; the second set or the razor does. Fix-up buttons with nothing to fix cost nothing.
- The pad step ignores a tap within half a second, can't be skipped by Continue, and rebuilds nothing while you look.
- Every drowning breath-order line (lesson, exam, pool scenario, pocket reference) carries "to confirm with the 2025 course materials".
- Decision balance holds across all four patients.
- Proven to fail (scratch copy): removing the patch penalty, the tag, the Continue guard, or the Check pads phase each fails its check.
- `browser_check.py` plays the pool with each patient to the end at 320 and 390 px, tapping the pad spots and fix-ups by their labels, and measures the pad screen and the result screen.

