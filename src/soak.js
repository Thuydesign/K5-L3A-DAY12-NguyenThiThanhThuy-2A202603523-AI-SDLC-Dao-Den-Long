import {Game} from "./sim.js";
import {writeFileSync} from "node:fs";
function fail(m){process.stderr.write(m+"\n");process.exit(2);}
const args={};for(let i=2;i<process.argv.length;i++){const k=process.argv[i];if(!["--seed","--nights","--out"].includes(k))fail("Unknown option "+k);args[k.slice(2)]=process.argv[++i];}
const seed=Number(args.seed??7),nights=Number(args.nights??10),out=args.out;if(!Number.isInteger(seed)||!Number.isInteger(nights)||nights<1||nights>100||!out)fail("Usage: node src/soak.js --seed 7 --nights 10 --out soak.json");
function rng(x){let a=(x|0)||1;return()=>{a^=a<<13;a^=a>>>17;a^=a<<5;return(a>>>0)/4294967296;};}
const rss=()=>process.memoryUsage().rss/1048576,started=process.hrtime.bigint(),results=[];let memStart=null,lastGame,crashes=0;
for(let i=0;i<nights;i++){try{const seedNow=seed+i,rand=rng(seedNow),night=i%3+1,g=new Game({seed:seedNow,night});if(i===0)memStart=rss();let move=[0,0];for(let tick=0;tick<g.map.duration*60&&g.state==="playing";tick++){if(tick%30===0){const a=rand()*Math.PI*2;move=[Math.cos(a),Math.sin(a)];}g.step({move,jump:rand()<.05,dash:rand()<.03,pulse:rand()<.02,interact:rand()<.1});}results.push(g.state==="won"?"won":"lost");lastGame=g;}catch(e){crashes++;results.push("crash");process.stderr.write("Night "+(i+1)+": "+e.stack+"\n");}}
lastGame=new Game({seed:seed+nights,night:nights%3+1});const result={nights,crashes,results,mem_start_mb:Number(memStart.toFixed(2)),mem_end_mb:Number(rss().toFixed(2)),duration_s:Number((Number(process.hrtime.bigint()-started)/1e9).toFixed(3))};writeFileSync(out,JSON.stringify(result,null,2)+"\n");process.stdout.write(JSON.stringify(result)+"\n");if(crashes)process.exitCode=1;
