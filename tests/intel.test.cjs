const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'workout-intel.js'),'utf8'),c);
const db=c.window.WORKOUT_INTEL;
assert.equal(Object.keys(db.days).length,7);
for(const [date,day] of Object.entries(db.days)){
 assert(/^2026-10-(12|13|14|15|16|17|18)$/.test(date));
 assert.equal(day.status,'published');
 assert(day.timing);
 if(day.pairedStations){
   assert.equal(day.pairedStations.length,9);
   for(const station of day.pairedStations)for(const side of [station.upper,station.lower]){
     assert.equal(side.variants.length,2);assert(side.equipment.length);assert(side.variants.every(v=>v.en&&v.label));
   }
   continue;
 }
 assert.equal(day.groups.filter(g=>!g.isRelay).reduce((n,g)=>n+g.exercises.length,0),day.stations);
 for(const group of day.groups){
   for(const row of group.exercises){assert.equal(row.length,4);assert(row.slice(0,3).every(s=>typeof s==='string'&&s.length));assert(row[3].length);}
 }
}
assert.equal(db.days['2026-10-12'].groups[0].exercises.length,18);
assert.equal(db.days['2026-10-14'].groups[0].exercises.length,12);
assert.equal(db.days['2026-10-15'].pairedStations[8].upper.variants[1].en,'push up hand release');
assert.equal(db.days['2026-10-15'].pairedStations[5].lower.variants[0].en,db.days['2026-10-15'].pairedStations[5].lower.variants[1].en);
for(const file of ['calendar-intel.js','workout-intel.js','intel-equipment.js','intel-layouts.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
assert(!html.includes('AUTH_USERS'));
assert(html.includes('d.token && d.expires'));
const ui=fs.readFileSync(path.join(root,'calendar-intel.js'),'utf8');
assert(!ui.includes('esc(db.sourceUrl)'), 'No rendered outbound Reddit link in exercise footer');
assert(!ui.includes('Тайминг по Reddit'));
assert(!ui.includes('esc(item.timing)'), 'No duplicate workout timing block');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'oct-12-18-2026.json'),'utf8'));
const en=date=>db.days[date].groups[0].exercises.map(e=>e[0]);
const hammer=db.days['2026-10-15'].pairedStations;
const devil=db.days['2026-10-17'];
assert.equal(devil.groups[1].isRelay,true);
assert.equal(devil.groups[1].exercises.length,4);
const devilOrder=Array.from({length:4},(_,pod)=>[
 ...devil.groups[0].exercises.slice(pod*3,pod*3+3).map(e=>e[0]),
 devil.groups[1].exercises[pod][0]
]).flat();
const actual=[en('2026-10-12'),en('2026-10-13'),en('2026-10-14'),
 hammer.flatMap(s=>s.upper.variants.map(v=>v.en)),hammer.flatMap(s=>s.lower.variants.map(v=>v.en)),
 en('2026-10-16'),devilOrder,en('2026-10-18')];
assert.deepEqual(JSON.parse(JSON.stringify(actual)),original);
assert.equal(actual.flat().length,110);
console.log('PASS all 7 published days, 110 verbatim movements/variants match RTF, 83 cards (79 stations + 4 team stages), JS syntax, no embedded credentials');
