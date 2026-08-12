// ── Boot, auth, hydration, view routing, date utils, notifications ──────────────────────────────────────────────

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
  initNotifications();
}
// ── Auth screen ───────────────────────────────────────────────────────────────
let _authMode = 'login';
function authSwitchTab(mode){
  _authMode = mode;
  document.getElementById('auth-tab-login').classList.toggle('active', mode==='login');
  document.getElementById('auth-tab-register').classList.toggle('active', mode==='register');
  document.getElementById('auth-name-wrap').style.display = mode==='register'?'':'none';
  document.getElementById('auth-password').autocomplete = mode==='login'?'current-password':'new-password';
  document.getElementById('auth-submit-btn').textContent = mode==='login'?'Log In':'Create Account';
  document.getElementById('auth-error').style.display = 'none';
}
async function authSubmit(){
  const btn   = document.getElementById('auth-submit-btn');
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = _authMode==='login'?'Signing in…':'Creating account…';

  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  try {
    if(_authMode==='login'){
      if(!email||!password) throw new Error('Email and password required');
      await apiLogin(email, password);
    } else {
      const name = document.getElementById('auth-name').value.trim();
      if(!name||!email||!password) throw new Error('All fields required');
      await apiRegister(name, email, password);
    }
    await _hydrateAndLaunch();
  } catch(e){
    errEl.textContent = e.message;
    errEl.style.display = '';
    btn.disabled = false;
    btn.textContent = _authMode==='login'?'Log In':'Create Account';
  }
}
function _hydrateLocalStorage(settings, sessions){
  // settings.profile is just the account's registered name, used only to seed the
  // local multi-profile list the very first time (empty device/browser). Re-adding
  // it unconditionally on every hydrate (i.e. every page load) resurrected profiles
  // right after they were deleted, since this runs on every refresh while logged in.
  const profile = settings.profile || 'Me';
  let profiles = loadProfiles();
  if(!profiles.length){ profiles=[profile]; saveProfiles(profiles); }
  if(profiles.includes(profile)) setActiveProfile(profile);
  else if(!getActiveProfile()||!profiles.includes(getActiveProfile())) setActiveProfile(profiles[0]);
  if(settings.goal)         setGoal(settings.goal);
  if(settings.dpw)          setDaysPerWeek(settings.dpw);
  if(settings.weightUnit)   setWeightUnit(settings.weightUnit);
  if(settings.cardioLevel)  setCardioLevel(settings.cardioLevel);
  if(settings.equipment)    setEquipment(settings.equipment);
  if(settings.disliked)     saveDisliked(settings.disliked);
  if(settings.weekTemplate) setWeekTemplate(settings.weekTemplate);
  if(settings.aiPlan)       setAIPlan(settings.aiPlan);
  if(settings.customDays && Object.keys(settings.customDays).length) setCustomDays(settings.customDays);
  saveSessions(sessions);
  localStorage.setItem('wt_onboarded','1');
}
async function _hydrateAndLaunch(){
  const { settings, sessions } = await apiLoadUserData();
  _hydrateLocalStorage(settings, sessions);
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = '';
  initApp();
}
function logout(){
  apiLogout(); // must run before clearAuthToken() — it needs the current token to revoke it
  clearAuthToken();
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  // reset tab to login
  _authMode = 'login';
  document.getElementById('auth-tab-login').classList.add('active');
  document.getElementById('auth-tab-register').classList.remove('active');
  document.getElementById('auth-submit-btn').textContent = 'Log In';
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-name-wrap').style.display = 'none';
  closeProfileDropdown();
}
async function _boot(){
  initTheme();
  const token = getAuthToken();
  if(token){
    try {
      await _hydrateAndLaunch();
      return;
    } catch(e){
      if(e.status===401) clearAuthToken();
      else {
        // network error — fall back to cached localStorage
        if(needsOnboarding()) showOnboarding();
        else { document.getElementById('app').style.display=''; initApp(); }
        return;
      }
    }
  }
  document.getElementById('auth-screen').style.display = 'flex';
  setTimeout(()=>document.getElementById('auth-email').focus(), 100);
}
// ── Push notifications ────────────────────────────────────────────────────────
async function initNotifications(){
  if(!('serviceWorker' in navigator)) return;
  try{ await navigator.serviceWorker.register('/sw.js'); }catch(e){ console.warn('SW:',e); }
  if(Notification.permission==='granted'&&getReminderEnabled()) checkWorkoutReminder();
}
async function checkWorkoutReminder(){
  if(!getReminderEnabled()||Notification.permission!=='granted') return;
  const today=localDateStr();
  if(localStorage.getItem('wt_notified')===today) return;
  if(activeDayIdx===REST_DAY) return;
  const [rh,rm]=getReminderTime().split(':').map(Number);
  const now=new Date();
  if(now.getHours()<rh||(now.getHours()===rh&&now.getMinutes()<rm)) return;
  const day=getActiveDay(activeDayIdx)||DAYS[activeDayIdx]||{name:'Workout'};
  try{
    const reg=await navigator.serviceWorker.ready;
    await reg.showNotification('StrengthOS 🏋️',{
      body:`Time for ${day.name}! Tap to open your workout.`,
      tag:'workout-reminder',
      renotify:false,
    });
    localStorage.setItem('wt_notified',today);
  }catch(e){console.warn('Notification:',e);}
}
async function enableNotifications(){
  if(!('Notification' in window)){alert('Notifications not supported on this device.');return;}
  const perm=await Notification.requestPermission();
  if(perm==='granted'){
    setReminderEnabled(true);
    renderPrefsModal();
    checkWorkoutReminder();
  } else {
    setReminderEnabled(false);
    renderPrefsModal();
    alert('Permission denied — please enable notifications in your browser/system settings.');
  }
}
function toggleReminder(){
  if(getReminderEnabled()){setReminderEnabled(false);renderPrefsModal();}
  else enableNotifications();
}
function updateReminderTime(t){
  setReminderTime(t);
  localStorage.removeItem('wt_notified');
}
_boot();
document.addEventListener('click',e=>{
  const sel=document.getElementById('profile-selector');
  if(sel&&!sel.contains(e.target)) closeProfileDropdown();
  if(!e.target.closest('.ex-controls')) closeExMenus();
});