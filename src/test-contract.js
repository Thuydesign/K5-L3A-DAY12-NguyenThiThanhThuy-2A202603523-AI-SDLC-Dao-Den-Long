import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=process.cwd(),tmp=mkdtempSync(path.join(os.tmpdir(),"dao-den-long-"));
const headless=path.join(root,"src","headless.js");
function json(name,value){const file=path.join(tmp,name);writeFileSync(file,JSON.stringify(value));return file;}
function run(scenario,inputs,ticks,name){
 const out=path.join(tmp,name+".jsonl");
 const r=spawnSync(process.execPath,[headless,"--seed","7","--night","1","--scenario",scenario,"--inputs",inputs,"--ticks",String(ticks),"--snapshot-every","10","--out",out],{cwd:root,encoding:"utf8"});
 assert.equal(r.status,0,r.stderr);const raw=readFileSync(out,"utf8");return {raw,rows:raw.trim().split("\n").map(JSON.parse)};
}
try{
 const win=json("win.json",{player:{pos:[0,0,0],carried:0,flames:3},random_motes:false,random_shades:false,motes:[[0,0,.5],[0,0,.7],[0,0,.9]],shades:[],lanterns:[{id:"L1",pos:[0,0,0],deposited:0},{id:"L2",lit:true},{id:"L3",lit:true},{id:"L4",lit:true},{id:"L5",lit:true}],time_left_s:300});
 const winInput=json("win-input.json",{frames:[{tick:0,interact:false},{tick:1,interact:true}]});
 const a=run(win,winInput,100,"win-a"),b=run(win,winInput,100,"win-b");
 assert.equal(a.raw,b.raw,"same seed/scenario/input must be deterministic");
 assert.deepEqual(a.rows[0].type,"snapshot");assert.equal(a.rows[0].tick,0);
 assert.equal(a.rows.at(-1).state,"won");assert.equal(a.rows.at(-1).ticks,2);
 const names=a.rows.filter(x=>x.type==="event").map(x=>x.name);
 for(const n of ["mote_picked","deposit","lantern_lit","game_over"])assert.ok(names.includes(n),n);
 const pulse=json("pulse.json",{player:{pos:[0,0,0],carried:2,flames:3},random_motes:false,random_shades:false,motes:[],shades:[{id:"S1",pos:[3,0,0]}]});
 const pulseInput=json("pulse-input.json",{frames:[{tick:0,pulse:true}]});
 const p=run(pulse,pulseInput,2,"pulse").rows.find(x=>x.type==="event"&&x.name==="pulse");
 assert.deepEqual(p.data.stunned_ids,["S1"]);assert.equal(p.tick,1);
 const hit=json("hit.json",{player:{pos:[0,0,0],carried:0,flames:3},random_motes:false,random_shades:false,motes:[],shades:[{id:"S1",pos:[1,0,0]}]});
 const h=run(hit,json("hit-input.json",{frames:[]}),3,"hit").rows.find(x=>x.type==="event"&&x.name==="player_hit");
 assert.equal(h.data.flames,2);assert.equal(h.tick,1);
 const invalid=json("invalid.json",[]);
 const bad=spawnSync(process.execPath,[headless,"--seed","1","--night","1","--ticks","1","--scenario",invalid,"--out",path.join(tmp,"bad.jsonl")],{cwd:root,encoding:"utf8"});
 assert.equal(bad.status,2,"invalid scenario must exit with code 2");
 console.log("All Phase 1 contract checks passed.");
}finally{rmSync(tmp,{recursive:true,force:true});}
