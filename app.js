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
const debugParams = new URLSearchParams(location.search);
const debugRoute = debugParams.get("route");
const today = new Date();
const localDateValue = date => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const defaultRangeStart = localDateValue(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
const defaultRangeEnd = localDateValue(today);
const state = {
  route: debugRoute || "home",
  routeStack: ["home"],
  language: debugParams.get("lang") || saved.language || "zh",
  units: debugParams.get("units") || saved.units || "metric",
  planPeriod: debugParams.get("planPeriod") || "week",
  setupStep: 1,
  profileMode: "body",
  age: saved.age ?? null,
  height: saved.height ?? null,
  weight: saved.weight ?? null,
  goalWeight: saved.goalWeight ?? null,
  bodyFat: saved.bodyFat ?? null,
  goal: saved.goal || "fat",
  days: saved.days || 4,
  duration: saved.duration || 45,
  avatar: saved.avatar || assets.avatar,
  equipment: new Set(saved.equipment || []),
  customEquipment: (saved.customEquipment || []).map(item => typeof item === "string"
    ? { name: item, en: "Custom", type: "selectorized", unit: "kg", increment: 5 }
    : item),
  activeWorkout: false,
  planStarted: saved.planStarted || false,
  planId: saved.planId || null,
  planDays: Array.isArray(saved.planDays) ? saved.planDays : [],
  editingPlanDay: null,
  dateRange: {
    start: saved.dateRange?.start || defaultRangeStart,
    end: saved.dateRange?.end || defaultRangeEnd,
  },
  workoutLogs: [],
  foodLogs: [],
  completedExercises: new Set(),
  foodImage: null,
  foodAnalysis: null,
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
    equipmentKey: "",
  },
  equipmentGuide: null,
  user: null,
  authMode: "login",
  authBusy: false,
  exerciseFilter: { muscle: "all", equipment: "available", query: "" },
  selectedExercises: new Set(saved.selectedExercises || []),
  exerciseDetail: null,
  cloudReady: false,
  ingredients: saved.ingredients || [],
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
  library: '<path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  cloud: '<path d="M17.5 19H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19.7 11 4 4 0 0 1 17.5 19z"/>',
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
    height: state.height,
    avatar: state.avatar,
    equipment: [...state.equipment],
    customEquipment: state.customEquipment,
    ingredients: state.ingredients,
    planStarted: state.planStarted,
    planId: state.planId,
    planDays: state.planDays,
    dateRange: state.dateRange,
    selectedExercises: [...state.selectedExercises],
  }));
}

function text(zh, en) {
  return state.language === "zh" ? zh : en;
}

function dual(zh, en, tag = "span") {
  return `<${tag}>${text(zh, en)}</${tag}>`;
}

function displayWeight(kg, digits = 1) {
  if (kg === null || kg === undefined || Number.isNaN(Number(kg))) return "--";
  const value = state.units === "metric" ? kg : kg * 2.20462;
  return `${value.toFixed(digits)} ${state.units === "metric" ? "kg" : "lb"}`;
}

function displayHeight(cm) {
  if (cm === null || cm === undefined || Number.isNaN(Number(cm))) return "--";
  if (state.units === "metric") return `${cm} cm`;
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}' ${totalInches % 12}"`;
}

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
      <div><strong>FitPlan AI</strong><small>${text("个人训练系统", "PERSONAL PERFORMANCE")}</small></div>
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
      <span>${text(zh, en)}</span>
    </button>`).join("")}</nav>`;
}

function sectionTitle(zh, en, action = "") {
  return `<div class="section-title"><div>${dual(zh, en, "h2")}</div>${action}</div>`;
}

function metric(iconName, zh, en, value, cls = "") {
  return `<div class="metric ${cls}">${icon(iconName)}<div><span>${text(zh, en)}</span></div><strong>${value}</strong></div>`;
}

