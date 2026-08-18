// ── Swap modal, add-exercise modal, custom day editor ──────────────────────────────────────────────

// ── Exercise library modal (swap + add) ───────────────────────────────────────
// Counts how many past sessions included each exercise — once per session,
// not per set, so one heavy day doesn't skew the ranking — so the picker can
// surface exercises this specific user actually reaches for first, instead of
// the library's fixed insertion order. Personal (per-profile) rather than
// global across accounts: with a handful of accounts on this app a "global"
// popularity signal would just reflect whoever logs the most, not what's
// actually relevant to the person searching.
function getExerciseFrequency(){
  const freq={};
  loadSessions().forEach(s=>{
    const seen=new Set();
    s.exercises.forEach(ex=>{
      if(seen.has(ex.name)) return;
      seen.add(ex.name);
      freq[ex.name]=(freq[ex.name]||0)+1;
    });
  });
  return freq;
}
let _swapEI=-1, _swapMode='swap', _swapMuscleFilter=null;
let _customDayIdx=-1, _customDayExercises=[], _customDayName='';
function _openLibraryModal(){
  document.getElementById('swap-search').value='';
  renderSwapMuscleFilter();
  renderSwapGrid();
  document.getElementById('swap-modal').style.display='flex';
  setTimeout(()=>document.getElementById('swap-search').focus(),60);
}
function openSwapModal(ei){
  _swapEI=ei; _swapMode='swap'; _swapMuscleFilter=null;
  const ex=draftSession.exercises[ei];
  const muscle=getExerciseMuscle(ex.name);
  document.getElementById('swap-modal-title').textContent='⇄ Swap Exercise';
  document.getElementById('swap-subtitle').textContent=
    'Replacing: '+ex.name+(muscle?' · '+muscle+' group':'');
  _openLibraryModal();
}
function openAddExModal(){
  _swapEI=-1; _swapMode='add'; _swapMuscleFilter=null;
  document.getElementById('swap-modal-title').textContent='+ Add Exercise';
  document.getElementById('swap-subtitle').textContent='Browse the library or search by name.';
  _openLibraryModal();
}
function setSwapMuscleFilter(muscle){
  _swapMuscleFilter=_swapMuscleFilter===muscle?null:muscle;
  renderSwapMuscleFilter();
  renderSwapGrid();
}
function renderSwapMuscleFilter(){
  const el=document.getElementById('swap-muscle-filter');
  if(!el) return;
  if(_swapMode!=='add'&&_swapMode!=='custom'){ el.style.display='none'; return; }
  el.style.display='';
  el.innerHTML=['All',...Object.keys(EXERCISE_LIBRARY)].map(m=>{
    const isAll=m==='All';
    const active=isAll?!_swapMuscleFilter:_swapMuscleFilter===m;
    const col=isAll?'var(--text2)':(MUSCLE_COLORS[m]||'#555');
    const style=active?`background:${col};color:#fff;border-color:${col}`:`color:${col};border-color:${col}`;
    const fn=isAll?'null':`'${m}'`;
    return `<button class="muscle-filter-tab" style="${style}" onclick="setSwapMuscleFilter(${fn})">${m}</button>`;
  }).join('');
}
function renderSwapGrid(){
  const q=document.getElementById('swap-search').value.trim().toLowerCase();
  const isSearch=q.length>0;
  let pool=[], activeMuscle=null;

  if(_swapMode==='add'||_swapMode==='custom'){
    // Add mode: show library filtered by tab selection and/or search
    if(_swapMuscleFilter&&EXERCISE_LIBRARY[_swapMuscleFilter]){
      pool=EXERCISE_LIBRARY[_swapMuscleFilter].slice();
      activeMuscle=_swapMuscleFilter;
    } else {
      pool=Object.values(EXERCISE_LIBRARY).flat();
    }
    // Hide exercises already in this day/session
    const existing=_swapMode==='custom'
      ? new Set(_customDayExercises.map(e=>e.name))
      : new Set((draftSession?.exercises||[]).map(e=>e.name));
    pool=pool.filter(e=>!existing.has(e.name));
  } else {
    // Swap mode: same-muscle group alternatives
    if(_swapEI<0) return;
    const ex=draftSession.exercises[_swapEI];
    activeMuscle=getExerciseMuscle(ex.name);
    if(activeMuscle&&EXERCISE_LIBRARY[activeMuscle]){
      pool=EXERCISE_LIBRARY[activeMuscle].filter(e=>e.name!==ex.name);
      if(isSearch) pool=[...pool,...Object.values(EXERCISE_LIBRARY).flat()
        .filter(e=>e.name!==ex.name&&!pool.some(p=>p.name===e.name))];
    } else {
      pool=Object.values(EXERCISE_LIBRARY).flat().filter(e=>e.name!==(draftSession.exercises[_swapEI]||{}).name);
    }
  }

  if(isSearch) pool=pool.filter(e=>e.name.toLowerCase().includes(q)||(getExerciseMuscle(e.name)||'').toLowerCase().includes(q));
  // Filter by user's available equipment — skip while actively searching so results aren't silently hidden
  if(!isSearch){
    const avail=getAvailableEquipment();
    pool=pool.filter(e=>avail.includes(e.equipment));
  }

  // Most-used-by-this-user first; sort is stable, so exercises tied on
  // frequency (including everyone at 0, i.e. never logged) keep their
  // existing relative order rather than getting shuffled.
  const freq=getExerciseFrequency();
  pool=[...pool].sort((a,b)=>(freq[b.name]||0)-(freq[a.name]||0));

  const grid=document.getElementById('swap-exercise-grid');
  if(!pool.length){
    grid.innerHTML='<p style="color:var(--text3);font-size:13px;padding:8px 0">No exercises found.</p>';
    return;
  }
  grid.innerHTML=pool.map(e=>{
    const m=getExerciseMuscle(e.name)||activeMuscle||'';
    const color=MUSCLE_COLORS[m]||'#555';
    const safe=e.name.replace(/'/g,"\\'");
    const showGroup=!activeMuscle||(isSearch&&m!==activeMuscle);
    const groupBadge=showGroup&&m
      ?`<span style="font-size:9px;font-weight:700;color:#fff;background:${color};border-radius:3px;padding:1px 5px;text-transform:uppercase">${m}</span>`:'';
    const typeClass=e.type==='Compound'?'badge-compound':'badge-isolation';
    const imgUrl=getExerciseImgUrl(m);
    const imgHTML=imgUrl
      ?`<div class="swap-card-img"><img src="${imgUrl}" loading="lazy" alt="" onerror="this.parentElement.style.display='none'"><div class="swap-card-img-label" style="border-color:${color};color:${color}">${m||''}</div></div>`
      :'';
    return `<div class="swap-card" onclick="selectLibraryExercise('${safe}')">
      ${imgHTML}
      <div class="swap-card-body">
        <div class="swap-card-name">${e.name}</div>
        ${e.targets?`<div class="swap-card-targets">🎯 ${e.targets}</div>`:''}
        <div class="swap-card-meta">
          ${groupBadge}
          <span class="badge-type ${typeClass}">${e.type}</span>
          <span class="badge-equip">${e.equipment}</span>
        </div>
        ${e.cue?`<div class="swap-card-cue">${e.cue}</div>`:''}
      </div>
    </div>`;
  }).join('');
}
function selectLibraryExercise(name){
  if(_swapMode==='custom'){
    _customDayExercises.push({name,structure:''});
    closeSwapModal();
    renderCustomDayModal();
    document.getElementById('custom-day-modal').style.display='flex';
    return;
  }
  if(_swapMode==='add'){
    draftSession.exercises.push({name,sets:[{reps:'',weight:'',done:false}],custom:true});
    _markModified(); saveDraft(activeDate,draftSession);
    _syncDraftToTemplate(); // persist the add to next week's template
    closeSwapModal();
    const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus(); updateDetailSub();
    setTimeout(()=>{ const rows=document.querySelectorAll('.ex-row'); if(rows.length) rows[rows.length-1].scrollIntoView({behavior:'smooth',block:'nearest'}); },50);
  } else {
    if(_swapEI<0) return;
    draftSession.exercises[_swapEI].name=name;
    _markModified(); saveDraft(activeDate,draftSession);
    closeSwapModal();
    renderExerciseRows(_lastSavedSession()); updateSessionStatus();
  }
}
function closeSwapModal(){
  document.getElementById('swap-modal').style.display='none';
  _swapEI=-1; _swapMode='swap'; _swapMuscleFilter=null;
}
// ── Custom day builder ────────────────────────────────────────────────────────
function openCustomDayModal(dayIdx){
  _customDayIdx=dayIdx;
  const day=getActiveDay(dayIdx)||DAYS[dayIdx];
  _customDayExercises=(day?.exercises||[]).map(e=>({name:e.name,structure:e.structure||''}));
  _customDayName=day?.name||'';
  document.getElementById('custom-day-name').value=_customDayName;
  renderCustomDayModal();
  document.getElementById('custom-day-modal').style.display='flex';
}
function closeCustomDayModal(){
  document.getElementById('custom-day-modal').style.display='none';
}
function renderCustomDayModal(){
  const list=document.getElementById('custom-day-list'); if(!list) return;
  if(!_customDayExercises.length){
    list.innerHTML='<div style="font-size:12px;color:var(--text3);padding:12px 0">No exercises yet. Add some below.</div>';
    return;
  }
  list.innerHTML=_customDayExercises.map((ex,i)=>`
    <div class="custom-day-row">
      <span class="custom-day-name-txt">${escapeHtml(ex.name)}</span>
      <input class="custom-day-struct" value="${escapeHtml(ex.structure)}" placeholder="e.g. 3×10"
        oninput="_customDayExercises[${i}].structure=this.value">
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="cday-btn" onclick="moveCustomEx(${i},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="cday-btn" onclick="moveCustomEx(${i},1)" ${i===_customDayExercises.length-1?'disabled':''}>↓</button>
        <button class="cday-btn cday-del" onclick="removeCustomEx(${i})">✕</button>
      </div>
    </div>`).join('');
}
function moveCustomEx(i,dir){
  const j=i+dir;
  if(j<0||j>=_customDayExercises.length) return;
  [_customDayExercises[i],_customDayExercises[j]]=[_customDayExercises[j],_customDayExercises[i]];
  renderCustomDayModal();
}
function removeCustomEx(i){
  _customDayExercises.splice(i,1);
  renderCustomDayModal();
}
function openAddToCustomDay(){
  _swapMode='custom'; _swapMuscleFilter=null;
  document.getElementById('swap-modal-title').textContent='+ Add to Day';
  document.getElementById('swap-subtitle').textContent='Select an exercise to add to this day template.';
  document.getElementById('custom-day-modal').style.display='none';
  _openLibraryModal();
}
function _syncDraftToTemplate(){
  const dayIdx=draftSession.dayIdx;
  if(dayIdx===undefined||dayIdx<0) return;
  const base=getActiveDay(dayIdx)||DAYS[dayIdx]||{};
  setCustomDay(dayIdx,{
    ...base,
    exercises:draftSession.exercises.map(e=>({name:e.name,structure:e.structure||'',note:''})),
  });
  apiSyncSettings({customDays:getCustomDays()});
}
function saveCustomDay(){
  const name=document.getElementById('custom-day-name').value.trim()||'Custom Day';
  const base=getActiveDay(_customDayIdx)||DAYS[_customDayIdx]||{};
  setCustomDay(_customDayIdx,{
    ...base,
    name,
    short:name.length>10?name.slice(0,10)+'…':name,
    exercises:_customDayExercises.map(e=>({name:e.name,structure:e.structure,note:''})),
    tags:['Custom'],
  });
  // Clear all future stale drafts for this dayIdx so every upcoming
  // occurrence of this workout picks up the updated template.
  _clearDraftsForDayIdx(_customDayIdx);
  apiSyncSettings({ customDays: getCustomDays() }); // persist to Postgres
  closeCustomDayModal();
  renderWeekGrid(); renderDetail();
}
function resetCustomDay(){
  if(!confirm('Remove custom template and revert to the program default?')) return;
  clearCustomDay(_customDayIdx);
  apiSyncSettings({ customDays: getCustomDays() }); // persist removal to Postgres
  closeCustomDayModal();
  renderWeekGrid(); renderDetail();
}
