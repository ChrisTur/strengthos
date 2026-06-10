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
    {name:'Tricep Pushdown',       plan:'3 sets: 60.5 / 66 / 71.5', structure:'3 sets', note:'Superset option with curls'},
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
    {name:'Chest Fly (pec deck)', plan:'3 × 15 @ 100–110', structure:'3 × 15',note:'Stretch-focused'},
    {name:'Rear Delt',            plan:'2 × 15 @ 50–60',   structure:'2 × 15',note:'Posture work'},
   ]},
];

// ── Frequency-based programs ──────────────────────────────────────────────────
const REST_DAY=-1;

// 3-day Push/Pull/Legs and 4-day split (structure-only — no preset weights)
const PROGRAMS={
  3:[
    {dow:'Day 1',name:'Push',short:'Push',dots:[CORAL,GREEN,PURPLE],
     tags:['Chest','Shoulders','Triceps'],
     defaultNote:'Push day — chest, shoulders, triceps. Rest 90s between sets.',
     exercises:[
      {name:'Chest Press (machine)', structure:'4 × 10',note:'Main chest movement — find a weight where set 4 is hard'},
      {name:'Incline DB Press',      structure:'3 × 10',note:'Upper chest — squeeze at top'},
      {name:'Shoulder Press',        structure:'3 × 10',note:'Overhead strength'},
      {name:'Lateral Raises',        structure:'3 × 12',note:'Side delts — controlled, no swinging'},
      {name:'Tricep Pushdown',       structure:'3 × 12',note:'Tricep finisher — full extension'},
     ]},
    {dow:'Day 2',name:'Pull',short:'Pull',dots:[BLUE,AMBER],
     tags:['Back','Biceps'],
     defaultNote:'Pull day — back and biceps. Control the eccentric on every rep.',
     exercises:[
      {name:'Lat Pulldown',         structure:'4 × 10',note:'Full stretch at top, drive elbows down'},
      {name:'Cable Seated Row',     structure:'3 × 10',note:'Chest up, drive elbows back'},
      {name:'Machine Row',          structure:'3 × 10',note:'Back thickness — squeeze at peak'},
      {name:'Hammer Curls',         structure:'3 × 12',note:'Brachialis + bicep — supinate at top'},
      {name:'Bicep Curls',          structure:'3 × 10',note:'Slow eccentric, peak squeeze'},
     ]},
    {dow:'Day 3',name:'Legs',short:'Legs',dots:[GREEN],
     tags:['Legs'],
     defaultNote:'Leg day — quads, hamstrings, glutes. Control the descent.',
     exercises:[
      {name:'Leg Press',    structure:'4 × 10',note:'Full range — knees track over toes'},
      {name:'Leg Curl',     structure:'3 × 10',note:'Hamstrings — controlled lowering'},
      {name:'Leg Extension',structure:'3 × 12',note:'Quad isolation — squeeze at top'},
      {name:'Hack Squat',   structure:'3 × 10',note:'Controlled depth, drive through heels'},
      {name:'Calf Raises',  structure:'3 × 15',note:'Full stretch at bottom'},
     ]},
  ],
  4:[
    {dow:'Day 1',name:'Chest + Triceps',short:'Chest/Triceps',dots:[CORAL,PURPLE],
     tags:['Chest','Triceps'],
     defaultNote:'Chest + triceps. Go heavy on press, strict form on isolation.',
     exercises:[
      {name:'Chest Press (machine)', structure:'4 × 10',note:'Main strength setter'},
      {name:'Incline DB Press',      structure:'4 × 10',note:'Upper chest'},
      {name:'Chest Fly',             structure:'3 × 10',note:'Isolation — squeeze and hold'},
      {name:'Tricep Pushdown',       structure:'3 × 12',note:'Full extension each rep'},
      {name:'Tricep Dips (machine)', structure:'3 × 12',note:'Finish triceps'},
     ]},
    {dow:'Day 2',name:'Back + Biceps',short:'Back/Biceps',dots:[BLUE,AMBER],
     tags:['Back','Biceps'],
     defaultNote:'Back + biceps. Prioritise rows — they build thickness.',
     exercises:[
      {name:'Lat Pulldown',         structure:'4 × 10',note:'Controlled, full stretch'},
      {name:'Cable Seated Row',     structure:'3 × 10',note:'Drive elbows back'},
      {name:'Machine Row',          structure:'3 × 10',note:'All sets same weight'},
      {name:'Hammer Curls',         structure:'3 × 12',note:'Supinate at top'},
      {name:'Bicep Curls',          structure:'3 × 10',note:'Slow eccentric'},
     ]},
    {dow:'Day 3',name:'Legs',short:'Legs',dots:[GREEN],
     tags:['Legs'],
     defaultNote:'Leg day. Quads, hamstrings, glutes. Add weight each session.',
     exercises:[
      {name:'Leg Press',    structure:'4 × 10',note:'Full range of motion'},
      {name:'Leg Curl',     structure:'4 × 10',note:'All sets at same weight'},
      {name:'Leg Extension',structure:'3 × 10',note:'Squeeze at top'},
      {name:'Hack Squat',   structure:'3 × 10',note:'Controlled ramp'},
      {name:'Calf Raises',  structure:'3 × 15',note:'Full stretch'},
     ]},
    {dow:'Day 4',name:'Shoulders + Arms',short:'Shoul/Arms',dots:[GREEN,PURPLE,AMBER],
     tags:['Shoulders','Arms'],
     defaultNote:'Shoulders + arms. Full overhead work then arm circuit.',
     exercises:[
      {name:'Shoulder Press (machine)', structure:'3 × 10',note:'Overhead strength'},
      {name:'Lateral Raises',           structure:'4 × 12',note:'Side delts — no swinging'},
      {name:'Rear Delt Machine',        structure:'3 × 10',note:'Posture + rear delt balance'},
      {name:'Tricep Pushdown',          structure:'3 × 12',note:'Full extension'},
      {name:'Bicep Curls',              structure:'3 × 10',note:'Peak squeeze'},
     ]},
  ],
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

// Pure cardio-only schedules — used when goal === 'cardio'
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
    {dow:'Day 1',name:'Steady State',short:'Steady',dots:[BLUE,GREEN],
     tags:['Cardio','Endurance'],
     defaultNote:'Steady state — hold 60–70% max HR for the full session.',
     exercises:[
      {name:'Treadmill / Walk-Run',   structure:'35 min',           note:'Build by 2 min/week — consistency beats intensity here'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Calves, quads, hip flexors'},
     ]},
    {dow:'Day 2',name:'HIIT',short:'HIIT',dots:[CORAL,BLUE],
     tags:['HIIT','Fat Loss'],
     defaultNote:'Intervals — 80–90% max HR on work sets. True rest between rounds.',
     exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Gradual build — protect your joints'},
      {name:'Sprint Intervals',       structure:'10 × 30s / 30s rest',note:'Max effort, walk the rest'},
      {name:'Air Bike (Assault Bike)',structure:'4 × 20s / 40s rest',note:'All-out — the hardest 20s you have'},
      {name:'Burpees',                structure:'3 × 12',           note:'Full range every rep'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Essential — heart rate return'},
     ]},
    {dow:'Day 3',name:'Zone 2 Endurance',short:'Zone 2',dots:[BLUE,GREEN],
     tags:['Cardio','Endurance','Zone 2'],
     defaultNote:'Zone 2 — long easy effort at 60–70% max HR. This builds your aerobic base. Should feel easy.',
     exercises:[
      {name:'Stationary Bike',        structure:'40 min',           note:'Steady cadence, hold the same pace throughout'},
      {name:'Rowing Machine',         structure:'15 min',           note:'Moderate pace — focus on form and breathing'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Full lower body + shoulders'},
     ]},
    {dow:'Day 4',name:'Active Recovery',short:'Recovery',dots:[GREEN],
     tags:['Recovery','Core'],
     defaultNote:'Easy day — restore and move. No burning, no breathlessness.',
     exercises:[
      {name:'Brisk Walk',             structure:'30 min',           note:'Easy pace, outdoors if possible'},
      {name:'Plank Hold',             structure:'3 × 45s',          note:'Core bracing — stable hips'},
      {name:'Full-Body Stretch',      structure:'10 min',           note:'Priority: hips, hamstrings, upper back'},
      {name:'Foam Roll',              structure:'5 min',            note:'Slow and deliberate — glutes, IT band, lats'},
     ]},
  ],
  5:[
    {dow:'Day 1',name:'Steady State',short:'Steady',dots:[BLUE,GREEN],
     tags:['Cardio','Endurance'],
     defaultNote:'Steady state — 60–70% max HR. Easy conversation pace throughout.',
     exercises:[
      {name:'Treadmill / Walk-Run',   structure:'35 min',           note:'Build by 2 min each week'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Calves, quads, hip flexors'},
     ]},
    {dow:'Day 2',name:'HIIT',short:'HIIT',dots:[CORAL,BLUE],
     tags:['HIIT','High Intensity'],
     defaultNote:'Intervals — 80–90% max HR work sets, full rest between rounds.',
     exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Gradual build before intervals'},
      {name:'Sprint Intervals',       structure:'10 × 30s / 30s rest',note:'Max effort every sprint'},
      {name:'Jump Rope',              structure:'4 × 2 min',        note:'Continuous, 60s rest rounds'},
      {name:'Burpees',                structure:'4 × 10',           note:'Full range'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Heart rate return — do not skip'},
     ]},
    {dow:'Day 3',name:'Zone 2 Endurance',short:'Zone 2',dots:[BLUE,GREEN],
     tags:['Cardio','Zone 2','Endurance'],
     defaultNote:'Long easy effort — the session that builds your engine. Keep it truly easy.',
     exercises:[
      {name:'Stationary Bike',        structure:'45 min',           note:'Steady cadence, same pace throughout — no surges'},
      {name:'Cool-down Stretch',      structure:'5 min',            note:'Full lower body'},
     ]},
    {dow:'Day 4',name:'Tempo Run',short:'Tempo',dots:[CORAL,AMBER],
     tags:['Cardio','Endurance','Tempo'],
     defaultNote:'Tempo — comfortably hard. 75–85% max HR. Should feel like a "controlled struggle".',
     exercises:[
      {name:'Warm-up Jog',            structure:'5 min',            note:'Easy pace before tempo'},
      {name:'Running',                structure:'20 min @ tempo pace',note:'Steady hard effort — not a sprint, not a jog'},
      {name:'Stair Climber',          structure:'10 min',           note:'Moderate-high resistance, steady climb'},
      {name:'Cool-down Walk + Stretch',structure:'8 min',           note:'Full lower body stretch'},
     ]},
    {dow:'Day 5',name:'Active Recovery',short:'Recovery',dots:[GREEN],
     tags:['Recovery','Core'],
     defaultNote:'Easy movement only. Active recovery accelerates progress more than extra hard sessions.',
     exercises:[
      {name:'Brisk Walk',             structure:'30 min',           note:'Easy, enjoyable pace'},
      {name:'Plank Hold',             structure:'3 × 45s',          note:'Core stability maintenance'},
      {name:'Full-Body Stretch',      structure:'12 min',           note:'Hold each stretch 30–45s — hips, hamstrings, back, shoulders'},
      {name:'Foam Roll',              structure:'5 min',            note:'Glutes, IT band, upper back, calves'},
     ]},
  ],
};

// Default day-of-week → workout index map per frequency (Mon=0 … Sun=6)
const WEEK_DEFAULTS={
  7:[0,1,2,3,4,5,6],
  6:[0,1,2,3,4,5,REST_DAY],
  5:[0,1,2,3,4,REST_DAY,REST_DAY],
  4:[0,1,REST_DAY,2,3,REST_DAY,REST_DAY],
  3:[0,REST_DAY,1,REST_DAY,2,REST_DAY,REST_DAY],
};

function getActiveDays(){
  // AI-generated plan takes priority when present
  const ai=getAIPlan();
  if(ai&&Array.isArray(ai.days)&&ai.days.length) return ai.days;
  const dpw=getDaysPerWeek(),goal=getGoal();
  // Pure cardio goal → use dedicated cardio-only schedule
  if(goal==='cardio'&&CARDIO_PROGRAMS[dpw]) return CARDIO_PROGRAMS[dpw].map((d,i)=>getCustomDay(i)||d);
  let base;
  if(PROGRAMS[dpw]) base=PROGRAMS[dpw];
  else if(dpw===5) base=DAYS.slice(0,5);
  else if(dpw===6) base=DAYS.slice(0,6);
  else base=DAYS;
  // Fat loss goal with a frequency-based program → inject a dedicated cardio day
  if(goal==='fat_loss'&&PROGRAMS[dpw]) base=[...base,getCardioDay()];
  // Apply per-slot custom day overrides
  return base.map((d,i)=>getCustomDay(i)||d);
}
function getActiveDay(idx){ return getActiveDays()[idx]||null }

// Goal-aware week defaults
function getGoalWeekDefaults(){
  const dpw=getDaysPerWeek(),goal=getGoal();
  if(goal==='cardio'&&CARDIO_PROGRAMS[dpw]){
    // Spread cardio days evenly across the week
    const n=CARDIO_PROGRAMS[dpw].length;
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
  {id:'muscle', icon:'🏋️', label:'Build Muscle',    desc:'Progressive overload, heavy compounds'},
  {id:'fat_loss',icon:'🔥',label:'Fat Loss',        desc:'Higher reps, shorter rest, volume'},
  {id:'cardio',  icon:'❤️', label:'Cardio Focus',   desc:'Endurance & active recovery priority'},
  {id:'general', icon:'⚖️', label:'General Fitness',desc:'Balanced strength & health'},
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
  muscle:[],  // no extra exercises; coaching note added to detail instead
  general:[],
};

// Per-goal coaching banner shown in the detail panel
const GOAL_COACHING={
  muscle: '💪 Muscle goal: rest 2–3 min between main sets. Aim to add weight or reps every session — track your top set.',
  fat_loss:'🔥 Fat loss goal: keep rest ≤60s between sets. Complete the cardio finisher at the end — this is where the goal is won.',
  cardio:  '❤️ Cardio goal: finish every session with the steady-state block. Target 3-4 cardio sessions this week.',
  general: '',
};

// Extra note appended to plan cell based on goal
const GOAL_PLAN_TAG={
  muscle:  '<span style="font-size:10px;color:#8b6fd4;margin-top:3px;display:block">↑ add weight when all reps clean</span>',
  fat_loss:'<span style="font-size:10px;color:#e05555;margin-top:3px;display:block">⏱ rest ≤ 60s</span>',
  cardio:  '<span style="font-size:10px;color:#5b9bd5;margin-top:3px;display:block">⏱ superset if possible</span>',
  general: '',
};

// ── Exercise library (organized by muscle group) ──────────────────────────────
const MUSCLE_COLORS={
  Chest:'#e07b39',Back:'#5b9bd5',Shoulders:'#3aab6d',Biceps:'#8b6fd4',
  Triceps:'#d4a45b',Quads:'#4ab6a0',Hamstrings:'#4ab6a0',Glutes:'#e05b9b',
  Calves:'#888',Core:'#e05555',Cardio:'#e05555',
};

const EXERCISE_LIBRARY={
  Chest:[
    {name:'Chest Press (machine)',    type:'Compound',  equipment:'Machine'},
    {name:'Incline DB Press',         type:'Compound',  equipment:'Dumbbell'},
    {name:'Chest Fly',                type:'Isolation', equipment:'Machine'},
    {name:'Chest Fly (pec deck)',     type:'Isolation', equipment:'Machine'},
    {name:'Incline Fly or Pec Deck',  type:'Isolation', equipment:'Machine'},
    {name:'Barbell Bench Press',      type:'Compound',  equipment:'Barbell'},
    {name:'Incline Barbell Press',    type:'Compound',  equipment:'Barbell'},
    {name:'Decline Barbell Press',    type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell Bench Press',     type:'Compound',  equipment:'Dumbbell'},
    {name:'Incline Dumbbell Press',   type:'Compound',  equipment:'Dumbbell'},
    {name:'Decline Dumbbell Press',   type:'Compound',  equipment:'Dumbbell'},
    {name:'Cable Fly',                type:'Isolation', equipment:'Cable'},
    {name:'Cable Crossover',          type:'Isolation', equipment:'Cable'},
    {name:'Low-to-High Cable Fly',    type:'Isolation', equipment:'Cable'},
    {name:'Push-Up',                  type:'Compound',  equipment:'Bodyweight'},
    {name:'Weighted Push-Up',         type:'Compound',  equipment:'Bodyweight'},
    {name:'Dips (chest-focused)',     type:'Compound',  equipment:'Bodyweight'},
    {name:'Landmine Press',           type:'Compound',  equipment:'Barbell'},
  ],
  Back:[
    {name:'Cable Seated Row',         type:'Compound',  equipment:'Cable'},
    {name:'Machine Row',              type:'Compound',  equipment:'Machine'},
    {name:'Lat Pulldown',             type:'Compound',  equipment:'Cable'},
    {name:'Barbell Row',              type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell Row',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Pull-Up',                  type:'Compound',  equipment:'Bodyweight'},
    {name:'Chin-Up',                  type:'Compound',  equipment:'Bodyweight'},
    {name:'Deadlift',                 type:'Compound',  equipment:'Barbell'},
    {name:'Romanian Deadlift',        type:'Compound',  equipment:'Barbell'},
    {name:'T-Bar Row',                type:'Compound',  equipment:'Barbell'},
    {name:'Rack Pull',                type:'Compound',  equipment:'Barbell'},
    {name:'Meadows Row',              type:'Compound',  equipment:'Dumbbell'},
    {name:'Straight-Arm Pulldown',    type:'Isolation', equipment:'Cable'},
    {name:'Hyperextension',           type:'Compound',  equipment:'Bodyweight'},
    {name:'Good Morning',             type:'Compound',  equipment:'Barbell'},
    {name:'Seal Row',                 type:'Compound',  equipment:'Dumbbell'},
    {name:'Face Pull',                type:'Isolation', equipment:'Cable'},
    {name:'Wide-Grip Lat Pulldown',   type:'Compound',  equipment:'Cable'},
    {name:'Single-Arm Cable Row',     type:'Compound',  equipment:'Cable'},
  ],
  Shoulders:[
    {name:'Shoulder Press (machine)', type:'Compound',  equipment:'Machine'},
    {name:'Lateral Raises',           type:'Isolation', equipment:'Dumbbell'},
    {name:'Rear Delt Machine',        type:'Isolation', equipment:'Machine'},
    {name:'Rear Delt',                type:'Isolation', equipment:'Dumbbell'},
    {name:'Shoulder Press',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Overhead Press',           type:'Compound',  equipment:'Barbell'},
    {name:'Arnold Press',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Cable Lateral Raise',      type:'Isolation', equipment:'Cable'},
    {name:'Front Raise',              type:'Isolation', equipment:'Dumbbell'},
    {name:'Rear Delt Fly',            type:'Isolation', equipment:'Dumbbell'},
    {name:'Upright Row',              type:'Compound',  equipment:'Barbell'},
    {name:'Barbell Shrug',            type:'Isolation', equipment:'Barbell'},
    {name:'Seated Dumbbell Press',    type:'Compound',  equipment:'Dumbbell'},
    {name:'Z-Press',                  type:'Compound',  equipment:'Barbell'},
    {name:'Cable Face Pull',          type:'Isolation', equipment:'Cable'},
  ],
  Biceps:[
    {name:'Barbell / Cable Curls',    type:'Isolation', equipment:'Barbell'},
    {name:'Bicep Curls',              type:'Isolation', equipment:'Dumbbell'},
    {name:'Hammer Curls',             type:'Isolation', equipment:'Dumbbell'},
    {name:'Cable Curls',              type:'Isolation', equipment:'Cable'},
    {name:'Cable Curls extended',     type:'Isolation', equipment:'Cable'},
    {name:'Barbell Curl',             type:'Isolation', equipment:'Barbell'},
    {name:'Dumbbell Curl',            type:'Isolation', equipment:'Dumbbell'},
    {name:'Preacher Curl',            type:'Isolation', equipment:'Machine'},
    {name:'EZ-Bar Curl',              type:'Isolation', equipment:'Barbell'},
    {name:'Incline Dumbbell Curl',    type:'Isolation', equipment:'Dumbbell'},
    {name:'Concentration Curl',       type:'Isolation', equipment:'Dumbbell'},
    {name:'Spider Curl',              type:'Isolation', equipment:'Barbell'},
    {name:'Reverse Curl',             type:'Isolation', equipment:'Barbell'},
    {name:'Cable Hammer Curl',        type:'Isolation', equipment:'Cable'},
    {name:'Machine Curl',             type:'Isolation', equipment:'Machine'},
  ],
  Triceps:[
    {name:'Tricep Cable Pushdown',    type:'Isolation', equipment:'Cable'},
    {name:'Tricep Pushdown',          type:'Isolation', equipment:'Cable'},
    {name:'Overhead Tricep Extension',type:'Isolation', equipment:'Cable'},
    {name:'Tricep Dips (machine)',    type:'Compound',  equipment:'Machine'},
    {name:'Close-Grip Bench Press',   type:'Compound',  equipment:'Barbell'},
    {name:'Skull Crusher',            type:'Isolation', equipment:'Barbell'},
    {name:'Dips (tricep-focused)',    type:'Compound',  equipment:'Bodyweight'},
    {name:'Diamond Push-Up',          type:'Compound',  equipment:'Bodyweight'},
    {name:'Tricep Kickback',          type:'Isolation', equipment:'Dumbbell'},
    {name:'Rope Pushdown',            type:'Isolation', equipment:'Cable'},
    {name:'JM Press',                 type:'Compound',  equipment:'Barbell'},
    {name:'Single-Arm Pushdown',      type:'Isolation', equipment:'Cable'},
    {name:'Overhead DB Extension',    type:'Isolation', equipment:'Dumbbell'},
    {name:'Tate Press',               type:'Isolation', equipment:'Dumbbell'},
  ],
  Quads:[
    {name:'Leg Press',                type:'Compound',  equipment:'Machine'},
    {name:'Leg Extension',            type:'Isolation', equipment:'Machine'},
    {name:'Hack Squat',               type:'Compound',  equipment:'Machine'},
    {name:'Barbell Back Squat',       type:'Compound',  equipment:'Barbell'},
    {name:'Front Squat',              type:'Compound',  equipment:'Barbell'},
    {name:'Bulgarian Split Squat',    type:'Compound',  equipment:'Dumbbell'},
    {name:'Walking Lunges',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Reverse Lunge',            type:'Compound',  equipment:'Dumbbell'},
    {name:'Step-Up',                  type:'Compound',  equipment:'Dumbbell'},
    {name:'Goblet Squat',             type:'Compound',  equipment:'Dumbbell'},
    {name:'Box Squat',                type:'Compound',  equipment:'Barbell'},
    {name:'Sissy Squat',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Wall Sit',                 type:'Isolation', equipment:'Bodyweight'},
    {name:'Single-Leg Press',         type:'Compound',  equipment:'Machine'},
  ],
  Hamstrings:[
    {name:'Leg Curl',                 type:'Isolation', equipment:'Machine'},
    {name:'Lying Leg Curl',           type:'Isolation', equipment:'Machine'},
    {name:'Seated Leg Curl',          type:'Isolation', equipment:'Machine'},
    {name:'Romanian Deadlift',        type:'Compound',  equipment:'Barbell'},
    {name:'Stiff-Leg Deadlift',       type:'Compound',  equipment:'Barbell'},
    {name:'Nordic Curl',              type:'Compound',  equipment:'Bodyweight'},
    {name:'Glute-Ham Raise',          type:'Compound',  equipment:'Bodyweight'},
    {name:'Single-Leg RDL',           type:'Compound',  equipment:'Dumbbell'},
    {name:'Good Morning',             type:'Compound',  equipment:'Barbell'},
    {name:'Sumo Deadlift',            type:'Compound',  equipment:'Barbell'},
    {name:'Dumbbell RDL',             type:'Compound',  equipment:'Dumbbell'},
  ],
  Glutes:[
    {name:'Hip Thrust (Barbell)',     type:'Compound',  equipment:'Barbell'},
    {name:'Glute Bridge',             type:'Compound',  equipment:'Bodyweight'},
    {name:'Cable Kickback',           type:'Isolation', equipment:'Cable'},
    {name:'Donkey Kick',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Hip Abduction Machine',    type:'Isolation', equipment:'Machine'},
    {name:'Banded Lateral Walk',      type:'Isolation', equipment:'Bodyweight'},
    {name:'Clamshell',                type:'Isolation', equipment:'Bodyweight'},
    {name:'Cable Pull-Through',       type:'Compound',  equipment:'Cable'},
    {name:'Reverse Hyper',            type:'Isolation', equipment:'Machine'},
    {name:'Frog Pump',                type:'Isolation', equipment:'Bodyweight'},
  ],
  Calves:[
    {name:'Calf Raises',              type:'Isolation', equipment:'Bodyweight'},
    {name:'Standing Calf Raise',      type:'Isolation', equipment:'Machine'},
    {name:'Seated Calf Raise',        type:'Isolation', equipment:'Machine'},
    {name:'Leg Press Calf Raise',     type:'Isolation', equipment:'Machine'},
    {name:'Single-Leg Calf Raise',    type:'Isolation', equipment:'Bodyweight'},
    {name:'Donkey Calf Raise',        type:'Isolation', equipment:'Machine'},
    {name:'Tibialis Raise',           type:'Isolation', equipment:'Bodyweight'},
  ],
  Core:[
    {name:'Plank Hold',               type:'Isolation', equipment:'Bodyweight'},
    {name:'Core Circuit',             type:'Compound',  equipment:'Bodyweight'},
    {name:'Plank',                    type:'Isolation', equipment:'Bodyweight'},
    {name:'Side Plank',               type:'Isolation', equipment:'Bodyweight'},
    {name:'Crunch',                   type:'Isolation', equipment:'Bodyweight'},
    {name:'Cable Crunch',             type:'Isolation', equipment:'Cable'},
    {name:'Hanging Leg Raise',        type:'Compound',  equipment:'Bodyweight'},
    {name:'Ab Wheel Rollout',         type:'Compound',  equipment:'Equipment'},
    {name:'Russian Twist',            type:'Isolation', equipment:'Bodyweight'},
    {name:'Dead Bug',                 type:'Compound',  equipment:'Bodyweight'},
    {name:'Bird Dog',                 type:'Compound',  equipment:'Bodyweight'},
    {name:'Pallof Press',             type:'Compound',  equipment:'Cable'},
    {name:'Dragon Flag',              type:'Compound',  equipment:'Bodyweight'},
    {name:'Mountain Climber',         type:'Compound',  equipment:'Bodyweight'},
    {name:'Reverse Crunch',           type:'Isolation', equipment:'Bodyweight'},
    {name:'Windshield Wipers',        type:'Isolation', equipment:'Bodyweight'},
    {name:'Woodchop',                 type:'Compound',  equipment:'Cable'},
    {name:'Bicycle Crunch',           type:'Isolation', equipment:'Bodyweight'},
  ],
  Cardio:[
    {name:'HIIT Blast',               type:'Cardio',    equipment:'Bodyweight'},
    {name:'HIIT Intervals',           type:'Cardio',    equipment:'Bodyweight'},
    {name:'Sprint Intervals',         type:'Cardio',    equipment:'Bodyweight'},
    {name:'Stationary Bike',          type:'Cardio',    equipment:'Machine'},
    {name:'Stationary Bike (easy)',   type:'Cardio',    equipment:'Machine'},
    {name:'Treadmill / Walk-Run',     type:'Cardio',    equipment:'Machine'},
    {name:'Jump Rope',                type:'Cardio',    equipment:'Equipment'},
    {name:'Burpees',                  type:'Cardio',    equipment:'Bodyweight'},
    {name:'Rowing / Ski Erg Intervals',type:'Cardio',   equipment:'Machine'},
    {name:'Running',                  type:'Cardio',    equipment:'Bodyweight'},
    {name:'Cycling',                  type:'Cardio',    equipment:'Equipment'},
    {name:'Rowing Machine',           type:'Cardio',    equipment:'Machine'},
    {name:'Battle Ropes',             type:'Cardio',    equipment:'Equipment'},
    {name:'Stair Climber',            type:'Cardio',    equipment:'Machine'},
    {name:'Elliptical',               type:'Cardio',    equipment:'Machine'},
    {name:'Box Jump',                 type:'Cardio',    equipment:'Bodyweight'},
    {name:'Swimming',                 type:'Cardio',    equipment:'Bodyweight'},
    {name:'Kettlebell Swing',         type:'Cardio',    equipment:'Equipment'},
    {name:'Air Bike (Assault Bike)',  type:'Cardio',    equipment:'Machine'},
    {name:'High Knees',               type:'Cardio',    equipment:'Bodyweight'},
    {name:'Jump Squat',               type:'Cardio',    equipment:'Bodyweight'},
  ],
};

function getExerciseMuscle(name){
  for(const [group,arr] of Object.entries(EXERCISE_LIBRARY)){
    if(arr.some(e=>e.name===name)) return group;
  }
  return null;
}

function getExerciseInfo(name){
  for(const arr of Object.values(EXERCISE_LIBRARY)){
    const found=arr.find(e=>e.name===name);
    if(found) return found;
  }
  return null;
}