// ── Week grid/navigation, week-plan modal, weekly schedule modal ──────────────────────────────────────────────

function jumpToNextSuggested(){
  // Find or create a date in the current week (or today) for the suggested workout
  weekOffset=0;
  const dates=getWeekDates(0);
  const nextIdx=getNextSuggestedDayIdx();
  // Find a date in this week not yet logged, assigned to or reassignable to nextIdx
  const candidate=dates.find(d=>!hasLoggedOnDate(d)&&getWorkoutForDate(d)!==nextIdx)||dates[0];
  setWorkoutForDate(candidate,nextIdx);
  setActiveDate(candidate);
  showView('log');
  renderWeekGrid();
  renderDetail();
}
// ── Week Plan Modal ───────────────────────────────────────────────────────────
function openWeekPlanModal(){
  const dates=getWeekDates(weekOffset);
  const label=document.getElementById('week-plan-label');
  if(label) label.textContent=fmtShort(dates[0])+' – '+fmtShort(dates[6]);
  renderWeekPlanDays(dates);
  document.getElementById('week-plan-modal').style.display='flex';
}
function closeWeekPlanModal(){
  document.getElementById('week-plan-modal').style.display='none';
}
function renderWeekPlanDays(dates){
  const container=document.getElementById('week-plan-days');
  const dowLabels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  container.innerHTML='';
  dates.forEach((date,i)=>{
    const dayIdx=getWorkoutForDate(date);
    const isRest=dayIdx===REST_DAY;
    const day=isRest?null:(getActiveDay(dayIdx)||null);
    const isCustom=!!getCustomDay(dayIdx);
    const draft=getDraft(date);
    const div=document.createElement('div');
    div.className='wp-day-card';
    if(isRest){
      div.innerHTML=`<div class="wp-day-header"><span class="wp-dow">${dowLabels[i]}</span><span class="wp-day-name" style="color:var(--text3)">Rest Day</span></div>`;
    } else if(!day){
      div.innerHTML=`<div class="wp-day-header"><span class="wp-dow">${dowLabels[i]}</span><span class="wp-day-name" style="color:var(--text3)">No workout</span></div>`;
    } else {
      const exList=day.exercises||[];
      const draftExList=draft?draft.exercises:null;
      const hasDraft=draftExList&&draftExList.length;
      div.innerHTML=`
        <div class="wp-day-header">
          <div>
            <span class="wp-dow">${dowLabels[i]}</span>
            <span class="wp-day-name">${escapeHtml(day.name)}</span>
            ${isCustom?'<span class="wp-custom-badge">custom</span>':''}
          </div>
          <button class="btn btn-sm" onclick="closeWeekPlanModal();setActiveDate('${date}');renderWeekGrid();openCustomDayModal(${dayIdx})" title="Edit this day's exercises">✏️ Edit</button>
        </div>
        ${hasDraft?`<div class="wp-draft-note">📝 This week has a draft — <button class="wp-link" onclick="promoteWeekDraft('${date}',${dayIdx})">copy draft exercises to template</button></div>`:''}
        <div class="wp-ex-list">
          ${exList.map(e=>`<div class="wp-ex-row"><span class="wp-ex-name">${escapeHtml(e.name)}</span><span class="wp-ex-struct">${escapeHtml(e.structure||'')}</span></div>`).join('')}
          ${!exList.length?'<div style="color:var(--text3);font-size:12px">No exercises configured</div>':''}
        </div>`;
    }
    container.appendChild(div);
  });
}
function promoteWeekDraft(date, dayIdx){
  const draft=getDraft(date);
  if(!draft||!draft.exercises.length) return;
  const base=getActiveDay(dayIdx)||DAYS[dayIdx]||{};
  setCustomDay(dayIdx,{
    ...base,
    exercises:draft.exercises.map(e=>({name:e.name,structure:e.structure||'',note:e.note||''})),
  });
  apiSyncSettings({customDays:getCustomDays()});
  openWeekPlanModal();
}
function applyWeekAsTemplate(){
  const dates=getWeekDates(weekOffset);
  let changed=0;
  dates.forEach(date=>{
    const dayIdx=getWorkoutForDate(date);
    if(dayIdx===REST_DAY) return;
    const day=getActiveDay(dayIdx);
    if(!day) return;
    const draft=getDraft(date);
    const exercises=draft&&draft.exercises.length
      ? draft.exercises.map(e=>({name:e.name,structure:e.structure||'',note:e.note||''}))
      : (day.exercises||[]).map(e=>({name:e.name,structure:e.structure||'',note:e.note||''}));
    const base=getActiveDay(dayIdx)||DAYS[dayIdx]||{};
    setCustomDay(dayIdx,{...base, exercises});
    changed++;
  });
  if(!changed){ alert('No workout days in this week to apply.'); return; }
  apiSyncSettings({customDays:getCustomDays()});
  renderWeekGrid(); renderDetail();
  openWeekPlanModal();
  const btn=document.querySelector('[onclick="applyWeekAsTemplate()"]');
  if(btn){ btn.textContent='✅ Applied!'; setTimeout(()=>{ btn.textContent='✅ Use this week as default'; },2000); }
}
function confirmResetWeekTemplates(){
  if(!confirm('Reset all custom day templates and revert every day to the built-in programme?')) return;
  const activeDays=getActiveDays();
  activeDays.forEach((_,i)=>clearCustomDay(i));
  apiSyncSettings({customDays:{}});
  renderWeekGrid(); renderDetail();
  openWeekPlanModal();
}
// ── State ─────────────────────────────────────────────────────────────────────
const TODAY=localDateStr();
function _clearDraftsForDayIdx(dayIdx){ clearDraftsForDayIdx(dayIdx,TODAY); }
let activeDate=TODAY;
let activeDayIdx=0; // kept in sync via setActiveDate()
let weekOffset=0;
function setActiveDate(date){
  activeDate=date;
  activeDayIdx=getWorkoutForDate(date);
}
// ── Week grid ─────────────────────────────────────────────────────────────────
function getWeekDates(offset){
  const anchor=new Date(TODAY+'T00:00:00');
  anchor.setDate(anchor.getDate()+offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(anchor); d.setDate(anchor.getDate()+i); return localDateStr(d); });
}
function changeWeek(delta){ weekOffset+=delta; renderWeekGrid(); }
function jumpToToday(){ weekOffset=0; setActiveDate(TODAY); renderWeekGrid(); renderDetail(); }
function getNextSuggestedDayIdx(){
  const sessions=loadSessions();
  if(!sessions.length) return 0;
  const last=sessions.reduce((a,b)=>a.date>b.date?a:b);
  const n=getActiveDays().length||7;
  return(Math.max(0,last.dayIdx)+1)%n;
}
function hasLoggedOnDate(date){ return loadSessions().some(s=>s.date===date) }
function renderWeekGrid(){
  const dates=getWeekDates(weekOffset);
  const grid=document.getElementById('week-grid'); grid.innerHTML='';
  const suggestedIdx=getNextSuggestedDayIdx();
  const label=document.getElementById('week-nav-label');
  if(label) label.textContent=fmtShort(dates[0])+' – '+fmtShort(dates[6]);

  dates.forEach(date=>{
    const dayIdx=getWorkoutForDate(date);
    const isRest=dayIdx===REST_DAY;
    const day=isRest?null:(getActiveDay(dayIdx)||null);
    const isActive=date===activeDate;
    const isToday=date===TODAY;
    const logged=hasLoggedOnDate(date);
    const isSuggested=!isRest&&!logged&&dayIdx===suggestedIdx;

    const div=document.createElement('div');
    div.className='day-pill'+(isActive?' active':'')+(isToday&&!isActive?' today-pill':'');
    if(isRest&&!isActive) div.style.opacity='0.45';
    const [,mm,dd]=date.split('-');
    const dowLabel=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(new Date(date+'T00:00:00').getDay()+6)%7];
    div.innerHTML=`
      ${logged?'<div class="logged-badge"></div>':''}
      ${isSuggested?'<div class="next-badge">→</div>':''}
      <div class="dow">${dowLabel}</div>
      <div class="pdate">${+mm}/${+dd}</div>
      <div class="dname" style="${isRest?'color:var(--text3)':''}" title="${day?escapeHtml(day.name):''}">${isRest?'Rest':day?escapeHtml(day.name):'?'}</div>
      <div class="dots">${isRest?'':(day?day.dots.map(c=>`<div class="dot" style="background:${c}"></div>`).join(''):'')}</div>`;
    div.onclick=()=>{ setActiveDate(date); renderWeekGrid(); renderDetail(); };
    grid.appendChild(div);
  });

  // On mobile, scroll active day into centre of the strip
  if(window.innerWidth<=600){
    const active=grid.querySelector('.day-pill.active');
    if(active) setTimeout(()=>active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}),30);
  }
  applyWeekGridCollapsed();
}
function toggleWeekGridCollapsed(){
  setWeekGridCollapsed(!getWeekGridCollapsed());
  applyWeekGridCollapsed();
}
function applyWeekGridCollapsed(){
  const grid=document.getElementById('week-grid');
  const btn=document.getElementById('week-collapse-btn');
  const collapsed=getWeekGridCollapsed();
  if(grid) grid.style.display=collapsed?'none':'';
  if(btn){ btn.textContent=collapsed?'▸':'▾'; btn.title=collapsed?'Expand calendar':'Collapse calendar'; }
}
// ── Detail panel ──────────────────────────────────────────────────────────────
function changeWorkoutForDate(newIdx){
  newIdx=parseInt(newIdx,10);
  setWorkoutForDate(activeDate,newIdx);
  activeDayIdx=newIdx;
  if(newIdx!==REST_DAY) clearDraft(activeDate);
  renderWeekGrid();
  renderDetail();
}
// ── Schedule editor modal ─────────────────────────────────────────────────────
let _schedChanges={}, _schedMode='week', _templDraft=[];
function openScheduleModal(){
  _schedChanges={}; _schedMode='week';
  _templDraft=getGoalWeekDefaults().slice();
  renderScheduleModal();
  document.getElementById('schedule-modal').style.display='flex';
}
function closeScheduleModal(){ document.getElementById('schedule-modal').style.display='none' }
function schedSetMode(mode){
  _schedMode=mode; _schedChanges={};
  _templDraft=getGoalWeekDefaults().slice();
  renderScheduleModal();
}
function renderScheduleModal(){
  const activeDays=getActiveDays();
  const dowNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const isTemplate=_schedMode==='template';

  // Update tab active states
  document.querySelectorAll('.sched-tab').forEach((btn,i)=>{
    btn.classList.toggle('active',isTemplate?(i===1):(i===0));
  });
  document.getElementById('sched-desc').textContent=isTemplate
    ?'Set your default pattern for every future week. Existing per-day overrides will be cleared for dates from today onwards.'
    :'Reassign workouts for this specific week only.';
  document.getElementById('sched-apply-btn').textContent=isTemplate?'Save as Default':'Apply';
  document.getElementById('sched-reset-btn').textContent=isTemplate?'↺ Clear custom template':'↺ Reset week';

  const makeOpts=(current)=>[
    `<option value="${REST_DAY}"${current===REST_DAY?' selected':''}>Rest / Off</option>`,
    ...activeDays.map((day,idx)=>`<option value="${idx}"${current===idx?' selected':''}>${day.dow} — ${escapeHtml(day.name)}</option>`)
  ].join('');

  if(isTemplate){
    document.getElementById('sched-rows').innerHTML=dowNames.map((dow,i)=>`
      <div class="sched-row">
        <span class="sched-dow">${dow}</span>
        <span class="sched-date"></span>
        <select class="sched-sel" onchange="templChange(${i},this.value)">${makeOpts(_templDraft[i])}</select>
      </div>`).join('');
  } else {
    const dates=getWeekDates(weekOffset);
    document.getElementById('sched-rows').innerHTML=dates.map((date,i)=>{
      const current=_schedChanges[date]!==undefined?_schedChanges[date]:getWorkoutForDate(date);
      const [,m,d]=date.split('-');
      return`<div class="sched-row">
        <span class="sched-dow">${dowNames[i]}</span>
        <span class="sched-date">${+m}/${+d}</span>
        <select class="sched-sel" onchange="schedChange('${date}',this.value)">${makeOpts(current)}</select>
      </div>`;
    }).join('');
  }
}
function schedChange(date,val){ _schedChanges[date]=parseInt(val,10) }
function templChange(dowIdx,val){ _templDraft[dowIdx]=parseInt(val,10) }
function applyScheduleChanges(){
  if(_schedMode==='template'){
    setWeekTemplate(_templDraft);
    // Clear all future per-date overrides so the template takes effect
    const sched=loadSchedule();
    Object.keys(sched).filter(d=>d>=TODAY).forEach(d=>delete sched[d]);
    saveSchedule(sched);
  } else {
    Object.entries(_schedChanges).forEach(([date,idx])=>setWorkoutForDate(date,idx));
  }
  closeScheduleModal();
  setActiveDate(activeDate);
  renderWeekGrid();
  renderDetail();
}
function resetScheduleToDefault(){
  if(_schedMode==='template'){
    clearWeekTemplate();
    _templDraft=getGoalWeekDefaults().slice();
    renderScheduleModal();
    return;
  }
  const sched=loadSchedule();
  getWeekDates(weekOffset).forEach(date=>delete sched[date]);
  saveSchedule(sched);
  _schedChanges={};
  closeScheduleModal();
  setActiveDate(activeDate);
  renderWeekGrid();
  renderDetail();
}
