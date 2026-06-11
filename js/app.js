function switchProfile(name){
  setActiveProfile(name); closeProfileDropdown();
  weekOffset=0; setActiveDate(TODAY);
  renderProfileSelector(); renderWeekGrid(); renderDetail();
  const v=currentView();
  if(v==='history') renderHistory();
  if(v==='dashboard') renderDashboard();
}

function openProfileModal(){
  closeProfileDropdown();
  _newProfileDPW=5; _newProfileGoal='';
  const m=document.getElementById('profile-modal'),i=document.getElementById('profile-name-input'),e=document.getElementById('profile-name-error');
  i.value=''; i.classList.remove('error'); e.style.display='none';
  renderDPWButtons('dpw-row',5,'selectDPW'); updateDPWDesc(5);
  renderProfileGoalGrid();
  m.style.display='flex';
  setTimeout(()=>i.focus(),60);
}
function closeProfileModal(){ document.getElementById('profile-modal').style.display='none' }
function createProfile(){
  const i=document.getElementById('profile-name-input'),e=document.getElementById('profile-name-error'),name=i.value.trim();
  if(!name){i.focus();return}
  const p=loadProfiles();
  if(p.includes(name)){i.classList.add('error');e.style.display='';i.focus();return}
  p.push(name); saveProfiles(p);
  if(_newProfileDPW&&_newProfileDPW!==7) localStorage.setItem(daysPerWeekKey(name),String(_newProfileDPW));
  if(_newProfileGoal) localStorage.setItem(goalKey(name),_newProfileGoal);
  closeProfileModal(); switchProfile(name);
}
function deleteProfile(name){
  const p=loadProfiles();
  if(p.length<=1){alert('Need at least one profile.');return}
  if(!confirm('Delete profile "'+name+'" and all their data?')) return;
  localStorage.removeItem(sessionKey(name));
  DAYS.forEach((_,i)=>{ localStorage.removeItem(draftKey(i,name)); localStorage.removeItem(noteKey(i,name)); });
  localStorage.removeItem(deloadKey(name)); localStorage.removeItem(bwKey(name));
  localStorage.removeItem(scheduleKey(name)); localStorage.removeItem(goalKey(name));
  localStorage.removeItem(daysPerWeekKey(name));
  localStorage.removeItem(cardioKey(name)); localStorage.removeItem(dislikedKey(name));
  const updated=p.filter(x=>x!==name); saveProfiles(updated);
  if(getActiveProfile()===name) setActiveProfile(updated[0]);
  renderProfileSelector(); renderWeekGrid(); renderDetail();
}
function toggleProfileDropdown(){
  const dd=document.getElementById('profile-dropdown');
  if(dd.style.display==='none'){renderProfileDropdown();dd.style.display=''}
  else dd.style.display='none';
}
function closeProfileDropdown(){ document.getElementById('profile-dropdown').style.display='none' }
function renderProfileDropdown(){
  const profiles=loadProfiles(),active=getActiveProfile(),list=document.getElementById('profile-list');
  list.innerHTML='';
  profiles.forEach(name=>{
    const div=document.createElement('div');
    div.className='profile-option'+(name===active?' current':'');
    const safe=name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    div.innerHTML=`<span>${name}${name===active?' ✓':''}</span>
      <span style="display:flex;gap:4px">
        <button class="profile-del-btn" onclick="event.stopPropagation();openRenameModal('${safe}')" title="Rename" style="opacity:0">✎</button>
        ${profiles.length>1?`<button class="profile-del-btn" onclick="event.stopPropagation();deleteProfile('${safe}')" title="Delete">✕</button>`:''}
      </span>`;
    div.onclick=()=>switchProfile(name);
    div.onmouseenter=()=>div.querySelectorAll('.profile-del-btn').forEach(b=>b.style.opacity='1');
    div.onmouseleave=()=>div.querySelectorAll('.profile-del-btn').forEach(b=>b.style.opacity='0');
    list.appendChild(div);
  });
}
function renderProfileSelector(){
  const g=getGoal(); const go=GOALS.find(x=>x.id===g);
  document.getElementById('profile-name-display').textContent=getActiveProfile()+(go?' '+go.icon:'');
}
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

let _renameTarget=null;
function openRenameModal(name){
  closeProfileDropdown(); _renameTarget=name;
  const m=document.getElementById('rename-modal'),i=document.getElementById('rename-input'),e=document.getElementById('rename-error');
  i.value=name; i.classList.remove('error'); e.style.display='none'; m.style.display='flex';
  setTimeout(()=>{i.select();i.focus()},60);
}
function closeRenameModal(){ document.getElementById('rename-modal').style.display='none'; _renameTarget=null }
function confirmRename(){
  const i=document.getElementById('rename-input'),e=document.getElementById('rename-error');
  const newName=i.value.trim(),oldName=_renameTarget;
  if(!newName){i.focus();return} if(newName===oldName){closeRenameModal();return}
  const p=loadProfiles();
  if(p.includes(newName)){i.classList.add('error');e.style.display='';i.focus();return}
  const oldS=localStorage.getItem(sessionKey(oldName));
  if(oldS){localStorage.setItem(sessionKey(newName),oldS);localStorage.removeItem(sessionKey(oldName))}
  DAYS.forEach((_,idx)=>{
    const d=localStorage.getItem(draftKey(idx,oldName));
    if(d){localStorage.setItem(draftKey(idx,newName),d);localStorage.removeItem(draftKey(idx,oldName))}
    const n=localStorage.getItem(noteKey(idx,oldName));
    if(n){localStorage.setItem(noteKey(idx,newName),n);localStorage.removeItem(noteKey(idx,oldName))}
  });
  const dl=localStorage.getItem(deloadKey(oldName));
  if(dl){localStorage.setItem(deloadKey(newName),dl);localStorage.removeItem(deloadKey(oldName))}
  const bw=localStorage.getItem(bwKey(oldName));
  if(bw){localStorage.setItem(bwKey(newName),bw);localStorage.removeItem(bwKey(oldName))}
  const sc=localStorage.getItem(scheduleKey(oldName));
  if(sc){localStorage.setItem(scheduleKey(newName),sc);localStorage.removeItem(scheduleKey(oldName))}
  const gl=localStorage.getItem(goalKey(oldName));
  if(gl){localStorage.setItem(goalKey(newName),gl);localStorage.removeItem(goalKey(oldName))}
  const dp=localStorage.getItem(daysPerWeekKey(oldName));
  if(dp){localStorage.setItem(daysPerWeekKey(newName),dp);localStorage.removeItem(daysPerWeekKey(oldName))}
  const cl=localStorage.getItem(cardioKey(oldName));
  if(cl){localStorage.setItem(cardioKey(newName),cl);localStorage.removeItem(cardioKey(oldName))}
  const dk=localStorage.getItem(dislikedKey(oldName));
  if(dk){localStorage.setItem(dislikedKey(newName),dk);localStorage.removeItem(dislikedKey(oldName))}
  p[p.indexOf(oldName)]=newName; saveProfiles(p);
  if(getActiveProfile()===oldName) setActiveProfile(newName);
  closeRenameModal(); renderProfileSelector(); renderWeekGrid(); renderDetail();
}


