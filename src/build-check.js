import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
for(const file of ["src/maps.js","src/sim.js","src/headless.js","src/ui.js","src/test-contract.js","src/benchmark.js"]){const r=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});if(r.status!==0){process.stderr.write(r.stderr);process.exit(r.status??1);}}
const contract=JSON.parse(readFileSync("game.contract.json","utf8"));
const {TUNING}=await import("./sim.js");
if(contract.contract_version!=="1.1")throw Error("Expected contract v1.1");
if(JSON.stringify(contract.tuning)!==JSON.stringify(TUNING))throw Error("Contract tuning differs from src/sim.js");
for(const file of ["index.html","src/style.css"])readFileSync(file,"utf8");
console.log("Build and v1.1 contract check passed.");
