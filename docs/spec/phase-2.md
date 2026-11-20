# Phase 2 specification - Ticket-02, Contract v1.1

Authoritative gameplay rules are implemented in src/sim.js and shared by browser and headless mode. Numeric decisions omitted from the ticket are listed in docs/notes/phase-2-assumptions.md.

| ID | Requirement | Acceptance evidence |
|---|---|---|
| P2-01 | Standard scoring and total score across won nights | npm test; win score scenario |
| P2-02 | 60 Hz tick order and pause freezes sim time, cooldowns, spawns and TTL | npm test; pause freeze/resume scenario |
| P2-03 | Night 1 circle, five lanterns, 24 motes, shade schedule and cap | spawn schedule and Phase 1 regression |
| P2-04 | Night 2 islands, bridge, six lanterns, 24 motes, pads and shades | map/pad scenario and coordinate data in src/maps.js |
| P2-05 | Night 3 tiers, ramps, pad, bell tower, 30 motes, wind and shades | ramp/pad/wind scenarios and coordinate data in src/maps.js |
| P2-06 | Drifter idle/chase/flee/removed, steal, pulse response and drop | Drifter scenarios in npm test |
| P2-07 | Wind Charm pickup/refresh/respawn and dash behavior | charm and dash scenarios in npm test |
| P2-08 | Menu, intro, night results, retry, next night and sunrise | Interactive browser verification pending |
| P2-09 | Pause/settings controls, persisted volume and sensitivity, generated audio | Interactive browser verification pending |
| P2-10 | HUD, palette, warning, offscreen lantern arrow and 30 FPS target | Visual/FPS verification pending |
| P2-11 | Contract v1.1 fields, CLI nights, scenarios, input edges and events | npm run build and npm test |
| P2-12 | Full-night headless run completes within 30 s and at most 21,600 ticks | npm run benchmark |

Contract v1.1 supports nights 1-3, snapshots for wind/player/motes/Drifters/charms, dash and pause inputs, scenario initialization, and the required event types. Unknown or invalid input follows the documented headless error code.