function home() {
  const planDays = ensurePlanDays();
  const todayPlan = planDays[0];
  const todayExercises = (todayPlan?.exerciseIds || []).map(id => exerciseLibrary.find(item => item.id === id)).filter(Boolean);
  const completedWorkouts = state.workoutLogs.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayFoods = state.foodLogs.filter(item => String(item.eaten_at || "").slice(0, 10) === todayKey);
  const todayCalories = todayFoods.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const userName = state.user?.name || text("用户", "User");
  return `<section class="screen home-screen">
    ${statusBar()}${header()}
    <section class="welcome-line">
      <div class="identity"><img src="${state.avatar}" alt="${escapeHtml(userName)}"><div><h1>${text(`你好，${userName}`, `Hi, ${userName}`)}</h1><p>${text("今天专注完成一次高质量训练", "Focus on one quality session today")}</p></div></div>
      <button data-route="progress"><b>${completedWorkouts}</b><span>${text("次训练", "WORKOUTS")}</span>${icon("arrow")}</button>
    </section>
    <div class="performance-line"><span>${new Intl.DateTimeFormat(state.language === "zh" ? "zh-CN" : "en-US", { month:"short", day:"numeric", weekday:"short" }).format(new Date())}</span><span>${goalLabel()}</span></div>

    <section class="workout-section">
      ${sectionTitle("今日训练", "Today's Workout", `<span class="technical">${state.equipment.size} ${text("件器械", "EQUIPMENT")}</span>`)}
      ${todayExercises.length ? `<article class="workout-hero">
        <div class="workout-photo">
          <img src="${todayExercises[0].image}" alt="">
          <span class="photo-index">${text("今日计划", "TODAY")}</span>
          <span class="photo-corner"></span>
        </div>
        <div class="hero-content">
          <span class="eyebrow">${icon("target")} ${todayExercises.length} ${text("个动作", "EXERCISES")}</span>
          <h3>${todayExercises.slice(0,2).map(item => text(item.zh,item.en)).join(" + ")}</h3>
          <div class="workout-meta"><span>${icon("clock")} ${todayPlan.duration} ${text("分钟", "MIN")}</span><span>${icon("activity")} ${goalLabel()}</span></div>
          <button class="start-btn" data-plan-day-workout="0">${icon("play")}<span>${text("开始训练", "Start Workout")}</span>${icon("arrow")}</button>
        </div>
      </article>` : `<div class="home-empty"><span>${icon("calendar")}</span><div><b>${text("还没有今日训练", "No workout planned")}</b><p>${text("设置器械并选择动作后生成你的计划。", "Set equipment and choose exercises to build your plan.")}</p></div><button data-route="equipment">${text("开始设置", "Set Up")} ${icon("arrow")}</button></div>`}
    </section>

    <section class="performance-strip">
      <div class="progress-arc"><div><b>${completedWorkouts}</b><small>${text("累计训练", "TOTAL")}</small></div></div>
      <div class="performance-metrics">
        ${metric("check", "训练完成", "Workouts", completedWorkouts)}
        ${metric("flame", "累计消耗", "Calories", state.workoutLogs.reduce((sum, item) => sum + Number(item.calories || 0), 0))}
        ${metric("activity", "计划动作", "Exercises", state.selectedExercises.size)}
      </div>
    </section>

    <section class="nutrition-section">
      ${sectionTitle("今日营养", "Today's Nutrition", `<button class="text-action" data-route="food">${icon("scan")} ${text("识别食物", "Scan Food")}</button>`)}
      ${todayFoods.length ? `<article class="nutrition-panel"><img src="${todayFoods[0].image_url || assets.mealThumb}" alt=""><div class="nutrition-content"><div class="calorie-line"><div><span>${text("今日摄入", "Today")}</span><strong>${todayCalories}</strong><small>kcal</small></div><span class="goal">${todayFoods.length} ${text("餐", "meals")}</span></div></div></article>` : `<div class="home-empty compact"><span>${icon("scan")}</span><div><b>${text("今天还没有饮食记录", "No meals logged today")}</b><p>${text("拍照识别食物，也可以跳过不记录。", "Scan a meal when needed, or simply skip it.")}</p></div><button data-route="food">${text("拍照识别", "Scan")} ${icon("arrow")}</button></div>`}
    </section>

    <section class="quick-section">
      ${sectionTitle("快捷入口", "Quick Access")}
      <div class="quick-grid">
        ${quick("profile-edit", "target", "身体数据", "Body Data", "01")}
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
  return `<button class="quick" data-route="${route}"><span class="quick-number">${number}</span>${icon(glyph)}<span>${text(zh, en)}</span>${icon("arrow", "quick-arrow")}</button>`;
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
  return `${statusBar()}<header class="inner-top"><button class="utility-btn" data-back-route="${back}">${icon("back")}</button>${dual(zh, en, "h1")}<button class="utility-btn" data-toast="${text("更多功能", "More options")}">${icon("more")}</button></header>`;
}

function plan() {
  return `<section class="screen">${innerTop("训练计划", "Training Plan")}
    <button class="plan-builder-entry" data-route="exercise-library">${icon("library")}<span>${dual("自主选择训练动作","Build Your Own Workout","b")}<em>${text("根据已有器械筛选并组合动作","Filter and combine exercises by equipment")}</em></span><strong>${state.selectedExercises.size}</strong>${icon("arrow")}</button>
    <div class="segmented"><button data-plan-period="week" class="${state.planPeriod === "week" ? "active" : ""}">${text("周计划", "Weekly")}</button><button data-plan-period="month" class="${state.planPeriod === "month" ? "active" : ""}">${text("月计划", "Monthly")}</button></div>
    <div class="plan-body">${planBody()}</div>${nav()}
  </section>`;
}

function planBody() {
  const planDays = ensurePlanDays();
  if (!planDays.length) {
    return `<section class="empty-state plan-empty">${icon("calendar")}<b>${text("还没有训练计划", "No training plan yet")}</b><p>${text("先选择你拥有的器械和想练的动作，再生成专属计划。", "Choose your equipment and exercises first, then generate a personalized plan.")}</p><button class="primary-btn" data-route="equipment">${text("从器械设置开始", "Start with Equipment")} ${icon("arrow")}</button></section>`;
  }
  if (state.planPeriod === "month") {
    const sessionCount = planDays.length * 4;
    const totalMinutes = planDays.reduce((sum, item) => sum + item.duration, 0) * 4;
    return `<section class="plan-overview">
      <div><small>${text("本月目标", "MONTHLY GOAL")}</small><strong>${goalLabel()}</strong></div>
      <div><small>${text("训练安排", "SESSIONS")}</small><strong>${sessionCount} <em>${text("次", "sessions")}</em></strong></div>
      <div><small>${text("预计时长", "DURATION")}</small><strong>${totalMinutes} <em>min</em></strong></div>
    </section>
    <div class="month-plan">${monthlyPlan.map(item => `<article>
      <div class="month-week"><small>${text("第", "WEEK")}</small><b>0${item.week}</b></div>
      <div class="month-copy">${dual(item.titleZh,item.titleEn,"h3")}<p>${planDays.length} ${text("次训练","sessions")} · ${planDays.reduce((sum, day) => sum + day.duration, 0)} min</p><div class="month-load"><i style="width:${item.load}%"></i></div></div>
      <strong>${item.load}%<small>${text("负荷","LOAD")}</small></strong>
    </article>`).join("")}</div>
    <button class="primary-btn" data-start-plan>${icon(state.planStarted?"check":"calendar")} ${text(state.planStarted?"本月计划进行中":"启用本月计划",state.planStarted?"Month In Progress":"Activate Month")}</button>`;
  }
  const totalMinutes = planDays.reduce((sum, item) => sum + item.duration, 0);
  return `<section class="plan-overview">
    <div><small>${text("本周目标", "WEEKLY GOAL")}</small><strong>${goalLabel()}</strong></div>
    <div><small>${text("训练安排", "SESSIONS")}</small><strong>${planDays.length} <em>${text("次", "sessions")}</em></strong></div>
    <div><small>${text("预计时长", "DURATION")}</small><strong>${totalMinutes} <em>min</em></strong></div>
  </section>
  <div class="schedule">${planDays.map((item, index) => {
    const exercises = item.exerciseIds.map(id => exerciseLibrary.find(exercise => exercise.id === id)).filter(Boolean);
    const first = exercises[0];
    const title = exercises.length ? exercises.map(exercise => text(exercise.zh, exercise.en)).slice(0, 2).join(" + ") : text("恢复训练", "Recovery");
    const focus = [...new Set(exercises.map(exercise => text(muscleLabels[exercise.muscle]?.[0] || exercise.muscle, muscleLabels[exercise.muscle]?.[1] || exercise.muscle)))].join(" · ");
    return `<article class="schedule-row">
      <span class="schedule-day"><b>${text(item.dayZh,item.dayEn)}</b></span>
      <img src="${first?.image || assets.workoutThumb}" alt="">
      <button class="schedule-copy" data-plan-day-workout="${index}"><b>${title}</b><em>${item.duration} min · ${focus || text("恢复", "Recovery")}</em></button>
      <button class="schedule-edit" data-edit-plan-day="${index}" aria-label="${text("编辑当天计划","Edit day")}">${icon("edit")}</button>
    </article>`;
  }).join("")}</div>
  <button class="primary-btn" data-start-plan>${icon(state.planStarted?"check":"play")} ${text(state.planStarted?"本周计划进行中":"开始本周计划",state.planStarted?"Week In Progress":"Start This Week")}</button>`;
}

function goalLabel() {
  const labels = { fat: ["减脂", "Fat Loss"], muscle: ["增肌", "Muscle Gain"], health: ["保持健康", "Maintain Health"], recomp: ["塑形", "Recomposition"], fitness: ["提升体能", "Improve Fitness"] };
  return text(...(labels[state.goal] || labels.fat));
}

function ensurePlanDays(force = false) {
  const validIds = [...state.selectedExercises].filter(id => exerciseLibrary.some(item => item.id === id));
  if (!validIds.length) {
    if (force) state.planDays = [];
    return state.planDays;
  }
  if (!force && state.planDays.length && state.planDays.some(day => day.exerciseIds?.length)) return state.planDays;
  const dayLabels = [["周一","Mon"],["周二","Tue"],["周三","Wed"],["周四","Thu"],["周五","Fri"],["周六","Sat"],["周日","Sun"]];
  const count = Math.max(1, Math.min(7, state.days || 4));
  const days = Array.from({ length: count }, (_, index) => ({
    dayZh: dayLabels[index][0],
    dayEn: dayLabels[index][1],
    duration: state.duration || 45,
    exerciseIds: [],
  }));
  validIds.forEach((id, index) => days[index % days.length].exerciseIds.push(id));
  state.planDays = days;
  persist();
  return state.planDays;
}

function logScreen() {
  const actions = [
    ["food", "scan", "食物识别", "Food Scan", "AI"],
    ["progress", "dumbbell", "训练记录", "Workout Log", state.workoutLogs.length],
    ["profile-edit", "weight", "身体数据", "Body Data", state.weight ? displayWeight(state.weight) : "--"],
    ["", "activity", "饮水记录", "Water Log", "--"],
  ];
  const activities = [
    ...state.workoutLogs.map(item => ({ time: item.started_at, title: text("训练", "Workout"), value: `${item.duration_minutes || 0} min`, icon: "dumbbell" })),
    ...state.foodLogs.map(item => ({ time: item.eaten_at, title: text(item.meal_name_zh || "饮食", item.meal_name_en || "Meal"), value: `${item.calories || 0} kcal`, icon: "scan" })),
  ].sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 20);
  return `<section class="screen">${statusBar()}${sectionTitle("记录", "Daily Log")}
    <div class="log-grid">${actions.map(([route, glyph, zh, en, value]) => `<button class="log-tile" ${route ? `data-route="${route}"` : `data-toast="${text(`${zh}已更新`, `${en} updated`)}"`}><span>${value}</span>${icon(glyph)}${dual(zh, en, "b")}${icon("arrow")}</button>`).join("")}</div>
    <section class="timeline">${sectionTitle("历史记录", "History")}
      ${activities.length ? activities.map(item => `<div class="timeline-row"><time>${new Intl.DateTimeFormat(state.language === "zh" ? "zh-CN" : "en-US", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(item.time))}</time><span></span><div><b>${item.title}</b><em>${item.value}</em></div>${icon(item.icon)}</div>`).join("") : `<div class="empty-inline">${text("还没有训练或饮食记录", "No workout or meal records yet")}</div>`}
    </section>${nav()}</section>`;
}

function progress() {
  return `<section class="screen">${innerTop("训练进度", "Progress")}
    <section class="range-picker">
      <div class="range-shortcuts">${[["week","近一周","7 Days"],["month","近一月","30 Days"],["year","近一年","1 Year"]].map(([key,zh,en]) => `<button data-range-shortcut="${key}">${text(zh,en)}</button>`).join("")}</div>
      <div class="range-inputs"><label><span>${text("开始日期","From")}</span><input type="date" data-range-start value="${state.dateRange.start}"></label><i>—</i><label><span>${text("结束日期","To")}</span><input type="date" data-range-end value="${state.dateRange.end}"></label></div>
    </section>
    <div class="progress-body">${progressBody()}</div>${nav()}
  </section>`;
}

function progressBody() {
  const start = new Date(`${state.dateRange.start}T00:00:00`);
  const end = new Date(`${state.dateRange.end}T23:59:59`);
  const workouts = state.workoutLogs.filter(item => {
    const date = new Date(item.started_at);
    return date >= start && date <= end;
  });
  const sessions = workouts.length;
  const minutes = workouts.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
  const calories = workouts.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const completedExercises = workouts.reduce((sum, item) => sum + (Array.isArray(item.exercises) ? item.exercises.filter(exercise => exercise.completed !== false).length : 0), 0);
  const daySpan = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  const adherence = state.planDays.length ? Math.min(100, Math.round(sessions / Math.max(1, state.planDays.length * daySpan / 7) * 100)) : 0;
  return `<section class="progress-kpis">
    <div><small>${text("完成训练","WORKOUTS")}</small><strong>${sessions}</strong></div>
    <div><small>${text("训练时长","DURATION")}</small><strong>${minutes} <em>min</em></strong></div>
    <div><small>${text("消耗热量","CALORIES")}</small><strong>${calories} <em>kcal</em></strong></div>
  </section>
  ${sessions ? `<div class="data-grid"><article class="data-panel"><small>${text("完成动作","EXERCISES")}</small><strong class="data-value">${completedExercises}</strong><p>${text("所选日期范围内", "in selected range")}</p></article><article class="data-panel"><small>${text("计划完成率","ADHERENCE")}</small><strong class="score">${adherence}</strong><p>/100</p></article></div>
  <section class="range-workouts">${workouts.map(item => `<article><span>${icon("check")}</span><div><b>${new Intl.DateTimeFormat(state.language === "zh" ? "zh-CN" : "en-US", { month:"short", day:"numeric" }).format(new Date(item.started_at))}</b><small>${item.duration_minutes || 0} min · ${item.calories || 0} kcal</small></div></article>`).join("")}</section>` : `<div class="empty-state progress-empty">${icon("chart")}<b>${text("这个日期范围还没有训练数据", "No workouts in this date range")}</b><p>${text("完成训练后，记录会自动出现在这里。", "Completed workouts will appear here automatically.")}</p></div>`}`;
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
  const normalized = value ?? 0;
  const shown = ["weight","goalWeight"].includes(key) && state.units === "imperial" ? (normalized * 2.20462).toFixed(1) : normalized;
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
  ["拉力器","Cable Machine"],["引体向上架","Pull-up Bar"],["壶铃","Kettlebell"],["史密斯机","Smith Machine"],
  ["腿举机","Leg Press"],
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
  const equipmentKey = equipmentKeyMap[guide.name];
  const demo = exerciseLibrary.find(item => item.equipment === equipmentKey)
    || exerciseLibrary.find(item => availableEquipmentKeys().has(item.equipment))
    || exerciseLibrary[0];
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet>
    <section class="bottom-sheet guide-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <header class="sheet-header"><div>${dual(guide.name, guide.en, "h2")}<p>${text("器械使用教学 · 真人动作演示","Equipment tutorial · real movement demo")}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
      <div class="equipment-video-demo">
        <video src="${demo.videoUrl}" poster="${demo.image}" muted loop autoplay playsinline controls preload="metadata"></video>
        <span>${text("示例动作","EXAMPLE")} · ${state.language === "zh" ? demo.zh : demo.en}</span>
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
  return `<section class="screen workout-screen">${innerTop("训练详情","Workout Detail")}
    <article class="detail-hero"><img src="${assets.workoutBanner}" alt="Back strength workout"><div class="photo-shade"></div><div>${dual("背部力量训练","Back Strength","h1")}<span>HYPERTROPHY · INTERMEDIATE</span></div></article>
    <section class="detail-metrics">${metric("clock","训练时长","Duration","45 min")}${metric("flame","预计消耗","Est. Calories","620")}${metric("activity","训练难度","Difficulty",text("中级","Medium"))}</section>
    <section class="exercise-list">${sectionTitle("训练动作","Exercises",`<span>${state.completedExercises.size}/${exercises.length}</span>`)}
      ${exercises.map((e,i) => `<button class="exercise ${state.completedExercises.has(i)?"done":""}" data-exercise="${i}"><span class="exercise-index">${state.completedExercises.has(i)?icon("check"):i+1}</span><img src="${e[4]}" alt="${e[1]}"><span class="exercise-name">${dual(e[0],e[1],"b")}<em>${e[2]}</em></span><span class="rest">${text("休息","REST")}<b>${e[3]}</b></span>${icon("more")}</button>`).join("")}</section>
    <div class="sticky-actions"><button class="secondary-btn" data-toast="${text("已为你匹配替代动作","Alternatives matched")}">${icon("refresh")} ${text("替代动作","Alternatives")}</button><button class="primary-btn" data-start-workout>${icon(state.activeWorkout?"check":"play")} ${text(state.activeWorkout?"训练中":"开始训练",state.activeWorkout?"In Progress":"Start Workout")}</button></div>
  </section>`;
}

function food() {
  const image = state.foodImage;
  const total = state.ingredients.reduce((sum, item) => sum + Number(item.kcal), 0);
  return `<section class="screen food-screen">${innerTop("食物识别","Food Recognition")}
    <label class="food-camera ${image ? "has-image" : "empty"}">${image ? `<img src="${image}" alt="">` : `<span class="food-camera-empty">${icon("camera")}<b>${text("拍摄今天吃的食物", "Photograph Your Meal")}</b><small>${text("识别后可以手动修改食材、份量和热量", "Edit ingredients, portions and calories after recognition")}</small></span>`}<span class="scan-corners"></span><span class="camera-command">${icon("camera")} ${text("拍照或选择图片","Take or choose photo")}</span><input id="food-input" type="file" accept="image/*" capture="environment"></label>
    ${state.ingredients.length ? `<div class="recognition-head">${sectionTitle("AI 识别结果","AI Recognition Result")}<span class="confidence">${Math.round((state.foodAnalysis?.confidence || 0) * 100)}%</span></div>
    <section class="food-summary"><div><h2>${text(state.foodAnalysis?.dishNameZh || "已识别餐食", state.foodAnalysis?.dishNameEn || "Recognized Meal")}</h2><small>${text("估算总热量","ESTIMATED CALORIES")}</small></div><strong>${total}<em> kcal</em></strong></section>
    <section class="ingredient-list">${sectionTitle("食材分析","Ingredients",`<button class="text-action" data-edit-all>${icon("edit")} ${text("编辑","Edit")}</button>`)}
      ${state.ingredients.map((x,i) => `<button data-ingredient="${i}"><span class="ingredient-index">0${i+1}</span><span>${dual(x.name,x.en,"b")}</span><em>${x.amount}</em><strong>${x.kcal} kcal</strong>${icon("edit")}</button>`).join("")}
    </section>
    <div class="sticky-actions"><label class="secondary-btn retry-photo">${icon("refresh")} ${text("重新拍摄","Retry")}<input id="food-retry-input" type="file" accept="image/*" capture="environment" hidden></label><button class="primary-btn" data-save-food>${icon("check")} ${text("保存记录","Save Log")}</button></div>` : `<div class="food-empty-note">${icon("activity")}<p>${text("饮食记录可以跳过，不会影响训练计划使用。", "Meal logging is optional and does not block your training plan.")}</p></div>`}
  </section>`;
}

const exerciseLibrary = window.FITPLAN_EXERCISES || [];
const validExerciseIds = new Set(exerciseLibrary.map(item => item.id));
state.selectedExercises = new Set([...state.selectedExercises].filter(id => validExerciseIds.has(id)));
if (debugParams.get("exercise")) {
  state.exerciseDetail = exerciseLibrary.find(item => item.id === debugParams.get("exercise")) || null;
  if (state.exerciseDetail) state.sheet = "exercise-detail";
}
const muscleLabels = {
  all: ["全部", "All"],
  chest: ["胸部", "Chest"],
  back: ["背部", "Back"],
  shoulders: ["肩部", "Shoulders"],
  legs: ["腿部", "Legs"],
  glutes: ["臀部", "Glutes"],
  core: ["核心", "Core"],
  cardio: ["有氧", "Cardio"],
};

const equipmentKeyMap = {
  "哑铃": "dumbbell",
  "杠铃": "barbell",
  "卧推凳": "bench",
  "跑步机": "treadmill",
  "拉力器": "cable",
  "弹力带": "bands",
  "引体向上架": "pull-up-bar",
  "壶铃": "kettlebell",
  "史密斯机": "smith-machine",
  "腿举机": "leg-press",
};

function availableEquipmentKeys() {
  const keys = new Set(["bodyweight"]);
  state.equipment.forEach(name => {
    const key = equipmentKeyMap[name];
    if (key) keys.add(key);
    const custom = state.customEquipment.find(item => item.name === name);
    if (custom?.equipmentKey) keys.add(custom.equipmentKey);
  });
  return keys;
}

function inferEquipmentKey(...values) {
  const source = values.filter(Boolean).join(" ").toLowerCase();
  const rules = [
    ["smith-machine", ["史密斯", "smith"]],
    ["pull-up-bar", ["引体", "pull-up", "pull up"]],
    ["leg-press", ["腿举", "leg press"]],
    ["treadmill", ["跑步", "treadmill"]],
    ["kettlebell", ["壶铃", "kettlebell"]],
    ["dumbbell", ["哑铃", "dumbbell"]],
    ["barbell", ["杠铃", "barbell"]],
    ["bench", ["卧推凳", "训练凳", "bench"]],
    ["cable", ["拉力器", "绳索", "龙门架", "cable", "pulldown"]],
    ["bands", ["弹力带", "resistance band"]],
    ["bodyweight", ["自重", "bodyweight"]],
  ];
  return rules.find(([, words]) => words.some(word => source.includes(word)))?.[0] || "other";
}

function filteredExercises() {
  const query = state.exerciseFilter.query.trim().toLowerCase();
  const equipment = availableEquipmentKeys();
  return exerciseLibrary.filter(item => {
    const muscleMatch = state.exerciseFilter.muscle === "all" || item.muscle === state.exerciseFilter.muscle;
    const equipmentMatch = state.exerciseFilter.equipment !== "available" || equipment.has(item.equipment);
    const queryMatch = !query || `${item.zh} ${item.en}`.toLowerCase().includes(query);
    return muscleMatch && equipmentMatch && queryMatch;
  });
}

function exerciseLibraryScreen() {
  const items = filteredExercises();
  const selected = exerciseLibrary.filter(item => state.selectedExercises.has(item.id));
  const muscleCount = new Set(selected.map(item => item.muscle)).size;
  const estimatedMinutes = selected.length ? selected.length * 8 : 0;
  return `<section class="screen exercise-library-screen">${innerTop("动作库", "Exercise Library")}
    <header class="library-heading">
      <span class="library-kicker">${text("自主训练编排", "CUSTOM WORKOUT")}</span>
      <h2>${text("选择今天要练的动作", "Choose Today's Exercises")}</h2>
      <p>${text("根据已有器械筛选动作，查看讲解后加入训练计划。", "Filter by your equipment, review technique, then add exercises to your plan.")}</p>
    </header>
    <div class="builder-steps" aria-label="${text("训练计划创建流程", "Workout builder progress")}">
      <button class="complete" data-route="equipment"><span>${icon("check")}</span><b>${text("器械", "Equipment")}</b><small>${state.equipment.size} ${text("件", "items")}</small></button>
      <div class="step-line active"></div>
      <button class="active"><span>2</span><b>${text("动作", "Exercises")}</b><small>${text("正在选择", "Selecting")}</small></button>
      <div class="step-line"></div>
      <button><span>3</span><b>${text("计划", "Plan")}</b><small>${text("待生成", "Next")}</small></button>
    </div>
    <section class="library-summary">
      <div class="summary-main"><span>${icon("library")}</span><div><small>${text("当前训练", "CURRENT WORKOUT")}</small><b><strong data-selected-count>${selected.length}</strong> ${text("个动作", "exercises")}</b></div></div>
      <dl>
        <div><dt>${text("预计", "TIME")}</dt><dd data-estimated-time>${estimatedMinutes || "--"}${estimatedMinutes ? text(" 分钟", " min") : ""}</dd></div>
        <div><dt>${text("肌群", "MUSCLES")}</dt><dd data-muscle-count>${muscleCount || "--"}</dd></div>
      </dl>
    </section>
    <div class="library-controls">
      <label class="search-box library-search">${icon("search")}<input id="exercise-search" value="${escapeHtml(state.exerciseFilter.query)}" placeholder="${text("搜索动作名称", "Search exercises")}"></label>
      <div class="muscle-tabs">${Object.entries(muscleLabels).map(([key, labels]) => `<button data-muscle="${key}" class="${state.exerciseFilter.muscle === key ? "active" : ""}">${text(labels[0], labels[1])}</button>`).join("")}</div>
      <div class="availability-row">
        <button class="availability-toggle ${state.exerciseFilter.equipment === "available" ? "active" : ""}" data-availability>
          <i>${state.exerciseFilter.equipment === "available" ? icon("check") : ""}</i><span>${dual("仅看现有器械可做", "Available Equipment Only", "b")}</span>
        </button>
        <button class="equipment-edit" data-route="equipment">${text("管理器械", "Edit")} ${icon("arrow")}</button>
      </div>
    </div>
    <div class="selected-exercise-strip" data-selected-strip>${selectedExerciseStrip(selected)}</div>
    <div class="catalog-heading"><b>${text("动作列表", "Exercises")}</b><span data-result-count>${items.length} ${text("个结果", "results")}</span></div>
    <div class="exercise-catalog">${items.length ? items.map(exerciseCard).join("") : `<div class="empty-state">${icon("filter")}<b>${text("没有匹配动作", "No matching exercises")}</b><p>${text("切换肌群或关闭器械限制。", "Change the muscle group or equipment filter.")}</p></div>`}</div>
    <div class="library-actions">
      <button class="secondary-btn" data-generate-from-equipment>${icon("refresh")}<span>${dual("按器械智能选择", "Smart Select", "b")}</span></button>
      <button class="primary-btn" data-use-selection><span>${dual(`加入训练计划 · ${selected.length}`, `Add to Plan · ${selected.length}`, "b")}</span>${icon("arrow")}</button>
    </div>
  </section>`;
}

function selectedExerciseStrip(items) {
  if (!items.length) return `<span class="selection-empty">${text("还没有选择动作", "No exercises selected yet")}</span>`;
  return items.slice(0, 5).map(item => `<button data-exercise-detail="${item.id}"><img src="${item.image}" alt=""><span>${text(item.zh, item.en)}</span></button>`).join("") +
    (items.length > 5 ? `<span class="selection-more">+${items.length - 5}</span>` : "");
}

function exerciseCard(item) {
  const selected = state.selectedExercises.has(item.id);
  const available = availableEquipmentKeys().has(item.equipment);
  return `<article class="catalog-card ${selected ? "selected" : ""}">
    <button class="catalog-preview" data-exercise-detail="${item.id}">
      <img src="${item.image}" alt="${item.en}">
      <span class="media-badge">${icon("play")} ${text("讲解", "Guide")}</span>
    </button>
    <div class="catalog-copy">
      ${dual(item.zh, item.en, "h3")}
      <div class="exercise-tags"><span>${text(muscleLabels[item.muscle]?.[0] || item.muscle, muscleLabels[item.muscle]?.[1] || item.muscle)}</span><span>${equipmentLabel(item.equipment)}</span><span>${item.difficulty.toUpperCase()}</span></div>
      <p>${item.sets} · ${text("含视频与循环动作讲解", "Video and motion guide included")}</p>
      <button data-exercise-detail="${item.id}">${text("查看动作讲解", "View Technique")} ${icon("arrow")}</button>
    </div>
    <button class="exercise-add ${selected ? "active" : ""}" data-toggle-exercise="${item.id}" aria-label="${text("选择动作", "Select exercise")}">
      ${selected ? icon("check") : icon("plus")}
    </button>
    ${available ? "" : `<span class="unavailable">${text("缺少器械", "Equipment missing")}</span>`}
  </article>`;
}

function equipmentLabel(key) {
  const labels = {
    dumbbell: ["哑铃", "Dumbbell"], barbell: ["杠铃", "Barbell"], cable: ["拉力器", "Cable"],
    bodyweight: ["自重", "Bodyweight"], treadmill: ["跑步机", "Treadmill"],
    kettlebell: ["壶铃", "Kettlebell"], "smith-machine": ["史密斯机", "Smith Machine"],
    "pull-up-bar": ["引体向上架", "Pull-up Bar"], "leg-press": ["腿举机", "Leg Press"]
  };
  const label = labels[key] || [key, key];
  return text(label[0], label[1]);
}

function exerciseDetailSheet() {
  if (state.sheet !== "exercise-detail" || !state.exerciseDetail) return "";
  const item = state.exerciseDetail;
  const selected = state.selectedExercises.has(item.id);
  const steps = state.language === "zh" ? item.stepsZh : item.stepsEn;
  const mistakes = state.language === "zh" ? item.mistakesZh : item.mistakesEn;
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet>
    <section class="bottom-sheet exercise-detail-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <header class="sheet-header"><div>${dual(item.zh, item.en, "h2")}<p>${equipmentLabel(item.equipment)} · ${item.sets} · ${item.rest}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
      <div class="lesson-media">
        <video src="${item.videoUrl}" poster="${item.image}" controls playsinline webkit-playsinline preload="metadata"></video>
        <span class="lesson-kicker">01 · ${text("动作讲解", "TECHNIQUE LESSON")}</span>
      </div>
      <div class="lesson-intro"><b>${text("真人动作示范", "Real Movement Demo")}</b><small>${text("先完整看一遍，再关注起始位、发力轨迹和回程控制。", "Watch once, then review setup, drive and the controlled return.")}</small></div>
      <section class="motion-module">
        <div class="module-number">02</div>
        <div>${dual("循环动作演示", "Looping Motion", "h3")}<p>${text("静音循环播放，训练时可快速确认动作轨迹。", "Muted loop for a quick technique check during training.")}</p></div>
        <div class="real-motion-loop"><video src="${item.videoUrl}" poster="${item.image}" muted loop autoplay playsinline webkit-playsinline preload="metadata"></video><span>LOOP · REAL MOTION</span></div>
      </section>
      <div class="technique-columns">
        <section><b>${text("动作步骤", "Technique")}</b><ol>${steps.map(step => `<li>${step}</li>`).join("")}</ol></section>
        <section><b>${text("常见错误", "Avoid")}</b><ul>${mistakes.map(step => `<li>${step}</li>`).join("")}</ul></section>
      </div>
      <p class="media-credit">${text("动作媒体", "Exercise media")}: ${escapeHtml(item.author)} · ${item.license} · wger</p>
      <button class="primary-btn" data-toggle-exercise="${item.id}">${icon(selected ? "check" : "plus")} ${text(selected ? "已加入当前训练" : "加入当前训练", selected ? "Added to Workout" : "Add to Workout")}</button>
    </section>
  </div>`;
}

