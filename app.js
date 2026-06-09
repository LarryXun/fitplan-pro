const assets = {
  workoutHero: "assets/workout-hero.jpg",
  workoutBanner: "assets/workout-banner.jpg",
  workoutThumb: "assets/workout-thumb.jpg",
  mealHero: "assets/meal-hero.jpg",
  mealThumb: "assets/meal-thumb.jpg",
  avatar: "assets/avatar.jpg",
  logo: "assets/fitplan-logo.svg",
};

const saved = JSON.parse(localStorage.getItem("fitplan-state") || "{}");
const isLegacyState = saved.version !== 2;
const debugParams = new URLSearchParams(location.search);
const debugRoute = debugParams.get("route");
const state = {
  route: debugRoute || "home",
  previousRoute: "home",
  language: debugParams.get("lang") || saved.language || "zh",
  units: debugParams.get("units") || saved.units || "metric",
  period: debugParams.get("period") || "week",
  planPeriod: debugParams.get("planPeriod") || "week",
  setupStep: 1,
  age: saved.age || 28,
  weight: saved.weight || 70,
  goalWeight: saved.goalWeight || 65,
  bodyFat: saved.bodyFat || 15,
  goal: isLegacyState ? "fat" : (saved.goal || "fat"),
  days: saved.days || 4,
  duration: saved.duration || 45,
  equipment: new Set(saved.equipment || ["哑铃", "杠铃", "卧推凳", "拉力器"]),
  customEquipment: (saved.customEquipment || []).map(item => typeof item === "string"
    ? { name: item, en: "Custom", type: "selectorized", unit: "kg", increment: 5 }
    : item),
  activeWorkout: false,
  planStarted: saved.planStarted || false,
  completedExercises: new Set(),
  foodImage: null,
  sheet: debugParams.get("sheet"),
  customEquipmentDraft: {
    image: null,
    name: "",
    type: "selectorized",
    unit: "kg",
    increment: 5,
    confidence: 0,
    usageSteps: [],
    commonMistakes: [],
    targetMuscles: [],
  },
  equipmentGuide: null,
  ingredients: saved.ingredients || [
    { name: "鸡胸肉", en: "Chicken Breast", amount: "150 g", kcal: 248 },
    { name: "藜麦", en: "Quinoa", amount: "80 g", kcal: 120 },
    { name: "西兰花", en: "Broccoli", amount: "100 g", kcal: 35 },
    { name: "橄榄油", en: "Olive Oil", amount: "10 g", kcal: 90 },
  ],
};

const app = document.querySelector("#app");

const icons = {
  home: '<path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-6-5-9 0 3-2 5-3 5 0-4-2-7-4-9 0 5-3 8-3 13 0 4 4 7 8 7z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  camera: '<path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><circle cx="12" cy="13" r="4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  weight: '<path d="M5 7h14l2 14H3z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  refresh: '<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.5 9A7 7 0 0 1 17 5l3 2M18.5 15A7 7 0 0 1 7 19l-3-2"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
};

function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.activity}</svg>`;
}

function persist() {
  localStorage.setItem("fitplan-state", JSON.stringify({
    version: 2,
    language: state.language,
    units: state.units,
    age: state.age,
    weight: state.weight,
    goalWeight: state.goalWeight,
    bodyFat: state.bodyFat,
    goal: state.goal,
    days: state.days,
    duration: state.duration,
    equipment: [...state.equipment],
    customEquipment: state.customEquipment,
    ingredients: state.ingredients,
    planStarted: state.planStarted,
  }));
}

function text(zh, en) {
  return state.language === "zh" ? zh : en;
}

function dual(zh, en, tag = "span") {
  const primary = text(zh, en);
  const secondary = text(en, zh);
  return `<${tag}>${primary}<small>${secondary}</small></${tag}>`;
}

function displayWeight(kg, digits = 1) {
  const value = state.units === "metric" ? kg : kg * 2.20462;
  return `${value.toFixed(digits)} ${state.units === "metric" ? "kg" : "lb"}`;
}

function displayHeight(cm) {
  if (state.units === "metric") return `${cm} cm`;
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}' ${totalInches % 12}"`;
}

const periodData = {
  week: {
    change: -0.4,
    workouts: "4 / 6",
    adherence: 92,
    streak: 12,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weights: [69.1, 69.0, 68.9, 68.8, 68.8, 68.6, 68.5],
    bars: [72, 58, 88, 28, 92, 64, 18],
    insightZh: "本周已完成 4 次训练。周五力量表现最好，建议周日保持低强度恢复。",
    insightEn: "You completed 4 sessions this week. Friday was your strongest day; keep Sunday low intensity.",
  },
  month: {
    change: -1.4,
    workouts: "18 / 22",
    adherence: 86,
    streak: 12,
    labels: ["W1", "W2", "W3", "W4", "W5"],
    weights: [69.9, 69.5, 69.2, 68.8, 68.5],
    bars: [74, 82, 68, 91, 55],
    insightZh: "过去 30 天体重下降 1.4 kg，训练完成率 86%。减脂速度处于合理范围。",
    insightEn: "Weight dropped 1.4 kg over 30 days with 86% adherence, a sustainable fat-loss pace.",
  },
  year: {
    change: -6.3,
    workouts: "164",
    adherence: 79,
    streak: 12,
    labels: ["Jun", "Aug", "Oct", "Dec", "Feb", "Apr", "Jun"],
    weights: [74.8, 74.0, 73.2, 72.1, 70.8, 69.6, 68.5],
    bars: [55, 63, 70, 61, 78, 84, 76],
    insightZh: "过去 12 个月累计下降 6.3 kg，同时保持了稳定力量训练，长期趋势良好。",
    insightEn: "You lost 6.3 kg over 12 months while maintaining consistent strength training.",
  },
};

const weeklyPlan = [
  { dayZh: "周一", dayEn: "Mon", zh: "上肢推力", en: "Upper Push", duration: 45, focusZh: "胸部 · 肩部 · 三头", focusEn: "Chest · Shoulders · Triceps", image: "assets/plan-push.jpg" },
  { dayZh: "周二", dayEn: "Tue", zh: "背部拉力", en: "Back Pull", duration: 45, focusZh: "背部 · 二头", focusEn: "Back · Biceps", image: "assets/plan-pull.jpg", route: "workout" },
  { dayZh: "周三", dayEn: "Wed", zh: "坡度快走", en: "Incline Walk", duration: 35, focusZh: "室内有氧 · Zone 2", focusEn: "Indoor Cardio · Zone 2", image: "assets/plan-cardio.jpg" },
  { dayZh: "周四", dayEn: "Thu", zh: "主动恢复", en: "Active Recovery", duration: 20, focusZh: "活动度 · 拉伸", focusEn: "Mobility · Stretch", image: "assets/plan-recovery.jpg" },
  { dayZh: "周五", dayEn: "Fri", zh: "下肢力量", en: "Lower Strength", duration: 50, focusZh: "腿部 · 臀部", focusEn: "Legs · Glutes", image: "assets/plan-legs.jpg" },
  { dayZh: "周六", dayEn: "Sat", zh: "核心 + 单车", en: "Core + Bike", duration: 40, focusZh: "核心 · 室内有氧", focusEn: "Core · Indoor Cardio", image: "assets/plan-core.jpg" },
  { dayZh: "周日", dayEn: "Sun", zh: "恢复日", en: "Recovery", duration: 25, focusZh: "低强度拉伸", focusEn: "Low-intensity Stretch", image: "assets/plan-stretch.jpg" },
];

