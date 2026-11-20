# Project instructions
- Keep `src/sim.js` as the shared source of gameplay rules for browser and headless.
- Contract parameters must match `game.contract.json`.
- Headless output is deterministic JSONL; do not add visual-only entities to simulation output.
- Run `npm run build` and at least one seeded headless scenario after changing simulation.
- Keep runtime dependency-free; target macOS/Linux and Python 3 static hosting.
