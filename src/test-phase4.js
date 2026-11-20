import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

const dir=mkdtempSync(path.join(os.tmpdir(),"dao-phase4-"));
const child=spawn(process.execPath,["src/server.js","--port","0"],{env:{...process.env,DATA_DIR:dir},stdio:["ignore","pipe","inherit"]});
try {
 let text=""; child.stdout.setEncoding("utf8");
 const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("server startup timeout")),5000);child.stdout.on("data",d=>{text+=d;const m=text.match(/127\.0\.0\.1:(\d+)/);if(m){clearTimeout(timer);resolve("http://127.0.0.1:"+m[1]);}});child.once("exit",c=>reject(Error("server exited "+c)));});
 const get=await fetch(base+"/api/leaderboard");assert.deepEqual(await get.json(),{entries:[]});
 const post=async(e)=>fetch(base+"/api/leaderboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e)});
 const entry=(name,score,achieved_at="2026-01-01T00:00:00+07:00")=>({name,score,nights_won:2,achieved_at,seed:42});
 assert.equal((await post(entry("bad name",999))).status,400);
 for(let i=0;i<12;i++)assert.equal((await post(entry("Player"+(i+1),i*10))).status,200);
 assert.equal((await post(entry("TieWinner",110,"2026-01-01T00:00:00+07:00"))).status,200);
 const board=await (await fetch(base+"/api/leaderboard")).json();assert.equal(board.entries.length,10);assert.equal(board.entries[0].name,"Player12");
 assert.ok(board.entries.findIndex(e=>e.name==="Player12")<board.entries.findIndex(e=>e.name==="TieWinner"),"equal scores retain earliest achievement");
 const ex=spawn(process.execPath,["src/server.js","--export-leaderboard",path.join(dir,"export.json")],{env:{...process.env,DATA_DIR:dir},encoding:"utf8"});
 assert.equal(await new Promise((resolve)=>ex.on("close",resolve)),0);
 const {readFileSync}=await import("node:fs");assert.deepEqual(JSON.parse(readFileSync(path.join(dir,"export.json"),"utf8")),board);
 console.log("Phase 4 leaderboard checks passed: validation, persistence, top 10 ordering, tie handling and export.");
} finally {child.kill();await new Promise(r=>child.once("exit",r));rmSync(dir,{recursive:true,force:true});}