const monthlyPlan = [
  { week: 1, titleZh: "适应周", titleEn: "Foundation", sessions: 4, minutes: 165, load: 62 },
  { week: 2, titleZh: "渐进周", titleEn: "Progression", sessions: 5, minutes: 205, load: 74 },
  { week: 3, titleZh: "强化周", titleEn: "Build", sessions: 5, minutes: 220, load: 86 },
  { week: 4, titleZh: "减量周", titleEn: "Deload", sessions: 3, minutes: 125, load: 48 },
];

function statusBar() {
  return `<div class="status"><strong>9:41</strong><div class="dynamic-island"></div><div class="status-icons"><span></span><span></span><i></i></div></div>`;
}

function header() {
  return `<header class="home-header">
    <div class="brand">
      <img src="${assets.logo}" alt="FitPlan AI">
      <div><strong>FitPlan AI</strong><small>PERSONAL PERFORMANCE</small></div>
    </div>
    <div class="header-tools">
      <button class="utility-btn" data-toast="${text("暂无新通知", "No new notifications")}" aria-label="Notifications">${icon("bell")}</button>
      <div class="language"><button data-lang="zh" class="${state.language === "zh" ? "active" : ""}">中</button><button data-lang="en" class="${state.language === "en" ? "active" : ""}">EN</button></div>
    </div>
  </header>`;
}

function nav() {
  const items = [
    ["home", "home", "首页", "Home"],
    ["plan", "calendar", "计划", "Plan"],
    ["log", "plus", "记录", "Log"],
    ["progress", "chart", "进度", "Progress"],
    ["profile", "user", "我的", "Me"],
  ];
  return `<nav class="nav">${items.map(([route, glyph, zh, en], index) => `
    <button data-route="${route}" class="${state.route === route ? "active" : ""} ${index === 2 ? "record" : ""}">
      <span class="nav-icon">${icon(glyph)}</span>
      <span>${text(zh, en)}</span><small>${text(en, zh)}</small>
    </button>`).join("")}</nav>`;
}

function sectionTitle(zh, en, action = "") {
  return `<div class="section-title"><div>${dual(zh, en, "h2")}</div>${action}</div>`;
}

function metric(iconName, zh, en, value, cls = "") {
  return `<div class="metric ${cls}">${icon(iconName)}<div><span>${text(zh, en)}</span><small>${text(en, zh)}</small></div><strong>${value}</strong></div>`;
}

function home() {
  return `<section class="screen home-screen">
    ${statusBar()}${header()}
    <section class="welcome-line">
      <div class="identity"><img src="${assets.avatar}" alt="Larry"><div>${dual("你好，Larry", "Hi, Larry", "h1")}<p>${text("今天专注完成一次高质量训练", "Focus on one quality session today")}</p></div></div>
      <button data-route="progress"><b>12</b><span>DAYS<small>STREAK</small></span>${icon("arrow")}</button>
    </section>
    <div class="performance-line"><span>TODAY · 09 JUN</span><span>WEEK 03 · CUT PHASE</span></div>

    <section class="workout-section">
      ${sectionTitle("今日训练", "Today's Workout", `<span class="technical">AI ADAPTED · ${state.equipment.size} EQUIPMENT</span>`)}
      <article class="workout-hero">
        <div class="workout-photo">
          <img src="${assets.workoutBanner}" alt="One-arm dumbbell row">
          <span class="photo-index">SESSION 01</span>
          <span class="photo-corner"></span>
        </div>
        <div class="hero-content">
          <span class="eyebrow">${icon("target")} ${text("力量 · 背部", "STRENGTH · BACK")}</span>
          ${dual("背部力量训练", "Back Strength", "h3")}
          <div class="workout-meta"><span>${icon("clock")} 45 ${text("分钟", "MIN")}</span><span>${icon("activity")} ${text("中等强度", "MODERATE")}</span></div>
          <button class="start-btn" data-route="workout">${icon("play")}<span>${text("开始训练", "Start Workout")}<small>${text("Start Workout", "开始训练")}</small></span>${icon("arrow")}</button>
        </div>
      </article>
    </section>

    <section class="performance-strip">
      <div class="progress-arc"><div><b>78%</b><small>${text("完成", "DONE")}</small></div></div>
      <div class="performance-metrics">
        ${metric("check", "训练完成", "Workouts", "4 / 6")}
        ${metric("flame", "活动热量", "Active kcal", "2,340")}
        ${metric("activity", "连续训练", "Streak", text("12 天", "12 days"))}
      </div>
    </section>

    <section class="nutrition-section">
      ${sectionTitle("今日营养", "Today's Nutrition", `<button class="text-action" data-route="food">${icon("scan")} ${text("识别食物", "Scan Food")}</button>`)}
      <article class="nutrition-panel">
        <img src="${assets.mealThumb}" alt="Chicken quinoa bowl">
        <div class="nutrition-content">
          <div class="calorie-line"><div><span>${text("剩余", "Remaining")}</span><strong>680</strong><small>kcal</small></div><span class="goal">1,620 / 2,300</span></div>
          ${macro("蛋白质", "Protein", 98, 140, "green")}
          ${macro("碳水", "Carbs", 132, 180, "purple")}
          ${macro("脂肪", "Fat", 42, 60, "amber")}
        </div>
      </article>
    </section>

    <section class="quick-section">
      ${sectionTitle("快捷入口", "Quick Access")}
      <div class="quick-grid">
        ${quick("setup", "target", "定制计划", "My Plan", "01")}
        ${quick("food", "scan", "食物识别", "Food Scan", "02")}
        ${quick("equipment", "sliders", "器械设置", "Equipment", "03")}
        ${quick("progress", "chart", "训练进度", "Progress", "04")}
      </div>
    </section>
    ${nav()}
  </section>`;
}

function macro(zh, en, value, max, color) {
  return `<div class="macro-row"><div><span>${text(zh, en)}</span><b>${value} / ${max}g</b></div><div class="track"><i class="${color}" style="width:${value / max * 100}%"></i></div></div>`;
}

function quick(route, glyph, zh, en, number) {
  return `<button class="quick" data-route="${route}"><span class="quick-number">${number}</span>${icon(glyph)}<span>${text(zh, en)}</span><small>${text(en, zh)}</small>${icon("arrow", "quick-arrow")}</button>`;
}

const workouts = [
  ["周一", "Mon", "推举训练", "Push", "60 min", "胸部 · 肩部 · 三头"],
  ["周二", "Tue", "有氧训练", "Cardio", "45 min", "全身耐力"],
  ["周三", "Wed", "拉力训练", "Pull", "60 min", "背部 · 二头"],
  ["周四", "Thu", "主动恢复", "Recovery", "20 min", "灵活性 · 放松"],
  ["周五", "Fri", "腿部训练", "Legs", "60 min", "腿部 · 臀部"],
  ["周六", "Sat", "核心 + 有氧", "Core + Cardio", "45 min", "核心 · 全身"],
  ["周日", "Sun", "恢复日", "Rest", "30 min", "拉伸 · 呼吸"],
];

