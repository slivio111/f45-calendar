/* Shared visibility is server-controlled. This is a display setting, not content DRM. */
(function(){
  'use strict';
  const db=window.WORKOUT_INTEL;
  const state={enabled:false,renderedEnabled:null,canManage:false,version:'0',busy:false,sequence:0,day:null,tab:'overview',setupMode:'cards',selectedStation:1,selectedPod:1,scroll:{},focus:null,focusIndex:null,checkedAt:0,token:null};
  const overlay=document.getElementById('modalOverlay');
  const modal=document.getElementById('modal');
  const body=modal.querySelector('.modal-body');
  body.id='intel-overview';body.setAttribute('role','tabpanel');body.setAttribute('aria-labelledby','intel-tab-overview');
  const scroller=document.createElement('div');scroller.className='modal-scroll';scroller.tabIndex=-1;
  body.before(scroller);scroller.append(body);
  const panel=document.createElement('div');panel.id='intel-exercises';panel.className='intel-panel';panel.hidden=true;
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','intel-tab-exercises');scroller.append(panel);
  const setup=document.createElement('div');setup.id='intel-setup';setup.className='intel-setup';setup.hidden=true;
  setup.setAttribute('role','tabpanel');setup.setAttribute('aria-labelledby','intel-tab-setup');scroller.append(setup);
  const tabs=document.createElement('div');tabs.className='modal-tabs';tabs.hidden=true;tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Раздел тренировки');
  tabs.innerHTML='<button id="intel-tab-overview" type="button" role="tab" aria-controls="intel-overview" aria-selected="true">Обзор</button><button id="intel-tab-setup" type="button" role="tab" aria-controls="intel-setup" aria-selected="false" tabindex="-1">Расстановка</button><button id="intel-tab-exercises" type="button" role="tab" aria-controls="intel-exercises" aria-selected="false" tabindex="-1">Упражнения</button>';
  scroller.before(tabs);
  const close=document.getElementById('modalClose');close.setAttribute('aria-label','Вернуться в календарь');
  const admin=document.createElement('div');admin.className='intel-admin';admin.hidden=true;
  admin.innerHTML='<label><input type="checkbox" id="intel-visible" role="switch"> Показывать расстановку и упражнения</label><p class="intel-status" id="intel-settings-status" role="status" aria-live="polite"></p><button class="intel-entry" id="intel-settings-retry" type="button" hidden>Повторить проверку</button>';
  document.getElementById('calendarGrid').before(admin);
  const quick=document.createElement('button');quick.type='button';quick.className='intel-tomorrow';quick.hidden=true;
  document.getElementById('seriesTabs').before(quick);
  const toggle=admin.querySelector('input'),status=admin.querySelector('.intel-status'),retry=admin.querySelector('button');
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function record(day){
    const item=db && db.days[key(day.date)];
    return item && item.workout===day.workout ? item : null;
  }
  function source(){
    return `<footer class="intel-source">Неофициальный Workout Intel. Русские описания и оборудование подготовлены для тренеров; спорные движения сверяйте со студийной демонстрацией.<br>Проверено: ${esc(db.reviewedAt)}</footer>`;
  }
  function renderSetup(){
    if(!state.day)return;
    const item=record(state.day);
    if(!state.enabled){setup.replaceChildren();return;}
    const stations=window.WorkoutEquipment.stations(item);
    if(!stations.length){
      setup.innerHTML=`<h3>${item?'Расстановка уточняется':'Расстановка пока недоступна'}</h3><p class="intel-note">${item?esc(item.reason):'Для этой даты нет проверенного списка станций. Данные другого дня не подставляются.'}</p>`;
      return;
    }
    const relays=stations.filter(s=>s.isRelay).length;
    const layout=window.WorkoutLayouts.get(item);
    setup.innerHTML=`<div class="intel-setup-heading"><h3>${state.setupMode==='map'?'Где поставить':'Что поставить'}</h3><span>${item.stations} станций${relays?` + ${relays} этапа`:''}</span></div>
      <div class="intel-mode-switch"><button type="button" data-setup-mode="cards" aria-pressed="${state.setupMode==='cards'}">Карточки</button><button type="button" data-setup-mode="map" aria-pressed="${state.setupMode==='map'}" ${layout?'':'disabled'}>На схеме</button></div>
      ${!layout?'<p class="intel-setup-hint">Схема с позициями станций пока недоступна. Расстановка и упражнения доступны в карточках.</p>':''}
      <div id="intel-setup-cards" ${state.setupMode==='map'?'hidden':''}>
      ${relays?'<p class="intel-setup-note">Э1–Э4: командные этапы после каждого пода. Они показаны после 12 основных станций.</p>':''}
      ${item.pairedStations?'<p class="intel-setup-note">Инвентарь Upper и Lower объединён.</p>':''}
      <div class="intel-setup-grid">${stations.map(s=>`<button type="button" class="intel-station" data-station="${esc(s.id)}" aria-label="${s.isRelay?'Командный этап':'Станция'} ${s.number}: ${esc(s.equipment.join(', '))}. Открыть упражнения">
        <span class="intel-station-number">${String(s.number).padStart(2,'0')}</span>
        <span class="intel-station-gear">${s.group?`<small>${esc(s.group)}</small>`:''}<span>${esc(s.equipment[0])}</span>${s.equipment.slice(1).map(g=>`<small>+ ${esc(g)}</small>`).join('')}</span></button>`).join('')}</div>
      <p class="intel-setup-hint">Нажмите на станцию, чтобы открыть упражнения.</p></div>
      <div id="intel-setup-map" ${state.setupMode!=='map'?'hidden':''}>${layout?renderMap(layout,stations):''}</div>
      <p class="intel-setup-note">Вес и число комплектов на группу не заданы. «× 2» означает два снаряда в самом упражнении, не два комплекта на класс.</p>`;
  }
  function renderMap(layout,stations){
    const get=n=>stations.find(s=>s.number===n);
    const node=(n,label)=>{
      const s=get(n);if(!s)return '';
      const supports=s.equipment.includes('Резина для турника')&&s.equipment.includes('Резина')
        ? ['Резины'] : s.equipment.slice(1).map(window.WorkoutLayouts.shortName);
      return `<button type="button" class="intel-map-node" data-map-station="${n}" aria-pressed="${n===state.selectedStation}" aria-label="Станция ${n}: ${esc(s.equipment.join(', '))}">
        <span class="intel-station-number">${esc(label||n)}</span><span>${esc(window.WorkoutLayouts.shortName(s.equipment[0]))}</span>
        ${supports.length?`<small>+ ${esc(supports.join(' · '))}</small>`:''}
        ${layout.directions?.[n]?`<span class="intel-map-direction" aria-hidden="true">${layout.directions[n]}</span>`:''}</button>`;
    };
    let map='';
    if(layout.kind==='pods'){
      map=`<div class="intel-map-grid" style="--map-columns:3">${layout.pods.map(p=>{
        const eq=window.WorkoutEquipment.combine(stations.slice((p-1)*3,p*3).flatMap(s=>s.equipment));
        return `<button type="button" class="intel-map-node intel-pod-node" data-map-pod="${p}" aria-pressed="${p===state.selectedPod}" aria-label="Группа ${p}, станции ${(p-1)*3+1}–${p*3}">
          <b>Группа ${p}</b><span>${esc(eq.map(window.WorkoutLayouts.shortName).join(' · '))}</span><small>${(p-1)*3+1}–${p*3}</small></button>`;
      }).join('')}</div><p class="intel-setup-hint">Группа ${state.selectedPod} · положение A / B / C</p><div class="intel-pod-detail">${[2,1,0].map(i=>node((state.selectedPod-1)*3+i+1,state.selectedPod+['A','B','C'][i])).join('')}</div>`;
    }else{
      map=`<div class="intel-map-grid" style="--map-columns:${layout.columns}">${layout.cells.map(n=>n?node(n):'<div class="intel-map-space" aria-hidden="true"></div>').join('')}</div>
      ${layout.columnLabels?`<div class="intel-map-columns">${layout.columnLabels.map(l=>`<span>${esc(l)}</span>`).join('')}</div>`:''}`;
    }
    const selected=get(state.selectedStation)||stations[0];
    return `<div class="intel-floor"><div class="intel-tv-row" aria-label="Сторона экранов"><span>TV</span><span>TV</span><span>TV</span></div><p class="intel-map-label">${esc(layout.movement)}</p>${map}
      ${layout.returnLabel?`<p class="intel-map-label">${esc(layout.returnLabel)}</p>`:''}</div>
      <div class="intel-map-selection" aria-live="polite"><div><small>Станция ${selected.number}</small><h4>${esc(selected.equipment.join(' · '))}</h4></div><button class="intel-entry intel-entry-primary" type="button" data-station="${esc(selected.id)}">Упражнения станции</button></div>
      <p class="intel-setup-hint">Позиции по каталогу F45, не план помещения студии. Масштаб условный.${layout.note?' '+esc(layout.note):''}</p>
      <details class="intel-original"><summary>Исходная схема F45</summary><img src="floorplans/${esc(layout.image)}" alt="Схема ${esc(state.day.workout)} из каталога F45" loading="lazy"></details>`;
  }
  function tomorrowDay(){
    const date=window.WorkoutEquipment.tomorrow();
    for(const series of SERIES)for(const phase of series.phases){
      if(phase.schedule && phase.start<=date && phase.end>=date)
        return generateDays(phase).find(d=>key(d.date)===date)||null;
    }
    return null;
  }
  function renderQuick(){
    quick.hidden=!state.enabled;
    if(!state.enabled)return;
    const day=tomorrowDay();
    quick.disabled=!day;
    quick.innerHTML=day?`<span>Расстановка на завтра</span><small>${esc(formatDate(day.date))} · ${esc(day.workout)}${record(day)?.status==='published'?'':' · данные уточняются'}</small>`
      : '<span>Расстановка на завтра</span><small>Расписание этой даты пока недоступно</small>';
  }
  quick.onclick=()=>{
    renderQuick();
    const day=tomorrowDay();
    if(state.enabled&&day){openModal(day);selectTab('setup');}
  };
  setup.addEventListener('click',e=>{
    if(!state.enabled)return;
    const mode=e.target.closest('[data-setup-mode]');
    if(mode){
      if(mode.disabled)return;
      state.scroll[key(state.day.date)+':setup:'+state.setupMode]=scroller.scrollTop;
      state.setupMode=mode.dataset.setupMode;renderSetup();
      scroller.scrollTop=state.scroll[key(state.day.date)+':setup:'+state.setupMode]||0;
      setup.querySelector(`[data-setup-mode="${state.setupMode}"]`).focus({preventScroll:true});return;
    }
    const node=e.target.closest('[data-map-station]'),pod=e.target.closest('[data-map-pod]');
    if(node||pod){
      const pos=scroller.scrollTop;
      if(node)state.selectedStation=+node.dataset.mapStation;
      else{state.selectedPod=+pod.dataset.mapPod;state.selectedStation=(state.selectedPod-1)*3+1;}
      renderSetup();scroller.scrollTop=pos;
      const reveal=setup.querySelector(node?'.intel-map-selection':'.intel-pod-detail');
      if(reveal){
        const bottom=reveal.getBoundingClientRect().bottom-scroller.getBoundingClientRect().bottom;
        if(bottom>0)scroller.scrollTop+=bottom+8;
      }
      setup.querySelector(node?`[data-map-station="${state.selectedStation}"]`:`[data-map-pod="${state.selectedPod}"]`).focus({preventScroll:true});return;
    }
    const button=e.target.closest('[data-station]');
    if(!button||!state.enabled)return;
    const id=button.dataset.station;
    selectTab('exercises');
    const target=panel.querySelector(`[data-station-detail="${id}"]`);
    if(target){
      target.open=true;
      scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top;
      target.querySelector('summary').focus({preventScroll:true});
    }
  });
  function renderExercises(){
    if(!state.day) return;
    const item=record(state.day);
    if(!state.enabled){panel.replaceChildren();return;}
    if(!item || item.status!=='published'){
      panel.innerHTML=`<h3>${item?'Список упражнений уточняется':'Упражнения пока не опубликованы'}</h3><p class="intel-note">${item?esc(item.reason):'Для этой даты ещё нет проверенного списка. Упражнения другого дня не подставляются.'}</p>${item?source():''}`;
      return;
    }
    const gear=window.WorkoutEquipment.summary(item);
    const pairSide=(side,label)=>`<div class="intel-side"><p class="intel-side-label">${label}</p><h4>${esc(side.title)}</h4>
      <p class="intel-desc">${esc(side.description)}</p>
      ${side.variants.map(v=>`<div class="intel-variant"><b>${esc(v.label)}</b><div class="intel-en" lang="en">${esc(v.en)}</div></div>`).join('')}
      <div class="intel-gear">Оборудование: ${esc(window.WorkoutEquipment.combine(side.equipment).join(' · '))}</div></div>`;
    const exercises=item.pairedStations ? `<ol class="intel-list">${item.pairedStations.map((s,i)=>`
      <li><details class="intel-exercise intel-pair" data-station-detail="paired-${i}"><summary><span class="intel-station-number">${String(i+1).padStart(2,'0')}</span><span>${esc(s.upper.title)}<small>Низ: ${esc(s.lower.title)}</small></span></summary><div class="intel-exercise-body">${pairSide(s.upper,'Верх тела / Upper')}${pairSide(s.lower,'Низ тела / Lower')}</div></details></li>`).join('')}</ol>`
      : item.groups.map((g,gi)=>`<section><h3>${esc(g.title)}</h3><ol class="intel-list">${g.exercises.map((e,i)=>`
        <li><details class="intel-exercise" data-station-detail="group-${gi}-${i}"><summary><span class="intel-station-number" aria-label="${g.isRelay?'Командный этап':'Станция'} ${i+1}">${g.isRelay?'Э'+(i+1):String(i+1).padStart(2,'0')}</span><span>${esc(e[1])}</span></summary><div class="intel-exercise-body">
        <div class="intel-en" lang="en">${esc(e[0])}</div><p class="intel-desc">${esc(e[2])}</p>
        <div class="intel-gear">Оборудование: ${esc(window.WorkoutEquipment.combine(e[3]).join(' · '))}</div></div></details></li>`).join('')}</ol></section>`).join('');
    panel.innerHTML=`<details class="intel-gear-summary"><summary>Оборудование на тренировку</summary><div class="intel-equipment">${gear.length?gear.map(g=>`<span>${esc(g)}</span>`).join(''):'<span>Без инвентаря</span>'}</div></details>
      <p class="intel-setup-hint">Нажмите на название, чтобы открыть оригинал и пояснение. Тайминг смотрите во вкладке «Обзор».</p>
      ${exercises}${source()}`;
  }
  function selectTab(tab){
    if(tab!=='overview'&&!state.enabled)tab='overview';
    if(state.day)state.scroll[key(state.day.date)+':'+state.tab]=scroller.scrollTop;
    state.tab=tab;
    body.hidden=tab!=='overview';panel.hidden=tab!=='exercises';setup.hidden=tab!=='setup';
    tabs.querySelectorAll('button').forEach(b=>{
      const selected=b.id==='intel-tab-'+tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;
    });
    scroller.scrollTop=state.day?state.scroll[key(state.day.date)+':'+tab]||0:0;
  }
  function decorate(days){
    document.querySelectorAll('.intel-day-actions,.intel-empty-label').forEach(e=>e.remove());
    renderQuick();
    document.querySelectorAll('.day-card').forEach(card=>{
      card.tabIndex=0;card.setAttribute('role','group');
      card.onkeydown=e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}};
      if(!state.enabled)return;
      const day=days[Number(card.dataset.index)],item=record(day);
      const entry=document.createElement(item && item.status==='published'?'div':'span');
      if(entry.tagName==='DIV'){
        entry.className='intel-day-actions';
        ['setup','exercises'].forEach(tab=>{
          const button=document.createElement('button');button.type='button';
          button.className='intel-entry intel-entry-day'+(tab==='setup'?' intel-entry-primary':'');
          const label=tab==='setup'?'Расстановка':'Упражнения';
          button.textContent=label;
          button.setAttribute('aria-label',`${label} ${day.workout}, ${formatDate(day.date)}`);
          button.onclick=e=>{e.stopPropagation();openModal(day);selectTab(tab);};
          entry.append(button);
        });
      }else{entry.className='intel-empty-label';entry.textContent=item?'Данные уточняются':'Данных по станциям пока нет';}
      card.append(entry);
    });
  }
  function sync(){
    toggle.checked=state.enabled;toggle.disabled=state.busy||!state.canManage;
    // Only an authoritative can_manage response grants a usable control.
    admin.hidden=!state.canManage && ((calendarSession()||{}).user||{}).role!=='Admin';
    tabs.hidden=!state.enabled;
    renderQuick();
    if(!state.enabled)selectTab('overview');
    // Polling an unchanged flag must not rebuild focused controls or collapse exercises.
    if(state.renderedEnabled!==state.enabled){
      state.renderedEnabled=state.enabled;
      renderCalendar();renderExercises();renderSetup();
    }
  }
  function failMessage(code){
    if(code==='unknown_action')return 'Нужна новая версия Apps Script для переключателя упражнений. Пока упражнения скрыты.';
    if(code==='settings_conflict')return 'Настройка уже изменена другим администратором. Проверяем актуальное состояние.';
    if(code==='admin_required')return 'Изменять настройку может только пользователь с ролью Admin.';
    return 'Не удалось подтвердить настройку. Упражнения временно скрыты; повторите проверку.';
  }
  async function refresh(){
    const session=calendarSession();
    if(state.busy)return;
    const seq=++state.sequence,token=session && session.token;
    if(!token||session.expires<=Date.now()){state.enabled=false;state.canManage=false;state.token=null;sync();return;}
    if(state.token!==token){state.enabled=false;state.canManage=false;state.token=token;sync();}
    const result=await calendarRequest('getcalendarsettings');
    if(seq!==state.sequence || token!==(calendarSession()||{}).token)return;
    if(result.ok && typeof result.enabled==='boolean' && typeof result.version==='string'){
      state.enabled=result.enabled;state.version=result.version;state.canManage=result.can_manage===true;state.checkedAt=Date.now();
      status.textContent=state.enabled?'Включено для всех тренеров. Открытые календари проверяют настройку раз в минуту.':'Выключено для всех тренеров. Календарь и обзор тренировок доступны.';
      retry.hidden=true;
    }else{state.enabled=false;state.canManage=false;status.textContent=failMessage(result.error);retry.hidden=false;}
    sync();
  }
  toggle.addEventListener('change',async()=>{
    const desired=toggle.checked;
    if(!state.canManage){toggle.checked=state.enabled;return;}
    state.sequence++;state.busy=true;toggle.disabled=true;status.textContent='Сохраняем общую настройку…';retry.hidden=true;
    const token=(calendarSession()||{}).token;
    const result=await calendarRequest('setcalendarsettings',{enabled:desired,expected_version:state.version});
    state.busy=false;
    if(token!==(calendarSession()||{}).token){state.enabled=false;state.canManage=false;sync();return;}
    if(result.ok){state.enabled=result.enabled;state.version=result.version;state.checkedAt=Date.now();status.textContent=desired?'Упражнения включены для всех тренеров.':'Упражнения выключены для всех тренеров.';sync();}
    else{state.enabled=false;status.textContent=failMessage(result.error);retry.hidden=false;sync();await refresh();}
  });
  retry.onclick=refresh;
  tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(b)selectTab(b.id.replace('intel-tab-',''));});
  tabs.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      const order=['overview','setup','exercises'];
      e.preventDefault();selectTab(e.key==='Home'?'overview':e.key==='End'?'exercises':order[(order.indexOf(state.tab)+(e.key==='ArrowRight'?1:2))%3]);
      document.getElementById('intel-tab-'+state.tab).focus();
    }
  });
  modal.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    else if(!focusable.includes(document.activeElement)){e.preventDefault();(e.shiftKey?last:first).focus();}
  });
  window.CalendarIntel={
    decorate,refresh,
    open(day){
      state.focus=document.activeElement;state.focusIndex=state.focus.closest('.day-card')?.dataset.index;state.day=day;state.tab='overview';state.setupMode='cards';state.selectedStation=1;state.selectedPod=1;scroller.scrollTop=0;
      overlay.scrollTop=0;modal.scrollTop=0;
      tabs.hidden=!state.enabled;renderExercises();renderSetup();selectTab('overview');close.focus();
      if(Date.now()-state.checkedAt>60000)refresh();
    },
    closed(){
      state.day=null;
      const target=state.focus&&state.focus.isConnected?state.focus:document.querySelector(`.day-card[data-index="${state.focusIndex}"]`);
      if(target)target.focus();
    }
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(!document.hidden&&document.getElementById('auth-screen').classList.contains('hidden'))refresh();},60000);
  renderCalendar();refresh();
})();
