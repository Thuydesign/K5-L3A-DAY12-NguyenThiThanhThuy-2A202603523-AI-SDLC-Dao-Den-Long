# Changelog

## v1.0.0 (Phase 4)
- Bumped the runnable contract to v1.3; added repeatable 30-second browser benchmark and ten-night in-process soak tools.
- Added persistent local top-10 leaderboard, tie ordering, validation, and JSON export.
- Added saved key remapping, color-distinguishable palette, reduced motion, larger UI text, and visual accessibility alerts.
- Added run documentation, test evidence, packaging, and four-phase retrospective.
- Added a reproducible live browser gameplay demo recorder and attached a 39-second H.264 MP4 release demonstration.
- Breaking changes from v1.2: contract version is now 1.3 and adds `bench_cmd` and `soak_cmd`; v1.2 simulation rules and snapshots remain in force.

## Phase 3 - Contract 1.2 (breaking)
- Replaced permanent lantern lighting with fuel, refuel and relight state.
- Replaced all-lit instant victory with dawn survival and the 60% light threshold.
- Replaced the scoring formula and added dynamic carry capacity.
- Added draining shades, v1.2 events and snapshot/scenario fields.
- Updated and retained regression tests for unaffected Phase 2 mechanics.

## Phase 2 - Contract 1.1
- Added three maps, charm/dash, pause, Drifters, wind and the v1.1 headless fields.

## Phase 1 - Contract 1.0
- Added the first lantern-island game, deterministic simulation and JSONL headless runner.