function innerTop(zh, en, back = "home") {
  return `${statusBar()}<header class="inner-top"><button class="utility-btn" data-route="${back}">${icon("back")}</button>${dual(zh, en, "h1")}<button class="utility-btn" data-toast="${text("更多功能", "More options")}">${icon("more")}</button></header>`;
}

function plan() {
  return `<section class="screen">${innerTop("训练计划", "Training Plan")}
    <div class="segmented"><button data-plan-period="week" class="${state.planPeriod === "week" ? "active" : ""}">${text("周计划", "Weekly")}</button><button data-plan-period="month" class="${state.planPeriod === "month" ? "active" : ""}">${text("月计划", "Monthly")}</button></div>
    <div class="plan-body">${planBody()}</div>${nav()}
  </section>`;
}

function planBody() {
  if (state.planPeriod === "month") {
    return `<section class="plan-overview">
      <div><small>${text("本月目标", "MONTHLY GOAL")}</small><strong>${text("减脂 1.2 kg", "Lose 1.2 kg")}</strong></div>
      <div><small>${text("训练安排", "SESSIONS")}</small><strong>17 <em>${text("次", "sessions")}</em></strong></div>
      <div class="mini-ring"><b>72%</b></div>
    </section>
    <div class="month-plan">${monthlyPlan.map(item => `<article>
      <div class="month-week"><small>WEEK</small><b>0${item.week}</b></div>
      <div class="month-copy">${dual(item.titleZh,item.titleEn,"h3")}<p>${item.sessions} ${text("次训练","sessions")} · ${item.minutes} min</p><div class="month-load"><i style="width:${item.load}%"></i></div></div>
      <strong>${item.load}%<small>${text("负荷","LOAD")}</small></strong>
    </article>`).join("")}</div>
    <button class="primary-btn" data-start-plan>${icon(state.planStarted?"check":"calendar")} ${text(state.planStarted?"本月计划进行中":"启用本月计划",state.planStarted?"Month In Progress":"Activate Month")}</button>`;
  }
  return `<section class="plan-overview">
    <div><small>${text("本周目标", "WEEKLY GOAL")}</small><strong>${text("减脂 & 保持力量", "Cut & Maintain")}</strong></div>
    <div><small>${text("预计消耗", "EST. BURN")}</small><strong>3,480 <em>kcal</em></strong></div>
    <div class="mini-ring"><b>67%</b></div>
  </section>
  <div class="schedule">${weeklyPlan.map(item => `<button class="schedule-row" ${item.route ? `data-route="${item.route}"` : `data-toast="${text(item.zh,item.en)}"`}>
    <span class="schedule-day"><b>${text(item.dayZh,item.dayEn)}</b><small>${text(item.dayEn,item.dayZh)}</small></span>
    <img src="${item.image}" alt="${item.en}">
    <span class="schedule-copy"><b>${text(item.zh,item.en)}</b><small>${text(item.en,item.zh)}</small><em>${item.duration} min · ${text(item.focusZh,item.focusEn)}</em></span>${icon("arrow")}
  </button>`).join("")}</div>
  <button class="primary-btn" data-start-plan>${icon(state.planStarted?"check":"play")} ${text(state.planStarted?"本周计划进行中":"开始本周计划",state.planStarted?"Week In Progress":"Start This Week")}</button>`;
}

function logScreen() {
  const actions = [
    ["food", "scan", "食物识别", "Food Scan", "AI"],
    ["", "dumbbell", "训练记录", "Workout Log", "+45"],
    ["", "weight", "体重记录", "Weight Log", "68.5"],
    ["", "activity", "饮水记录", "Water Log", "1.75L"],
  ];
  return `<section class="screen">${statusBar()}${sectionTitle("记录", "Daily Log")}
    <div class="log-grid">${actions.map(([route, glyph, zh, en, value]) => `<button class="log-tile" ${route ? `data-route="${route}"` : `data-toast="${text(`${zh}已更新`, `${en} updated`)}"`}><span>${value}</span>${icon(glyph)}${dual(zh, en, "b")}${icon("arrow")}</button>`).join("")}</div>
    <section class="timeline">${sectionTitle("今日记录", "Today's Activity")}
      ${[["08:20","早餐","Breakfast","420 kcal"],["17:35","背部力量训练","Back Strength","45 min"],["19:10","晚餐","Dinner","620 kcal"],["21:00","饮水","Water","250 ml"]].map(x => `<div class="timeline-row"><time>${x[0]}</time><span></span><div>${dual(x[1], x[2], "b")}<em>${x[3]}</em></div>${icon("check")}</div>`).join("")}
    </section>${nav()}</section>`;
}

function progress() {
  return `<section class="screen">${innerTop("训练进度", "Progress")}
    <div class="segmented">${[["week","周","Week"],["month","月","Month"],["year","年","Year"]].map(([key,zh,en]) => `<button data-period="${key}" class="${state.period === key ? "active" : ""}">${text(zh,en)}</button>`).join("")}</div>
    <div class="progress-body">${progressBody()}</div>${nav()}
  </section>`;
}

function progressBody() {
  const data = periodData[state.period];
  const changeValue = state.units === "metric" ? data.change : data.change * 2.20462;
  const changeUnit = state.units === "metric" ? "kg" : "lb";
  const min = Math.min(...data.weights);
  const max = Math.max(...data.weights);
  const points = data.weights.map((value,index) => {
    const x = data.weights.length === 1 ? 0 : index * 360 / (data.weights.length - 1);
    const y = 25 + ((max - value) / Math.max(.1,max-min)) * 95;
    return `${x},${y}`;
  }).join(" ");
  return `<section class="progress-kpis">
    <div><small>${text("当前体重","CURRENT WEIGHT")}</small><strong>${displayWeight(data.weights.at(-1))}</strong></div>
    <div><small>${text("周期变化","PERIOD CHANGE")}</small><strong class="green">${changeValue > 0 ? "+" : ""}${changeValue.toFixed(1)} <em>${changeUnit}</em></strong></div>
    <div><small>${text("连续训练","STREAK")}</small><strong>${data.streak} <em>${text("天","days")}</em></strong></div>
  </section>
  <article class="data-panel">${sectionTitle("体重趋势", "Weight Trend", `<b class="green">${changeValue.toFixed(1)} ${changeUnit}</b>`)}
    <div class="chart"><svg viewBox="0 0 360 150" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#82f05f" stop-opacity=".32"/><stop offset="1" stop-color="#82f05f" stop-opacity="0"/></linearGradient></defs><polygon points="${points} 360,150 0,150" fill="url(#chartFill)"/><polyline points="${points}" fill="none" stroke="#82f05f" stroke-width="3"/></svg><div class="chart-labels">${data.labels.map(x=>`<span>${x}</span>`).join("")}</div></div>
  </article>
  <div class="data-grid"><article class="data-panel"><small>${text("完成训练","WORKOUTS")}</small><strong class="data-value">${data.workouts}</strong><div class="bars">${data.bars.map(h => `<i style="height:${h}%"></i>`).join("")}</div></article><article class="data-panel"><small>${text("训练依从性","ADHERENCE")}</small><strong class="score">${data.adherence}</strong><p>/100</p><ul><li>${text("室内训练为主","Indoor focused")}</li><li>${text("减脂进度稳定","Stable fat loss")}</li></ul></article></div>
  <article class="insight">${icon("activity")}<div>${dual("AI 洞察", "AI Insight", "b")}<p>${text(data.insightZh,data.insightEn)}</p></div></article>`;
}

