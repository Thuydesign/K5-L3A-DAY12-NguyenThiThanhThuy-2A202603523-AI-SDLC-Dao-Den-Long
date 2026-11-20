# Project instructions
- Shared deterministic gameplay logic lives in src/sim.js; fixed geometry and spawn schedules live in src/maps.js.
- Contract tuning in game.contract.json must exactly match the exported TUNING object.
- Preserve prior phase behavior as tested in npm test; output JSONL must keep event ticks deterministic.
- On simulation changes, run `npm run build`, `npm test`, and the relevant command from `game.contract.json`; store honest evidence in `docs/proof`.
- Contract v1.3 release checks also use `npm run bench -- --seed 42 --duration 30 --out bench.json` and `npm run soak -- --seed 7 --nights 10 --out soak.json`.
- Start the local game and persistent leaderboard with `npm start`; no Python server is needed.
- Add a headless scenario for each gameplay feature. Include the command and expected event/state in the Phase spec.
- Browser-only claims (FPS, menus, audio, settings, visual layout) require real browser evidence.
- Keep runtime dependency-free and compatible with Node.js 18+, Python 3, macOS/Linux.
