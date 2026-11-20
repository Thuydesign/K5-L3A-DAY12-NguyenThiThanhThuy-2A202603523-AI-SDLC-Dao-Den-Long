import {spawn,spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,existsSync,rmSync,readFileSync,unlinkSync} from "node:fs";
import os from "node:os";import path from "node:path";
function fail(m){process.stderr.write(m+"\n");process.exit(2);}
function arg(k,d){const i=process.argv.indexOf("--"+k);return i<0?d:process.argv[i+1];}
const seed=Number(arg("seed",42)),duration=Number(arg("duration",30)),out=arg("out","bench.json");if(!Number.isInteger(seed)||!Number.isFinite(duration)||duration<=0||duration>600)fail("Invalid seed/duration");
function browserPath(){if(process.env.BROWSER)return process.env.BROWSER;const candidates=process.platform==="win32"?["C:\\Program Files\\Mozilla Firefox\\firefox.exe","C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"]:process.platform==="darwin"?["/Applications/Firefox.app/Contents/MacOS/firefox","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:["/usr/bin/firefox","/usr/bin/google-chrome","/usr/bin/chromium"];return candidates.find(x=>existsSync(x))||"firefox";}
const browser=browserPath(),profile=mkdtempSync(path.join(os.tmpdir(),"dao-bench-profile-")),download=path.join(profile,"downloads"),fs=await import("node:fs/promises"),bench=path.join(process.cwd(),"data","bench-output.json");await fs.mkdir(download,{recursive:true});try{unlinkSync(bench);}catch{}
const prefs='user_pref("browser.download.dir", '+JSON.stringify(download)+');\nuser_pref("browser.download.folderList", 2);\nuser_pref("browser.download.useDownloadDir", true);\nuser_pref("browser.shell.checkDefaultBrowser", false);\nuser_pref("browser.aboutwelcome.enabled", false);\nuser_pref("gfx.vsync.force-disable", true);\n';
writeFileSync(path.join(profile,"user.js"),prefs);
let server=spawn(process.execPath,["src/server.js","--port","0"],{cwd:process.cwd(),stdio:["ignore","pipe","inherit"]}),serverText="";server.stdout.setEncoding("utf8");server.stdout.on("data",d=>serverText+=d);let child;
try{
 let url;for(let i=0;i<100;i++){const m=serverText.match(/127\.0\.0\.1:(\d+)/);if(m){url="http://127.0.0.1:"+m[1]+"/?bench=1&seed="+seed+"&duration="+duration;break;}await new Promise(r=>setTimeout(r,50));}if(!url)fail("Local server did not start");
 const ver=spawnSync(browser,["--version"],{encoding:"utf8"}).stdout?.trim()||"Unknown browser";
 child=spawn(browser,["--headless","--no-remote","--profile",profile,"--width","1280","--height","720",url],{stdio:"ignore"});
 const end=Date.now()+Math.ceil((duration+3)*1000)+30000;while(Date.now()<end&&!existsSync(bench))await new Promise(r=>setTimeout(r,200));
 if(!existsSync(bench)){for(const f of ["data/bench-load.txt","data/client-error.txt"])if(existsSync(f))process.stderr.write(f+"\\n"+readFileSync(f,"utf8")+"\\n");fail("Browser did not POST benchmark results before timeout.");}
 const data=JSON.parse(readFileSync(bench,"utf8"));data.renderer=ver+" / Canvas 2D (headless)";data.os=os.type()+" "+os.release()+" ("+os.arch()+")";data.vsync_off=true;data.peak_mem_mb=null;data.memory_note="Whole-process RSS is not exposed reliably by browser JavaScript; Firefox headless profile set gfx.vsync.force-disable=true.";
 writeFileSync(out,JSON.stringify(data,null,2)+"\n");
 process.stdout.write(JSON.stringify(data,null,2)+"\n");
}finally{if(child){if(process.platform==="win32")spawnSync("taskkill",["/T","/F","/PID",String(child.pid)],{stdio:"ignore"});else child.kill();}server.kill();try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:500});}catch(e){process.stderr.write("Temporary Firefox profile cleanup deferred: "+e.code+"\\n");}}
