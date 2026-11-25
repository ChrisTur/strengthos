// ── XP, levels & ranks ────────────────────────────────────────────────────────
// Everything here is *derived* from logged sessions — no XP total is stored or
// synced. That means XP is identical on every device, needs no schema change,
// survives a reinstall, and can never drift from the history it's built from.
// Every rule only looks backwards in time (a session's XP depends on it and
// earlier sessions only), so your level never drops unless you delete a workout.

const XP_RULES={
  workout:50,          // first finished session on a given date
  perSet:3,            // per working set (warm-ups don't count)
  maxSetXP:90,         // per session — 30 sets; junk volume doesn't farm XP
  perCardioMin:1,      // timed work (runs, rows, mobility…)
  maxCardioXP:60,
  pr:25,               // beat your previous best weight on an exercise
  bonusWorkout:BONUS_XP,
  hatTrick:75,         // 3rd training day in a Mon–Sun week
  beastWeek:75,        // 5th training day in a Mon–Sun week
  streakPerWeek:5,     // per session, for each straight week trained before this one
  maxStreak:50,
};

// XP needed to go from level L to L+1. Early levels come fast (~1 per workout
// at first), then it settles into roughly one level every week or two of
// consistent training.
function xpToNextLevel(level){
  const n=level-1;
  return Math.round((100+50*n+6*n*n)/10)*10;
}

const XP_RANKS=[
  {min:1, name:'Rookie',        icon:'🌱'},
  {min:3, name:'Apprentice',    icon:'🔨'},
  {min:5, name:'Regular',       icon:'💪'},
  {min:8, name:'Iron Disciple', icon:'⚙️'},
  {min:12,name:'Grinder',       icon:'🔥'},
  {min:16,name:'Veteran',       icon:'🛡️'},
  {min:20,name:'Elite',         icon:'⚔️'},
  {min:25,name:'Titan',         icon:'🗿'},
  {min:30,name:'Legend',        icon:'👑'},
  {min:40,name:'Mythic',        icon:'🐉'},
];
function rankForLevel(level){ return [...XP_RANKS].reverse().find(r=>level>=r.min)||XP_RANKS[0] }
function nextRankAfter(level){ return XP_RANKS.find(r=>r.min>level)||null }

function levelInfo(totalXP){
  let level=1, rem=Math.max(0,Math.floor(totalXP||0));
  while(rem>=xpToNextLevel(level)){ rem-=xpToNextLevel(level); level++; }
  const need=xpToNextLevel(level);
  return {level,into:rem,need,pct:rem/need,total:Math.max(0,Math.floor(totalXP||0)),rank:rankForLevel(level),nextRank:nextRankAfter(level)};
}

function _xpWeekKey(date){
  const d=new Date(date+'T00:00:00');
  d.setDate(d.getDate()-((d.getDay()+6)%7)); // back to Monday
  return localDateStr(d);
}
function _xpPrevWeekKey(wk){ const d=new Date(wk+'T00:00:00'); d.setDate(d.getDate()-7); return localDateStr(d); }

