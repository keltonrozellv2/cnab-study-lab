const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1300,height:950}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.argv[2]||'http://localhost:8099/index.html');await p.waitForTimeout(500);
// 1. first run: Up Next
console.log('upnext:',await p.$eval('.upnext .un-l',e=>e.textContent),'|',await p.$eval('.hero h1',e=>e.textContent));
console.log('bios open?',await p.evaluate(()=>roadState().find(n=>n.id==='bios').st));
await p.click('#upnextgo');await p.waitForTimeout(400);
console.log('learn card shown:',!!(await p.$('.learn')));
// 2. drill then test C key
await p.evaluate(()=>{const b=document.querySelector('#drillgo');if(b)b.click()});await p.waitForTimeout(400);
console.log('tag:',await p.$eval('#view-guide .tag',e=>e.textContent));
await p.keyboard.press('c');await p.waitForTimeout(200);
console.log('after C: picked=',await p.evaluate(()=>S.picked),'calc hidden=',await p.evaluate(()=>document.getElementById('calc').hidden));
console.log('fb text:',(await p.$eval('#fb',e=>e.innerText)).slice(0,160).replace(/\n/g,' '));
await p.keyboard.press('n');await p.waitForTimeout(200);
console.log('note open:',await p.evaluate(()=>!document.getElementById('notepad').hidden),'note value:',JSON.stringify(await p.evaluate(()=>document.getElementById('note-ta').value)));
await p.keyboard.press('Escape');await p.waitForTimeout(200);
console.log('after Esc: note hidden=',await p.evaluate(()=>document.getElementById('notepad').hidden),'paused=',await p.evaluate(()=>!!PAUSE));
await p.keyboard.press('Enter');await p.waitForTimeout(300);
// 3. pause on home toast
await p.evaluate(()=>show('home'));await p.waitForTimeout(300);await p.click('#pausebtn');await p.waitForTimeout(200);
console.log('toast on pause-nothing:',await p.$$eval('.xptoast.msg',e=>e.map(x=>x.textContent)));
console.log('dock hidden on home:',await p.$eval('#tooldock',e=>getComputedStyle(e).display));
// 4. test: start, answer 0, finish&score
await p.evaluate(()=>show('test'));await p.waitForTimeout(200);await p.click('#start');await p.waitForTimeout(300);
console.log('limit:',await p.evaluate(()=>T.limit),'clock:',await p.$eval('#clock',e=>e.textContent));
await p.click('#finishNow');await p.waitForTimeout(200);console.log('zero-answer prompt:',(await p.$eval('#box',e=>e.innerText)).slice(0,80));
await p.click('#box [data-y]');await p.waitForTimeout(200);console.log('T after quit:',await p.evaluate(()=>!!T),'hist:',await p.evaluate(()=>jload(HIST,[]).length));
// 5. test leave warning via tab
await p.click('#start');await p.waitForTimeout(300);await p.click('#view-test #ch [data-k="0"]');await p.click('.tabs button[data-tab="home"]');await p.waitForTimeout(200);
console.log('leave overlay:',!!(await p.$('#leaveov')),(await p.$eval('#leaveov .sub',e=>e.textContent).catch(()=>'')));
await p.click('#lv-stay');await p.waitForTimeout(100);console.log('still in test:',await p.evaluate(()=>!!T));
await p.click('.tabs button[data-tab="home"]');await p.click('#lv-go');await p.waitForTimeout(300);console.log('left; T=',await p.evaluate(()=>!!T),'hist partial:',await p.evaluate(()=>JSON.stringify(jload(HIST,[]).slice(-1)[0])));
// 6. gate drill balance + timeout reveal
await p.evaluate(()=>{const s=MTRACK.find(x=>x.id==="gate");startMatrixRun({step:s,kind:s.kind,gen:s.gen,n:s.n,per:s.per,total:0,fb:"instant",aids:true})});await p.waitForTimeout(300);
console.log('gate mix:',await p.evaluate(()=>{const m={};MX.items.forEach(i=>m[i.gate]=(m[i.gate]||0)+1);return JSON.stringify(m)}));
await p.evaluate(()=>{MX.qStart=Date.now()-61000});await p.waitForTimeout(400);
console.log('timeout reveal:',(await p.$eval('#view-matrix .fb',e=>e.textContent).catch(()=>'NO FB')).slice(0,40),'idx:',await p.evaluate(()=>MX.idx));
await p.evaluate(()=>{show('home')});
// 7. magnet refusal
await p.evaluate(()=>{const X=gameLoad();X.pw.magnet=1;X.miss={};gameSave(X)});console.log('magnet use with 0 misses:',await p.evaluate(()=>usePower('magnet')),'still have:',await p.evaluate(()=>gameLoad().pw.magnet));
// 8. import restore
const exp=await p.evaluate(()=>{const X=gameLoad();X.gold=500;gameSave(X);return JSON.stringify({app:"cnab-lab-pro",hist:jload(HIST,[]),weak:[],xp:gameLoad()})});
await p.evaluate(()=>{const X=gameLoad();X.gold=100;gameSave(X)});
await p.evaluate((exp)=>{show('progress');const box=document.getElementById('pbox')||document.querySelector('#view-progress');const f=new File([exp],'p.json',{type:'application/json'});importProgress(f,box)},exp);await p.waitForTimeout(300);
await p.click('#view-progress [data-y]');await p.waitForTimeout(300);console.log('gold after import (expect 500 = restored):',await p.evaluate(()=>gameLoad().gold));

console.log('ERRORS:',errs);await b.close();process.exit(errs.length?1:0);})();