function profile() {
  const settings = [
    ["sliders","语言","Language",state.language === "zh" ? "简体中文" : "English","language"],
    ["activity","单位","Units",state.units === "metric" ? "kg, cm" : "lb, ft","units"],
    ["heart","饮食偏好","Diet Preference",text("中餐 · 中东餐 · 欧美餐","Chinese · Middle Eastern · Western"),""],
    ["dumbbell","训练偏好","Workout Preference",text("健身房 · 室内","Gym · Indoor"),""],
    ["chart","数据导出","Data Export","",""],
  ];
  return `<section class="screen">${statusBar()}${sectionTitle("我的", "Profile", `<button class="utility-btn" data-toast="${text("设置", "Settings")}">${icon("sliders")}</button>`)}
    <section class="profile-panel"><div class="profile-main"><img src="${assets.avatar}" alt="Larry"><div>${dual("你好，Larry", "Hi, Larry", "h1")}<p>larry@fitplan.local</p></div><button class="utility-btn" data-toast="${text("编辑资料","Edit profile")}">${icon("edit")}</button></div><div class="profile-stats"><div><small>${text("健身等级","LEVEL")}</small><b class="green">LV. 12</b></div><div><small>${text("当前目标","GOAL")}</small><b>${text("减脂","FAT LOSS")}</b></div><div><small>${text("会员状态","PLAN")}</small><b>${text("免费版","FREE")}</b></div></div></section>
    <section class="settings-list">${settings.map(x => `<button ${x[4] ? `data-setting="${x[4]}"` : `data-toast="${text(`${x[1]}设置`, `${x[2]} settings`)}"`}>${icon(x[0])}<span>${text(x[1],x[2])}<small>${text(x[2],x[1])}</small></span><em>${x[3]}</em>${icon("arrow")}</button>`).join("")}</section>
    <button class="equipment-summary" data-route="equipment"><div>${icon("dumbbell")}<span>${dual("我的器械","My Equipment","b")}<em>${state.equipment.size} ${text("件已添加","items")}</em></span></div>${icon("arrow")}</button>
    <button class="logout" data-toast="${text("调试模式：未退出","Debug mode: not signed out")}">${icon("logout")} ${text("退出登录","Sign Out")}</button>${nav()}
  </section>`;
}

function setup() {
  if (state.setupStep === 1) return bodyData();
  if (state.setupStep === 2) return goalSetup();
  return equipment();
}

function setupTop(zh, en, step) {
  return `${statusBar()}<header class="inner-top"><button class="utility-btn" data-back>${icon("back")}</button>${dual(zh,en,"h1")}<strong class="step-count">${step}/5</strong></header><div class="step-progress">${[1,2,3,4,5].map(i => `<i class="${i <= step ? "done" : ""}"></i>`).join("")}</div>`;
}

function bodyData() {
  return `<section class="screen setup-screen">${setupTop("身体数据","Body Data",1)}<div class="intro">${dual("建立你的身体基线","Build your baseline","h2")}<p>${text("这些数据将用于计算热量目标和训练强度。","These metrics calibrate your calories and training intensity.")}</p></div>
    <div class="form-list">
      <button class="form-row" data-toast="${text("姓名编辑","Edit name")}">${icon("user")}<span>${dual("姓名","Name","b")}</span><strong>Larry</strong>${icon("arrow")}</button>
      <div class="form-row">${icon("user")}<span>${dual("性别","Gender","b")}</span><div class="inline-select"><button class="active">${text("男","Male")}</button><button>${text("女","Female")}</button></div></div>
      ${stepperRow("年龄","Age","age",state.age,text("岁","yrs"))}
      <button class="form-row" data-toast="${text("身高可在资料页修改","Height can be edited in profile")}">${icon("activity")}<span>${dual("身高","Height","b")}</span><strong>${displayHeight(175)}</strong>${icon("arrow")}</button>
      ${stepperRow("体重","Weight","weight",state.weight,state.units === "metric" ? "kg" : "lb")}
      ${stepperRow("目标体重","Goal Weight","goalWeight",state.goalWeight,state.units === "metric" ? "kg" : "lb")}
      ${stepperRow("体脂率","Body Fat","bodyFat",state.bodyFat,"%")}
    </div>
    <div class="activity-selector">${sectionTitle("活动水平","Activity Level")}<div class="chips">${["久坐","轻度活动","中等活动","高强度"].map((x,i) => `<button class="${i===0?"active":""}" data-toast="${text(`已选择${x}`,"Activity selected")}">${x}</button>`).join("")}</div></div>
    <button class="primary-btn" data-next>${text("下一步","Next")} ${icon("arrow")}</button>
  </section>`;
}

function stepperRow(zh, en, key, value, unit) {
  const shown = ["weight","goalWeight"].includes(key) && state.units === "imperial" ? (value * 2.20462).toFixed(1) : value;
  return `<div class="form-row">${icon(key === "weight" || key === "goalWeight" ? "weight" : "activity")}<span>${dual(zh,en,"b")}</span><div class="stepper"><button data-stepper="${key}" data-delta="-1">−</button><strong>${shown}</strong><button data-stepper="${key}" data-delta="1">+</button><em>${unit}</em></div></div>`;
}

const goals = [
  ["fat","flame","减脂","Fat Loss"],
  ["muscle","dumbbell","增肌","Muscle Gain"],
  ["health","heart","保持健康","Maintain Health"],
  ["recomp","target","塑形","Body Recomposition"],
  ["fitness","activity","提升体能","Improve Fitness"],
];

function goalSetup() {
  return `<section class="screen setup-screen">${setupTop("健身目标","Fitness Goal",2)}<div class="intro">${dual("你现在最重要的目标","Choose your priority","h2")}<p>${text("计划可随时修改，我们会根据进度自动调整。","Your plan stays editable and adapts with your progress.")}</p></div>
    <div class="goal-list">${goals.map(g => `<button class="${state.goal===g[0]?"active":""}" data-goal="${g[0]}">${icon(g[1])}<span>${dual(g[2],g[3],"b")}<em>${text("自动匹配训练和饮食策略","Training and nutrition strategy")}</em></span><i>${state.goal===g[0]?icon("check"):""}</i></button>`).join("")}</div>
    <div class="choice-section">${dual("每周训练天数","Training days per week","h3")}<div class="chips">${[1,2,3,4,5,6,7].map(x=>`<button class="${state.days===x?"active":""}" data-days="${x}">${x}</button>`).join("")}</div></div>
    <div class="choice-section">${dual("单次训练时长","Workout duration","h3")}<div class="chips">${[30,45,60,75,90].map(x=>`<button class="${state.duration===x?"active":""}" data-duration="${x}">${x} min</button>`).join("")}</div></div>
    <button class="primary-btn" data-next>${text("下一步","Next")} ${icon("arrow")}</button>
  </section>`;
}

const equipmentItems = [
  ["哑铃","Dumbbells"],["杠铃","Barbell"],["卧推凳","Bench"],["跑步机","Treadmill"],
  ["拉力器","Resistance Bands"],["引体向上架","Pull-up Bar"],["壶铃","Kettlebell"],["史密斯机","Smith Machine"],
];

