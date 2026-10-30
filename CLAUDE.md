# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Only the bare `create-next-app` scaffold exists (Next.js 16.4.3, React 19, TypeScript, Tailwind 4, App Router, `src/` layout, alias `@/*`). No app code, tests, or test runner yet. `PRD.md` (Korean) is the source of truth for what to build; the PRD stack (Clerk, Neon + Drizzle, Claude API, Notion MCP) is not installed yet.

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

## Next.js version caveat

`AGENTS.md` warns that this Next.js version has breaking changes from older releases. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (routing, middleware, route handlers, etc.) and heed deprecation notices.

## Product architecture (from PRD.md)

Web app that collects overseas AI news via RSS (TechCrunch AI, The Verge AI), then uses Claude to translate the title to Korean, summarize in Korean, and classify into user-defined categories; shown as cards.

Key design constraints that span multiple files:

- **Auth gate:** Clerk; middleware redirects all unauthenticated users to sign-in. No screen is visible logged out.
- **Multi-tenant data:** `categories` and `articles` are scoped by `user_id`; `articles` is unique on `(user_id, url)`. Every query must filter by the Clerk user id.
- **Fetch is manual and cost-bounded:** collection only runs on the "뉴스 가져오기" button; skip URLs already stored; process at most 20 new articles per run (newest first across both feeds). Claude is only called for new articles. Watch serverless execution time limits for 20 Claude calls (parallel/batch if needed).
- **Categories:** Claude classifies against the user's current category list. Deleting a category sets its articles to "미분류" (never deletes articles). Adding/editing categories does NOT reclassify existing articles; a separate "미분류 기사 재분류" button does. New users get seeded with: 모델·연구, 기업·투자, 규제·정책, 제품·서비스, 기타.
- **Notion save:** per-card manual button only, into a pre-existing Notion DB (DB ID + integration token in server env vars; the app never creates the DB). Called from a Route Handler via an MCP client to the Notion MCP server; first verify this works in the serverless deploy environment, otherwise reconsider the official Notion API. Mark `notion_saved` and block duplicate saves.
- **Secrets:** Claude, Neon, Clerk, Notion keys are server-only env vars, never exposed to the client.
- UI needs loading state and error messages during fetch.