// Walks every session oldest → newest and returns per-session XP breakdowns
// plus the running total. `byId[id].items` is the itemised list shown on the
// completion screen, so what you're told you earned is exactly what's counted.
function computeXPLedger(sessions){
  const R=XP_RULES;
  const sorted=(sessions||[]).filter(s=>s&&s.date&&Array.isArray(s.exercises))
    .slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||(Number(a.id)||0)-(Number(b.id)||0));
  const best={}, datesSeen=new Set(), weekDates={}, weeksTrained=new Set();
  const byId={}, list=[];
  let total=0;
  for(const s of sorted){
    let sets=0, mins=0;
    const prs=[];
    for(const ex of s.exercises){
      const exSets=Array.isArray(ex.sets)?ex.sets:[];
      if(isCardioExercise(ex.name)){
        const c=exSets[0];
        if(c&&isSetDone(c)){ sets++; mins+=parseFloat(c.duration)||0; }
        continue;
      }
      const working=exSets.filter(isWorkingSet);
      sets+=working.length;
      if(!working.length) continue;
      const key=canonicalExerciseName(ex.name);
      const top=Math.max(...working.map(x=>parseFloat(x.weight)||0));
      if(top>0&&best[key]>0&&top>best[key]) prs.push({name:ex.name,weight:top});
      if(top>(best[key]||0)) best[key]=top;
    }
    if(sets===0) continue; // nothing actually logged → no XP (and no PR baseline change above)

    const items=[];
    const firstToday=!datesSeen.has(s.date);
    datesSeen.add(s.date);
    if(firstToday) items.push({label:'Workout complete',xp:R.workout});
    items.push({label:`${sets} set${sets!==1?'s':''} logged`,xp:Math.min(sets*R.perSet,R.maxSetXP)});
    if(mins>0) items.push({label:`${Math.round(mins)} min of cardio`,xp:Math.min(Math.round(mins*R.perCardioMin),R.maxCardioXP)});
    prs.forEach(p=>items.push({label:`PR — ${p.name}`,xp:R.pr,pr:true}));
    if(firstToday&&isBonusDayIdx(s.dayIdx)) items.push({label:'Bonus workout',xp:R.bonusWorkout});

    const wk=_xpWeekKey(s.date);
    const wd=weekDates[wk]||(weekDates[wk]=new Set());
    const before=wd.size; wd.add(s.date);
    if(before<3&&wd.size>=3) items.push({label:'Hat-trick week (3 days)',xp:R.hatTrick});
    if(before<5&&wd.size>=5) items.push({label:'Beast week (5 days)',xp:R.beastWeek});
    if(firstToday){
      let streak=0;
      for(let k=_xpPrevWeekKey(wk);weeksTrained.has(k);k=_xpPrevWeekKey(k)) streak++;
      if(streak>0) items.push({label:`${streak+1}-week streak`,xp:Math.min(streak*R.streakPerWeek,R.maxStreak)});
    }
    weeksTrained.add(wk);

    const xp=items.reduce((a,i)=>a+i.xp,0);
    total+=xp;
    const entry={id:s.id,date:s.date,dayIdx:s.dayIdx,xp,items,totalAfter:total};
    byId[s.id]=entry; list.push(entry);
  }
  return {total,byId,list};
}

function getTotalXP(){ return computeXPLedger(loadSessions()).total }

// ── Header badge ──────────────────────────────────────────────────────────────
function renderXPBadge(){
  const el=document.getElementById('xp-badge'); if(!el) return;
  const info=levelInfo(getTotalXP());
  el.innerHTML=`<span class="xp-badge-lv">${info.rank.icon} Lv ${info.level}</span><span class="xp-badge-bar"><span style="width:${Math.round(info.pct*100)}%"></span></span>`;
  el.title=`${info.rank.name} · ${info.into.toLocaleString()} / ${info.need.toLocaleString()} XP to level ${info.level+1}`;
}

// ── Live XP for the workout in progress ──────────────────────────────────────
// Scores the current draft as if it were saved now, against every *other*
// session — the same calculation the completion screen will use.
function draftSessionXP(draft){
  if(!draft) return null;
  const id=draft.savedSessionId!=null?draft.savedSessionId:'__draft__';
  const others=loadSessions().filter(s=>s.id!==draft.savedSessionId);
  const ledger=computeXPLedger([...others,{...draft,id}]);
  return ledger.byId[id]||{xp:0,items:[]};
}

// Floating "+N XP" that rises off whatever you just touched.
function xpFloat(anchor,text,cls){
  if(!anchor||!anchor.getBoundingClientRect) return;
  const r=anchor.getBoundingClientRect();
  if(!r.width&&!r.height) return;
  const f=document.createElement('div');
  f.className='xp-float'+(cls?' '+cls:'');
  f.textContent=text;
  f.style.left=(r.left+r.width/2)+'px';
  f.style.top=(r.top)+'px';
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),1100);
}