// ── Plate calculator ──────────────────────────────────────────────────────────
function openPlateModal(){
  document.getElementById('plate-input').value='';
  document.getElementById('plate-result').innerHTML='<span style="font-size:12px;color:var(--text3)">Enter a target weight above.</span>';
  document.getElementById('orm-weight').value='';
  document.getElementById('orm-reps').value='';
  document.getElementById('orm-result').innerHTML='<span style="font-size:12px;color:var(--text3)">Enter weight and reps above.</span>';
  switchCalcTab('plates');
  document.getElementById('plate-modal').style.display='flex';
  setTimeout(()=>document.getElementById('plate-input').focus(),60);
}
function closePlateModal(){ document.getElementById('plate-modal').style.display='none' }
function switchCalcTab(tab){
  document.getElementById('calc-plates-panel').style.display=tab==='plates'?'':'none';
  document.getElementById('calc-1rm-panel').style.display=tab==='1rm'?'':'none';
  document.getElementById('tab-plates').classList.toggle('active',tab==='plates');
  document.getElementById('tab-1rm').classList.toggle('active',tab==='1rm');
}
function calc1RM(){
  const w=parseFloat(document.getElementById('orm-weight').value);
  const r=parseInt(document.getElementById('orm-reps').value);
  const res=document.getElementById('orm-result');
  if(!w||!r||r<1||r>30){res.innerHTML='<span style="font-size:12px;color:var(--text3)">Enter weight and reps (1–30).</span>';return}
  const est=Math.round(w*(1+r/30)/2.5)*2.5;
  const rows=[100,95,90,85,80,75,70,65].map(pct=>{
    const pw=Math.round(est*pct/100/2.5)*2.5;
    const zone=pct===100?'Max 1RM':pct>=90?'Strength':pct>=75?'Power':'Hypertrophy';
    return`<tr><td>${pct}%</td><td style="font-weight:${pct===100?700:400};color:${pct===100?'var(--accent)':'var(--text)'}">${pw} ${getWeightUnit()}</td><td style="color:var(--text3)">${zone}</td></tr>`;
  }).join('');
  res.innerHTML=`
    <div style="margin-bottom:10px;font-size:13px">Est. 1RM: <span style="font-size:18px;font-weight:700;color:var(--accent)">${est} ${getWeightUnit()}</span></div>
    <table class="orm-table"><thead><tr><th>%</th><th>Weight</th><th>Zone</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function calcPlates(){
  const target=parseFloat(document.getElementById('plate-input').value);
  const res=document.getElementById('plate-result');
  if(isNaN(target)||target<45){res.innerHTML='<span style="font-size:12px;color:var(--text3)">Enter a weight ≥ 45 lbs.</span>';return}
  const perSide=(target-45)/2;
  if(perSide<0){res.innerHTML='<span style="font-size:12px;color:var(--red)">Less than bar weight (45 lbs).</span>';return}
  const denominations=[45,35,25,10,5,2.5];
  const classes=['p45','p35','p25','p10','p5','p2'];
  let remainder=perSide, plates=[];
  denominations.forEach((d,i)=>{
    const count=Math.floor(remainder/d+0.001);
    if(count>0){ plates.push({w:d,count,cls:classes[i]}); remainder-=count*d; }
  });
  remainder=Math.round(remainder*10)/10;
  if(plates.length===0){
    res.innerHTML='<div style="font-size:12px;color:var(--text2)">Bar only (45 lbs)</div>';return;
  }
  const chips=plates.map(p=>`<span class="plate-chip ${p.cls}">${p.count>1?p.count+'×':''}${p.w}</span>`).join('');
  res.innerHTML=`<div style="font-size:11px;color:var(--text3);margin-bottom:4px">${perSide} lbs per side</div>
    <div class="plate-row">${chips}</div>
    ${Math.abs(remainder)>0.1?`<div class="plate-sub">⚠ ${remainder} lbs unaccounted — check available plates</div>`:''}`;
}


function openBWModal(){
  document.getElementById('bw-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('bw-weight').value='';
  document.getElementById('bw-modal').style.display='flex';
  setTimeout(()=>document.getElementById('bw-weight').focus(),60);
}
function closeBWModal(){ document.getElementById('bw-modal').style.display='none' }
function saveBW(){
  const date=document.getElementById('bw-date').value;
  const weight=parseFloat(document.getElementById('bw-weight').value);
  if(!date||isNaN(weight)||weight<=0) return;
  const entries=loadBW().filter(e=>e.date!==date);
  entries.push({date,weight}); entries.sort((a,b)=>a.date.localeCompare(b.date));
  saveBW2(entries); closeBWModal(); renderDashboard();
}


// ── New-profile modal state ───────────────────────────────────────────────────
let _newProfileDPW=5,_newProfileGoal='';

const DPW_DESCS={3:'Mon/Wed/Fri — Push · Pull · Legs',4:'Mon/Tue/Thu/Fri — 4-day split',5:'Mon–Fri workouts, Sat–Sun rest',6:'Mon–Sat workouts, Sun rest',7:'Full 7-day rotation'};

function renderDPWButtons(rowId,selected,fnName){
  const row=document.getElementById(rowId); if(!row) return;
  row.innerHTML=[3,4,5,6,7].map(n=>`<button class="dpw-btn${n===selected?' selected':''}" onclick="${fnName}(${n})">${n} day${n>1?'s':''}</button>`).join('');
}
function updateDPWDesc(dpw){
  const el=document.getElementById('dpw-desc'); if(el) el.textContent=DPW_DESCS[dpw]||'';
}
function selectDPW(n){
  _newProfileDPW=n; renderDPWButtons('dpw-row',n,'selectDPW'); updateDPWDesc(n);
}
function renderProfileGoalGrid(){
  const grid=document.getElementById('profile-goal-grid'); if(!grid) return;
  grid.innerHTML=GOALS.map(g=>`<button class="goal-opt${_newProfileGoal===g.id?' selected':''}" onclick="selectProfileGoal('${g.id}')"><span class="go-icon">${g.icon}</span><span class="go-label">${g.label}</span><span class="go-desc">${g.desc}</span></button>`).join('');
}
function selectProfileGoal(id){ _newProfileGoal=_newProfileGoal===id?'':id; renderProfileGoalGrid(); }

let _selectedGoal='';
function openGoalModal(){
  closeProfileDropdown();
  _selectedGoal=getGoal();
  const grid=document.getElementById('goal-grid');
  grid.innerHTML=GOALS.map(g=>`
    <button class="goal-opt${_selectedGoal===g.id?' selected':''}" onclick="selectGoalOpt('${g.id}')">
      <span class="go-icon">${g.icon}</span>
      <span class="go-label">${g.label}</span>
      <span class="go-desc">${g.desc}</span>
    </button>`).join('');
  document.getElementById('goal-modal').style.display='flex';
}
function selectGoalOpt(id){
  _selectedGoal=id;
  document.querySelectorAll('.goal-opt').forEach(b=>b.classList.toggle('selected',b.onclick.toString().includes("'"+id+"'")));
  // simpler re-render
  const grid=document.getElementById('goal-grid');
  grid.innerHTML=GOALS.map(g=>`
    <button class="goal-opt${_selectedGoal===g.id?' selected':''}" onclick="selectGoalOpt('${g.id}')">
      <span class="go-icon">${g.icon}</span>
      <span class="go-label">${g.label}</span>
      <span class="go-desc">${g.desc}</span>
    </button>`).join('');
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
function renderPrefsModal(){
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
  const level=getCardioLevel();
  document.querySelectorAll('#cardio-level-row .dpw-btn').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.level===level);
  });
  const disliked=loadDisliked();
  const el=document.getElementById('prefs-disliked-list');
  if(!disliked.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:6px 0">No exercises skipped yet. Use the Skip button on any exercise to hide it.</div>';
  } else {
    el.innerHTML=disliked.map(name=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${name}</span>
        <button class="btn btn-sm btn-green" onclick="restoreExercise('${name.replace(/'/g,"\\'")}')">Restore</button>
      </div>`).join('');
  }
  const keyInput=document.getElementById('api-key-input');
  if(keyInput) keyInput.value=getAPIKey();
  const plan=getAIPlan();
  const clearBtn=document.getElementById('ai-clear-btn');
  if(clearBtn) clearBtn.style.display=plan?'':'none';
  const statusEl=document.getElementById('ai-gen-status');
  if(statusEl&&plan&&!statusEl.textContent){
    statusEl.textContent=`Active: "${plan.planName||'Custom Plan'}"`;
    statusEl.style.color='var(--green)';
  }
}
function restoreExercise(name){
  const d=loadDisliked().filter(n=>n!==name);
  saveDisliked(d);
  renderPrefsModal();
}
function saveAPIKeyFromInput(){
  setAPIKey(document.getElementById('api-key-input').value);
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
  if(!key){
    alert('Enter your Anthropic API key in the field above first.');
    document.getElementById('api-key-input').focus();
    return;
  }
  const btn=document.getElementById('ai-gen-btn');
  const statusEl=document.getElementById('ai-gen-status');
  btn.disabled=true; btn.textContent='Generating…';
  statusEl.textContent='Talking to Claude…'; statusEl.style.color='var(--text2)';

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
    statusEl.textContent=`✓ "${plan.planName||'Custom Plan'}" applied`;
    statusEl.style.color='var(--green)';
    document.getElementById('ai-clear-btn').style.display='';
    renderWeekGrid(); renderDetail();
  } catch(e){
    statusEl.textContent='Error: '+e.message;
    statusEl.style.color='var(--red)';
  } finally {
    btn.disabled=false; btn.textContent='✨ Generate AI Plan';
  }
}

function clearAIPlanAndRefresh(){
  if(!confirm('Remove the AI plan and return to the default program?')) return;
  clearAIPlan();
  const statusEl=document.getElementById('ai-gen-status');
  statusEl.textContent='Returned to default program.'; statusEl.style.color='var(--text2)';
  document.getElementById('ai-clear-btn').style.display='none';
  renderWeekGrid(); renderDetail();
}

// ── Onboarding wizard ─────────────────────────────────────────────────────────
let _obDPW=5, _obGoal='', _obProgram=null, _obEquipment=null;

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
  grid.innerHTML=ONBOARDING_PROGRAMS.map(p=>{
    const isCustom=p.type==='custom';
    const imgUrl=p.imgId?`https://images.unsplash.com/photo-${p.imgId}?auto=format&fit=crop&w=600&h=240&q=80`:'';
    return `<div class="ob-prog-card${isCustom?' ob-prog-custom':''}" data-id="${p.id}" onclick="obSelectProgram('${p.id}')">
      ${imgUrl?`<img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`:''}
      <div class="ob-prog-grad"></div>
      <div class="ob-prog-check">✓</div>
      <div class="ob-prog-body">
        <div class="ob-prog-tags">${p.tags.map(t=>`<span class="ob-prog-tag">${t}</span>`).join('')}</div>
        <div class="ob-prog-name">${isCustom?'✏️ ':''}${p.name}</div>
        <div class="ob-prog-badge">${p.badge}</div>
      </div>
    </div>`;
  }).join('');
}

