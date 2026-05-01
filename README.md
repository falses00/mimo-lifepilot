# mimo-lifepilot

AI 生活管家：用一句话记录今天做了什么、接下来要做什么，自动生成已办、待办、提醒和生活计划。

## 功能

- 自然语言输入
- 自动解析已办/待办/习惯/账单
- 编辑/删除/标记完成
- 保存到 localStorage/API
- 历史记录
- 导出 Markdown 日报
- 设置区
- API Mode / Static Demo Mode

## 技术栈

- 前端: Astro + Tailwind CSS + TypeScript
- 后端: Fastify + Node.js + TypeScript
- 数据库: Supabase Postgres (可选) / localStorage
- 测试: Vitest + Playwright

## 快速开始

```bash
# 安装依赖
npm install

# 启动前端
npm run dev:web

# 启动后端
npm run dev:api

# 运行测试
npm test
```

## API Endpoints

- POST /api/lifepilot/parse-entry
- POST /api/lifepilot/save-plan
- GET /api/lifepilot/today

## 部署

- 前端: GitHub Pages / Vercel / Cloudflare Pages
- 后端: Render / Vercel Functions
- 数据库: Supabase (可选)

## 许可证

MIT
