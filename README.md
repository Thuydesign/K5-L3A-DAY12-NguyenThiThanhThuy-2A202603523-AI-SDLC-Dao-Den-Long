# Dao Den Long - Phase 2

A dependency-free third-person browser game built with Node.js and Python's static HTTP server. Requires Node.js 18+ and Python 3.

## Run

1. Run `npm run build`.
2. Run `python -m http.server 8000` (Windows: `py -m http.server 8000`).
3. Open http://localhost:8000 in a modern browser.

## Controls

WASD or arrow keys: move; Space: jump; E: deposit motes at a nearby lantern; Q: light pulse; Shift: dash; Esc or P: pause; drag mouse: rotate camera. Carry capacity is 10; each lantern needs 3 motes.

Score: +10 per deposited mote, +100 per lit lantern, +5 per shade hit, plus the win bonus defined in game.contract.json.

## Headless contract

`node src/headless.js --seed 7 --night 2 --ticks 600 --out proof.jsonl`

Optional flags: `--scenario file.json`, `--inputs file.json`, `--snapshot-every 10`. Run `npm test` and `npm run benchmark` for automated contract verification and full-night timings.

## Project notes

Phase 2 evidence is in docs/proof/phase-2.md. Explicit assumptions are in docs/notes/phase-2-assumptions.md. Replace the team placeholder in game.contract.json with the actual student ID and name before submission.
