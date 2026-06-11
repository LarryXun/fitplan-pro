const MODEL = "gemini-2.5-flash-lite";
const SESSION_COOKIE = "fitplan_session";
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 10000;

const equipmentSchema = {
  type: "OBJECT",
  properties: {
    nameZh: { type: "STRING" },
    nameEn: { type: "STRING" },
    equipmentKey: { type: "STRING", enum: ["dumbbell", "barbell", "bench", "treadmill", "cable", "bands", "pull-up-bar", "kettlebell", "smith-machine", "leg-press", "bodyweight", "other"] },
    type: { type: "STRING", enum: ["selectorized", "plates", "fixed", "bodyweight"] },
    unit: { type: "STRING", enum: ["kg", "lb"] },
    increment: { type: "NUMBER" },
    confidence: { type: "NUMBER" },
    usageSteps: { type: "ARRAY", items: { type: "STRING" } },
    commonMistakes: { type: "ARRAY", items: { type: "STRING" } },
    targetMuscles: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["nameZh", "nameEn", "equipmentKey", "type", "unit", "increment", "confidence", "usageSteps", "commonMistakes", "targetMuscles"]
};

const foodSchema = {
  type: "OBJECT",
  properties: {
    dishNameZh: { type: "STRING" },
    dishNameEn: { type: "STRING" },
    confidence: { type: "NUMBER" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          en: { type: "STRING" },
          amount: { type: "STRING" },
          kcal: { type: "NUMBER" }
        },
        required: ["name", "en", "amount", "kcal"]
      }
    }
  },
  required: ["dishNameZh", "dishNameEn", "confidence", "ingredients"]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      if (url.pathname === "/api/status") {
        return json({
          provider: "Gemini",
          model: MODEL,
          configured: Boolean(env.GEMINI_API_KEY),
          database: Boolean(env.DB),
          runtime: "Cloudflare Workers"
        });
      }

      if (url.pathname === "/api/auth/register" && request.method === "POST") return register(request, env);
      if (url.pathname === "/api/auth/login" && request.method === "POST") return login(request, env);
      if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
      if (url.pathname === "/api/auth/me" && request.method === "GET") return currentUser(request, env);
      if (url.pathname === "/api/profile" && request.method === "PATCH") return updateProfile(request, env);
      if (url.pathname === "/api/exercises" && request.method === "GET") return listExercises(url, env);
      if (url.pathname === "/api/equipment" && request.method === "GET") return listEquipment(request, env);
      if (url.pathname === "/api/equipment" && request.method === "PUT") return saveEquipment(request, env);
      if (url.pathname === "/api/plans" && request.method === "GET") return listPlans(request, env);
      if (url.pathname === "/api/plans" && request.method === "POST") return savePlan(request, env);
      if (url.pathname === "/api/workouts" && request.method === "GET") return listWorkouts(request, env);
      if (url.pathname === "/api/workouts" && request.method === "POST") return saveWorkout(request, env);
      if (url.pathname === "/api/food-logs" && request.method === "GET") return listFoodLogs(request, env);
      if (url.pathname === "/api/food-logs" && request.method === "POST") return saveFoodLog(request, env);

      if (url.pathname === "/api/analyze-equipment" || url.pathname === "/api/analyze-food") {
        if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
        if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY is not configured", code: "API_KEY_MISSING" }, 503);
        const body = await request.json();
        const kind = url.pathname.endsWith("equipment") ? "equipment" : "food";
        const result = await analyze(body.image, kind, env.GEMINI_API_KEY);
        return json(kind === "equipment" ? normalizeEquipment(result) : result);
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: error.message || "Request failed" }, error.status || 500);
    }
  }
};

async function register(request, env) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "FitPlan User").trim().slice(0, 50);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "请输入有效邮箱" }, 400);
  if (password.length < 8) return json({ error: "密码至少需要 8 位" }, 400);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (exists) return json({ error: "该邮箱已经注册" }, 409);

  const salt = randomToken(16);
  const passwordHash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO users (id,email,name,password_hash,password_salt) VALUES (?,?,?,?,?)"
  ).bind(id, email, name || "FitPlan User", passwordHash, salt).run();
  return createSessionResponse(env, id, await getUser(env, id), 201);
}

