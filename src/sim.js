import {mapFor,groundYAt,landContains} from "./maps.js";
export const TUNING={
 player_speed:5,carry_capacity:10,lantern_cost:10,lantern_count_night1:5,
 pickup_radius:1.25,interact_radius:2,pulse_cost:1,pulse_radius:6,
 night1_duration_s:240,night2_duration_s:270,night3_duration_s:300,
 fuel_max:100,fuel_decay_per_s:1.0,fuel_per_mote:10,relight_cost:5,win_ratio:.6,drain_per_s:5,low_fuel_threshold:30,capacity_max:20,
 flames:3,invuln_s:1.5,hit_drop_ratio:.5,pulse_stun_s:2,pulse_push_m:2,pulse_cooldown_s:1,
 safe_radius:4,shade_speed:2.2,shade_hit_radius:1,fall_enabled:true,
 dash_speed:14,dash_duration_s:.2,dash_cooldown_s:1,
 score:{per_mote:5,per_lantern:100,per_relight:40,per_stun:5,per_drain_stun:15,per_fuel:1,per_flame_left:50}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]),rnd=v=>Math.round(v*1000)/1000;
const cmpId=(a,b)=>{const x=Number((a.id.match(/\d+/)||[0])[0]),y=Number((b.id.match(/\d+/)||[0])[0]);return x-y||a.id.localeCompare(b.id);};
function rng(seed){let x=(seed|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
const vecMove=(m,yaw)=>{let x=m[0],z=m[1],a=yaw*Math.PI/180,wx=x*Math.cos(a)+z*Math.sin(a),wz=-x*Math.sin(a)+z*Math.cos(a),n=Math.hypot(wx,wz);return n>1?[wx/n,wz/n]:[wx,wz];};
export class Game{
 constructor({seed=1,scenario=null,night=1,totalScore=0}={}){
  this.map=mapFor(night);this.night=night;this.initialTotalScore=totalScore;this.rand=rng(seed);this.tick=0;this.simTick=0;this.state="playing";this.events=[];this.score=totalScore;this.nightScore=0;this.timeLeft=this.map.duration;
  this.successfulLights=0;this.player={pos:night===3?[0,6,5]:[0,0,0],vel:[0,0,0],flames:TUNING.flames,carried:0,grounded:true,invulnTicks:0,dashCdTicks:0,pulseCdTicks:0,charmTicks:0,dashTicks:0,dashDir:[0,1],facing:[0,1],launchLock:false};
  this.lanterns=this.map.lanterns.map(l=>({...l,pos:[...l.pos],fuelUnits:0,ever_lit:false,relit_count:0,deposited:0}));this.motes=this.map.motePoints.map((p,i)=>({id:"M"+String(i+1).padStart(3,"0"),pos:[...p],kind:"random",ttlTicks:null}));
  this.shades=[];this.drifters=[];this.charms=this.map.charmPoints.map(c=>({...c,pos:[...c.pos],available:true,respawnTicks:0}));
  this.randomMotes=true;this.randomShades=true;this.randomDrifters=night>1;this.windEnabled=night===3;this.windDir=this.rand()*360;this.windActive=false;
  this.shadeSpawnCursor=0;this.shadesCreated=0;this.driftersCreated=0;this.dropId=0;this.prev={jump:false,interact:false,pulse:false,dash:false,pause:false};
  this.shadeSafe=new Map();
  if(scenario)this.loadScenario(scenario);this.startTimeLeft=this.timeLeft;
  this.emitAt(0,"night_start",{night});
 }
 emit(name,data={}){this.events.push({type:"event",tick:this.tick+1,name,data});}
 emitAt(tick,name,data={}){this.events.push({type:"event",tick,name,data});}
 loadScenario(s){
  if(s.player){const p=s.player;if(p.pos)this.player.pos=[...p.pos];if(p.carried!==undefined)this.player.carried=p.carried;if(p.successful_lights!==undefined)this.successfulLights=p.successful_lights;if(p.flames!==undefined)this.player.flames=p.flames;
   for(const [k,dest] of [["invuln_ticks","invulnTicks"],["dash_cd_ticks","dashCdTicks"],["pulse_cd_ticks","pulseCdTicks"],["charm_ticks","charmTicks"]])if(p[k]!==undefined)this.player[dest]=p[k];}
  if(s.time_left_s!==undefined)this.timeLeft=s.time_left_s;
  for(const [k,d] of [["random_motes","randomMotes"],["random_shades","randomShades"],["random_drifters","randomDrifters"],["wind_enabled","windEnabled"]])if(s[k]!==undefined)this[d]=s[k];
  if(s.random_motes===false&&s.motes===undefined)this.motes=[];
  if(s.motes!==undefined)this.motes=s.motes.map((p,i)=>({id:"M"+String(i+1).padStart(3,"0"),pos:[...p],kind:"random",ttlTicks:null}));
  if(s.shades!==undefined){this.shades=s.shades.map((v,i)=>({id:v.id||"S"+(i+1),pos:[...v.pos],state:v.state||"chase",stateTicksLeft:v.state_ticks_left||0,stunTicks:v.state==="stunned"?(v.state_ticks_left||0):0,target_lantern_id:v.target_lantern_id||null,pushTicks:0}));this.shadesCreated=this.shades.reduce((n,v)=>Math.max(n,Number((v.id.match(/\d+/)||[0])[0])),0);}
  if(s.random_shades===false&&s.shades===undefined)this.shades=[];
  if(s.drifters!==undefined){this.drifters=s.drifters.map((v,i)=>({id:v.id||"D"+(i+1),pos:[...v.pos],state:v.state||"idle",stolen:v.stolen||0,stateTicksLeft:v.state_ticks_left||0,phase:this.rand()*6.28}));this.driftersCreated=this.drifters.reduce((n,v)=>Math.max(n,Number((v.id.match(/\d+/)||[0])[0])),0);}
  if(s.charms!==undefined)this.charms=s.charms.map((v,i)=>{const def=this.map.charmPoints.find(c=>c.id===v.id)||this.map.charmPoints[i]||{id:v.id||"C"+(i+1),pos:v.pos||[0,0,0]};return{id:v.id||def.id,pos:[...(v.pos||def.pos)],available:v.available!==false,respawnTicks:v.respawn_ticks||0};});
  if(s.lanterns)for(const patch of s.lanterns){const l=this.lanterns.find(v=>v.id===patch.id);if(l){if(patch.pos)l.pos=[...patch.pos];if(patch.deposited!==undefined)l.deposited=patch.deposited;if(patch.lit!==undefined){l.lit=patch.lit;if(patch.lit)l.fuelUnits=Math.round((patch.fuel??100)*60);}if(patch.fuel!==undefined)l.fuelUnits=Math.round(patch.fuel*60);if(patch.ever_lit!==undefined)l.ever_lit=patch.ever_lit;else if(patch.lit)l.ever_lit=true;if(patch.relit_count!==undefined)l.relit_count=patch.relit_count;if(!l.lit)l.fuelUnits=0;}}
  if(s.player?.invuln_ticks!==undefined)this.player.invulnTicks=s.player.invuln_ticks;
 }
 get charmActive(){return this.player.charmTicks>0;}
 get moveSpeed(){return this.charmActive?7.2:TUNING.player_speed;}
 get capacity(){return Math.min(TUNING.capacity_max,TUNING.carry_capacity+2*this.successfulLights);}
 fuel(l){return l.fuelUnits/60;}
 safeLantern(l){return l.lit&&this.fuel(l)>=TUNING.low_fuel_threshold;}
 addMote(pos,kind="dropped",ttl=600){this.motes.push({id:"D"+String(++this.dropId).padStart(5,"0"),pos:[pos[0],0,pos[2]],kind,ttlTicks:ttl});}
 step(input={}){
  const k=this.tick,was=this.prev;
  if(input.pause&&!was.pause){
   if(this.state==="playing"){this.state="paused";this.emit("paused",{});this.tick++;this.prev={...was,pause:true};return;}
   if(this.state==="paused"){this.state="playing";this.emit("resumed",{});}
  }
  if(this.state==="paused"){this.tick++;this.prev={...was,pause:!!input.pause};return;}
  if(this.state!=="playing")return;
  this.timeLeft=Math.max(0,this.startTimeLeft-(this.simTick+1)/60);
  const pl=this.player;
  for(const key of ["invulnTicks","dashCdTicks","pulseCdTicks","charmTicks"])if(pl[key]>0)pl[key]--;
  for(const c of this.charms)if(!c.available&&c.respawnTicks>0){c.respawnTicks--;if(c.respawnTicks===0)c.available=true;}
  this.tickFuelStart=new Map(this.lanterns.map(l=>[l.id,l.fuelUnits]));for(const l of this.lanterns)if(l.lit){l.fuelUnits-=1;for(const sh of this.shades.filter(s=>s.state==="drain"&&s.target_lantern_id===l.id))l.fuelUnits-=5;if(l.fuelUnits<=0){l.fuelUnits=0;l.lit=false;l.deposited=0;this.emit("lantern_out",{lantern_id:l.id});}}
  if((this.simTick+1)%60===0)for(const sh of this.shades.filter(s=>s.state==="drain")){const l=this.lanterns.find(v=>v.id===sh.target_lantern_id);if(l?.lit)this.emit("fuel_drain",{lantern_id:l.id,shade_id:sh.id,fuel:this.fuel(l)});}
  for(const m of this.motes)if(m.ttlTicks!==null)m.ttlTicks--;
  this.motes=this.motes.filter(m=>m.ttlTicks===null||m.ttlTicks>0);
  for(const s of this.shades)if(s.stateTicksLeft>0){s.stateTicksLeft--;if(s.stateTicksLeft===0){if(s.state==="spawning")s.state="wander";else if(s.state==="stunned"||s.state==="recoil")s.state="chase";}}
  for(const d of this.drifters)if(d.stateTicksLeft>0){d.stateTicksLeft--;if(d.stateTicksLeft===0&&d.state==="flee")d.state="removed";}
  const world=vecMove(input.move||[0,0],input.cam_yaw_deg||0);
  this.movePlayer(input,world);
  this.checkFall();
  for(let i=this.motes.length-1;i>=0;i--)if(pl.carried<this.capacity&&dXZ(pl.pos,this.motes[i].pos)<=TUNING.pickup_radius){this.motes.splice(i,1);pl.carried++;this.emit("mote_picked",{carried:pl.carried});}
  for(const c of this.charms)if(c.available&&dXZ(pl.pos,c.pos)<=TUNING.pickup_radius){c.available=false;c.respawnTicks=2700;pl.charmTicks=600;pl.dashCdTicks=0;this.emit("charm_picked",{charm_id:c.id,charm_ticks:600});}
  if(input.interact&&!was.interact)this.interactLantern();
  this.updateWind();
  this.applyPulse(input,was);
  this.moveShades();
  this.moveDrifters();
  this.resolveContacts();for(const sh of this.shades)if(sh.pushTicks>0)sh.pushTicks--;
  this.spawnScheduled();
  this.simTick++;this.tick++;this.prev={jump:!!input.jump,interact:!!input.interact,pulse:!!input.pulse,dash:!!input.dash,pause:!!input.pause};
  if(pl.flames<=0)this.endNight("lost","no_flames");
  else if(this.timeLeft<=0){const lit=this.lanterns.filter(l=>l.lit).length,need=Math.ceil(TUNING.win_ratio*this.lanterns.length);if(lit>=need)this.endNight("won","dawn_survived");else this.endNight("lost","dawn");}
 }
 interactLantern(){const p=this.player,near=this.lanterns.filter(l=>(!l.lit||this.tickFuelStart.get(l.id)<TUNING.fuel_max*60)&&dXZ(p.pos,l.pos)<=TUNING.interact_radius).sort((a,b)=>dXZ(p.pos,a.pos)-dXZ(p.pos,b.pos)||cmpId(a,b));const l=near[0];if(!l||p.carried<=0)return;
  if(l.lit){const need=Math.ceil((TUNING.fuel_max-this.fuel(l))/TUNING.fuel_per_mote);if(!need)return;const used=Math.min(p.carried,need),amount=used*TUNING.fuel_per_mote,was=this.fuel(l);p.carried-=used;l.fuelUnits=Math.min(TUNING.fuel_max*60,l.fuelUnits+amount*60);this.nightScore+=used*TUNING.score.per_mote;this.emit("refuel",{lantern_id:l.id,amount,fuel:this.fuel(l)});if(was<TUNING.low_fuel_threshold&&this.fuel(l)>=TUNING.low_fuel_threshold)this.pushShadesFrom(l);return;}
  const cost=l.ever_lit?TUNING.relight_cost:TUNING.lantern_cost,used=Math.min(p.carried,cost-l.deposited);if(!used)return;p.carried-=used;l.deposited+=used;this.nightScore+=used*TUNING.score.per_mote;
  if(l.deposited>=cost){const relight=l.ever_lit;l.lit=true;l.fuelUnits=TUNING.fuel_max*60;l.ever_lit=true;l.deposited=0;if(relight)l.relit_count++;this.successfulLights++;this.nightScore+=relight?TUNING.score.per_relight:TUNING.score.per_lantern;this.emit("lantern_lit",{lantern_id:l.id,relight});}}
 pushShadesFrom(l){for(const s of this.shades.filter(v=>v.state!=="removed"&&dXZ(v.pos,l.pos)<=6)){const dx=s.pos[0]-l.pos[0],dz=s.pos[2]-l.pos[2],d=Math.hypot(dx,dz);s.pos[0]=l.pos[0]+(d?dx/d:1)*6;s.pos[2]=l.pos[2]+(d?dz/d:0)*6;s.pushTicks=30;if(s.state==="drain"||s.state==="chase")s.state="wander";}}
 endNight(result,reason){if(result==="won"){this.nightScore+=this.lanterns.filter(l=>l.lit).reduce((n,l)=>n+50+Math.floor(this.fuel(l)),0)+this.player.flames*TUNING.score.per_flame_left;this.score+=this.nightScore;}this.nightScore=0;this.emitAt(this.tick,"game_over",{result,reason,night:this.night,score:result==="won"?this.score-this.initialTotalScore:0,total_score:this.score});this.state=result;}
 movePlayer(input,world){
  const p=this.player,was=this.prev;
  if(Math.hypot(...world)>.001)p.facing=[world[0],world[1]];
  if(input.dash&&!was.dash&&p.dashTicks===0&&(p.dashCdTicks===0||this.charmActive)){p.dashTicks=Math.round(TUNING.dash_duration_s*60);p.dashDir=Math.hypot(...world)>.001?[...world]:[...p.facing];if(!this.charmActive)p.dashCdTicks=Math.round(TUNING.dash_cooldown_s*60);this.emit("dash",{});}
  if(input.jump&&!was.jump&&p.grounded){p.vel[1]=7.2;p.grounded=false;this.emit("jump",{});}

  const step=1/60;
  if(p.dashTicks>0){p.vel[0]=p.dashDir[0]*TUNING.dash_speed;p.vel[2]=p.dashDir[1]*TUNING.dash_speed;p.dashTicks--;}
  else if(p.launchLock){/* launch velocity is held until landing */}
  else {p.vel[0]=world[0]*this.moveSpeed;p.vel[2]=world[1]*this.moveSpeed;}
  const old=[...p.pos];let nx=p.pos[0]+p.vel[0]*step,nz=p.pos[2]+p.vel[2]*step;
  if(this.night===3&&Math.hypot(nx,nz)<2.15&&p.pos[1]<14&&p.pos[1]+1.6>6){nx=p.pos[0];nz=p.pos[2];p.vel[0]=0;p.vel[2]=0;}
  p.pos[0]=nx;p.pos[2]=nz;
  if(this.night===3&&this.windActive){const a=this.windDir*Math.PI/180;p.pos[0]+=Math.cos(a)*2*step;p.pos[2]+=Math.sin(a)*2*step;}
  if(p.grounded&&!input.jump&&!p.launchLock){const gy=groundYAt(p.pos[0],p.pos[2],this.night);if(gy!==null&&gy>=p.pos[1]-.05){p.pos[1]=gy;p.vel[1]=0;}else p.grounded=false;}
  if(!p.grounded){p.pos[1]+=p.vel[1]*step;p.vel[1]-=20*step;
   const gy=groundYAt(p.pos[0],p.pos[2],this.night);
   if(gy!==null&&old[1]>=gy-.02&&p.pos[1]<=gy){p.pos[1]=gy;p.vel[1]=0;p.grounded=true;p.launchLock=false;p.dashTicks=0;}
   else if(p.pos[1]<-2&&TUNING.fall_enabled)this.fallHit();
  }
  if(p.grounded){for(const pad of this.map.pads)if(dXZ(p.pos,pad.pos)<=1){let dx=pad.target[0]-p.pos[0],dz=pad.target[2]-p.pos[2],n=Math.hypot(dx,dz)||1;p.vel[0]=dx/n*pad.vh;p.vel[2]=dz/n*pad.vh;p.vel[1]=pad.vy;p.grounded=false;p.launchLock=true;break;}}
 }
 checkFall(){if(TUNING.fall_enabled&&!this.player.grounded&&this.player.pos[1]<-2)this.fallHit();}
 fallHit(){
  const p=this.player;if(p.invulnTicks>0)return;
  const lost=p.carried;p.carried=0;p.flames--;p.invulnTicks=Math.ceil(TUNING.invuln_s*60);
  p.pos=[...this.map.lanterns[0].pos];if(groundYAt(p.pos[0],p.pos[2],this.night)===null)p.pos=[0,0,0];p.vel=[0,0,0];p.grounded=true;p.launchLock=false;
  this.emit("player_hit",{by:"fall",flames:p.flames,dropped:0,lost});
 }
 updateWind(){
  this.windActive=false;if(this.night!==3||!this.windEnabled)return;
  if(this.simTick%this.map.windInterval===0&&this.simTick>0)this.windDir=this.rand()*360;
  const phase=this.simTick%this.map.windInterval;
  this.windActive=phase>=0&&phase<this.map.windDuration;
 }
 applyPulse(input,was){
  const p=this.player;if(!input.pulse||was.pulse||p.pulseCdTicks>0||p.carried<TUNING.pulse_cost)return;
  p.carried-=TUNING.pulse_cost;p.pulseCdTicks=Math.round(TUNING.pulse_cooldown_s*60);
  const ids=[];
  for(const s of this.shades.filter(v=>v.state!=="removed"&&dXZ(p.pos,v.pos)<=TUNING.pulse_radius).sort(cmpId)){
   const wasDrain=s.state==="drain";s.state="stunned";s.stateTicksLeft=Math.round(TUNING.pulse_stun_s*60);const dx=s.pos[0]-p.pos[0],dz=s.pos[2]-p.pos[2],d=Math.hypot(dx,dz)||1;
   s.pos[0]+=dx/d*TUNING.pulse_push_m;s.pos[2]+=dz/d*TUNING.pulse_push_m;ids.push(s.id);this.nightScore+=wasDrain?TUNING.score.per_drain_stun:TUNING.score.per_stun;
  }
  for(const dr of this.drifters.filter(v=>v.state!=="removed"&&dXZ(p.pos,v.pos)<=TUNING.pulse_radius).sort(cmpId)){
   if(dr.state==="chase"){dr.state="flee";dr.stateTicksLeft=240;}
   else if(dr.state==="flee"&&dr.stolen>0){const amount=dr.stolen;for(let i=0;i<amount;i++)this.addMote(dr.pos);dr.stolen=0;dr.stateTicksLeft=120;this.emit("drifter_drop",{drifter_id:dr.id,amount});}
  }
  this.emit("pulse",{stunned_ids:ids});
 }
 moveShades(){
  const p=this.player;
  for(const s of this.shades.filter(v=>v.state!=="removed").sort(cmpId)){
   if(s.pushTicks>0)continue;
   if(s.state==="spawning"||s.state==="stunned"||s.state==="recoil")continue;
   const playerDist=dXZ(p.pos,s.pos),protectedByLamp=this.lanterns.some(l=>this.safeLantern(l)&&dXZ(s.pos,l.pos)<=TUNING.safe_radius);
   if(protectedByLamp){if(s.state==="chase")s.state="wander";continue;}
   if(s.state==="drain"){
    const target=this.lanterns.find(l=>l.id===s.target_lantern_id);
    if(playerDist<=6){s.state="chase";s.target_lantern_id=null;continue;}
    if(!target||!target.lit||this.fuel(target)>=TUNING.low_fuel_threshold||dXZ(s.pos,target.pos)>2){s.state="wander";s.target_lantern_id=null;}
    else continue;
   }
   if(s.state==="chase"){if(playerDist>15)s.state="wander";else if(playerDist>.01){s.pos[0]+=(p.pos[0]-s.pos[0])/playerDist*TUNING.shade_speed/60;s.pos[2]+=(p.pos[2]-s.pos[2])/playerDist*TUNING.shade_speed/60;}continue;}
   const weak=this.lanterns.filter(l=>l.lit&&this.fuel(l)<TUNING.low_fuel_threshold).sort((a,b)=>dXZ(s.pos,a.pos)-dXZ(s.pos,b.pos)||cmpId(a,b))[0];
   const target=weak||this.lanterns.filter(l=>!l.lit).sort((a,b)=>dXZ(s.pos,a.pos)-dXZ(s.pos,b.pos)||cmpId(a,b))[0];
   if(target){s.target_lantern_id=target.id;const d=dXZ(s.pos,target.pos);if(d<=2){if(target.lit&&this.fuel(target)<TUNING.low_fuel_threshold){s.state="drain";continue;}}
    else if(d>.01){s.pos[0]+=(target.pos[0]-s.pos[0])/d*TUNING.shade_speed/60;s.pos[2]+=(target.pos[2]-s.pos[2])/d*TUNING.shade_speed/60;}
   }else{const a=this.simTick*.01+this.shades.indexOf(s);s.pos[0]+=Math.cos(a)*.5/60;s.pos[2]+=Math.sin(a)*.5/60;}
   if(playerDist<=15&&s.state!=="drain")s.state="chase";
  }
 }
 moveDrifters(){
  const p=this.player;
  for(const d of this.drifters.filter(v=>v.state!=="removed").sort(cmpId)){
   const dx=p.pos[0]-d.pos[0],dz=p.pos[2]-d.pos[2],dist=Math.hypot(dx,dz);
   if(d.state==="idle"&&p.carried>=5&&dist<=15)d.state="chase";
   if(d.state==="chase"&&(p.carried<5||dist>15))d.state="idle";
   if(d.state==="chase"&&dist>.01){d.pos[0]+=dx/dist*7/60;d.pos[2]+=dz/dist*7/60;}
   else if(d.state==="flee"&&dist>.01){d.pos[0]-=dx/dist*7/60;d.pos[2]-=dz/dist*7/60;}
   else if(d.state==="idle"){const a=this.simTick*.008+d.phase;d.pos[0]+=Math.cos(a)*2/60;d.pos[2]+=Math.sin(a)*2/60;}
  }
 }
 resolveContacts(){
  const p=this.player;
  for(const d of this.drifters.filter(v=>v.state==="chase").sort(cmpId))if(dXZ(p.pos,d.pos)<=1.2){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen+=amount;d.state="flee";d.stateTicksLeft=240;this.emit("drifter_steal",{drifter_id:d.id,amount,carried:p.carried});}
  for(const s of this.shades.filter(v=>(v.state==="chase"||v.state==="wander")&&v.pushTicks===0).sort(cmpId)){
   if(dXZ(p.pos,s.pos)<=TUNING.shade_hit_radius&&p.invulnTicks===0&&!this.lanterns.some(l=>this.safeLantern(l)&&dXZ(s.pos,l.pos)<=TUNING.safe_radius)){
    p.flames--;p.invulnTicks=Math.ceil(TUNING.invuln_s*60);const dropped=Math.floor(p.carried*TUNING.hit_drop_ratio);p.carried-=dropped;
    for(let i=0;i<dropped;i++)this.addMote(p.pos);s.state="recoil";s.stateTicksLeft=15;
    this.emit("player_hit",{by:"shade",flames:p.flames,dropped,lost:0});
   }
  }
 }
 spawnScheduled(){
  const t=this.simTick+1,alive=this.shades.filter(s=>s.state!=="removed").length;
  const shouldSpawn=this.night===1?(t>=300&&(t-300)%480===0):(t%this.map.shadeInterval===0);
  if(this.randomShades&&shouldSpawn&&alive<this.map.shadeMax){
   const count=this.night===1&&t===300?Math.min(this.map.shadeInitial,this.map.shadeMax-alive):1;
   for(let c=0;c<count;c++){let picked=null;for(let j=0;j<this.map.shadePoints.length;j++){const ix=(this.shadeSpawnCursor+j)%this.map.shadePoints.length,pos=this.map.shadePoints[ix];if(dXZ(pos,this.player.pos)>=15){picked=pos;this.shadeSpawnCursor=(ix+1)%this.map.shadePoints.length;break;}}
    if(!picked)continue;const id="S"+(++this.shadesCreated);this.shades.push({id,pos:[...picked],state:"spawning",stateTicksLeft:1,stunTicks:0,target_lantern_id:null,pushTicks:0});this.emit("shade_spawned",{id});}
  }
  if(this.randomDrifters&&this.night>1&&t%1200===0&&this.drifters.filter(d=>d.state!=="removed").length<2){this.spawnDrifter();}
 }
 spawnDrifter(){
  this.driftersCreated++;let pos;
  if(this.night===2){const cx=this.rand()<.5?0:70,a=this.rand()*Math.PI*2,r=8+this.rand()*17;pos=[cx+Math.cos(a)*r,0,Math.sin(a)*r];}
  else {const a=this.rand()*Math.PI*2,r=34+this.rand()*8;pos=[Math.cos(a)*r,0,Math.sin(a)*r];}
  const id="D"+this.driftersCreated;this.drifters.push({id,pos,state:"idle",stolen:0,stateTicksLeft:0,phase:this.rand()*6.28});
 }
 snapshot(){
  const p=this.player;
  return {type:"snapshot",tick:this.tick,sim_tick:this.simTick,night:this.night,state:this.state,time_left_s:rnd(this.timeLeft),score:(this.state==="playing"||this.state==="paused"?this.score+this.nightScore:this.score),
   wind:{active:this.windActive,dir_deg:rnd(this.windDir)},successful_lights:this.successfulLights,player:{pos:p.pos.map(rnd),vel:p.vel.map(rnd),flames:p.flames,carried:p.carried,capacity:this.capacity,grounded:p.grounded,invuln:p.invulnTicks>0,dash_cd_s:rnd(p.dashCdTicks/60),pulse_cd_s:rnd(p.pulseCdTicks/60),charm_s:rnd(p.charmTicks/60)},
   lanterns:this.lanterns.map(l=>({id:l.id,pos:l.pos.map(rnd),lit:l.lit,fuel:rnd(this.fuel(l)),ever_lit:l.ever_lit,relit_count:l.relit_count,deposited:l.deposited})),
   shades:this.shades.map(s=>({id:s.id,pos:s.pos.map(rnd),state:s.state,target_lantern_id:s.target_lantern_id})),
   motes:this.motes.map(m=>({id:m.id,pos:m.pos.map(rnd),kind:m.kind,ttl_s:m.ttlTicks===null?null:rnd(m.ttlTicks/60)})),
   drifters:this.drifters.map(d=>({id:d.id,pos:d.pos.map(rnd),state:d.state,stolen:d.stolen})),
   charms:this.charms.map(c=>({id:c.id,available:c.available,respawn_s:c.available?0:rnd(c.respawnTicks/60)}))};
 }
}
