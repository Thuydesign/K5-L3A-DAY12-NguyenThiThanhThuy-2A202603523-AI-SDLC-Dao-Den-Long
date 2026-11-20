import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import os from "node:os";import path from "node:path";import {spawnSync} from "node:child_process";
import {Game,TUNING} from "./sim.js";
const quiet={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes:[],shades:[],drifters:[]};
function game(s={},night=1){return new Game({seed:23,night,scenario:{...quiet,...s}});}
function step(g,input={},n=1){for(let i=0;i<n&&g.state==="playing";i++)g.step(input);return g;}
function event(g,name){return g.events.filter(e=>e.name===name);}
const fuelScenario=(fuel,extra={})=>({player:{pos:[0,0,0],carried:0,flames:3},lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel,ever_lit:true},...Array.from({length:4},(_,i)=>({id:"L"+(i+2),lit:false}))],...extra});
assert.equal(TUNING.night1_duration_s,240);assert.equal(TUNING.night2_duration_s,270);assert.equal(TUNING.night3_duration_s,300);
{
 const g=game({player:{pos:[0,0,0],carried:10},lanterns:[{id:"L1",pos:[0,0,0]}],motes:[[.5,0,0]]});
 step(g,{interact:true});const l=g.lanterns[0];
 assert.equal(l.lit,true);assert.equal(g.fuel(l),100);assert.equal(g.successfulLights,1);assert.equal(g.capacity,12);assert.equal(g.player.carried,0);
 assert.deepEqual(event(g,"lantern_lit")[0].data,{lantern_id:"L1",relight:false});assert.equal(g.snapshot().score,150);
 step(g,{},1);assert.equal(g.player.carried,1,"capacity growth permits pickup next tick");
}
{
 const g=game(fuelScenario(100,{time_left_s:2,lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel:100},{id:"L2",lit:true,fuel:100},{id:"L3",lit:true,fuel:100},{id:"L4",lit:false},{id:"L5",lit:false}]}));
 step(g,{},1);assert.equal(g.state,"playing","lighting target must not win early");assert.equal(g.fuel(g.lanterns[0]),100-1/60);
 step(g,{},119);assert.equal(g.state,"won");assert.equal(event(g,"game_over").at(-1).data.reason,"dawn_survived");assert.equal(g.score,3*(50+98)+150);
}
{
 const g=game(fuelScenario(100,{time_left_s:1,lanterns:[{id:"L1",lit:true,fuel:100},{id:"L2",lit:true,fuel:100},{id:"L3",lit:false},{id:"L4",lit:false},{id:"L5",lit:false}]}));
 step(g,{},60);assert.equal(g.state,"lost");assert.equal(event(g,"game_over").at(-1).data.reason,"dawn");assert.equal(g.score,0);
}
{
 const g=game(fuelScenario(1/60,{time_left_s:1/60,player:{pos:[0,0,0],flames:1},lanterns:[{id:"L1",lit:true,fuel:1/60},{id:"L2",lit:true,fuel:100},{id:"L3",lit:true,fuel:100},{id:"L4",lit:false},{id:"L5",lit:false}]}));
 // Fuel expires on the final tick; no-flames has priority over dawn.
 g.player.flames=0;step(g);assert.equal(g.state,"lost");assert.equal(event(g,"game_over").at(-1).data.reason,"no_flames");assert.ok(event(g,"lantern_out").length);
}
{
 const g=game(fuelScenario(30,{lanterns:[{id:"L1",lit:true,fuel:30},{id:"L2",lit:false},{id:"L3",lit:false},{id:"L4",lit:false},{id:"L5",lit:false}]}));
 assert.equal(g.safeLantern(g.lanterns[0]),true);step(g);assert.equal(g.safeLantern(g.lanterns[0]),false,"fuel 29 is below safe threshold");
}
{
 const g=game(fuelScenario(50,{player:{pos:[0,0,0],carried:2,flames:3}}));step(g,{interact:true});
 assert.ok(Math.abs(g.fuel(g.lanterns[0])-69.98333333333333)<1e-9);assert.equal(g.player.carried,0);assert.equal(event(g,"refuel")[0].data.amount,20);assert.equal(g.snapshot().score,10);
}
{
 const g=game({player:{pos:[0,0,0],carried:5},lanterns:[{id:"L1",pos:[0,0,0],lit:false,ever_lit:true}]});step(g,{interact:true});
 assert.equal(g.lanterns[0].lit,true);assert.equal(g.lanterns[0].relit_count,1);assert.equal(g.snapshot().score,65);assert.equal(event(g,"lantern_lit")[0].data.relight,true);
}
{
 const g=game({player:{pos:[0,0,0],carried:1},lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel:100,ever_lit:true}]});step(g,{interact:true});
 assert.equal(event(g,"refuel").length,0);assert.equal(g.player.carried,1);
}
{
 const g=game({player:{pos:[0,0,0],carried:1},lanterns:[{id:"L1",pos:[3,0,0],lit:true,fuel:20,ever_lit:true}],shades:[{id:"S1",pos:[3,0,0],state:"drain",target_lantern_id:"L1"}]});
 step(g,{pulse:true});assert.equal(g.snapshot().score,15);assert.equal(g.shades[0].state,"stunned");
}
{
 const g=game({player:{pos:[20,0,20]},lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel:20,ever_lit:true}],shades:[{id:"S1",pos:[0,0,0],state:"drain",target_lantern_id:"L1"}]});
 step(g,{},60);assert.equal(g.fuel(g.lanterns[0]),14);assert.equal(event(g,"fuel_drain").length,1);assert.equal(g.shades[0].state,"drain");
}
{
 const g=game({lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel:20,ever_lit:true}],shades:[{id:"S1",pos:[0,0,0],state:"drain",target_lantern_id:"L1"}],player:{pos:[0,0,0],carried:2,flames:3}});
 // A lit, incomplete lamp is selected; refuel across 30 pushes the draining shade away.
 step(g,{interact:true});assert.ok(Math.abs(g.fuel(g.lanterns[0])-39.9)<1e-9);assert.ok(Math.abs(Math.hypot(g.shades[0].pos[0],g.shades[0].pos[2])-6)<1e-6);assert.ok(g.shades[0].pushTicks>0);
}
{
 const g=game({player:{pos:[20,0,20]},lanterns:[{id:"L1",pos:[0,0,0],lit:true,fuel:20,ever_lit:true}],shades:[{id:"S1",pos:[0,0,0],state:"wander"}]});
 step(g);assert.equal(g.shades[0].state,"drain");assert.equal(g.shades[0].target_lantern_id,"L1");
}
{
 const g=game({player:{pos:[0,0,0],carried:0,flames:3},lanterns:[{id:"L1",lit:false}],shades:[{id:"S1",pos:[5,0,0],state:"wander"}]});
 step(g);assert.equal(g.shades[0].state,"chase","shades may chase an exposed player");
}
{
 const g=game({player:{pos:[0,0,0],carried:0,flames:3},lanterns:[{id:"L1",lit:true,fuel:100},{id:"L2",lit:false}],shades:[{id:"S1",pos:[1,0,0],state:"wander"}]});
 step(g);assert.equal(g.player.flames,3,"healthy lit lantern retains safe zone");
}
{
 const g=game({player:{pos:[0,0,0],carried:0,flames:3},lanterns:[{id:"L1",lit:true,fuel:20},{id:"L2",lit:false}],shades:[{id:"S1",pos:[1,0,0],state:"wander"}]});
 step(g);assert.equal(g.player.flames,2,"low-fuel lantern loses safe zone");
}
{
 const g=game({player:{pos:[0,0,0],carried:5,flames:3},lanterns:[{id:"L1",lit:true,fuel:1,ever_lit:true},{id:"L2",lit:true,fuel:100,ever_lit:true},{id:"L3",lit:true,fuel:100,ever_lit:true}],time_left_s:1});
 // Keep fuel from expiring and force the final-tick no-flames precedence.
 g.player.flames=1;g.player.invulnTicks=100;step(g,{},1);assert.equal(g.state,"playing");
}
{
 const a=game({lanterns:[{id:"L1",lit:true,fuel:55}],shades:[{id:"S1",pos:[4,0,4],state:"wander"}]});
 const b=game({lanterns:[{id:"L1",lit:true,fuel:55}],shades:[{id:"S1",pos:[4,0,4],state:"wander"}]});
 for(let i=0;i<120;i++){a.step();b.step();}assert.deepEqual(a.snapshot(),b.snapshot());
}
{
 const g=game({player:{pos:[0,0,0]},lanterns:[{id:"L1",lit:true,fuel:100},{id:"L2",lit:true,fuel:100},{id:"L3",lit:true,fuel:100},{id:"L4",lit:true,fuel:100}]},2);
 g.step();assert.equal(g.state,"playing");
}
{
 const tmp=mkdtempSync(path.join(os.tmpdir(),"lantern-phase3-")),cli=path.join(process.cwd(),"src","headless.js");
 try{const scenario=path.join(tmp,"scenario.json"),inputs=path.join(tmp,"inputs.json"),out1=path.join(tmp,"a.jsonl"),out2=path.join(tmp,"b.jsonl");
 writeFileSync(scenario,JSON.stringify({...quiet,player:{pos:[0,0,0],carried:0,flames:3},lanterns:[{id:"L1",lit:true,fuel:50,ever_lit:true}],shades:[{id:"S1",pos:[1,0,0],state:"drain",target_lantern_id:"L1"}]}));
 writeFileSync(inputs,JSON.stringify({frames:[]}));const args=["--seed","7","--night","1","--ticks","120","--scenario",scenario,"--inputs",inputs,"--snapshot-every","10"];
 for(const out of [out1,out2])assert.equal(spawnSync(process.execPath,[cli,...args,"--out",out],{encoding:"utf8"}).status,0);
 assert.equal(readFileSync(out1,"utf8"),readFileSync(out2,"utf8"));
 const rows=readFileSync(out1,"utf8").trim().split("\n").map(JSON.parse),snap=rows.find(v=>v.type==="snapshot");
 assert.ok("capacity"in snap.player&&"fuel"in snap.lanterns[0]&&"ever_lit"in snap.lanterns[0]&&"relit_count"in snap.lanterns[0]);assert.equal(snap.shades[0].state,"drain");
 const bad=spawnSync(process.execPath,[cli,"--night","4","--ticks","1","--out",out1],{encoding:"utf8"});assert.equal(bad.status,2);
 }finally{rmSync(tmp,{recursive:true,force:true});}
}

