const fs=require('fs');function fakeEl(){return new Proxy({},{get:(t,k)=>k==="classList"?{toggle(){},add(){},remove(){},contains(){return false}}:k==="style"?{}:k==="children"?[]:(k==="querySelectorAll"?()=>[]:(typeof k==="string"&&/^(on|inner|text|hidden|value|id|className|title|dataset)/.test(k))?undefined:()=>fakeEl())})}
global.document={getElementById:()=>fakeEl(),querySelector:()=>fakeEl(),querySelectorAll:()=>[],addEventListener(){},createElement:()=>fakeEl(),body:fakeEl(),documentElement:{classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},removeAttribute(){},getAttribute(){return null},style:{removeProperty(){},setProperty(){}}}};global.window={scrollTo(){},addEventListener(){},scrollY:0};global.matchMedia=()=>({matches:false});global.setInterval=()=>0;global.clearInterval=()=>{};global.setTimeout=()=>0;global.alert=()=>{};global.navigator={};global.location={protocol:"file:"};global.performance={now:()=>0};global.requestAnimationFrame=()=>0;
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
eval(fs.readFileSync('full_script.js','utf8')+`
const used=new Set();for(const a in CLUSTERS)for(const c of CLUSTERS[a])c.tags.forEach(t=>used.add(a+"/"+t));
const m={};for(const q of BANK){const k=mapArea(q.a)+"/"+q.s;m[k]=(m[k]||0)+1}
const un=Object.entries(m).filter(([k])=>!used.has(k));console.log("BANK",BANK.length,"unreached",un.reduce((s,[,n])=>s+n,0));
console.log(un.sort().map(x=>x.join("=")).join("; "));`);
