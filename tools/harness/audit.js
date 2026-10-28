global.localStorage={getItem:()=>null,setItem:()=>{}};const fakeEl=()=>new Proxy({style:{},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},removeAttribute(){},addEventListener(){},querySelector(){return fakeEl()},querySelectorAll(){return[]}},{get(t,p){return p in t?t[p]:undefined},set(t,p,v){t[p]=v;return true}});
global.document={getElementById:()=>fakeEl(),querySelector:()=>fakeEl(),querySelectorAll:()=>[],addEventListener(){},createElement:()=>fakeEl(),body:fakeEl(),documentElement:{classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},removeAttribute(){},getAttribute(){return null},style:{removeProperty(){},setProperty(){}}}};global.window={scrollTo(){},addEventListener(){}};global.matchMedia=()=>({matches:false});global.setInterval=()=>0;global.clearInterval=()=>{};global.setTimeout=()=>0;
(0,eval)(require("fs").readFileSync("full_script.js","utf8")+";Object.assign(globalThis,{genAPM,mulberry32,svgOf,matrixHTML,L8,GATES})");
const seed=+process.argv[2]||20261016;const r=mulberry32(seed);
const items=[];const seen=new Set();while(items.length<20){const it=genAPM(r);const k=it.grid.flat().map(c=>c.key).join();if(seen.has(k))continue;seen.add(k);items.push(it)}
/* INDEPENDENT SOLVER: works only from cell keys (what the picture encodes), never from it.answer */
function solve(it){
  const G=it.grid;const keys=G.map(row=>row.map(c=>c.key));
  const picOf=c=>svgOf(c.items);
  const optsPic=it.opts.map(picOf);
  // 1) gate families: keys like "ovor12" / "bknand37" -> mask numbers
  if(it.gi){const M=keys.map(row=>row.map(k=>+k.replace(/^\D+/,"")));const FULL=it.gi.FULL;
    const F={or:(a,b)=>a|b,and:(a,b)=>a&b,xor:(a,b)=>a^b,nand:(a,b)=>(~(a&b))&FULL,nor:(a,b)=>(~(a|b))&FULL};
    // which gates fit BOTH complete rows?
    const fits=GATES.filter(g=>F[g](M[0][0],M[0][1])===M[0][2]&&F[g](M[1][0],M[1][1])===M[1][2]);
    const preds=[...new Set(fits.map(g=>F[g](M[2][0],M[2][1])))];
    const matches=preds.map(m=>it.opts.findIndex(o=>+o.key.replace(/^\D+/,"")===m)).filter(i=>i>=0);
    return{fits,matches,method:"gate"};
  }
  // 2) feature families: key = "h|shape|dir|count|through|line" etc. Treat each key segment as a feature; infer rule per feature from the 8 visible cells.
  const segs=keys.map(row=>row.map(k=>k.split("|")));const nf=segs[0][0].length;
  segs[2][2]=segs[2][2].map(()=>null); // the solver must NOT see the answer cell
  if(segs[0][0][0]==="s")for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(segs[i][j][2]==="1.00")segs[i][j][3]="*"; // a full fill shows no side
  const tagged=["h","s","f"].includes(segs[0][0][0]);const start=tagged?1:0;
  const preds=[];let ok=true;const rules=[];
  // wildcard handling: if any "*" present in feature f, try each concrete value and union the resulting predictions
  for(let f=start;f<nf;f++){
    const hasWild=segs.flat().some(c=>c[f]==="*");
    if(hasWild){const vals=[...new Set(segs.flat().map(c=>c[f]).filter(x=>x&&x!=="*"))].concat(["left","right","bottom"]);const union=new Set();let any=false;
      for(const sub of [...new Set(vals)]){const S2=segs.map(r=>r.map(c=>c.map((x,k)=>k===f&&x==="*"?sub:x)));const res=solveFeature(S2,f);if(res){any=true;res.forEach(x=>union.add(x))}}
      if(!any){ok=false;rules.push(["f"+f,"no rule found"]);preds.push(null)}else{rules.push(["f"+f,"wild"]);preds.push([...union])}continue}
    const res=solveFeature(segs,f);
    if(!res){ok=false;rules.push(["f"+f,"no rule found"]);preds.push(null)}else{rules.push(["f"+f,"ok"]);preds.push(res)}
  }
  function solveFeature(segs,f){
    const v=(i,j)=>segs[i][j][f];
    const cands=[];
    // row-constant
    if(v(0,0)===v(0,1)&&v(0,1)===v(0,2)&&v(1,0)===v(1,1)&&v(1,1)===v(1,2)&&v(2,0)===v(2,1))cands.push(["row",v(2,0)]);
    // col-constant
    if(v(0,0)===v(1,0)&&v(1,0)===v(2,0)&&v(0,1)===v(1,1)&&v(1,1)===v(2,1)&&v(0,2)===v(1,2))cands.push(["col",v(0,2)]);
    // latin: each row has 3 distinct, each col has 3 distinct -> missing = value not in row 2 and not in col 2
    {const rows=[0,1].every(i=>new Set([v(i,0),v(i,1),v(i,2)]).size===3);const cols=[0,1].every(j=>new Set([v(0,j),v(1,j),v(2,j)]).size===3);
     if(rows&&cols){const all=new Set([v(0,0),v(0,1),v(0,2)]);const miss=[...all].filter(x=>x!==v(2,0)&&x!==v(2,1)&&x!==v(0,2)&&x!==v(1,2));if(miss.length===1)cands.push(["latin",miss[0]])}}
    // progression: rotation cyclic mod 360, counts monotone. A row-progression needs the same step d in all three rows (row 3 checked on its two known cells); a column-progression needs the same d in all three columns.
    {const num=x=>(x===null||x===undefined||x===""||isNaN(+x))?null:+x;const a=[0,1,2].map(i=>[0,1,2].map(j=>num(v(i,j))));
     const known=a.flat().filter(x=>x!==null);
     if(known.length===8){const isRot=known.every(x=>x%90===0&&x<360);
       const diff=(x,y)=>isRot?(((x-y)%360)+360)%360:x-y;const add=(x,d)=>isRot?(((x+d)%360)+360)%360:x+d;
       const steps=isRot?[90,270,180]:[1,-1,2,-2];
       for(const d of steps){const D=isRot?(((d%360)+360)%360):d;
         const okRow=[0,1].every(i=>diff(a[i][1],a[i][0])===D&&diff(a[i][2],a[i][1])===D)&&diff(a[2][1],a[2][0])===D;
         if(okRow)cands.push(["prog",String(add(a[2][1],d))]);
         const okCol=[0,1].every(j=>diff(a[1][j],a[0][j])===D&&diff(a[2][j],a[1][j])===D)&&diff(a[1][2],a[0][2])===D;
         if(okCol)cands.push(["cprog",String(add(a[1][2],d))]);
       }}}
    const vals=[...new Set(cands.map(c=>c[1]))];
    return vals.length?vals:null;
  }
  if(!ok)return{method:"feature",rules,matches:[],fail:true};
  // all combinations of predicted values -> candidate keys
  let combos=[tagged?[segs[0][0][0]]:[]];for(const vs of preds)combos=combos.flatMap(c=>vs.map(x=>c.concat([x])));
  const norm=k=>{const p=k.split("|");if(p[0]==="s"&&p[2]==="1.00")p[3]="left";return p.join("|")}; // a full fill renders identically whatever its side
  const candKeys=combos.map(c=>norm(c.join("|")));
  const matches=[...new Set(candKeys.map(k=>it.opts.findIndex(o=>norm(o.key)===k)).filter(i=>i>=0))];
  return{method:"feature",rules,matches};
}
let bad=[];const report=[];
items.forEach((it,n)=>{
  const s=solve(it);
  const pics=it.opts.map(o=>svgOf(o.items));const dup=new Set(pics).size!==8;
  const gridDup=(()=>{const rows=it.grid.map(x=>x.map(c=>c.key).join("~"));const cols=[0,1,2].map(k=>it.grid.map(x=>x[k].key).join("~"));return new Set(rows).size<3||new Set(cols).size<3})();
  const unique=s.matches.length===1&&s.matches[0]===it.answer;
  const status=unique&&!dup&&!gridDup?"OK":"PROBLEM";
  if(status!=="PROBLEM"){}else bad.push(n+1);
  report.push({n:n+1,fam:it.gate?("gate:"+it.gate):it.cat,method:s.method,solverMatches:s.matches.map(i=>L8[i]),answer:L8[it.answer],dupOptions:dup,gridDup,fits:s.fits,rules:s.rules,status});
});
if(process.argv[3]!=="quiet")console.log(JSON.stringify(report,null,1));
console.log("PROBLEMS:",bad.length?bad.join(","):"none");
// render the whole test to HTML for visual audit
const css='<style>body{font-family:sans-serif;color:#111;background:#fff;padding:10px}.item{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;border-bottom:1px solid #ddd;padding-bottom:10px;page-break-inside:avoid}.matrix{display:grid;grid-template-columns:repeat(3,1fr);width:210px;border:2px solid #111}.cell{aspect-ratio:1;border:1px solid #999;display:flex}.cell svg{width:100%}.missing{font-size:1.6rem;justify-content:center;align-items:center}.reveal{background:#dce7f8}.opts{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;width:560px}.opt{border:1px solid #666;position:relative}.opt.ans{border:2px solid #1f6a3a;background:#e2f1e7}.opt svg{width:100%}.l{font-weight:bold;font-size:10px;text-align:center;display:block}p{font-size:10.5px;width:560px;margin:4px 0}</style>';
const html=`<html><body>${css}<h3>Seed ${seed} — 20-item boss run</h3>${items.map((it,n)=>`<div class="item"><div><b>#${n+1}</b>${matrixHTML(it.grid,"missing")}</div><div><div class="opts">${it.opts.map((o,k)=>`<div class="opt ${k===it.answer?"ans":""}">${svgOf(o.items)}<span class="l">${L8[k]}</span></div>`).join("")}</div><p><b>${report[n].status}</b> · ${report[n].fam} · answer ${L8[it.answer]} · solver: ${report[n].solverMatches.join(",")||"—"}</p><p>${it.why}</p></div></div>`).join("")}</body></html>`;
require("fs").writeFileSync("audit.html",html);
const flagged=report.filter(x=>x.status==="PROBLEM");for(const x of flagged){const it=items[x.n-1];console.log("\n#"+x.n,x.fam,"ans",x.answer,"solver",x.solverMatches,JSON.stringify(x.rules));it.grid.forEach(r=>console.log("  ",r.map(c=>c.key).join("   ")))}