function workoutV2() {
  const chosen = exerciseLibrary.filter(item => state.selectedExercises.has(item.id));
  return `<section class="screen workout-screen">${innerTop("训练详情","Workout Detail")}
    <article class="detail-hero"><img src="${assets.workoutBanner}" alt=""><div class="photo-shade"></div><div>${dual("自定义力量训练","Custom Strength","h1")}<span>${text(`${chosen.length} 个动作 · 已适配器械`, `${chosen.length} EXERCISES · EQUIPMENT ADAPTED`)}</span></div></article>
    <div class="workout-toolbar"><button data-route="exercise-library">${icon("library")}<span>${dual("选择动作","Choose Exercises","b")}</span>${icon("arrow")}</button><button data-generate-from-equipment>${icon("refresh")}<span>${dual("按器械重排","Adapt to Equipment","b")}</span>${icon("arrow")}</button></div>
    <section class="detail-metrics">${metric("clock","训练时长","Duration",`${Math.max(25, chosen.length * 8)} min`)}${metric("flame","预计消耗","Est. Calories",String(chosen.length * 75))}${metric("activity","动作数量","Exercises",String(chosen.length))}</section>
    <section class="exercise-list">${sectionTitle("训练动作","Exercises",`<span>${state.completedExercises.size}/${chosen.length}</span>`)}
      ${chosen.map((item, i) => `<div class="exercise ${state.completedExercises.has(item.id) ? "done" : ""}">
        <button class="exercise-check" data-complete-exercise="${item.id}"><span class="exercise-index">${state.completedExercises.has(item.id) ? icon("check") : i + 1}</span></button>
        <button class="exercise-open" data-exercise-detail="${item.id}"><img src="${item.image}" alt="${item.en}"><span class="exercise-name">${dual(item.zh,item.en,"b")}<em>${item.sets}</em></span><span class="rest">${text("休息","REST")}<b>${item.rest}</b></span>${icon("arrow")}</button>
      </div>`).join("") || `<div class="empty-state">${icon("library")}<b>${text("还没有选择动作","No exercises selected")}</b><button data-route="exercise-library">${text("打开动作库","Open Library")}</button></div>`}
    </section>
    <div class="sticky-actions"><button class="secondary-btn" data-route="exercise-library">${icon("plus")} ${text("编辑动作","Edit")}</button><button class="primary-btn" data-start-workout>${icon(state.activeWorkout?"check":"play")} ${text(state.activeWorkout?"结束并保存":"开始训练",state.activeWorkout?"Finish & Save":"Start Workout")}</button></div>
  </section>`;
}