const equipmentGuides = {
  "哑铃": { en: "Dumbbells", motion: "curl", muscles: ["肱二头肌", "前臂"], steps: ["双脚站稳，核心收紧", "手腕保持中立，肘部贴近身体", "控制抬起与下放，不借力摆动"], mistakes: ["身体前后摆动", "手腕过度弯曲", "下放速度过快"] },
  "杠铃": { en: "Barbell", motion: "press", muscles: ["胸肌", "三头肌"], steps: ["确认杠铃杆与配重片重量", "肩胛骨后收并稳定", "沿稳定轨迹推起，避免锁死肘关节"], mistakes: ["左右配重不一致", "手腕后折", "动作幅度失控"] },
  "卧推凳": { en: "Bench", motion: "press", muscles: ["胸肌", "三头肌"], steps: ["调整靠背角度并锁紧", "头、肩、臀保持接触凳面", "双脚踩稳地面后开始推举"], mistakes: ["凳面未锁紧", "臀部离开凳面", "肩部向前顶"] },
  "跑步机": { en: "Treadmill", motion: "treadmill", muscles: ["腿部", "心肺"], steps: ["从低速开始并站在跑带中央", "身体保持直立，自然摆臂", "减脂训练优先使用坡度快走"], mistakes: ["长时间扶住把手", "步幅过大", "未热身直接高速"] },
  "拉力器": { en: "Cable Machine", motion: "pull", muscles: ["背部", "肩部"], steps: ["确认插销完全插入目标档位", "调整滑轮高度与附件", "保持钢索受力，控制回程"], mistakes: ["插销未插到底", "使用惯性拉动", "配重片猛烈碰撞"] },
  "引体向上架": { en: "Pull-up Bar", motion: "pullup", muscles: ["背阔肌", "肱二头肌"], steps: ["选择合适握距并收紧核心", "肩胛先下沉，再拉起身体", "缓慢下降至手臂接近伸直"], mistakes: ["耸肩", "大幅摆腿", "下降失控"] },
  "壶铃": { en: "Kettlebell", motion: "swing", muscles: ["臀腿", "核心"], steps: ["壶铃放在身体前方，髋部向后折叠", "用髋部爆发力驱动，不用手臂抬起", "保持脊柱中立并控制回摆"], mistakes: ["蹲得过深", "用肩膀抬壶铃", "腰椎过度伸展"] },
  "史密斯机": { en: "Smith Machine", motion: "squat", muscles: ["股四头肌", "臀肌"], steps: ["确认安全挂钩与限位器位置", "双脚根据动作放在合适位置", "旋转杠铃解锁并控制下放"], mistakes: ["忘记设置限位器", "膝盖内扣", "杠铃未完全挂回"] },
};

function equipment() {
  const standalone = state.route === "equipment";
  const allItems = [
    ...equipmentItems.map(x => [...x, ""]),
    ...state.customEquipment.map(x => [
      x.name,
      x.en || "Custom",
      `${weightTypeLabel(x.type)} · ${x.increment} ${x.unit}`,
    ]),
  ];
  return `<section class="screen setup-screen">${setupTop("器械设置","Equipment Setup",3)}
    <section class="equipment-status">${icon("check")}<div><b>${text("已选择","Selected")} <strong>${state.equipment.size}</strong></b><small>${text("训练动作将自动适配现有器械","Exercises adapt to available equipment")}</small></div></section>
    <label class="search-box">${icon("search")}<input id="equipment-search" placeholder="${text("搜索器械","Search equipment")}"></label>
    <div class="equipment-list">${allItems.map(x => `<div class="equipment-item ${state.equipment.has(x[0])?"active":""}" data-equipment-row="${x[0]}">
      <button class="equipment-select" data-equipment="${x[0]}">${icon("dumbbell")}<span>${dual(x[0],x[1],"b")}${x[2] ? `<em>${x[2]}</em>` : ""}</span><i>${state.equipment.has(x[0])?icon("check"):""}</i></button>
      <button class="guide-btn" data-equipment-guide="${x[0]}">${text("怎么用","Guide")} ${icon("arrow")}</button>
    </div>`).join("")}</div>
    <button class="add-custom" data-custom-equipment>${icon("camera")}<span>${dual("拍照添加自定义器械","Scan Custom Equipment","b")}<em>${text("识别器械类型与配重方式","Detect equipment and weight system")}</em></span>${icon("arrow")}</button>
    <button class="primary-btn" data-finish="${standalone}">${text(standalone?"保存设置":"下一步",standalone?"Save":"Next")} ${icon("arrow")}</button>
  </section>`;
}

