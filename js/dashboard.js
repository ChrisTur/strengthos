// ── Dashboard, stats, mood, deload suggestion, milestones, heatmap ──────────────────────────────────────────────

// ── Progress date-range filter ─────────────────────────────────────────────────
// Drives every section on the Progress page (stats, charts, muscle volume, PRs,
// exercise sparklines) instead of each one carrying its own hardcoded window —
// persisted per-profile-ish via plain localStorage keys since it's a personal
// viewing preference, not data worth syncing to the server.
let _progressRangePreset=localStorage.getItem('wt_progress_range')||'90d'; // '7d'|'30d'|'90d'|'year'|'all'|'custom'
let _progressRangeCustom={
  start:localStorage.getItem('wt_progress_range_start')||null,
  end:localStorage.getItem('wt_progress_range_end')||null,
};
function getProgressRange(){
  const today=localDateStr();
  if(_progressRangePreset==='all'){
    // A real bound (earliest logged session), not an open-ended null, so the
    // weekly charts and weeksForRange() below see "all time" as the actual
    // span of your history — otherwise "All" could show *fewer* weeks on the
    // chart than "This Year" does, which is backwards.
    const sessions=loadSessions();
    const earliest=sessions.reduce((min,s)=>!min||s.date<min?s.date:min,null);
    return{start:earliest||today,end:today};
  }
  if(_progressRangePreset==='year') return{start:today.slice(0,4)+'-01-01',end:today};
  if(_progressRangePreset==='custom') return{start:_progressRangeCustom.start||null,end:_progressRangeCustom.end||today};
  const days={'7d':7,'30d':30,'90d':90}[_progressRangePreset]||90;
  const d=new Date(); d.setDate(d.getDate()-(days-1));
  return{start:localDateStr(d),end:today};
}
function filterSessionsByRange(sessions,range){
  range=range||getProgressRange();
  return sessions.filter(s=>(!range.start||s.date>=range.start)&&(!range.end||s.date<=range.end));
}
function filterBWByRange(entries,range){
  range=range||getProgressRange();
  return entries.filter(e=>(!range.start||e.date>=range.start)&&(!range.end||e.date<=range.end));
}
// Weekly-bar charts stay readable regardless of how wide the range is — cap at
// 52 bars (a year) and always show at least 1, even for a 7-day window.
function weeksForRange(range){
  if(!range.start) return 12;
  const days=Math.round((new Date(range.end+'T00:00:00')-new Date(range.start+'T00:00:00'))/86400000)+1;
  return Math.min(Math.max(Math.ceil(days/7),1),52);
}
function setProgressRange(preset){
  _progressRangePreset=preset;
  localStorage.setItem('wt_progress_range',preset);
  if(preset==='custom'&&(!_progressRangeCustom.start||!_progressRangeCustom.end)){
    const d=new Date(); d.setDate(d.getDate()-29);
    _progressRangeCustom.start=_progressRangeCustom.start||localDateStr(d);
    _progressRangeCustom.end=_progressRangeCustom.end||localDateStr();
    localStorage.setItem('wt_progress_range_start',_progressRangeCustom.start);
    localStorage.setItem('wt_progress_range_end',_progressRangeCustom.end);
  }
  renderDashboard();
}
function setProgressRangeCustom(which,val){
  if(!val) return;
  _progressRangeCustom[which]=val;
  localStorage.setItem('wt_progress_range_'+which,val);
  renderDashboard();
}
function renderProgressRangeBar(){
  const range=getProgressRange();
  const presets=[['7d','7D'],['30d','30D'],['90d','90D'],['year','Year'],['all','All'],['custom','Custom']];
  const rangeText=range.start?`${formatDateShort(range.start)} – ${formatDateShort(range.end)}`:`Through ${formatDateShort(range.end)}`;
  return`<div class="progress-range-bar">
    <div class="dpw-row">
      ${presets.map(([id,label])=>`<button class="dpw-btn${_progressRangePreset===id?' selected':''}" onclick="setProgressRange('${id}')">${label}</button>`).join('')}
    </div>
    ${_progressRangePreset==='custom'?`
      <div class="progress-range-custom">
        <input type="date" value="${_progressRangeCustom.start||''}" max="${localDateStr()}" onchange="setProgressRangeCustom('start',this.value)">
        <span>to</span>
        <input type="date" value="${_progressRangeCustom.end||''}" max="${localDateStr()}" onchange="setProgressRangeCustom('end',this.value)">
      </div>`:''}
    <div class="progress-range-note">
      <span>${rangeText}</span>
      <button class="btn btn-sm" onclick="exportProgressRangeCSV()">⬇ Export range</button>
    </div>
  </div>`;
}

