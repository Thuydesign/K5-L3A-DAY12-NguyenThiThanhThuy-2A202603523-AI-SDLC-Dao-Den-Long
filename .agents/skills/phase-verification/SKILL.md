# Phase verification workflow

For each implementation phase:
1. Read the supplied ticket, contract, repository instructions and existing proof.
2. List acceptance criteria and identify missing numeric or visual requirements; record assumptions in docs/notes.
3. Keep browser and headless gameplay rules in src/sim.js and fixed geometry in src/maps.js.
4. Add one deterministic headless scenario for every new gameplay mechanic.
5. Run npm run build, npm test and npm run benchmark.
6. Record actual commands and results in docs/proof. Mark browser-only checks pending unless measured in a real browser.
7. Inspect git diff --check and ensure earlier phase tags remain unchanged.
8. Update the specification and project instructions when the contract changes.