function equipmentSheet() {
  if (state.sheet !== "equipment-scan") return "";
  const draft = state.customEquipmentDraft;
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet>
    <section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${text("识别自定义器械","Scan custom equipment")}">
      <div class="sheet-handle"></div>
      <header class="sheet-header">
        <div>${dual("识别自定义器械","Scan Equipment","h2")}<p>${text("拍摄器械整体和配重区域，识别结果可手动修改。","Capture the full machine and its weight system. Results stay editable.")}</p></div>
        <button class="utility-btn" data-close-sheet aria-label="Close">×</button>
      </header>
      <label class="equipment-camera ${draft.image ? "has-image" : ""}">
        ${draft.image ? `<img src="${draft.image}" alt="Custom equipment">` : `<span>${icon("scan")}<b>${text("拍摄或选择器械照片","Take or choose a photo")}</b><small>${text("建议同时拍到器械铭牌和配重片","Include the label and weight stack")}</small></span>`}
        <input id="equipment-photo-input" type="file" accept="image/*" capture="environment">
        ${draft.image ? `<i class="recognizing">${icon("scan")} ${draft.name ? text("识别完成","Detected") : text("正在分析器械","Analyzing equipment")}</i>` : ""}
      </label>
      <div class="recognition-form ${draft.image ? "visible" : ""}">
        <label><span>${text("器械名称","Equipment name")}</span><input id="custom-equipment-name" value="${draft.name}" placeholder="${text("例如：坐姿推胸机","e.g. Chest Press")}"></label>
        <label><span>${text("配重方式","Weight system")}</span><select id="custom-equipment-type">
          <option value="selectorized" ${draft.type === "selectorized" ? "selected" : ""}>${text("插片式配重档位","Selectorized weight stack")}</option>
          <option value="plates" ${draft.type === "plates" ? "selected" : ""}>${text("杠铃片 / 配重片","Weight plates")}</option>
          <option value="fixed" ${draft.type === "fixed" ? "selected" : ""}>${text("固定公斤数","Fixed weight")}</option>
          <option value="bodyweight" ${draft.type === "bodyweight" ? "selected" : ""}>${text("自重 / 辅助重量","Bodyweight / assistance")}</option>
        </select></label>
        <div class="form-pair">
          <label><span>${text("重量单位","Unit")}</span><select id="custom-equipment-unit"><option value="kg">kg</option><option value="lb">lb</option></select></label>
          <label><span>${text("每档 / 每片","Increment")}</span><input id="custom-equipment-increment" type="number" min="0.5" step="0.5" value="${draft.increment}"></label>
        </div>
        <div class="recognition-note">${icon("activity")}<p>${weightGuidance(draft.type)}</p></div>
      </div>
      <button class="primary-btn sheet-save" data-save-custom-equipment ${draft.name ? "" : "disabled"}>${icon("check")} ${text("确认并添加","Confirm & Add")}</button>
    </section>
  </div>`;
}

function guideSheet() {
  if (state.sheet !== "equipment-guide" || !state.equipmentGuide) return "";
  const guide = state.equipmentGuide;
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet>
    <section class="bottom-sheet guide-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <header class="sheet-header"><div>${dual(guide.name, guide.en, "h2")}<p>${text("器械使用教学 · 连续动作演示","Equipment tutorial · motion demo")}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
      <div class="motion-demo motion-${guide.motion}">
        <div class="machine"><i></i><i></i><i></i></div>
        <div class="athlete"><i class="head"></i><i class="body"></i><i class="arm"></i><i class="leg"></i></div>
        <span>LOOP · 4 SEC</span>
      </div>
      <div class="guide-tabs"><button class="active" data-guide-tab="steps">${text("使用步骤","Steps")}</button><button data-guide-tab="mistakes">${text("常见错误","Mistakes")}</button><button data-guide-tab="muscles">${text("目标肌群","Muscles")}</button></div>
      <div class="guide-content">
        <ol data-guide-panel="steps">${guide.steps.map(x => `<li>${x}</li>`).join("")}</ol>
        <ul data-guide-panel="mistakes" hidden>${guide.mistakes.map(x => `<li>${x}</li>`).join("")}</ul>
        <ul data-guide-panel="muscles" hidden>${guide.muscles.map(x => `<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="weight-tip">${icon("weight")}<div><b>${text("重量怎么选","Choosing weight")}</b><p>${text("先选择能以标准动作完成目标次数、并保留约 2 次余力的重量。连续两次轻松完成全部组数后，增加一档或最小配重片。","Choose a load that lets you finish the target reps with about 2 reps in reserve. Increase one stack level or the smallest plate after two easy sessions.")}</p></div></div>
    </section>
  </div>`;
}

function settingsSheet() {
  if (!["language-settings","units-settings"].includes(state.sheet)) return "";
  const languageMode = state.sheet === "language-settings";
  const options = languageMode
    ? [["zh","简体中文","Chinese"],["en","English","英语"]]
    : [["metric","公制","kg · cm"],["imperial","英制","lb · ft / in"]];
  const selected = languageMode ? state.language : state.units;
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet>
    <section class="bottom-sheet compact-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <header class="sheet-header"><div>${dual(languageMode?"语言":"单位",languageMode?"Language":"Units","h2")}<p>${text(languageMode?"界面会立即切换，并为未来阿拉伯语预留接口。":"体重、身高和训练重量会自动换算。",languageMode?"The interface updates immediately; additional languages remain extensible.":"Body metrics and training loads convert automatically.")}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
      <div class="setting-options">${options.map(option => `<button class="${selected===option[0]?"active":""}" data-setting-value="${option[0]}" data-setting-kind="${languageMode?"language":"units"}"><span><b>${option[1]}</b><small>${option[2]}</small></span><i>${selected===option[0]?icon("check"):""}</i></button>`).join("")}</div>
    </section>
  </div>`;
}

function weightGuidance(type) {
  const guidance = {
    selectorized: text("记录插销所在档位；系统会按每档公斤数计算训练重量。","Log the selected pin level; weight is calculated from each stack increment."),
    plates: text("记录左右两侧配重片数量与单片公斤数，系统会自动计算总重量。","Log plates on both sides and the weight per plate; total load is calculated automatically."),
    fixed: text("直接记录器械标注的公斤数。","Log the fixed weight printed on the equipment."),
    bodyweight: text("记录自重，或器械提供的辅助/额外负重。","Log bodyweight plus assistance or additional load."),
  };
  return guidance[type] || guidance.selectorized;
}

function weightTypeLabel(type) {
  const labels = {
    selectorized: text("插片式", "Stack"),
    plates: text("配重片", "Plates"),
    fixed: text("固定重量", "Fixed"),
    bodyweight: text("自重辅助", "Bodyweight"),
  };
  return labels[type] || labels.selectorized;
}

const exercises = [
  ["单臂哑铃划船","One-arm Dumbbell Row","4 × 10","60 sec","assets/ex-row.jpg"],
  ["高位下拉","Lat Pulldown","4 × 12","60 sec","assets/ex-pulldown.jpg"],
  ["坐姿划船","Seated Row","4 × 12","60 sec","assets/ex-seated-row.jpg"],
  ["俯身飞鸟","Bent-over Rear Delt Fly","3 × 15","45 sec","assets/ex-rear-delt.jpg"],
  ["平板支撑","Plank","3 × 45 sec","30 sec","assets/ex-plank.jpg"],
];

function workout() {
  return `<section class="screen workout-screen">${innerTop("训练详情","Workout Detail",state.previousRoute)}
    <article class="detail-hero"><img src="${assets.workoutBanner}" alt="Back strength workout"><div class="photo-shade"></div><div>${dual("背部力量训练","Back Strength","h1")}<span>HYPERTROPHY · INTERMEDIATE</span></div></article>
    <section class="detail-metrics">${metric("clock","训练时长","Duration","45 min")}${metric("flame","预计消耗","Est. Calories","620")}${metric("activity","训练难度","Difficulty",text("中级","Medium"))}</section>
    <section class="exercise-list">${sectionTitle("训练动作","Exercises",`<span>${state.completedExercises.size}/${exercises.length}</span>`)}
      ${exercises.map((e,i) => `<button class="exercise ${state.completedExercises.has(i)?"done":""}" data-exercise="${i}"><span class="exercise-index">${state.completedExercises.has(i)?icon("check"):i+1}</span><img src="${e[4]}" alt="${e[1]}"><span class="exercise-name">${dual(e[0],e[1],"b")}<em>${e[2]}</em></span><span class="rest">${text("休息","REST")}<b>${e[3]}</b></span>${icon("more")}</button>`).join("")}</section>
    <div class="sticky-actions"><button class="secondary-btn" data-toast="${text("已为你匹配替代动作","Alternatives matched")}">${icon("refresh")} ${text("替代动作","Alternatives")}</button><button class="primary-btn" data-start-workout>${icon(state.activeWorkout?"check":"play")} ${text(state.activeWorkout?"训练中":"开始训练",state.activeWorkout?"In Progress":"Start Workout")}</button></div>
  </section>`;
}

function food() {
  const image = state.foodImage || assets.mealHero;
  const total = state.ingredients.reduce((sum, item) => sum + Number(item.kcal), 0);
  return `<section class="screen food-screen">${innerTop("食物识别","Food Recognition",state.previousRoute)}
    <label class="food-camera"><img src="${image}" alt="Recognized meal"><span class="scan-corners"></span><span class="camera-command">${icon("camera")} ${text("拍照或选择图片","Take or choose photo")}</span><input id="food-input" type="file" accept="image/*" capture="environment"></label>
    <div class="recognition-head">${sectionTitle("AI 识别结果","AI Recognition Result")}<span class="confidence">92% · HIGH</span></div>
    <section class="food-summary"><div>${dual("鸡胸肉藜麦沙拉","Chicken Quinoa Salad","h2")}<small>${text("估算总热量","ESTIMATED CALORIES")}</small></div><strong>${total}<em> kcal</em></strong><div class="food-macros">${macro("蛋白质","Protein",42,60,"green")}${macro("碳水","Carbs",48,70,"purple")}${macro("脂肪","Fat",16,30,"amber")}</div></section>
    <section class="ingredient-list">${sectionTitle("食材分析","Ingredients",`<button class="text-action" data-edit-all>${icon("edit")} ${text("编辑","Edit")}</button>`)}
      ${state.ingredients.map((x,i) => `<button data-ingredient="${i}"><span class="ingredient-index">0${i+1}</span><span>${dual(x.name,x.en,"b")}</span><em>${x.amount}</em><strong>${x.kcal} kcal</strong>${icon("edit")}</button>`).join("")}
    </section>
    <div class="sticky-actions"><button class="secondary-btn" data-toast="${text("正在重新识别","Recognition restarted")}">${icon("refresh")} ${text("重新识别","Retry")}</button><button class="primary-btn" data-save-food>${icon("check")} ${text("保存记录","Save Log")}</button></div>
  </section>`;
}

