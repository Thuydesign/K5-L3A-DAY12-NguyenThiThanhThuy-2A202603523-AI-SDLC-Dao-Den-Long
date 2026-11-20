export const TUNING = {
  player_speed: 5, carry_capacity: 5, lantern_cost: 3, lantern_count_night1: 5,
  pickup_radius: 1.25, interact_radius: 2, pulse_cost: 1, pulse_radius: 6,
  night1_duration_s: 300, flames: 3, invuln_s: 1.5, hit_drop_ratio: 0.5,
  pulse_stun_s: 2, pulse_push_m: 2, pulse_cooldown_s: 1, safe_radius: 4,
  shade_speed: 2.2, shade_hit_radius: 1, fall_enabled: false,
  score: { per_mote: 10, per_lantern: 100, per_stun: 5, per_second_left: 1, per_flame_left: 20 }
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const round=v=>Math.round(v*1000)/1000;
function rng(seed){let x=(seed|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export class Game {
  constructor({seed=1,scenario=null,night=1}={}) {
    if(night!==1) throw Error("Only --night 1 is supported in Phase 1");
    this.rand=rng(seed); this.tick=0; this.state="playing"; this.events=[]; this.score=0;
    this.timeLeft=TUNING.night1_duration_s; this.player={pos:[0,0,0],flames:TUNING.flames,carried:0};
    this.lanterns=Array.from({length:5},(_,i)=>({id:"L"+(i+1),pos:[Math.cos(i*Math.PI*2/5)*18,0,Math.sin(i*Math.PI*2/5)*18],lit:false,deposited:0}));
    this.motes=[]; this.shades=[]; this.randomMotes=true; this.randomShades=true;
    this.pulseReady=0; this.invulnUntil=0; this.prev={jump:false,interact:false,pulse:false};
    if(scenario) this.loadScenario(scenario);
    else {
      for(let i=0;i<20;i++) this.motes.push({id:"M"+(i+1),pos:[(this.rand()-.5)*34,0,(this.rand()-.5)*34]});
      for(let i=0;i<3;i++) this.shades.push({id:"S"+(i+1),pos:[(this.rand()-.5)*34,0,(this.rand()-.5)*34],state:"chase",stunUntil:0});
    }
  }
  emit(name,data={}){this.events.push({type:"event",tick:this.tick+1,name,data});}
  loadScenario(s){
    if(s.player){const p=s.player;if(p.pos)this.player.pos=[...p.pos];if(p.carried!==undefined)this.player.carried=p.carried;if(p.flames!==undefined)this.player.flames=p.flames;}
    if(s.time_left_s!==undefined)this.timeLeft=s.time_left_s;
    if(s.random_motes!==undefined)this.randomMotes=s.random_motes;
    if(s.random_shades!==undefined)this.randomShades=s.random_shades;
    if(s.motes!==undefined)this.motes=s.motes.map((p,i)=>({id:"M"+(i+1),pos:[...p]}));
    if(s.shades!==undefined)this.shades=s.shades.map((v,i)=>({id:v.id||"S"+(i+1),pos:[...v.pos],state:"chase",stunUntil:0}));
    if(s.lanterns)for(const patch of s.lanterns){const l=this.lanterns.find(v=>v.id===patch.id);if(l){if(patch.pos)l.pos=[...patch.pos];if(patch.deposited!==undefined)l.deposited=patch.deposited;if(patch.lit!==undefined)l.lit=patch.lit;}}
  }
  step(input={}) {
    if(this.state!=="playing")return;
    const k=this.tick, prev=this.prev;
    const move=input.move||[0,0], yaw=(input.cam_yaw_deg||0)*Math.PI/180;
    let x=move[0]*Math.cos(yaw)+move[1]*Math.sin(yaw), z=-move[0]*Math.sin(yaw)+move[1]*Math.cos(yaw);
    const n=Math.hypot(x,z);if(n>1){x/=n;z/=n;}
    this.player.pos[0]+=x*TUNING.player_speed/60;this.player.pos[2]+=z*TUNING.player_speed/60;
    if(input.jump&&!prev.jump) this.player.pos[1]=Math.min(1.2,this.player.pos[1]+.8);
    else this.player.pos[1]=Math.max(0,this.player.pos[1]-.08);
    if(this.player.pos[1]<.08)this.player.pos[1]=0;
    if(input.pulse&&!prev.pulse&&k>=this.pulseReady&&this.player.carried>=TUNING.pulse_cost){
      this.player.carried-=TUNING.pulse_cost;this.pulseReady=k+TUNING.pulse_cooldown_s*60;
      const hit=[];
      for(const s of this.shades)if(dist(this.player.pos,s.pos)<=TUNING.pulse_radius){s.state="stunned";s.stunUntil=k+TUNING.pulse_stun_s*60;
        const dx=s.pos[0]-this.player.pos[0],dz=s.pos[2]-this.player.pos[2],d=Math.hypot(dx,dz)||1;
        s.pos[0]+=dx/d*TUNING.pulse_push_m;s.pos[2]+=dz/d*TUNING.pulse_push_m;hit.push(s.id);this.score+=TUNING.score.per_stun;}
      this.emit("pulse",{stunned_ids:hit});
    }
    if(input.interact&&!prev.interact){
      const l=this.lanterns.filter(v=>!v.lit&&dist(this.player.pos,v.pos)<=TUNING.interact_radius).sort((a,b)=>dist(this.player.pos,a.pos)-dist(this.player.pos,b.pos))[0];
      if(l&&this.player.carried>0){const amount=Math.min(this.player.carried,TUNING.lantern_cost-l.deposited);if(amount>0){this.player.carried-=amount;l.deposited+=amount;this.emit("deposit",{lantern_id:l.id,amount,deposited:l.deposited});}
        if(l.deposited>=TUNING.lantern_cost){l.lit=true;this.score+=TUNING.score.per_lantern;this.emit("lantern_lit",{lantern_id:l.id});}}
    }
    for(let i=this.motes.length-1;i>=0;i--)if(this.player.carried<TUNING.carry_capacity&&dist(this.player.pos,this.motes[i].pos)<=TUNING.pickup_radius){this.motes.splice(i,1);this.player.carried++;this.score+=TUNING.score.per_mote;this.emit("mote_picked",{carried:this.player.carried});}
    for(const s of this.shades){
      if(s.state==="stunned"){if(k>=s.stunUntil)s.state="chase";else continue;}
      const protectedNear=this.lanterns.some(l=>l.lit&&dist(s.pos,l.pos)<=TUNING.safe_radius);
      if(!protectedNear){const dx=this.player.pos[0]-s.pos[0],dz=this.player.pos[2]-s.pos[2],d=Math.hypot(dx,dz);
        if(d>.05){s.pos[0]+=dx/d*TUNING.shade_speed/60;s.pos[2]+=dz/d*TUNING.shade_speed/60;}
        if(d<=TUNING.shade_hit_radius&&k>=this.invulnUntil){this.player.flames--;this.invulnUntil=k+TUNING.invuln_s*60;
          const dropped=Math.floor(this.player.carried*TUNING.hit_drop_ratio);this.player.carried-=dropped;
          for(let j=0;j<dropped;j++)this.motes.push({id:"D"+k+"-"+j,pos:[this.player.pos[0]+(j%2)*.5,0,this.player.pos[2]+Math.floor(j/2)*.5]});
          this.emit("player_hit",{by:"shade",flames:this.player.flames,dropped});if(this.player.flames<=0)this.pendingLoss=true;}
      }
    }
    if(this.randomMotes&&this.tick>0&&this.tick%120===0&&this.motes.length<20){this.motes.push({id:"M"+(this.tick/120+20),pos:[(this.rand()-.5)*36,0,(this.rand()-.5)*36]});}
    if(this.randomShades&&this.tick>0&&this.tick%900===0&&this.shades.length<5){const id="S"+(this.shades.length+1),a=this.rand()*Math.PI*2,r=12+this.rand()*4;this.shades.push({id,pos:[Math.cos(a)*r,0,Math.sin(a)*r],state:"chase",stunUntil:0});this.emit("shade_spawned",{id});}
    this.timeLeft=Math.max(0,TUNING.night1_duration_s-(k+1)/60);this.tick++;
    this.prev={jump:!!input.jump,interact:!!input.interact,pulse:!!input.pulse};
    if(this.state==="playing"&&this.lanterns.every(l=>l.lit)){this.score+=Math.floor(this.timeLeft)*TUNING.score.per_second_left+this.player.flames*TUNING.score.per_flame_left;this.finish("won","all_lit");}
    else if(this.state==="playing"&&this.timeLeft<=0)this.finish("lost","dawn");
  }
  finish(state,reason){this.state=state;this.events.push({type:"event",tick:this.tick,name:"game_over",data:{result:state,reason}});}
  snapshot(){return {type:"snapshot",tick:this.tick,sim_tick:this.tick,state:this.state,time_left_s:round(this.timeLeft),score:this.score,
    player:{pos:this.player.pos.map(round),flames:this.player.flames,carried:this.player.carried},
    lanterns:this.lanterns.map(l=>({id:l.id,pos:l.pos.map(round),lit:l.lit,deposited:l.deposited})),
    shades:this.shades.map(s=>({id:s.id,pos:s.pos.map(round),state:s.state})),motes_active:this.motes.length,
    motes:this.motes.map(m=>({id:m.id,pos:m.pos.map(round)}))};}
}
