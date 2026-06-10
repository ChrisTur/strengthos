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

// Default day-of-week → workout index map per frequency (Mon=0 … Sun=6)
const WEEK_DEFAULTS={
  7:[0,1,2,3,4,5,6],
  6:[0,1,2,3,4,5,REST_DAY],
  5:[0,1,2,3,4,REST_DAY,REST_DAY],
  4:[0,1,REST_DAY,2,3,REST_DAY,REST_DAY],
  3:[0,REST_DAY,1,REST_DAY,2,REST_DAY,REST_DAY],
};

function getActiveDays(){
  const dpw=getDaysPerWeek(),goal=getGoal();
  let base;
  if(PROGRAMS[dpw]) base=PROGRAMS[dpw];
  else if(dpw===5) base=DAYS.slice(0,5);
  else if(dpw===6) base=DAYS.slice(0,6);
  else base=DAYS;
  // Fat loss / cardio goals with a frequency-based program → inject a dedicated cardio day
  if((goal==='fat_loss'||goal==='cardio')&&PROGRAMS[dpw]) return [...base,getCardioDay()];
  return base;
}
function getActiveDay(idx){ return getActiveDays()[idx]||null }

// Goal-aware week defaults — fat_loss alternates strength + cardio
function getGoalWeekDefaults(){
  const dpw=getDaysPerWeek(),goal=getGoal();
  if(PROGRAMS[dpw]&&(goal==='fat_loss'||goal==='cardio')){
    const ci=PROGRAMS[dpw].length; // index of CARDIO_DAY in getActiveDays()
    if(dpw===3) return [0,ci,1,ci,2,REST_DAY,REST_DAY]; // Mon-Push Tue-Cardio Wed-Pull Thu-Cardio Fri-Legs
    if(dpw===4) return [0,1,ci,2,3,REST_DAY,REST_DAY];  // Mon-Chest Tue-Back Wed-Cardio Thu-Legs Fri-Shoul
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