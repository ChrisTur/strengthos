// ── CSV/JSON export, import modal ──────────────────────────────────────────────

// ── Export / Import ───────────────────────────────────────────────────────────
function exportCSV(){
  const sessions=loadSessions(); if(!sessions.length){alert('No sessions to export.');return}
  const rows=[['Date','Day','Exercise','Set',`Weight (${getWeightUnit()})`,'Reps','Completed','Session Notes']];
  sessions.forEach(s=>{
    const day=(s.dayIdx>=0?(getActiveDay(s.dayIdx)||DAYS[s.dayIdx]):null)||{name:'Unknown'};
    s.exercises.forEach(ex=>{
      ex.sets.forEach((set,si)=>{
        rows.push([s.date,day.name,ex.name,si+1,set.weight,set.reps,isSetDone(set)?'Yes':'No',s.notes||'']);
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