function obSelectProgram(id){
  _obProgram=ONBOARDING_PROGRAMS.find(p=>p.id===id)||null;
  document.querySelectorAll('.ob-prog-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));
  const btn=document.getElementById('ob-program-btn');
  if(btn) btn.disabled=false;
  // show description below grid
  let desc=document.getElementById('ob-prog-desc-row');
  if(!desc){ desc=document.createElement('p'); desc.id='ob-prog-desc-row'; desc.className='ob-sub ob-prog-selected-desc'; document.getElementById('ob-program-grid').after(desc); }
  desc.textContent=_obProgram?_obProgram.desc:'';
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
  } else if(p.type==='cardio'){
    _obGoal=p.goal; _obDPW=p.dpw||4;
    el.innerHTML=`
      <h2 class="ob-title">How many days per week?</h2>
      <p class="ob-sub">${p.name} · choose your frequency.</p>
      <div class="dpw-row" id="ob-dpw-row"></div>
      <div id="ob-dpw-desc" class="ob-dpw-desc"></div>`;
    if(confBtn) confBtn.disabled=false;
    renderDPWButtons('ob-dpw-row',_obDPW,'obSelectDPW');
    const d=document.getElementById('ob-dpw-desc'); if(d) d.textContent=DPW_DESCS[_obDPW]||'';
  } else {
    _obGoal=p.goal; _obDPW=p.dpw;
    const eq=ALL_EQUIPMENT;
    el.innerHTML=`
      <h2 class="ob-title">What equipment do you have?</h2>
      <p class="ob-sub">We'll filter exercises to match your gym. Tap to toggle.</p>
      <div class="ob-equip-grid">${eq.map(e=>`<button class="ob-equip-btn active" data-eq="${e}" onclick="obToggleEquip(this)">${e}</button>`).join('')}</div>
      <p class="ob-sub" style="margin-top:16px">Training days / week</p>
      <div class="dpw-row" id="ob-dpw-row"></div>`;
    if(confBtn) confBtn.disabled=false;
    renderDPWButtons('ob-dpw-row',_obDPW,'obSelectDPW');
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
  const goalObj=GOALS.find(g=>g.id===_obGoal)||GOALS[0];
  const progName=_obProgram&&_obProgram.type!=='custom'?_obProgram.name:goalObj.label;
  document.getElementById('ob-plan-desc').textContent=progName+' · '+_obDPW+' days/week';
  let days;
  if(_obGoal==='cardio'){
    const cpKeys=Object.keys(CARDIO_PROGRAMS).map(Number);
    const cpKey=CARDIO_PROGRAMS[_obDPW]?_obDPW:cpKeys.reduce((a,b)=>Math.abs(b-_obDPW)<Math.abs(a-_obDPW)?b:a);
    days=CARDIO_PROGRAMS[cpKey];
  } else {
    days=PROGRAMS[_obDPW]||(DAYS.length>=_obDPW?DAYS.slice(0,_obDPW):DAYS);
  }
  const preview=document.getElementById('ob-plan-preview');
  preview.innerHTML=(days||[]).slice(0,_obDPW).map(day=>`
    <div class="ob-day-pill" style="background:${(day.dots&&day.dots[0])||'#555'}">
      <span>${day.short||day.name||'Day'}</span>
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
  localStorage.setItem('wt_onboarded','1');
  document.getElementById('onboarding').style.display='none';
  initApp();
}

// ── Exercise library modal (swap + add) ───────────────────────────────────────
let _swapEI=-1, _swapMode='swap', _swapMuscleFilter=null;
let _customDayIdx=-1, _customDayExercises=[], _customDayName='';
let _durationTimer=null;

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

  if(isSearch) pool=pool.filter(e=>e.name.toLowerCase().includes(q));
  // Filter by user's available equipment
  const avail=getAvailableEquipment();
  pool=pool.filter(e=>avail.includes(e.equipment));

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
    return `<div class="swap-card" onclick="selectLibraryExercise('${safe}')">
      <div class="swap-card-name">${e.name}</div>
      <div class="swap-card-meta">
        ${groupBadge}
        <span class="badge-type ${typeClass}">${e.type}</span>
        <span class="badge-equip">${e.equipment}</span>
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
    closeSwapModal();
    const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
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
      <span class="custom-day-name-txt">${ex.name}</span>
      <input class="custom-day-struct" value="${ex.structure}" placeholder="e.g. 3×10"
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
  closeCustomDayModal();
  renderWeekGrid(); renderDetail();
}
function resetCustomDay(){
  if(!confirm('Remove custom template and revert to the program default?')) return;
  clearCustomDay(_customDayIdx);
  closeCustomDayModal();
  renderWeekGrid(); renderDetail();
}

// ── State ─────────────────────────────────────────────────────────────────────
const TODAY=new Date().toISOString().slice(0,10);
let activeDate=TODAY;
let activeDayIdx=0; // kept in sync via setActiveDate()
let weekOffset=0;
let draftSession=null;

function setActiveDate(date){
  activeDate=date;
  activeDayIdx=getWorkoutForDate(date);
}

// ── Week grid ─────────────────────────────────────────────────────────────────
function getWeekDates(offset){
  const anchor=new Date(TODAY+'T00:00:00');
  anchor.setDate(anchor.getDate()+offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(anchor); d.setDate(anchor.getDate()+i); return d.toISOString().slice(0,10); });
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
  const sessions=loadSessions();
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
      <div class="dname" style="${isRest?'color:var(--text3)':''}" title="${day?day.name:''}">${isRest?'Rest':day?day.name:'?'}</div>
      <div class="dots">${isRest?'':(day?day.dots.map(c=>`<div class="dot" style="background:${c}"></div>`).join(''):'')}</div>`;
    div.onclick=()=>{ setActiveDate(date); renderWeekGrid(); renderDetail(); };
    grid.appendChild(div);
  });

  // On mobile, scroll active day into centre of the strip
  if(window.innerWidth<=600){
    const active=grid.querySelector('.day-pill.active');
    if(active) setTimeout(()=>active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}),30);
  }
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

function initDraft(dayIdx,date){
  date=date||activeDate;
  const goal=getGoal();
  const disliked=loadDisliked();
  const extras=(GOAL_EXERCISES[goal]||[])
    .filter(ex=>!disliked.includes(ex.name))
    .map(ex=>({name:ex.name,sets:[{reps:'',weight:'',done:false}],goalAdded:true}));
  const day=getActiveDay(dayIdx);
  if(!day) return{dayIdx,date,exercises:[...extras],notes:'',startedAt:Date.now()};
  return{dayIdx,date,
    exercises:[
      ...day.exercises.filter(ex=>!disliked.includes(ex.name)).map(ex=>({name:ex.name,sets:[{reps:'',weight:'',done:false}]})),
      ...extras
    ],
    notes:'',startedAt:Date.now()};
}

function syncGoalExercises(){
  const goal=getGoal();
  const disliked=loadDisliked();
  const extras=(GOAL_EXERCISES[goal]||[]).filter(ex=>!disliked.includes(ex.name));
  // Preserve any set data already logged for goal exercises
  const existing=draftSession.exercises.filter(ex=>ex.goalAdded);
  draftSession.exercises=draftSession.exercises.filter(ex=>!ex.goalAdded);
  extras.forEach(ex=>{
    const prev=existing.find(e=>e.name===ex.name);
    draftSession.exercises.push(prev||{name:ex.name,sets:[{reps:'',weight:'',done:false}],goalAdded:true});
  });
}

function renderDetail(){
  const panel=document.getElementById('detail-panel');
  const activeDays=getActiveDays();
  const workoutOpts=`<option value="${REST_DAY}"${activeDayIdx===REST_DAY?' selected':''}>Rest / Off</option>`
    +activeDays.map((d,i)=>`<option value="${i}"${i===activeDayIdx?' selected':''}>${d.dow} — ${d.name}</option>`).join('');

  if(activeDayIdx===REST_DAY){
    panel.innerHTML=`
      <div class="detail-header">
        <div>
          <div class="detail-title">Rest Day</div>
          <div class="detail-sub">Recovery — muscles grow during rest, not just during training</div>
        </div>
        <div style="display:flex;gap:6px;align-items:flex-start">
          <select class="workout-select" onchange="changeWorkoutForDate(this.value)" title="Change workout for this date">${workoutOpts}</select>
        </div>
      </div>
      <div style="padding:36px 16px;text-align:center;color:var(--text3)">
        <div style="font-size:36px;margin-bottom:12px">😴</div>
        <div style="font-size:14px;font-weight:500;color:var(--text2);margin-bottom:8px">Scheduled rest day</div>
        <div style="font-size:12px;line-height:1.7">Sleep well, stay hydrated, eat enough protein.<br>Want to train today? Use the dropdown above to assign a workout.</div>
      </div>`;
    return;
  }

  const day=getActiveDay(activeDayIdx)||DAYS[activeDayIdx];
  if(!day){panel.innerHTML='<div class="empty-state">No workout found.</div>';return}
  draftSession=getDraft(activeDate)||initDraft(activeDayIdx,activeDate);
  draftSession.dayIdx=activeDayIdx;
  syncGoalExercises();
  const sessions=loadSessions().filter(s=>s.dayIdx===activeDayIdx);
  const lastSession=sessions.length?sessions[sessions.length-1]:null;
  const note=getDayNote(activeDayIdx);
  const goal=getGoal(); const goalObj=GOALS.find(g=>g.id===goal);
  const coachingNote=GOAL_COACHING[goal]||'';
  const heroUrl=typeof getWorkoutImageUrl==='function'?getWorkoutImageUrl(day):null;
  const heroHTML=heroUrl?`<div class="workout-hero"><img src="${heroUrl}" alt="${day.name}" loading="lazy" onerror="this.closest('.workout-hero').style.display='none'"><div class="workout-hero-grad"></div></div>`:'';

  panel.innerHTML=`
    ${heroHTML}
    <div class="detail-header">
      <div>
        <div class="detail-title-wrap" onclick="startDayRename(${activeDayIdx})" title="Click to rename this day">
          <span class="detail-title" id="detail-day-title">${day.name}</span>
          <span class="rename-hint">✎</span>
        </div>
        <div class="detail-sub">${day.exercises.length} exercises · 45–60 min${lastSession?` · Last logged ${formatDate(lastSession.date)}`:''}</div>
        <div class="tags">${day.tags.map(t=>`<span class="tag">${t}</span>`).join('')}${goalObj?`<span class="tag" style="border-color:var(--accent);color:var(--accent)">${goalObj.icon} ${goalObj.label}</span>`:''}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="openCustomDayModal(${activeDayIdx})" title="Edit exercises for this day template">✏️ Edit day</button>
        <select class="workout-select" onchange="changeWorkoutForDate(this.value)" title="Change workout for this date">${workoutOpts}</select>
        <input type="date" id="session-date" value="${draftSession.date}"
          style="padding:5px 8px;border-radius:6px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);font-size:12px;cursor:pointer"
          onchange="draftSession.date=this.value;saveDraft(activeDate,draftSession)">
        <button class="btn btn-sm ${isDeload()?'btn-amber':''}" onclick="toggleDeload()" title="Toggle deload week"
          style="white-space:nowrap">${isDeload()?'⚡ Deload ON':'⚡ Deload'}</button>
      </div>
    </div>
    <table class="ex-table">
      <thead><tr>
        <th style="width:22%">Exercise</th>
        <th style="width:26%">Programme</th>
        <th style="width:20%">Last session</th>
        <th>Log sets (weight × reps)</th>
      </tr></thead>
      <tbody id="ex-tbody"></tbody>
    </table>
    <div class="add-ex-wrap">
      <button class="add-ex-btn" onclick="openAddExModal()">+ Add Exercise</button>
    </div>
    <div class="note-edit">${note}</div>
    ${coachingNote?`<div style="margin:0 12px 10px;padding:8px 12px;border-radius:var(--radius-sm);font-size:12px;line-height:1.5;background:var(--amber-bg);border-left:3px solid var(--amber);color:var(--amber)">${coachingNote}</div>`:''}
    <div class="session-notes-wrap">
      <textarea class="session-notes" id="session-notes"
        placeholder="Session notes (how you felt, PRs, adjustments…)"
        oninput="draftSession.notes=this.value;saveDraft(activeDate,draftSession)">${draftSession.notes}</textarea>
    </div>
    <div class="session-bar">
      <div>
        <div class="session-date" id="session-status">Draft — not saved</div>
        <div id="session-timer" style="font-size:10px;color:var(--text3);margin-top:2px"></div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm btn-red" onclick="discardDraft()">Discard</button>
        <button class="btn btn-sm btn-green" onclick="saveSession()">Save workout</button>
      </div>
    </div>`;

  renderExerciseRows(lastSession);
  updateSessionStatus();
  startDurationTimer();
}

function startDayRename(dayIdx){
  const wrap=document.querySelector('.detail-title-wrap');
  if(!wrap) return;
  const cur=(getActiveDay(dayIdx)||DAYS[dayIdx]||{}).name||'';
  wrap.outerHTML=`<input class="detail-title-input" id="day-rename-input"
    value="${cur.replace(/"/g,'&quot;')}"
    onblur="commitDayRename(this,${dayIdx})"
    onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape'){this._cancel=true;this.blur()}">`;
  const inp=document.getElementById('day-rename-input');
  if(inp){inp.focus();inp.select();}
}

