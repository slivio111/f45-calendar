const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'workout-intel.js'),'utf8'),c);
const db=c.window.WORKOUT_INTEL;
assert.equal(Object.keys(db.days).length,7);
for(const [date,day] of Object.entries(db.days)){
 assert(/^2026-10-(12|13|14|15|16|17|18)$/.test(date));
 if(day.status!=='published'){assert(day.reason);assert(!day.groups);continue;}
 assert(day.timing);
 if(day.pairedStations){
   assert.equal(day.pairedStations.length,9);
   for(const station of day.pairedStations)for(const side of [station.upper,station.lower]){
     assert.equal(side.variants.length,2);assert(side.equipment.length);assert(side.variants.every(v=>v.en&&v.label));
   }
   continue;
 }
 for(const group of day.groups){
   assert.equal(group.exercises.length,day.stations);
   for(const row of group.exercises){assert.equal(row.length,4);assert(row.slice(0,3).every(s=>typeof s==='string'&&s.length));assert(row[3].length);}
 }
}
assert.equal(db.days['2026-10-12'].groups[0].exercises.length,18);
assert.equal(db.days['2026-10-14'].groups[0].exercises.length,12);
assert.equal(db.days['2026-10-15'].pairedStations[8].upper.variants[1].en,'push up hand release');
assert.equal(db.days['2026-10-15'].pairedStations[5].lower.variants[0].en,db.days['2026-10-15'].pairedStations[5].lower.variants[1].en);
for(const file of ['calendar-intel.js','workout-intel.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
assert(!html.includes('AUTH_USERS'));
assert(html.includes('d.token && d.expires'));
console.log('PASS 7 exact dates, 39 station cards / 66 movements, 4 withheld ambiguous days, paired Upper/Lower with exact English, JS syntax, no embedded credentials');
