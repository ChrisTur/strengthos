/**
 * StrengthOS — localStorage Export
 *
 * Paste this entire script into your browser console (F12 → Console)
 * while the app is open. It downloads a JSON file you can then pass
 * to the seed script:
 *
 *   node scripts/seed.js strengthos-export-Me.json you@example.com yourpassword
 */
(function exportStrengthOS() {
  const profile = localStorage.getItem('wt_active_profile') || 'Me';

  function get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  const data = {
    profile,
    exportedAt: new Date().toISOString(),
    sessions:     get('wt_sessions_v2_' + profile, []),
    goal:         localStorage.getItem('wt_goal_'    + profile) || '',
    dpw:          parseInt(localStorage.getItem('wt_dpw_' + profile) || '5', 10),
    weightUnit:   localStorage.getItem('wt_unit') || 'lbs',
    cardioLevel:  localStorage.getItem('wt_cardio_'  + profile) || 'moderate',
    equipment:    get('wt_equip_'      + profile, null),
    disliked:     get('wt_disliked_'   + profile, []),
    deload:       !!localStorage.getItem('wt_deload_' + profile),
    weekTemplate: get('wt_weektemplate_' + profile, null),
    customDays:   get('wt_customdays_'  + profile, {}),
    schedule:     get('wt_schedule_'    + profile, {}),
    bodyWeight:   get('wt_bw_'          + profile, []),
    aiPlan:       get('wt_aiplan_'      + profile, null),
  };

  const json     = JSON.stringify(data, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = 'strengthos-export-' + profile + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ Exported ' + data.sessions.length + ' sessions for profile "' + profile + '"');
  console.log('👉 Run:  node scripts/seed.js strengthos-export-' + profile + '.json you@example.com yourpassword');
})();