function render() {
  const screens = { home, plan, log: logScreen, progress, profile, setup, equipment, workout, food };
  app.innerHTML = (screens[state.route] || home)() + equipmentSheet() + guideSheet() + settingsSheet();
  bind();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function navigate(route) {
  state.previousRoute = state.route;
  state.route = route;
  transitionRender();
}

function transitionRender() {
  if (document.startViewTransition) {
    document.startViewTransition(() => render());
  } else {
    app.classList.add("is-leaving");
    setTimeout(() => {
      render();
      app.classList.remove("is-leaving");
    }, 120);
  }
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

function bind() {
  document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.route)));
  document.querySelectorAll("[data-toast]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); toast(el.dataset.toast); }));
  document.querySelectorAll("[data-lang]").forEach(el => el.addEventListener("click", () => { state.language = el.dataset.lang; persist(); render(); }));
  document.querySelectorAll("[data-period]").forEach(el => el.addEventListener("click", () => {
    state.period = el.dataset.period;
    el.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === el));
    const body = document.querySelector(".progress-body");
    if (body) {
      body.animate([{opacity:.2,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:320,easing:"cubic-bezier(.22,1,.36,1)"});
      body.innerHTML = progressBody();
    }
  }));
  document.querySelectorAll("[data-plan-period]").forEach(el => el.addEventListener("click", () => {
    state.planPeriod = el.dataset.planPeriod;
    el.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === el));
    const body = document.querySelector(".plan-body");
    if (body) {
      body.animate([{opacity:.2,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:320,easing:"cubic-bezier(.22,1,.36,1)"});
      body.innerHTML = planBody();
      bindRoutesAndToasts(body);
    }
  }));
  document.querySelectorAll("[data-stepper]").forEach(el => el.addEventListener("click", () => {
    const key = el.dataset.stepper;
    const delta = Number(el.dataset.delta);
    const storedDelta = ["weight","goalWeight"].includes(key) && state.units === "imperial" ? delta / 2.20462 : delta;
    state[key] = Math.max(1, state[key] + storedDelta);
    persist();
    const valueNode = el.parentElement.querySelector("strong");
    const shown = ["weight","goalWeight"].includes(key) && state.units === "imperial" ? (state[key] * 2.20462).toFixed(1) : Math.round(state[key] * 10) / 10;
    if (valueNode) animateNumber(valueNode, shown);
  }));
  document.querySelectorAll("[data-goal]").forEach(el => el.addEventListener("click", () => {
    state.goal = el.dataset.goal;
    persist();
    el.parentElement.querySelectorAll("[data-goal]").forEach(x => {
      x.classList.toggle("active", x === el);
      x.querySelector("i").innerHTML = x === el ? icon("check") : "";
    });
  }));
  document.querySelectorAll("[data-days]").forEach(el => el.addEventListener("click", () => {
    state.days = Number(el.dataset.days);
    persist();
    el.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === el));
  }));
  document.querySelectorAll("[data-duration]").forEach(el => el.addEventListener("click", () => {
    state.duration = Number(el.dataset.duration);
    persist();
    el.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === el));
  }));
  document.querySelectorAll("[data-equipment]").forEach(el => el.addEventListener("click", () => {
    const item = el.dataset.equipment;
    state.equipment.has(item) ? state.equipment.delete(item) : state.equipment.add(item);
    persist();
    const row = el.closest("[data-equipment-row]");
    const marker = el.querySelector("i");
    row?.classList.toggle("active", state.equipment.has(item));
    if (marker) marker.innerHTML = state.equipment.has(item) ? icon("check") : "";
    const statusNumber = document.querySelector(".equipment-status strong");
    if (statusNumber) animateNumber(statusNumber, state.equipment.size);
  }));
  document.querySelectorAll("[data-equipment-guide]").forEach(el => el.addEventListener("click", () => {
    const name = el.dataset.equipmentGuide;
    const custom = state.customEquipment.find(item => item.name === name);
    const base = equipmentGuides[name] || {
      en: custom?.en || "Custom Equipment",
      motion: "pull",
      muscles: custom?.targetMuscles?.length ? custom.targetMuscles : ["主要训练肌群"],
      steps: custom?.usageSteps?.length ? custom.usageSteps : ["确认器械调整机构已经锁紧", "从轻重量开始熟悉运动轨迹", "全程控制速度并保持关节稳定"],
      mistakes: custom?.commonMistakes?.length ? custom.commonMistakes : ["初始重量过大", "动作速度过快", "忽略器械安全锁"],
    };
    state.equipmentGuide = { name, ...base };
    state.sheet = "equipment-guide";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  }));
  document.querySelectorAll("[data-exercise]").forEach(el => el.addEventListener("click", () => {
    const i = Number(el.dataset.exercise);
    state.completedExercises.has(i) ? state.completedExercises.delete(i) : state.completedExercises.add(i);
    el.classList.toggle("done", state.completedExercises.has(i));
    el.querySelector(".exercise-index").innerHTML = state.completedExercises.has(i) ? icon("check") : i + 1;
    const count = document.querySelector(".exercise-list .section-title > span");
    if (count) animateNumber(count, `${state.completedExercises.size}/${exercises.length}`);
  }));
  document.querySelectorAll("[data-ingredient]").forEach(el => el.addEventListener("click", () => editIngredient(Number(el.dataset.ingredient))));
  document.querySelector("[data-edit-all]")?.addEventListener("click", () => editIngredient(0));
  document.querySelector("[data-next]")?.addEventListener("click", () => { state.setupStep += 1; render(); });
  document.querySelector("[data-back]")?.addEventListener("click", () => {
    if (state.route === "setup" && state.setupStep > 1) state.setupStep -= 1;
    else navigate("home");
    render();
  });
  document.querySelector("[data-finish]")?.addEventListener("click", e => {
    const standalone = e.currentTarget.dataset.finish === "true";
    state.setupStep = 1;
    state.route = "home";
    persist(); render();
    toast(text(standalone ? "器械设置已保存" : "个性化计划已生成", standalone ? "Equipment saved" : "Personal plan generated"));
  });
  document.querySelector("[data-custom-equipment]")?.addEventListener("click", () => {
    state.customEquipmentDraft = { image: null, name: "", type: "selectorized", unit: "kg", increment: 5 };
    state.sheet = "equipment-scan";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  });
  document.querySelectorAll("[data-close-sheet]").forEach(el => el.addEventListener("click", e => {
    if (e.target.closest(".bottom-sheet") && !e.target.closest("[data-close-sheet]")) return;
    closeSheet();
  }));
  document.querySelector(".bottom-sheet")?.addEventListener("click", e => e.stopPropagation());
  document.querySelector("#equipment-photo-input")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.customEquipmentDraft.image = reader.result;
      state.customEquipmentDraft.name = "";
      render();
      requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
      analyzeEquipment(reader.result);
    };
    reader.readAsDataURL(file);
  });
  document.querySelector("#custom-equipment-name")?.addEventListener("input", e => {
    state.customEquipmentDraft.name = e.target.value;
    const save = document.querySelector("[data-save-custom-equipment]");
    if (save) save.disabled = !e.target.value.trim();
  });
  document.querySelector("#custom-equipment-type")?.addEventListener("change", e => {
    state.customEquipmentDraft.type = e.target.value;
    const note = document.querySelector(".recognition-note p");
    if (note) note.textContent = weightGuidance(e.target.value);
  });
  document.querySelector("#custom-equipment-unit")?.addEventListener("change", e => { state.customEquipmentDraft.unit = e.target.value; });
  document.querySelector("#custom-equipment-increment")?.addEventListener("input", e => { state.customEquipmentDraft.increment = Number(e.target.value) || 1; });
  document.querySelector("[data-save-custom-equipment]")?.addEventListener("click", () => {
    const name = document.querySelector("#custom-equipment-name")?.value.trim();
    if (!name) return;
    const existing = state.customEquipment.find(item => item.name === name);
    const details = {
      name,
      en: name,
      type: state.customEquipmentDraft.type,
      unit: state.customEquipmentDraft.unit,
      increment: state.customEquipmentDraft.increment,
      confidence: state.customEquipmentDraft.confidence,
      usageSteps: state.customEquipmentDraft.usageSteps,
      commonMistakes: state.customEquipmentDraft.commonMistakes,
      targetMuscles: state.customEquipmentDraft.targetMuscles,
    };
    if (existing) Object.assign(existing, details);
    else state.customEquipment.push(details);
    state.equipment.add(name);
    persist();
    closeSheet(() => {
      render();
      toast(text(`${name} 已添加`, `${name} added`));
    });
  });
  document.querySelector("[data-start-workout]")?.addEventListener("click", () => {
    state.activeWorkout = !state.activeWorkout;
    const button = document.querySelector("[data-start-workout]");
    button.innerHTML = `${icon(state.activeWorkout ? "check" : "play")} ${text(state.activeWorkout ? "训练中" : "开始训练", state.activeWorkout ? "In Progress" : "Start Workout")}`;
    button.animate([
      { transform: "scale(.97)", filter: "brightness(1.2)" },
      { transform: "scale(1)", filter: "brightness(1)" },
    ], { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" });
    toast(text(state.activeWorkout ? "训练计时已开始" : "训练已完成", state.activeWorkout ? "Workout timer started" : "Workout completed"));
  });
  document.querySelector("[data-save-food]")?.addEventListener("click", () => { persist(); toast(text("餐食记录已保存到本机", "Meal saved locally")); });
  document.querySelector("#food-input")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.foodImage = reader.result;
      render();
      analyzeFood(reader.result);
    };
    reader.readAsDataURL(file);
  });
  document.querySelector("#equipment-search")?.addEventListener("input", e => {
    const query = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".equipment-item").forEach(row => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  });
  document.querySelectorAll("[data-guide-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-guide-tab]").forEach(x => x.classList.toggle("active", x === button));
    document.querySelectorAll("[data-guide-panel]").forEach(panel => { panel.hidden = panel.dataset.guidePanel !== button.dataset.guideTab; });
  }));
  document.querySelectorAll("[data-setting]").forEach(button => button.addEventListener("click", () => {
    state.sheet = `${button.dataset.setting}-settings`;
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  }));
  document.querySelectorAll("[data-setting-value]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.settingKind === "language") state.language = button.dataset.settingValue;
    else state.units = button.dataset.settingValue;
    persist();
    state.sheet = null;
    render();
    toast(text("设置已更新","Settings updated"));
  }));
  bindPlanStart();
}

