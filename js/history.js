// ── Workout history list ──────────────────────────────────────────────

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
          <div class="hist-session-title">${day.dow} — ${day.name}${{great:'💪',good:'😊',tired:'😴',rough:'😓'}[session.mood]?' <span style="font-size:13px">'+{great:'💪',good:'😊',tired:'😴',rough:'😓'}[session.mood]+'</span>':''}</div>
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
            <div class="hist-ex-name">${ex.name}${ex.variantNote?` <span class="variant-flag" style="display:inline" title="${ex.variantNote.replace(/"/g,'&quot;')}">⚠️ different setup</span>`:''}</div>
            <div class="hist-sets">
              ${ex.sets.map((s,i)=>{
                const isPR=sessionPRs[ex.name]&&parseFloat(s.weight)>=sessionPRs[ex.name]&&isWorkingSet(s);
                return`<span class="hist-set-chip ${isSetDone(s)?'done':''} ${s.warmup?'warmup':''} ${isPR?'pr':''}">
                  S${i+1} ${s.weight?s.weight+getWeightUnit():'—'} × ${s.reps||'—'}${s.rpe?' @'+s.rpe:''}${s.warmup?' W':''}${isPR?' 🏆':''}
                </span>`;
              }).join('')}
            </div>
          </div>`).join('')}
        ${session.notes?`<div class="hist-notes" style="padding:8px 14px">${session.notes}</div>`:''}
      </div>`;
    list.appendChild(div);
  });
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
function countDoneSets(session){ return session.exercises.reduce((a,e)=>a+e.sets.filter(isWorkingSet).length,0) }
function shareSession(id){
  const session=loadSessions().find(s=>s.id===id); if(!session) return;
  const day=(session.dayIdx>=0?(getActiveDay(session.dayIdx)||DAYS[session.dayIdx]):null)||{dow:'?',name:'Workout'};
  let text=`${day.dow} — ${day.name} (${formatDate(session.date)})\n\n`;
  session.exercises.forEach(ex=>{
    text+=`${ex.name}:\n`;
    ex.sets.forEach((s,i)=>{
      text+=`  S${i+1}: ${s.weight||'—'} ${getWeightUnit()} × ${s.reps||'—'} reps${isSetDone(s)?' ✓':''}\n`;
    });
    text+='\n';
  });
  if(session.notes) text+=`Notes: ${session.notes}\n`;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.querySelector(`[onclick="event.stopPropagation();shareSession(${id})"]`);
    if(btn){const orig=btn.textContent;btn.textContent='✓ Copied!';setTimeout(()=>btn.textContent=orig,2000)}
  }).catch(()=>prompt('Copy this summary:',text));
}