// Phase 2 mechanics not superseded by Ticket-03 remain covered.
{
 const g=game();g.step({pause:true});const frozen=g.snapshot();g.step({pause:false});assert.equal(g.simTick,0);g.step({pause:true});assert.equal(g.simTick,1);assert.equal(frozen.state,"paused");
}
{
 const g=game();g.step({dash:true});assert.ok(event(g,"dash").length);assert.equal(g.player.vel[2],14);
}
{
 const g=game({},2);g.step({});assert.equal(g.charms[0].available,true);const c=game({charms:[{id:"C1",pos:[0,0,0]}]},2);c.step({});assert.ok(event(c,"charm_picked").length);
}
{
 const g=game({player:{pos:[0,0,0],carried:6},drifters:[{id:"D1",pos:[1,0,0],state:"chase"}]},2);g.step({});assert.ok(event(g,"drifter_steal").length);
}
{
 const g=game({player:{pos:[0,0,0],carried:1},drifters:[{id:"D1",pos:[3,0,0],state:"flee",stolen:2,state_ticks_left:200}]},2);g.step({pulse:true});assert.ok(event(g,"drifter_drop").length);
}
{
 const g=game({...quiet,random_shades:true});for(let i=0;i<300;i++)g.step({});assert.equal(event(g,"shade_spawned").length,2);
}
{
 const g=game({...quiet,random_drifters:true},2);for(let i=0;i<1200;i++)g.step({});assert.equal(g.drifters.length,1);
}
{
 const g=game({player:{pos:[20,0,18]},lanterns:[]},2);g.step({});assert.ok(g.player.vel[1]===14);
}
{
 const g=game({player:{pos:[35,0,4],carried:4,flames:3}},2);for(let i=0;i<60;i++)g.step({});assert.ok(event(g,"player_hit").some(e=>e.data.by==="fall"));
}
{
 const g=game({player:{pos:[27*Math.cos(Math.PI/6),1.5,13.5]}},3);g.step({});assert.equal(g.player.pos[1],1.5);
 const pad=game({player:{pos:[0,3,13]}},3);pad.step({});assert.equal(pad.player.vel[1],12);
}
{
 const g=game({wind_enabled:true},3);for(let i=0;i<1801;i++)g.step({});assert.ok(g.windActive);
}
console.log("Phase 3 v1.2 checks passed: fuel, refuel, relight, capacity, safe-zone threshold, draining shades, scoring, dawn outcomes, deterministic headless snapshots and invalid CLI validation.");