function profileV2() {
  return `<section class="screen">${statusBar()}${sectionTitle("我的", "Profile", `<span class="cloud-state">${icon("cloud")} ${text("已同步","SYNCED")}</span>`)}
    <section class="profile-panel"><div class="profile-main"><img src="${state.avatar}" alt="${escapeHtml(state.user.name)}"><div><h1>${text(`你好，${state.user.name}`, `Hi, ${state.user.name}`)}</h1><p>${escapeHtml(state.user.email)}</p></div><button class="utility-btn" data-route="profile-edit">${icon("edit")}</button></div><div class="profile-stats"><div><small>${text("当前目标","GOAL")}</small><b class="green">${goalLabel()}</b></div><div><small>${text("训练天数","DAYS")}</small><b>${state.days} / ${text("周","WEEK")}</b></div><div><small>${text("身体数据","BODY DATA")}</small><b>${state.weight ? displayWeight(state.weight) : text("待填写","EMPTY")}</b></div></div></section>
    <section class="settings-list">
      <button data-setting="language">${icon("sliders")}<span>${dual("语言","Language","b")}</span><em>${state.language === "zh" ? "简体中文" : "English"}</em>${icon("arrow")}</button>
      <button data-setting="units">${icon("activity")}<span>${dual("单位","Units","b")}</span><em>${state.units === "metric" ? "kg, cm" : "lb, ft"}</em>${icon("arrow")}</button>
      <button data-route="exercise-library">${icon("library")}<span>${dual("我的动作","My Exercises","b")}</span><em>${state.selectedExercises.size}</em>${icon("arrow")}</button>
    </section>
    <button class="equipment-summary" data-route="equipment"><div>${icon("dumbbell")}<span>${dual("我的器械","My Equipment","b")}<em>${state.equipment.size} ${text("件已添加","items")}</em></span></div>${icon("arrow")}</button>
    <button class="logout" data-logout>${icon("logout")} ${text("退出登录","Sign Out")}</button>${nav()}
  </section>`;
}

