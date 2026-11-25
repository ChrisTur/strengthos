// ── HTML escaping ────────────────────────────────────────────────────────────
// User-controlled free text (exercise/day/profile names, notes) is rendered via
// innerHTML template strings throughout the app — always pass it through this
// before interpolating, or it's a stored-XSS vector.
function escapeHtml(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
// For user text embedded as a single-quoted JS string literal inside an onclick="..."
// (or similar) HTML attribute. Needs escaping in both the JS-string layer (so a quote
// in the text can't terminate the string early) AND the surrounding HTML-attribute
// layer (so the browser's attribute-value HTML-decoding doesn't undo the JS escaping) —
// in that order. A plain escapeHtml() alone is not sufficient here.
function escapeJsAttr(str){
  const jsEscaped=String(str==null?'':str).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return escapeHtml(jsEscaped);
}

// ── Local calendar date ──────────────────────────────────────────────────────
// `d.toISOString().slice(0,10)` converts to UTC first, so anyone west of UTC
// (most of the US) gets tomorrow's date for several hours every evening —
// e.g. a Monday-night workout showing under Tuesday. Every "what's today's
// date" call in this app means the user's local calendar date, never UTC, so
// always go through this instead of toISOString() for date-only strings.
function localDateStr(d=new Date()){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// ── Colours ─────────────────────────────────────────────────────────────────
const CORAL='#e07b39',PURPLE='#8b6fd4',BLUE='#5b9bd5',
      GREEN='#5aaa5a',AMBER='#c9963c',GRAY='#888';

// ── Programme ────────────────────────────────────────────────────────────────
const DAYS=[
  {dow:'Mon',name:'Chest + Triceps',short:'Chest/Triceps',dots:[CORAL,PURPLE],
   tags:['Chest','Triceps','Priority'],
   defaultNote:'Primary chest day — go heavy on press. Rest 2–3 min between main sets.',
   exercises:[
    {name:'Chest Press (machine)',  plan:'4 × 10 @ 150 / top set 160 × 8',structure:'4 × 10',note:'Main strength setter'},
    {name:'Incline DB Press',       plan:'4 × 10 @ 120 / set 4: 130 × 10',structure:'4 × 10',note:'Upper chest'},
    {name:'Chest Fly',              plan:'3 × 10 @ 150',                   structure:'3 × 10',note:'Isolation, squeeze'},
    {name:'Tricep Cable Pushdown',  plan:'4 sets: 60.5 / 66 / 71.5 / 77',  structure:'4 sets',note:'Ramp up each set'},
    {name:'Tricep Dips (machine)',  plan:'3 × 12 @ 110',                   structure:'3 × 12',note:'Finish triceps'},
   ]},
  {dow:'Tue',name:'Back + Biceps',short:'Back/Biceps',dots:[BLUE,AMBER],
   tags:['Back','Biceps'],
   defaultNote:'Pull day. Focus on full range of motion on rows — controlled eccentric.',
   exercises:[
    {name:'Lat Pulldown',           plan:'4 sets: 99 / 121 / 132 / 132 × 10',structure:'4 sets',note:'Controlled, full stretch'},
    {name:'Cable Seated Row',       plan:'3 sets: 121×10 / 121×10 / 132×8',  structure:'3 × 10',note:'Drive elbows back'},
    {name:'Machine Row',            plan:'3 × 10 @ 105',                      structure:'3 × 10',note:'All sets at 105'},
    {name:'Hammer Curls',           plan:'3 × 12 @ 27.5',                     structure:'3 × 12',note:'Supinate at top'},
    {name:'Barbell / Cable Curls',  plan:'3 × 10 @ 27.5',                     structure:'3 × 10',note:'Slow eccentric'},
   ]},
  {dow:'Wed',name:'Chest + Biceps',short:'Chest/Biceps',dots:[CORAL,AMBER],
   tags:['Chest','Biceps','Priority'],
   defaultNote:'Second chest hit this week — moderate weight, higher reps for volume and pump.',
   exercises:[
    {name:'Chest Press (machine)',   plan:'4 × 12 @ 140',                         structure:'4 × 12',note:'Volume day, full reps'},
    {name:'Chest Fly',               plan:'4 sets: 120×11 / 140×11 / 140×10 / 150×8',structure:'4 sets',note:'Progressive ramp'},
    {name:'Incline Fly or Pec Deck', plan:'3 × 12 @ 120',                         structure:'3 × 12',note:'Isolation stretch'},
    {name:'Bicep Curls',             plan:'3 × 10 @ 30',                          structure:'3 × 10',note:'Build from 7–8 last week'},
    {name:'Cable Curls extended',    plan:'3 × 12 @ 27.5',                        structure:'3 × 12',note:'Full extension at bottom'},
   ]},
  {dow:'Thu',name:'Shoulders + Triceps',short:'Shoul/Triceps',dots:[GREEN,PURPLE],
   tags:['Shoulders','Triceps'],
   defaultNote:'Mid-week tricep hit. Shoulders get full work here since they only appear twice.',
   exercises:[
    {name:'Shoulder Press (machine)',  plan:'3 × 10 @ 90',              structure:'3 × 10',note:'Consolidate at 90'},
    {name:'Lateral Raises',            plan:'4 × 12 @ 50',              structure:'4 × 12',note:'Chase 12 reps before going to 55'},
    {name:'Rear Delt Machine',         plan:'3 × 10 @ 80',              structure:'3 × 10',note:'Full 3 sets today'},
    {name:'Tricep Cable Pushdown',     plan:'3 sets: 66 / 71.5 / 71.5', structure:'3 sets', note:'Moderate, quality reps'},
    {name:'Overhead Tricep Extension', plan:'3 × 12 @ moderate',        structure:'3 × 12',note:'Long-head stretch'},
   ]},
  {dow:'Fri',name:'Chest + Arms',short:'Chest/Arms',dots:[CORAL,PURPLE,AMBER],
   tags:['Chest','Arms','Priority'],
   defaultNote:'Pump day. Full arm circuit after chest. 60–90 sec rest to keep the pump.',
   exercises:[
    {name:'Chest Press (machine)', plan:'3 × 10 @ 150',             structure:'3 × 10',note:'Maintain from Mon'},
    {name:'Chest Fly',             plan:'3 × 10 @ 145',             structure:'3 × 10',note:'Pump focus'},
    {name:'Tricep Dips (machine)', plan:'3 × 12 @ 110',             structure:'3 × 12',note:'Squeeze at bottom'},
    {name:'Tricep Cable Pushdown', plan:'3 sets: 60.5 / 66 / 71.5', structure:'3 sets', note:'Superset option with curls'},
    {name:'Bicep Curls',           plan:'3 × 10 @ 30',              structure:'3 × 10',note:'Same weight, better reps'},
    {name:'Hammer Curls',          plan:'2 × 12 @ 27.5',            structure:'2 × 12',note:'Finish arms'},
   ]},
  {dow:'Sat',name:'Legs + Back',short:'Legs/Back',dots:[GREEN,BLUE],
   tags:['Legs','Back'],
   defaultNote:'Legs are de-emphasised but kept twice a week for balance and recovery quality.',
   exercises:[
    {name:'Leg Press',    plan:'4 sets: 270×10 / 320×10 / 340×10 / 340×10',structure:'4 sets',note:'Add 20 lbs to top sets'},
    {name:'Leg Curl',     plan:'4 × 10 @ 190',                              structure:'4 × 10',note:'All sets at 190'},
    {name:'Leg Extension',plan:'3 × 10 @ 120',                              structure:'3 × 10',note:'Complete set 3'},
    {name:'Hack Squat',   plan:'3 sets: 90×10 / 135×10 / 135×8',           structure:'3 sets',note:'Controlled ramp'},
    {name:'Lat Pulldown', plan:'3 × 10 @ 121',                              structure:'3 × 10',note:'Back accessory'},
    {name:'Machine Row',  plan:'2 × 10 @ 105',                              structure:'2 × 10',note:'Finish back'},
   ]},
  {dow:'Sun',name:'Active Recovery',short:'Recovery',dots:[GRAY],
   tags:['Active Recovery'],
   defaultNote:'Keep the streak alive. Light work only — this is what lets Mon–Sat actually build muscle.',
   exercises:[
    {name:'Lateral Raises',       plan:'3 × 15 @ 30–35',  structure:'3 × 15',note:'Light, blood flow'},
    {name:'Cable Curls',          plan:'3 × 15 @ light',   structure:'3 × 15',note:'Pump, no fatigue'},
    {name:'Chest Fly', plan:'3 × 15 @ 100–110', structure:'3 × 15',note:'Stretch-focused'},
    {name:'Rear Delt',            plan:'2 × 15 @ 50–60',   structure:'2 × 15',note:'Posture work'},
   ]},
];

// ── Frequency-based programs ──────────────────────────────────────────────────
const REST_DAY=-1;

// Push/Pull/Legs twice through — the 6-day split, and the first six days of the
// 7-day split (which only adds a recovery day). Defined once instead of
// copy-pasted into both, so the two can't silently drift apart.
const PPL_SIX_DAY=[
    {dow:'Day 1',name:'Push A — Chest',short:'Push A',dots:[CORAL,PURPLE],
     tags:['Chest','Triceps','Push'],
     exercises:[
      {name:'Barbell Bench Press',    structure:'4 × 5',    note:'Strength focus — add 2.5 kg (5 lbs) whenever all sets are clean. Log your top set.'},
      {name:'Incline DB Press',       structure:'4 × 10',   note:'Upper chest; go to failure on final set — note the reps and weight'},
      {name:'Chest Fly',              structure:'3 × 12',   note:'Full stretch at the bottom — don\'t shorten the range for heavier weight'},
      {name:'Lateral Raises',         structure:'4 × 15',   note:'3s eccentric; side delts need volume to grow — these should burn'},
      {name:'Tricep Cable Pushdown',        structure:'4 × 12',   note:'Elbows fixed; full extension; ramp weight across the 4 sets'},
     ]},
    {dow:'Day 2',name:'Pull A — Back Width',short:'Pull A',dots:[BLUE,AMBER],
     tags:['Back','Biceps','Pull'],
     exercises:[
      {name:'Pull-Up',                structure:'4 × max',  note:'Overhand, shoulder-width — dead hang to chin over bar. Scale with resistance band if needed.'},
      {name:'Lat Pulldown',           structure:'4 × 10',   note:'Supplement pull-ups — prioritise the stretch at the top, drive elbows to hips'},
      {name:'Dumbbell Row',           structure:'3 × 10',   note:'Heavy; pull elbow high and back — lat and teres major builder'},
      {name:'Straight-Arm Pulldown',  structure:'3 × 12',   note:'Isolates lats without biceps — keep arms straight, hinge at shoulder'},
      {name:'Barbell Curl',           structure:'3 × 8',    note:'Strength curl — strict form, 2s up, 3s down, no swing'},
     ]},
    {dow:'Day 3',name:'Legs A — Quad',short:'Legs A',dots:[GREEN],
     tags:['Legs','Quads'],
     exercises:[
      {name:'Hack Squat',             structure:'4 × 8',    note:'Quad-dominant — 3s descent, slight forward lean, drive knees over toes'},
      {name:'Leg Press',              structure:'3 × 10',   note:'Feet mid-plate, shoulder-width; full range — don\'t lock knees at top'},
      {name:'Leg Extension',          structure:'4 × 12',   note:'Squeeze and hold 1s at top; drop set on final set: 10 reps → strip weight → 10 more'},
      {name:'Calf Raises',            structure:'4 × 15',   note:'Step edge stretch at bottom — calves have short ROM, use every millimetre'},
      {name:'Cable Crunch',           structure:'3 × 15',   note:'Weighted core; round the spine fully — don\'t pull with the neck'},
     ]},
    {dow:'Day 4',name:'Push B — Shoulders',short:'Push B',dots:[GREEN,PURPLE],
     tags:['Shoulders','Triceps','Push'],
     exercises:[
      {name:'Overhead Press',         structure:'4 × 6–8',  note:'Seated or standing — this is your shoulder strength benchmark, log it every session'},
      {name:'Incline DB Press',       structure:'3 × 10',   note:'Upper chest secondary hit — moderate weight, full reps'},
      {name:'Lateral Raises',         structure:'5 × 12–15',note:'High volume — side delts are responsible for visible shoulder width. Chase the burn.'},
      {name:'Face Pull',              structure:'3 × 15',   note:'External rotation at peak — keeps rotator cuff healthy and rear delts balanced'},
      {name:'Overhead Tricep Extension',structure:'4 × 12', note:'Long-head of tricep only stretches in overhead position — mass builder often skipped'},
     ]},
    {dow:'Day 5',name:'Pull B — Back Thickness',short:'Pull B',dots:[BLUE,AMBER],
     tags:['Back','Biceps','Pull'],
     exercises:[
      {name:'Cable Seated Row',       structure:'4 × 8–10', note:'Thickness focus — hold 1–2s contraction, don\'t rush the set. Chest tall throughout.'},
      {name:'Machine Row',            structure:'4 × 10',   note:'Chest-supported removes the lower back — pure back contraction every rep'},
      {name:'Lat Pulldown — Close Grip',structure:'3 × 10', note:'Neutral grip hits lower lats and more bicep — great complement to wide-grip work'},
      {name:'Face Pull',              structure:'3 × 15',   note:'Rear delts and external rotation — do these on pull days every single week'},
      {name:'Hammer Curls',           structure:'3 × 12',   note:'Brachialis builder — neutral grip, no swing, squeeze at top'},
      {name:'Preacher Curl',          structure:'3 × 10',   note:'Zero cheat possible — stretch at bottom is where the growth signal is highest'},
     ]},
    {dow:'Day 6',name:'Legs B — Posterior',short:'Legs B',dots:[GREEN,AMBER],
     tags:['Legs','Hamstrings','Glutes'],
     exercises:[
      {name:'Romanian Deadlift',      structure:'4 × 8–10', note:'Hip hinge — push hips back, feel the hamstrings pull taut. Heavy is fine if form is right.'},
      {name:'Leg Curl',               structure:'4 × 10',   note:'Hamstring isolation — slow eccentric (3s), don\'t let hips lift off pad'},
      {name:'Hip Abduction Machine',  structure:'3 × 15',   note:'Glute medius — most people neglect this. Knee stability and outer glute shape both depend on it.'},
      {name:'Hack Squat',             structure:'3 × 10',   note:'Lighter than Day 3 — focus on depth and feel rather than max load'},
      {name:'Calf Raises',            structure:'4 × 15',   note:'Full stretch every rep — calves are notorious for partial reps, which is why they don\'t grow'},
      {name:'Plank Hold',             structure:'3 × 60s',  note:'End every leg day with a plank — core stability directly supports squat and hinge mechanics'},
     ]},
];
// Light day that rounds out the 7-day split
const STRENGTH_RECOVERY_DAY={dow:'Day 7',name:'Active Recovery',short:'Recovery',dots:[GRAY,GREEN],
     tags:['Active Recovery','Mobility'],
     exercises:[
      {name:'Brisk Walk',             structure:'20–30 min', note:'Gentle — 50–60% max HR. Active recovery accelerates repair more than full rest.'},
      {name:'Full-Body Stretch',      structure:'15 min',    note:'Hold each 30–45s: hip flexors, quads, hamstrings, chest, lats, shoulders'},
      {name:'Foam Roll',              structure:'8 min',     note:'Glutes, IT band, upper back, lats — slow and deliberate, not just rolling around'},
      {name:'Plank Hold',             structure:'2 × 30s',   note:'Light core — just maintaining, not training'},
     ]};

// Strength programs — 3 through 7-day splits (no preset weights, structure only)
const PROGRAMS={
  3:[
    {dow:'Day 1',name:'Push',short:'Push',dots:[CORAL,GREEN,PURPLE],
     tags:['Chest','Shoulders','Triceps'],
     exercises:[
      {name:'Barbell Bench Press',    structure:'4 × 6–8',  note:'Primary strength mover — add weight when all reps are clean. Controlled 2s descent.'},
      {name:'Incline DB Press',       structure:'3 × 10',   note:'Upper chest emphasis — elbows at 45°, pause at chest, squeeze at top'},
      {name:'Shoulder Press',         structure:'3 × 10',   note:'Strict overhead press — brace core, no leg drive, full lockout'},
      {name:'Lateral Raises',         structure:'4 × 12–15',note:'Slow eccentric (3s down) — weight should stop momentum, not use it'},
      {name:'Tricep Cable Pushdown',        structure:'3 × 12',   note:'Pin elbows to sides, full extension, hold 1s at bottom each rep'},
     ]},
    {dow:'Day 2',name:'Pull',short:'Pull',dots:[BLUE,AMBER],
     tags:['Back','Biceps'],
     exercises:[
      {name:'Lat Pulldown',           structure:'4 × 8–10', note:'Full stretch at top — don\'t shortchange the range. Drive elbows to back pockets.'},
      {name:'Cable Seated Row',       structure:'3 × 10',   note:'Hold 1s at peak contraction. Chest tall, don\'t round at end of the pull.'},
      {name:'Machine Row',            structure:'3 × 10',   note:'Back thickness builder — squeeze shoulder blades hard at the top'},
      {name:'Hammer Curls',           structure:'3 × 12',   note:'Neutral grip, supinate at top — hits brachialis and long head simultaneously'},
      {name:'Bicep Curls',            structure:'3 × 10',   note:'Strict form — no swinging. 2s eccentric, peak squeeze at top'},
     ]},
    {dow:'Day 3',name:'Legs',short:'Legs',dots:[GREEN],
     tags:['Legs'],
     exercises:[
      {name:'Leg Press',              structure:'4 × 8–10', note:'Full range — heels shoulder-width, don\'t let knees cave, controlled descent'},
      {name:'Romanian Deadlift',      structure:'3 × 10',   note:'Feel the hamstring stretch — push hips back, soft knees, bar skims legs'},
      {name:'Leg Extension',          structure:'3 × 12',   note:'Squeeze hard at top, 2s eccentric — pure quad isolation'},
      {name:'Leg Curl',               structure:'3 × 10',   note:'Full range, controlled lowering — hamstrings under tension the whole set'},
      {name:'Calf Raises',            structure:'4 × 15',   note:'Pause at bottom stretch, explosive rise, squeeze at top — calves respond to range'},
     ]},
  ],
  4:[
    {dow:'Day 1',name:'Chest + Triceps',short:'Chest/Tri',dots:[CORAL,PURPLE],
     tags:['Chest','Triceps'],
     exercises:[
      {name:'Barbell Bench Press',    structure:'4 × 6–8',  note:'Work to a top set of 6; track this number — it\'s your chest strength benchmark'},
      {name:'Incline DB Press',       structure:'4 × 10',   note:'Upper chest gap-filler; go to failure on set 4 — note the weight'},
      {name:'Cable Fly',              structure:'3 × 12',   note:'Long-head stretch — cross hands at peak, hold 1s. Keep slight elbow bend.'},
      {name:'Tricep Cable Pushdown',        structure:'4 × 12',   note:'Lock elbows in; full extension each rep. Ramp weight across sets.'},
      {name:'Tricep Dips (machine)',  structure:'3 × 12',   note:'Slow negative (3s down); tricep dips are underrated for mass'},
     ]},
    {dow:'Day 2',name:'Back + Biceps',short:'Back/Bi',dots:[BLUE,AMBER],
     tags:['Back','Biceps'],
     exercises:[
      {name:'Lat Pulldown',           structure:'4 × 8–10', note:'Wide overhand grip; full dead-hang stretch at top. Drive elbows to hips.'},
      {name:'Cable Seated Row',       structure:'4 × 10',   note:'Mid-back thickness — hold contraction 1s. Don\'t rock the torso.'},
      {name:'Dumbbell Row',           structure:'3 × 10',   note:'Knee on bench, elbow flares slightly back — pulls lats and teres major'},
      {name:'Hammer Curls',           structure:'3 × 12',   note:'Neutral grip builds brachialis — the muscle that "pushes up" the bicep peak'},
      {name:'Preacher Curl',          structure:'3 × 10',   note:'Zero cheat possible — pure bicep. Full stretch at bottom, don\'t drop weight.'},
     ]},
    {dow:'Day 3',name:'Legs',short:'Legs',dots:[GREEN],
     tags:['Legs'],
     exercises:[
      {name:'Hack Squat',             structure:'4 × 8–10', note:'Controlled 3s descent; drive heels into platform. Knees stay out.'},
      {name:'Romanian Deadlift',      structure:'4 × 10',   note:'Hip hinge, not a squat — push hips back, feel hamstrings pull. Bar skims legs.'},
      {name:'Leg Extension',          structure:'3 × 12',   note:'Hold peak contraction 1s; 2s eccentric. Keep quads under tension the whole set.'},
      {name:'Leg Curl',               structure:'3 × 10',   note:'Full range — don\'t shortcut the stretch. Hamstrings respond to time under tension.'},
      {name:'Calf Raises',            structure:'4 × 15',   note:'Stretch fully at bottom (calves have short range of motion — use all of it)'},
     ]},
    {dow:'Day 4',name:'Shoulders + Arms',short:'Shldr/Arms',dots:[GREEN,PURPLE,AMBER],
     tags:['Shoulders','Arms'],
     exercises:[
      {name:'Overhead Press',         structure:'4 × 6–8',  note:'Seated or standing; brace core and glutes. Full lockout. This is your shoulder strength test.'},
      {name:'Lateral Raises',         structure:'4 × 12–15',note:'No swinging — if you can\'t control it, it\'s too heavy. 3s eccentric, chase the burn.'},
      {name:'Face Pull',              structure:'3 × 15',   note:'External rotation at end of pull — crucial for shoulder health and rear-delt development'},
      {name:'Tricep Cable Pushdown',        structure:'3 × 12',   note:'Superset option with curls below to save time and boost pump'},
      {name:'Barbell Curl',           structure:'3 × 10',   note:'Strict — no swing. 2s up, 3s down. Squeeze at peak.'},
     ]},
  ],
  5:[
    {dow:'Day 1',name:'Chest + Triceps',short:'Chest/Tri',dots:[CORAL,PURPLE],
     tags:['Chest','Triceps','Priority'],
     exercises:[
      {name:'Barbell Bench Press',    structure:'4 × 5–6',  note:'Heavy strength day — work to a challenging top set, then one back-off set at 80%'},
      {name:'Incline DB Press',       structure:'4 × 10',   note:'Upper chest is almost always the lagging area — prioritise this every chest session'},
      {name:'Chest Fly',              structure:'3 × 12',   note:'Go for the stretch — hands wide, elbows slightly bent, feel pecs fully loaded at bottom'},
      {name:'Tricep Cable Pushdown',        structure:'4 × 12',   note:'Volume finisher — elbows pinned, full extension, pump the triceps out'},
      {name:'Overhead Tricep Extension',structure:'3 × 12', note:'Long head (the biggest part) only gets stretched in overhead position — don\'t skip this'},
     ]},
    {dow:'Day 2',name:'Back + Biceps',short:'Back/Bi',dots:[BLUE,AMBER],
     tags:['Back','Biceps'],
     exercises:[
      {name:'Lat Pulldown',           structure:'4 × 8–10', note:'Lat width — lean back slightly, pull bar to upper chest, feel elbows drive to back pockets'},
      {name:'Cable Seated Row',       structure:'4 × 10',   note:'Mid-back thickness — stay tall, don\'t lean forward on the way out'},
      {name:'Dumbbell Row',           structure:'3 × 10',   note:'Go heavy here — the dumbbell row is one of the best back builders available'},
      {name:'Straight-Arm Pulldown',  structure:'3 × 12',   note:'Arms straight, hinge at shoulder — isolates lats without any bicep involvement'},
      {name:'Hammer Curls',           structure:'3 × 12',   note:'Neutral grip; hit brachialis and bicep long head simultaneously'},
      {name:'Bicep Curls',            structure:'3 × 10',   note:'Slow eccentric (3s), squeeze at top — curl is earned, not swung'},
     ]},
    {dow:'Day 3',name:'Legs',short:'Legs',dots:[GREEN],
     tags:['Legs','Quads','Hamstrings'],
     exercises:[
      {name:'Hack Squat',             structure:'4 × 8',    note:'Primary quad compound — 3s descent, pause briefly at depth, drive through heels'},
      {name:'Romanian Deadlift',      structure:'4 × 10',   note:'This is your hamstring strength movement — go heavy, feel the stretch every rep'},
      {name:'Leg Extension',          structure:'3 × 12',   note:'Quad isolation — squeeze at top and hold 1s. Drop sets on final set for intensity.'},
      {name:'Leg Curl',               structure:'3 × 10',   note:'Control the negative — hamstrings grow from stretch-to-contraction, not just contraction'},
      {name:'Calf Raises',            structure:'4 × 15',   note:'Stand on step if possible; calves need full range to grow — don\'t half-rep these'},
      {name:'Hip Abduction Machine',  structure:'3 × 15',   note:'Glute medius / outer hip — often neglected; directly improves knee stability and glute shape'},
     ]},
    {dow:'Day 4',name:'Shoulders + Core',short:'Shldr/Core',dots:[GREEN,GRAY],
     tags:['Shoulders','Core'],
     exercises:[
      {name:'Overhead Press',         structure:'4 × 6–8',  note:'Seated or standing — brace everything, press in a straight line, full lockout overhead'},
      {name:'Lateral Raises',         structure:'5 × 12–15',note:'Side delts are responsible for visible shoulder width — high volume, controlled tempo'},
      {name:'Rear Delt Machine',      structure:'4 × 12',   note:'Rear delts balance shoulder health and directly improve posture and bench stability'},
      {name:'Face Pull',              structure:'3 × 15',   note:'External rotation at peak — the most important injury-prevention exercise in this programme'},
      {name:'Cable Crunch',           structure:'3 × 15',   note:'Weighted ab work; round the spine fully — this is not a hip flexor exercise'},
      {name:'Plank Hold',             structure:'3 × 45s',  note:'Full-body tension — glutes squeezed, ribs down, no breath-holding'},
     ]},
    {dow:'Day 5',name:'Chest + Back',short:'Chest/Back',dots:[CORAL,BLUE],
     tags:['Chest','Back','Volume'],
     exercises:[
      {name:'Incline Barbell Press',  structure:'4 × 8',    note:'Second chest session — more volume, moderate weight. Upper chest and shoulder tie-in.'},
      {name:'Cable Crossover',        structure:'4 × 12',   note:'Full stretch and squeeze — cross hands at the end; best chest isolation for pump work'},
      {name:'Pull-Up',                structure:'4 × max',  note:'Bodyweight pull — dead hang start, chest to bar. Scale with band if needed.'},
      {name:'Cable Seated Row — Wide Grip',structure:'4 × 10',note:'Upper back and rear delt emphasis — wider grip, pull to lower chest, elbows flare wide'},
      {name:'Bicep Curls',            structure:'3 × 10',   note:'Incline dumbbell curl option for extra stretch — hit biceps from a different angle'},
     ]},
  ],
  6:PPL_SIX_DAY,
  7:[...PPL_SIX_DAY,STRENGTH_RECOVERY_DAY],
};

// Cardio day variants — selected by user's cardio intensity preference
const CARDIO_DAYS={
  low:{
    dow:'Cardio',name:'Active Recovery',short:'Cardio',
    dots:[BLUE,GREEN],tags:['Cardio','Recovery','Low Impact'],
    defaultNote:'Easy movement day — keep heart rate at 50–60% max. Active recovery helps muscles repair faster than full rest.',
    exercises:[
      {name:'Brisk Walk',                structure:'25–30 min',note:'Comfortable pace — you should be able to hold a conversation'},
      {name:'Stationary Bike (easy)',    structure:'15 min',   note:'Low resistance, relaxed spin'},
      {name:'Full-Body Stretch',         structure:'10 min',   note:'Hold each stretch 30–45s — hips, quads, hamstrings, shoulders'},
      {name:'Plank Hold',                structure:'3 × 30s',  note:'Steady breathing, no sagging hips'},
      {name:'Foam Roll',                 structure:'5 min',    note:'Glutes, lats, upper back — slow controlled pressure'},
    ]
  },
  moderate:{
    dow:'Cardio',name:'Cardio & Conditioning',short:'Cardio',
    dots:[BLUE,GREEN],tags:['Cardio','Fat Loss','Conditioning'],
    defaultNote:'Cardio day — target 60–70% max HR (fat-burn zone). Steady effort with a HIIT finisher.',
    exercises:[
      {name:'Treadmill / Walk-Run',      structure:'20 min',             note:'2 min walk / 1 min jog — build the jog segments each week'},
      {name:'Stationary Bike',           structure:'15 min',             note:'Moderate resistance, steady pace'},
      {name:'HIIT Intervals',            structure:'10 × 30s on / 30s off',note:'Max effort each work interval — full rest between'},
      {name:'Core Circuit',              structure:'3 rounds',           note:'Plank 30s · mountain climbers 20 · crunches 15'},
      {name:'Cool-down Stretch',         structure:'5 min',              note:'Quads, hip flexors, hamstrings'},
    ]
  },
  high:{
    dow:'Cardio',name:'HIIT Blast',short:'HIIT',
    dots:[CORAL,BLUE],tags:['HIIT','Fat Loss','High Intensity'],
    defaultNote:'High intensity day — push to 80–90% max HR on work intervals. Short, hard, effective. Full rest between rounds.',
    exercises:[
      {name:'Warm-up Jog',               structure:'5 min',              note:'Build to 70% max HR before starting — never skip this'},
      {name:'Sprint Intervals',          structure:'8 × 40s sprint / 20s rest',note:'Absolute max effort each sprint'},
      {name:'Jump Rope',                 structure:'3 × 2 min',          note:'Continuous effort, 60s rest between rounds'},
      {name:'Burpees',                   structure:'4 × 12',             note:'Full extension at top, chest to floor at bottom'},
      {name:'Rowing / Ski Erg Intervals',structure:'4 × 30s max / 45s rest',note:'Explosive drive — rate over resistance'},
      {name:'Cool-down Walk + Stretch',  structure:'8 min',              note:'Essential after high intensity — don\'t skip'},
    ]
  }
};
function getCardioDay(){ return CARDIO_DAYS[getCardioLevel()]||CARDIO_DAYS.moderate }

// Pure cardio-only schedules — used when goal === 'cardio'.
// Each session type is defined once and composed into the 3–7 day weeks below,
// instead of the same day being copy-pasted into every frequency (which let
// copies quietly drift apart and made a real within-week duplicate — two
// identical walk/stretch/foam-roll days in the 7-day plan — easy to miss).
const CARDIO_SESSIONS={
  steady:{dow:'Steady',name:'Steady State',short:'Steady',dots:[BLUE,GREEN],
    tags:['Cardio','Endurance'],
    defaultNote:'Steady state — 60–70% max HR. Easy conversation pace throughout.',
    exercises:[
      {name:'Treadmill / Walk-Run',   structure:'35 min',           note:'Build by 2 min each week — consistency beats intensity here'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Calves, quads, hip flexors'},
    ]},
  hiit:{dow:'HIIT',name:'HIIT',short:'HIIT',dots:[CORAL,BLUE],
    tags:['HIIT','High Intensity'],
    defaultNote:'Intervals — 80–90% max HR on work sets, full rest between rounds.',
    exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Gradual build before intervals — protect your joints'},
      {name:'Sprint Intervals',       structure:'10 × 30s / 30s rest',note:'Max effort every sprint — walk the rest'},
      {name:'Jump Rope',              structure:'4 × 2 min',        note:'Continuous effort, 60s rest between rounds'},
      {name:'Burpees',                structure:'4 × 10',           note:'Full range — chest to floor, jump at top'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Heart rate return — do not skip'},
    ]},
  // 4-day week swaps jump rope for the air bike, so its one HIIT day hits harder
  hiitBike:{dow:'HIIT',name:'HIIT — Air Bike',short:'HIIT',dots:[CORAL,BLUE],
    tags:['HIIT','Fat Loss'],
    defaultNote:'Intervals — 80–90% max HR on work sets. True rest between rounds.',
    exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Gradual build — protect your joints'},
      {name:'Sprint Intervals',       structure:'10 × 30s / 30s rest',note:'Max effort, walk the rest'},
      {name:'Air Bike (Assault Bike)',structure:'4 × 20s / 40s rest',note:'All-out — the hardest 20s you have'},
      {name:'Burpees',                structure:'3 × 12',           note:'Full range every rep'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Essential — heart rate return'},
    ]},
  zone2:{dow:'Zone 2',name:'Zone 2 Endurance',short:'Zone 2',dots:[BLUE,GREEN],
    tags:['Cardio','Zone 2','Endurance'],
    defaultNote:'Long easy effort — Zone 2 builds your aerobic base. Keep it truly easy.',
    exercises:[
      {name:'Stationary Bike',        structure:'45 min',           note:'Steady cadence, same pace throughout — no surges'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Full lower body'},
    ]},
  tempo:{dow:'Tempo',name:'Tempo Run',short:'Tempo',dots:[CORAL,AMBER],
    tags:['Cardio','Endurance','Tempo'],
    defaultNote:'Tempo — comfortably hard. 75–85% max HR. Should feel like a "controlled struggle".',
    exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Easy pace before tempo'},
      {name:'Running',                structure:'20 min @ tempo pace',note:'Steady hard effort — not a sprint, not a jog'},
      {name:'Stair Climber',          structure:'10 min',           note:'Moderate-high resistance, steady climb'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Full lower body stretch'},
    ]},
  long:{dow:'Long',name:'Long Endurance',short:'Long',dots:[BLUE,GREEN],
    tags:['Cardio','Endurance'],
    defaultNote:'Your long easy day — the cornerstone of endurance fitness. Stay at 60–70% max HR.',
    exercises:[
      {name:'Cycling',                structure:'60–75 min',        note:'Easy gear, conversational pace the whole way'},
      {name:'Rowing Machine',         structure:'20 min',           note:'Low rate, smooth strokes — form over speed'},
      {name:'Cool-down Stretch',      structure:'8 min',            note:'Full body — take your time'},
    ]},
  recovery:{dow:'Recovery',name:'Active Recovery',short:'Recovery',dots:[GREEN],
    tags:['Recovery','Core'],
    defaultNote:'Easy movement only — blood flow and mobility. Active recovery accelerates progress more than extra hard sessions.',
    exercises:[
      {name:'Brisk Walk',             structure:'30 min',           note:'Easy, enjoyable pace — outdoors if possible'},
      {name:'Plank Hold',             structure:'3 × 45s',          note:'Core stability — stable hips, steady breathing'},
      {name:'Full-Body Stretch',      structure:'12 min',           note:'Hold each stretch 30–45s — hips, hamstrings, back, shoulders'},
      {name:'Foam Roll',              structure:'5 min',            note:'Glutes, IT band, upper back, calves'},
    ]},
  // Deliberately NOT another walk/stretch/foam-roll day — the 7-day week already
  // has `recovery` mid-week, so its last day is joint-mobility work instead.
  mobility:{dow:'Mobility',name:'Mobility Flow',short:'Mobility',dots:[GREEN],
    tags:['Recovery','Mobility'],
    defaultNote:'Active rest — joint mobility to finish the week. Move slowly, breathe, no intensity today.',
    exercises:[
      {name:'Hip Mobility Flow',      structure:'10 min',           note:'90/90 switches, hip circles, deep squat hold — slow and controlled'},
      {name:'Thoracic Mobility',      structure:'8 min',            note:'Open books, cat-cow, thread-the-needle — rotate through the upper back'},
      {name:'Yoga Flow',              structure:'15 min',           note:'Sun salutations at an easy pace — link breath to movement'},
      {name:'Dead Bug',               structure:'2 × 10 ea',        note:'Light core — lower back stays flat'},
    ]},
};
// Gives a shared session the "Day N" label for its slot in a given week
const _cardioWeek=(...keys)=>keys.map((k,i)=>({...CARDIO_SESSIONS[k],dow:'Day '+(i+1)}));
const CARDIO_PROGRAMS={
  3:[
    {dow:'Day 1',name:'Steady State',short:'Steady',dots:[BLUE,GREEN],
     tags:['Cardio','Endurance'],
     defaultNote:'Steady state — hold 60–70% max HR. You should be able to speak in short sentences.',
     exercises:[
      {name:'Treadmill / Walk-Run',   structure:'30 min',           note:'Build by 2 min/week — first 5 min easy, last 5 min easy'},
      {name:'Stationary Bike',        structure:'15 min',           note:'Moderate resistance after the run — active cool-down'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Quads, hip flexors, calves — 30s each'},
     ]},
    {dow:'Day 2',name:'HIIT',short:'HIIT',dots:[CORAL,BLUE],
     tags:['HIIT','Fat Loss','High Intensity'],
     defaultNote:'High-intensity intervals — push to 80–90% max HR on work sets. Full rest between rounds.',
     exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Build to 70% max HR — never skip this'},
      {name:'Sprint Intervals',       structure:'8 × 30s / 30s rest',note:'Max effort each sprint — walk rest'},
      {name:'Burpees',                structure:'3 × 10',           note:'Full range, chest to floor, jump at top'},
      {name:'Jump Rope',              structure:'3 × 2 min',        note:'Continuous effort, 60s rest between rounds'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Essential after HIIT — do not skip'},
     ]},
    {dow:'Day 3',name:'Active Recovery',short:'Recovery',dots:[GREEN],
     tags:['Recovery','Cardio','Core'],
     defaultNote:'Easy movement day — 50–60% max HR, no burning. Goal is blood flow and mobility, not effort.',
     exercises:[
      {name:'Brisk Walk',             structure:'25 min',           note:'Comfortable pace — active recovery, not rest'},
      {name:'Elliptical',             structure:'10 min',           note:'Low resistance, smooth motion'},
      {name:'Plank Hold',             structure:'3 × 30–45s',       note:'Core stability — steady breathing'},
      {name:'Full-Body Stretch',      structure:'10 min',           note:'Hold each stretch 30–45s'},
      {name:'Foam Roll',              structure:'5 min',            note:'Glutes, IT band, upper back'},
     ]},
  ],
  4:[
    ..._cardioWeek('steady','hiitBike'),
    // 4-day Zone 2 adds a rowing block, since it's the week's only long session
    {...CARDIO_SESSIONS.zone2,dow:'Day 3',exercises:[
      {name:'Stationary Bike',        structure:'40 min',           note:'Steady cadence, hold the same pace throughout'},
      {name:'Rowing Machine',         structure:'15 min',           note:'Moderate pace — focus on form and breathing'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Full lower body + shoulders'},
    ]},
    ..._cardioWeek('recovery').map(d=>({...d,dow:'Day 4'})),
  ],
  5:_cardioWeek('steady','hiit','zone2','tempo','recovery'),
  6:_cardioWeek('steady','hiit','zone2','tempo','recovery','long'),
  7:_cardioWeek('steady','hiit','zone2','recovery','tempo','long','mobility'),
};

// ── Workout hero images (Unsplash photo IDs, matched by day name/tags) ────────
const DAY_IMAGES={
  Push:      '1571019614242-c5c5dee9f50b',
  Pull:      '1534438327276-14e5300c3a48',
  Legs:      '1541534741688-6078c6bfb5c5',
  Chest:     '1571019614242-c5c5dee9f50b',
  Back:      '1534438327276-14e5300c3a48',
  Shoulders: '1583454110551-21f2fa2afe61',
  Steady:    '1476480862126-209bfaa8edc8',
  HIIT:      '1601422407692-ec4eeec1d9b3',
  'Zone 2':  '1571731956672-f2b94d7dd0cb',
  Tempo:     '1547592180-85f173990554',
  Long:      '1558618666-fcd25c85cd64',
  Recovery:  '1477332552946-cfb384aeaf1c',
  Mobility:  '1544367567-0f2fcb009e0b',
  default:   '1540497077202-7c8a3999166f',
};
function getWorkoutImageUrl(day){
  if(!day) return null;
  const keys=Object.keys(DAY_IMAGES).filter(k=>k!=='default');
  const haystack=[(day.short||''),(day.name||''),...(day.tags||[])].join(' ');
  const found=keys.find(k=>haystack.includes(k));
  return `https://images.unsplash.com/photo-${found?DAY_IMAGES[found]:DAY_IMAGES.default}?auto=format&fit=crop&w=800&h=300&q=80`;
}

// Default day-of-week → workout index map per frequency (Mon=0 … Sun=6)
const WEEK_DEFAULTS={
  7:[0,1,2,3,4,5,6],
  6:[0,1,2,3,4,5,REST_DAY],
  5:[0,1,2,3,4,REST_DAY,REST_DAY],
  4:[0,1,REST_DAY,2,3,REST_DAY,REST_DAY],
  3:[0,REST_DAY,1,REST_DAY,2,REST_DAY,REST_DAY],
};

// Swap out exercises the user's equipment can't do for an equivalent from the same
// muscle group (matching Compound/Isolation type where possible). Only ever applied to
// default template days — a day the user has explicitly customized (getCustomDay) is
// left untouched, since that's their own deliberate choice.
function filterDayForEquipment(day,availEquip){
  if(!day||!Array.isArray(day.exercises)||!availEquip) return day;
  const usedNames=new Set(day.exercises.map(e=>e.name));
  let changed=false;
  const exercises=day.exercises.map(ex=>{
    const info=getExerciseInfo(ex.name);
    if(!info||availEquip.includes(info.equipment)) return ex;
    const muscle=getExerciseMuscle(ex.name);
    const pool=(EXERCISE_LIBRARY[muscle]||[]).filter(e=>availEquip.includes(e.equipment)&&!usedNames.has(e.name));
    const sub=pool.find(e=>e.type===info.type)||pool[0];
    if(!sub) return ex; // no equipment-compatible substitute in this muscle group — leave as-is
    usedNames.delete(ex.name); usedNames.add(sub.name); changed=true;
    return {...ex,name:sub.name};
  });
  return changed?{...day,exercises}:day;
}
function getActiveDays(){
  // AI-generated plan takes priority when present
  const ai=getAIPlan();
  if(ai&&Array.isArray(ai.days)&&ai.days.length) return ai.days;
  const dpw=getDaysPerWeek(),goal=getGoal();
  const avail=getAvailableEquipment();
  const applyOverrides=base=>base.map((d,i)=>getCustomDay(i)||filterDayForEquipment(d,avail));
  // Hybrid goal → dedicated strength+cardio rotation
  if(goal==='hybrid'){
    const base=HYBRID_PROGRAMS[dpw]||HYBRID_PROGRAMS[4];
    return applyOverrides(base);
  }
  // Pure cardio goal → use dedicated cardio-only schedule
  if(goal==='cardio'){
    const cpKeys=Object.keys(CARDIO_PROGRAMS).map(Number);
    const cpKey=CARDIO_PROGRAMS[dpw]?dpw:cpKeys.reduce((a,b)=>Math.abs(b-dpw)<Math.abs(a-dpw)?b:a);
    return applyOverrides(CARDIO_PROGRAMS[cpKey]);
  }
  let base;
  if(PROGRAMS[dpw]) base=PROGRAMS[dpw];
  else if(dpw===5) base=DAYS.slice(0,5);
  else if(dpw===6) base=DAYS.slice(0,6);
  else base=DAYS;
  // Fat loss goal with a frequency-based program → inject a dedicated cardio day
  if(goal==='fat_loss'&&PROGRAMS[dpw]) base=[...base,getCardioDay()];
  // Apply per-slot custom day overrides
  return applyOverrides(base);
}
function getActiveDay(idx){
  if(idx>=BONUS_BASE){
    const b=BONUS_WORKOUTS[idx-BONUS_BASE];
    return b?(getCustomDay(idx)||filterDayForEquipment(b,getAvailableEquipment())):null;
  }
  return getActiveDays()[idx]||null;
}
// Goal "extras" (a HIIT finisher for fat loss, a steady-state block for cardio)
// belong on lifting days only. They used to be appended to every draft — rest
// days and cardio days included — which stacked duplicates like "HIIT
// Intervals" + "Cardio Finisher (HIIT)" on the same fat-loss cardio day, and a
// second steady-state block onto every cardio-goal session that already was one.
function getGoalExtrasForDay(day,goal){
  if(!day||!Array.isArray(day.exercises)||!day.exercises.length) return [];
  const timed=day.exercises.filter(e=>getExerciseMuscle(e.name)==='Cardio').length;
  if(timed*2>=day.exercises.length) return [];
  const names=new Set(day.exercises.map(e=>e.name));
  return (GOAL_EXERCISES[goal]||[]).filter(e=>!names.has(e.name));
}

// Goal-aware week defaults
function getGoalWeekDefaults(){
  const custom=getWeekTemplate();
  if(custom&&custom.length===7) return custom;
  const dpw=getDaysPerWeek(),goal=getGoal();
  if(goal==='hybrid') return HYBRID_WEEK_DEFAULTS[dpw]||HYBRID_WEEK_DEFAULTS[4];
  if(goal==='cardio'){
    const cpKeys=Object.keys(CARDIO_PROGRAMS).map(Number);
    const cpKey=CARDIO_PROGRAMS[dpw]?dpw:cpKeys.reduce((a,b)=>Math.abs(b-dpw)<Math.abs(a-dpw)?b:a);
    const n=CARDIO_PROGRAMS[cpKey].length;
    return [0,1,2,3,4,5,6].map((_,i)=>i<n?i:REST_DAY);
  }
  if(PROGRAMS[dpw]&&goal==='fat_loss'){
    const ci=PROGRAMS[dpw].length; // index of CARDIO_DAY in getActiveDays()
    if(dpw===3) return [0,ci,1,ci,2,REST_DAY,REST_DAY];
    if(dpw===4) return [0,1,ci,2,3,REST_DAY,REST_DAY];
  }
  return WEEK_DEFAULTS[dpw]||WEEK_DEFAULTS[7];
}


// ── Goals ─────────────────────────────────────────────────────────────────────
const GOALS=[
  {id:'muscle',  icon:'🏋️', label:'Build Muscle',       desc:'Progressive overload, heavy compounds'},
  {id:'fat_loss',icon:'🔥', label:'Fat Loss',            desc:'Higher reps, shorter rest, volume'},
  {id:'hybrid',  icon:'🏃', label:'Strength & Cardio',  desc:'Lift 2–3×/week, run or HIIT 2×/week'},
  {id:'cardio',  icon:'❤️', label:'Cardio Focus',        desc:'Endurance & active recovery priority'},
  {id:'general', icon:'⚖️', label:'General Fitness',     desc:'Balanced strength & health'},
];

// ── Hybrid strength + cardio programs ────────────────────────────────────────
// Session building blocks — composed into 3–7 day weeks below. The 4-day week is
// the original plan; the others used to silently fall back to it regardless of
// how many days you'd picked, so a 6-day hybrid athlete only ever saw 4 days.
const HYBRID_SESSIONS={
  upper:{dow:'Mon', name:'Upper Strength', short:'Upper', dots:[CORAL,BLUE,PURPLE],
     tags:['Chest','Back','Shoulders'],
     defaultNote:'Upper strength day — focus on compound presses and rows. Rest 90s–2 min between sets.',
     exercises:[
      {name:'Barbell Bench Press', structure:'4 × 5',  note:'Primary strength — add weight when all 5 reps are clean'},
      {name:'Barbell Row',         structure:'4 × 6',  note:'Pull as hard as you push — flat back, drive elbows to hips'},
      {name:'Overhead Press',      structure:'3 × 8',  note:'Strict press — no leg drive, keep ribs down'},
      {name:'Lat Pulldown',        structure:'3 × 10', note:'Full stretch at top, squeeze lats at bottom'},
      {name:'Bicep Curls',         structure:'3 × 12', note:'Slow eccentric — 3 seconds down'},
     ]},
  cardioCore:{dow:'Wed', name:'Cardio & Core', short:'Cardio', dots:[BLUE,GREEN],
     tags:['Cardio','Core'],
     defaultNote:'Cardio day — 25 min continuous effort then core circuit. Keep intensity sustainable throughout.',
     exercises:[
      {name:'Treadmill / Walk-Run',  structure:'25 min',     note:'Zone 2 — 60–70% max HR, conversational pace'},
      {name:'Plank Hold',            structure:'3 × 60s',    note:'Hollow body — ribs down, glutes squeezed'},
      {name:'Hanging Knee Raise',    structure:'3 × 15',     note:'Controlled — no swinging, squeeze at top'},
      {name:'Dead Bug',              structure:'3 × 10 ea',  note:'Lower back stays flat — slow and deliberate'},
     ]},
  lower:{dow:'Fri', name:'Lower Strength', short:'Lower', dots:[GREEN,AMBER],
     tags:['Quads','Hamstrings','Glutes'],
     defaultNote:'Lower strength day — squat and hinge are the stars. Full range of motion on every rep.',
     exercises:[
      {name:'Barbell Back Squat',    structure:'4 × 5',      note:'Primary strength — hit depth every rep, chest up'},
      {name:'Romanian Deadlift',     structure:'4 × 8',      note:'Hip hinge — feel the hamstring stretch, not a squat'},
      {name:'Leg Press',             structure:'3 × 10',     note:'Full ROM — don\'t cut depth to load more weight'},
      {name:'Walking Lunges',        structure:'3 × 10 ea',  note:'Slow and controlled — feel the glute load'},
      {name:'Standing Calf Raise',   structure:'4 × 15',     note:'Full stretch at bottom — pause 1s before rising'},
     ]},
  conditioning:{dow:'Sat', name:'Conditioning', short:'HIIT', dots:[CORAL,AMBER],
     tags:['HIIT','Full Body','Conditioning'],
     defaultNote:'Conditioning day — short rest, high effort. This session builds your engine as much as your physique.',
     exercises:[
      {name:'Cardio Finisher (HIIT)',structure:'15 min',     note:'30s max effort / 30s rest × 15 rounds — true max effort'},
      {name:'Kettlebell Swing',      structure:'4 × 20',     note:'Hip snap — not a squat, hinge and drive through hips'},
      {name:'Dumbbell Thruster',     structure:'3 × 12',     note:'Squat to overhead press — one fluid movement, no pause'},
      {name:'Farmer\'s Carry',       structure:'3 × 40m',    note:'Chest tall, grip tight, walk fast — shoulders packed'},
     ]},
  fullBodyA:{dow:'Day 1', name:'Full Body Strength A', short:'Full A', dots:[GREEN,CORAL,BLUE],
     tags:['Full Body','Strength'],
     defaultNote:'Squat, press, pull — the three big patterns in one session. Rest 2 min between main sets.',
     exercises:[
      {name:'Barbell Back Squat',  structure:'4 × 5',  note:'Primary strength — hit depth every rep, chest up'},
      {name:'Barbell Bench Press', structure:'4 × 5',  note:'Controlled descent, pause on the chest, drive up'},
      {name:'Barbell Row',         structure:'3 × 8',  note:'Flat back, pull to lower ribs'},
      {name:'Face Pull',           structure:'3 × 15', note:'Shoulder health — external rotation at the end'},
      {name:'Plank Hold',          structure:'3 × 45s',note:'Ribs down, glutes squeezed'},
     ]},
  fullBodyB:{dow:'Day 3', name:'Full Body Strength B', short:'Full B', dots:[AMBER,GREEN,BLUE],
     tags:['Full Body','Strength'],
     defaultNote:'Hinge, overhead press, vertical pull — complements Day A so every pattern gets trained twice a week.',
     exercises:[
      {name:'Romanian Deadlift',   structure:'4 × 8',     note:'Hip hinge — hamstrings pull taut, bar skims legs'},
      {name:'Overhead Press',      structure:'4 × 6',     note:'Strict — brace core and glutes, full lockout'},
      {name:'Lat Pulldown',        structure:'3 × 10',    note:'Full stretch at top, elbows to hips'},
      {name:'Walking Lunges',      structure:'3 × 10 ea', note:'Long stride, upright torso'},
      {name:'Hanging Knee Raise',  structure:'3 × 12',    note:'No swinging — curl the pelvis up'},
     ]},
  upperVolume:{dow:'Day 5', name:'Upper Volume', short:'Upper B', dots:[CORAL,BLUE,AMBER],
     tags:['Chest','Back','Arms'],
     defaultNote:'Second upper day — moderate weight, higher reps. Chase the pump, not a max.',
     exercises:[
      {name:'Incline DB Press',      structure:'3 × 10', note:'Upper chest — elbows at 45°'},
      {name:'Cable Seated Row',      structure:'3 × 12', note:'Hold the squeeze 1s'},
      {name:'Lateral Raises',        structure:'4 × 15', note:'3s eccentric — no swinging'},
      {name:'Face Pull',             structure:'3 × 15', note:'Rear delts and rotator cuff'},
      {name:'Hammer Curls',          structure:'3 × 12', note:'Neutral grip, no swing'},
      {name:'Tricep Cable Pushdown', structure:'3 × 12', note:'Elbows pinned, full extension'},
     ]},
  zone2Long:{dow:'Day 6', name:'Long Zone 2', short:'Zone 2', dots:[BLUE,GREEN],
     tags:['Cardio','Zone 2','Endurance'],
     defaultNote:'The aerobic-base session — long and genuinely easy. If you can\'t talk in full sentences, slow down.',
     exercises:[
      {name:'Light Jog',             structure:'40 min', note:'60–70% max HR — swap for cycling or rowing any week'},
      {name:'Hip Mobility Flow',     structure:'8 min',  note:'Undo the miles — 90/90s, hip circles, deep squat hold'},
     ]},
};
const _hybridWeek=(...keys)=>keys.map(k=>k==='recovery'?STRENGTH_RECOVERY_DAY:HYBRID_SESSIONS[k]);
const HYBRID_PROGRAMS={
  3:_hybridWeek('fullBodyA','cardioCore','fullBodyB'),
  4:_hybridWeek('upper','cardioCore','lower','conditioning'),
  5:_hybridWeek('upper','cardioCore','lower','conditioning','zone2Long'),
  6:_hybridWeek('upper','cardioCore','lower','conditioning','upperVolume','zone2Long'),
  7:_hybridWeek('upper','cardioCore','lower','conditioning','upperVolume','zone2Long','recovery'),
};
// Mon…Sun → index into HYBRID_PROGRAMS[dpw]. Strength days never land back-to-back
// with the conditioning day that hits the same legs.
const HYBRID_WEEK_DEFAULTS={
  3:[0,REST_DAY,1,REST_DAY,2,REST_DAY,REST_DAY],
  4:[0,REST_DAY,1,REST_DAY,2,3,REST_DAY],
  5:[0,1,REST_DAY,2,REST_DAY,3,4],
  6:[0,1,2,REST_DAY,4,3,5],
  7:[0,1,2,6,4,3,5],
};

// ── Bonus workouts ───────────────────────────────────────────────────────────
// Standalone sessions you can drop onto any date (a rest day you feel good on,
// a travel day, a short-on-time day) without touching your program. They live
// at dayIdx BONUS_BASE+i — well clear of any program's 0…6 — so they never
// shift program day indices, which sessions/custom days/schedules all key on,
// and never enter the next-workout rotation. Each one earns a bonus-XP kicker.
const BONUS_BASE=100;
const BONUS_WORKOUTS=[
  {dow:'Bonus',name:'Full Body Express',short:'Full Body',dots:[GREEN,CORAL,BLUE],
   tags:['Full Body','Quick','~30 min'],
   defaultNote:'Short on time — one movement per pattern, 60–90s rest. In and out in half an hour.',
   exercises:[
    {name:'Goblet Squat',         structure:'3 × 12',    note:'Elbows inside knees at the bottom, chest tall'},
    {name:'Dumbbell Bench Press', structure:'3 × 10',    note:'Full stretch at the bottom, press up and slightly in'},
    {name:'Dumbbell Row',         structure:'3 × 10 ea', note:'Pull the elbow to your hip'},
    {name:'Dumbbell RDL',         structure:'3 × 10',    note:'Hinge — dumbbells skim your thighs'},
    {name:'Plank Hold',           structure:'2 × 45s',   note:'Squeeze glutes, ribs down'},
   ]},
  {dow:'Bonus',name:'No-Equipment Anywhere',short:'Bodyweight',dots:[GREEN,AMBER],
   tags:['Bodyweight','Travel','Full Body'],
   defaultNote:'Hotel room, living room, park — no kit needed. Move briskly between exercises.',
   exercises:[
    {name:'Push-Up',              structure:'4 × 12',    note:'Body in one straight line — scale to knees if needed'},
    {name:'Bodyweight Squat',     structure:'4 × 20',    note:'Sit between your heels, full depth'},
    {name:'Glute Bridge',         structure:'3 × 15',    note:'Pause 1s at the top'},
    {name:'Diamond Push-Up',      structure:'3 × 10',    note:'Hands together under the chest — triceps burner'},
    {name:'Mountain Climber',     structure:'3 × 30',    note:'Fast feet, hips level'},
    {name:'Side Plank',           structure:'2 × 30s ea',note:'Stack the hips, don\'t let them sag'},
   ]},
  {dow:'Bonus',name:'Arm Pump',short:'Arms',dots:[PURPLE,AMBER],
   tags:['Biceps','Triceps','Pump'],
   defaultNote:'Superset each curl with the pushdown/extension after it. 45–60s rest — chase the pump.',
   exercises:[
    {name:'Incline Dumbbell Curl',     structure:'3 × 12', note:'Arms hang behind you — huge stretch at the bottom'},
    {name:'Rope Pushdown',             structure:'3 × 12', note:'Split the rope at the bottom'},
    {name:'Hammer Curls',              structure:'3 × 12', note:'Neutral grip, no swing'},
    {name:'Overhead Tricep Extension', structure:'3 × 12', note:'Long-head stretch'},
    {name:'Cable Curls',               structure:'2 × 15', note:'Burnout — constant tension'},
   ]},
  {dow:'Bonus',name:'Core Crusher',short:'Core',dots:[GRAY,CORAL],
   tags:['Core','Abs','~20 min'],
   defaultNote:'Anti-extension, anti-rotation, flexion — a complete core session in 20 minutes.',
   exercises:[
    {name:'Hanging Leg Raise', structure:'3 × 10',    note:'Curl the pelvis up — don\'t just lift the legs'},
    {name:'Cable Crunch',      structure:'3 × 15',    note:'Round the spine, don\'t pull with the arms'},
    {name:'Pallof Press',      structure:'3 × 10 ea', note:'Resist the twist — press straight out'},
    {name:'Side Plank',        structure:'3 × 30s ea',note:'Hips high'},
    {name:'Dead Bug',          structure:'3 × 10 ea', note:'Lower back glued to the floor'},
   ]},
  {dow:'Bonus',name:'Glute Builder',short:'Glutes',dots:[CORAL,GREEN],
   tags:['Glutes','Hamstrings'],
   defaultNote:'Glute-focused lower session — slow eccentrics, hard squeeze at lockout.',
   exercises:[
    {name:'Hip Thrust (Barbell)',  structure:'4 × 10',    note:'Chin tucked, ribs down — pause 1s at the top'},
    {name:'Bulgarian Split Squat', structure:'3 × 10 ea', note:'Lean forward slightly to bias the glute'},
    {name:'Cable Kickback',        structure:'3 × 15 ea', note:'Kick back and slightly out — no lower-back arch'},
    {name:'Hip Abduction Machine', structure:'3 × 20',    note:'Lean forward for upper-glute emphasis'},
    {name:'Frog Pump',             structure:'2 × 30',    note:'Burnout — soles together, fast reps'},
   ]},
  {dow:'Bonus',name:'Shoulder Health & Posture',short:'Posture',dots:[GREEN,BLUE],
   tags:['Shoulders','Prehab','Light'],
   defaultNote:'Rotator cuff and upper-back work — light weights, perfect reps. Great on a rest day.',
   exercises:[
    {name:'Banded Pull-Apart',          structure:'3 × 20',  note:'Squeeze the shoulder blades together'},
    {name:'Face Pull',                  structure:'3 × 15',  note:'Pull to the eyes, rotate the hands back'},
    {name:'Shoulder External Rotation', structure:'3 × 12 ea',note:'Elbow pinned to your side'},
    {name:'Prone Y-T-W',                structure:'2 × 8',   note:'Thumbs up, slow and strict'},
    {name:'Wall Slide',                 structure:'2 × 12',  note:'Keep wrists and elbows on the wall'},
   ]},
  {dow:'Bonus',name:'HIIT 20',short:'HIIT 20',dots:[CORAL,BLUE],
   tags:['HIIT','Conditioning','~20 min'],
   defaultNote:'Twenty minutes, all-out work intervals. Full effort on, full recovery off.',
   exercises:[
    {name:'Warm-up Jog',     structure:'3 min',          note:'Easy — get the heart rate up gradually'},
    {name:'Tabata Protocol', structure:'2 × 4 min',      note:'20s max / 10s rest × 8 — 1 min easy between blocks'},
    {name:'Battle Ropes',    structure:'5 × 30s / 30s',  note:'Alternating waves, stay low'},
    {name:'Burpees',         structure:'5 min EMOM × 6', note:'6 burpees at the top of every minute'},
    {name:'Cool-down Walk',  structure:'3 min',          note:'Bring the heart rate down before stopping'},
   ]},
  {dow:'Bonus',name:'Desk-Worker Reset',short:'Reset',dots:[GREEN],
   tags:['Mobility','Recovery','Light'],
   defaultNote:'Undo a day of sitting — open the hips and upper back. Gentle, no intensity.',
   exercises:[
    {name:'Thoracic Mobility', structure:'6 min',      note:'Open books and thread-the-needle'},
    {name:'Hip Mobility Flow', structure:'8 min',      note:'Couch stretch and 90/90 switches'},
    {name:'Bird Dog',          structure:'2 × 10 ea',  note:'Reach long, hips square'},
    {name:'Wall Slide',        structure:'2 × 12',     note:'Slow — feel the upper back work'},
    {name:'Foam Roll',         structure:'5 min',      note:'Upper back, lats, glutes'},
   ]},
  {dow:'Bonus',name:'Upper Body Express',short:'Upper',dots:[CORAL,BLUE,GREEN],
   tags:['Chest','Back','Shoulders','~35 min'],
   defaultNote:'Push/pull alternating — pair each press with the pull after it to save time.',
   exercises:[
    {name:'Pull-Up',               structure:'3 × max', note:'Dead hang to chin over bar — use assistance if needed'},
    {name:'Seated Dumbbell Press', structure:'3 × 10',  note:'Back supported, press straight up'},
    {name:'Chest-Supported Row',   structure:'3 × 10',  note:'Chest stays on the pad'},
    {name:'Incline DB Press',      structure:'3 × 10',  note:'Upper chest, elbows at 45°'},
    {name:'Lateral Raises',        structure:'3 × 15',  note:'Lead with the elbows'},
   ]},
  {dow:'Bonus',name:'Leg Day Express',short:'Legs',dots:[GREEN,AMBER],
   tags:['Quads','Hamstrings','Calves','~35 min'],
   defaultNote:'Machine-based legs — safe to push hard without a spotter.',
   exercises:[
    {name:'Leg Press',           structure:'4 × 12', note:'Full depth, don\'t lock the knees'},
    {name:'Lying Leg Curl',      structure:'3 × 12', note:'Hips stay down on the pad'},
    {name:'Leg Extension',       structure:'3 × 15', note:'Squeeze 1s at the top'},
    {name:'Walking Lunges',      structure:'2 × 10 ea',note:'Long stride, upright torso'},
    {name:'Standing Calf Raise', structure:'3 × 15', note:'Full stretch, pause at the bottom'},
   ]},
];
const BONUS_XP=25;
function isBonusDayIdx(idx){ return idx>=BONUS_BASE&&idx<BONUS_BASE+BONUS_WORKOUTS.length }
function getBonusWorkouts(){ return BONUS_WORKOUTS.map((_,i)=>getActiveDay(BONUS_BASE+i)) }

// ── Personas shown in onboarding step 2 ──────────────────────────────────────
const PERSONAS=[
  {
    id:'new_lifter', type:'strength', goal:'general', dpw:3, name:'New to Lifting',
    icon:'🌱', color:'#3aab6d',
    headline:'New to Lifting',
    tagline:'Start strong and build a habit that sticks',
    bullets:[
      '3 sessions/week — enough stimulus to grow, enough rest to recover',
      'Push · Pull · Legs split — the most time-tested beginner structure',
      'Every session teaches the fundamentals: squat, press, pull, hinge',
    ],
    tags:['Beginner','3 days/week','Full Body'],
  },
  {
    id:'build_muscle', type:'strength', goal:'muscle', dpw:5, name:'5-Day Hypertrophy',
    icon:'🏋️', color:'#8b6fd4',
    headline:'Build Muscle',
    tagline:'Maximum hypertrophy through progressive overload',
    bullets:[
      '5-day split — each muscle trained twice a week for optimal frequency',
      'Heavy compounds backed by targeted isolation work',
      'Log every top set and add weight or reps each session',
    ],
    tags:['Intermediate+','5 days/week','Hypertrophy'],
  },
  {
    id:'fat_loss', type:'strength', goal:'fat_loss', dpw:4, name:'Fat Loss Circuit',
    icon:'🔥', color:'#e05555',
    headline:'Lose Body Fat',
    tagline:'Strength + cardio finisher every session',
    bullets:[
      '4 days/week of strength circuits with built-in cardio finishers',
      'Short rest keeps your heart rate elevated to maximize calorie burn',
      'Muscle is preserved while fat drops — not just "burning calories"',
    ],
    tags:['Fat Loss','4 days/week','Circuit'],
  },
  {
    id:'lift_and_run', type:'hybrid', goal:'hybrid', dpw:4, name:'Lift & Run',
    icon:'🏃', color:'#5b9bd5',
    headline:'Lift & Run',
    tagline:'Two strength days, two cardio days — best of both',
    bullets:[
      'Mon/Fri: heavy compound lifts — bench, squat, deadlift, rows',
      'Wed/Sat: cardio + conditioning — zone 2 running and HIIT circuits',
      'You\'ll be stronger AND fitter — not forced to choose one',
    ],
    tags:['Hybrid','4 days/week','Strength + Cardio'],
  },
  {
    id:'general_health', type:'strength', goal:'general', dpw:4, name:'Upper / Lower',
    icon:'⚖️', color:'#c9963c',
    headline:'General Health',
    tagline:'Balanced strength and fitness for life',
    bullets:[
      '4-day upper/lower split — the most balanced programming structure',
      'Every session hits both strength and movement quality',
      'Sustainable pace — you can run this program for years',
    ],
    tags:['Balanced','4 days/week','Upper/Lower'],
  },
  {
    id:'pure_cardio', type:'cardio', goal:'cardio', dpw:4, name:'Pure Cardio',
    icon:'❤️', color:'#e05b9b',
    headline:'Cardio Focus',
    tagline:'Build your aerobic engine — steady state, HIIT & Zone 2',
    bullets:[
      'Steady state, HIIT, and Zone 2 sessions across the week',
      'Evidence-based aerobic structure — not random treadmill time',
      'Active recovery built in so you can sustain it long-term',
    ],
    tags:['Cardio','3–5 days/week','Endurance'],
  },
  {
    id:'custom', type:'custom', goal:null, dpw:null, name:'Build My Own',
    icon:'✏️', color:'#888',
    headline:'Build My Own',
    tagline:'Full control from day one',
    bullets:[
      'Choose your goal and how many days you want to train',
      'Pick any exercises from the full library',
      'Use the AI plan builder or set it up manually',
    ],
    tags:['Custom','Any schedule'],
  },
];

// Extra exercises appended to every session based on goal
const GOAL_EXERCISES={
  fat_loss:[
    {name:'Cardio Finisher (HIIT)', plan:'15 min — 30s max effort / 30s rest × 15 rounds', note:'Non-negotiable — EPOC burns calories for hours after'},
    {name:'Cool-down Walk',         plan:'5 min easy treadmill or bike',                   note:'Heart-rate return + active recovery'},
  ],
  cardio:[
    {name:'Cardio — Steady State',  plan:'30 min treadmill or bike @ 60–70% max HR',       note:'LISS zone — you should be able to hold a conversation'},
  ],
  hybrid:[],  // sessions vary — strength days vs cardio days baked into the plan
  muscle:[],
  general:[],
};

// Per-goal coaching banner shown in the detail panel
const GOAL_COACHING={
  muscle:  '💪 Muscle goal: rest 90s–2 min between main sets. Aim to add weight or reps every session — that\'s the whole game.',
  fat_loss:'🔥 Fat loss goal: keep rest ≤60s between sets. Complete the cardio finisher at the end — this is where the goal is won.',
  hybrid:  '🏃 Hybrid goal: treat strength and cardio sessions as equal. Never skip either — the combination is what creates your results.',
  cardio:  '❤️ Cardio goal: keep most sessions truly easy (conversational pace) and save the hard efforts for HIIT and tempo days.',
  general: '',
};

// Extra note appended to plan cell based on goal
const GOAL_PLAN_TAG={
  muscle:  '<span style="font-size:10px;color:#8b6fd4;margin-top:3px;display:block">↑ add weight when all reps clean</span>',
  fat_loss:'<span style="font-size:10px;color:#e05555;margin-top:3px;display:block">⏱ rest ≤ 60s</span>',
  hybrid:  '<span style="font-size:10px;color:#5b9bd5;margin-top:3px;display:block">💪+🏃 lift days & cardio days</span>',
  cardio:  '<span style="font-size:10px;color:#5b9bd5;margin-top:3px;display:block">⏱ superset if possible</span>',
  general: '',
};

// ── Exercise library (organized by muscle group) ──────────────────────────────
const MUSCLE_COLORS={
  Chest:'#e07b39',Back:'#5b9bd5',Shoulders:'#3aab6d',Biceps:'#8b6fd4',
  Triceps:'#d4a45b',Traps:'#b07a3e',Quads:'#4ab6a0',Hamstrings:'#4ab6a0',
  Glutes:'#e05b9b',Calves:'#888',Core:'#e05555',Cardio:'#e05555',
};

// Curated Unsplash photo IDs per muscle group — used as swap-card thumbnails.
// Each ID is a real Unsplash photo confirmed to show relevant exercise/muscle content.
const MUSCLE_PHOTOS={
  Chest:      '1571019614242-c5c5dee9f50b',
  Back:       '1534438327276-14e5300c3a48',
  Shoulders:  '1583454110551-21f2fa2afe61',
  Biceps:     '1590507621108-433608c97823',
  Triceps:    '1581009137042-c552e485697a',
  Quads:      '1574680178050-55c6a516c152',
  Hamstrings: '1566241440091-ec10de8db2e1',
  Glutes:     '1601422407692-ec4eeec1d9b3',
  Calves:     '1517838277536-f5f99be501cd',
  Core:       '1571019613576-6c6a462f6a3b',
  Cardio:     '1476480862126-209bfaa8edc8',
  Traps:      '1534439901-5b14b27dfb31',
};
function getExerciseImgUrl(muscle,w=300,h=120){
  const id=MUSCLE_PHOTOS[muscle];
  if(!id) return null;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=65`;
}

// Evidence-based weekly set volume targets (min = minimum effective, max = maximum adaptive)
const MUSCLE_VOLUME_TARGETS={
  Chest:      {min:8,  max:20},
  Back:       {min:10, max:25},
  Shoulders:  {min:8,  max:20},
  Biceps:     {min:6,  max:20},
  Triceps:    {min:6,  max:20},
  Quads:      {min:8,  max:20},
  Hamstrings: {min:6,  max:16},
  Glutes:     {min:6,  max:20},
  Calves:     {min:6,  max:16},
  Core:       {min:6,  max:16},
  Traps:      {min:4,  max:14},
};

const EXERCISE_LIBRARY={
  Chest:[
    // ── Barbell ───────────────────────────────────────────────────────────────
    {name:'Barbell Bench Press',          type:'Compound',  equipment:'Barbell'},
    {name:'Incline Barbell Press',        type:'Compound',  equipment:'Barbell'},
    {name:'Decline Barbell Press',        type:'Compound',  equipment:'Barbell'},
    {name:'Close-Grip Bench Press',       type:'Compound',  equipment:'Barbell'},
    {name:'Guillotine Press',             type:'Compound',  equipment:'Barbell'},
    {name:'Pause Bench Press',            type:'Compound',  equipment:'Barbell'},
    {name:'Floor Press',                  type:'Compound',  equipment:'Barbell'},
    {name:'Smith Machine Bench Press',    type:'Compound',  equipment:'Machine'},
    {name:'Smith Machine Incline Press',  type:'Compound',  equipment:'Machine'},
    {name:'Landmine Press',               type:'Compound',  equipment:'Barbell'},
    // ── Dumbbell ─────────────────────────────────────────────────────────────
    {name:'Dumbbell Bench Press',         type:'Compound',  equipment:'Dumbbell'},
    {name:'Decline Dumbbell Press',       type:'Compound',  equipment:'Dumbbell'},
    {name:'Incline DB Press',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Flat Dumbbell Fly',            type:'Isolation', equipment:'Dumbbell'},
    {name:'Incline Dumbbell Fly',         type:'Isolation', equipment:'Dumbbell'},
    {name:'Dumbbell Pullover',            type:'Isolation', equipment:'Dumbbell'},
    {name:'Hex Press',                    type:'Compound',  equipment:'Dumbbell'},
    {name:'Svend Press',                  type:'Isolation', equipment:'Dumbbell'},
    // ── Machine ───────────────────────────────────────────────────────────────
    {name:'Chest Press (machine)',        type:'Compound',  equipment:'Machine'},
    {name:'Chest Press (neutral grip)',   type:'Compound',  equipment:'Machine'},
    {name:'Chest Fly',                    type:'Isolation', equipment:'Machine'},
    {name:'Incline Fly or Pec Deck',      type:'Isolation', equipment:'Machine'},
    // ── Cable ─────────────────────────────────────────────────────────────────
    {name:'Cable Fly',                    type:'Isolation', equipment:'Cable'},
    {name:'Cable Crossover',              type:'Isolation', equipment:'Cable'},
    {name:'Low-to-High Cable Fly',        type:'Isolation', equipment:'Cable'},
    {name:'High-to-Low Cable Fly',        type:'Isolation', equipment:'Cable'},
    {name:'Mid Cable Fly',                type:'Isolation', equipment:'Cable'},
    {name:'Incline Cable Fly',            type:'Isolation', equipment:'Cable'},
    // ── Bodyweight ────────────────────────────────────────────────────────────
    {name:'Push-Up',                      type:'Compound',  equipment:'Bodyweight'},
    {name:'Weighted Push-Up',             type:'Compound',  equipment:'Bodyweight'},
    {name:'Wide Push-Up',                 type:'Compound',  equipment:'Bodyweight'},
    {name:'Archer Push-Up',               type:'Compound',  equipment:'Bodyweight'},
    {name:'Dips (chest-focused)',         type:'Compound',  equipment:'Bodyweight'},
    {name:'Weighted Dips (chest)',        type:'Compound',  equipment:'Bodyweight'},
  ],
  Back:[
    // ── Lat pulldown variations ───────────────────────────────────────────────
    {name:'Lat Pulldown',                   type:'Compound',  equipment:'Cable',     targets:'Lats',                  cue:'Wide overhand grip; pull bar to upper chest, drive elbows toward hips'},
    {name:'Lat Pulldown — Close Grip',      type:'Compound',  equipment:'Cable',     targets:'Lats + Biceps',         cue:'Neutral/underhand close grip; more bicep pull, squeeze lower lat at bottom'},
    {name:'Lat Pulldown — Trap Focus',      type:'Compound',  equipment:'Cable',     targets:'Upper Back / Traps',    cue:'Lean back ~30°, pull bar to chest; focus on scapular retraction and squeeze'},
    {name:'Lat Pulldown — Underhand',       type:'Compound',  equipment:'Cable',     targets:'Lats + Lower Biceps',   cue:'Supinated (chin-up) grip; elbows close to body, slight backward lean'},
    {name:'Wide-Grip Lat Pulldown',         type:'Compound',  equipment:'Cable',     targets:'Lat Width',             cue:'Extra-wide overhand; prioritise stretch at top for lat flare'},
    {name:'Single-Arm Lat Pulldown',        type:'Compound',  equipment:'Cable',     targets:'Lats (unilateral)',     cue:'Slight lateral lean away, pull to shoulder; great for imbalances'},
    // ── Row variations ────────────────────────────────────────────────────────
    {name:'Cable Seated Row',               type:'Compound',  equipment:'Cable',     targets:'Mid Back / Rhomboids',  cue:'Drive elbows back; hold 1s at peak contraction, controlled release'},
    {name:'Cable Seated Row — Wide Grip',   type:'Compound',  equipment:'Cable',     targets:'Upper Back / Rear Delt',cue:'Wide neutral or overhand grip; more rear delt and upper trap activation'},
    {name:'Machine Row',                    type:'Compound',  equipment:'Machine',   targets:'Mid Back',              cue:'Chest pad support; drive elbows back and squeeze shoulder blades'},
    {name:'Assisted Pull-Up Machine',       type:'Compound',  equipment:'Machine',   targets:'Lats + Upper Back',     cue:'Counterweight assists the pull; dial the assist down over time toward a bodyweight pull-up'},
    {name:'High Row Machine',               type:'Compound',  equipment:'Machine',   targets:'Upper Back / Lats',     cue:'Iso-lateral handles pull to chest height; squeeze shoulder blades at the top of each rep'},
    {name:'Barbell Row',                    type:'Compound',  equipment:'Barbell',   targets:'Full Back',             cue:'Hinge to ~45°; pull bar to lower chest, control the descent'},
    {name:'Pendlay Row',                    type:'Compound',  equipment:'Barbell',   targets:'Upper Back / Traps',    cue:'Start each rep from floor; explosive pull to chest, strict form'},
    {name:'Dumbbell Row',                   type:'Compound',  equipment:'Dumbbell',  targets:'Lats + Mid Back',       cue:'Knee on bench; pull elbow toward ceiling, full elbow extension at bottom'},
    {name:'Meadows Row',                    type:'Compound',  equipment:'Dumbbell',  targets:'Lats + Teres',          cue:'Landmine-style; elbow flares wide, targets outer lat and teres major'},
    {name:'Seal Row',                       type:'Compound',  equipment:'Dumbbell',  targets:'Mid Back (strict)',     cue:'Chest on incline bench; eliminates leg drive, pure back pull'},
    {name:'T-Bar Row',                      type:'Compound',  equipment:'Barbell',   targets:'Mid Back / Lats',       cue:'Overhand or neutral grip; chest pad optional; squeeze at the top'},
    {name:'Single-Arm Cable Row',           type:'Compound',  equipment:'Cable',     targets:'Lats + Rhomboids',      cue:'Rotate slightly into the pull; reach forward for full stretch'},
    // ── Pull-ups / chin-ups ───────────────────────────────────────────────────
    {name:'Pull-Up',                        type:'Compound',  equipment:'Bodyweight',targets:'Lats + Upper Back',     cue:'Overhand grip, shoulder-width; dead hang start, chest to bar'},
    {name:'Chin-Up',                        type:'Compound',  equipment:'Bodyweight',targets:'Lats + Biceps',         cue:'Underhand grip; more bicep recruitment than pull-up'},
    {name:'Neutral-Grip Pull-Up',           type:'Compound',  equipment:'Bodyweight',targets:'Lats + Brachialis',     cue:'Palms facing each other; easiest on wrists, strong lat stretch'},
    // ── Deadlift / hinge ──────────────────────────────────────────────────────
    {name:'Deadlift',                       type:'Compound',  equipment:'Barbell',   targets:'Full Posterior Chain',  cue:'Bar over mid-foot; brace, hinge, push floor away — don\'t pull'},
    {name:'Romanian Deadlift (Back Focus)', type:'Compound',  equipment:'Barbell',   targets:'Hamstrings + Lower Back',cue:'Soft knees, push hips back; bar skims legs, feel hamstring stretch'},
    {name:'Rack Pull',                      type:'Compound',  equipment:'Barbell',   targets:'Upper Back / Traps',    cue:'Bar starts at knee height; overloads upper back and trap engagement'},
    // ── Isolation ─────────────────────────────────────────────────────────────
    {name:'Straight-Arm Pulldown',          type:'Isolation', equipment:'Cable',     targets:'Lats (long head)',      cue:'Arms straight, hinge at shoulder; best lat stretch-to-squeeze exercise'},
    {name:'Face Pull',                      type:'Isolation', equipment:'Cable',     targets:'Rear Delts + Traps',    cue:'Cable at face height; pull to forehead, externally rotate at end'},
    {name:'Hyperextension',                 type:'Compound',  equipment:'Bodyweight',targets:'Lower Back + Glutes',   cue:'Controlled; don\'t hyperextend the lumbar — stop at neutral'},
    {name:'Good Morning (Back Focus)',      type:'Compound',  equipment:'Barbell',   targets:'Lower Back + Hamstrings',cue:'Bar on upper back; hinge until back is ~45°, feel hamstring load'},
    // ── Additional back ───────────────────────────────────────────────────────
    {name:'Chest-Supported Row',            type:'Compound',  equipment:'Dumbbell',  targets:'Mid Back (strict)',     cue:'Chest flat on incline bench; eliminates lower back — pure back row'},
    {name:'Landmine Row',                   type:'Compound',  equipment:'Barbell',   targets:'Lats + Mid Back',       cue:'Hinge and row the sleeve end; elbow tracks close to body'},
    {name:'Inverted Row',                   type:'Compound',  equipment:'Bodyweight',targets:'Upper Back + Biceps',   cue:'Underhand grip, chest to bar; squeeze shoulder blades at top'},
    {name:'Kroc Row',                       type:'Compound',  equipment:'Dumbbell',  targets:'Lats + Mid Back',       cue:'Heavy dumbbell, slight body English allowed; full extension each rep'},
    {name:'Reverse-Grip Barbell Row',       type:'Compound',  equipment:'Barbell',   targets:'Lower Lats + Biceps',   cue:'Supinated grip keeps elbows tucked; hits lower lat and bicep more'},
    {name:'Trap Bar Deadlift',              type:'Compound',  equipment:'Barbell',   targets:'Full Posterior Chain',  cue:'Neutral grip handles; more quad-friendly than conventional deadlift'},
    {name:'Deficit Deadlift',               type:'Compound',  equipment:'Barbell',   targets:'Hamstrings + Lower Back',cue:'Stand on plate 1–2″; increases ROM at the bottom for hamstring stretch'},
    {name:'Banded Pull-Apart',              type:'Isolation', equipment:'Bodyweight',targets:'Rear Delts + Traps',    cue:'Arms straight; pull band to chest with control — great for posture'},
    {name:'Cable Pull-Through (Back Focus)',type:'Compound',  equipment:'Cable',     targets:'Glutes + Hamstrings',   cue:'Hinge not squat; let hips drive forward, arms stay straight'},
  ],
  Shoulders:[
    // ── Press ─────────────────────────────────────────────────────────────────
    {name:'Overhead Press',           type:'Compound',  equipment:'Barbell'},
    {name:'Shoulder Press (machine)', type:'Compound',  equipment:'Machine'},
    {name:'Shoulder Press',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Seated Dumbbell Press',    type:'Compound',  equipment:'Dumbbell'},
    {name:'Arnold Press',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Z-Press',                  type:'Compound',  equipment:'Barbell'},
    {name:'Push Press',               type:'Compound',  equipment:'Barbell'},
    {name:'Landmine Press (Shoulder Focus)', type:'Compound',  equipment:'Barbell'},
    {name:'Kettlebell Press',         type:'Compound',  equipment:'Equipment'},
    {name:'Bradford Press',           type:'Compound',  equipment:'Barbell'},
    {name:'Behind-the-Neck Press',    type:'Compound',  equipment:'Barbell'},
    // ── Lateral / side delt ───────────────────────────────────────────────────
    {name:'Lateral Raises',           type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Lateral Raise',      type:'Isolation', equipment:'Cable'},
    {name:'Machine Lateral Raise',    type:'Isolation', equipment:'Machine'},
    {name:'Bent-Over Lateral Raise',  type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Y-Raise',            type:'Isolation', equipment:'Cable'},
    // ── Rear delt ─────────────────────────────────────────────────────────────
    {name:'Rear Delt Machine',        type:'Isolation', equipment:'Machine'},
    {name:'Rear Delt',                type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Face Pull',          type:'Isolation', equipment:'Cable'},
    {name:'Prone Y-T-W',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Rear Delt Cable Fly',      type:'Isolation', equipment:'Cable'},
    // ── Front delt / misc ─────────────────────────────────────────────────────
    {name:'Front Raise',              type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Front Raise',        type:'Isolation', equipment:'Cable'},
    {name:'Plate Front Raise',        type:'Isolation', equipment:'Barbell'},
    {name:'Upright Row',              type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell Upright Row',     type:'Compound',  equipment:'Dumbbell'},
    {name:'Shoulder External Rotation',type:'Isolation',equipment:'Cable'},
  ],
  Biceps:[
    // ── Barbell ───────────────────────────────────────────────────────────────
    {name:'Barbell Curl',             type:'Isolation', equipment:'Barbell'},
    {name:'Barbell / Cable Curls',    type:'Isolation', equipment:'Barbell'},
    {name:'EZ-Bar Curl',              type:'Isolation', equipment:'Barbell'},
    {name:'Reverse Curl',             type:'Isolation', equipment:'Barbell'},
    {name:'Spider Curl',              type:'Isolation', equipment:'Barbell'},
    {name:'21s (EZ Bar)',             type:'Isolation', equipment:'Barbell'},
    // ── Dumbbell ─────────────────────────────────────────────────────────────
    {name:'Bicep Curls',              type:'Isolation', equipment:'Dumbbell'},
    {name:'Hammer Curls',             type:'Isolation', equipment:'Dumbbell'},
    {name:'Incline Dumbbell Curl',    type:'Isolation', equipment:'Dumbbell'},
    {name:'Concentration Curl',       type:'Isolation', equipment:'Dumbbell'},
    {name:'Cross-Body Hammer Curl',   type:'Isolation', equipment:'Dumbbell'},
    {name:'Zottman Curl',             type:'Isolation', equipment:'Dumbbell'},
    {name:'Waiter Curl',              type:'Isolation', equipment:'Dumbbell'},
    {name:'Pinwheel Curl',            type:'Isolation', equipment:'Dumbbell'},
    // ── Cable ─────────────────────────────────────────────────────────────────
    {name:'Cable Curls',              type:'Isolation', equipment:'Cable'},
    {name:'Cable Curls extended',     type:'Isolation', equipment:'Cable'},
    {name:'Cable Hammer Curl',        type:'Isolation', equipment:'Cable'},
    {name:'Bayesian Cable Curl',      type:'Isolation', equipment:'Cable'},
    {name:'Cable Preacher Curl',      type:'Isolation', equipment:'Cable'},
    {name:'Behind-the-Body Cable Curl',type:'Isolation',equipment:'Cable'},
    {name:'High Cable Curl',          type:'Isolation', equipment:'Cable'},
    // ── Machine ───────────────────────────────────────────────────────────────
    {name:'Preacher Curl',            type:'Isolation', equipment:'Machine'},
    {name:'Machine Curl',             type:'Isolation', equipment:'Machine'},
    // ── Bodyweight ───────────────────────────────────────────────────────────
    {name:'Towel Curl',               type:'Isolation', equipment:'Bodyweight'},
    {name:'Isometric Doorframe Curl', type:'Isolation', equipment:'Bodyweight'},
  ],
  Triceps:[
    // ── Cable pushdown variations ─────────────────────────────────────────────
    {name:'Tricep Cable Pushdown',      type:'Isolation', equipment:'Cable'},
    {name:'Rope Pushdown',              type:'Isolation', equipment:'Cable'},
    {name:'V-Bar Pushdown',             type:'Isolation', equipment:'Cable'},
    {name:'Single-Arm Pushdown',        type:'Isolation', equipment:'Cable'},
    {name:'Reverse-Grip Pushdown',      type:'Isolation', equipment:'Cable'},
    {name:'Straight-Bar Pushdown',      type:'Isolation', equipment:'Cable'},
    {name:'Cable Tricep Kickback',      type:'Isolation', equipment:'Cable'},
    {name:'Lying Cable Extension',      type:'Isolation', equipment:'Cable'},
    // ── Overhead extensions ───────────────────────────────────────────────────
    {name:'Overhead Tricep Extension',  type:'Isolation', equipment:'Cable'},
    {name:'Single-Arm Overhead Extension',type:'Isolation',equipment:'Cable'},
    {name:'Overhead DB Extension',      type:'Isolation', equipment:'Dumbbell'},
    {name:'EZ-Bar Overhead Extension',  type:'Isolation', equipment:'Barbell'},
    // ── Skull crushers / pressing ─────────────────────────────────────────────
    {name:'Skull Crusher',              type:'Isolation', equipment:'Barbell'},
    {name:'EZ-Bar Skull Crusher',       type:'Isolation', equipment:'Barbell'},
    {name:'Incline Skull Crusher',      type:'Isolation', equipment:'Barbell'},
    {name:'Dumbbell Skull Crusher',     type:'Isolation', equipment:'Dumbbell'},
    {name:'Close-Grip Bench Press (Tricep Focus)',     type:'Compound',  equipment:'Barbell'},
    {name:'Close-Grip EZ Press',        type:'Compound',  equipment:'Barbell'},
    {name:'JM Press',                   type:'Compound',  equipment:'Barbell'},
    {name:'Floor Press (Tricep Focus)', type:'Compound',  equipment:'Barbell'},
    {name:'Board Press',                type:'Compound',  equipment:'Barbell'},
    // ── Machine / dips ────────────────────────────────────────────────────────
    {name:'Tricep Dips (machine)',      type:'Compound',  equipment:'Machine'},
    {name:'Tricep Extension Machine',   type:'Isolation', equipment:'Machine'},
    {name:'Dips (tricep-focused)',      type:'Compound',  equipment:'Bodyweight'},
    {name:'Weighted Dips (triceps)',    type:'Compound',  equipment:'Bodyweight'},
    {name:'Diamond Push-Up',            type:'Compound',  equipment:'Bodyweight'},
    {name:'Close-Grip Push-Up',         type:'Compound',  equipment:'Bodyweight'},
    // ── Dumbbell ─────────────────────────────────────────────────────────────
    {name:'Tricep Kickback',            type:'Isolation', equipment:'Dumbbell'},
    {name:'Tate Press',                 type:'Isolation', equipment:'Dumbbell'},
    {name:'Two-Arm Overhead DB Extension',type:'Isolation',equipment:'Dumbbell'},
    {name:'Banded Tricep Pushdown',     type:'Isolation', equipment:'Bodyweight'},
  ],
  Traps:[
    // ── Shrug variations ─────────────────────────────────────────────────────
    {name:'Barbell Shrug',              type:'Isolation', equipment:'Barbell'},
    {name:'Dumbbell Shrug',             type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Shrug',                type:'Isolation', equipment:'Cable'},
    {name:'Machine Shrug',              type:'Isolation', equipment:'Machine'},
    {name:'Trap Bar Shrug',             type:'Isolation', equipment:'Barbell'},
    {name:'Behind-the-Back Shrug',      type:'Isolation', equipment:'Barbell'},
    {name:'Smith Machine Shrug',        type:'Isolation', equipment:'Machine'},
    {name:'Kelso Shrug',                type:'Isolation', equipment:'Machine'},
    {name:'Single-Arm DB Shrug',        type:'Isolation', equipment:'Dumbbell'},
    // ── Power / explosive ─────────────────────────────────────────────────────
    {name:'Power Clean',                type:'Compound',  equipment:'Barbell'},
    {name:'Hang Clean',                 type:'Compound',  equipment:'Barbell'},
    {name:'Power Shrug',                type:'Compound',  equipment:'Barbell'},
    {name:'High Pull',                  type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell High Pull',         type:'Compound',  equipment:'Dumbbell'},
    {name:'Cable High Pull',            type:'Compound',  equipment:'Cable'},
    {name:'Snatch-Grip High Pull',      type:'Compound',  equipment:'Barbell'},
    {name:'Snatch-Grip Deadlift',       type:'Compound',  equipment:'Barbell'},
    // ── Heavy pulls ───────────────────────────────────────────────────────────
    {name:'Rack Pull (Trap Focus)',     type:'Compound',  equipment:'Barbell'},
    {name:'Farmer\'s Carry',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Suitcase Carry',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Trap Bar Farmer\'s Carry',  type:'Compound',  equipment:'Barbell'},
    // ── Rows / face pulls (upper trap emphasis) ───────────────────────────────
    {name:'Upright Row — Trap Focus',   type:'Compound',  equipment:'Barbell'},
    {name:'Cable Upright Row',          type:'Compound',  equipment:'Cable'},
    {name:'Face Pull (trap focus)',     type:'Isolation', equipment:'Cable'},
    {name:'Meadows Shrug',              type:'Isolation', equipment:'Barbell'},
    {name:'Pendlay Row (trap focus)',   type:'Compound',  equipment:'Barbell'},
    // ── Bodyweight ─────────────────────────────────────────────────────────────
    {name:'Wall Slide',                 type:'Isolation', equipment:'Bodyweight'},
    {name:'Prone Trap Raise',           type:'Isolation', equipment:'Bodyweight'},
  ],
  Quads:[
    // ── Barbell ───────────────────────────────────────────────────────────────
    {name:'Barbell Back Squat',       type:'Compound',  equipment:'Barbell'},
    {name:'Front Squat',              type:'Compound',  equipment:'Barbell'},
    {name:'Box Squat',                type:'Compound',  equipment:'Barbell'},
    {name:'Pause Squat',              type:'Compound',  equipment:'Barbell'},
    {name:'Safety Bar Squat',         type:'Compound',  equipment:'Barbell'},
    {name:'Zercher Squat',            type:'Compound',  equipment:'Barbell'},
    {name:'Landmine Squat',           type:'Compound',  equipment:'Barbell'},
    {name:'Good Morning (Quad Emphasis)', type:'Compound',  equipment:'Barbell'},
    // ── Machine ───────────────────────────────────────────────────────────────
    {name:'Leg Press',                type:'Compound',  equipment:'Machine'},
    {name:'Leg Press — Narrow Stance',type:'Compound',  equipment:'Machine'},
    {name:'Leg Press — Wide Stance',  type:'Compound',  equipment:'Machine'},
    {name:'Single-Leg Press',         type:'Compound',  equipment:'Machine'},
    {name:'Leg Extension',            type:'Isolation', equipment:'Machine'},
    {name:'Single-Leg Extension',     type:'Isolation', equipment:'Machine'},
    {name:'Hack Squat',               type:'Compound',  equipment:'Machine'},
    {name:'Smith Machine Squat',      type:'Compound',  equipment:'Machine'},
    {name:'Terminal Knee Extension',  type:'Isolation', equipment:'Cable'},
    {name:'Cable Squat',              type:'Compound',  equipment:'Cable'},
    // ── Dumbbell / bodyweight ─────────────────────────────────────────────────
    {name:'Bulgarian Split Squat',    type:'Compound',  equipment:'Dumbbell'},
    {name:'Walking Lunges',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Reverse Lunge',            type:'Compound',  equipment:'Dumbbell'},
    {name:'Forward Lunge',            type:'Compound',  equipment:'Dumbbell'},
    {name:'Lateral Lunge',            type:'Compound',  equipment:'Dumbbell'},
    {name:'Step-Up',                  type:'Compound',  equipment:'Dumbbell'},
    {name:'Dumbbell Thruster',         type:'Compound',  equipment:'Dumbbell'},
    {name:'Goblet Squat',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Dumbbell Split Squat',     type:'Compound',  equipment:'Dumbbell'},
    {name:'Sissy Squat',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Wall Sit',                 type:'Isolation', equipment:'Bodyweight'},
    {name:'Bodyweight Squat',         type:'Compound',  equipment:'Bodyweight'},
    {name:'Jump Squat',               type:'Compound',  equipment:'Bodyweight'},
    {name:'Skater Squat',             type:'Compound',  equipment:'Bodyweight'},
  ],
  Hamstrings:[
    // ── Leg curl variations ───────────────────────────────────────────────────
    {name:'Leg Curl',                 type:'Isolation', equipment:'Machine'},
    {name:'Lying Leg Curl',           type:'Isolation', equipment:'Machine'},
    {name:'Seated Leg Curl',          type:'Isolation', equipment:'Machine'},
    {name:'Single-Leg Lying Curl',    type:'Isolation', equipment:'Machine'},
    {name:'Standing Leg Curl',        type:'Isolation', equipment:'Machine'},
    {name:'Cable Leg Curl',           type:'Isolation', equipment:'Cable'},
    {name:'Swiss Ball Leg Curl',      type:'Isolation', equipment:'Bodyweight'},
    {name:'Dumbbell Leg Curl',        type:'Isolation', equipment:'Dumbbell'},
    // ── Hip hinge ─────────────────────────────────────────────────────────────
    {name:'Romanian Deadlift',        type:'Compound',  equipment:'Barbell'},
    {name:'Stiff-Leg Deadlift',       type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell RDL',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Single-Leg RDL',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Trap Bar RDL',             type:'Compound',  equipment:'Barbell'},
    {name:'Sumo Deadlift',            type:'Compound',  equipment:'Barbell'},
    {name:'Good Morning',             type:'Compound',  equipment:'Barbell'},
    // ── Bodyweight ────────────────────────────────────────────────────────────
    {name:'Nordic Curl',              type:'Compound',  equipment:'Bodyweight'},
    {name:'Glute-Ham Raise',          type:'Compound',  equipment:'Bodyweight'},
    {name:'Hip Extension Machine',    type:'Isolation', equipment:'Machine'},
  ],
  Glutes:[
    // ── Hip thrust / bridge ───────────────────────────────────────────────────
    {name:'Hip Thrust (Barbell)',      type:'Compound',  equipment:'Barbell'},
    {name:'Hip Thrust (Machine)',      type:'Compound',  equipment:'Machine'},
    {name:'Hip Thrust (Dumbbell)',     type:'Compound',  equipment:'Dumbbell'},
    {name:'Single-Leg Hip Thrust',     type:'Compound',  equipment:'Bodyweight'},
    {name:'Glute Bridge',              type:'Compound',  equipment:'Bodyweight'},
    {name:'Weighted Glute Bridge',     type:'Compound',  equipment:'Barbell'},
    {name:'Barbell Step-Up',           type:'Compound',  equipment:'Barbell'},
    {name:'Frog Pump',                 type:'Isolation', equipment:'Bodyweight'},
    // ── Cable / machine isolation ─────────────────────────────────────────────
    {name:'Cable Kickback',            type:'Isolation', equipment:'Cable'},
    {name:'Glute Kickback Machine',    type:'Isolation', equipment:'Machine'},
    {name:'Hip Abduction Machine',     type:'Isolation', equipment:'Machine'},
    {name:'Cable Hip Abduction',       type:'Isolation', equipment:'Cable'},
    {name:'Reverse Hyper',             type:'Isolation', equipment:'Machine'},
    {name:'Cable Pull-Through',        type:'Compound',  equipment:'Cable'},
    // ── Bodyweight ────────────────────────────────────────────────────────────
    {name:'Donkey Kick',               type:'Isolation', equipment:'Bodyweight'},
    {name:'Banded Lateral Walk',       type:'Isolation', equipment:'Bodyweight'},
    {name:'Clamshell',                 type:'Isolation', equipment:'Bodyweight'},
    {name:'Fire Hydrant',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Box Step-Up (glute focus)', type:'Compound',  equipment:'Bodyweight'},
    {name:'Curtsy Lunge',              type:'Compound',  equipment:'Dumbbell'},
    {name:'Sumo Squat',                type:'Compound',  equipment:'Dumbbell'},
    {name:'Romanian Split Squat',      type:'Compound',  equipment:'Dumbbell'},
  ],
  Calves:[
    {name:'Calf Raises',               type:'Isolation', equipment:'Bodyweight'},
    {name:'Standing Calf Raise',       type:'Isolation', equipment:'Machine'},
    {name:'Seated Calf Raise',         type:'Isolation', equipment:'Machine'},
    {name:'Leg Press Calf Raise',      type:'Isolation', equipment:'Machine'},
    {name:'Single-Leg Calf Raise',     type:'Isolation', equipment:'Bodyweight'},
    {name:'Donkey Calf Raise',         type:'Isolation', equipment:'Machine'},
    {name:'Dumbbell Standing Calf Raise', type:'Isolation', equipment:'Dumbbell'},
    {name:'Dumbbell Single-Leg Calf Raise', type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Calf Raise',          type:'Isolation', equipment:'Cable'},
    {name:'Tibialis Raise',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Smith Machine Calf Raise',  type:'Isolation', equipment:'Machine'},
    {name:'Hack Squat Calf Press',     type:'Isolation', equipment:'Machine'},
    {name:'Standing Barbell Calf Raise',type:'Isolation',equipment:'Barbell'},
    {name:'Calf Press (45° machine)',  type:'Isolation', equipment:'Machine'},
    {name:'Single-Leg Smith Calf Raise',type:'Isolation',equipment:'Machine'},
  ],
  Core:[
    // ── Plank / anti-extension ────────────────────────────────────────────────
    {name:'Plank Hold',                type:'Isolation', equipment:'Bodyweight'},
    {name:'Side Plank',                type:'Isolation', equipment:'Bodyweight'},
    {name:'Weighted Plank',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Hollow Body Hold',          type:'Isolation', equipment:'Bodyweight'},
    {name:'Dead Bug',                  type:'Compound',  equipment:'Bodyweight'},
    {name:'Bird Dog',                  type:'Compound',  equipment:'Bodyweight'},
    {name:'Ab Wheel Rollout',          type:'Compound',  equipment:'Equipment'},
    {name:'Ab Wheel (standing)',       type:'Compound',  equipment:'Equipment'},
    {name:'L-Sit',                     type:'Compound',  equipment:'Bodyweight'},
    {name:'Pallof Press',              type:'Compound',  equipment:'Cable'},
    // ── Flexion / crunch ─────────────────────────────────────────────────────
    {name:'Crunch',                    type:'Isolation', equipment:'Bodyweight'},
    {name:'Cable Crunch',              type:'Isolation', equipment:'Cable'},
    {name:'Decline Crunch',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Decline Sit-Up',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Sit-Up',                    type:'Isolation', equipment:'Bodyweight'},
    {name:'Reverse Crunch',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Bicycle Crunch',            type:'Isolation', equipment:'Bodyweight'},
    {name:'V-Up',                      type:'Isolation', equipment:'Bodyweight'},
    {name:'Swiss Ball Crunch',         type:'Isolation', equipment:'Equipment'},
    {name:'Toe Touch Crunch',          type:'Isolation', equipment:'Bodyweight'},
    // ── Leg raise / hip flexion ───────────────────────────────────────────────
    {name:'Hanging Leg Raise',         type:'Compound',  equipment:'Bodyweight'},
    {name:'Hanging Knee Raise',        type:'Compound',  equipment:'Bodyweight'},
    {name:'Leg Raise (flat bench)',    type:'Isolation', equipment:'Bodyweight'},
    {name:'Captain\'s Chair Raise',   type:'Compound',  equipment:'Bodyweight'},
    {name:'Cable Leg Raise',           type:'Isolation', equipment:'Cable'},
    // ── Rotation / obliques ───────────────────────────────────────────────────
    {name:'Russian Twist',             type:'Isolation', equipment:'Bodyweight'},
    {name:'Woodchop',                  type:'Compound',  equipment:'Cable'},
    {name:'Landmine Rotation',         type:'Compound',  equipment:'Barbell'},
    {name:'Cable Oblique Crunch',      type:'Isolation', equipment:'Cable'},
    {name:'Windshield Wipers',         type:'Isolation', equipment:'Bodyweight'},
    {name:'Side Bend (dumbbell)',      type:'Isolation', equipment:'Dumbbell'},
    {name:'Weighted Sit-Up',           type:'Isolation', equipment:'Dumbbell'},
    {name:'Ab Crunch Machine',         type:'Isolation', equipment:'Machine'},
    // ── Dynamic / compound ────────────────────────────────────────────────────
    {name:'Dragon Flag',               type:'Compound',  equipment:'Bodyweight'},
    {name:'Mountain Climber',          type:'Compound',  equipment:'Bodyweight'},
    {name:'Plank with Shoulder Tap',   type:'Compound',  equipment:'Bodyweight'},
    {name:'Core Circuit',              type:'Compound',  equipment:'Bodyweight'},
    {name:'Medicine Ball Slam',        type:'Compound',  equipment:'Equipment'},
    {name:'Copenhagen Plank',          type:'Compound',  equipment:'Bodyweight'},
    {name:'TRX Pike',                  type:'Compound',  equipment:'Equipment'},
  ],
  Cardio:[
    // ── Machine ───────────────────────────────────────────────────────────────
    {name:'Treadmill / Walk-Run',      type:'Cardio',    equipment:'Machine'},
    {name:'Incline Treadmill Walk',    type:'Cardio',    equipment:'Machine'},
    {name:'Stationary Bike',           type:'Cardio',    equipment:'Machine'},
    {name:'Stationary Bike (easy)',    type:'Cardio',    equipment:'Machine'},
    {name:'Rowing Machine',            type:'Cardio',    equipment:'Machine'},
    {name:'Ski Erg',                   type:'Cardio',    equipment:'Machine'},
    {name:'Stair Climber',             type:'Cardio',    equipment:'Machine'},
    {name:'Elliptical',                type:'Cardio',    equipment:'Machine'},
    {name:'Air Bike (Assault Bike)',   type:'Cardio',    equipment:'Machine'},
    {name:'Assault Bike — Steady',     type:'Cardio',    equipment:'Machine'},
    {name:'Jacob\'s Ladder',          type:'Cardio',    equipment:'Machine'},
    // ── HIIT / intervals ─────────────────────────────────────────────────────
    {name:'HIIT Blast',                type:'Cardio',    equipment:'Bodyweight'},
    {name:'HIIT Intervals',            type:'Cardio',    equipment:'Bodyweight'},
    {name:'Sprint Intervals',          type:'Cardio',    equipment:'Bodyweight'},
    {name:'Tabata Protocol',           type:'Cardio',    equipment:'Bodyweight'},
    {name:'Rowing / Ski Erg Intervals',type:'Cardio',    equipment:'Machine'},
    // ── Bodyweight cardio ─────────────────────────────────────────────────────
    {name:'Running',                   type:'Cardio',    equipment:'Bodyweight'},
    {name:'Light Jog',                 type:'Cardio',    equipment:'Bodyweight'},
    {name:'Walking',                   type:'Cardio',    equipment:'Bodyweight'},
    {name:'Swimming',                  type:'Cardio',    equipment:'Bodyweight'},
    {name:'Jump Rope',                 type:'Cardio',    equipment:'Equipment'},
    {name:'Burpees',                   type:'Cardio',    equipment:'Bodyweight'},
    {name:'High Knees',                type:'Cardio',    equipment:'Bodyweight'},
    {name:'Jump Squat (Cardio Focus)', type:'Cardio',    equipment:'Bodyweight'},
    {name:'Box Jump',                  type:'Cardio',    equipment:'Bodyweight'},
    {name:'Shadowboxing',              type:'Cardio',    equipment:'Bodyweight'},
    // ── Equipment / outdoor ───────────────────────────────────────────────────
    {name:'Cycling',                   type:'Cardio',    equipment:'Equipment'},
    {name:'Kettlebell Swing',          type:'Cardio',    equipment:'Equipment'},
    // ── Warm-ups, finishers & cool-downs (timed) ──────────────────────────────
    // These were used by program days but missing from the library, so the
    // app couldn't tell they were timed — they showed weight × reps inputs.
    {name:'Warm-up Jog',               type:'Cardio',    equipment:'Bodyweight'},
    {name:'Brisk Walk',                type:'Cardio',    equipment:'Bodyweight'},
    {name:'Cool-down Walk',            type:'Cardio',    equipment:'Bodyweight'},
    {name:'Cool-down Walk + Stretch',  type:'Cardio',    equipment:'Bodyweight'},
    {name:'Cardio Finisher (HIIT)',    type:'Cardio',    equipment:'Bodyweight'},
    {name:'Cardio — Steady State',     type:'Cardio',    equipment:'Machine'},
    // ── Mobility & recovery (timed) ───────────────────────────────────────────
    {name:'Cool-down Stretch',         type:'Mobility',  equipment:'Bodyweight'},
    {name:'Full-Body Stretch',         type:'Mobility',  equipment:'Bodyweight'},
    {name:'Hip Mobility Flow',         type:'Mobility',  equipment:'Bodyweight'},
    {name:'Thoracic Mobility',         type:'Mobility',  equipment:'Bodyweight'},
    {name:'Yoga Flow',                 type:'Mobility',  equipment:'Bodyweight'},
    {name:'Foam Roll',                 type:'Mobility',  equipment:'Equipment'},
    {name:'Battle Ropes',              type:'Cardio',    equipment:'Equipment'},
    {name:'Sled Push',                 type:'Cardio',    equipment:'Equipment'},
    {name:'Prowler Push',              type:'Cardio',    equipment:'Equipment'},
    {name:'Sled Pull',                 type:'Cardio',    equipment:'Equipment'},
  ],
};

// Exercise names must be globally unique across EXERCISE_LIBRARY — getExerciseMuscle/
// getExerciseInfo resolve by name alone, so a name reused in two groups silently
// attributes volume/lookups to whichever group is declared first.
(function validateExerciseLibraryNames(){
  const seenIn={};
  for(const [group,arr] of Object.entries(EXERCISE_LIBRARY)){
    for(const e of arr){
      if(seenIn[e.name]) console.warn(`EXERCISE_LIBRARY: "${e.name}" appears in both "${seenIn[e.name]}" and "${group}" — rename one (e.g. "${e.name} (${group} Focus)") to keep muscle attribution correct.`);
      else seenIn[e.name]=group;
    }
  }
})();

// Old spellings that still appear in logged history → the library's name, so
// those sets keep counting toward muscle volume/recovery instead of dropping
// out (lookups are exact-string). Templates now use the canonical names.
const EXERCISE_ALIASES={
  'Hip Abductor Machine':'Hip Abduction Machine',
  'Farmers Carry':'Farmer\'s Carry',
};
function canonicalExerciseName(name){ return EXERCISE_ALIASES[name]||name }
function getExerciseMuscle(name){
  name=canonicalExerciseName(name);
  for(const [group,arr] of Object.entries(EXERCISE_LIBRARY)){
    if(arr.some(e=>e.name===name)) return group;
  }
  return null;
}

function getExerciseInfo(name){
  name=canonicalExerciseName(name);
  for(const arr of Object.values(EXERCISE_LIBRARY)){
    const found=arr.find(e=>e.name===name);
    if(found) return found;
  }
  return null;
}