function commitDayRename(inp,dayIdx){
  if(inp._cancel){renderDetail();return;}
  const name=inp.value.trim();
  if(!name){renderDetail();return;}
  const base=getCustomDay(dayIdx)||{...(getActiveDay(dayIdx)||DAYS[dayIdx]||{})};
  setCustomDay(dayIdx,{...base, name, short:name.length>12?name.slice(0,11)+'…':name});
  renderWeekGrid();renderDetail();
}

function startDurationTimer(){
  clearInterval(_durationTimer);
  const el=document.getElementById('session-timer');
  if(!el||!draftSession||draftSession.savedAt) return;
  const update=()=>{
    if(!draftSession?.startedAt){el.textContent='';return}
    const mins=Math.round((Date.now()-draftSession.startedAt)/60000);
    el.textContent=mins>0?`⏱ ${mins} min`:'';
  };
  update();
  _durationTimer=setInterval(update,30000);
}

function buildMuscleRecovery(){
  const recovery={};
  const today=new Date(TODAY+'T00:00:00');
  loadSessions().filter(s=>s.date<TODAY).forEach(s=>{
    s.exercises.forEach(ex=>{
      const m=getExerciseMuscle(ex.name);
      if(m&&(!recovery[m]||s.date>recovery[m])) recovery[m]=s.date;
    });
  });
  const days={};
  Object.entries(recovery).forEach(([m,d])=>{
    days[m]=Math.round((today-new Date(d+'T00:00:00'))/(86400000));
  });
  return days;
}

