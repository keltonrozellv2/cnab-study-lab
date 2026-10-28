const fs=require('fs');
eval(fs.readFileSync('cnt.js','utf8').split('eval(')[0]);
const test=`
let bad=0,tot=0,longest=0,withTail=0;const ex={};
for(const key in SCENARIOS){const g=scnGen(key.split("|")[0],key.split("|")[1]);
  for(let i=0;i<300;i++){const it=g(mulberry32(i*13+7));tot++;const ts=it.opts.map(o=>o.t.trim().toLowerCase());
    if(new Set(ts).size!==4){bad++;if(!ex[key]){ex[key]=it.opts.map(o=>o.t)}}
    const L=it.opts.map(o=>o.t.length);const mx=Math.max(...L);if(L[it.a]===mx&&L.filter(x=>x===mx).length===1)longest++;
    if(/ — /.test(it.opts[it.a].t))withTail++;}}
console.log("scenario items",tot,"duplicate-option items",bad,"correct-is-longest",(longest/tot*100).toFixed(1)+"%","tails",withTail);
for(const k in ex)console.log(k,JSON.stringify(ex[k]));
// generic gens too
let gt=0,gl=0;for(const cat in GENS){for(let i=0;i<300;i++){const it=GENS[cat][i%GENS[cat].length](mulberry32(i*31+3));gt++;const L=it.opts.map(o=>o.t.length);const mx=Math.max(...L);if(L[it.a]===mx&&L.filter(x=>x===mx).length===1)gl++}}
console.log("GENS items",gt,"correct-is-longest",(gl/gt*100).toFixed(1)+"%");
`;
eval(fs.readFileSync('full_script.js','utf8')+test);
