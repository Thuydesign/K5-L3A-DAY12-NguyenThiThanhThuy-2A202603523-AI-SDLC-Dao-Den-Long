import http from "node:http";
import {readFile,writeFile,rename,mkdir} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),dataDir=path.resolve(process.env.DATA_DIR||path.join(root,"data")),boardFile=path.join(dataDir,"leaderboard.json");
function fail(m){process.stderr.write(m+"\n");process.exit(2);}
if(process.argv[2]==="--export-leaderboard"){const out=process.argv[3];if(!out)fail("Usage: node src/server.js --export-leaderboard out.json");let data={entries:[]};try{data=JSON.parse(await readFile(boardFile,"utf8"));}catch(e){if(e.code!=="ENOENT")fail(e.message);}await writeFile(path.resolve(out),JSON.stringify(data,null,2)+"\n");process.exit(0);}
await mkdir(dataDir,{recursive:true});if(!existsSync(boardFile))await writeFile(boardFile,'{"entries":[]}\n');
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".svg":"image/svg+xml"};
const send=(res,status,obj)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(obj));};
async function entries(){try{const x=JSON.parse(await readFile(boardFile,"utf8"));return Array.isArray(x.entries)?x.entries:[];}catch{return[];}}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,"http://localhost");if(u.searchParams.has("bench"))await writeFile(path.join(dataDir,"bench-load.txt"),req.method+" "+u.pathname+" "+u.search+"\\n",{flag:"a"});
 if(u.pathname==="/api/client-error"&&req.method==="POST"){let body="";req.on("data",c=>body+=c);req.on("end",async()=>{await writeFile(path.join(dataDir,"client-error.txt"),body+"\\n",{flag:"a"});send(res,200,{ok:true});});return;}
 if(u.pathname==="/api/bench"&&req.method==="POST"){let body="";req.on("data",c=>{body+=c;if(body.length>16384)req.destroy();});req.on("end",async()=>{try{const x=JSON.parse(body);if(x.contract_version!=="1.3"||!Number.isFinite(x.avg_fps)||!Number.isFinite(x.p1_low_fps)||!Number.isFinite(x.frame_ms_p95)||!Number.isInteger(x.frames))return send(res,400,{error:"Invalid bench output"});await writeFile(path.join(dataDir,"bench-output.json"),JSON.stringify(x,null,2)+"\n");return send(res,200,{ok:true});}catch{return send(res,400,{error:"Invalid JSON"});}});return;}
 if(u.pathname==="/api/bench-image"&&req.method==="POST"){let body="";req.on("data",c=>{body+=c;if(body.length>4000000)req.destroy();});req.on("end",async()=>{try{const prefix="data:image/png;base64,";if(!body.startsWith(prefix))return send(res,400,{error:"PNG required"});const m=[body.slice(prefix.length)];const dest=path.join(root,"docs","demo","bench.png");await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,Buffer.from(m[0],"base64"));return send(res,200,{ok:true});}catch{return send(res,400,{error:"Invalid image"});}});return;}
 if(u.pathname==="/api/leaderboard"&&req.method==="GET")return send(res,200,{entries:await entries()});
 if(u.pathname==="/api/leaderboard"&&req.method==="POST"){
  let body="";req.on("data",c=>{body+=c;if(body.length>8192)req.destroy();});req.on("end",async()=>{try{const e=JSON.parse(body);if(!/^[A-Za-z0-9_]{3,12}$/.test(e.name)||!Number.isInteger(e.score)||e.score<0||!Number.isInteger(e.nights_won)||e.nights_won<0||e.nights_won>3||!Number.isInteger(e.seed))return send(res,400,{error:"Invalid leaderboard entry"});const date=new Date(e.achieved_at);if(!Number.isFinite(date.getTime())||!/[+-]\d\d:\d\d|Z$/.test(e.achieved_at))return send(res,400,{error:"achieved_at must be ISO 8601 with timezone"});const all=await entries();all.push({name:e.name,score:e.score,nights_won:e.nights_won,achieved_at:date.toISOString(),seed:e.seed});all.sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at));const board={entries:all.slice(0,10)};const tmp=boardFile+".tmp";await writeFile(tmp,JSON.stringify(board,null,2)+"\n");await rename(tmp,boardFile);return send(res,200,board);}catch{return send(res,400,{error:"Invalid JSON"});}});
  return;
 }
 if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);return res.end();}
 let pathname;try{pathname=decodeURIComponent(u.pathname);}catch{res.writeHead(400);return res.end();}
 if(pathname==="/")pathname="/index.html";const target=path.resolve(root,"."+pathname);if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const data=await readFile(target);res.writeHead(200,{"content-type":types[path.extname(target)]||"application/octet-stream","content-length":data.length});return req.method==="HEAD"?res.end():res.end(data);}catch{res.writeHead(404);res.end("Not found");}
});
const args=process.argv.slice(2);let port=8000;const ix=args.indexOf("--port");if(ix>=0)port=Number(args[ix+1]);if(!Number.isInteger(port)||port<0||port>65535)fail("Invalid --port");
server.listen(port,"127.0.0.1",()=>process.stdout.write("Listening on http://127.0.0.1:"+server.address().port+"\n"));
