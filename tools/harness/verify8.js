global.localStorage={getItem:()=>null,setItem:()=>{}};const fakeEl=()=>new Proxy({style:{removeProperty(){},setProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},removeAttribute(){},getAttribute(){return null},addEventListener(){},appendChild(){},remove(){},querySelector(){return fakeEl()},querySelectorAll(){return[]},scrollIntoView(){}},{get(t,p){return p in t?t[p]:undefined},set(t,p,v){t[p]=v;return true}});
global.document={getElementById:()=>fakeEl(),querySelector:()=>fakeEl(),querySelectorAll:()=>[],addEventListener(){},createElement:()=>fakeEl(),body:fakeEl(),documentElement:{classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},removeAttribute(){},getAttribute(){return null},style:{removeProperty(){},setProperty(){}}}};global.window={scrollTo(){},addEventListener(){},scrollY:0};global.matchMedia=()=>({matches:false});global.setInterval=()=>0;global.clearInterval=()=>{};global.setTimeout=()=>0;global.alert=()=>{};global.navigator={};global.location={protocol:"file:"};global.performance={now:()=>0};global.requestAnimationFrame=()=>0;
(0,eval)(require("fs").readFileSync("full_script.js","utf8")+";Object.assign(globalThis,{SCENARIOS,CLUSTERS,sessionDealer,makeDealer,clusterStatics,buildTest,stemKey,mulberry32,AREAS,show,maybeBoss,bossPool,noteMiss,gameLoad,gameSave,drawArea,getBOSS:()=>BOSS,clearBoss:()=>{BOSS=null},setS:(x)=>{S=x}})");
let bad=[];
// 1) every cluster: 40 draws, no stem repeats until the static deck is exhausted
for(const area in CLUSTERS)for(const c of CLUSTERS[area]){const n=clusterStatics(area,c).length;if(n===0&&!c.gens.length&&!(typeof SCENARIOS!=="undefined"&&SCENARIOS[area+"|"+c.n])){bad.push("empty cluster "+area+"/"+c.n);continue}
  for(let s=0;s<5;s++){const d=sessionDealer(area,c.n,mulberry32(s*7+1));const seen=new Map();const draws=Math.min(40,n+30);let repeatsBeforeExhaust=0;
    for(let i=0;i<draws;i++){const it=d.next();if(!it){bad.push("null draw "+area+"/"+c.n);break}const k=stemKey(it);const prev=seen.get(k);if(prev!==undefined&&i<n)repeatsBeforeExhaust++;seen.set(k,i)}
    if(repeatsBeforeExhaust)bad.push(`repeat before exhaust ${area}/${c.n} (${n} statics): ${repeatsBeforeExhaust}`)}}
// 2) whole-area sessions: 60 draws, distinct stems
for(const a of AREAS){const d=sessionDealer(a.k,null,mulberry32(99));const ks=new Set();for(let i=0;i<60;i++)ks.add(stemKey(d.next()));if(ks.size<55)bad.push("area "+a.k+" only "+ks.size+" distinct in 60")}
// 3) tests: 100-q, no dup
for(let t=0;t<100;t++){const items=buildTest(mulberry32(t*3+1),100);const ks=new Set(items.map(stemKey));if(ks.size!==items.length)bad.push("test dup "+t);if(items.length!==100)bad.push("test len "+items.length)}
// 4) boss: seed 6 misses, simulate 200 questions, count spawns
for(let i=0;i<6;i++){const it=drawArea(mulberry32(i+40),"net",null);noteMiss(it)}
let spawns=0;const r=mulberry32(5);for(let q=0;q<400;q++){setS({run:{t:10},mode:"practice"});if(maybeBoss(r,"guide")){spawns++;clearBoss()}}
console.log("boss spawn rate over 400 questions:",(spawns/400*100).toFixed(1)+"% (target ~15%)");
// 5) boss pool variety and beaten exclusion
const sets=[];for(let i=0;i<6;i++)sets.push(bossPool(mulberry32(i+1)).map(x=>x.key).sort().join());console.log("distinct boss line-ups in 6 draws:",new Set(sets).size);
const X=gameLoad();const bk=bossPool(mulberry32(1))[0].key;X.beatenAt={[bk]:X.bossWins||0};X.miss[bk].n=0;gameSave(X);const p2=bossPool(mulberry32(1));if(p2.some(x=>x.key===bk))bad.push("beaten question reappeared");
{const Y=gameLoad();Y.bossWins=(Y.bossWins||0)+2;Y.miss[bk].n=3;gameSave(Y);const p3=[];for(let i=0;i<30;i++)p3.push(...bossPool(mulberry32(i)));if(!p3.some(x=>x.key===bk))bad.push("beaten question never returned after 2 wins + new misses")}
for(const v of["home","guide","phase1","test","matrix","progress","shop"]){try{show(v)}catch(e){bad.push("render "+v+": "+e.message)}}
console.log("FAILURES:",bad.length);bad.slice(0,12).forEach(x=>console.log(" ",x));
