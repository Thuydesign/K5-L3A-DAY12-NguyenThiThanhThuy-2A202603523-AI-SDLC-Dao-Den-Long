# ADR-0001: Fuel ledger and dawn victory

Status: accepted for Phase 3 (Ticket-03).

Ticket-03 replaces permanent lit flags as the whole lantern state. Each lantern now stores fuel in integer sixtieths, with a public snapshot rounded to one decimal. An unlit lantern has zero fuel; its separate ever_lit and deposited fields preserve relight history and partial first-light progress. First light consumes ten motes; relight consumes five; each successful lighting raises capacity by two up to twenty.

Dawn is now the only victory point. Lighting every lantern early does not end a night. The final tick applies fuel decay and all remaining simulation updates, then checks no_flames before the dawn ratio. A win requires at least ceil(0.6 * lantern count) lit lanterns. A winning night awards the new per-light fuel/flame score; losses discard current-night score.

This changes scoring snapshots, event streams, lantern snapshots, shade states and end reasons, so the contract is version 1.2. Phase 2 test expectations for all-lit victory, fixed carry capacity, old score totals and time bonuses were replaced by explicit v1.2 assertions. Unchanged pause/dash/charm/Drifter/map/wind regressions remain enabled.