function renderExerciseRows(lastSession){
  const tbody=document.getElementById('ex-tbody'); tbody.innerHTML='';
  const day=getActiveDay(activeDayIdx)||DAYS[activeDayIdx];
  const allPRs=calcPRs(loadSessions());
  const sessions=loadSessions();
  const goal=getGoal();
  const goalExtras=GOAL_EXERCISES[goal]||[];
  const planTag=GOAL_PLAN_TAG[goal]||'';
  const useStructure=sessions.length===0||getDaysPerWeek()<7;
  const recovery=buildMuscleRecovery();

  draftSession.exercises.forEach((ex,ei)=>{
    const isGoalEx=!!ex.goalAdded;
    const isCustom=!!ex.custom;
    const planEx=isGoalEx
      ? goalExtras.find(g=>g.name===ex.name)||{plan:'',structure:'',note:''}
      : isCustom
        ? {plan:'',structure:'',note:''}
        : (day&&day.exercises.find(e=>e.name===ex.name))||{plan:'',structure:'',note:''};

    const displayPlan=(useStructure||!planEx.plan)
      ?(planEx.structure||planEx.plan||'')
      :planEx.plan;

    const lastEx=lastSession?lastSession.exercises.find(e=>e.name===ex.name):null;
    let lastHTML='<span style="font-size:11px;color:var(--text3)">—</span>';
    let overloadHint='';
    if(lastEx&&lastEx.sets.length){
      const chips=lastEx.sets.filter(s=>s.done||(s.weight||s.reps)).map(s=>{
        const isPR=allPRs[ex.name]&&parseFloat(s.weight)>=allPRs[ex.name].weight&&s.done;
        return`<span class="lsc${isPR?' pr':''}">${s.weight||'?'}×${s.reps||'?'}${isPR?' 🏆':''}</span>`;
      }).join('');
      if(chips) lastHTML=`<div class="last-set-row">${chips}</div>`;
      const doneSets=lastEx.sets.filter(s=>s.done&&parseFloat(s.weight)>0);
      if(doneSets.length){
        const bestW=Math.max(...doneSets.map(s=>parseFloat(s.weight)));
        const inc=getWeightUnit()==='kg'?2.5:5;
        overloadHint=`<span class="overload-hint">↑ Try ${bestW+inc} ${getWeightUnit()}</span>`;
      }
    }

    const goalTag=isGoalEx
      ?`<span style="font-size:10px;color:var(--accent);margin-top:3px;display:block">${GOALS.find(g=>g.id===goal)?.icon||''} Goal exercise</span>`
      :planTag;

    const safeName=ex.name.replace(/'/g,"\\'");
    const tr=document.createElement('tr');
    tr.className='ex-row'+(isGoalEx?' goal-ex-row':'')+(isCustom?' custom-ex-row':'');
    const ytQ=encodeURIComponent(ex.name+' exercise form');
    const muscle=getExerciseMuscle(ex.name);
    const muscleColor=MUSCLE_COLORS[muscle]||'#555';
    const daysSince=muscle!==null?recovery[muscle]:undefined;
    const recColor=daysSince===undefined?null:daysSince<=1?'#e05555':daysSince===2?'var(--amber)':'var(--green)';
    const recDot=recColor?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${recColor};margin-left:3px;vertical-align:middle" title="${daysSince===0?'Trained today':daysSince===1?'Trained yesterday':`${daysSince}d ago`}"></span>`:'';
    const swapTag=(!isCustom&&muscle)
      ?`<button class="ex-muscle-swap-btn" style="background:${muscleColor}" onclick="openSwapModal(${ei})" title="Tap to swap with another ${muscle} exercise">${muscle} ⇄${recDot}</button>`
      :(muscle?`<span class="ex-muscle-tag" style="background:${muscleColor}">${muscle}${recDot}</span>`:'');
    tr.innerHTML=`
      <td class="ex-name-cell">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px">
          <div>
            <span ${isGoalEx?'style="color:var(--accent)"':isCustom?'style="color:var(--text2);font-style:italic"':''}>${ex.name}${isCustom?' <span style="font-size:10px;color:var(--text3)">(added)</span>':''}</span>
            <div class="ex-action-row">
              ${swapTag}
              <a href="https://www.youtube.com/shorts?search_query=${ytQ}" target="_blank" rel="noopener" class="yt-demo-link">▶ Demo</a>
              <button class="yt-demo-link" style="background:none;border:none;cursor:pointer;padding:0" onclick="openProgressModal('${safeName}')" title="View progress chart">📈</button>
            </div>
          </div>
          ${isCustom
            ?`<button class="ex-skip-btn" onclick="removeCustomExercise(${ei})" title="Remove from today">✕</button>`
            :`<button class="ex-skip-btn" onclick="skipExercise('${safeName}')" title="Hide from all workouts">Skip</button>`
          }
        </div>
      </td>
      <td class="ex-plan-cell">${displayPlan}<br><span style="font-size:11px;color:var(--text3)">${planEx.note||''}</span>${goalTag}</td>
      <td class="ex-last-cell">${lastHTML}${overloadHint}</td>
      <td class="ex-log-cell">
        <div class="sets-container" id="sets-${ei}"></div>
        <button class="add-set-btn" onclick="addSet(${ei})">+ add set</button>
      </td>`;
    tbody.appendChild(tr);
    renderSets(ei);
  });
}

function renderSets(ei){
  const container=document.getElementById('sets-'+ei); if(!container) return;
  container.innerHTML='';
  const sets=draftSession.exercises[ei].sets;
  sets.forEach((set,si)=>{
    const row=document.createElement('div'); row.className='set-row';
    row.innerHTML=`
      <span class="set-label">S${si+1}</span>
      <input class="set-input" type="text" inputmode="decimal" placeholder="${getWeightUnit()}"
        value="${set.weight}" oninput="updateSet(${ei},${si},'weight',this.value)">
      <span class="set-x">×</span>
      <input class="set-input" type="text" inputmode="numeric" placeholder="reps"
        value="${set.reps}" oninput="updateSet(${ei},${si},'reps',this.value)">
      <div class="set-done ${set.done?'checked':''}" onclick="toggleSetDone(${ei},${si})">
        ${set.done?'✓':''}
      </div>
      ${sets.length>1?`<span class="add-set-btn" onclick="removeSet(${ei},${si})" style="color:var(--red);font-size:14px;padding:0 2px">×</span>`:''}`;
    container.appendChild(row);
  });
}

function _markModified(){ delete draftSession.savedAt; }
function updateSet(ei,si,field,val){
  draftSession.exercises[ei].sets[si][field]=val; _markModified();
  saveDraft(activeDate,draftSession); updateSessionStatus();
}
function toggleSetDone(ei,si){
  draftSession.exercises[ei].sets[si].done=!draftSession.exercises[ei].sets[si].done; _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus();
}
function addSet(ei){
  draftSession.exercises[ei].sets.push({reps:'',weight:'',done:false}); _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus();
}
function removeSet(ei,si){
  draftSession.exercises[ei].sets.splice(si,1); _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus();
}
function skipExercise(name){
  toggleDisliked(name); _markModified();
  draftSession.exercises=draftSession.exercises.filter(ex=>ex.name!==name);
  saveDraft(activeDate,draftSession);
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
}
function removeCustomExercise(ei){
  draftSession.exercises.splice(ei,1); _markModified();
  saveDraft(activeDate,draftSession);
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
}
function submitAddEx(){
  const inp=document.getElementById('add-ex-input'); if(!inp||!inp.value.trim()) return;
  draftSession.exercises.push({name:inp.value.trim(),sets:[{reps:'',weight:'',done:false}],custom:true}); _markModified();
  saveDraft(activeDate,draftSession); inp.value='';
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
  setTimeout(()=>{ const rows=document.querySelectorAll('.ex-row'); if(rows.length) rows[rows.length-1].scrollIntoView({behavior:'smooth',block:'nearest'}); },50);
}
function _lastSavedSession(){
  const s=loadSessions().filter(s=>s.dayIdx===activeDayIdx);
  return s.length?s[s.length-1]:null;
}
function updateSessionStatus(){
  const el=document.getElementById('session-status'); if(!el) return;
  if(draftSession.savedAt){
    const t=new Date(draftSession.savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    el.textContent=`✓ Saved at ${t}`; el.style.color='var(--green)'; return;
  }
  const total=draftSession.exercises.reduce((a,e)=>a+e.sets.length,0);
  const done=draftSession.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  el.textContent=done===0?'Draft — not saved':`${done} / ${total} sets completed · not saved`;
  el.style.color='';
}
function saveSession(){
  clearInterval(_durationTimer);
  const prevPRs=calcPRs(loadSessions());
  const sessions=loadSessions();
  const session=JSON.parse(JSON.stringify(draftSession));
  session.id=Date.now();
  session.endedAt=Date.now();
  session.duration=session.startedAt?Math.round((session.endedAt-session.startedAt)/60000):null;
  sessions.push(session); saveSessions(sessions);
  draftSession.savedAt=Date.now();
  saveDraft(activeDate,draftSession);
  renderWeekGrid(); renderExerciseRows(session); updateSessionStatus();
  showCompletionSummary(session,prevPRs);
}

function showCompletionSummary(session,prevPRs){
  const doneSets=session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  if(doneSets===0) return; // nothing completed, skip the summary
  const totalSets=session.exercises.reduce((a,e)=>a+e.sets.length,0);
  const volume=session.exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>{
    if(!s.done) return b;
    return b+(parseFloat(s.weight)||0)*(parseFloat(s.reps)||0);
  },0),0);
  const newPRs=[];
  session.exercises.forEach(ex=>{
    let bestW=0,bestReps=0;
    ex.sets.forEach(s=>{
      if(!s.done||!s.weight) return;
      const w=parseFloat(s.weight);
      if(w>bestW){bestW=w;bestReps=parseInt(s.reps)||0;}
    });
    if(bestW>0&&bestW>(prevPRs[ex.name]?.weight||0))
      newPRs.push({name:ex.name,weight:bestW,reps:bestReps});
  });
  const day=getActiveDay(session.dayIdx)||{name:'Workout'};
  const prsHTML=newPRs.length
    ?`<div class="completion-prs"><div style="font-size:12px;font-weight:600;color:var(--amber);margin-bottom:5px">New PRs 🏆</div>${newPRs.map(p=>`<div class="completion-pr-chip">${p.name} — ${p.weight} ${getWeightUnit()} × ${p.reps}</div>`).join('')}</div>`
    :'';
  document.getElementById('completion-content').innerHTML=`
    <div style="font-size:44px;margin-bottom:6px">${newPRs.length?'🏆':'✅'}</div>
    <div style="font-size:17px;font-weight:700;margin-bottom:3px">${day.name} Done!</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${new Date().toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})}</div>
    <div class="completion-stats">
      <div><div class="completion-stat-val">${doneSets}/${totalSets}</div><div class="completion-stat-lbl">Sets Done</div></div>
      ${volume>0?`<div><div class="completion-stat-val">${volume.toLocaleString()}</div><div class="completion-stat-lbl">${getWeightUnit()} Vol</div></div>`:''}
      ${session.duration>0?`<div><div class="completion-stat-val">${session.duration}</div><div class="completion-stat-lbl">Min</div></div>`:''}
    </div>
    ${prsHTML}`;
  document.getElementById('completion-modal').style.display='flex';
}
function closeCompletionModal(){
  document.getElementById('completion-modal').style.display='none';
}
function discardDraft(){
  if(!confirm('Reset this workout log and start fresh?')) return;
  clearDraft(activeDate); draftSession=initDraft(activeDayIdx,activeDate); renderDetail();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard(){
  const sessions=loadSessions();
  const stats=calcStats(sessions);
  const weeks=calcWeeklyData(sessions,8);
  const prs=calcPRs(sessions);
  const bwEntries=loadBW();
  const maxCount=Math.max(...weeks.map(w=>w.count),1);
  const maxVol=Math.max(...weeks.map(w=>w.vol),1);

  // Frequency bars
  const barsHTML=weeks.map((w,i)=>{
    const h=Math.round((w.count/maxCount)*56);
    const isNow=i===weeks.length-1;
    return`<div class="freq-col">
      <div class="freq-count">${w.count>0?w.count:''}</div>
      <div class="freq-bar ${w.count>0?'has-data':''} ${isNow?'current-week':''}" style="height:${w.count>0?Math.max(h,4):0}px"></div>
    </div>`;
  }).join('');
  const labelsHTML=weeks.map(w=>`<div class="freq-label">${w.label}</div>`).join('');

  // Volume SVG line chart
  const volSVG=renderVolumeSVG(weeks);

  // PRs table — grouped by muscle, with 1RM + chart link
  const unit=getWeightUnit();
  const prEntries=Object.entries(prs).map(([name,pr])=>{
    const e1rm=Math.round(parseFloat(pr.weight)*(1+(parseInt(pr.reps)||0)/30)*4)/4;
    return{name, ...pr, e1rm, muscle:getExerciseMuscle(name)||'Other'};
  }).sort((a,b)=>b.e1rm-a.e1rm);
  const muscleGroups=[...new Set(prEntries.map(e=>e.muscle))].sort();
  const prsHTML=prEntries.length===0
    ?'<div class="empty-state" style="padding:24px">No PRs yet — mark sets ✓ while logging.</div>'
    :muscleGroups.map(mg=>{
      const rows=prEntries.filter(e=>e.muscle===mg);
      return`<div class="pr-group">
        <div class="pr-group-label">${mg}</div>
        <table class="pr-table"><thead><tr><th>Exercise</th><th>Best Set</th><th>Est. 1RM</th><th>Date</th><th></th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td><button class="pr-ex-link" onclick="openProgressModal('${r.name.replace(/'/g,"\\'")}')"><strong>${r.name}</strong></button></td>
          <td class="pr-weight">${r.weight} ${unit} × ${r.reps||'—'}</td>
          <td class="pr-orm">${r.e1rm} ${unit}</td>
          <td style="color:var(--text3);font-size:11px">${formatDateShort(r.date)}</td>
          <td><button class="pr-chart-btn" onclick="openProgressModal('${r.name.replace(/'/g,"\\'")}')">📈</button></td>
        </tr>`).join('')}</tbody></table>
      </div>`;
    }).join('');

  // Body weight section
  const latestBW=bwEntries.length?bwEntries[bwEntries.length-1]:null;
  const bwChips=bwEntries.slice(-12).reverse().map((e,i)=>
    `<span class="bw-chip ${i===0?'latest':''}">${e.weight} ${getWeightUnit()} <span style="color:var(--text3);font-size:10px">${formatDateShort(e.date)}</span></span>`
  ).join('');
  const bwSVG=bwEntries.length>=2?renderBWSVG(bwEntries.slice(-12)):'';

  const goal=getGoal(); const goalObj=GOALS.find(g=>g.id===goal);
  const nextIdx=getNextSuggestedDayIdx(); const nextDay=getActiveDay(nextIdx)||DAYS[nextIdx]||DAYS[0];
  const goalTips={
    muscle:'Focus on progressive overload — aim to add weight or reps every session.',
    fat_loss:'Keep rest periods under 60s and hit your cardio on off-days.',
    cardio:'Prioritise Active Recovery days and add 20 min steady-state cardio post-session.',
    general:'Follow the rotation consistently — showing up beats any perfect plan.'
  };

  document.getElementById('dash-content').innerHTML=`
    <div class="dash-section-title">Overview — ${getActiveProfile()}</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Sessions</div></div>
      <div class="stat-card"><div class="stat-value">${stats.thisWeek}</div><div class="stat-label">This Week</div></div>
      <div class="stat-card"><div class="stat-value">${stats.weekStreak}</div><div class="stat-label">Week Streak</div>
        <div class="stat-sub">${stats.weekStreak>0?'🔥 Keep it up!':'Log to start'}</div></div>
      <div class="stat-card"><div class="stat-value">${stats.topDay}</div><div class="stat-label">Most Trained</div>
        <div class="stat-sub">${stats.topDayCount>0?stats.topDayCount+' sessions':''}</div></div>
    </div>

    <div class="dash-section-title">Goal & Next Up</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <div class="stat-card" style="flex:1;min-width:180px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Your Goal</div>
          <button class="btn btn-sm" onclick="openGoalModal()" style="font-size:11px;padding:2px 7px">Change</button>
        </div>
        ${goalObj
          ?`<div style="font-size:20px;margin-bottom:4px">${goalObj.icon}</div>
             <div style="font-size:14px;font-weight:600">${goalObj.label}</div>
             <div style="font-size:11px;color:var(--text2);margin-top:4px;line-height:1.5">${goalTips[goalObj.id]||''}</div>`
          :`<div style="font-size:12px;color:var(--text3)">No goal set.<br>
             <button class="btn btn-sm" onclick="openGoalModal()" style="margin-top:8px">Set a goal →</button></div>`}
      </div>
      <div class="stat-card" style="flex:1;min-width:180px">
        <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Suggested Next</div>
        <div style="font-size:14px;font-weight:600">${nextDay.dow} — ${nextDay.name}</div>
        <div style="display:flex;gap:4px;margin-top:6px">${nextDay.dots.map(c=>`<div class="dot" style="background:${c};width:8px;height:8px"></div>`).join('')}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:6px">${nextDay.tags.join(' · ')}</div>
        <button class="btn btn-sm btn-green" onclick="jumpToNextSuggested()" style="margin-top:10px;font-size:11px">Go to this workout →</button>
      </div>
    </div>

    <div class="dash-section-title">Weekly Sessions — Last 8 Weeks</div>
    <div class="chart-wrap">
      <div class="freq-bars">${barsHTML}</div>
      <div class="freq-labels">${labelsHTML}</div>
    </div>

    <div class="dash-section-title">Weekly Volume — Last 8 Weeks <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3);font-size:10px">(${getWeightUnit()} × reps, completed sets)</span></div>
    <div class="chart-wrap">${volSVG}</div>

    <div class="dash-section-title">Body Weight</div>
    <div class="chart-wrap">
      <div class="bw-row">
        <span style="font-size:13px;color:var(--text2)">${latestBW?`<strong style="color:var(--text)">${latestBW.weight} ${getWeightUnit()}</strong> · ${formatDateShort(latestBW.date)}`:'No entries yet'}</span>
        <button class="btn btn-sm" onclick="openBWModal()">+ Log weight</button>
      </div>
      ${bwSVG}
      ${bwEntries.length?`<div class="bw-chips">${bwChips}</div>`:''}
    </div>

    <div class="dash-section-title">Personal Records</div>
    ${prsHTML}`;
}

function renderVolumeSVG(weeks){
  const W=400,H=70,PAD=8;
  const maxVol=Math.max(...weeks.map(w=>w.vol),1);
  const pts=weeks.map((w,i)=>({
    x:PAD+(i/(weeks.length-1||1))*(W-2*PAD),
    y:H-PAD-(w.vol/maxVol)*(H-2*PAD),
    vol:w.vol,label:w.label
  }));
  const path=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area=`${pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const dots=pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${p.vol>0?'#e07b39':'#444'}"><title>${p.label}: ${p.vol.toLocaleString()} ${getWeightUnit()} vol</title></circle>`).join('');
  const labels=pts.map(p=>`<text x="${p.x.toFixed(1)}" y="${H+12}" text-anchor="middle" font-size="9" fill="var(--text3)">${p.label}</text>`).join('');
  return`<svg viewBox="0 0 ${W} ${H+16}" style="width:100%;height:86px">
    <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e07b39" stop-opacity=".25"/><stop offset="100%" stop-color="#e07b39" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#vg)"/>
    <path d="${path}" fill="none" stroke="#e07b39" stroke-width="2" stroke-opacity=".8"/>
    ${dots}${labels}
  </svg>`;
}

function renderBWSVG(entries){
  if(entries.length<2) return '';
  const W=400,H=60,PAD=8;
  const weights=entries.map(e=>e.weight);
  const minW=Math.min(...weights),maxW=Math.max(...weights);
  const range=maxW-minW||1;
  const pts=entries.map((e,i)=>({
    x:PAD+(i/(entries.length-1))*(W-2*PAD),
    y:H-PAD-((e.weight-minW)/range)*(H-2*PAD)
  }));
  const path=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dots=pts.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${i===entries.length-1?'#e07b39':'#5b9bd5'}"><title>${entries[i].weight} ${getWeightUnit()} · ${entries[i].date}</title></circle>`).join('');
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:60px;margin-bottom:6px">
    <path d="${path}" fill="none" stroke="#5b9bd5" stroke-width="1.5" stroke-opacity=".7"/>
    ${dots}
  </svg>`;
}

function calcStats(sessions){
  const today=new Date().toISOString().slice(0,10);
  const weekAgo=new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const thisWeek=sessions.filter(s=>s.date>=weekAgo&&s.date<=today).length;
  // Week streak — consecutive Mon-Sun calendar weeks with ≥1 session
  const now=new Date();
  const dow=now.getDay(),toMon=dow===0?-6:1-dow;
  const curMon=new Date(now); curMon.setDate(now.getDate()+toMon); curMon.setHours(0,0,0,0);
  let weekStreak=0;
  const wk=new Date(curMon);
  while(true){
    const ws=wk.toISOString().slice(0,10);
    const we=new Date(wk); we.setDate(wk.getDate()+7);
    const weStr=we.toISOString().slice(0,10);
    if(!sessions.some(s=>s.date>=ws&&s.date<weStr)) break;
    weekStreak++;
    wk.setDate(wk.getDate()-7);
  }
  const activeDays=getActiveDays();
  const nBuckets=Math.max(7,activeDays.length);
  const dayCounts=Array(nBuckets).fill(0);
  sessions.forEach(s=>{if(s.dayIdx>=0&&s.dayIdx<nBuckets)dayCounts[s.dayIdx]++});
  const maxD=Math.max(...dayCounts),topIdx=dayCounts.indexOf(maxD);
  const topDayObj=maxD>0?(activeDays[topIdx]||DAYS[topIdx]||null):null;
  return{total:sessions.length,thisWeek,weekStreak,topDay:topDayObj?topDayObj.dow:'—',topDayCount:maxD};
}

function calcWeeklyData(sessions,numWeeks){
  const now=new Date(),dow=now.getDay(),toMon=dow===0?-6:1-dow;
  const wsStart=new Date(now); wsStart.setDate(now.getDate()+toMon); wsStart.setHours(0,0,0,0);
  const weeks=[];
  for(let i=numWeeks-1;i>=0;i--){
    const ws=new Date(wsStart); ws.setDate(wsStart.getDate()-i*7);
    const we=new Date(ws); we.setDate(ws.getDate()+7);
    const wsStr=ws.toISOString().slice(0,10),weStr=we.toISOString().slice(0,10);
    let count=0,vol=0;
    sessions.forEach(s=>{
      if(s.date<wsStr||s.date>=weStr) return; count++;
      s.exercises.forEach(ex=>ex.sets.forEach(set=>{
        if(!set.done) return;
        vol+=(parseFloat(set.weight)||0)*(parseFloat(set.reps)||0);
      }));
    });
    weeks.push({label:(ws.getMonth()+1)+'/'+ws.getDate(),count,vol});
  }
  return weeks;
}

function calcPRs(sessions){
  const prs={};
  [...sessions].sort((a,b)=>a.date.localeCompare(b.date)).forEach(session=>{
    session.exercises.forEach(ex=>{
      ex.sets.forEach(set=>{
        if(!set.done) return;
        const w=parseFloat(set.weight); if(isNaN(w)||w<=0) return;
        if(!prs[ex.name]||w>prs[ex.name].weight)
          prs[ex.name]={weight:w,reps:set.reps,date:session.date};
      });
    });
  });
  return prs;
}

// ── History ───────────────────────────────────────────────────────────────────
function populateHistoryFilters(){
  const sel=document.getElementById('hist-day-filter');
  sel.innerHTML='<option value="">All days</option>';
  getActiveDays().forEach((d,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${d.dow} — ${d.name}`;sel.appendChild(o)});
}

