import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import os from "node:os";import path from "node:path";import {spawnSync} from "node:child_process";
const root=process.cwd(),tmp=mkdtempSync(path.join(os.tmpdir(),"lantern-phase2-")),cli=path.join(root,"src","headless.js");
function json(name,data){const file=path.join(tmp,name);writeFileSync(file,JSON.stringify(data));return file;}
function run(night,scenario,frames=[],ticks=1,snapshotEvery=1,name="case"){
 const sc=json(name+"-scenario.json",scenario),inp=json(name+"-inputs.json",{frames}),out=path.join(tmp,name+".jsonl");
 const r=spawnSync(process.execPath,[cli,"--seed","17","--night",String(night),"--scenario",sc,"--inputs",inp,"--ticks",String(ticks),"--snapshot-every",String(snapshotEvery),"--out",out],{cwd:root,encoding:"utf8",maxBuffer:8*1024*1024});
 assert.equal(r.status,0,r.stderr);const raw=readFileSync(out,"utf8");return{raw,rows:raw.trim().split("\n").map(JSON.parse)};
}
const quiet={random_motes:false,random_shades:false,random_drifters:false,motes:[],shades:[],drifters:[]};
const events=rows=>rows.filter(x=>x.type==="event");
try{
 const w=run(1,{...quiet,player:{pos:[0,0,0],carried:0,flames:3},motes:[[0,0,.5],[0,0,.7],[0,0,.9]],lanterns:[{id:"L1",pos:[0,0,0],deposited:0},{id:"L2",lit:true},{id:"L3",lit:true},{id:"L4",lit:true},{id:"L5",lit:true}],time_left_s:300},[{tick:0,interact:false},{tick:1,interact:true}],100,10,"regression-win");
 const we=events(w.rows);assert.equal(w.rows.at(-1).state,"won");for(const n of ["mote_picked","deposit","lantern_lit","game_over"])assert.ok(we.some(e=>e.name===n),n);assert.equal(w.rows.at(-1).score,878);
 const det=run(1,{...quiet},[],300,10,"determinism-a"),det2=run(1,{...quiet},[],300,10,"determinism-b");assert.equal(det.raw,det2.raw);
 const pause=run(1,{...quiet},[{tick:0,pause:true},{tick:1,pause:false},{tick:2,pause:true}],3,1,"pause");
 const ps=pause.rows.filter(x=>x.type==="snapshot");assert.equal(ps.find(x=>x.tick===1).state,"paused");assert.equal(ps.find(x=>x.tick===2).sim_tick,0);assert.equal(ps.find(x=>x.tick===3).sim_tick,1);assert.ok(events(pause.rows).some(e=>e.name==="paused"));assert.ok(events(pause.rows).some(e=>e.name==="resumed"));
 const dash=run(1,{...quiet},[{tick:0,dash:true}],2,1,"dash");assert.ok(events(dash.rows).some(e=>e.name==="dash"));assert.equal(dash.rows.find(x=>x.type==="snapshot"&&x.tick===1).player.vel[2],14);
 const charm=run(2,{...quiet,charms:[{id:"C1",pos:[0,0,0]}]},[],1,1,"charm");assert.ok(events(charm.rows).some(e=>e.name==="charm_picked"&&e.data.charm_ticks===600));assert.equal(charm.rows.find(x=>x.type==="snapshot"&&x.tick===1).player.charm_s,10);
 const steal=run(2,{...quiet,player:{pos:[0,0,0],carried:6,flames:3},drifters:[{id:"D1",pos:[1,0,0],state:"chase"}]},[],1,1,"steal");assert.ok(events(steal.rows).some(e=>e.name==="drifter_steal"&&e.data.amount===3&&e.data.carried===3));
 const drop=run(2,{...quiet,player:{pos:[0,0,0],carried:1,flames:3},drifters:[{id:"D1",pos:[1,0,0],state:"flee",stolen:2,state_ticks_left:200}]},[{tick:0,pulse:true}],1,1,"drop");assert.ok(events(drop.rows).some(e=>e.name==="drifter_drop"&&e.data.amount===2));assert.equal(drop.rows.find(x=>x.type==="snapshot"&&x.tick===1).motes.filter(m=>m.kind==="dropped").length,2);
 const charmAgain=run(2,{...quiet,charms:[{id:"C1",pos:[0,0,0]}]},[{tick:0,move:[0,0]},{tick:1,move:[1,0]},{tick:18,move:[0,0]}],2701,1,"charm-respawn");assert.ok(charmAgain.rows.some(x=>x.type==="snapshot"&&x.tick===2701&&x.charms[0].available));
 const drifterChase=run(2,{...quiet,player:{pos:[0,0,0],carried:5,flames:3},drifters:[{id:"D1",pos:[5,0,0],state:"idle"}]},[],1,1,"drifter-chase");assert.equal(drifterChase.rows.find(x=>x.type==="snapshot"&&x.tick===1).drifters[0].state,"chase");
 const drifterFlee=run(2,{...quiet,player:{pos:[0,0,0],carried:5,flames:3},drifters:[{id:"D1",pos:[3,0,0],state:"chase"}]},[{tick:0,pulse:true}],1,1,"drifter-flee");assert.equal(drifterFlee.rows.find(x=>x.type==="snapshot"&&x.tick===1).drifters[0].state,"flee");assert.ok(!events(drifterFlee.rows).some(e=>e.name==="drifter_steal"));
 const shadeSpawn=run(1,{...quiet,random_shades:true},[],301,300,"shade-schedule");assert.equal(events(shadeSpawn.rows).filter(e=>e.name==="shade_spawned").length,2);
 const drifterSpawn=run(2,{...quiet,random_drifters:true},[],1201,1200,"drifter-schedule");assert.equal(drifterSpawn.rows.some(x=>x.type==="snapshot"&&x.drifters.some(d=>d.id==="D1")),true);
 const pulseScenario={...quiet,player:{pos:[0,0,0],carried:3,flames:3},shades:[{id:"S1",pos:[3,0,0]}]};
 const pulse=run(1,pulseScenario,[{tick:0,pulse:true},{tick:1,pulse:false},{tick:61,pulse:true}],62,1,"stun-repeat");assert.equal(events(pulse.rows).filter(e=>e.name==="pulse").length,2);assert.equal(pulse.rows.at(-1).score,10);
 const pad=run(2,{...quiet,player:{pos:[20,0,18],carried:0,flames:3}},[],1,1,"pad-2");const padS=pad.rows.find(x=>x.type==="snapshot"&&x.tick===1);assert.ok(padS.player.vel[1]===14&&Math.hypot(padS.player.vel[0],padS.player.vel[2])>23);
 const fall=run(2,{...quiet,player:{pos:[35,0,4],carried:4,flames:3}},[],60,1,"fall");assert.ok(events(fall.rows).some(e=>e.name==="player_hit"&&e.data.by==="fall"&&e.data.lost===4));
 const ramp=run(3,{...quiet,player:{pos:[27*Math.cos(Math.PI/6),1.5,13.5],carried:0,flames:3}},[],1,1,"ramp");assert.equal(ramp.rows.find(x=>x.type==="snapshot"&&x.tick===1).player.pos[1],1.5);
 const pad3=run(3,{...quiet,player:{pos:[0,3,13],carried:0,flames:3}},[],1,1,"pad-3");assert.equal(pad3.rows.find(x=>x.type==="snapshot"&&x.tick===1).player.vel[1],12);
 const wind=run(3,{...quiet,wind_enabled:true},[],1860,60,"wind");assert.ok(wind.rows.some(x=>x.type==="snapshot"&&x.wind.active));
 const invalid=json("invalid.json",[]),bad=spawnSync(process.execPath,[cli,"--night","4","--ticks","1","--out",path.join(tmp,"bad.jsonl")],{cwd:root,encoding:"utf8"});assert.equal(bad.status,2);
 console.log("All Phase 2 contract checks passed (Phase 1 regression, scoring, pause, dash, charm pickup/respawn, drifter states/steal/drop, spawn schedules, maps/pads, fall, wind, deterministic outputs and validation).");
}finally{rmSync(tmp,{recursive:true,force:true});}
