# Phase 1 assumptions
- World coordinates are meters; the island edge is visual only and falling is disabled.
- Five lanterns are arranged evenly around Mây; each needs 3 motes. Motes are capped at 5 carried.
- Night lasts 300 s; Mây starts with 3 flames. A shade hit costs one flame, grants 1.5 s invulnerability, and drops floor(50%) of carried motes.
- Pulse spends one carried mote, stuns nearby shades for 2 s, pushes them 2 m, and has a 1 s cooldown.
- Lit lanterns protect a 4 m radius. Score values are listed in game.contract.json.
- Interact affects only the closest unlit lantern in range. Headless uses the same fixed 60 Hz simulation as the browser.
- Visuals are a lightweight projected 3D scene drawn on Canvas so the game has no network or GPU dependency.