function renderHistory(){
  const list=document.getElementById('history-list');
  const dayFilter=document.getElementById('hist-day-filter').value;
  const sort=document.getElementById('hist-sort').value;
  let sessions=loadSessions();
  if(dayFilter!=='') sessions=sessions.filter(s=>String(s.dayIdx)===dayFilter);
  sessions=[...sessions].sort((a,b)=>sort==='desc'?new Date(b.date)-new Date(a.date):new Date(a.date)-new Date(b.date));
  if(!sessions.length){list.innerHTML='<div class="empty-state">No sessions logged yet.</div>';return}

  // Build PRs map for badge detection (by date order)
  const prByDate=buildPRsByDate(loadSessions());

  list.innerHTML='';
  sessions.forEach(session=>{
    const day=(session.dayIdx>=0?(getActiveDay(session.dayIdx)||DAYS[session.dayIdx]):null)||{dow:'?',name:'Unknown workout',dots:[],tags:[]};
    const div=document.createElement('div'); div.className='hist-session';
    const sessionPRs=prByDate[session.id]||{};
    div.innerHTML=`
      <div class="hist-session-header" onclick="toggleCollapse(this.parentElement)">
        <div>
          <div class="hist-session-title">${day.dow} — ${day.name}</div>
          <div class="hist-session-date">${formatDate(session.date)}${session.duration?` · ${session.duration} min`:''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="hist-session-date">${countDoneSets(session)} sets done</span>
          <button class="hist-share-btn" onclick="event.stopPropagation();shareSession(${session.id})">📋 Copy</button>
          <button class="hist-del-btn" onclick="event.stopPropagation();deleteSession(${session.id})">Delete</button>
          <span class="collapse-icon">▼</span>
        </div>
      </div>
      <div class="hist-session-body">
        ${session.exercises.map(ex=>`
          <div class="hist-ex">
            <div class="hist-ex-name">${ex.name}</div>
            <div class="hist-sets">
              ${ex.sets.map((s,i)=>{
                const isPR=sessionPRs[ex.name]&&parseFloat(s.weight)>=sessionPRs[ex.name]&&s.done;
                return`<span class="hist-set-chip ${s.done?'done':''} ${isPR?'pr':''}">
                  S${i+1} ${s.weight?s.weight+getWeightUnit():'—'} × ${s.reps||'—'}${isPR?' 🏆':''}
                </span>`;
              }).join('')}
            </div>
          </div>`).join('')}
        ${session.notes?`<div class="hist-notes" style="padding:8px 14px">${session.notes}</div>`:''}
      </div>`;
    list.appendChild(div);
  });
}

