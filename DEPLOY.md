# FitPlan AI 公网部署

推荐架构：

- GitHub：保存代码并触发自动部署
- Cloudflare Workers：托管 PWA 静态文件和 `/api/*`
- Gemini API Key：保存为 Cloudflare Secret

## 一、创建 GitHub 仓库

1. 在 GitHub 创建一个私有仓库，例如 `fitplan-ai`。
2. 将本目录文件上传到仓库的 `main` 分支。
3. 不要上传 `.env`、`.dev.vars` 或任何 API Key。

## 二、创建 Cloudflare API Token

1. 登录 Cloudflare。
2. 创建一个允许编辑 Workers Scripts 的 API Token。
3. 复制 Cloudflare Account ID。

在 GitHub 仓库 `Settings > Secrets and variables > Actions` 添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

推送到 `main` 后，GitHub Actions 会自动发布。

## 三、配置 Gemini Secret

首次部署后，在安装了 Node.js 的电脑执行：

```powershell
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

输入 Gemini Key 时不会写入代码仓库。

也可以在 Cloudflare Dashboard 的 Worker 设置中添加加密变量：

- 名称：`GEMINI_API_KEY`
- 类型：Secret

## 四、安装到 iPhone

1. 使用 Safari 打开 Cloudflare 提供的 `https://fitplan-ai.<账号>.workers.dev`。
2. 点击分享。
3. 选择“添加到主屏幕”。

公网版本不要求手机与电脑处于同一个网络，电脑也不需要保持开机。