// ── Deload suggestion ─────────────────────────────────────────────────────────
function dismissDeloadSuggest(){
  const streak=calcStats(loadSessions()).weekStreak;
  localStorage.setItem('wt_deload_dismiss',String(streak));
  document.getElementById('deload-suggest-banner')?.remove();
}
// ── Session mood ──────────────────────────────────────────────────────────────
function saveMood(mood){
  const sessions=loadSessions();
  const s=sessions.find(s=>s.id===_completionSessionId);
  if(s){s.mood=mood;saveSessions(sessions);}
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));
}
// ── Milestone badges ──────────────────────────────────────────────────────────
const MILESTONES=[
  {id:'s1',   icon:'🎯', label:'First Session',  check:(sc)=>sc>=1},
  {id:'s10',  icon:'💪', label:'10 Sessions',    check:(sc)=>sc>=10},
  {id:'s25',  icon:'🔥', label:'25 Sessions',    check:(sc)=>sc>=25},
  {id:'s50',  icon:'🏅', label:'50 Sessions',    check:(sc)=>sc>=50},
  {id:'s100', icon:'🏆', label:'100 Sessions',   check:(sc)=>sc>=100},
  {id:'pr1',  icon:'🥇', label:'First PR',       check:(_,pc)=>pc>0},
  {id:'w4',   icon:'🔥', label:'4-Week Streak',  check:(_,__,w)=>w>=4},
  {id:'w8',   icon:'⚡', label:'8-Week Streak',  check:(_,__,w)=>w>=8},
  {id:'w12',  icon:'🌟', label:'12-Week Streak', check:(_,__,w)=>w>=12},
];
function renderMilestoneBadges(){
  const sessions=loadSessions();
  const prs=calcPRs(sessions);
  const {weekStreak}=calcStats(sessions);
  const sc=sessions.length, pc=Object.keys(prs).length;
  const earned=MILESTONES.filter(m=>m.check(sc,pc,weekStreak));
  const nextLocked=MILESTONES.filter(m=>!m.check(sc,pc,weekStreak)).slice(0,3);
  if(!earned.length&&!nextLocked.length) return'<div class="empty-state">Complete workouts to earn badges.</div>';
  const badge=(m,locked)=>`<div class="milestone-badge${locked?' locked':''}" title="${m.label}">
    <div class="milestone-icon">${locked?'🔒':m.icon}</div>
    <div class="milestone-label">${m.label}</div>
  </div>`;
  return`<div class="milestone-grid">${earned.map(m=>badge(m,false)).join('')}${nextLocked.map(m=>badge(m,true)).join('')}</div>`;
}
// ── Year heatmap ──────────────────────────────────────────────────────────────
function renderYearHeatmap(){
  const sessions=loadSessions();
  const countByDate={};
  sessions.forEach(s=>{countByDate[s.date]=(countByDate[s.date]||0)+1;});
  const today=new Date(TODAY+'T00:00:00');
  const start=new Date(today);
  start.setDate(today.getDate()-364);
  // Align start to Sunday
  start.setDate(start.getDate()-start.getDay());
  const cells=[];
  const d=new Date(start);
  while(d<=today){
    const ds=localDateStr(d);
    cells.push({date:ds,count:countByDate[ds]||0});
    d.setDate(d.getDate()+1);
  }
  const weeks=[];
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  const SZ=11,GAP=2,W=(SZ+GAP)*weeks.length,H=(SZ+GAP)*7+18;
  const fills=['var(--border2)','#3aab6d66','#3aab6d','#2d8a56'];
  const rects=weeks.map((week,wi)=>week.map((day,di)=>{
    const x=wi*(SZ+GAP),y=di*(SZ+GAP)+16;
    const fill=fills[Math.min(day.count,3)];
    return`<rect x="${x}" y="${y}" width="${SZ}" height="${SZ}" rx="2" fill="${fill}"><title>${day.date}${day.count?' — '+day.count+' session'+(day.count>1?'s':''):''}</title></rect>`;
  }).join('')).join('');
  const labels=[];
  weeks.forEach((week,wi)=>{
    if(!week[0]) return;
    const d2=new Date(week[0].date+'T00:00:00');
    if(d2.getDate()<=7) labels.push(`<text x="${wi*(SZ+GAP)}" y="11" font-size="9" fill="var(--text3)">${d2.toLocaleDateString([],{month:'short'})}</text>`);
  });
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;overflow:visible">${labels.join('')}${rects}</svg>`;
}
// ── Monthly summary ───────────────────────────────────────────────────────────
function renderMonthlySummary(){
  const sessions=loadSessions();
  const now=new Date();
  const thisMonthStr=localDateStr(now).slice(0,7);
  const lastMonthStr=localDateStr(new Date(now.getFullYear(),now.getMonth()-1,1)).slice(0,7);
  const thisM=sessions.filter(s=>s.date.startsWith(thisMonthStr));
  const lastM=sessions.filter(s=>s.date.startsWith(lastMonthStr));
  const calcVol=arr=>Math.round(arr.reduce((t,sess)=>t+sess.exercises.reduce((a,ex)=>a+ex.sets.reduce((b,s)=>{
    return isWorkingSet(s)?b+(parseFloat(s.weight)||0)*(parseFloat(s.reps)||0):b;
  },0),0),0));
  const thisSets=thisM.reduce((t,s)=>t+s.exercises.reduce((a,ex)=>a+ex.sets.filter(isWorkingSet).length,0),0);
  const thisVol=calcVol(thisM);
  const prsBase=calcPRs(sessions.filter(s=>!s.date.startsWith(thisMonthStr)));
  const prsNow=calcPRs(sessions);
  const newPRs=Object.keys(prsNow).filter(n=>!prsBase[n]||prsNow[n].weight>prsBase[n].weight).length;
  const trend=thisM.length>lastM.length?'↑':thisM.length<lastM.length?'↓':'→';
  const trendColor=thisM.length>=lastM.length?'var(--green)':'var(--red)';
  const monthName=now.toLocaleDateString([],{month:'long',year:'numeric'});
  return`<div class="monthly-grid">
    <div class="monthly-stat"><div class="monthly-val">${thisM.length}<span class="monthly-trend" style="color:${trendColor}">${trend}</span></div><div class="monthly-lbl">Sessions</div><div class="monthly-sub">vs ${lastM.length} last month</div></div>
    <div class="monthly-stat"><div class="monthly-val">${thisSets}</div><div class="monthly-lbl">Working Sets</div></div>
    ${thisVol>0?`<div class="monthly-stat"><div class="monthly-val">${thisVol.toLocaleString()}</div><div class="monthly-lbl">${getWeightUnit()} Volume</div></div>`:''}
    ${newPRs>0?`<div class="monthly-stat"><div class="monthly-val">${newPRs} 🏆</div><div class="monthly-lbl">New PRs</div></div>`:''}
  </div>`;
}
// ── Progress page ─────────────────────────────────────────────────────────────
function renderDashboard(){
  const range=getProgressRange();
  const allSessions=loadSessions();
  const sessions=filterSessionsByRange(allSessions,range);
  const stats=calcStats(sessions,allSessions);
  const consistency=calcConsistency(range);
  const numWeeks=weeksForRange(range);
  const weeks=calcWeeklyData(sessions,numWeeks);
  const maxCount=Math.max(...weeks.map(w=>w.count),1);

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
  const volSVG=renderVolumeSVG(weeks);

  // Body weight section — "Latest" always reflects true latest regardless of
  // range (it's a current-state fact, not a historical metric), the chart
  // and chips are scoped to the range like everything else.
  const bwAll=loadBW();
  const latestBW=bwAll.length?bwAll[bwAll.length-1]:null;
  const bwEntries=filterBWByRange(bwAll,range);
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
    ${renderProgressRangeBar()}

    <div class="dash-section-title">Overview — ${getActiveProfile()}</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Sessions in Range</div></div>
      <div class="stat-card"><div class="stat-value">${stats.thisWeek}</div><div class="stat-label">This Week</div></div>
      <div class="stat-card"><div class="stat-value">${stats.weekStreak}</div><div class="stat-label">Week Streak</div>
        <div class="stat-sub">${stats.weekStreak>0?'🔥 Keep it up!':'Log to start'}</div></div>
      <div class="stat-card"><div class="stat-value">${stats.topDay}</div><div class="stat-label">Most Trained</div>
        <div class="stat-sub">${stats.topDayCount>0?stats.topDayCount+' sessions':''}</div></div>
      ${consistency?`<div class="stat-card"><div class="stat-value">${consistency.pct}%</div><div class="stat-label">Consistency</div>
        <div class="stat-sub">${consistency.trained}/${consistency.scheduled} scheduled days</div></div>`:''}
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
        <div style="font-size:14px;font-weight:600">${nextDay.dow} — ${escapeHtml(nextDay.name)}</div>
        <div style="display:flex;gap:4px;margin-top:6px">${nextDay.dots.map(c=>`<div class="dot" style="background:${c};width:8px;height:8px"></div>`).join('')}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:6px">${nextDay.tags.join(' · ')}</div>
        <button class="btn btn-sm btn-green" onclick="jumpToNextSuggested()" style="margin-top:10px;font-size:11px">Go to this workout →</button>
      </div>
    </div>

    <div class="dash-section-title">Weekly Sessions — Last ${numWeeks} Week${numWeeks!==1?'s':''}</div>
    <div class="chart-wrap">
      <div class="freq-bars">${barsHTML}</div>
      <div class="freq-labels">${labelsHTML}</div>
    </div>

    <div class="dash-section-title">Weekly Volume — Last ${numWeeks} Week${numWeeks!==1?'s':''} <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3);font-size:10px">(${getWeightUnit()} × reps, completed sets)</span></div>
    <div class="chart-wrap">${volSVG}</div>

    <div class="dash-section-title">This Month</div>
    <div class="chart-wrap">${renderMonthlySummary()}</div>

    <div class="dash-section-title">Muscle Volume <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3);font-size:10px">(avg working sets/week in range, trend = last ${Math.min(numWeeks,12)} weeks)</span></div>
    <div class="chart-wrap">${renderMuscleVolumeSection(range)}</div>

    <div class="dash-section-title">Training Year</div>
    <div class="chart-wrap" style="overflow-x:auto">${renderYearHeatmap()}</div>

    <div class="dash-section-title">Milestones</div>
    <div class="chart-wrap">${renderMilestoneBadges()}</div>

    <div class="dash-section-title">Body Weight</div>
    <div class="chart-wrap">
      <div class="bw-row">
        <span style="font-size:13px;color:var(--text2)">${latestBW?`<strong style="color:var(--text)">${latestBW.weight} ${getWeightUnit()}</strong> · ${formatDateShort(latestBW.date)}`:'No entries yet'}</span>
        <button class="btn btn-sm" onclick="openBWModal()">+ Log weight</button>
      </div>
      ${bwSVG}
      ${bwEntries.length?`<div class="bw-chips">${bwChips}</div>`:''}
    </div>

    <div class="dash-section-title">Exercise Progress</div>
    <div id="progress-section">${renderExerciseProgressSection()}</div>`;
}
// `sessions` is whatever the current date-range filter selected — total/
// thisWeek/topDay all respect it. `allSessions` (defaulting to `sessions`
// for callers that don't care about ranges) always drives weekStreak, since
// "current momentum" only means something computed from the real, unfiltered
// history — a 7-day range shouldn't make a 12-week streak look like it reset.
function calcStats(sessions,allSessions){
  allSessions=allSessions||sessions;
  const today=localDateStr();
  const weekAgo=localDateStr(new Date(Date.now()-6*86400000));
  const thisWeek=sessions.filter(s=>s.date>=weekAgo&&s.date<=today).length;
  // Week streak — consecutive Mon-Sun calendar weeks with ≥1 session
  const now=new Date();
  const dow=now.getDay(),toMon=dow===0?-6:1-dow;
  const curMon=new Date(now); curMon.setDate(now.getDate()+toMon); curMon.setHours(0,0,0,0);
  let weekStreak=0;
  const wk=new Date(curMon);
  while(true){
    const ws=localDateStr(wk);
    const we=new Date(wk); we.setDate(wk.getDate()+7);
    const weStr=localDateStr(we);
    if(!allSessions.some(s=>s.date>=ws&&s.date<weStr)) break;
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
// % of scheduled training days (per your current program, excluding rest
// days) that actually got logged within the range — a real adherence metric,
// unlike weekStreak which only cares whether a week had *any* session at all.
function calcConsistency(range){
  if(!range.start) return null;
  const start=new Date(range.start+'T00:00:00'), end=new Date(range.end+'T00:00:00');
  if(end<start) return null;
  let scheduled=0,trained=0;
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const ds=localDateStr(d);
    if(getWorkoutForDate(ds)===REST_DAY) continue;
    scheduled++;
    if(hasLoggedOnDate(ds)) trained++;
  }
  return scheduled>0?{pct:Math.round((trained/scheduled)*100),trained,scheduled}:null;
}
function calcWeeklyData(sessions,numWeeks){
  const now=new Date(),dow=now.getDay(),toMon=dow===0?-6:1-dow;
  const wsStart=new Date(now); wsStart.setDate(now.getDate()+toMon); wsStart.setHours(0,0,0,0);
  const weeks=[];
  for(let i=numWeeks-1;i>=0;i--){
    const ws=new Date(wsStart); ws.setDate(wsStart.getDate()-i*7);
    const we=new Date(ws); we.setDate(ws.getDate()+7);
    const wsStr=localDateStr(ws),weStr=localDateStr(we);
    let count=0,vol=0;
    sessions.forEach(s=>{
      if(s.date<wsStr||s.date>=weStr) return; count++;
      s.exercises.forEach(ex=>ex.sets.forEach(set=>{
        if(!isWorkingSet(set)) return;
        vol+=(parseFloat(set.weight)||0)*(parseFloat(set.reps)||0);
      }));
    });
    weeks.push({label:(ws.getMonth()+1)+'/'+ws.getDate(),count,vol});
  }
  return weeks;
}
