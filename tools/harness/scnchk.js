const fs=require('fs');
eval(fs.readFileSync('cnt.js','utf8').split('eval(')[0]);
const test=`
let bad=0,tot=0;const seen={};
for(const key in SCENARIOS){const parts=key.split("|");const g=scnGen(parts[0],parts[1]);const ss=new Set();
  for(let i=0;i<200;i++){const it=g(mulberry32(i*13+7));tot++;ss.add(it.q);
    if(it.opts.length!==4){bad++;if(bad<8)console.log("OPTCOUNT",key,it.opts.length)}
    if(it.a==null||it.a<0||it.a>3){bad++;console.log("BADIDX",key)}}
  seen[key]=ss.size;}
console.log("scenario keys:",Object.keys(SCENARIOS).length,"generated",tot,"bad",bad);
const worst=Object.entries(seen).sort((a,b)=>a[1]-b[1]).slice(0,5);
console.log("fewest distinct/200:",worst.map(x=>x[0]+"="+x[1]).join(", "));
const k=Object.keys(SCENARIOS)[12];const it=scnGen(k.split("|")[0],k.split("|")[1])(mulberry32(5));
console.log("\\nSAMPLE "+k);console.log(it.q);it.opts.forEach((o,i)=>console.log((i===it.a?"* ":"  ")+o.t));
`;
eval(fs.readFileSync('full_script.js','utf8')+test);