// ── Exercise progress chart ───────────────────────────────────────────────────
function getExerciseHistory(name){
  return loadSessions()
    .filter(s=>s.exercises.some(e=>e.name===name))
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(s=>{
      const ex=s.exercises.find(e=>e.name===name);
      const done=ex.sets.filter(set=>set.done&&parseFloat(set.weight)>0);
      if(!done.length) return null;
      const bestWeight=Math.max(...done.map(set=>parseFloat(set.weight)));
      const bestSet=done.find(set=>parseFloat(set.weight)===bestWeight);
      const volume=done.reduce((sum,set)=>sum+parseFloat(set.weight)*(parseInt(set.reps)||0),0);
      const e1rm=bestSet?Math.round(bestWeight*(1+(parseInt(bestSet.reps)||0)/30)*4)/4:0;
      return{date:s.date, bestWeight, reps:parseInt(bestSet?.reps)||0, volume, e1rm};
    })
    .filter(Boolean);
}

function renderExerciseProgressSVG(history){
  if(history.length<2) return '<p style="text-align:center;color:var(--text3);padding:24px 0;font-size:13px">Log at least 2 sessions to see progress.</p>';
  const W=500,H=100,PAD=14,LH=16;
  const weights=history.map(h=>h.bestWeight);
  const minW=Math.min(...weights), maxW=Math.max(...weights), range=maxW-minW||1;
  const pts=history.map((h,i)=>({
    x:PAD+(i/(history.length-1||1))*(W-2*PAD),
    y:H-PAD-((h.bestWeight-minW)/range)*(H-2*PAD),
    ...h
  }));
  const linePath=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath=linePath+` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const step=Math.ceil(history.length/7);
  const labels=pts.filter((_,i)=>i%step===0||i===pts.length-1)
    .map(p=>`<text x="${p.x.toFixed(1)}" y="${H+LH-2}" text-anchor="middle" font-size="9" fill="var(--text3)">${fmtShort(p.date)}</text>`).join('');
  const dots=pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.bestWeight===maxW?4.5:3}" fill="${p.bestWeight===maxW?'var(--green)':'var(--accent)'}"><title>${formatDateShort(p.date)}: ${p.bestWeight}${getWeightUnit()} × ${p.reps}</title></circle>`).join('');
  return`<svg viewBox="0 0 ${W} ${H+LH}" style="width:100%;max-height:116px">
    <defs><linearGradient id="epg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--green)" stop-opacity=".3"/><stop offset="100%" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>
    <path d="${areaPath}" fill="url(#epg)"/>
    <path d="${linePath}" fill="none" stroke="var(--green)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${labels}
  </svg>`;
}

function openProgressModal(name){
  const history=getExerciseHistory(name);
  const pr=calcPRs(loadSessions())[name];
  const e1rm=pr?Math.round(parseFloat(pr.weight)*(1+(parseInt(pr.reps)||0)/30)*4)/4:null;
  const unit=getWeightUnit();
  document.getElementById('progress-modal-title').textContent=name;
  document.getElementById('progress-modal-body').innerHTML=`
    <div class="prog-stats">
      <div class="prog-stat"><div class="prog-stat-val">${pr?pr.weight+' '+unit:'—'}</div><div class="prog-stat-lbl">Best Set</div></div>
      <div class="prog-stat"><div class="prog-stat-val">${e1rm?e1rm+' '+unit:'—'}</div><div class="prog-stat-lbl">Est. 1RM</div></div>
      <div class="prog-stat"><div class="prog-stat-val">${history.length}</div><div class="prog-stat-lbl">Sessions</div></div>
      <div class="prog-stat"><div class="prog-stat-val">${history.length?formatDateShort(history[0].date):'—'}</div><div class="prog-stat-lbl">First Logged</div></div>
    </div>
    <div class="prog-chart">${renderExerciseProgressSVG(history)}</div>
    ${history.length>=2?`<p style="font-size:10px;color:var(--text3);text-align:center;margin-top:6px">Green dot = all-time best · Orange = other sessions</p>`:''}`;
  document.getElementById('progress-modal').style.display='flex';
}

function closeProgressModal(){
  document.getElementById('progress-modal').style.display='none';
}

function buildPRsByDate(allSessions){
  // Returns {sessionId: {exerciseName: bestWeightAtThatSession}}
  const sorted=[...allSessions].sort((a,b)=>a.date.localeCompare(b.date));
  const running={};
  const result={};
  sorted.forEach(session=>{
    const newPRs={};
    session.exercises.forEach(ex=>{
      ex.sets.forEach(set=>{
        if(!set.done) return;
        const w=parseFloat(set.weight); if(isNaN(w)||w<=0) return;
        if(!running[ex.name]||w>running[ex.name]){
          running[ex.name]=w; newPRs[ex.name]=w;
        }
      });
    });
    if(Object.keys(newPRs).length) result[session.id]=newPRs;
  });
  return result;
}

function toggleCollapse(el){
  el.classList.toggle('collapsed');
  el.querySelector('.collapse-icon').textContent=el.classList.contains('collapsed')?'▶':'▼';
}
function deleteSession(id){
  if(!confirm('Delete this session?')) return;
  saveSessions(loadSessions().filter(s=>s.id!==id));
  renderWeekGrid(); renderHistory();
}
function countDoneSets(session){ return session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0) }