function profileEditScreen() {
  const metric = state.units === "metric";
  const heightValue = state.height == null ? "" : (metric ? state.height : (state.height / 2.54).toFixed(1));
  const weightValue = state.weight == null ? "" : (metric ? state.weight : (state.weight * 2.20462).toFixed(1));
  const goalWeightValue = state.goalWeight == null ? "" : (metric ? state.goalWeight : (state.goalWeight * 2.20462).toFixed(1));
  return `<section class="screen profile-edit-screen">${innerTop("编辑个人信息", "Edit Profile", "profile")}
    <form id="profile-form">
      <label class="avatar-editor"><img src="${state.avatar}" alt=""><span>${icon("camera")} ${text("更换头像", "Change Photo")}</span><input id="avatar-input" type="file" accept="image/*" hidden></label>
      <section class="profile-form-section">
        <h2>${text("账号信息", "Account")}</h2>
        <label><span>${text("姓名", "Name")}</span><input name="name" value="${escapeHtml(state.user.name)}" required></label>
        <label><span>${text("邮箱", "Email")}</span><input value="${escapeHtml(state.user.email)}" disabled></label>
      </section>
      <section class="profile-form-section">
        <h2>${text("身体数据", "Body Data")}</h2>
        <div class="profile-form-grid">
          <label><span>${text("年龄", "Age")}</span><input name="age" type="number" min="13" max="100" value="${state.age ?? ""}" placeholder="--"></label>
          <label><span>${text("身高", "Height")} (${metric ? "cm" : "in"})</span><input name="height" type="number" min="${metric ? 120 : 47}" max="${metric ? 230 : 91}" step="0.1" value="${heightValue}" placeholder="--"></label>
          <label><span>${text("体重", "Weight")} (${metric ? "kg" : "lb"})</span><input name="weight" type="number" min="${metric ? 30 : 66}" max="${metric ? 300 : 660}" step="0.1" value="${weightValue}" placeholder="--"></label>
          <label><span>${text("目标体重", "Goal Weight")} (${metric ? "kg" : "lb"})</span><input name="goalWeight" type="number" min="${metric ? 30 : 66}" max="${metric ? 300 : 660}" step="0.1" value="${goalWeightValue}" placeholder="--"></label>
          <label><span>${text("体脂率", "Body Fat")} (%)</span><input name="bodyFat" type="number" min="3" max="60" step="0.1" value="${state.bodyFat ?? ""}" placeholder="--"></label>
        </div>
      </section>
      <button class="primary-btn" type="submit">${text("保存个人信息", "Save Profile")} ${icon("check")}</button>
    </form>
  </section>`;
}

