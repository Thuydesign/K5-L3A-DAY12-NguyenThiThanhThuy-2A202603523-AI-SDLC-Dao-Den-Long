# Phase 3 evidence

- `npm run build`: passed; Contract v1.2 tuning was checked before the v1.3 release contract bump.
- `npm test`: passed, including fuel, first light, relight, refuel, capacity, safe zone, drain, shade stun score, dawn win/loss, no_flames precedence, deterministic headless snapshots, and unaffected Phase 2 regressions.
- Phase 4 browser benchmark rendered the standard scene and saved `docs/demo/bench.png`; low fuel uses a fuel bar and slow blink, with a reduced-motion override.
- Phase 4 v1.3 tests and current build pass; Phase 3 contract assertions remain in `src/test-contract.js`.
- `git diff --check`: run on the final release commit.
