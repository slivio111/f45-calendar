const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({window:{}});
for(const f of ['workout-intel.js','intel-layouts.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const api=c.window.WorkoutLayouts,db=c.window.WORKOUT_INTEL.days,plain=v=>JSON.parse(JSON.stringify(v));
for(const day of Object.values(db)){
 const l=api.get(day);
 if(day.workout==="Devil's Peak"){assert.equal(l,null);continue;}
 assert(l);
 assert(fs.existsSync(path.join(root,'floorplans',l.image)));
 const numbers=l.kind==='pods'?l.pods.flatMap(p=>[p*3-2,p*3-1,p*3]):l.cells.filter(Boolean);
 assert.deepEqual(plain(numbers).sort((a,b)=>a-b),Array.from({length:day.stations},(_,i)=>i+1));
}
assert.deepEqual(plain(api.get(db['2026-10-15']).cells),[9,4,3,8,5,2,7,6,1]);
assert.deepEqual(plain(api.get(db['2026-10-13']).cells),[9,6,3,8,5,2,7,4,1]);
assert.deepEqual(plain(api.get(db['2026-10-12']).pods),[6,4,2,5,3,1]);
assert.equal(api.get({workout:'Hammer',status:'published',stations:12}),null);
assert.equal(api.get({workout:'Hammer',status:'review',stations:9}),null);
assert.equal(api.get(null),null);
console.log('PASS 6 verified catalogue layouts, unique station mapping, missing/mismatched layouts fail closed');