function authGateScreen() {
  if (!state.cloudReady) {
    return `<section class="screen auth-gate"><div class="auth-brand"><img src="${assets.logo}" alt="FitPlan AI"><strong>FitPlan AI</strong></div><div class="auth-loading"><i></i><span>${text("正在检查登录状态", "Checking session")}</span></div></section>`;
  }
  return `<section class="screen auth-gate">
    ${statusBar()}
    <header class="auth-brand"><img src="${assets.logo}" alt="FitPlan AI"><div><strong>FitPlan AI</strong><small>${text("你的私人健身规划工具", "Your personal fitness planner")}</small></div></header>
    <section class="auth-gate-content">
      <span class="auth-gate-mark">${icon("activity")}</span>
      <h1>${text("训练，从适合你的计划开始", "Training starts with a plan built for you")}</h1>
      <p>${text("登录后查看你的身体数据、器械、动作、训练计划和饮食记录。", "Sign in to access your body data, equipment, exercises, plans and nutrition logs.")}</p>
    </section>
    <div class="auth-gate-actions">
      <button class="primary-btn" data-open-auth="login">${text("登录", "Sign In")} ${icon("arrow")}</button>
      <button class="secondary-btn" data-open-auth="register">${text("创建免费账户", "Create Free Account")}</button>
    </div>
    <div class="language auth-gate-language"><button data-lang="zh" class="${state.language === "zh" ? "active" : ""}">中</button><button data-lang="en" class="${state.language === "en" ? "active" : ""}">EN</button></div>
  </section>`;
}

function authSheet() {
  if (state.sheet !== "auth") return "";
  const register = state.authMode === "register";
  return `<div class="sheet-layer ${debugParams.get("sheet") === state.sheet ? "open" : ""}" data-close-sheet><section class="bottom-sheet auth-sheet" role="dialog" aria-modal="true">
    <div class="sheet-handle"></div>
    <header class="sheet-header"><div>${dual(register ? "创建账户" : "登录", register ? "Create Account" : "Sign In", "h2")}<p>${text("免费保存你的计划和训练数据。", "Save your plans and training data for free.")}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
    <form id="auth-form">
      ${register ? `<label><span>${text("姓名","Name")}</span><input name="name" autocomplete="name" required placeholder="Larry"></label>` : ""}
      <label><span>${text("邮箱","Email")}</span><input name="email" type="email" autocomplete="email" required placeholder="name@example.com"></label>
      <label><span>${text("密码","Password")}</span><input name="password" type="password" minlength="8" autocomplete="${register ? "new-password" : "current-password"}" required placeholder="${text("至少 8 位","At least 8 characters")}"></label>
      <button class="primary-btn" type="submit" ${state.authBusy ? "disabled" : ""}>${icon("cloud")} ${text(register ? "创建并同步" : "登录并同步", register ? "Create & Sync" : "Sign In & Sync")}</button>
    </form>
    <button class="auth-switch" data-auth-switch>${text(register ? "已有账户？登录" : "没有账户？免费注册", register ? "Already registered? Sign in" : "New here? Create an account")}</button>
  </section></div>`;
}

