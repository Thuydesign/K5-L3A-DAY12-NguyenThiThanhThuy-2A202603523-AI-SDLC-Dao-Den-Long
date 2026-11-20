import {spawn,spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,existsSync,statSync,rmSync,renameSync} from "node:fs";
import os from "node:os";
import path from "node:path";

const root=process.cwd(),out=path.resolve(process.argv[2]||"docs/demo/demo.mp4"),profile=mkdtempSync(path.join(os.tmpdir(),"lantern-demo-")),downloads=path.join(profile,"downloads"),webm=path.join(downloads,"lantern-demo.webm");
const fs=await import("node:fs/promises");await fs.mkdir(downloads,{recursive:true});
function find(command,candidates){if(process.env[command.toUpperCase()])return process.env[command.toUpperCase()];const r=spawnSync("where.exe",[command],{encoding:"utf8",windowsHide:true});const found=r.stdout?.split(/\r?\n/).find(x=>x.trim());return found||candidates.find(existsSync);}
const browser=find("firefox",["C:\\Program Files\\Mozilla Firefox\\firefox.exe"]),ffmpeg=find("ffmpeg",["C:\\Program Files\\FFmpeg\\bin\\ffmpeg.exe","C:\\Users\\Thuypc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.1-full_build-shared\\bin\\ffmpeg.exe"]);if(!browser)throw Error("Firefox was not found");if(!ffmpeg)throw Error("FFmpeg was not found; install FFmpeg or set FFMPEG");
const pref=`user_pref("browser.download.dir", ${JSON.stringify(downloads)});\nuser_pref("browser.download.folderList", 2);\nuser_pref("browser.download.useDownloadDir", true);\nuser_pref("browser.download.always_ask_before_handling_new_types", false);\nuser_pref("browser.helperApps.neverAsk.saveToDisk", "video/webm,application/octet-stream");\nuser_pref("browser.shell.checkDefaultBrowser", false);\nuser_pref("browser.aboutwelcome.enabled", false);\nuser_pref("gfx.vsync.force-disable", true);\n`;
writeFileSync(path.join(profile,"user.js"),pref);
const server=spawn(process.execPath,["src/server.js","--port","0"],{cwd:root,stdio:["ignore","pipe","inherit"],windowsHide:true});server.stdout.setEncoding("utf8");let serverText="",browserProcess;server.stdout.on("data",d=>serverText+=d);
try{
 let base;for(let i=0;i<100;i++){const m=serverText.match(/127\.0\.0\.1:(\d+)/);if(m){base="http://127.0.0.1:"+m[1];break;}await new Promise(r=>setTimeout(r,50));}if(!base)throw Error("Local server failed to start");
 browserProcess=spawn(browser,["--headless","--no-remote","--profile",profile,"--width","1280","--height","720",base+"/docs/demo/record.html"],{stdio:"ignore",windowsHide:true});
 const deadline=Date.now()+120000;while(Date.now()<deadline){if(existsSync(webm)&&!existsSync(webm+".part")){await new Promise(r=>setTimeout(r,1000));if(existsSync(webm)&&statSync(webm).size>50000)break;}await new Promise(r=>setTimeout(r,500));}
 if(!existsSync(webm)||statSync(webm).size<50000)throw Error("Firefox did not save the gameplay recording");
 await fs.mkdir(path.dirname(out),{recursive:true});const temp=out+".tmp.mp4";
 const encode=spawnSync(ffmpeg,["-hide_banner","-loglevel","error","-y","-i",webm,"-vf","scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30","-c:v","libx264","-preset","veryfast","-crf","25","-pix_fmt","yuv420p","-movflags","+faststart",temp],{encoding:"utf8",windowsHide:true});if(encode.status!==0)throw Error(encode.stderr||"FFmpeg encode failed");renameSync(temp,out);process.stdout.write(JSON.stringify({out,size_bytes:statSync(out).size,duration_seconds:38,source:"live Firefox gameplay canvas capture"})+"\n");
}finally{if(browserProcess){spawnSync("taskkill",["/T","/F","/PID",String(browserProcess.pid)],{stdio:"ignore",windowsHide:true});}server.kill();try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});}catch{}}
