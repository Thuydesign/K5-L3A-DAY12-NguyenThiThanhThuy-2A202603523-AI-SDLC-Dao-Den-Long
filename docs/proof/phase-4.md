# Phase 4 release evidence

- `npm test`: PASS (Phase 3 simulation regressions and Phase 4 leaderboard integration checks).
- `npm run build`: PASS (syntax validation and v1.3 tuning parity).
- `npm run soak -- --seed 7 --nights 10 --out soak.json`: PASS; 10 nights, 0 crashes, RSS 43.89 → 50.80 MiB (1.17x).
- `npm run bench -- --seed 42 --duration 30 --out bench.json`: completed for 30 seconds. Final local sample: 59.4 average FPS, 29.8 FPS 1% low, 1,408 ms load. The local FPS values miss the required thresholds; grading hardware is authoritative. RSS is unavailable to browser JavaScript, so `peak_mem_mb` is null.
- `npm run demo:record`: PASS; generated `docs/demo/demo.mp4`, H.264 1280×720, 38.77 seconds. The clip contains live game-canvas capture and the checked-in test, soak, and benchmark results.
- `docs/demo/record.html` and `src/demo-run.js` reproduce the capture using Firefox and FFmpeg.
- GitHub Release `v1.0.0`: ZIP and MP4 assets attached.
