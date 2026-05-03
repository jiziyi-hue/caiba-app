## Sentry setup
1. Create project at sentry.io (free tier: 5K errors/month).
2. Copy DSN from Settings → Client Keys.
3. Set VITE_SENTRY_DSN env var:
   - Local: add to .env.local
   - Cloudflare Pages: dashboard → caiba project → Settings → Environment variables

## Cloudflare Web Analytics

无埋点访客分析。**不要**在仓库里写死 token，请按以下步骤手动启用。

1. 打开 https://dash.cloudflare.com/?to=/:account/web-analytics
2. 点击 **Add a site**，填入正式域名（含子域）。
3. 选择 **With JavaScript snippet**（非 CF Proxy 模式）。
4. 复制生成的 beacon 片段，形如：

   ```html
   <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
           data-cf-beacon='{"token": "YOUR_REAL_TOKEN_HERE"}'></script>
   ```

5. 把这一行粘贴到 `d:\caiba\app\index.html`，紧挨在 `</body>` 之前。
6. 重新构建并部署（`npm run build` → 上传 `dist/`）。
7. 部署完成后回到 Cloudflare 控制台确认 24 小时内开始收到 PV / RUM 数据。

> 注意：该脚本只在 production 域名加载，本地 `npm run dev` 不会上报，无需为开发环境再做条件分支。
