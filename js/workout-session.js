// ── Day detail, exercise rows/sets, warmups, rest timer, save/discard ──────────────────────────────────────────────

let _durationTimer=null;
let _completionSessionId=null;
// Double-progression rule: below this rep count, nudge reps up at the same weight;
// at/above it, nudge weight up instead. RPE (if logged) overrides this: an easy set
// (RPE ≤7, roughly 3+ reps in reserve) pushes weight regardless of rep count, and a
// near-max set (RPE ≥9.5) suggests holding rather than pushing further.
const REP_CEILING=10;
function suggestProgression(weight,reps,rpe,inc){
  const r=parseFloat(rpe);
  if(!isNaN(r)){
    if(r<=7) return {type:'weight',value:weight+inc};
    if(r>=9.5) return {type:'hold',value:null};
  }
  if(reps>0&&reps<REP_CEILING) return {type:'reps',value:reps+1};
  return {type:'weight',value:weight+inc};
}
let draftSession=null;
let _lastSession=null;
// Superset grouping: exercises chained via linkedToNext form a group, labeled A1/A2/…, B1/B2/…
const SUPERSET_COLORS=['var(--accent)','var(--blue)','var(--green)','var(--amber)'];
function computeSupersetLabels(exercises){
  const labels=new Array(exercises.length).fill(null);
  const colors=new Array(exercises.length).fill(null);
  let groupIdx=0, i=0;
  while(i<exercises.length){
    if(exercises[i].linkedToNext){
      const color=SUPERSET_COLORS[groupIdx%SUPERSET_COLORS.length];
      let j=i, n=1;
      labels[j]=String.fromCharCode(65+groupIdx)+n; colors[j]=color;
      while(exercises[j]&&exercises[j].linkedToNext&&j+1<exercises.length){
        j++; n++;
        labels[j]=String.fromCharCode(65+groupIdx)+n; colors[j]=color;
      }
      groupIdx++;
      i=j+1;
    } else {
      i++;
    }
  }
  return exercises.map((_,idx)=>labels[idx]?{label:labels[idx],color:colors[idx]}:null);
}
function toggleSuperset(ei){
  const ex=draftSession.exercises[ei];
  ex.linkedToNext=!ex.linkedToNext;
  _markModified(); saveDraft(activeDate,draftSession);
  renderExerciseRows(_lastSavedSession()); updateSessionStatus();
}
function initDraft(dayIdx,date){
  date=date||activeDate;
  const goal=getGoal();
  const disliked=loadDisliked();
  const extras=(GOAL_EXERCISES[goal]||[])
    .filter(ex=>!disliked.includes(ex.name))
    .map(ex=>({name:ex.name,sets:[{reps:'',weight:'',done:false}],goalAdded:true}));
  const day=getActiveDay(dayIdx);
  // Pre-fill weights from the most recent session on this same day slot
  const lastSession=loadSessions().filter(s=>s.dayIdx===dayIdx&&s.date!==date).slice(-1)[0]||null;
  _lastSession=lastSession;
  function prefillSets(exName){
    const isCardio=isCardioExercise(exName);
    if(isCardio){
      const lastEx=lastSession?.exercises.find(e=>e.name===exName);
      return [{duration:lastEx?.sets?.[0]?.duration||'',done:false}];
    }
    if(!lastSession) return [{reps:'',weight:'',done:false}];
    const lastEx=lastSession.exercises.find(e=>e.name===exName);
    if(!lastEx||!lastEx.sets.length) return [{reps:'',weight:'',done:false}];
    return lastEx.sets.map(s=>({reps:'',weight:s.weight||'',done:false,warmup:s.warmup||false}));
  }
  if(!day) return{dayIdx,date,exercises:[...extras],notes:'',startedAt:Date.now()};
  return{dayIdx,date,
    exercises:[
      ...day.exercises.filter(ex=>!disliked.includes(ex.name)).map(ex=>({name:ex.name,sets:prefillSets(ex.name)})),
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
    const blankSet=isCardioExercise(ex.name)?{duration:'',done:false}:{reps:'',weight:'',done:false};
    draftSession.exercises.push(prev||{name:ex.name,sets:[blankSet],goalAdded:true});
  });
}
function renderDetail(){
  const panel=document.getElementById('detail-panel');
  const activeDays=getActiveDays();
  const workoutOpts=`<option value="${REST_DAY}"${activeDayIdx===REST_DAY?' selected':''}>Rest / Off</option>`
    +activeDays.map((d,i)=>`<option value="${i}"${i===activeDayIdx?' selected':''}>${d.dow} — ${escapeHtml(d.name)}</option>`).join('');

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
  const allStats=calcStats(loadSessions());
  const showDeloadBanner=allStats.weekStreak>=4&&!isDeload()&&
    Number(localStorage.getItem('wt_deload_dismiss')||0)<allStats.weekStreak;
  const deloadBannerHTML=showDeloadBanner
    ?`<div class="deload-suggest-banner" id="deload-suggest-banner">
        💪 <strong>${allStats.weekStreak} weeks straight</strong> — your body may benefit from a deload week.
        <div class="deload-suggest-actions">
          <button class="btn btn-sm btn-amber" onclick="toggleDeload()">Enable Deload</button>
          <button class="btn btn-sm" onclick="dismissDeloadSuggest()">Dismiss</button>
        </div>
      </div>`
    :'';
  const note=getDayNote(activeDayIdx);
  const goal=getGoal(); const goalObj=GOALS.find(g=>g.id===goal);
  const heroUrl=typeof getWorkoutImageUrl==='function'?getWorkoutImageUrl(day):null;
  const heroHTML=heroUrl?`<div class="workout-hero"><img src="${heroUrl}" alt="${escapeHtml(day.name)}" loading="lazy" onerror="this.closest('.workout-hero').style.display='none'"><div class="workout-hero-grad"></div></div>`:'';

  panel.innerHTML=`
    ${heroHTML}
    ${deloadBannerHTML}
    <div class="detail-header">
      <div>
        <div class="detail-title-wrap" onclick="startDayRename(${activeDayIdx})" title="Click to rename this day">
          <span class="detail-title" id="detail-day-title">${escapeHtml(day.name)}</span>
          <span class="rename-hint">✎</span>
        </div>
        <div class="detail-sub" id="detail-sub">${draftSession.exercises.length} exercise${draftSession.exercises.length!==1?'s':''} · ~${estimateWorkoutMinutes()} min${lastSession?` · Last: ${formatDate(lastSession.date)}`:''}</div>
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
    <div class="note-label">📋 Day plan — same every time you do this day</div>
    <textarea class="note-edit" id="day-note-ta" rows="2" placeholder="Day notes — cues, focus areas, target weights…" oninput="saveDayNoteFromUI(${activeDayIdx},this.value)">${escapeHtml(note)}</textarea>
    <div class="session-notes-wrap">
      <div class="note-label">📝 This session — ${formatDate(draftSession.date)}</div>
      <textarea class="session-notes" id="session-notes"
        placeholder="Session notes (how you felt, PRs, adjustments…)"
        oninput="draftSession.notes=this.value;saveDraft(activeDate,draftSession)">${escapeHtml(draftSession.notes)}</textarea>
    </div>
    <div class="session-bar">
      <div>
        <div class="session-date" id="session-status">Draft — not saved</div>
        <div id="session-timer" style="font-size:10px;color:var(--text3);margin-top:2px"></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label class="rest-label">Rest <select class="rest-select" onchange="setRestPeriod(parseFloat(this.value));updateDetailSub()">${restSelectHTML()}</select></label>
        ${_lastSession?`<button class="btn btn-sm" onclick="copyLastWorkout()" title="Copy weights & reps from last session">📋 Copy last</button>`:''}
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
    value="${escapeHtml(cur)}"
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
  const supersetLabels=computeSupersetLabels(draftSession.exercises);

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
      const chips=lastEx.sets.filter(s=>s.weight||s.reps).map(s=>{
        const isPR=allPRs[ex.name]&&parseFloat(s.weight)>=allPRs[ex.name].weight&&isSetDone(s);
        return`<span class="lsc${isPR?' pr':''}">${s.weight||'?'}×${s.reps||'?'}${s.rpe?' @'+s.rpe:''}${isPR?' 🏆':''}</span>`;
      }).join('');
      if(chips) lastHTML=`<div class="last-set-row">${chips}</div>`;
      if(lastEx.variantNote){
        lastHTML+=`<div class="variant-flag" title="${escapeHtml(lastEx.variantNote)}">⚠️ different setup last time</div>`;
      } else {
        const doneSets=lastEx.sets.filter(isSetDone);
        if(doneSets.length){
          const bestW=Math.max(...doneSets.map(s=>parseFloat(s.weight)||0));
          const topSets=doneSets.filter(s=>parseFloat(s.weight)===bestW);
          const topReps=Math.max(...topSets.map(s=>parseInt(s.reps)||0));
          const topRpe=topSets.find(s=>parseInt(s.reps)===topReps)?.rpe;
          const inc=getWeightUnit()==='kg'?2.5:5;
          const sug=suggestProgression(bestW,topReps,topRpe,inc);
          if(sug.type==='reps') overloadHint=`<span class="overload-hint">↑ Try ${sug.value} reps</span>`;
          else if(sug.type==='weight') overloadHint=`<span class="overload-hint">↑ Try ${sug.value} ${getWeightUnit()}</span>`;
          else overloadHint=`<span class="overload-hint" style="color:var(--text3)">≈ Hold — near max last time</span>`;
        }
      }
    }

    const goalTag=isGoalEx
      ?`<span style="font-size:10px;color:var(--accent);margin-top:3px;display:block">${GOALS.find(g=>g.id===goal)?.icon||''} Goal exercise</span>`
      :planTag;

    const safeName=escapeJsAttr(ex.name);
    const superset=supersetLabels[ei];
    const tr=document.createElement('tr');
    tr.className='ex-row'+(isGoalEx?' goal-ex-row':'')+(isCustom?' custom-ex-row':'')+(superset?' superset-row':'');
    if(superset) tr.style.borderLeft=`3px solid ${superset.color}`;
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
            ${superset?`<span class="superset-badge" style="background:${superset.color}" title="Part of a superset — logged back-to-back with no rest until the group is done">${superset.label}</span>`:''}
            <span ${isGoalEx?'style="color:var(--accent)"':isCustom?'style="color:var(--text2);font-style:italic"':''}>${escapeHtml(ex.name)}${isCustom?' <span style="font-size:10px;color:var(--text3)">(added)</span>':''}</span>
            <div class="ex-action-row">
              ${swapTag}
<button style="background:none;border:none;cursor:pointer;padding:0;font-size:14px" onclick="openProgressModal('${safeName}')" title="View progress chart">📈</button>
<button class="variant-btn${ex.variantNote?' active':''}" onclick="markExerciseVariant(${ei})" title="${ex.variantNote?('Different setup: '+escapeHtml(ex.variantNote)):'Flag a different setup today (e.g. different machine) — click to add a note'}">${ex.variantNote?'⚠️':'🔀'}</button>
${ei<draftSession.exercises.length-1?`<button class="superset-btn${ex.linkedToNext?' active':''}" onclick="toggleSuperset(${ei})" title="${ex.linkedToNext?'Unlink from next exercise':'Superset with next exercise — no rest until the pair is done'}">🔗</button>`:''}
            </div>
          </div>
          <div class="ex-controls">
            <div class="ex-reorder-group">
              <button class="ex-reorder-btn" onclick="moveExercise(${ei},-1)" ${ei===0?'disabled':''} title="Move up">↑</button>
              <button class="ex-reorder-btn" onclick="moveExercise(${ei},1)" ${ei===draftSession.exercises.length-1?'disabled':''} title="Move down">↓</button>
            </div>
            <button class="ex-remove-btn" onclick="removeExerciseToday(${ei})" title="Remove from today's session">✕ Remove</button>
          </div>
        </div>
      </td>
      <td class="ex-plan-cell">${displayPlan}<br><span style="font-size:11px;color:var(--text3)">${planEx.note||''}</span>${goalTag}</td>
      <td class="ex-last-cell">${lastHTML}${overloadHint}</td>
      <td class="ex-log-cell">
        <div class="sets-container" id="sets-${ei}"></div>
        ${isCardioExercise(ex.name)?'':`<button class="add-set-btn" onclick="addSet(${ei})">+ add set</button><button class="add-set-btn warmup-gen-btn" onclick="generateWarmupSets(${ei})">🔥 warmups</button>`}
      </td>`;
    tbody.appendChild(tr);
    renderSets(ei);
  });
}
function renderSets(ei){
  const container=document.getElementById('sets-'+ei); if(!container) return;
  container.innerHTML='';
  const ex=draftSession.exercises[ei];
  const sets=ex.sets;

  if(isCardioExercise(ex.name)){
    // Ensure at least one cardio set exists
    if(!sets.length) sets.push({duration:'',done:false});
    const s=sets[0];
    const row=document.createElement('div');
    row.className=`cardio-row${s.done?' cardio-done':''}`;
    row.innerHTML=`
      <input class="cardio-dur-input" type="text" inputmode="decimal"
        placeholder="min" value="${s.duration||''}"
        oninput="updateCardioSet(${ei},this.value)">
      <span class="cardio-unit">min</span>
      <button class="cardio-done-btn${s.done?' active':''}" onclick="toggleCardioSetDone(${ei})">
        ${s.done?'✓ Done':'Mark done'}
      </button>`;
    container.appendChild(row);
    return;
  }

  const lastEx=_lastSession?.exercises?.find(e=>e.name===ex.name);
  const inc=getWeightUnit()==='kg'?1.25:2.5;
  sets.forEach((set,si)=>{
    const lastSet=lastEx?.variantNote?null:lastEx?.sets?.[si];
    const lastW=parseFloat(lastSet?.weight)||0;
    const lastR=parseInt(lastSet?.reps)||0;
    let nudge='';
    if(lastW>0&&!set.weight&&!set.warmup){
      const sug=suggestProgression(lastW,lastR,lastSet?.rpe,inc);
      if(sug.type==='reps')
        nudge=`<span class="overload-nudge" onclick="applyRepNudge(${ei},${si},${lastW},${sug.value})" title="Same weight, try ${sug.value} reps">↑${sug.value}rep</span>`;
      else if(sug.type==='weight')
        nudge=`<span class="overload-nudge" onclick="applyOverloadNudge(${ei},${si},${sug.value})" title="Try ${sug.value} ${getWeightUnit()}">↑${sug.value}</span>`;
      // 'hold': that set was near-max last time — no productive nudge to show
    }
    const applyAll=sets.length>1&&set.weight&&!set.warmup
      ?`<span class="apply-all-btn" onclick="applyWeightToAllSets(${ei},${si})" title="Copy to all working sets">↓all</span>`
      :'';
    const row=document.createElement('div');
    row.className=`set-row${set.warmup?' warmup-set':''}`;
    row.innerHTML=`
      <span class="set-label">S${si+1}</span>
      <input class="set-input" type="text" inputmode="decimal" placeholder="${getWeightUnit()}"
        value="${set.weight}" oninput="updateSet(${ei},${si},'weight',this.value)">
      ${nudge}${applyAll}
      <span class="set-x">×</span>
      <input class="set-input" type="text" inputmode="numeric" placeholder="reps"
        value="${set.reps}" oninput="updateSet(${ei},${si},'reps',this.value)">
      ${set.warmup?'':`<span class="set-x" title="Rate of perceived exertion">@</span>
      <input class="set-input set-rpe-input" type="text" inputmode="decimal" placeholder="RPE" title="Rate of perceived exertion (6–10) — how hard that set felt"
        value="${set.rpe||''}" oninput="updateSet(${ei},${si},'rpe',this.value)">`}
      <button class="set-warmup-btn${set.warmup?' active':''}" onclick="toggleSetWarmup(${ei},${si})" title="${set.warmup?'Mark as working set':'Mark as warm-up set'}">W</button>
      ${sets.length>1?`<span class="add-set-btn" onclick="removeSet(${ei},${si})" style="color:var(--red);font-size:14px;padding:0 2px">×</span>`:''}`;
    container.appendChild(row);
  });
}
function markExerciseVariant(ei){
  const ex=draftSession.exercises[ei];
  const val=prompt('What\'s different this time? (e.g. "Different machine — Cybex instead of Hammer Strength")\nLeave blank to clear.', ex.variantNote||'');
  if(val===null) return;
  ex.variantNote=val.trim();
  _markModified(); saveDraft(activeDate,draftSession);
  renderExerciseRows(_lastSavedSession()); updateSessionStatus();
}
function applyWeightToAllSets(ei,si){
  const ex=draftSession.exercises[ei];
  const w=ex.sets[si].weight;
  if(!w) return;
  ex.sets.forEach(s=>{if(!s.warmup) s.weight=w;});
  _markModified(); saveDraft(activeDate,draftSession);
  renderSets(ei); updateSessionStatus();
}
function generateWarmupSets(ei){
  const ex=draftSession.exercises[ei];
  const workingSets=ex.sets.filter(s=>!s.warmup&&parseFloat(s.weight)>0);
  if(!workingSets.length){alert('Enter a working weight first, then generate warmups.');return;}
  const maxW=Math.max(...workingSets.map(s=>parseFloat(s.weight)));
  const snap=getWeightUnit()==='kg'?1.25:2.5;
  const warmups=[
    {pct:.4,reps:10},{pct:.6,reps:6},{pct:.8,reps:3}
  ].map(({pct,reps})=>({
    weight:String(Math.round(maxW*pct/snap)*snap),
    reps:String(reps),done:false,warmup:true
  }));
  ex.sets=[...warmups,...ex.sets.filter(s=>!s.warmup)];
  _markModified(); saveDraft(activeDate,draftSession);
  renderSets(ei); updateSessionStatus();
}
function applyOverloadNudge(ei,si,weight){
  const ex=draftSession.exercises[ei];
  ex.sets[si].weight=String(weight);
  _markModified(); saveDraft(activeDate,draftSession);
  renderSets(ei); updateSessionStatus();
}
function applyRepNudge(ei,si,weight,reps){
  const ex=draftSession.exercises[ei];
  ex.sets[si].weight=String(weight);
  ex.sets[si].reps=String(reps);
  _markModified(); saveDraft(activeDate,draftSession);
  renderSets(ei); updateSessionStatus();
}
function updateCardioSet(ei,duration){
  const ex=draftSession.exercises[ei];
  if(!ex.sets.length) ex.sets.push({duration:'',done:false});
  ex.sets[0].duration=duration; _markModified();
  saveDraft(activeDate,draftSession); updateSessionStatus();
}
function toggleCardioSetDone(ei){
  const ex=draftSession.exercises[ei];
  if(!ex.sets.length) ex.sets.push({duration:'',done:false});
  ex.sets[0].done=!ex.sets[0].done; _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus();
}
function _markModified(){ delete draftSession.savedAt; }
function isCardioExercise(name){ return getExerciseMuscle(name)==='Cardio'; }
function isSetDone(s){ return (parseFloat(s.weight)>0 && parseInt(s.reps)>0) || !!s.done; }
function isWorkingSet(s){ return isSetDone(s) && !s.warmup; }
// ── Rest timer ────────────────────────────────────────────────────────────────
let _restTimerInterval=null, _restTimerEnd=0, _restTimerTotal=0;
function startRestTimer(){
  const ms=Math.round(getRestPeriod()*60000);
  _restTimerTotal=ms; _restTimerEnd=Date.now()+ms;
  const el=document.getElementById('rest-timer');
  if(el) el.style.display='';
  clearInterval(_restTimerInterval);
  _restTimerInterval=setInterval(_tickRestTimer,250);
  _tickRestTimer();
}
function _tickRestTimer(){
  const remaining=Math.max(0,_restTimerEnd-Date.now());
  const secs=Math.ceil(remaining/1000);
  const pct=_restTimerTotal>0?(remaining/_restTimerTotal)*100:0;
  const countEl=document.getElementById('rest-timer-count');
  const fillEl=document.getElementById('rest-timer-fill');
  if(countEl) countEl.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
  if(fillEl){
    fillEl.style.width=`${pct}%`;
    fillEl.style.background=pct>50?'var(--green)':pct>20?'var(--amber)':'var(--red)';
  }
  if(remaining<=0){
    clearInterval(_restTimerInterval);
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
    playRestBeep();
    notifyRestDone();
    if(countEl){ countEl.textContent='Go!'; countEl.style.color='var(--green)'; }
    setTimeout(()=>{ skipRestTimer(); if(countEl) countEl.style.color=''; },2500);
  }
}
function skipRestTimer(){
  clearInterval(_restTimerInterval);
  const el=document.getElementById('rest-timer');
  if(el) el.style.display='none';
}
// Audible cue — always plays, mirrors the existing unconditional vibrate() above.
// No audio asset needed: a short synthesized beep via Web Audio.
function playRestBeep(){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type='sine'; osc.frequency.value=880;
    gain.gain.setValueAtTime(0.3,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
    osc.start(); osc.stop(ctx.currentTime+0.4);
  }catch(e){}
}
// OS-level notification for when rest ends while the tab is backgrounded/locked —
// only fires if notification permission is already granted (never prompts from here;
// that stays in the existing Prefs "Enable reminders" flow) and the page isn't visible,
// so it doesn't double up with the on-screen "Go!" state when you're already looking at it.
async function notifyRestDone(){
  if(!document.hidden||typeof Notification==='undefined'||Notification.permission!=='granted') return;
  if(!('serviceWorker' in navigator)) return;
  try{
    const reg=await navigator.serviceWorker.ready;
    await reg.showNotification('Rest over 💪',{body:'Time for your next set.',tag:'rest-timer',renotify:true});
  }catch(e){}
}
function toggleSetWarmup(ei,si){
  const s=draftSession.exercises[ei].sets[si];
  s.warmup=!s.warmup; _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateDetailSub();
}
function restSelectHTML(){
  const v=getRestPeriod();
  return [['0.75','45s'],['1','1 min'],['1.5','90s'],['2','2 min'],['3','3 min']]
    .map(([val,lbl])=>`<option value="${val}"${Math.abs(getRestPeriod()-parseFloat(val))<0.01?' selected':''}>${lbl}</option>`)
    .join('');
}
function estimateWorkoutMinutes(){
  const sets=draftSession.exercises.reduce((a,e)=>a+e.sets.length,0);
  const workingSets=draftSession.exercises.reduce((a,e)=>a+e.sets.filter(s=>!s.warmup).length,0);
  return Math.max(10, Math.round(sets*0.75 + workingSets*getRestPeriod()));
}
function updateDetailSub(){
  const el=document.getElementById('detail-sub'); if(!el) return;
  const n=draftSession.exercises.length;
  const mins=estimateWorkoutMinutes();
  el.textContent=`${n} exercise${n!==1?'s':''} · ~${mins} min`;
}
function saveDayNoteFromUI(dayIdx, val){
  saveDayNote(dayIdx, val);
  const base=getActiveDay(dayIdx)||DAYS[dayIdx]||{};
  setCustomDay(dayIdx, {...base, defaultNote: val,
    exercises:(base.exercises||[])});
  apiSyncSettings({customDays: getCustomDays()});
}
function updateSet(ei,si,field,val){
  const ex=draftSession.exercises[ei];
  const set=ex.sets[si];
  const wasDone=isSetDone(set);
  set[field]=val; _markModified();
  saveDraft(activeDate,draftSession); updateSessionStatus();
  if(!wasDone && isSetDone(set) && si < ex.sets.length - 1 && !ex.linkedToNext) startRestTimer();
}
function toggleSetDone(ei,si){
  draftSession.exercises[ei].sets[si].done=!draftSession.exercises[ei].sets[si].done; _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus();
}
function addSet(ei){
  draftSession.exercises[ei].sets.push({reps:'',weight:'',done:false}); _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus(); updateDetailSub();
}
function removeSet(ei,si){
  draftSession.exercises[ei].sets.splice(si,1); _markModified();
  saveDraft(activeDate,draftSession); renderSets(ei); updateSessionStatus(); updateDetailSub();
}
function removeExerciseToday(ei){
  if(ei>0) draftSession.exercises[ei-1].linkedToNext=false; // avoid accidentally linking to whatever now follows
  draftSession.exercises.splice(ei,1); _markModified();
  saveDraft(activeDate,draftSession);
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus(); updateDetailSub();
}
function moveExercise(ei,dir){
  const j=ei+dir;
  if(j<0||j>=draftSession.exercises.length) return;
  [draftSession.exercises[ei],draftSession.exercises[j]]=[draftSession.exercises[j],draftSession.exercises[ei]];
  _markModified(); saveDraft(activeDate,draftSession);
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
}
function removeCustomExercise(ei){
  if(ei>0) draftSession.exercises[ei-1].linkedToNext=false; // avoid accidentally linking to whatever now follows
  draftSession.exercises.splice(ei,1); _markModified();
  saveDraft(activeDate,draftSession);
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus();
}
function submitAddEx(){
  const inp=document.getElementById('add-ex-input'); if(!inp||!inp.value.trim()) return;
  draftSession.exercises.push({name:inp.value.trim(),sets:[{reps:'',weight:'',done:false}],custom:true}); _markModified();
  saveDraft(activeDate,draftSession); inp.value='';
  _syncDraftToTemplate(); // persist the add to next week's template
  const prev=_lastSavedSession(); renderExerciseRows(prev); updateSessionStatus(); updateDetailSub();
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
  const workingSets=e=>e.sets.filter(s=>!s.warmup);
  const total=draftSession.exercises.reduce((a,e)=>a+workingSets(e).length,0);
  const done=draftSession.exercises.reduce((a,e)=>a+workingSets(e).filter(isSetDone).length,0);
  const warmupDone=draftSession.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.warmup&&isSetDone(s)).length,0);
  const warmupNote=warmupDone>0?` · ${warmupDone}W`:'';
  el.textContent=done===0&&warmupDone===0?'Draft — not saved':`${done} / ${total} sets logged${warmupNote} · not saved`;
  el.style.color='';
}
function saveSession(){
  clearInterval(_durationTimer);
  const prevPRs=calcPRs(loadSessions());
  const sessions=loadSessions();
  const session=JSON.parse(JSON.stringify(draftSession));
  // Mark every set that has data as done so DB/history are consistent
  session.exercises.forEach(ex=>ex.sets.forEach(s=>{ s.done=isSetDone(s); }));
  // Random suffix on top of the timestamp so two sessions (same or different users)
  // saved in the same millisecond can't collide on this globally-unique id.
  session.id=Date.now()*1000+Math.floor(Math.random()*1000);
  session.endedAt=Date.now();
  session.duration=session.startedAt?Math.round((session.endedAt-session.startedAt)/60000):null;
  sessions.push(session); saveSessions(sessions);
  apiSyncSession(session); // sync to Postgres (fire-and-forget)
  draftSession.savedAt=Date.now();
  saveDraft(activeDate,draftSession);
  renderWeekGrid(); renderExerciseRows(session); updateSessionStatus();
  showCompletionSummary(session,prevPRs);
}
function showCompletionSummary(session,prevPRs){
  const doneSets=session.exercises.reduce((a,e)=>a+e.sets.filter(isWorkingSet).length,0);
  if(doneSets===0) return; // nothing logged, skip the summary
  const totalSets=session.exercises.reduce((a,e)=>a+e.sets.filter(s=>!s.warmup).length,0);
  const volume=session.exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>{
    if(!isWorkingSet(s)) return b;
    return b+(parseFloat(s.weight)||0)*(parseFloat(s.reps)||0);
  },0),0);
  const newPRs=[];
  session.exercises.forEach(ex=>{
    let bestW=0,bestReps=0;
    ex.sets.forEach(s=>{
      if(!isWorkingSet(s)) return;
      const w=parseFloat(s.weight);
      if(w>bestW){bestW=w;bestReps=parseInt(s.reps)||0;}
    });
    if(bestW>0&&bestW>(prevPRs[ex.name]?.weight||0))
      newPRs.push({name:ex.name,weight:bestW,reps:bestReps});
  });
  const day=getActiveDay(session.dayIdx)||{name:'Workout'};
  _completionSessionId=session.id;
  const prsHTML=newPRs.length
    ?`<div class="completion-prs"><div style="font-size:12px;font-weight:600;color:var(--amber);margin-bottom:5px">New PRs 🏆</div>${newPRs.map(p=>`<div class="completion-pr-chip">${escapeHtml(p.name)} — ${p.weight} ${getWeightUnit()} × ${p.reps}</div>`).join('')}</div>`
    :'';
  const moodEmojis=[{v:'great',e:'💪'},{v:'good',e:'😊'},{v:'tired',e:'😴'},{v:'rough',e:'😓'}];
  const moodHTML=`<div class="mood-section">
    <div class="mood-label">How did it feel?</div>
    <div class="mood-row">${moodEmojis.map(m=>`<button class="mood-btn" data-mood="${m.v}" onclick="saveMood('${m.v}')" title="${m.v}">${m.e}</button>`).join('')}</div>
  </div>`;
  document.getElementById('completion-content').innerHTML=`
    <div style="font-size:44px;margin-bottom:6px">${newPRs.length?'🏆':'✅'}</div>
    <div style="font-size:17px;font-weight:700;margin-bottom:3px">${escapeHtml(day.name)} Done!</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${new Date().toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})}</div>
    <div class="completion-stats">
      <div><div class="completion-stat-val">${doneSets}/${totalSets}</div><div class="completion-stat-lbl">Sets Done</div></div>
      ${volume>0?`<div><div class="completion-stat-val">${volume.toLocaleString()}</div><div class="completion-stat-lbl">${getWeightUnit()} Vol</div></div>`:''}
      ${session.duration>0?`<div><div class="completion-stat-val">${session.duration}</div><div class="completion-stat-lbl">Min</div></div>`:''}
    </div>
    ${prsHTML}
    ${moodHTML}`;
  document.getElementById('completion-modal').style.display='flex';
}
function closeCompletionModal(){
  document.getElementById('completion-modal').style.display='none';
}
function discardDraft(){
  if(!confirm('Reset this workout log and start fresh?')) return;
  clearDraft(activeDate); draftSession=initDraft(activeDayIdx,activeDate); renderDetail();
}
// ── Muscle volume tracker ─────────────────────────────────────────────────────
function calcWeeklyMuscleSets(){
  const now=new Date();
  const dow=now.getDay();
  const toMon=dow===0?-6:1-dow;
  const weekStart=new Date(now);
  weekStart.setDate(now.getDate()+toMon);
  weekStart.setHours(0,0,0,0);
  const weekStartStr=weekStart.toISOString().slice(0,10);
  const sets={};
  loadSessions().filter(s=>s.date>=weekStartStr).forEach(s=>{
    s.exercises.forEach(ex=>{
      const m=getExerciseMuscle(ex.name);
      if(!m||!MUSCLE_VOLUME_TARGETS[m]) return;
      const count=ex.sets.filter(isWorkingSet).length;
      if(count>0) sets[m]=(sets[m]||0)+count;
    });
  });
  return sets;
}
function renderMuscleVolumeSection(){
  const weekSets=calcWeeklyMuscleSets();
  const rows=Object.entries(MUSCLE_VOLUME_TARGETS).map(([m,t])=>{
    const sets=weekSets[m]||0;
    const color=MUSCLE_COLORS[m]||'#888';
    const pct=Math.min(100,(sets/t.max)*100);
    const minPct=(t.min/t.max)*100;
    const statusColor=sets===0?'var(--text3)':sets<t.min?'var(--amber)':sets<=t.max?'var(--green)':'var(--red)';
    return`<div class="mvol-row">
      <div class="mvol-label" style="color:${color}">${m}</div>
      <div class="mvol-track">
        <div class="mvol-fill" style="width:${pct}%;background:${color}"></div>
        <div class="mvol-min-line" style="left:${minPct}%"></div>
      </div>
      <div class="mvol-count" style="color:${statusColor}">${sets}</div>
      <div class="mvol-range">${t.min}–${t.max}</div>
    </div>`;
  }).join('');
  return`<div class="mvol-legend"><span class="mvol-leg-item"><span class="mvol-leg-dot" style="background:var(--amber)"></span>Under minimum</span><span class="mvol-leg-item"><span class="mvol-leg-dot" style="background:var(--green)"></span>In range</span><span class="mvol-leg-item" style="font-size:10px;color:var(--text3)">Line = minimum target</span></div><div class="mvol-grid">${rows}</div>`;
}
// ── Copy last workout ─────────────────────────────────────────────────────────
function copyLastWorkout(){
  if(!_lastSession){alert('No previous session found for this day.');return;}
  const flagged=draftSession.exercises
    .map(ex=>_lastSession.exercises.find(e=>e.name===ex.name))
    .filter(lastEx=>lastEx?.variantNote)
    .map(lastEx=>lastEx.name);
  const warning=flagged.length
    ?`\n\nSkipping ${flagged.length} exercise${flagged.length>1?'s':''} flagged as a different setup last time (${flagged.join(', ')}) — those numbers aren't comparable.`
    :'';
  if(!confirm('Copy all weights and reps from your last session?'+warning)) return;
  draftSession.exercises.forEach(ex=>{
    const lastEx=_lastSession.exercises.find(e=>e.name===ex.name);
    if(!lastEx||!lastEx.sets.length||lastEx.variantNote) return;
    ex.sets=lastEx.sets.map(s=>({...s,done:false}));
  });
  _markModified(); saveDraft(activeDate,draftSession);
  renderExerciseRows(_lastSession); updateSessionStatus();
}