async function login(request, env) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!row || !constantTimeEqual(await hashPassword(password, row.password_salt), row.password_hash)) {
    return json({ error: "邮箱或密码不正确" }, 401);
  }
  return createSessionResponse(env, row.id, sanitizeUser(row));
}

async function logout(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}

async function currentUser(request, env) {
  const user = await requireUser(request, env, false);
  return user ? json({ user }) : json({ user: null }, 200);
}

async function updateProfile(request, env) {
  const user = await requireUser(request, env);
  const body = await request.json();
  const fields = {
    name: body.name,
    language: body.language,
    units: body.units,
    age: body.age,
    height_cm: body.heightCm,
    weight_kg: body.weightKg,
    goal_weight_kg: body.goalWeightKg,
    body_fat: body.bodyFat,
    goal: body.goal,
    training_days: body.trainingDays,
    workout_duration: body.workoutDuration
  };
  const allowed = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (!allowed.length) return json({ user });
  const sql = `UPDATE users SET ${allowed.map(([key]) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await env.DB.prepare(sql).bind(...allowed.map(([, value]) => value), user.id).run();
  return json({ user: await getUser(env, user.id) });
}

async function listExercises(url, env) {
  const conditions = ["active = 1"];
  const values = [];
  for (const [param, column] of [["muscle", "muscle_group"], ["equipment", "equipment_key"]]) {
    const value = url.searchParams.get(param);
    if (value && value !== "all") {
      conditions.push(`${column} = ?`);
      values.push(value);
    }
  }
  const query = url.searchParams.get("q");
  if (query) {
    conditions.push("(name_zh LIKE ? OR name_en LIKE ?)");
    values.push(`%${query}%`, `%${query}%`);
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM exercises WHERE ${conditions.join(" AND ")} ORDER BY muscle_group, name_en`
  ).bind(...values).all();
  return json({ exercises: results.map(normalizeExerciseRow) });
}

async function listEquipment(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare("SELECT * FROM user_equipment WHERE user_id = ? ORDER BY created_at").bind(user.id).all();
  return json({ equipment: results.map(row => ({ ...row, details: parseJson(row.details_json, {}) })) });
}

async function saveEquipment(request, env) {
  const user = await requireUser(request, env);
  const body = await request.json();
  const equipment = Array.isArray(body.equipment) ? body.equipment.slice(0, 100) : [];
  const statements = [env.DB.prepare("DELETE FROM user_equipment WHERE user_id = ?").bind(user.id)];
  for (const item of equipment) {
    statements.push(env.DB.prepare(
      "INSERT INTO user_equipment (id,user_id,name_zh,name_en,equipment_key,load_type,unit,increment_value,is_custom,details_json) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      crypto.randomUUID(), user.id, item.nameZh || item.name || "", item.nameEn || item.en || "",
      item.key || item.equipmentKey || "", item.type || "selectorized", item.unit || "kg",
      Number(item.increment) || 5, item.custom ? 1 : 0, JSON.stringify(item.details || item)
    ));
  }
  await env.DB.batch(statements);
  return json({ ok: true, count: equipment.length });
}

