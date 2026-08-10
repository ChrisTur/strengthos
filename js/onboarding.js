// ── Onboarding flow, goal/prefs modals, AI plan generation ──────────────────────────────────────────────

let _selectedGoal='';
function renderGoalGrid(){
  const grid=document.getElementById('goal-grid');
  grid.innerHTML=GOALS.map(g=>`
    <button class="goal-opt${_selectedGoal===g.id?' selected':''}" onclick="selectGoalOpt('${g.id}')">
      <span class="go-icon">${g.icon}</span>
      <span class="go-label">${g.label}</span>
      <span class="go-desc">${g.desc}</span>
    </button>`).join('');
}
function openGoalModal(){
  closeProfileDropdown();
  _selectedGoal=getGoal();
  renderGoalGrid();
  document.getElementById('goal-modal').style.display='flex';
}
function selectGoalOpt(id){
  _selectedGoal=id;
  renderGoalGrid();
}
function saveGoal(){ if(_selectedGoal) setGoal(_selectedGoal); closeGoalModal(); renderProfileSelector(); if(currentView()==='dashboard') renderDashboard(); }
function closeGoalModal(){ document.getElementById('goal-modal').style.display='none' }
// ── Training preferences modal ────────────────────────────────────────────────
function openPrefsModal(){
  document.getElementById('profile-dropdown').style.display='none';
  renderPrefsModal();
  document.getElementById('prefs-modal').style.display='flex';
}
function closePrefsModal(){
  document.getElementById('prefs-modal').style.display='none';
  renderWeekGrid(); renderDetail(); // refresh in case cardio level changed
}
function selectCardioLevel(level){
  setCardioLevel(level);
  renderPrefsModal();
}
function selectEquipment(type){
  toggleEquipmentType(type);
  renderPrefsModal();
}
function selectWarmupIncrement(v){
  setWarmupIncrement(v);
  renderPrefsModal();
}
function selectPrefsDPW(n){
  setDaysPerWeek(n);
  apiSyncSettings({dpw:n});
  renderPrefsModal();
  renderWeekGrid();
  renderDetail();
}
function renderPrefsModal(){
  renderDPWButtons('prefs-dpw-row',getDaysPerWeek(),'selectPrefsDPW');
  // Equipment
  const avail=getAvailableEquipment();
  const equipRow=document.getElementById('equip-row');
  if(equipRow){
    equipRow.innerHTML=ALL_EQUIPMENT.map(t=>{
      const on=avail.includes(t);
      return`<button class="equip-btn${on?' active':''}" onclick="selectEquipment('${t}')">${t}</button>`;
    }).join('');
  }
  const unit=getWeightUnit();
  document.querySelectorAll('#unit-row .dpw-btn').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.unit===unit);
  });
  const warmupIncOpts=unit==='kg'?[1.25,2.5,5]:[2.5,5,10];
  const warmupInc=getWarmupIncrement();
  const warmupIncRow=document.getElementById('warmup-inc-row');
  if(warmupIncRow){
    warmupIncRow.innerHTML=warmupIncOpts.map(v=>
      `<button class="dpw-btn${v===warmupInc?' selected':''}" onclick="selectWarmupIncrement(${v})">${v} ${unit}</button>`
    ).join('');
  }
  const level=getCardioLevel();
  document.querySelectorAll('#cardio-level-row .dpw-btn').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.level===level);
  });
  const disliked=loadDisliked();
  // Reminders
  const remEnabled=getReminderEnabled();
  const remBtn=document.getElementById('reminder-toggle-btn');
  const remTimeWrap=document.getElementById('reminder-time-wrap');
  const remTimeInput=document.getElementById('reminder-time-input');
  if(remBtn){remBtn.textContent=remEnabled?'Disable':'Enable reminders';remBtn.className=`btn btn-sm${remEnabled?' btn-green':''}`;}
  if(remTimeWrap) remTimeWrap.style.display=remEnabled?'':'none';
  if(remTimeInput) remTimeInput.value=getReminderTime();

  const el=document.getElementById('prefs-disliked-list');
  if(!disliked.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:6px 0">No exercises skipped yet. Use the Skip button on any exercise to hide it.</div>';
  } else {
    el.innerHTML=disliked.map(name=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${escapeHtml(name)}</span>
        <button class="btn btn-sm btn-green" onclick="restoreExercise('${escapeJsAttr(name)}')">Restore</button>
      </div>`).join('');
  }
}
function restoreExercise(name){
  const d=loadDisliked().filter(n=>n!==name);
  saveDisliked(d);
  renderPrefsModal();
}
// ── AI plan generation ────────────────────────────────────────────────────────
function buildAIPlanPrompt(goal,dpw,cardioLevel,disliked){
  const goalObj=GOALS.find(g=>g.id===goal)||{label:'Build Muscle',desc:'Progressive overload, hypertrophy focus'};
  const cardioDesc={low:'easy walks and light recovery activity',moderate:'jogging, cycling, or a mix of steady-state and HIIT',high:'HIIT, sprints, battle ropes, and high-intensity cardio'};
  const dislikedStr=disliked.length?`NEVER include these exercises: ${disliked.join(', ')}.`:'';
  return `You are an expert personal trainer. Generate a ${dpw}-day per week workout plan for someone whose goal is: ${goalObj.label} (${goalObj.desc}).

Cardio intensity preference: ${cardioLevel} — meaning ${cardioDesc[cardioLevel]||cardioDesc.moderate}.
${dislikedStr}

Return ONLY a JSON code block with this exact structure:
\`\`\`json
{
  "planName": "Short descriptive name for this plan",
  "days": [
    {
      "name": "Day label (e.g. Push, Pull, Legs, Upper, Lower, Full Body, Cardio)",
      "color": "#hex — use #e07b39 for push/chest/shoulder, #8b6fd4 for pull/back/biceps, #5b9bd5 for legs/lower, #3aab6d for cardio/conditioning, #888 for active recovery",
      "exercises": [
        { "name": "Exercise name", "plan": "Sets×Reps (e.g. 4×8-10)", "structure": "Compound or Isolation", "note": "One brief form cue" }
      ],
      "defaultNote": "One-line focus summary for this day"
    }
  ]
}
\`\`\`

Rules:
- Exactly ${dpw} training days (omit rest days — the app handles scheduling)
- 4-7 exercises per day; lead with a compound movement
- Vary rep ranges across days for stimulus diversity
- Use specific exercise names (e.g. "Barbell Back Squat" not "Squats")
- Cardio days must match the "${cardioLevel}" intensity preference
- No markdown outside the JSON block`;
}
async function generateAIPlan(){
  const key=getAPIKey();
  if(!key){ alert('No Anthropic API key stored.'); return; }
  try {
    const prompt=buildAIPlanPrompt(getGoal()||'muscle',getDaysPerWeek()||5,getCardioLevel(),loadDisliked());
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'content-type':'application/json',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model:'claude-opus-4-8',max_tokens:4096,messages:[{role:'user',content:prompt}]})
    });
    if(!resp.ok){
      const err=await resp.json().catch(()=>({}));
      throw new Error(err.error?.message||`API error ${resp.status}`);
    }
    const data=await resp.json();
    const text=data.content?.[0]?.text||'';
    const m=text.match(/```json\s*([\s\S]*?)\s*```/)||text.match(/(\{[\s\S]*\})/);
    if(!m) throw new Error('No JSON found in response');
    const plan=JSON.parse(m[1]);
    if(!Array.isArray(plan.days)||!plan.days.length) throw new Error('Plan missing days array');
    setAIPlan(plan);
    renderWeekGrid(); renderDetail();
  } catch(e){
    alert('AI plan error: '+e.message);
  }
}
function clearAIPlanAndRefresh(){
  if(!confirm('Remove the AI plan and return to the default program?')) return;
  clearAIPlan();
  renderWeekGrid(); renderDetail();
}
// ── Onboarding wizard ─────────────────────────────────────────────────────────
let _obDPW=4, _obGoal='', _obProgram=null, _obEquipment=null, _obCardioLevel='moderate';
function needsOnboarding(){
  if(localStorage.getItem('wt_onboarded')) return false;
  initProfiles();
  return !loadSessions().length && loadProfiles().length<=1 && getActiveProfile()==='Me';
}
function showOnboarding(){
  document.getElementById('onboarding').style.display='flex';
  renderProgramCards();
  setTimeout(()=>document.getElementById('ob-name-input').focus(),100);
}
function renderProgramCards(){
  const grid=document.getElementById('ob-program-grid');
  if(!grid) return;
  grid.innerHTML=PERSONAS.map(p=>{
    const isCustom=p.type==='custom';
    return `<div class="ob-persona-card${isCustom?' ob-persona-custom':''}" data-id="${p.id}" onclick="obSelectProgram('${p.id}')">
      <div class="ob-persona-check">✓</div>
      <div class="ob-persona-stripe" style="background:${p.color}"></div>
      <div class="ob-persona-content">
        <div class="ob-persona-icon">${p.icon}</div>
        <div class="ob-persona-headline">${p.headline}</div>
        <div class="ob-persona-tagline">${p.tagline}</div>
        <ul class="ob-persona-bullets">
          ${p.bullets.map(b=>`<li>${b}</li>`).join('')}
        </ul>
        <div class="ob-persona-tags">${p.tags.map(t=>`<span class="ob-persona-tag">${t}</span>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
}
function obSelectProgram(id){
  _obProgram=PERSONAS.find(p=>p.id===id)||null;
  if(!_obProgram) return;
  _obGoal=_obProgram.goal||'';
  _obDPW=_obProgram.dpw||4;
  _obCardioLevel=_obProgram.id==='fat_loss'?'high':_obProgram.id==='lift_and_run'?'moderate':'moderate';
  document.querySelectorAll('.ob-persona-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));
  document.getElementById('ob-program-btn').disabled=false;
}
function renderObConfigure(){
  const p=_obProgram;
  if(!p) return;
  const el=document.getElementById('ob-configure-content');
  const confBtn=document.getElementById('ob-configure-btn');
  if(p.type==='custom'){
    _obGoal='';
    el.innerHTML=`
      <h2 class="ob-title">Customize your plan</h2>
      <p class="ob-sub">Choose your goal and training frequency.</p>
      <div class="ob-goals" id="ob-goal-grid">${GOALS.map(g=>`
        <button class="ob-goal-opt" data-id="${g.id}" onclick="obSelectGoal('${g.id}')">
          <span class="ob-goal-icon">${g.icon}</span>
          <span class="ob-goal-label">${g.label}</span>
          <span class="ob-goal-desc">${g.desc}</span>
        </button>`).join('')}</div>
      <p class="ob-sub" style="margin-top:4px">Days per week</p>
      <div class="dpw-row" id="ob-dpw-row"></div>
      <div id="ob-dpw-desc" class="ob-dpw-desc"></div>`;
    if(confBtn) confBtn.disabled=true;
    renderDPWButtons('ob-dpw-row',_obDPW,'obSelectDPW');
    const d=document.getElementById('ob-dpw-desc'); if(d) d.textContent=DPW_DESCS[_obDPW]||'';
  } else {
    // Non-custom: confirm equipment + adjust days. Default to every equipment type checked —
    // the toggle grid is fully editable either way, so there's no good reason to start any
    // persona narrower than another (previously only "Pure Cardio" defaulted to Dumbbell+
    // Bodyweight, which didn't even match what cardio exercises actually use).
    const defaultEquip=[...ALL_EQUIPMENT];
    _obEquipment=[...defaultEquip];
    el.innerHTML=`
      <div class="ob-persona-confirm-header" style="border-left:3px solid ${p.color};padding-left:12px;margin-bottom:16px">
        <div style="font-size:20px;margin-bottom:2px">${p.icon} <strong>${p.headline}</strong></div>
        <div style="font-size:12px;color:var(--text3)">${p.tagline}</div>
      </div>
      <p class="ob-sub" style="text-align:left;margin-bottom:8px">What equipment do you have access to?</p>
      <div class="ob-equip-grid">${ALL_EQUIPMENT.map(e=>`<button class="ob-equip-btn${defaultEquip.includes(e)?' active':''}" data-eq="${e}" onclick="obToggleEquip(this)">${e}</button>`).join('')}</div>
      <p class="ob-sub" style="text-align:left;margin-top:16px;margin-bottom:6px">Sessions per week</p>
      <div class="dpw-row" id="ob-dpw-row"></div>
      <div id="ob-dpw-desc" class="ob-dpw-desc"></div>`;
    if(confBtn) confBtn.disabled=false;
    renderDPWButtons('ob-dpw-row',_obDPW,'obSelectDPW');
    const d=document.getElementById('ob-dpw-desc'); if(d) d.textContent=DPW_DESCS[_obDPW]||'';
  }
}
function obToggleEquip(btn){
  btn.classList.toggle('active');
  _obEquipment=[...document.querySelectorAll('.ob-equip-btn.active')].map(b=>b.dataset.eq);
  if(!_obEquipment.length){ btn.classList.add('active'); _obEquipment=[btn.dataset.eq]; }
}
function obSelectGoal(id){
  _obGoal=id;
  document.querySelectorAll('.ob-goal-opt').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));
  const btn=document.getElementById('ob-configure-btn'); if(btn) btn.disabled=false;
}
function obSelectDPW(n){
  _obDPW=n;
  renderDPWButtons('ob-dpw-row',n,'obSelectDPW');
  const desc=document.getElementById('ob-dpw-desc');
  if(desc) desc.textContent=DPW_DESCS[n]||'';
}
function obNext(step){
  if(step===2){
    const name=document.getElementById('ob-name-input').value.trim();
    if(!name){ document.getElementById('ob-name-input').focus(); return; }
  }
  if(step===3){
    if(!_obProgram) return;
    renderObConfigure();
  }
  if(step===4){
    if(_obProgram&&_obProgram.type==='custom'&&!_obGoal) return;
    renderObPlanPreview();
  }
  document.querySelectorAll('.ob-card').forEach(c=>c.style.display='none');
  document.getElementById('ob-step-'+step).style.display='flex';
}
function obBack(step){
  document.querySelectorAll('.ob-card').forEach(c=>c.style.display='none');
  document.getElementById('ob-step-'+step).style.display='flex';
}
function renderObPlanPreview(){
  const name=(document.getElementById('ob-name-input').value.trim())||'there';
  document.getElementById('ob-name-preview').textContent=name;
  const persona=_obProgram;
  const goalObj=GOALS.find(g=>g.id===_obGoal)||GOALS[0];
  const progName=persona&&persona.type!=='custom'?persona.headline:goalObj.label;
  document.getElementById('ob-plan-desc').textContent=progName+(_obDPW?` · ${_obDPW} days/week`:'');
  let days;
  if(persona&&persona.type==='hybrid'){
    days=HYBRID_PROGRAMS[_obDPW]||HYBRID_PROGRAMS[4];
  } else if(_obGoal==='cardio'){
    const cpKeys=Object.keys(CARDIO_PROGRAMS).map(Number);
    const cpKey=CARDIO_PROGRAMS[_obDPW]?_obDPW:cpKeys.reduce((a,b)=>Math.abs(b-_obDPW)<Math.abs(a-_obDPW)?b:a);
    days=CARDIO_PROGRAMS[cpKey];
  } else {
    days=PROGRAMS[_obDPW]||(DAYS.length>=_obDPW?DAYS.slice(0,_obDPW):DAYS);
  }
  const preview=document.getElementById('ob-plan-preview');
  preview.innerHTML=(days||[]).slice(0,_obDPW||7).map(day=>`
    <div class="ob-day-pill" style="background:${(day.dots&&day.dots[0])||'#555'}">
      <div style="font-size:16px;margin-bottom:2px">${day.short||day.name||'Day'}</div>
      ${day.tags?`<div style="font-size:9px;opacity:.75">${day.tags.slice(0,2).join(' · ')}</div>`:''}
    </div>`).join('');
}
function completeOnboarding(){
  const name=(document.getElementById('ob-name-input').value.trim())||'Me';
  const profs=loadProfiles();
  const idx=profs.indexOf('Me');
  if(idx>=0&&name!=='Me'){ profs[idx]=name; saveProfiles(profs); setActiveProfile(name); }
  else if(!profs.includes(name)){ profs.push(name); saveProfiles(profs); setActiveProfile(name); }
  if(_obDPW) setDaysPerWeek(_obDPW);
  if(_obGoal) setGoal(_obGoal);
  if(_obEquipment&&_obEquipment.length) setEquipment(_obEquipment);
  setCardioLevel(_obCardioLevel);
  localStorage.setItem('wt_onboarded','1');
  document.getElementById('onboarding').style.display='none';
  initApp();
}
