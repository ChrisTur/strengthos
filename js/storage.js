// ── Storage keys ──────────────────────────────────────────────────────────────
const PROFILES_KEY    = 'wt_profiles';
const ACTIVE_PROF_KEY = 'wt_active_profile';
const LEGACY_KEY      = 'wt_sessions_v2';
function sessionKey(n){ return 'wt_sessions_v2_'+n }
function draftKey(date,n){ return 'wt_draft_'+date+'_'+n }
function scheduleKey(n){ return 'wt_schedule_'+n }
function goalKey(n){ return 'wt_goal_'+n }
function noteKey(i,n) { return 'wt_note_'+i+'_'+n }
function deloadKey(n)      { return 'wt_deload_'+n }
function bwKey(n)          { return 'wt_bw_'+n }
function daysPerWeekKey(n) { return 'wt_dpw_'+n }
function cardioKey(n)      { return 'wt_cardio_'+n }
function dislikedKey(n)    { return 'wt_disliked_'+n }

function getCardioLevel(){ return localStorage.getItem(cardioKey(getActiveProfile()))||'moderate' }
function setCardioLevel(v){ localStorage.setItem(cardioKey(getActiveProfile()),v) }
function loadDisliked(){ try{return JSON.parse(localStorage.getItem(dislikedKey(getActiveProfile())))||[]}catch{return[]} }
function saveDisliked(arr){ localStorage.setItem(dislikedKey(getActiveProfile()),JSON.stringify(arr)) }
function isDisliked(name){ return loadDisliked().includes(name) }
function toggleDisliked(name){
  const d=loadDisliked(), i=d.indexOf(name);
  if(i>=0) d.splice(i,1); else d.push(name);
  saveDisliked(d);
  return d.includes(name);
}


// ── Profile helpers ───────────────────────────────────────────────────────────
function loadProfiles(){ try{return JSON.parse(localStorage.getItem(PROFILES_KEY))||[]}catch{return[]} }
function saveProfiles(p){ localStorage.setItem(PROFILES_KEY,JSON.stringify(p)) }
function getActiveProfile(){ return localStorage.getItem(ACTIVE_PROF_KEY)||'' }
function setActiveProfile(n){ localStorage.setItem(ACTIVE_PROF_KEY,n) }

function initProfiles(){
  let p=loadProfiles();
  if(!p.length){ p=['Me']; saveProfiles(p); setActiveProfile('Me');
    const leg=localStorage.getItem(LEGACY_KEY);
    if(leg) localStorage.setItem(sessionKey('Me'),leg); }
  if(!getActiveProfile()||!p.includes(getActiveProfile())) setActiveProfile(p[0]);
}

// ── Session storage ───────────────────────────────────────────────────────────
function loadSessions(){ try{return JSON.parse(localStorage.getItem(sessionKey(getActiveProfile())))||[]}catch{return[]} }
function saveSessions(s){ localStorage.setItem(sessionKey(getActiveProfile()),JSON.stringify(s)) }

// ── Draft helpers ─────────────────────────────────────────────────────────────
function getDraft(date){ try{return JSON.parse(localStorage.getItem(draftKey(date,getActiveProfile())))}catch{return null} }
function saveDraft(date,d){ localStorage.setItem(draftKey(date,getActiveProfile()),JSON.stringify(d)) }
function clearDraft(date){ localStorage.removeItem(draftKey(date,getActiveProfile())) }

// ── Day notes ─────────────────────────────────────────────────────────────────
function getDayNote(i){ return localStorage.getItem(noteKey(i,getActiveProfile()))||(getActiveDay(i)||DAYS[i]||{}).defaultNote||'' }
function saveDayNote(i,v){ localStorage.setItem(noteKey(i,getActiveProfile()),v) }

// ── Deload ────────────────────────────────────────────────────────────────────
function isDeload(){ return !!localStorage.getItem(deloadKey(getActiveProfile())) }
function toggleDeload(){
  const k=deloadKey(getActiveProfile());
  if(localStorage.getItem(k)) localStorage.removeItem(k); else localStorage.setItem(k,'1');
  document.getElementById('deload-banner').style.display=isDeload()?'':'none';
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function toggleTheme(){
  const html=document.documentElement;
  const next=html.getAttribute('data-theme')==='dark'?'light':'dark';
  html.setAttribute('data-theme',next);
  localStorage.setItem('wt_theme',next);
  document.getElementById('theme-btn').textContent=next==='dark'?'🌙':'☀️';
}
function initTheme(){
  const t=localStorage.getItem('wt_theme')||'dark';
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('theme-btn').textContent=t==='dark'?'🌙':'☀️';
}
function selectWeightUnit(u){
  setWeightUnit(u);
  if(typeof renderPrefsModal==='function') renderPrefsModal();
  if(typeof renderDetail==='function') renderDetail();
  if(typeof renderDashboard==='function'&&document.getElementById('dashboard-view')?.style.display!=='none') renderDashboard();
}


function loadBW(){ try{return JSON.parse(localStorage.getItem(bwKey(getActiveProfile())))||[]}catch{return[]} }
function saveBW2(entries){ localStorage.setItem(bwKey(getActiveProfile()),JSON.stringify(entries)) }

// ── Schedule (date → workout assignment) ──────────────────────────────────────
function loadSchedule(){ try{return JSON.parse(localStorage.getItem(scheduleKey(getActiveProfile())))||{}}catch{return{}} }
function saveSchedule(s){ localStorage.setItem(scheduleKey(getActiveProfile()),JSON.stringify(s)) }
function getDefaultForDate(date){
  const dow=(new Date(date+'T00:00:00').getDay()+6)%7; // Mon=0…Sun=6
  return getGoalWeekDefaults()[dow];
}
function getWorkoutForDate(date){
  const sched=loadSchedule();
  if(sched[date]!==undefined) return sched[date];
  return getDefaultForDate(date);
}
function setWorkoutForDate(date,dayIdx){
  const sched=loadSchedule();
  if(dayIdx===getDefaultForDate(date)) delete sched[date]; else sched[date]=dayIdx;
  saveSchedule(sched);
}


function getGoal(){ return localStorage.getItem(goalKey(getActiveProfile()))||'' }
function setGoal(id){ localStorage.setItem(goalKey(getActiveProfile()),id) }
function getDaysPerWeek(){ return parseInt(localStorage.getItem(daysPerWeekKey(getActiveProfile()))||'7',10) }
function setDaysPerWeek(n){ localStorage.setItem(daysPerWeekKey(getActiveProfile()),String(n)) }

// ── Weight unit preference ────────────────────────────────────────────────────
function getWeightUnit(){ return localStorage.getItem('wt_unit')||'lbs' }
function setWeightUnit(u){ localStorage.setItem('wt_unit',u) }

// ── Anthropic API key ─────────────────────────────────────────────────────────
function getAPIKey(){ return localStorage.getItem('wt_api_key')||'' }
function setAPIKey(k){ if(k) localStorage.setItem('wt_api_key',k.trim()); else localStorage.removeItem('wt_api_key') }

// ── AI-generated workout plan ─────────────────────────────────────────────────
function getAIPlan(){ try{return JSON.parse(localStorage.getItem('wt_aiplan_'+getActiveProfile()))||null}catch{return null} }
function setAIPlan(plan){ localStorage.setItem('wt_aiplan_'+getActiveProfile(),JSON.stringify(plan)) }
function clearAIPlan(){ localStorage.removeItem('wt_aiplan_'+getActiveProfile()) }