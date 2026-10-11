// Hand-reviewed against the corresponding local F45 catalogue images.
// Never derive floor coordinates from the number of exercise rows.
(function(){
  'use strict';
  const follow={kind:'grid',count:9,columns:3,cells:[9,4,3,8,5,2,7,6,1],movement:'Follow the leader',
    directions:{1:'↑',2:'↑',3:'←',4:'↓',5:'↓',6:'←',7:'↑',8:'↑'},returnLabel:'После 9: возврат к станции 1'};
  const layouts={
    Hammer:{...follow,image:'hammer.png'},
    Mkatz:{...follow,image:'mkatz.png'},
    Romans:{kind:'grid',count:9,columns:3,cells:[9,6,3,8,5,2,7,4,1],movement:'3 пода',image:'romans.png',
      columnLabels:['Под 3','Под 2','Под 1']},
    Foxtrot:{kind:'grid',count:12,columns:4,cells:[8,9,10,11,7,0,0,12,6,0,0,1,5,4,3,2],
      movement:'Racetrack',image:'foxtrot.png',returnLabel:'1 → 2 → … → 12 → 1',
      directions:{1:'↓',2:'←',3:'←',4:'←',5:'↑',6:'↑',7:'↑',8:'→',9:'→',10:'→',11:'↓',12:'↓'}},
    T10:{kind:'grid',count:10,columns:4,cells:[6,7,8,9,5,0,0,10,4,3,2,1],movement:'Racetrack',image:'t10.png',
      returnLabel:'1 → 2 → … → 10 → 1',
      directions:{1:'←',2:'←',3:'←',4:'↑',5:'↑',6:'→',7:'→',8:'→',9:'↓',10:'↓'}},
    Loyals:{kind:'pods',count:18,columns:3,pods:[6,4,2,5,3,1],movement:'6 групп A / B / C',image:'loyals.png',
      note:'Номера списка сопоставлены по тройкам: 1–3 = 1A–1C, 4–6 = 2A–2C и так далее. Внутри группы: A → B → C.'}
  };
  const short={
    'Гребной эргометр':'Гребля','Велоэргометр':'Велоэрг.',
    'Баланс-платформа':'Баланс-платф.','Мягкий бокс':'Мягкий бокс',
    'Разметка agility box':'Разметка','Подвесные петли':'Петли',
    'Без инвентаря':'Без инвентаря','Место на полу':'Пол',
    'Крепление Landmine':'Landmine','Подставка под пятки':'Опора под пятки',
    'Подставка под носки':'Опора под носки','Крепление для петель':'Крепление',
    'Дорожка для саней':'Дорожка','Место для бокового перемещения':'Свободное место',
    'Дорожка для бега':'Дорожка'
  };
  function get(item){
    if(!item || item.status!=='published')return null;
    const layout=layouts[item.workout];
    return layout && layout.count===item.stations ? layout : null;
  }
  window.WorkoutLayouts={get,shortName:name=>short[name]||name};
})();
