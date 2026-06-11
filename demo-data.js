/**
 * StrengthOS — Demo Data Loader
 *
 * Paste this entire script into your browser console (F12 → Console tab)
 * while the app is open. Then refresh the page and switch to the "Alex" profile.
 *
 * Creates ~44 sessions across 12 weeks (Mar 2 – May 29, 2026)
 * with clear progressive overload, a deload week, a few missed sessions,
 * and notes — enough to populate all charts and the PR board.
 */
(function loadDemoData() {

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Round to nearest 2.5
  function r25(n) { return Math.round(n / 2.5) * 2.5; }

  // Progressive weight: base + increments per 3-week block, capped during deload
  function pw(base, inc, week, deload) {
    const raw = base + Math.floor(week / 3) * inc;
    return deload ? r25(raw * 0.75) : r25(raw);
  }

  // ISO date from a Monday + offset in days
  function dateStr(monday, offsetDays) {
    const d = new Date(monday);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  // Build a set array (all done)
  function sets(weightRepsPairs) {
    return weightRepsPairs.map(([w, r]) => ({ weight: String(w), reps: String(r), done: true }));
  }

  // ── Program ────────────────────────────────────────────────────────────────
  // Mon=dayIdx 0 (Chest+Tri), Tue=dayIdx 1 (Back+Bi),
  // Thu=dayIdx 3 (Shoul+Tri), Fri=dayIdx 4 (Chest+Arms)
  // Occasional Sat=dayIdx 5 (Legs+Back)

  function buildSession(date, dayIdx, week, deload, notes) {
    const w = week;
    const d = deload;
    let exercises = [];

    if (dayIdx === 0) { // Chest + Triceps
      const cp = pw(130, 7.5, w, d);
      exercises = [
        { name: 'Chest Press (machine)', sets: sets([[cp-10,10],[cp-5,10],[cp,10],[cp+5, d?10:Math.max(6,10-Math.floor(w/5))]]) },
        { name: 'Incline DB Press',      sets: sets([[pw(100,5,w,d),10],[pw(105,5,w,d),10],[pw(110,5,w,d),8]]) },
        { name: 'Chest Fly',             sets: sets([[pw(130,5,w,d),10],[pw(135,5,w,d),10],[pw(140,5,w,d),10]]) },
        { name: 'Tricep Cable Pushdown', sets: sets([[pw(55,2.5,w,d),12],[pw(60,2.5,w,d),12],[pw(65,2.5,w,d),10]]) },
        { name: 'Tricep Dips (machine)', sets: sets([[pw(90,5,w,d),12],[pw(95,5,w,d),12],[pw(100,5,w,d),10]]) },
      ];
    }

    if (dayIdx === 1) { // Back + Biceps
      exercises = [
        { name: 'Lat Pulldown',         sets: sets([[pw(99,5.5,w,d),10],[pw(110,5.5,w,d),10],[pw(116.5,5.5,w,d),10],[pw(121,5.5,w,d),8]]) },
        { name: 'Cable Seated Row',     sets: sets([[pw(110,5,w,d),10],[pw(115,5,w,d),10],[pw(121,5,w,d),8]]) },
        { name: 'Machine Row',          sets: sets([[pw(90,5,w,d),10],[pw(95,5,w,d),10],[pw(100,5,w,d),10]]) },
        { name: 'Hammer Curls',         sets: sets([[pw(22.5,2.5,w,d),12],[pw(25,2.5,w,d),12],[pw(27.5,2.5,w,d),10]]) },
        { name: 'Barbell / Cable Curls',sets: sets([[pw(20,2.5,w,d),10],[pw(22.5,2.5,w,d),10],[pw(25,2.5,w,d),8]]) },
      ];
    }

    if (dayIdx === 2) { // Chest + Biceps (occasional swap)
      const cp = pw(125, 5, w, d);
      exercises = [
        { name: 'Chest Press (machine)',   sets: sets([[cp,12],[cp+5,12],[cp+10,10],[cp+10,8]]) },
        { name: 'Chest Fly',               sets: sets([[pw(120,5,w,d),11],[pw(130,5,w,d),11],[pw(140,5,w,d),10],[pw(150,5,w,d),8]]) },
        { name: 'Incline Fly or Pec Deck', sets: sets([[pw(110,5,w,d),12],[pw(115,5,w,d),12],[pw(120,5,w,d),12]]) },
        { name: 'Bicep Curls',             sets: sets([[pw(22.5,2.5,w,d),10],[pw(25,2.5,w,d),10],[pw(27.5,2.5,w,d),8]]) },
        { name: 'Cable Curls extended',    sets: sets([[pw(20,2.5,w,d),12],[pw(22.5,2.5,w,d),12],[pw(25,2.5,w,d),10]]) },
      ];
    }

    if (dayIdx === 3) { // Shoulders + Triceps
      exercises = [
        { name: 'Shoulder Press (machine)',  sets: sets([[pw(75,5,w,d),10],[pw(80,5,w,d),10],[pw(85,5,w,d),8]]) },
        { name: 'Lateral Raises',            sets: sets([[pw(35,5,w,d),12],[pw(40,5,w,d),12],[pw(45,5,w,d),12],[pw(45,5,w,d),10]]) },
        { name: 'Rear Delt Machine',         sets: sets([[pw(65,5,w,d),10],[pw(70,5,w,d),10],[pw(75,5,w,d),10]]) },
        { name: 'Tricep Cable Pushdown',     sets: sets([[pw(55,2.5,w,d),12],[pw(60,2.5,w,d),12],[pw(62.5,2.5,w,d),10]]) },
        { name: 'Overhead Tricep Extension', sets: sets([[pw(40,2.5,w,d),12],[pw(42.5,2.5,w,d),12],[pw(45,2.5,w,d),10]]) },
      ];
    }

    if (dayIdx === 4) { // Chest + Arms
      exercises = [
        { name: 'Chest Press (machine)', sets: sets([[pw(130,7.5,w,d),10],[pw(135,7.5,w,d),10],[pw(140,7.5,w,d),8]]) },
        { name: 'Chest Fly',             sets: sets([[pw(125,5,w,d),10],[pw(130,5,w,d),10],[pw(135,5,w,d),10]]) },
        { name: 'Tricep Dips (machine)', sets: sets([[pw(90,5,w,d),12],[pw(95,5,w,d),12],[pw(100,5,w,d),10]]) },
        { name: 'Tricep Pushdown',       sets: sets([[pw(55,2.5,w,d),12],[pw(60,2.5,w,d),12],[pw(62.5,2.5,w,d),10]]) },
        { name: 'Bicep Curls',           sets: sets([[pw(22.5,2.5,w,d),10],[pw(25,2.5,w,d),10],[pw(27.5,2.5,w,d),8]]) },
        { name: 'Hammer Curls',          sets: sets([[pw(22.5,2.5,w,d),12],[pw(25,2.5,w,d),12]]) },
      ];
    }

    if (dayIdx === 5) { // Legs + Back
      exercises = [
        { name: 'Leg Press',    sets: sets([[pw(220,15,w,d),10],[pw(250,15,w,d),10],[pw(270,15,w,d),10],[pw(290,15,w,d),8]]) },
        { name: 'Leg Curl',     sets: sets([[pw(160,5,w,d),10],[pw(170,5,w,d),10],[pw(175,5,w,d),10],[pw(180,5,w,d),10]]) },
        { name: 'Leg Extension',sets: sets([[pw(100,5,w,d),10],[pw(105,5,w,d),10],[pw(110,5,w,d),10]]) },
        { name: 'Hack Squat',   sets: sets([[pw(70,5,w,d),10],[pw(90,5,w,d),10],[pw(100,5,w,d),8]]) },
        { name: 'Lat Pulldown', sets: sets([[pw(99,5.5,w,d),10],[pw(110,5.5,w,d),10],[pw(116.5,5.5,w,d),10]]) },
        { name: 'Machine Row',  sets: sets([[pw(90,5,w,d),10],[pw(95,5,w,d),10]]) },
      ];
    }

    const startMs = new Date(date + 'T09:30:00').getTime();
    const duration = 45 + Math.floor(Math.sin(week * 3.7) * 8 + 8); // 45-61 min, varied
    return {
      id: startMs,
      date,
      dayIdx,
      exercises,
      notes: notes || '',
      startedAt: startMs,
      endedAt: startMs + duration * 60000,
      duration,
    };
  }

  // ── Schedule: 12 weeks from 2026-03-02 ────────────────────────────────────
  // dayOffset: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5
  const MONDAY = new Date('2026-03-02');
  const schedule = [
    // Week 0 – normal (Mon Chest, Tue Back, Thu Shoul, Fri Chest+Arms)
    { w:0, offset:0, day:0 }, { w:0, offset:1, day:1 }, { w:0, offset:3, day:3 }, { w:0, offset:4, day:4 },
    // Week 1 – add Sat Legs
    { w:1, offset:0, day:0 }, { w:1, offset:1, day:1 }, { w:1, offset:3, day:3 }, { w:1, offset:4, day:4 }, { w:1, offset:5, day:5 },
    // Week 2 – miss Friday (life happens)
    { w:2, offset:0, day:0 }, { w:2, offset:1, day:1 }, { w:2, offset:3, day:3 },
    // Week 3 – normal + Legs Sat
    { w:3, offset:0, day:0 }, { w:3, offset:1, day:1 }, { w:3, offset:3, day:3 }, { w:3, offset:4, day:4 }, { w:3, offset:5, day:5 },
    // Week 4 – swap Wed in as Chest+Bi
    { w:4, offset:0, day:0 }, { w:4, offset:1, day:1 }, { w:4, offset:2, day:2 }, { w:4, offset:3, day:3 }, { w:4, offset:4, day:4 },
    // Week 5 – normal
    { w:5, offset:0, day:0 }, { w:5, offset:1, day:1 }, { w:5, offset:3, day:3 }, { w:5, offset:4, day:4 },
    // Week 6 – DELOAD (lighter weights, normal schedule)
    { w:6, offset:0, day:0, deload:true }, { w:6, offset:1, day:1, deload:true }, { w:6, offset:3, day:3, deload:true },
    // Week 7 – back to heavy, PR session note
    { w:7, offset:0, day:0, notes:'Back from deload — feeling fresh. New chest press PR!' },
    { w:7, offset:1, day:1 }, { w:7, offset:3, day:3 }, { w:7, offset:4, day:4 }, { w:7, offset:5, day:5 },
    // Week 8 – normal
    { w:8, offset:0, day:0 }, { w:8, offset:1, day:1 }, { w:8, offset:3, day:3 }, { w:8, offset:4, day:4 },
    // Week 9 – miss Monday
    { w:9, offset:1, day:1 }, { w:9, offset:3, day:3 }, { w:9, offset:4, day:4 },
    // Week 10 – strong week + Legs
    { w:10, offset:0, day:0, notes:'Strongest session in months.' },
    { w:10, offset:1, day:1 }, { w:10, offset:3, day:3 }, { w:10, offset:4, day:4 }, { w:10, offset:5, day:5 },
    // Week 11 – normal
    { w:11, offset:0, day:0 }, { w:11, offset:1, day:1 }, { w:11, offset:3, day:3 }, { w:11, offset:4, day:4 },
  ];

  const sessions = schedule.map(({ w, offset, day, deload, notes }) =>
    buildSession(dateStr(MONDAY, w * 7 + offset), day, w, !!deload, notes || '')
  );

  // ── Write to localStorage ──────────────────────────────────────────────────
  const PROFILE = 'Alex';
  localStorage.setItem('wt_sessions_v2_' + PROFILE, JSON.stringify(sessions));

  // Register profile and settings (won't overwrite your existing "Me" profile)
  const existing = JSON.parse(localStorage.getItem('wt_profiles') || '["Me"]');
  if (!existing.includes(PROFILE)) existing.push(PROFILE);
  localStorage.setItem('wt_profiles', JSON.stringify(existing));
  localStorage.setItem('wt_goal_' + PROFILE, 'muscle');
  localStorage.setItem('wt_dpw_' + PROFILE, '5');
  localStorage.setItem('wt_onboarded', '1');

  console.log('✅ Loaded ' + sessions.length + ' sessions for "' + PROFILE + '".');
  console.log('👉 Refresh the page, then switch to the "Alex" profile in the top-right menu.');
})();