function planDaySheet() {
  if (state.sheet !== "plan-day" || state.editingPlanDay === null) return "";
  const day = state.planDays[state.editingPlanDay];
  if (!day) return "";
  const available = availableEquipmentKeys();
  const choices = exerciseLibrary.filter(item => available.has(item.equipment) || day.exerciseIds.includes(item.id));
  return `<div class="sheet-layer open" data-close-sheet><section class="bottom-sheet plan-day-sheet" role="dialog" aria-modal="true">
    <div class="sheet-handle"></div>
    <header class="sheet-header"><div><h2>${text("编辑", "Edit")} ${text(day.dayZh, day.dayEn)}</h2><p>${text("只显示你现有器械可完成的动作。", "Only exercises supported by your equipment are shown.")}</p></div><button class="utility-btn" data-close-sheet>×</button></header>
    <label class="day-duration"><span>${text("训练时长", "Duration")}</span><input type="number" min="10" max="180" step="5" value="${day.duration}" data-plan-day-duration><em>min</em></label>
    <div class="plan-day-options">${choices.map(item => `<button class="${day.exerciseIds.includes(item.id) ? "active" : ""}" data-plan-day-exercise="${item.id}">
      <img src="${item.image}" alt=""><span><b>${text(item.zh,item.en)}</b><small>${equipmentLabel(item.equipment)}</small></span><i>${day.exerciseIds.includes(item.id) ? icon("check") : ""}</i>
    </button>`).join("")}</div>
    <button class="primary-btn" data-save-plan-day>${text("保存当天计划", "Save Day")} ${icon("check")}</button>
  </section></div>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
}

function render() {
  const screens = { home, plan, log: logScreen, progress, profile: profileV2, "profile-edit": profileEditScreen, setup, equipment, workout: workoutV2, food, "exercise-library": exerciseLibraryScreen };
  if (!state.cloudReady || !state.user) {
    app.innerHTML = authGateScreen() + authSheet();
  } else {
    app.innerHTML = (screens[state.route] || home)() + equipmentSheet() + guideSheet() + exerciseDetailSheet() + settingsSheet() + authSheet() + planDaySheet();
  }
  bind();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function navigate(route) {
  if (route === state.route) return;
  state.routeStack.push(state.route);
  state.route = route;
  transitionRender();
}

function goBack(fallback = "home") {
  const previous = state.routeStack.pop();
  state.route = previous && previous !== state.route ? previous : fallback;
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
  document.querySelectorAll("[data-back-route]").forEach(el => el.addEventListener("click", () => goBack(el.dataset.backRoute || "home")));
  document.querySelectorAll("[data-toast]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); toast(el.dataset.toast); }));
  document.querySelectorAll("[data-lang]").forEach(el => el.addEventListener("click", async () => {
    state.language = el.dataset.lang;
    persist();
    if (state.user) api("/api/profile", { method: "PATCH", body: { language: state.language } }).catch(() => {});
    render();
  }));
  document.querySelector("#avatar-input")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    state.avatar = await resizeImage(file, 320, .82);
    localStorage.setItem(`fitplan-avatar-${state.user.id}`, state.avatar);
    persist();
    const image = document.querySelector(".avatar-editor img");
    if (image) image.src = state.avatar;
  });
  document.querySelector("#profile-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const optionalNumber = key => form.get(key) === "" ? null : Number(form.get(key));
    const heightInput = optionalNumber("height");
    const weightInput = optionalNumber("weight");
    const goalWeightInput = optionalNumber("goalWeight");
    const payload = {
      name: String(form.get("name") || "").trim(),
      age: optionalNumber("age"),
      heightCm: heightInput == null ? null : (state.units === "metric" ? heightInput : heightInput * 2.54),
      weightKg: weightInput == null ? null : (state.units === "metric" ? weightInput : weightInput / 2.20462),
      goalWeightKg: goalWeightInput == null ? null : (state.units === "metric" ? goalWeightInput : goalWeightInput / 2.20462),
      bodyFat: optionalNumber("bodyFat"),
    };
    try {
      const data = await api("/api/profile", { method: "PATCH", body: payload });
      state.user = data.user;
      applyCloudUser(data.user);
      goBack("profile");
      toast(text("个人信息已保存", "Profile saved"));
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelectorAll("[data-range-shortcut]").forEach(button => button.addEventListener("click", () => {
    const end = new Date();
    const start = new Date();
    const days = button.dataset.rangeShortcut === "week" ? 6 : button.dataset.rangeShortcut === "month" ? 29 : 364;
    start.setDate(end.getDate() - days);
    state.dateRange = { start: localDateValue(start), end: localDateValue(end) };
    persist();
    render();
  }));
  document.querySelectorAll("[data-range-start],[data-range-end]").forEach(input => input.addEventListener("change", () => {
    const start = document.querySelector("[data-range-start]")?.value;
    const end = document.querySelector("[data-range-end]")?.value;
    if (!start || !end || start > end) {
      toast(text("请选择有效日期范围", "Choose a valid date range"));
      return;
    }
    state.dateRange = { start, end };
    persist();
    const body = document.querySelector(".progress-body");
    if (body) body.innerHTML = progressBody();
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
  document.querySelectorAll("[data-edit-plan-day]").forEach(button => button.addEventListener("click", () => {
    state.editingPlanDay = Number(button.dataset.editPlanDay);
    state.sheet = "plan-day";
    render();
  }));
  document.querySelectorAll("[data-plan-day-workout]").forEach(button => button.addEventListener("click", () => {
    const day = state.planDays[Number(button.dataset.planDayWorkout)];
    if (!day?.exerciseIds?.length) return toast(text("请先为当天添加动作", "Add exercises to this day first"));
    state.selectedExercises = new Set(day.exerciseIds);
    persist();
    navigate("workout");
  }));
  document.querySelectorAll("[data-plan-day-exercise]").forEach(button => button.addEventListener("click", () => {
    const day = state.planDays[state.editingPlanDay];
    const id = button.dataset.planDayExercise;
    day.exerciseIds.includes(id) ? day.exerciseIds.splice(day.exerciseIds.indexOf(id), 1) : day.exerciseIds.push(id);
    button.classList.toggle("active", day.exerciseIds.includes(id));
    button.querySelector("i").innerHTML = day.exerciseIds.includes(id) ? icon("check") : "";
  }));
  document.querySelector("[data-save-plan-day]")?.addEventListener("click", async () => {
    const day = state.planDays[state.editingPlanDay];
    day.duration = Math.max(10, Math.min(180, Number(document.querySelector("[data-plan-day-duration]")?.value) || state.duration));
    state.selectedExercises = new Set(state.planDays.flatMap(item => item.exerciseIds));
    persist();
    if (state.user) await saveCurrentPlanCloud();
    state.sheet = null;
    state.editingPlanDay = null;
    render();
    toast(text("当天计划已更新", "Day updated"));
  });
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
    else return goBack("profile");
    render();
  });
  document.querySelector("[data-finish]")?.addEventListener("click", async e => {
    const standalone = e.currentTarget.dataset.finish === "true";
    const available = availableEquipmentKeys();
    state.selectedExercises = new Set([...state.selectedExercises].filter(id => {
      const exercise = exerciseLibrary.find(item => item.id === id);
      return exercise && available.has(exercise.equipment);
    }));
    ensurePlanDays(true);
    if (state.user) {
      try {
        await saveEquipmentCloud();
        if (state.planId || state.selectedExercises.size) await saveCurrentPlanCloud();
      }
      catch (error) { return toast(error.message); }
    }
    state.setupStep = 1;
    persist();
    if (standalone) goBack("profile");
    else navigate("exercise-library");
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
      equipmentKey: state.customEquipmentDraft.equipmentKey || inferEquipmentKey(name),
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
    const wasActive = state.activeWorkout;
    state.activeWorkout = !state.activeWorkout;
    const button = document.querySelector("[data-start-workout]");
    button.innerHTML = `${icon(state.activeWorkout ? "check" : "play")} ${text(state.activeWorkout ? "训练中" : "开始训练", state.activeWorkout ? "In Progress" : "Start Workout")}`;
    button.animate([
      { transform: "scale(.97)", filter: "brightness(1.2)" },
      { transform: "scale(1)", filter: "brightness(1)" },
    ], { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" });
    toast(text(state.activeWorkout ? "训练计时已开始" : "训练已完成", state.activeWorkout ? "Workout timer started" : "Workout completed"));
    if (wasActive && state.user) {
      saveWorkoutCloud().then(() => toast(text("训练记录已保存到云端", "Workout saved to cloud"))).catch(error => toast(error.message));
    }
  });
  document.querySelector("[data-save-food]")?.addEventListener("click", async () => {
    if (!state.ingredients.length) return toast(text("请先拍照识别食物", "Scan a meal first"));
    persist();
    if (state.user) {
      try {
        const result = await api("/api/food-logs", {
          method: "POST",
          body: {
            mealNameZh: state.foodAnalysis?.dishNameZh || "已识别餐食",
            mealNameEn: state.foodAnalysis?.dishNameEn || "Recognized Meal",
            calories: state.ingredients.reduce((sum, item) => sum + Number(item.kcal || 0), 0),
            ingredients: state.ingredients
          }
        });
        state.foodLogs.unshift({
          id: result.id,
          eaten_at: new Date().toISOString(),
          meal_name_zh: state.foodAnalysis?.dishNameZh || "已识别餐食",
          meal_name_en: state.foodAnalysis?.dishNameEn || "Recognized Meal",
          calories: state.ingredients.reduce((sum, item) => sum + Number(item.kcal || 0), 0),
          ingredients: state.ingredients,
        });
        state.ingredients = [];
        state.foodImage = null;
        state.foodAnalysis = null;
        persist();
        navigate("log");
        toast(text("餐食记录已保存到云端", "Meal saved to cloud"));
      } catch (error) { toast(error.message); }
    } else toast(text("餐食记录已保存到本机", "Meal saved locally"));
  });
  document.querySelectorAll("#food-input,#food-retry-input").forEach(input => input.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.foodImage = reader.result;
      state.ingredients = [];
      state.foodAnalysis = null;
      render();
      analyzeFood(reader.result);
    };
    reader.readAsDataURL(file);
  }));
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
  document.querySelectorAll("[data-setting-value]").forEach(button => button.addEventListener("click", async () => {
    if (button.dataset.settingKind === "language") state.language = button.dataset.settingValue;
    else state.units = button.dataset.settingValue;
    persist();
    if (state.user) {
      const key = button.dataset.settingKind === "language" ? "language" : "units";
      api("/api/profile", { method: "PATCH", body: { [key]: state[key] } }).catch(() => {});
    }
    state.sheet = null;
    render();
    toast(text("设置已更新","Settings updated"));
  }));
  bindAdvanced();
  bindPlanStart();
}

function bindAdvanced() {
  document.querySelectorAll("video[autoplay]").forEach(video => {
    video.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(video.duration) && video.duration > 3 && video.currentTime < 0.5) {
        video.currentTime = Math.min(2, video.duration * 0.2);
      }
      video.play().catch(() => {});
    }, { once: true });
  });
  document.querySelector("#exercise-search")?.addEventListener("input", event => {
    state.exerciseFilter.query = event.target.value;
    refreshExerciseCatalogUI();
  });
  document.querySelectorAll("[data-muscle]").forEach(button => button.addEventListener("click", () => {
    state.exerciseFilter.muscle = button.dataset.muscle;
    document.querySelectorAll("[data-muscle]").forEach(item => item.classList.toggle("active", item === button));
    refreshExerciseCatalogUI();
  }));
  document.querySelector("[data-availability]")?.addEventListener("click", () => {
    state.exerciseFilter.equipment = state.exerciseFilter.equipment === "available" ? "all" : "available";
    const button = document.querySelector("[data-availability]");
    button?.classList.toggle("active", state.exerciseFilter.equipment === "available");
    const indicator = button?.querySelector("i");
    if (indicator) indicator.innerHTML = state.exerciseFilter.equipment === "available" ? icon("check") : "";
    refreshExerciseCatalogUI();
  });
  bindExerciseCatalogInteractions();
  document.querySelectorAll("[data-complete-exercise]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.completeExercise;
    state.completedExercises.has(id) ? state.completedExercises.delete(id) : state.completedExercises.add(id);
    const row = button.closest(".exercise");
    const selected = exerciseLibrary.filter(item => state.selectedExercises.has(item.id));
    row?.classList.toggle("done", state.completedExercises.has(id));
    const index = row ? [...row.parentElement.querySelectorAll(".exercise")].indexOf(row) + 1 : 1;
    const badge = button.querySelector(".exercise-index");
    if (badge) badge.innerHTML = state.completedExercises.has(id) ? icon("check") : String(index);
    const count = document.querySelector(".exercise-list .section-title > span");
    if (count) animateNumber(count, `${state.completedExercises.size}/${selected.length}`);
  }));
  document.querySelectorAll("[data-generate-from-equipment]").forEach(button => button.addEventListener("click", () => {
    const available = availableEquipmentKeys();
    const balancedOrder = ["back", "chest", "legs", "shoulders", "core", "cardio"];
    const recommended = [];
    for (const muscle of balancedOrder) {
      const matches = exerciseLibrary.filter(item => item.muscle === muscle && available.has(item.equipment));
      recommended.push(...matches.slice(0, muscle === "back" ? 2 : 1));
    }
    state.selectedExercises = new Set(recommended.slice(0, Math.max(5, Math.min(8, recommended.length))).map(item => item.id));
    persist();
    refreshExerciseCatalogUI();
    refreshLibrarySummaryUI();
    toast(text("已按现有器械生成训练动作", "Workout adapted to your equipment"));
  }));
  document.querySelector("[data-use-selection]")?.addEventListener("click", async () => {
    if (!state.selectedExercises.size) {
      toast(text("请至少选择一个动作", "Select at least one exercise"));
      return;
    }
    ensurePlanDays(true);
    if (state.user) {
      try {
        await saveCurrentPlanCloud();
      } catch (error) {
        toast(error.message);
        return;
      }
    }
    navigate("workout");
  });
  document.querySelectorAll("[data-open-auth]").forEach(button => button.addEventListener("click", () => {
    state.authMode = button.dataset.openAuth;
    state.sheet = "auth";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  }));
  document.querySelector("[data-auth-switch]")?.addEventListener("click", () => {
    state.authMode = state.authMode === "login" ? "register" : "login";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  });
  document.querySelector("#auth-form")?.addEventListener("submit", handleAuth);
  document.querySelector("[data-logout]")?.addEventListener("click", logoutCloud);
}

function bindExerciseCatalogInteractions(root = document) {
  root.querySelectorAll("[data-toggle-exercise]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    const id = button.dataset.toggleExercise;
    state.selectedExercises.has(id) ? state.selectedExercises.delete(id) : state.selectedExercises.add(id);
    persist();
    refreshExerciseSelectionUI(id);
  }));
  root.querySelectorAll("[data-exercise-detail]").forEach(button => button.addEventListener("click", () => {
    state.exerciseDetail = exerciseLibrary.find(item => item.id === button.dataset.exerciseDetail);
    state.sheet = "exercise-detail";
    render();
    requestAnimationFrame(() => document.querySelector(".sheet-layer")?.classList.add("open"));
  }));
}

function refreshExerciseCatalogUI() {
  const catalog = document.querySelector(".exercise-catalog");
  if (!catalog) return;
  const items = filteredExercises();
  catalog.innerHTML = items.map(exerciseCard).join("") || `<div class="empty-state">${icon("filter")}<b>${text("没有匹配动作","No matching exercises")}</b><p>${text("切换肌群或关闭器械限制。","Change the muscle group or equipment filter.")}</p></div>`;
  const resultCount = document.querySelector("[data-result-count]");
  if (resultCount) resultCount.textContent = `${items.length} ${text("个结果", "results")}`;
  bindExerciseCatalogInteractions(catalog);
}

function refreshExerciseSelectionUI(id) {
  const selected = state.selectedExercises.has(id);
  document.querySelectorAll(`[data-toggle-exercise="${id}"]`).forEach(button => {
    button.classList.toggle("active", selected);
    button.innerHTML = icon(selected ? "check" : "plus");
    if (button.closest(".exercise-detail-sheet")) {
      button.innerHTML += ` ${text(selected ? "已加入当前训练" : "加入当前训练", selected ? "Added to Workout" : "Add to Workout")}`;
    }
  });
  document.querySelectorAll(`[data-exercise-detail="${id}"]`).forEach(button => {
    button.closest(".catalog-card")?.classList.toggle("selected", selected);
  });
  refreshLibrarySummaryUI();
}

function refreshLibrarySummaryUI() {
  const selected = exerciseLibrary.filter(item => state.selectedExercises.has(item.id));
  const count = document.querySelector("[data-selected-count]");
  if (count) count.textContent = selected.length;
  const duration = document.querySelector("[data-estimated-time]");
  if (duration) duration.textContent = selected.length ? `${selected.length * 8}${text(" 分钟", " min")}` : "--";
  const muscles = document.querySelector("[data-muscle-count]");
  if (muscles) muscles.textContent = new Set(selected.map(item => item.muscle)).size || "--";
  const strip = document.querySelector("[data-selected-strip]");
  if (strip) {
    strip.innerHTML = selectedExerciseStrip(selected);
    bindExerciseCatalogInteractions(strip);
  }
  const useButton = document.querySelector("[data-use-selection] span");
  if (useButton) useButton.innerHTML = dual(`加入训练计划 · ${selected.length}`, `Add to Plan · ${selected.length}`, "b");
}

async function handleAuth(event) {
  event.preventDefault();
  if (state.authBusy) return;
  state.authBusy = true;
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  try {
    const data = await api(`/api/auth/${state.authMode}`, { method: "POST", body: payload });
    state.user = data.user;
    state.sheet = null;
    clearAccountState();
    state.user = data.user;
    applyCloudUser(data.user);
    await loadAccountData();
    render();
    toast(text("登录成功", "Signed in"));
  } catch (error) {
    state.authBusy = false;
    toast(error.message);
  }
}

async function logoutCloud() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch {}
  state.user = null;
  clearAccountState();
  render();
}

async function loadCloudSession() {
  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
    if (data.user) {
      applyCloudUser(data.user);
      await loadAccountData();
    }
    state.cloudReady = true;
    render();
  } catch {
    state.cloudReady = true;
    state.user = null;
    clearAccountState();
    render();
  }
}

function clearAccountState() {
  state.age = null;
  state.height = null;
  state.weight = null;
  state.goalWeight = null;
  state.bodyFat = null;
  state.avatar = assets.avatar;
  state.equipment = new Set();
  state.customEquipment = [];
  state.selectedExercises = new Set();
  state.planDays = [];
  state.planId = null;
  state.planStarted = false;
  state.workoutLogs = [];
  state.foodLogs = [];
  state.ingredients = [];
  state.foodImage = null;
  state.foodAnalysis = null;
  state.completedExercises = new Set();
  state.route = "home";
  state.routeStack = ["home"];
}

function applyCloudUser(user) {
  if (!user) return;
  state.language = user.language || state.language;
  state.units = user.units || state.units;
  state.age = user.age ?? null;
  state.height = user.heightCm ?? null;
  state.weight = user.weightKg ?? null;
  state.goalWeight = user.goalWeightKg ?? null;
  state.bodyFat = user.bodyFat ?? null;
  state.goal = user.goal || state.goal;
  state.days = user.trainingDays ?? state.days;
  state.duration = user.workoutDuration ?? state.duration;
  state.avatar = localStorage.getItem(`fitplan-avatar-${user.id}`) || user.avatarUrl || assets.avatar;
  persist();
}

async function loadAccountData() {
  if (!state.user) return;
  const [equipmentData, planData, workoutData, foodData] = await Promise.all([
    api("/api/equipment"),
    api("/api/plans"),
    api("/api/workouts"),
    api("/api/food-logs"),
  ]);
  const equipmentRows = equipmentData.equipment || [];
  state.equipment = new Set(equipmentRows.map(item => item.name_zh).filter(Boolean));
  state.customEquipment = equipmentRows.filter(item => item.is_custom).map(item => ({
    ...(item.details || {}),
    name: item.name_zh,
    en: item.name_en,
    equipmentKey: item.equipment_key,
    type: item.load_type,
    unit: item.unit,
    increment: item.increment_value,
  }));
  const currentPlan = (planData.plans || [])[0];
  state.planId = currentPlan?.id || null;
  state.planStarted = currentPlan?.status === "active";
  state.selectedExercises = new Set(currentPlan?.plan?.exerciseIds || []);
  state.planDays = Array.isArray(currentPlan?.plan?.planDays) ? currentPlan.plan.planDays : [];
  state.workoutLogs = workoutData.workouts || [];
  state.foodLogs = foodData.foodLogs || [];
  persist();
}

async function saveCurrentPlanCloud() {
  if (!state.user) return;
  const result = await api("/api/plans", {
    method: "POST",
    body: {
      id: state.planId || undefined,
      name: text("我的自定义训练", "My Custom Workout"),
      goal: state.goal,
      status: state.planStarted ? "active" : "draft",
      plan: {
        exerciseIds: [...state.selectedExercises],
        days: state.days,
        duration: state.duration,
        equipment: [...state.equipment],
        planDays: state.planDays,
      }
    }
  });
  state.planId = result.id;
  persist();
}

async function saveEquipmentCloud() {
  if (!state.user) return;
  await api("/api/equipment", {
    method: "PUT",
    body: {
      equipment: [...state.equipment].map(name => {
        const custom = state.customEquipment.find(item => item.name === name);
        return custom
          ? { ...custom, nameZh: name, nameEn: custom.en, key: custom.equipmentKey || "", custom: true }
          : { nameZh: name, nameEn: equipmentItems.find(item => item[0] === name)?.[1] || name, key: equipmentKeyMap[name] || "", custom: false };
      })
    }
  });
}

async function saveWorkoutCloud() {
  if (!state.user) return;
  const selected = exerciseLibrary.filter(item => state.selectedExercises.has(item.id));
  const startedAt = new Date(Date.now() - selected.length * 8 * 60000).toISOString();
  const completedAt = new Date().toISOString();
  const calories = selected.length * 75;
  const result = await api("/api/workouts", {
    method: "POST",
    body: {
      planId: state.planId,
      startedAt,
      completedAt,
      durationMinutes: selected.length * 8,
      calories,
      exercises: selected.map(item => ({ id: item.id, completed: state.completedExercises.has(item.id), sets: item.sets }))
    }
  });
  state.workoutLogs.unshift({
    id: result.id,
    started_at: startedAt,
    completed_at: completedAt,
    duration_minutes: selected.length * 8,
    calories,
    exercises: selected.map(item => ({ id: item.id, completed: state.completedExercises.has(item.id), sets: item.sets })),
  });
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || text("请求失败", "Request failed"));
  return data;
}

function bindRoutesAndToasts(root = document) {
  root.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.route)));
  root.querySelectorAll("[data-toast]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); toast(el.dataset.toast); }));
  bindPlanStart(root);
}

function bindPlanStart(root = document) {
  root.querySelectorAll("[data-start-plan]").forEach(button => button.addEventListener("click", async () => {
    state.planStarted = !state.planStarted;
    persist();
    button.innerHTML = `${icon(state.planStarted ? "check" : "play")} ${text(state.planStarted ? "计划进行中" : "开始计划", state.planStarted ? "Plan In Progress" : "Start Plan")}`;
    if (state.user) {
      try { await saveCurrentPlanCloud(); }
      catch (error) { toast(error.message); }
    }
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

function resizeImage(file, maxSize = 320, quality = .82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
      equipmentKey: result.equipmentKey || inferEquipmentKey(result.nameZh, result.nameEn),
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
    state.foodAnalysis = result;
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
loadCloudSession();
