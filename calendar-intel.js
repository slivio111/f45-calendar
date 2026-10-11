/* Shared visibility is server-controlled. This is a display setting, not content DRM. */
(function(){
  'use strict';
  const db=window.WORKOUT_INTEL;
  const state={enabled:false,renderedEnabled:null,canManage:false,version:'0',busy:false,sequence:0,day:null,tab:'overview',scroll:{},focus:null,focusIndex:null,checkedAt:0,token:null};
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
    return `<footer class="intel-source">Неофициальный Workout Intel. Русские описания и оборудование подготовлены для тренеров; спорные движения сверяйте со студийной демонстрацией.<br><a href="${esc(db.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(db.sourceTitle)}</a><br>Проверено: ${esc(db.reviewedAt)}</footer>`;
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
    setup.innerHTML=`<div class="intel-setup-heading"><h3>Что расставить</h3><span>${stations.length} станций</span></div>
      <div class="intel-setup-grid">${stations.map(s=>`<button type="button" class="intel-station" data-station="${esc(s.id)}" aria-label="Станция ${s.number}: ${esc(s.equipment.join(', '))}. Открыть упражнения">
        <span class="intel-station-number">${String(s.number).padStart(2,'0')}</span>
        <span class="intel-station-gear">${s.group?`<small>${esc(s.group)}</small>`:''}${s.equipment.map(g=>`<span>${esc(g)}</span>`).join('')}</span></button>`).join('')}</div>
      <p class="intel-setup-hint">${item.pairedStations?'Инвентарь Upper и Lower объединён. ':''}Нажмите на станцию, чтобы открыть упражнения.</p>
      <p class="intel-setup-note">Вес и число комплектов на группу не заданы. «× 2» означает два снаряда в самом упражнении, не два комплекта на класс.</p>`;
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
    const button=e.target.closest('[data-station]');
    if(!button||!state.enabled)return;
    const id=button.dataset.station;
    selectTab('exercises');
    const target=panel.querySelector(`[data-station-detail="${id}"]`);
    if(target){
      scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top;
      target.focus({preventScroll:true});
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
    const gear=[...new Set(item.pairedStations
      ? item.pairedStations.flatMap(s=>[...s.upper.equipment,...s.lower.equipment])
      : item.groups.flatMap(g=>g.exercises.flatMap(e=>e[3])))];
    const pairSide=(side,label)=>`<div class="intel-side"><h4>${label} · ${esc(side.title)}</h4>
      ${side.variants.map((v,i)=>`<div class="intel-variant"><b>${i===0?'30':'15'} с · ${esc(v.label)}</b><div class="intel-en" lang="en">${esc(v.en)}</div></div>`).join('')}
      <p class="intel-desc">${esc(side.description)}</p><div class="intel-gear">Оборудование: ${esc(side.equipment.join(' · '))}</div></div>`;
    const exercises=item.pairedStations ? `<ol class="intel-list">${item.pairedStations.map((s,i)=>`
      <li class="intel-exercise intel-pair" data-station-detail="paired-${i}" tabindex="-1"><h3>Станция ${String(i+1).padStart(2,'0')}</h3>${pairSide(s.upper,'Верх тела / Upper')}${pairSide(s.lower,'Низ тела / Lower')}</li>`).join('')}</ol>`
      : item.groups.map((g,gi)=>`<section><h3>${esc(g.title)}</h3><ol class="intel-list">${g.exercises.map((e,i)=>`
        <li class="intel-exercise" data-station-detail="group-${gi}-${i}" tabindex="-1"><span class="intel-number" aria-label="Станция ${i+1}">${String(i+1).padStart(2,'0')}</span><div>
        <h4>${esc(e[1])}</h4><div class="intel-en" lang="en">${esc(e[0])}</div><p class="intel-desc">${esc(e[2])}</p>
        <div class="intel-gear">Оборудование: ${esc(e[3].join(' · '))}</div></div></li>`).join('')}</ol></section>`).join('');
    panel.innerHTML=`<h3>Оборудование</h3><div class="intel-equipment">${gear.map(g=>`<span>${esc(g)}</span>`).join('')}</div>
      <p class="intel-note">Вес и количество комплектов подберите по группе: в источнике они не заданы.</p>
      <p class="intel-structure">${item.stations} станций · подов: ${item.pods} · сетов: ${item.sets} · кругов: ${item.laps}</p>
      <details><summary>Тайминг по Reddit</summary><div class="intel-timing">${esc(item.timing)}</div></details>
      ${item.note?`<p class="intel-note">${esc(item.note)}</p>`:''}
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
    // Polling an unchanged flag must not rebuild focused controls or collapse timing.
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
      state.focus=document.activeElement;state.focusIndex=state.focus.closest('.day-card')?.dataset.index;state.day=day;state.tab='overview';scroller.scrollTop=0;
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
