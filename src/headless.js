import {readFileSync,writeFileSync} from "node:fs";
import {Game} from "./sim.js";
function fail(message,code=1){process.stderr.write(message+"\n");process.exit(code);}
function parseArgs(args){const out={};for(let i=0;i<args.length;i++){if(!args[i].startsWith("--"))fail("Unexpected argument: "+args[i],2);const key=args[i].slice(2);if(["seed","night","ticks","snapshot-every"].includes(key))out[key]=Number(args[++i]);else if(["scenario","inputs","out"].includes(key))out[key]=args[++i];else fail("Unknown option --"+key,2);}return out;}
function readJson(file,label){try{return JSON.parse(readFileSync(file,"utf8"));}catch(e){fail("Invalid "+label+" JSON: "+e.message,2);}}
const a=parseArgs(process.argv.slice(2));
if(!Number.isInteger(a.seed??1)||!Number.isInteger(a.night??1)||![1,2,3].includes(a.night??1)||!Number.isInteger(a.ticks)||a.ticks<0||a.ticks>21600||!Number.isInteger(a["snapshot-every"]??10)||(a["snapshot-every"]??10)<1||!a.out)
 fail("Required: --seed <int> --night <1|2|3> --ticks <0..21600> --out <file> [--scenario <file.json>] [--inputs <file.json>] [--snapshot-every <int>]",2);
let scenario=null,inputs={frames:[]};
if(a.scenario)scenario=readJson(a.scenario,"scenario");
if(a.inputs)inputs=readJson(a.inputs,"inputs");
if(!inputs||typeof inputs!=="object"||Array.isArray(inputs)||!Array.isArray(inputs.frames))fail("inputs.frames must be an array",2);
const vector=(v,n,label)=>{if(!Array.isArray(v)||v.length!==n||v.some(x=>typeof x!=="number"||!Number.isFinite(x)))fail(label+" must have "+n+" finite numbers",2);};
if(scenario!==null){
 if(!scenario||typeof scenario!=="object"||Array.isArray(scenario))fail("scenario must be a JSON object",2);
 if(scenario.player!==undefined){const p=scenario.player;if(!p||typeof p!=="object"||Array.isArray(p))fail("player must be an object",2);if(p.pos!==undefined)vector(p.pos,3,"player.pos");for(const k of ["carried","flames","invuln_ticks","dash_cd_ticks","pulse_cd_ticks","charm_ticks"])if(p[k]!==undefined&&(!Number.isInteger(p[k])||p[k]<0))fail("player."+k+" must be a non-negative integer",2);}
 for(const k of ["random_motes","random_shades","random_drifters","wind_enabled"])if(scenario[k]!==undefined&&typeof scenario[k]!=="boolean")fail(k+" must be boolean",2);
 if(scenario.time_left_s!==undefined&&(typeof scenario.time_left_s!=="number"||!Number.isFinite(scenario.time_left_s)||scenario.time_left_s<0))fail("time_left_s must be non-negative",2);
 if(scenario.motes!==undefined){if(!Array.isArray(scenario.motes))fail("motes must be an array",2);scenario.motes.forEach((v,i)=>vector(v,3,"motes["+i+"]"));}
 if(scenario.shades!==undefined){if(!Array.isArray(scenario.shades))fail("shades must be an array",2);scenario.shades.forEach((v,i)=>{if(!v||typeof v!=="object"||Array.isArray(v))fail("shades["+i+"] must be an object",2);vector(v.pos,3,"shades["+i+"].pos");if(v.state!==undefined&&!["spawning","wander","chase","recoil","stunned"].includes(v.state))fail("Invalid shade state",2);if(v.state_ticks_left!==undefined&&(!Number.isInteger(v.state_ticks_left)||v.state_ticks_left<0))fail("state_ticks_left must be a non-negative integer",2);});}
 for(const k of ["drifters","charms"])if(scenario[k]!==undefined){if(!Array.isArray(scenario[k]))fail(k+" must be an array",2);scenario[k].forEach((v,i)=>{if(!v||typeof v!=="object"||Array.isArray(v))fail(k+"["+i+"] must be an object",2);if(k==="drifters"){vector(v.pos,3,k+"["+i+"].pos");if(v.state!==undefined&&!["idle","chase","flee","removed"].includes(v.state))fail("Invalid drifter state",2);if(v.stolen!==undefined&&(!Number.isInteger(v.stolen)||v.stolen<0))fail("stolen must be non-negative",2);}else{if(typeof v.id!=="string")fail("charm id is required",2);if(v.pos!==undefined)vector(v.pos,3,k+"["+i+"].pos");}});}
 if(scenario.lanterns!==undefined){if(!Array.isArray(scenario.lanterns))fail("lanterns must be an array",2);scenario.lanterns.forEach((v,i)=>{if(!v||typeof v!=="object"||Array.isArray(v)||typeof v.id!=="string")fail("lanterns["+i+"] needs an id",2);if(v.pos!==undefined)vector(v.pos,3,"lanterns["+i+"].pos");if(v.lit!==undefined&&typeof v.lit!=="boolean")fail("lantern lit must be boolean",2);if(v.deposited!==undefined&&(!Number.isFinite(v.deposited)||v.deposited<0))fail("lantern deposited must be non-negative",2);});}
}
let last=-1;for(const frame of inputs.frames){if(!frame||typeof frame!=="object"||Array.isArray(frame)||!Number.isInteger(frame.tick)||frame.tick<=last||frame.tick<0)fail("Input ticks must be non-negative integers in strict ascending order",2);last=frame.tick;
 if(frame.move!==undefined&&(!Array.isArray(frame.move)||frame.move.length!==2||frame.move.some(v=>typeof v!=="number"||!Number.isFinite(v)||v< -1||v>1)))fail("move must be [x,z] in [-1,1]",2);
 if(frame.cam_yaw_deg!==undefined&&(typeof frame.cam_yaw_deg!=="number"||!Number.isFinite(frame.cam_yaw_deg)))fail("cam_yaw_deg must be finite",2);
 for(const key of ["jump","interact","pulse","dash","pause"])if(frame[key]!==undefined&&typeof frame[key]!=="boolean")fail(key+" must be boolean",2);
}
let game;try{game=new Game({seed:a.seed??1,night:a.night??1,scenario});}catch(e){fail(e.message,2);}
const lines=[];let current={move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false,dash:false,pause:false},frameIndex=0;
lines.push(JSON.stringify(game.snapshot()));for(const event of game.events.splice(0))lines.push(JSON.stringify(event));
for(let i=0;i<a.ticks;i++){
 if(game.state==="won"||game.state==="lost")break;
 while(frameIndex<inputs.frames.length&&inputs.frames[frameIndex].tick===game.tick)Object.assign(current,inputs.frames[frameIndex++]);
 game.step(current);
 for(const event of game.events.splice(0))lines.push(JSON.stringify(event));
 if(game.tick%(a["snapshot-every"]??10)===0)lines.push(JSON.stringify(game.snapshot()));
}
lines.push(JSON.stringify({type:"end",ticks:game.tick,state:game.state,score:game.snapshot().score}));
try{writeFileSync(a.out,lines.join("\n")+"\n","utf8");}catch(e){fail("Cannot write output: "+e.message);}
