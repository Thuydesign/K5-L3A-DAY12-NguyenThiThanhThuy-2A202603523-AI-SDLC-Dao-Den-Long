# Phase 1 evidence

Generated from this checkout. Raw input scenarios and JSONL outputs are stored beside this report. Repeat with `npm test`.

| Check | Result | Artifact |
|---|---|---|
| Build syntax and tuning contract | PASS: `npm run build` prints “Build and contract check passed.” | command output |
| Pickup, deposit, light final lantern, win | PASS: pickup, deposit, lantern_lit, and game_over: won; end at tick 2, score 489 | `run-win.jsonl` |
| Determinism | PASS: same seed, scenario, and inputs produced byte-identical JSONL | `determinism-a.jsonl`, `determinism-b.jsonl` |
| Pulse stuns shade | PASS: pulse event lists S1 at tick 1 | `run-pulse.jsonl` |
| Shade hit reduces flame | PASS: player_hit reports flames 2 at tick 1 | `run-hit.jsonl` |
| Invalid scenario handling | PASS: process exits with code 2 | repeatable check in `npm test` |
| Static hosting | PASS: local Python server returned HTTP 200 and served the game title | local HTTP smoke check |

Interactive browser playthrough and screenshot have not been captured in this environment; that visual check remains unverified.
