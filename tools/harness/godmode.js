const fs=require('fs');
eval(fs.readFileSync('cnt.js','utf8').split('eval(')[0]);
const test=`
const now=new Date();const iso=(d,h)=>{const x=new Date(now);x.setDate(x.getDate()-d);x.setHours(h,0,0,0);return x.toISOString()};
const hist=[];
for(let d=11;d>=0;d--){ // 12 straight days
  ["fund","net","os","prog","sec"].forEach((k,i)=>hist.push({date:iso(d,9+i),mode:"Practice",scope:SHORT[k]+" practice",ok:28,total:30,area:null}));
  hist.push({date:iso(d,15),mode:"Gate drill",scope:"Step 1 · Name the gate",ok:10,total:10,secs:200,area:null});
  hist.push({date:iso(d,16),mode:"Matrix test",scope:"Step 4 · Everything, 60 seconds",ok:11,total:12,secs:600,area:null});
  const area={fund:{ok:5,t:5},net:{ok:12,t:12},os:{ok:16,t:17},prog:{ok:6,t:6},sec:{ok:9,t:10}};
  hist.push({date:iso(d,17),mode:"Test (timed)",scope:"Full CNT",ok:48,total:50,secs:2400,area});
  hist.push({date:iso(d,18),mode:"Matrix test",scope:"HELL · 12 matrices, no clock",ok:10,total:12,secs:900,area:null});
}
const steps={};MTRACK.forEach(s=>steps[s.id]={best:1,passes:3});
const mstats={};["gate:or","gate:and","gate:xor","gate:nand","gate:nor","apm","multi","hard","prog","dist","or","and","xor","hell"].forEach(k=>mstats[k]={ok:40,t:44,secs:600});
const topics={},at={};for(const a in CLUSTERS){at[a]={ok:300,t:330};CLUSTERS[a].forEach(c=>topics[a+"|"+c.n]={ok:14,t:16})}
const achAt={};ACH.forEach(a=>achAt[a.id]=iso(1,12));
const cos={themes:Object.keys(THEMES),buddies:Object.keys(BUDDIES),theme:"aurora",buddy:"phoenix"};
const xp={xp:0,steps,mstats,gold:1000000,bag:{elim:99,reveal:99,time:99},pw:{shield:9,lucky:9,magnet:9},miss:{},badges:["First boss kill","Flawless kill"],bossWins:25,cos,topics,at,achSeen:ACH.map(a=>a.id),achAt,labsDone:Object.keys(LABS),sectorClaimed:ROAD.map(n=>n.id),questsDone:40,learned:Object.keys(topics),masteredSeen:Object.keys(topics),rewards:[],bossHist:[],pwv:1};
// max level: find xp for level 60
let x=0;while(levelFor(x).lvl<60)x+=500;xp.xp=x;
const out={app:"cnab-lab-pro",v:1,exported:now.toISOString(),hist,weak:[],xp,pref:{zoom:100,theme:null}};
require("fs").writeFileSync(process.env.GODMODE_OUT||"cnab-godmode-profile.json",JSON.stringify(out));
console.log("level",levelFor(x).lvl,"xp",x,"hist",hist.length,"topics",Object.keys(topics).length,"ach",ACH.length);
`;
eval(fs.readFileSync('full_script.js','utf8')+test);
