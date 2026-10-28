const fs=require('fs');
eval(fs.readFileSync('cnt.js','utf8').split('eval(')[0]);
const test=`
function m(list,get){let n=0,l=0;const bad=[];for(const q of list){const {c,o}=get(q);n++;const L=o.map(x=>x.length);const mx=Math.max(...L);const uniq=L[c]===mx&&L.filter(x=>x===mx).length===1;if(uniq){l++;const others=L.filter((x,i)=>i!==c);bad.push({q:q.q,o,c,margin:Math.round((L[c]/Math.max(...others)-1)*100)})}}return{n,l,bad}}
const A=m(BANK,q=>({c:q.c,o:q.o}));const B=m(CONCEPT,q=>({c:0,o:[q.c.t].concat(q.d.map(d=>d.t))}));
console.log("BANK",A.n,A.l,(A.l/A.n*100).toFixed(0)+"%","CONCEPT",B.n,B.l,(B.l/B.n*100).toFixed(0)+"%");
// FACTGEN true/false statement sets?
fs.writeFileSync('stat_long.json',JSON.stringify({bank:A.bad.sort((a,b)=>b.margin-a.margin),concept:B.bad.sort((a,b)=>b.margin-a.margin)},null,1));
`;
eval(fs.readFileSync('full_script.js','utf8')+test);
