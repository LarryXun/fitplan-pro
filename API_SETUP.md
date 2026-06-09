# FitPlan AI 图片识别配置

图片识别通过本机 `server.py` 转发到 Gemini API，API 密钥不会发送到前端代码。

1. 在 Google AI Studio 创建 Gemini API Key：
   https://aistudio.google.com/app/apikey
2. 在 PowerShell 中设置当前用户环境变量：

```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "你的密钥", "User")
```

3. 重新启动 `server.py`。

接口：

- `GET /api/status`
- `POST /api/analyze-equipment`
- `POST /api/analyze-food`

不要把真实 API Key 写入 `app.js`、提交到代码仓库或发送到聊天中。
