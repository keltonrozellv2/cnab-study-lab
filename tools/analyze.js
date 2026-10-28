#!/usr/bin/env node
/* Usage analytics from tester profile codes — no server, no accounts.
   node tools/analyze.js codes.txt            (one code per line; optional "name: CODE" / "name, CODE")
   node tools/analyze.js codes.txt --json     (machine-readable)
   Accepts full codes (CNAB1D./CNAB1R.), short codes (CNAB-...) and exported .json content. */
const fs=require("fs"),zlib=require("zlib"),path=require("path");
const root=path.join(__dirname,"..");
function extractScript(){const s=fs.readFileSync(path.join(root,"src/app.html"),"utf8");return s.slice(s.lastIndexOf("<script>")+8,s.lastIndexOf("</script>"))}
let APP=null;function app(){if(APP)return APP;const stub=fs.readFileSync(path.join(__dirname,"harness/cnt.js"),"utf8").split("eval(")[0];const vm=require("vm");const ctx={console,require,module:{},exports:{},setTimeout,clearTimeout,setInterval,clearInterval,Date,Math,JSON,Uint8Array,TextEncoder,TextDecoder,atob:s=>Buffer.from(s,"base64").toString("binary"),btoa:s=>Buffer.from(s,"binary").toString("base64")};ctx.global=ctx;ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;ctx.navigator={userAgent:"node",onLine:true};ctx.location={href:"",origin:"null",pathname:"/"};vm.createContext(ctx);vm.runInContext(stub+extractScript()+";this.__api={parseShortCode,levelFor,rankFor,CLUSTERS,SHORT,ROAD,MTRACK,QUEST_POOL,ACH,LABS2,LEARN,BANK}",ctx);return APP=ctx.__api}
function b64u(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Buffer.from(s,"base64")}
function decode(text){text=text.trim();if(text.startsWith("{"))return JSON.parse(text);
  let m=text.replace(/\s+/g,"").match(/^CNAB1([DR])\.([A-Za-z0-9_-]+)\.([0-9a-z]+)$/);
  if(m){let b=b64u(m[2]);if(m[1]==="D")b=zlib.inflateRawSync(b);return JSON.parse(b.toString("utf8"))}
  if(/^CNAB[-\s]?[0-9A-Za-z]/.test(text))return app().parseShortCode(text);
  throw new Error("not a profile code")}
function dayOf(iso){return iso.slice(0,10)}
function analyzeOne(name,d){const X=d.xp||{},h=(d.hist||[]).filter(a=>a&&a.date),A=app();
  const days=[...new Set(h.map(a=>dayOf(a.date)))].sort();const first=days[0],last=days[days.length-1];
  const byMode={};for(const a of h){const k=a.mode||"?";const m=byMode[k]||(byMode[k]={n:0,ok:0,t:0,secs:0});m.n++;m.ok+=a.ok||0;m.t+=a.total||0;m.secs+=a.secs||0}
  const hours=new Array(24).fill(0);for(const a of h)hours[new Date(a.date).getHours()]++;
  const tests=h.filter(a=>/^Test/.test(a.mode)&&!a.partial&&a.total>=25).map(a=>({date:dayOf(a.date),pct:Math.round(a.ok/a.total*100),n:a.total}));
  const topics=Object.entries(X.topics||{}).map(([k,v])=>({k,ok:v.ok,t:v.t,pct:v.t?v.ok/v.t:0,mastered:v.t>=8&&v.ok/v.t>=0.7})).sort((a,b)=>a.pct-b.pct);
  const areas=Object.entries(X.at||{}).map(([k,v])=>({k:A.SHORT[k]||k,ok:v.ok,t:v.t,pct:v.t?Math.round(v.ok/v.t*100):0}));
  const steps=Object.entries(X.steps||{}).map(([k,v])=>`${k}:${v.passes||0}×(best ${Math.round((v.best||0)*100)}%)`);
  const weak=(d.weak||[]).map(w=>({q:w.q,sub:w.sub,area:w.area||w.areaCNT,flag:!!w.flag}));
  const partial=h.filter(a=>a.partial).length;
  const questions=h.reduce((s,a)=>s+(a.total||0),0),correct=h.reduce((s,a)=>s+(a.ok||0),0);
  const gaps=[];for(let i=1;i<days.length;i++){const g=(Date.parse(days[i])-Date.parse(days[i-1]))/86400000;if(g>1)gaps.push(g-1)}
  return{name,level:A.levelFor(X.xp||0).lvl,rank:A.rankFor(Object.assign({steps:{},xp:0},X)).n,gold:X.gold||0,
    days:days.length,first,last,sessions:h.length,questions,correct,accuracy:questions?Math.round(correct/questions*100):0,partialSessions:partial,
    avgQuestionsPerDay:days.length?Math.round(questions/days.length):0,missedDays:gaps.reduce((a,b)=>a+b,0),
    hours,byMode,tests,areas,topics,steps,weak,
    features:{bosses:X.bossWins||0,questsClaimed:X.questsDone||0,labs:(X.labsDone||[]).length,learnCards:(X.learned||[]).length,badges:(X.achSeen||[]).length,
      sectors:(X.sectorClaimed||[]).length,mastered:topics.filter(t=>t.mastered).length,shopItems:Math.max(0,((X.cos||{}).themes||[]).filter(t=>t!=="default").length)+Math.max(0,((X.cos||{}).buddies||[]).filter(b=>b!=="none").length),
      powerUpsHeld:Object.values(X.pw||{}).reduce((a,b)=>a+(b||0),0),aidsHeld:Object.values(X.bag||{}).reduce((a,b)=>a+(b||0),0)},
    missPool:Object.values(X.miss||{}).reduce((s,m)=>s+(m.n||0),0)}}