// ── Completion-screen XP block ───────────────────────────────────────────────
function renderCompletionXP(session){
  const all=loadSessions();
  const after=computeXPLedger(all);
  const beforeTotal=computeXPLedger(all.filter(s=>s.id!==session.id)).total;
  const mine=after.byId[session.id];
  if(!mine) return '';
  const b=levelInfo(beforeTotal), a=levelInfo(after.total);
  const leveled=a.level>b.level;
  const newRank=leveled&&a.rank.name!==b.rank.name;
  const items=mine.items.map(i=>`<div class="xp-item${i.pr?' xp-item-pr':''}"><span>${escapeHtml(i.label)}</span><span>+${i.xp}</span></div>`).join('');
  return `<div class="xp-complete${leveled?' xp-leveled':''}">
    ${leveled?`<div class="xp-levelup">
        <div class="xp-levelup-burst">LEVEL UP!</div>
        <div class="xp-levelup-lv">${a.rank.icon} Level ${a.level}</div>
        ${newRank?`<div class="xp-levelup-rank">New rank: <strong>${escapeHtml(a.rank.name)}</strong></div>`:''}
      </div>`:''}
    <div class="xp-gain">+${mine.xp} XP</div>
    <div class="xp-items">${items}</div>
    <div class="xp-level-row">
      <span>${a.rank.icon} Lv ${a.level}</span>
      <div class="xp-track"><div class="xp-fill" data-from="${leveled?0:Math.round(b.pct*100)}" data-to="${Math.round(a.pct*100)}" style="width:${leveled?0:Math.round(b.pct*100)}%"></div></div>
      <span>Lv ${a.level+1}</span>
    </div>
    <div class="xp-level-sub">${a.into.toLocaleString()} / ${a.need.toLocaleString()} XP</div>
  </div>`;
}
// Called once the completion modal is on screen, so the bar visibly fills.
function animateCompletionXP(){
  const fill=document.querySelector('#completion-content .xp-fill'); if(!fill) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ fill.style.width=fill.dataset.to+'%'; }));
  if(document.querySelector('#completion-content .xp-leveled')&&navigator.vibrate) navigator.vibrate([30,40,30,40,60]);
}

// ── Progress-tab level card ──────────────────────────────────────────────────
function renderXPCard(){
  const ledger=computeXPLedger(loadSessions());
  const info=levelInfo(ledger.total);
  const recent=ledger.list.slice(-5).reverse().map(e=>{
    const day=getActiveDay(e.dayIdx)||{name:e.dayIdx===REST_DAY?'Rest-day session':'Workout'};
    return `<div class="xp-recent-row"><span class="xp-recent-date">${formatDateShort(e.date)}</span><span class="xp-recent-name">${escapeHtml(day.name)}</span><span class="xp-recent-xp">+${e.xp}</span></div>`;
  }).join('');
  const R=XP_RULES;
  const rules=[
    ['Finish a workout',`+${R.workout}`],
    ['Each working set',`+${R.perSet} (max ${R.maxSetXP})`],
    ['Each minute of cardio',`+${R.perCardioMin} (max ${R.maxCardioXP})`],
    ['Beat a personal record',`+${R.pr} each`],
    ['Complete a bonus workout',`+${R.bonusWorkout}`],
    ['3rd training day in a week',`+${R.hatTrick}`],
    ['5th training day in a week',`+${R.beastWeek}`],
    ['Weekly streak',`+${R.streakPerWeek}/week (max ${R.maxStreak})`],
  ].map(([k,v])=>`<div class="xp-rule"><span>${k}</span><span>${v}</span></div>`).join('');
  return `<div class="xp-card">
    <div class="xp-card-top">
      <div class="xp-card-icon">${info.rank.icon}</div>
      <div class="xp-card-main">
        <div class="xp-card-level">Level ${info.level} <span class="xp-card-rank">${escapeHtml(info.rank.name)}</span></div>
        <div class="xp-track xp-track-lg"><div class="xp-fill" style="width:${Math.round(info.pct*100)}%"></div></div>
        <div class="xp-card-sub">${info.into.toLocaleString()} / ${info.need.toLocaleString()} XP to level ${info.level+1} · ${info.total.toLocaleString()} XP total</div>
        ${info.nextRank?`<div class="xp-card-next">Next rank: ${info.nextRank.icon} ${escapeHtml(info.nextRank.name)} at level ${info.nextRank.min}</div>`:''}
      </div>
    </div>
    ${recent?`<div class="xp-recent"><div class="xp-recent-title">Recent XP</div>${recent}</div>`:'<div class="xp-card-sub" style="margin-top:10px">Finish a workout to earn your first XP.</div>'}
    <details class="xp-rules"><summary>How to earn XP</summary>${rules}</details>
  </div>`;
}
