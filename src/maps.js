const TAU=Math.PI*2;
const polar=(x,z,r,d,y=0)=>[x+Math.cos(d*Math.PI/180)*r,y,z+Math.sin(d*Math.PI/180)*r];
const points=(cx,cz,r,count,start=0,y=0)=>Array.from({length:count},(_,i)=>polar(cx,cz,r,start+i*360/count,y));
const lanterns1=[["L1",0,0,25],["L2",23.8,0,7.7],["L3",14.7,0,-20.2],["L4",-14.7,0,-20.2],["L5",-23.8,0,7.7]];
const lanterns2=[["L1",0,0,20],["L2",17,0,-10],["L3",-17,0,-10],["L4",70,0,20],["L5",87,0,-10],["L6",53,0,-10]];
const lanterns3=[["L1",0,6,6],["L2",18,3,10],["L3",-18,3,10],["L4",35,0,-10],["L5",-35,0,-10],["L6",20,0,-35],["L7",-20,0,-35]];
const asLanterns=a=>a.map(([id,x,y,z])=>({id,pos:[x,y,z],lit:false,deposited:0}));
function night1(){return {night:1,name:"Đêm 1 — Đảo Bến",duration:300,lanterns:asLanterns(lanterns1),motePoints:[...points(0,0,12,8),...points(0,0,33,16)],shadePoints:points(0,0,37,12,15),shadeInterval:480,shadeInitial:2,shadeMax:6,islands:[{x:0,z:0,r:40}],pads:[],ramps:[],charmPoints:[]};}
function night2(){const motePoints=[],shadePoints=[];for(const [x,z] of [[0,0],[70,0]]){motePoints.push(...points(x,z,10,4),...points(x,z,22,8));shadePoints.push(...points(x,z,26,8,22.5));}
 return {night:2,name:"Đêm 2 — Hai Đảo",duration:360,lanterns:asLanterns(lanterns2),motePoints,shadePoints,shadeInterval:420,shadeInitial:0,shadeMax:8,islands:[{x:0,z:0,r:28},{x:70,z:0,r:28}],bridge:{x0:26,x1:44,z0:-2,z1:2},pads:[{pos:[20,0,18],target:[70,0,0],vy:14,vh:24},{pos:[50,0,-18],target:[0,0,0],vy:14,vh:24}],ramps:[],charmPoints:[{id:"C1",pos:[35,0,0]}]};}
function night3(){const motePoints=[...points(0,0,34,18),...Array.from({length:8},(_,i)=>polar(0,0,18,20+i*20,3)),...points(0,0,5,4,45,6)],shadePoints=points(0,0,43,16,0);
 return {night:3,name:"Đêm 3 — Đảo Ba Tầng",duration:360,lanterns:asLanterns(lanterns3),motePoints,shadePoints,shadeInterval:360,shadeInitial:0,shadeMax:10,islands:[{x:0,z:0,r:45}],bridge:null,pads:[{pos:[0,3,13],target:[0,3,-1],vy:12,vh:8}],ramps:[30,150],charmPoints:[{id:"C1",pos:[30,0,25]},{id:"C2",pos:[-30,0,25]}],windInterval:1800,windDuration:300,windWarning:120};}
export function mapFor(night){if(night===1)return night1();if(night===2)return night2();if(night===3)return night3();throw Error("night must be 1, 2, or 3");}
export function groundYAt(x,z,night){
 const r=Math.hypot(x,z);
 if(night===1)return r<=40?0:null;
 if(night===2)return r<=28||Math.hypot(x-70,z)<=28||(x>=26&&x<=44&&z>=-2&&z<=2)?0:null;
 for(const deg of [30,150]){let a=Math.atan2(z,x),da=Math.atan2(Math.sin(a-deg*Math.PI/180),Math.cos(a-deg*Math.PI/180)),along=r*Math.cos(da),side=Math.abs(r*Math.sin(da));if(along>=24&&along<=30&&side<=1.5)return (30-along)/2;}
 if(r<=8)return 6;
 if(r>=12&&r<=24&&z>0)return 3;
 return r<=45?0:null;
}
export function landContains(x,z,night){return groundYAt(x,z,night)!==null;}
