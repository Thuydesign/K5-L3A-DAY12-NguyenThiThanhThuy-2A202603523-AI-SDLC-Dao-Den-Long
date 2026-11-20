# Four phase retrospective

## Evaluation

Phase 1 established the playable island, deterministic simulation, and headless JSONL contract. Phase 2 added night variants and movement/combat mechanics while preserving deterministic runs. Phase 3 changed the core loop from lighting lamps to keeping enough lamps fueled until dawn; storing fuel as integer sixtieths avoided cumulative floating point drift. Phase 4 added persistence, accessibility options, benchmark and soak runners, packaging, and release notes.

The most effective AI workflow was to use the JSON contract and deterministic scenarios as an executable specification. Regression scenarios made design changes observable and helped preserve mechanics that were not superseded. A long-running soak also exposed memory growth that a short smoke test would miss. The least effective part was initially treating code that parsed as code that worked: a scenario property assignment silently missed the intended field, and a UI reference to the wind state prevented the browser scene from running correctly. Repeated headless tests, browser benchmark runs, server-side integration tests, and visual inspection found those errors.

## Harness and process

The most useful harness was `AGENTS.md`'s contract-first guidance, reinforced by `game.contract.json`, `src/test-contract.js`, and the deterministic headless runner. The repository's `phase-verification` skill reinforced recording proof and keeping earlier phase tags intact. The Phase 3 ADR records the state-model and victory change. `npm run build` catches JavaScript syntax errors and contract/tuning drift; Phase 4's leaderboard test exercises HTTP validation, ordering, persistence, and export. No AI hooks were configured.

## AI use and limits

The exact token and API cost totals are not exposed in this workspace, so they cannot be reported as measured values. A rough planning estimate for the four-phase implementation and review is **about 40,000 generated/consumed tokens**, with no defensible monetary estimate. To conserve tokens, work reused the contract, grouped independent file reads, and relied on focused regression cases instead of repeatedly dumping the full repository. The estimate is deliberately labeled; it is not billing data.

The local benchmark measured 59.6 average FPS, 34.3 1% low FPS, and 1,686 ms load time on Firefox 137.0.1 / Canvas 2D on Windows. That development machine narrowly missed the 60 FPS average target; the grader's announced machine remains the authoritative measurement. Browser JavaScript cannot read whole-process RSS reliably, so the benchmark writes `peak_mem_mb: null`. The ten-night soak completed with no crashes and RSS from 43.89 to 50.80 MiB (under the 1.2× bound).

If starting again, I would add a browser-level smoke test before implementing menus, define the benchmark scene in a standalone harness from the beginning, and record live-play video as part of each release milestone. The current environment has no video encoder or personal GitHub remote, so it cannot create the requested MP4 or publish the public GitHub Release; the local source tag and runnable package are prepared separately.