function shareSession(id){
  const session=loadSessions().find(s=>s.id===id); if(!session) return;
  const day=(session.dayIdx>=0?(getActiveDay(session.dayIdx)||DAYS[session.dayIdx]):null)||{dow:'?',name:'Workout'};
  let text=`${day.dow} — ${day.name} (${formatDate(session.date)})\n\n`;
  session.exercises.forEach(ex=>{
    text+=`${ex.name}:\n`;
    ex.sets.forEach((s,i)=>{
      text+=`  S${i+1}: ${s.weight||'—'} ${getWeightUnit()} × ${s.reps||'—'} reps${s.done?' ✓':''}\n`;
    });
    text+='\n';
  });
  if(session.notes) text+=`Notes: ${session.notes}\n`;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.querySelector(`[onclick="event.stopPropagation();shareSession(${id})"]`);
    if(btn){const orig=btn.textContent;btn.textContent='✓ Copied!';setTimeout(()=>btn.textContent=orig,2000)}
  }).catch(()=>prompt('Copy this summary:',text));
}

// ── Export / Import ───────────────────────────────────────────────────────────
function exportCSV(){
  const sessions=loadSessions(); if(!sessions.length){alert('No sessions to export.');return}
  const rows=[['Date','Day','Exercise','Set',`Weight (${getWeightUnit()})`,'Reps','Completed','Session Notes']];
  sessions.forEach(s=>{
    const day=(s.dayIdx>=0?(getActiveDay(s.dayIdx)||DAYS[s.dayIdx]):null)||{name:'Unknown'};
    s.exercises.forEach(ex=>{
      ex.sets.forEach((set,si)=>{
        rows.push([s.date,day.name,ex.name,si+1,set.weight,set.reps,set.done?'Yes':'No',s.notes||'']);
      });
    });
  });
  const csv=rows.map(r=>r.map(v=>'"'+(String(v).replace(/"/g,'""'))+'"').join(',')).join('\n');
  downloadFile('workout-data.csv','text/csv',csv);
}

function exportJSON(){
  const profile=getActiveProfile();
  const data={
    version:2,
    exportDate:new Date().toISOString().slice(0,10),
    profile,
    goal:getGoal(),
    dpw:getDaysPerWeek(),
    sessions:loadSessions(),
    bodyWeight:loadBW(),
  };
  downloadFile(`strengthos-${profile}-${data.exportDate}.json`,'application/json',JSON.stringify(data,null,2));
}

function downloadFile(filename,type,content){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}

let _importParsed=null;

function openImportModal(){
  _importParsed=null;
  document.getElementById('import-file').value='';
  document.getElementById('import-preview').innerHTML='';
  document.getElementById('import-preview').style.display='none';
  document.getElementById('import-confirm-row').style.display='none';
  document.getElementById('import-modal').style.display='flex';
}
function closeImportModal(){ document.getElementById('import-modal').style.display='none'; _importParsed=null; }

function onImportFileChange(){
  const file=document.getElementById('import-file').files[0];
  const preview=document.getElementById('import-preview');
  const confirmRow=document.getElementById('import-confirm-row');
  preview.innerHTML=''; preview.style.display='none'; confirmRow.style.display='none'; _importParsed=null;
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const raw=JSON.parse(e.target.result);
      // Accept: raw sessions array OR {sessions:[...]} backup envelope
      const sessions=Array.isArray(raw)?raw:(Array.isArray(raw.sessions)?raw.sessions:null);
      if(!sessions||!sessions.length) throw new Error('No sessions found in file');
      const valid=sessions.filter(s=>s&&s.date&&Array.isArray(s.exercises));
      if(!valid.length) throw new Error('Sessions missing required fields');
      const dates=valid.map(s=>s.date).sort();
      const bw=Array.isArray(raw.bodyWeight)?raw.bodyWeight:[];
      _importParsed={sessions:valid, bodyWeight:bw, goal:raw.goal||null, dpw:raw.dpw||null};
      preview.innerHTML=`
        <div class="import-preview-row"><span class="import-preview-key">Sessions found</span><strong>${valid.length}</strong></div>
        <div class="import-preview-row"><span class="import-preview-key">Date range</span><strong>${formatDateShort(dates[0])} → ${formatDateShort(dates[dates.length-1])}</strong></div>
        ${bw.length?`<div class="import-preview-row"><span class="import-preview-key">Body weight entries</span><strong>${bw.length}</strong></div>`:''}
        ${_importParsed.goal?`<div class="import-preview-row"><span class="import-preview-key">Goal</span><strong>${_importParsed.goal}</strong></div>`:''}`;
      preview.style.display='block'; confirmRow.style.display='flex';
    }catch(err){
      preview.innerHTML=`<span style="color:var(--red);font-size:12px">Could not read file: ${err.message}</span>`;
      preview.style.display='block';
    }
  };
  reader.readAsText(file);
}

function doImport(mode){
  if(!_importParsed){return}
  const {sessions:incoming, bodyWeight:bw, goal, dpw}=_importParsed;
  if(mode==='replace'){
    saveSessions(incoming.sort((a,b)=>a.date.localeCompare(b.date)));
  } else {
    const existing=loadSessions();
    const existingIds=new Set(existing.map(s=>s.id));
    const merged=[...existing,...incoming.filter(s=>!existingIds.has(s.id))];
    saveSessions(merged.sort((a,b)=>a.date.localeCompare(b.date)));
  }
  if(bw.length){
    if(mode==='replace'){
      saveBW2(bw.sort((a,b)=>a.date.localeCompare(b.date)));
    } else {
      const existingBW=loadBW(), existingDates=new Set(existingBW.map(b=>b.date));
      saveBW2([...existingBW,...bw.filter(b=>!existingDates.has(b.date))].sort((a,b)=>a.date.localeCompare(b.date)));
    }
  }
  if(goal) setGoal(goal);
  if(dpw) setDaysPerWeek(parseInt(dpw,10));
  closeImportModal();
  renderWeekGrid(); populateHistoryFilters();
  const v=currentView();
  if(v==='history') renderHistory();
  if(v==='dashboard') renderDashboard();
}

// ── Schedule editor modal ─────────────────────────────────────────────────────
let _schedChanges={};

function openScheduleModal(){
  _schedChanges={};
  renderScheduleModal();
  document.getElementById('schedule-modal').style.display='flex';
}
function closeScheduleModal(){ document.getElementById('schedule-modal').style.display='none' }

function renderScheduleModal(){
  const dates=getWeekDates(weekOffset);
  const activeDays=getActiveDays();
  const dowNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  document.getElementById('sched-rows').innerHTML=dates.map((date,i)=>{
    const current=_schedChanges[date]!==undefined?_schedChanges[date]:getWorkoutForDate(date);
    const [,m,d]=date.split('-');
    const opts=[`<option value="${REST_DAY}"${current===REST_DAY?' selected':''}>Rest / Off</option>`]
      .concat(activeDays.map((day,idx)=>`<option value="${idx}"${current===idx?' selected':''}>${day.dow} — ${day.name}</option>`))
      .join('');
    return`<div class="sched-row">
      <span class="sched-dow">${dowNames[i]}</span>
      <span class="sched-date">${+m}/${+d}</span>
      <select class="sched-sel" data-date="${date}" onchange="schedChange('${date}',this.value)">${opts}</select>
    </div>`;
  }).join('');
}

function schedChange(date,val){ _schedChanges[date]=parseInt(val,10) }

function applyScheduleChanges(){
  Object.entries(_schedChanges).forEach(([date,idx])=>setWorkoutForDate(date,idx));
  closeScheduleModal();
  setActiveDate(activeDate);
  renderWeekGrid();
  renderDetail();
}

function resetScheduleToDefault(){
  const sched=loadSchedule();
  getWeekDates(weekOffset).forEach(date=>delete sched[date]);
  saveSchedule(sched);
  _schedChanges={};
  closeScheduleModal();
  setActiveDate(activeDate);
  renderWeekGrid();
  renderDetail();
}

// ── View switcher ─────────────────────────────────────────────────────────────
function currentView(){
  if(document.getElementById('dashboard-view').style.display!=='none') return 'dashboard';
  if(document.getElementById('history-view').style.display!=='none') return 'history';
  return 'log';
}
function showView(view){
  document.getElementById('log-view').style.display=view==='log'?'block':'none';
  document.getElementById('dashboard-view').style.display=view==='dashboard'?'block':'none';
  document.getElementById('history-view').style.display=view==='history'?'block':'none';
  document.getElementById('btn-log').classList.toggle('active',view==='log');
  document.getElementById('btn-dash').classList.toggle('active',view==='dashboard');
  document.getElementById('btn-hist').classList.toggle('active',view==='history');
  if(view==='history') renderHistory();
  if(view==='dashboard') renderDashboard();
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatDate(iso){
  const[y,m,d]=iso.split('-');
  return new Date(+y,+m-1,+d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
}
function formatDateShort(iso){
  const[y,m,d]=iso.split('-');
  return new Date(+y,+m-1,+d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function fmtShort(iso){
  const[,m,d]=iso.split('-'); return +m+'/'+d;
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initApp(){
  initProfiles();
  setActiveDate(TODAY);
  renderProfileSelector();
  populateHistoryFilters();
  document.getElementById('deload-banner').style.display=isDeload()?'':'none';
  renderWeekGrid();
  renderDetail();
}

initTheme();
if(needsOnboarding()){
  showOnboarding();
} else {
  localStorage.setItem('wt_onboarded','1');
  initApp();
}

document.addEventListener('click',e=>{
  const sel=document.getElementById('profile-selector');
  if(!sel.contains(e.target)) closeProfileDropdown();
});