function pct(a,b){return b?Math.round(a/b*100)+"%":"—"}
function report(users){const out=[];const p=s=>out.push(s);
  p(`# Usage report — ${users.length} tester${users.length===1?"":"s"} — ${new Date().toISOString().slice(0,10)}\n`);
  p("## Per person");for(const u of users){p(`### ${u.name} — Lv ${u.level} ${u.rank} · ${u.gold} gold`);
    p(`- Active ${u.days} day${u.days===1?"":"s"} (${u.first} → ${u.last}), ${u.missedDays} day${u.missedDays===1?"":"s"} skipped in between · ${u.sessions} sessions · ${u.questions} questions at ${u.accuracy}% · ~${u.avgQuestionsPerDay}/day · ${u.partialSessions} session${u.partialSessions===1?"":"s"} left early`);
    const peak=u.hours.map((n,i)=>[n,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).filter(x=>x[0]).map(x=>`${x[1]}:00`).join(", ");p(`- Studies around: ${peak||"—"}`);
    p(`- Modes: ${Object.entries(u.byMode).map(([k,m])=>`${k} ×${m.n} (${pct(m.ok,m.t)})`).join(" · ")}`);
    if(u.tests.length)p(`- Practice tests: ${u.tests.map(t=>`${t.pct}% (${t.n}q, ${t.date})`).join(" → ")}`);
    p(`- Areas: ${u.areas.map(a=>`${a.k} ${a.pct}% (${a.t})`).join(" · ")||"—"}`);
    const low=u.topics.filter(t=>t.t>=4&&t.pct<0.7).slice(0,5);if(low.length)p(`- Struggling: ${low.map(t=>`${t.k.split("|")[1]} ${Math.round(t.pct*100)}% (${t.t})`).join(" · ")}`);
    p(`- Mastered ${u.features.mastered}/34 sub-topics · sectors ${u.features.sectors}/8 · matrix ${u.steps.join(", ")||"not started"}`);
    p(`- Features: ${u.features.bosses} boss wins · ${u.features.questsClaimed} quests turned in · ${u.features.labs} labs · ${u.features.learnCards} Learn cards read · ${u.features.badges} badges · ${u.features.shopItems} shop items · holding ${u.features.aidsHeld} aids, ${u.features.powerUpsHeld} power-ups`);
    p(`- Weak spots: ${u.weak.length} (${u.weak.filter(w=>w.flag).length} flagged) · miss pool ${u.missPool}\n`)}
  // group
  p("## Across the group");const n=users.length;
  const sum=k=>users.reduce((s,u)=>s+u[k],0);
  p(`- ${sum("questions")} questions answered, ${pct(sum("correct"),sum("questions"))} correct, ${sum("sessions")} sessions over ${sum("days")} person-days. Median days active: ${median(users.map(u=>u.days))}. Left-early sessions: ${pct(sum("partialSessions"),sum("sessions"))}.`);
  const hours=new Array(24).fill(0);users.forEach(u=>u.hours.forEach((v,i)=>hours[i]+=v));p(`- Busiest hours: ${hours.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>`${x[1]}:00 (${x[0]})`).join(", ")}`);
  const modes={};users.forEach(u=>Object.entries(u.byMode).forEach(([k,m])=>{const t=modes[k]||(modes[k]={n:0,users:0});t.n+=m.n;t.users++}));
  p(`- Mode usage: ${Object.entries(modes).sort((a,b)=>b[1].n-a[1].n).map(([k,m])=>`${k} ×${m.n} by ${m.users}/${n}`).join(" · ")}`);
  const feat=["bosses","questsClaimed","labs","learnCards","badges","shopItems","mastered","sectors"];p(`- Feature adoption (users who used it at least once): ${feat.map(f=>`${f} ${users.filter(u=>u.features[f]>0).length}/${n}`).join(" · ")}`);
  const topicAgg={};users.forEach(u=>u.topics.forEach(t=>{const a=topicAgg[t.k]||(topicAgg[t.k]={ok:0,t:0,users:0});a.ok+=t.ok;a.t+=t.t;a.users++}));
  const rows=Object.entries(topicAgg).filter(([k,a])=>a.t>=10).map(([k,a])=>({k,pct:a.ok/a.t,t:a.t,users:a.users})).sort((a,b)=>a.pct-b.pct);
  p(`- Hardest sub-topics (≥10 answers): ${rows.slice(0,8).map(r=>`${r.k.split("|")[1]} ${Math.round(r.pct*100)}% (${r.t} answers, ${r.users} users)`).join(" · ")}`);
  p(`- Easiest: ${rows.slice(-5).reverse().map(r=>`${r.k.split("|")[1]} ${Math.round(r.pct*100)}%`).join(" · ")}`);
  const untouched=Object.keys(app().LEARN||{}).filter(k=>!topicAgg[k]);if(untouched.length)p(`- Never touched by anyone: ${untouched.map(k=>k.split("|")[1]).join(", ")}`);
  const weakCount={};users.forEach(u=>u.weak.forEach(w=>{const k=w.q.slice(0,90);weakCount[k]=(weakCount[k]||0)+1}));
  const shared=Object.entries(weakCount).filter(([k,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(shared.length){p(`- Questions missed by 2+ people (content or Learn-card candidates):`);shared.forEach(([q,c])=>p(`    ${c}× ${q}`))}
  const tests=users.flatMap(u=>u.tests.map(t=>t.pct));if(tests.length)p(`- Practice tests: ${tests.length} full runs, median ${median(tests)}%, ${tests.filter(x=>x>=70).length} at 70%+`);
  const retention=[1,2,3,5,7].map(d=>`${d}+ days: ${users.filter(u=>u.days>=d).length}`).join(" · ");p(`- Retention: ${retention}`);
  return out.join("\n")}
function median(a){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y);const m=Math.floor(s.length/2);return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2)}
// ---- main
const file=process.argv[2];if(!file){console.error("usage: node tools/analyze.js codes.txt [--json]");process.exit(1)}
const raw=fs.readFileSync(file,"utf8");const users=[];let i=0;
for(const line of raw.split(/\r?\n/)){const t=line.trim();if(!t||t.startsWith("#"))continue;let name="tester"+(++i),code=t;const m=t.match(/^([^:,]{1,40})[:,]\s*(CNAB.*|\{.*)$/);if(m){name=m[1].trim();code=m[2]}
  try{users.push(analyzeOne(name,decode(code)))}catch(e){console.error(`skip ${name}: ${e.message}`)}}
if(!users.length){console.error("no valid codes");process.exit(1)}
if(process.argv.includes("--json"))console.log(JSON.stringify(users,null,1));else console.log(report(users));
