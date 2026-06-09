const MODEL = "gemini-2.5-flash-lite";

const equipmentSchema = {
  type: "OBJECT",
  properties: {
    nameZh: { type: "STRING" },
    nameEn: { type: "STRING" },
    type: { type: "STRING", enum: ["selectorized", "plates", "fixed", "bodyweight"] },
    unit: { type: "STRING", enum: ["kg", "lb"] },
    increment: { type: "NUMBER" },
    confidence: { type: "NUMBER" },
    usageSteps: { type: "ARRAY", items: { type: "STRING" } },
    commonMistakes: { type: "ARRAY", items: { type: "STRING" } },
    targetMuscles: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["nameZh", "nameEn", "type", "unit", "increment", "confidence", "usageSteps", "commonMistakes", "targetMuscles"]
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

const equipmentNames = {
  dumbbell: "哑铃",
  barbell: "杠铃",
  bench: "卧推凳",
  treadmill: "跑步机",
  cable: "拉力器",
  pulldown: "高位下拉机",
  "pull-up": "引体向上架",
  kettlebell: "壶铃",
  elliptical: "椭圆机",
  smith: "史密斯机",
  "chest press": "坐姿推胸机",
  "leg press": "腿举机",
  "rowing machine": "划船机",
  "exercise bike": "健身车"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      return json({
        provider: "Gemini",
        model: MODEL,
        configured: Boolean(env.GEMINI_API_KEY),
        runtime: "Cloudflare Workers"
      });
    }

    if (url.pathname === "/api/analyze-equipment" || url.pathname === "/api/analyze-food") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY is not configured", code: "API_KEY_MISSING" }, 503);

      try {
        const body = await request.json();
        const kind = url.pathname.endsWith("equipment") ? "equipment" : "food";
        const result = await analyze(body.image, kind, env.GEMINI_API_KEY);
        return json(kind === "equipment" ? normalizeEquipment(result) : result);
      } catch (error) {
        return json({ error: error.message || "Image analysis failed" }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

async function analyze(image, kind, apiKey) {
  if (!image) throw new Error("Image is required");
  const [metadata, data] = image.includes(",") ? image.split(",", 2) : ["data:image/jpeg;base64", image];
  const mimeType = metadata.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const equipment = kind === "equipment";
  const prompt = equipment
    ? "Identify this gym equipment for a bilingual personal fitness app. Determine its load system. Read visible labels when possible. Return concise Simplified Chinese usage steps, common mistakes and target muscles. If the increment is unreadable, use an editable 5 kg estimate and lower confidence."
    : "Analyze this meal for a calorie app covering Chinese, Middle Eastern and Western foods. Identify visible ingredients and estimate edible portions and calories. Return concise bilingual names. Values must remain editable.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data } }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: equipment ? equipmentSchema : foodSchema
        }
      })
    }
  );

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Gemini request failed");
  return JSON.parse(payload.candidates[0].content.parts[0].text);
}

function normalizeEquipment(result) {
  if (!/[\u4e00-\u9fff]/.test(result.nameZh || "")) {
    const english = (result.nameEn || "").toLowerCase();
    result.nameZh = Object.entries(equipmentNames).find(([key]) => english.includes(key))?.[1] || "自定义健身器械";
  }
  result.increment = Math.max(0.5, Number(result.increment) || 5);
  result.confidence = Math.min(1, Math.max(0, Number(result.confidence) || 0));
  return result;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
