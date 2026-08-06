// ── Progress charts, PR calc, exercise history, SVG sparklines ──────────────────────────────────────────────

let _progressMuscle=null, _progressExSearch='';
function renderExerciseProgressSection(){
  const muscles=Object.keys(EXERCISE_LIBRARY);
  const tabsHTML=`<div class="prog-muscle-tabs" id="progress-tabs">
    ${['All',...muscles].map(m=>{
      const active=m==='All'?!_progressMuscle:_progressMuscle===m;
      const col=m==='All'?'var(--accent)':(MUSCLE_COLORS[m]||'#888');
      const style=active?`background:${col};color:#fff;border-color:${col}`:`color:${col};border-color:${col}`;
      const arg=m==='All'?'null':`'${m}'`;
      return`<button class="muscle-filter-tab" style="${style}" onclick="setProgressMuscle(${arg})">${m}</button>`;
    }).join('')}
  </div>`;
  const searchHTML=`<div class="prog-search-wrap">
    <input class="prog-search-input" id="prog-search-input" type="text" placeholder="Search exercises…"
      oninput="setProgressSearch(this.value)">
    <button class="prog-search-clear" id="prog-search-clear" style="display:none" onclick="setProgressSearch('')">✕</button>
  </div>`;
  return`${tabsHTML}${searchHTML}<div id="progress-results">${renderProgressResults()}</div>`;
}
function renderProgressResults(){
  const sessions=loadSessions();
  const prs=calcPRs(sessions);
  const unit=getWeightUnit();
  const loggedNames=new Set();
  sessions.forEach(s=>s.exercises.forEach(e=>{
    if(e.sets&&e.sets.some(isSetDone)) loggedNames.add(e.name);
  }));
  const q=_progressExSearch.trim().toLowerCase();

  let pool=[];
  if(q){
    pool=[...loggedNames].filter(n=>n.toLowerCase().includes(q));
  } else if(_progressMuscle){
    const libNames=new Set((EXERCISE_LIBRARY[_progressMuscle]||[]).map(e=>e.name));
    pool=[...loggedNames].filter(n=>libNames.has(n)||getExerciseMuscle(n)===_progressMuscle);
  }

  if(!q&&!_progressMuscle){
    const prEntries=Object.entries(prs).map(([name,pr])=>{
      const e1rm=Math.round(parseFloat(pr.weight)*(1+(parseInt(pr.reps)||0)/30)*4)/4;
      return{name,...pr,e1rm,muscle:getExerciseMuscle(name)||'Other'};
    }).sort((a,b)=>b.e1rm-a.e1rm);
    const muscleGroups=[...new Set(prEntries.map(e=>e.muscle))].sort();
    return prEntries.length===0
      ?'<div class="empty-state" style="padding:24px 0">No data yet — complete workouts to see your PRs here.</div>'
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
  }

  if(!pool.length) return'<div class="empty-state" style="padding:24px 0">No logged exercises match this filter.</div>';

  return`<div class="prog-ex-grid">${pool.map(name=>{
    const history=getExerciseHistory(name);
    const pr=prs[name];
    const e1rm=pr?Math.round(parseFloat(pr.weight)*(1+(parseInt(pr.reps)||0)/30)*4)/4:null;
    const muscle=getExerciseMuscle(name)||(_progressMuscle||'');
    const color=MUSCLE_COLORS[muscle]||'#888';
    const safe=name.replace(/'/g,"\\'");
    const trend=history.length>=2?(history[history.length-1].e1rm>history[0].e1rm?'↑':'→'):'';
    const trendColor=trend==='↑'?'var(--green)':'var(--text3)';
    return`<div class="prog-ex-card" onclick="openProgressModal('${safe}')">
      <div class="prog-ex-card-header">
        <div style="flex:1;min-width:0">
          <div class="prog-ex-card-name">${name}</div>
          <div class="prog-ex-card-meta">
            <span style="color:${color};font-size:10px;font-weight:700;text-transform:uppercase">${muscle}</span>
            ${pr?`<span style="color:var(--text3)">·</span><span>PR: <strong>${pr.weight} ${unit} × ${pr.reps}</strong></span>`:''}
            ${e1rm?`<span style="color:var(--text3)">·</span><span>~${e1rm} ${unit} 1RM</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:18px;font-weight:700;color:${trendColor}">${trend}</div>
          <div style="font-size:10px;color:var(--text3)">${history.length} session${history.length!==1?'s':''}</div>
        </div>
      </div>
      <div class="prog-ex-sparkline">${renderSparklineSVG(history)}</div>
    </div>`;
  }).join('')}</div>`;
}
function setProgressMuscle(muscle){
  _progressMuscle=muscle; _progressExSearch='';
  document.getElementById('progress-section').innerHTML=renderExerciseProgressSection();
}
function setProgressSearch(q){
  _progressExSearch=q; _progressMuscle=null;
  const res=document.getElementById('progress-results');
  if(res) res.innerHTML=renderProgressResults();
  const clr=document.getElementById('prog-search-clear');
  if(clr) clr.style.display=q?'':'none';
}
function renderSparklineSVG(history){
  if(history.length<2) return`<div style="height:44px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text3)">Not enough data</div>`;
  const W=320,H=44,PAD=6;
  const vals=history.map(h=>h.e1rm);
  const minV=Math.min(...vals), maxV=Math.max(...vals), range=maxV-minV||1;
  const pts=history.map((h,i)=>({
    x:PAD+(i/(history.length-1))*(W-2*PAD),
    y:H-PAD-((h.e1rm-minV)/range)*(H-2*PAD),
    ...h
  }));
  const line=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area=line+` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const dots=pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.e1rm===maxV?3.5:2}" fill="${p.e1rm===maxV?'var(--green)':'var(--accent)'}"><title>${formatDateShort(p.date)}: ${p.bestWeight}${getWeightUnit()} × ${p.reps} (est. 1RM ${p.e1rm})</title></circle>`).join('');
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:44px" preserveAspectRatio="none">
    <defs><linearGradient id="spk_${W}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".2"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#spk_${W})"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
  </svg>`;
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
function calcPRs(sessions){
  const prs={};
  [...sessions].sort((a,b)=>a.date.localeCompare(b.date)).forEach(session=>{
    session.exercises.forEach(ex=>{
      if(ex.variantNote) return; // different equipment/setup — not a comparable PR
      ex.sets.forEach(set=>{
        if(!isWorkingSet(set)) return;
        const w=parseFloat(set.weight); if(isNaN(w)||w<=0) return;
        const r=parseInt(set.reps)||0;
        const e1rm=Math.round(w*(1+r/30)*4)/4;
        if(!prs[ex.name]||e1rm>prs[ex.name].e1rm)
          prs[ex.name]={weight:w, reps:set.reps, date:session.date, e1rm};
      });
    });
  });
  return prs;
}
// ── Exercise progress chart ───────────────────────────────────────────────────
function calcSetE1rm(w,r){ return Math.round(w*(1+(r/30))*4)/4; }
function getExerciseHistory(name){
  return loadSessions()
    .filter(s=>s.exercises.some(e=>e.name===name))
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(s=>{
      const ex=s.exercises.find(e=>e.name===name);
      const done=ex.sets.filter(isWorkingSet);
      if(!done.length) return null;
      // Best set = highest estimated 1RM (captures both weight and rep improvements)
      const bestSet=done.reduce((best,set)=>{
        const e=calcSetE1rm(parseFloat(set.weight),parseInt(set.reps)||0);
        return(!best||e>best.e1rm)?{...set,e1rm:e}:best;
      },null);
      const volume=done.reduce((sum,set)=>sum+parseFloat(set.weight)*(parseInt(set.reps)||0),0);
      return{date:s.date, bestWeight:parseFloat(bestSet.weight), reps:parseInt(bestSet.reps)||0, volume, e1rm:bestSet.e1rm};
    })
    .filter(Boolean);
}
function renderExerciseProgressSVG(history){
  if(history.length<2) return '<p style="text-align:center;color:var(--text3);padding:24px 0;font-size:13px">Log at least 2 sessions to see progress.</p>';
  const W=500,H=100,PAD=14,LH=16;
  const vals=history.map(h=>h.e1rm);
  const minV=Math.min(...vals), maxV=Math.max(...vals), range=maxV-minV||1;
  const pts=history.map((h,i)=>({
    x:PAD+(i/(history.length-1||1))*(W-2*PAD),
    y:H-PAD-((h.e1rm-minV)/range)*(H-2*PAD),
    ...h
  }));
  const linePath=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath=linePath+` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const step=Math.ceil(history.length/7);
  const labels=pts.filter((_,i)=>i%step===0||i===pts.length-1)
    .map(p=>`<text x="${p.x.toFixed(1)}" y="${H+LH-2}" text-anchor="middle" font-size="9" fill="var(--text3)">${fmtShort(p.date)}</text>`).join('');
  const dots=pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.e1rm===maxV?4.5:3}" fill="${p.e1rm===maxV?'var(--green)':'var(--accent)'}"><title>${formatDateShort(p.date)}: ${p.bestWeight}${getWeightUnit()} × ${p.reps} (est. 1RM ${p.e1rm})</title></circle>`).join('');
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
  const e1rm=pr?(pr.e1rm||Math.round(parseFloat(pr.weight)*(1+(parseInt(pr.reps)||0)/30)*4)/4):null;
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
        if(!isWorkingSet(set)) return;
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
