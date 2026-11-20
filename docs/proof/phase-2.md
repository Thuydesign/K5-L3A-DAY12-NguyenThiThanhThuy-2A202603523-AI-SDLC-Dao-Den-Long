# Phase 2 evidence

## Automated checks

- `npm run build`: passed; syntax and Contract v1.1 tuning check.
- `npm test`: passed; Phase 1 regression, scoring, pause freeze/resume, dash, charm pickup/respawn, Drifter states/steal/drop, spawn schedules, maps/pads, fall, wind, deterministic outputs and validation.
- `npm run benchmark`: passed. Night 1: 18,000 ticks in 552 ms; Night 2: 21,600 ticks in 645 ms; Night 3: 21,600 ticks in 729 ms. Each benchmark ended at dawn after a loss; these are headless simulation timings, not browser FPS.

## Browser and performance checks

- Menu/intro/three-night progression/retry: pending interactive browser check.
- Pause and settings persistence: pending interactive browser check.
- Sound events and HUD placement: pending interactive browser check.
- Average FPS at 1280x720: pending real browser measurement.

Pending items are not represented as passed.
