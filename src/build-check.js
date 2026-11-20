import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
for (const f of ["src/sim.js", "src/headless.js", "src/ui.js"]) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(r.status ?? 1); }
}
const contract = JSON.parse(readFileSync("game.contract.json", "utf8"));
const { TUNING } = await import("./sim.js");
if (JSON.stringify(contract.tuning) !== JSON.stringify(TUNING)) throw Error("game.contract.json tuning differs from src/sim.js");
console.log("Build and contract check passed.");
