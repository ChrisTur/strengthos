// ── Profiles, rename, plate/1RM calculator, bodyweight log ──────────────────────────────────────────────

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
    const safe=escapeJsAttr(name);
    div.innerHTML=`<span>${escapeHtml(name)}${name===active?' ✓':''}</span>
      <span style="display:flex;gap:4px">
        <button class="profile-del-btn" onclick="event.stopPropagation();openRenameModal('${safe}')" title="Rename">✎</button>
        ${profiles.length>1?`<button class="profile-del-btn" onclick="event.stopPropagation();deleteProfile('${safe}')" title="Delete">✕</button>`:''}
      </span>`;
    div.onclick=()=>switchProfile(name);
    list.appendChild(div);
  });
}
function renderProfileSelector(){
  const g=getGoal(); const go=GOALS.find(x=>x.id===g);
  document.getElementById('profile-name-display').textContent=getActiveProfile()+(go?' '+go.icon:'');
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
