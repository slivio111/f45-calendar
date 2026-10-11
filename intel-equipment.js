// Pure, deterministic view of reviewed station equipment. Never infer weights,
// class-wide kit counts or new station boundaries from unreviewed prose.
(function(){
  'use strict';
  const aliases={
    'Гантель':{key:'dumbbell',label:'Гантели'},
    'Гантели':{key:'dumbbell',label:'Гантели'},
    'YBell':{key:'ybell',label:'YBell'},
    'Два YBell':{key:'ybell',label:'YBell × 2',quantity:2},
    'Резина для подтягиваний':{key:'pullup-band',label:'Резина для турника'},
    'Степ-платформа':{key:'step',label:'Степ'},
    'Без оборудования':{key:'floor',label:'Без инвентаря'}
  };
  function combine(items){
    const equipment=new Map();
    for(const raw of items){
      const clean=String(raw).trim();
      if(!clean)continue;
      const item=aliases[clean]||{key:clean.toLowerCase(),label:clean};
      const prev=equipment.get(item.key);
      // Shared equipment, not one additional set for each movement or side.
      if(!prev || (item.quantity||0)>(prev.quantity||0))equipment.set(item.key,{...item});
    }
    if(equipment.size>1 && equipment.has('floor')){
      equipment.delete('floor');
      equipment.set('floor',{key:'floor',label:'Место на полу'});
    }
    return [...equipment.values()].map(e=>e.label);
  }
  function stations(item){
    if(!item || item.status!=='published')return [];
    if(item.pairedStations)return item.pairedStations.map((s,i)=>({
      id:'paired-'+i,number:i+1,equipment:combine([...s.upper.equipment,...s.lower.equipment])
    }));
    return item.groups.flatMap((g,gi)=>g.exercises.map((e,i)=>({
      id:`group-${gi}-${i}`,number:i+1,group:item.groups.length>1?g.title:null,equipment:combine(e[3])
    })));
  }
  function tomorrow(now=new Date()){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    return new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day+1)).toISOString().slice(0,10);
  }
  window.WorkoutEquipment={combine,stations,tomorrow};
})();