async function listPlans(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare("SELECT * FROM training_plans WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all();
  return json({ plans: results.map(row => ({ ...row, plan: parseJson(row.plan_json, {}) })) });
}

async function savePlan(request, env) {
  const user = await requireUser(request, env);
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO training_plans (id,user_id,name,goal,status,plan_json) VALUES (?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name,goal=excluded.goal,status=excluded.status,plan_json=excluded.plan_json,updated_at=CURRENT_TIMESTAMP
     WHERE user_id=excluded.user_id`
  ).bind(id, user.id, body.name || "My Plan", body.goal || user.goal, body.status || "active", JSON.stringify(body.plan || {})).run();
  return json({ id, ok: true }, 201);
}

async function listWorkouts(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare("SELECT * FROM workout_logs WHERE user_id = ? ORDER BY started_at DESC LIMIT 100").bind(user.id).all();
  return json({ workouts: results.map(row => ({ ...row, exercises: parseJson(row.exercises_json, []) })) });
}

async function saveWorkout(request, env) {
  const user = await requireUser(request, env);
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO workout_logs (id,user_id,plan_id,started_at,completed_at,duration_minutes,calories,exercises_json) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(id, user.id, body.planId || null, body.startedAt || new Date().toISOString(), body.completedAt || new Date().toISOString(), Number(body.durationMinutes) || 0, Number(body.calories) || 0, JSON.stringify(body.exercises || [])).run();
  return json({ id, ok: true }, 201);
}

async function listFoodLogs(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare("SELECT * FROM food_logs WHERE user_id = ? ORDER BY eaten_at DESC LIMIT 100").bind(user.id).all();
  return json({ foodLogs: results.map(row => ({ ...row, ingredients: parseJson(row.ingredients_json, []) })) });
}

async function saveFoodLog(request, env) {
  const user = await requireUser(request, env);
  const body = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO food_logs (id,user_id,eaten_at,meal_name_zh,meal_name_en,calories,ingredients_json,image_url) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(id, user.id, body.eatenAt || new Date().toISOString(), body.mealNameZh || "", body.mealNameEn || "", Number(body.calories) || 0, JSON.stringify(body.ingredients || []), body.imageUrl || null).run();
  return json({ id, ok: true }, 201);
}

async function requireUser(request, env, required = true) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) {
    if (required) throw httpError("请先登录", 401);
    return null;
  }
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=? AND s.expires_at > CURRENT_TIMESTAMP`
  ).bind(await sha256(token)).first();
  if (!row && required) throw httpError("登录已过期", 401);
  return row ? sanitizeUser(row) : null;
}

async function createSessionResponse(env, userId, user, status = 200) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await sha256(token), expiresAt).run();
  return json({ user }, status, { "Set-Cookie": sessionCookie(token) });
}

async function getUser(env, id) {
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  return sanitizeUser(row);
}

function sanitizeUser(row) {
  return {
    id: row.id, email: row.email, name: row.name, language: row.language, units: row.units,
    age: row.age, heightCm: row.height_cm, weightKg: row.weight_kg, goalWeightKg: row.goal_weight_kg,
    bodyFat: row.body_fat, goal: row.goal, trainingDays: row.training_days,
    workoutDuration: row.workout_duration, avatarUrl: row.avatar_url || null, createdAt: row.created_at
  };
}

function normalizeExerciseRow(row) {
  return {
    id: row.id, zh: row.name_zh, en: row.name_en, muscle: row.muscle_group,
    secondary: row.secondary_muscles, equipment: row.equipment_key, difficulty: row.difficulty,
    movement: row.movement_type, image: row.poster_url, videoUrl: row.video_url,
    animation: row.animation_type, stepsZh: row.instructions_zh.split("|"),
    stepsEn: row.instructions_en.split("|"), mistakesZh: row.mistakes_zh.split("|"),
    mistakesEn: row.mistakes_en.split("|")
  };
}

async function analyze(image, kind, apiKey) {
  if (!image) throw httpError("Image is required", 400);
  const [metadata, data] = image.includes(",") ? image.split(",", 2) : ["data:image/jpeg;base64", image];
  const mimeType = metadata.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const equipment = kind === "equipment";
  const prompt = equipment
    ? "Identify this gym equipment for a bilingual personal fitness app. Choose the closest canonical equipmentKey from the schema so it can filter compatible exercises. Determine its load system. Return concise Simplified Chinese usage steps, common mistakes and target muscles. If the increment is unreadable, use an editable 5 kg estimate and lower confidence."
    : "Analyze this meal for a calorie app covering Chinese, Middle Eastern and Western foods. Identify visible ingredients and estimate edible portions and calories. Return concise bilingual names. Values must remain editable.";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data } }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema: equipment ? equipmentSchema : foodSchema }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Gemini request failed");
  return JSON.parse(payload.candidates[0].content.parts[0].text);
}

function normalizeEquipment(result) {
  result.nameZh = result.nameZh || "自定义健身器械";
  result.nameEn = result.nameEn || "Custom Equipment";
  result.increment = Math.max(0.5, Number(result.increment) || 5);
  result.confidence = Math.min(1, Math.max(0, Number(result.confidence) || 0));
  return result;
}

async function hashPassword(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    material, 256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

function randomToken(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function readCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