function bindRoutesAndToasts(root = document) {
  root.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.route)));
  root.querySelectorAll("[data-toast]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); toast(el.dataset.toast); }));
  bindPlanStart(root);
}

function bindPlanStart(root = document) {
  root.querySelectorAll("[data-start-plan]").forEach(button => button.addEventListener("click", () => {
    state.planStarted = !state.planStarted;
    persist();
    button.innerHTML = `${icon(state.planStarted ? "check" : "play")} ${text(state.planStarted ? "计划进行中" : "开始计划", state.planStarted ? "Plan In Progress" : "Start Plan")}`;
    toast(text(state.planStarted ? "计划已开始并保存到本机" : "计划已暂停", state.planStarted ? "Plan started and saved locally" : "Plan paused"));
  }));
}

function animateNumber(node, value) {
  node.animate([
    { opacity: .35, transform: "translateY(5px) scale(.92)" },
    { opacity: 1, transform: "translateY(0) scale(1)" },
  ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
  node.textContent = value;
}

async function analyzeEquipment(image) {
  toast(text("正在通过 Gemini 识别器械…", "Analyzing equipment with Gemini…"));
  try {
    const result = await postImage("/api/analyze-equipment", image);
    Object.assign(state.customEquipmentDraft, {
      name: text(result.nameZh, result.nameEn),
      type: result.type,
      unit: result.unit,
      increment: result.increment,
      confidence: result.confidence,
      usageSteps: result.usageSteps || [],
      commonMistakes: result.commonMistakes || [],
      targetMuscles: result.targetMuscles || [],
    });
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
    toast(text(`识别完成 · ${Math.round(result.confidence * 100)}%`, `Detected · ${Math.round(result.confidence * 100)}%`));
  } catch (error) {
    state.customEquipmentDraft.name = "";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
    toast(error.message);
  }
}

async function analyzeFood(image) {
  toast(text("正在识别食物与份量…", "Analyzing food and portions…"));
  try {
    const result = await postImage("/api/analyze-food", image);
    state.ingredients = result.ingredients;
    persist();
    render();
    toast(text("食物识别完成，请确认份量", "Food recognized. Please confirm portions."));
  } catch (error) {
    toast(error.message);
  }
}

async function postImage(url, image) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.code === "API_KEY_MISSING") {
      throw new Error(text("尚未配置 Gemini API 密钥", "Gemini API key is not configured"));
    }
    throw new Error(data.error || text("识别失败，请重试", "Recognition failed"));
  }
  return data;
}

function closeSheet(afterClose) {
  const layer = document.querySelector(".sheet-layer");
  layer?.classList.remove("open");
  setTimeout(() => {
    state.sheet = null;
    if (afterClose) afterClose();
    else render();
  }, 320);
}

function editIngredient(index) {
  const item = state.ingredients[index];
  const amount = prompt(text(`修改 ${item.name} 的份量`, `Edit ${item.en} amount`), item.amount);
  if (amount === null) return;
  const kcal = prompt(text("修改估算热量", "Edit estimated calories"), item.kcal);
  if (kcal === null) return;
  item.amount = amount.trim() || item.amount;
  item.kcal = Number(kcal) || item.kcal;
  persist(); render();
}

render();
