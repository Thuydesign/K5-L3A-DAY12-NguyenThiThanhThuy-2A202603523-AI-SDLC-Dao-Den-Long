import { readFileSync, writeFileSync } from "node:fs";
import { Game } from "./sim.js";
function fail(msg,code=1){process.stderr.write(msg+"\n");process.exit(code);}
function argsOf(a){const o={};for(let i=0;i<a.length;i++){if(!a[i].startsWith("--"))fail("Unexpected argument: "+a[i]);const k=a[i].slice(2);if(k==="night"||k==="seed"||k==="ticks"||k==="snapshot-every")o[k]=Number(a[++i]);else if(k==="scenario"||k==="inputs"||k==="out")o[k]=a[++i];else fail("Unknown option --"+k,2);}return o;}
function readJson(path,label){try{return JSON.parse(readFileSync(path,"utf8"));}catch(e){fail("Invalid "+label+" JSON: "+e.message,2);}}
const o=argsOf(process.argv.slice(2));
if(!Number.isInteger(o.seed??1)||!Number.isInteger(o.night??1)||!Number.isInteger(o.ticks)||o.ticks<0||!Number.isInteger(o["snapshot-every"]??10)||(o["snapshot-every"]??10)<1||!o.out)fail("Required: --seed <int> --night 1 --ticks <int> --out <file> [--scenario <json>] [--inputs <json>] [--snapshot-every <int>]",2);
let scenario=null,inputs={frames:[]};
try{if(o.scenario)scenario=readJson(o.scenario,"scenario");if(o.inputs)inputs=readJson(o.inputs,"inputs");}catch(e){fail(e.message,2);}
if(!inputs||typeof inputs!=="object"||Array.isArray(inputs)||!Array.isArray(inputs.frames))fail("inputs.frames must be an array",2);
if(scenario!==null){
 if(!scenario||typeof scenario!=="object"||Array.isArray(scenario))fail("scenario must be a JSON object",2);
 const vec=(v,n,label)=>{if(!Array.isArray(v)||v.length!==n||v.some(x=>typeof x!=="number"||!Number.isFinite(x)))fail(label+" must contain "+n+" finite numbers",2);};
 if(scenario.player!==undefined){if(!scenario.player||typeof scenario.player!=="object"||Array.isArray(scenario.player))fail("player must be an object",2);if(scenario.player.pos!==undefined)vec(scenario.player.pos,3,"player.pos");for(const k of ["carried","flames"])if(scenario.player[k]!==undefined&&(!Number.isInteger(scenario.player[k])||scenario.player[k]<0))fail("player."+k+" must be a non-negative integer",2);}
 for(const k of ["random_motes","random_shades"])if(scenario[k]!==undefined&&typeof scenario[k]!=="boolean")fail(k+" must be boolean",2);
 if(scenario.time_left_s!==undefined&&(typeof scenario.time_left_s!=="number"||!Number.isFinite(scenario.time_left_s)||scenario.time_left_s<0))fail("time_left_s must be non-negative",2);
 if(scenario.motes!==undefined){if(!Array.isArray(scenario.motes))fail("motes must be an array",2);scenario.motes.forEach((v,i)=>vec(v,3,"motes["+i+"]"));}
 if(scenario.shades!==undefined){if(!Array.isArray(scenario.shades))fail("shades must be an array",2);scenario.shades.forEach((v,i)=>{if(!v||typeof v!=="object"||Array.isArray(v))fail("shades["+i+"] must be an object",2);vec(v.pos,3,"shades["+i+"].pos");});}
 if(scenario.lanterns!==undefined){if(!Array.isArray(scenario.lanterns))fail("lanterns must be an array",2);scenario.lanterns.forEach((v,i)=>{if(!v||typeof v!=="object"||Array.isArray(v)||typeof v.id!=="string")fail("lanterns["+i+"] needs an id",2);if(v.pos!==undefined)vec(v.pos,3,"lanterns["+i+"].pos");if(v.lit!==undefined&&typeof v.lit!=="boolean")fail("lantern lit must be boolean",2);if(v.deposited!==undefined&&(!Number.isFinite(v.deposited)||v.deposited<0))fail("lantern deposited must be non-negative",2);});}
}
let last=-1;for(const fr of inputs.frames){if(!fr||typeof fr!=="object"||!Number.isInteger(fr.tick)||fr.tick<=last||fr.tick<0)fail("Input frame ticks must be non-negative, integer, and strictly increasing",2);last=fr.tick;
 if(fr.move&&(!Array.isArray(fr.move)||fr.move.length!==2||fr.move.some(v=>typeof v!=="number"||!Number.isFinite(v)||v< -1||v>1)))fail("move must be [x,z] in [-1,1]",2);
 if(fr.cam_yaw_deg!==undefined&&(typeof fr.cam_yaw_deg!=="number"||!Number.isFinite(fr.cam_yaw_deg)))fail("cam_yaw_deg must be a finite number",2);
 for(const k of ["jump","interact","pulse"])if(fr[k]!==undefined&&typeof fr[k]!=="boolean")fail(k+" must be boolean",2);}
let game;try{game=new Game({seed:o.seed??1,night:o.night??1,scenario});}catch(e){fail(e.message,2);}
const lines=[];let active={move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false},fi=0;
lines.push(JSON.stringify(game.snapshot()));
for(let n=0;n<o.ticks&&game.state==="playing";n++){
 while(fi<inputs.frames.length&&inputs.frames[fi].tick===game.tick){Object.assign(active,inputs.frames[fi++]);}
 const before=game.events.length;game.step(active);
 for(const e of game.events.splice(0))lines.push(JSON.stringify(e));
 if(game.tick%(o["snapshot-every"]??10)===0&&game.state==="playing")lines.push(JSON.stringify(game.snapshot()));
}
lines.push(JSON.stringify({type:"end",ticks:game.tick,state:game.state,score:game.score}));
try{writeFileSync(o.out,lines.join("\n")+"\n","utf8");}catch(e){fail("Cannot write output: "+e.message);}
