import {Game} from "./sim.js";
const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d"),overlay=document.querySelector("#overlay");
let game=null,keys=new Set(),yaw=0,drag=null,raf=0,last=0,acc=0;
const held=(...codes)=>codes.some(k=>keys.has(k));
function resize(){const d=devicePixelRatio||1,r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);}
new ResizeObserver(resize).observe(canvas);
document.addEventListener("keydown",e=>{if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();keys.add(e.code);});
document.addEventListener("keyup",e=>keys.delete(e.code));
canvas.addEventListener("pointerdown",e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener("pointermove",e=>{if(drag!==null){yaw+=(e.clientX-drag)*.5;drag=e.clientX;}});
canvas.addEventListener("pointerup",()=>drag=null);
function start(){game=new Game({seed:2026});overlay.classList.add("hidden");last=performance.now();acc=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
document.querySelector("#start").onclick=start;
function loop(now){if(!game)return;acc=Math.min(acc+(now-last)/1000,0.15);last=now;
 while(acc>=1/60&&game.state==="playing"){game.step({move:[(held("KeyD","ArrowRight")?1:0)-(held("KeyA","ArrowLeft")?1:0),(held("KeyW","ArrowUp")?1:0)-(held("KeyS","ArrowDown")?1:0)],cam_yaw_deg:yaw,jump:held("Space"),interact:held("KeyE"),pulse:held("KeyQ")});acc-=1/60;}
 draw();hud();if(game.state!=="playing"){overlay.innerHTML='<h2>'+ (game.state==="won"?"Đảo đã sáng!":"Bình minh đã tới")+'</h2><p>Điểm của Mây: '+game.score+'</p><button id="again">Chơi lại</button>';overlay.classList.remove("hidden");document.querySelector("#again").onclick=start;game=null;return;}raf=requestAnimationFrame(loop);}
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight,cx=w/2,cy=h*.52,pr=2.25;
 const project=(p)=>{const dx=p[0]-game.player.pos[0],dz=p[2]-game.player.pos[2],a=yaw*Math.PI/180;
  const x=dx*Math.cos(a)-dz*Math.sin(a),z=dx*Math.sin(a)+dz*Math.cos(a),scale=pr/(1+Math.max(-.45,z*.018));
  return [cx+x*scale,cy+z*scale*.44-p[1]*scale*1.7,scale,z];};
 const grd=ctx.createLinearGradient(0,0,0,h);grd.addColorStop(0,"#11152c");grd.addColorStop(.65,"#272942");grd.addColorStop(1,"#171a2b");ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
 for(let i=0;i<95;i++){const x=(i*7919)%w,y=(i*3571)%(h*.52);ctx.fillStyle="rgba(255,231,180,"+(.18+(i%5)*.09)+")";ctx.fillRect(x,y,2,2);}
 const glow=game.lanterns.filter(l=>l.lit).length;ctx.fillStyle="rgba(255,178,82,"+(glow*.025)+")";ctx.beginPath();ctx.ellipse(cx,cy+50,w*.4,h*.26,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(cx,cy+42);ctx.fillStyle="#222a3b";ctx.beginPath();ctx.ellipse(0,0,w*.48,h*.42,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#354052";ctx.lineWidth=4;ctx.stroke();ctx.restore();
 // winding paths and pools of warm light
 for(let i=0;i<7;i++){ctx.fillStyle=i%2?"#34334a":"#38364a";ctx.beginPath();ctx.ellipse(cx+(i-3)*76,cy+60+(i%3)*36,31,12,-.2,0,Math.PI*2);ctx.fill();}
 for(const m of game.motes){const [x,y,s]=project(m.pos);ctx.shadowBlur=17;ctx.shadowColor="#ffd276";ctx.fillStyle="#ffe49a";ctx.beginPath();ctx.arc(x,y-5,s*2.1,0,7);ctx.fill();ctx.shadowBlur=0;}
 for(const l of game.lanterns){const [x,y,s]=project(l.pos);ctx.strokeStyle="#94714d";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-25*s);ctx.stroke();ctx.fillStyle=l.lit?"#ffc96c":"#78647e";ctx.beginPath();ctx.arc(x,y-29*s,7*s,0,7);ctx.fill();if(l.lit){ctx.shadowBlur=28;ctx.shadowColor="#ffbf62";ctx.fillStyle="#ffd485";ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(x,y-29*s,17*s,0,7);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;}}
 for(const s0 of game.shades){const [x,y,s]=project(s0.pos);ctx.fillStyle="#75517f";ctx.beginPath();ctx.ellipse(x,y-10*s,12*s,16*s,0,0,7);ctx.fill();ctx.fillStyle="#ff9bce";ctx.fillRect(x-5*s,y-14*s,3*s,2*s);ctx.fillRect(x+3*s,y-14*s,3*s,2*s);}
 const [px,py,ps]=project(game.player.pos);ctx.fillStyle="#090a12aa";ctx.beginPath();ctx.ellipse(px,py,15*ps,6*ps,0,0,7);ctx.fill();ctx.fillStyle="#f0c998";ctx.beginPath();ctx.arc(px,py-23*ps,8*ps,0,7);ctx.fill();ctx.fillStyle="#e5b84e";ctx.beginPath();ctx.moveTo(px-15*ps,py-28*ps);ctx.lineTo(px,py-43*ps);ctx.lineTo(px+15*ps,py-28*ps);ctx.closePath();ctx.fill();ctx.fillStyle="#cf9a4c";ctx.fillRect(px-9*ps,py-16*ps,18*ps,18*ps);ctx.fillStyle="#ffd47c";ctx.beginPath();ctx.arc(px+11*ps,py-8*ps,3*ps,0,7);ctx.fill();
}
function hud(){document.querySelector("#time").textContent=String(Math.floor(game.timeLeft/60)).padStart(2,"0")+":"+String(Math.floor(game.timeLeft%60)).padStart(2,"0");document.querySelector("#flames").textContent=game.player.flames;document.querySelector("#carried").textContent=game.player.carried;document.querySelector("#lit").textContent=game.lanterns.filter(l=>l.lit).length;document.querySelector("#score").textContent=game.score;}
