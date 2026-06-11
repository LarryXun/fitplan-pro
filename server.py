import base64
import json
import os
import urllib.error
import urllib.request
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
API_KEY = os.environ.get("GEMINI_API_KEY", "")


EQUIPMENT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "nameZh": {"type": "STRING"},
        "nameEn": {"type": "STRING"},
        "equipmentKey": {
            "type": "STRING",
            "enum": ["dumbbell", "barbell", "bench", "treadmill", "cable", "bands", "pull-up-bar", "kettlebell", "smith-machine", "leg-press", "bodyweight", "other"],
        },
        "type": {
            "type": "STRING",
            "enum": ["selectorized", "plates", "fixed", "bodyweight"],
        },
        "unit": {"type": "STRING", "enum": ["kg", "lb"]},
        "increment": {"type": "NUMBER"},
        "confidence": {"type": "NUMBER"},
        "usageSteps": {"type": "ARRAY", "items": {"type": "STRING"}},
        "commonMistakes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "targetMuscles": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": [
        "nameZh", "nameEn", "equipmentKey", "type", "unit", "increment", "confidence",
        "usageSteps", "commonMistakes", "targetMuscles",
    ],
}

FOOD_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "dishNameZh": {"type": "STRING"},
        "dishNameEn": {"type": "STRING"},
        "confidence": {"type": "NUMBER"},
        "ingredients": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "en": {"type": "STRING"},
                    "amount": {"type": "STRING"},
                    "kcal": {"type": "NUMBER"},
                },
                "required": ["name", "en", "amount", "kcal"],
            },
        },
    },
    "required": ["dishNameZh", "dishNameEn", "confidence", "ingredients"],
}

EQUIPMENT_NAME_MAP = {
    "dumbbell": "哑铃",
    "barbell": "杠铃",
    "bench": "卧推凳",
    "treadmill": "跑步机",
    "cable": "拉力器",
    "pulldown": "高位下拉机",
    "pull-up": "引体向上架",
    "pull up": "引体向上架",
    "kettlebell": "壶铃",
    "elliptical": "椭圆机",
    "smith": "史密斯机",
    "chest press": "坐姿推胸机",
    "leg press": "腿举机",
    "rowing machine": "划船机",
    "exercise bike": "健身车",
    "stationary bike": "健身车",
}


def analyze_image(data, kind):
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    image_data = data.get("image", "")
    if "," in image_data:
        metadata, image_data = image_data.split(",", 1)
        mime_type = metadata.split(";")[0].replace("data:", "")
    else:
        mime_type = data.get("mimeType", "image/jpeg")

    if kind == "equipment":
        prompt = (
            "Identify this gym equipment. Return practical data for a personal fitness app. "
            "Choose the closest canonical equipmentKey from the response schema so compatible exercises can be filtered. "
            "Determine whether its load is a selectorized stack, weight plates, fixed weight, "
            "or bodyweight/assistance. Read visible labels when possible. Provide concise Chinese "
            "usage steps, common mistakes, and target muscles. Never invent a precise increment "
            "when unreadable; use 5 kg as a conservative editable estimate and lower confidence."
        )
        schema = EQUIPMENT_SCHEMA
    else:
        prompt = (
            "Analyze this meal for a calorie logging app used for Chinese, Middle Eastern, and "
            "Western foods. Identify visible ingredients, estimate edible portions and calories. "
            "Return concise bilingual dish and ingredient names. Estimates must remain editable."
        )
        schema = FOOD_SCHEMA

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inlineData": {"mimeType": mime_type, "data": image_data}},
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": schema,
        },
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{MODEL}:generateContent?key={API_KEY}"
    )
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        result = json.loads(response.read().decode("utf-8"))
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)
    if kind == "equipment":
        parsed = normalize_equipment(parsed)
    return parsed


def normalize_equipment(result):
    name_zh = str(result.get("nameZh", "")).strip()
    name_en = str(result.get("nameEn", "")).strip()
    if not re.search(r"[\u4e00-\u9fff]", name_zh):
        normalized_en = name_en.lower()
        for keyword, chinese in EQUIPMENT_NAME_MAP.items():
            if keyword in normalized_en:
                result["nameZh"] = chinese
                break
        else:
            result["nameZh"] = "自定义健身器械"
    result["increment"] = max(0.5, float(result.get("increment") or 5))
    result["confidence"] = min(1, max(0, float(result.get("confidence") or 0)))
    return result


class AppHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            self.send_json(200, {
                "provider": "Gemini",
                "model": MODEL,
                "configured": bool(API_KEY),
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path not in ("/api/analyze-equipment", "/api/analyze-food"):
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 18 * 1024 * 1024:
                self.send_json(413, {"error": "Image is too large"})
                return
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            kind = "equipment" if self.path.endswith("equipment") else "food"
            self.send_json(200, analyze_image(data, kind))
        except RuntimeError as error:
            self.send_json(503, {"error": str(error), "code": "API_KEY_MISSING"})
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            self.send_json(error.code, {"error": "Gemini API request failed", "details": details})
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4173"))
    host = os.environ.get("HOST", "0.0.0.0")
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"FitPlan AI running on {host}:{port}")
    print("Gemini API:", "configured" if API_KEY else "GEMINI_API_KEY missing")
    server.serve_forever()
