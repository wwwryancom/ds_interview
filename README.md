# 小猪 — DS 面试准备

私密单用户 MVP：中文界面「小猪」+ 英文题面。Stack: **Fastify + Prisma + SQLite + React**.

**异地使用（发链接给她）**：见 [DEPLOY.md](./DEPLOY.md) — Docker 或 Railway，数据在服务器 `dev.db`，建议设 `APP_PASSWORD`。

## Taxonomy (aligned)

The UI mockup's ML-leaning practice areas are replaced by the taxonomy the question bank is
actually built around (`src/taxonomy.ts`):

1. **Experiment & Statistics**
2. **Product Case**
3. **Manager Interview**
4. **SQL**
5. **Python / Coding**

Plus cross-cutting dimensions used by the app: `difficulty`, `company_emphasis` (filter by target
company), `timebox_minutes`, a 0–4 `scoring_rubric`, and `weakness_tags` for progress tracking.

## Setup

```bash
npm install
npm run prisma:generate
npm run db:push      # create the SQLite schema (prisma/dev.db)
npm run db:seed      # load the seed question set
npm run dev          # start the API on :3001 (watch mode)
```

`npm run db:reset` recreates the DB and reseeds.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/taxonomy` | categories, difficulties, companies, weakness tags |
| GET | `/api/questions` | list/filter (`category`, `difficulty`, `company`, `tag`, `q`, `random`, `limit`) |
| GET | `/api/questions/:id` | full question with all answer layers + rubric |
| POST | `/api/attempts` | record a practice attempt (notes, `selfScore` 0–4, reflection) |
| GET | `/api/attempts` | list attempts (optional `questionId`) |
| POST | `/api/mock/sessions` | create a mock session; auto-picks questions by focus areas |
| GET | `/api/mock/sessions` | list sessions |
| GET | `/api/mock/sessions/:id` | session detail with questions |
| POST | `/api/mock/sessions/:sid/items/:iid` | score one mock item |
| POST | `/api/mock/sessions/:id/finish` | finish session (overall rating) |
| GET | `/api/progress` | overview, category coverage, skill breakdown, weak areas |
| GET | `/api/progress/recent-activity` | recent practice + mock events |
| GET | `/api/review-queue` | spaced-repetition items due now + upcoming |

## Content

Questions live in `src/seedData.ts` (canonical TS), transcribed from
`../New project/docs/ds-interview-question-draft-v2.md`. The seed is a representative subset across
all 5 categories; remaining v2 questions follow the same `QuestionInput` shape and can be appended.

## Notes / TODO

- Self-scores are rubric-based (0–4), not "accuracy %". Progress reports `avgScorePct` derived from
  the rubric, not right/wrong correctness.
- Auth is intentionally omitted (single private user). Tables are structured to add a `User`
  relation later without a rewrite.
- SQL dialect in sample answers is Postgres-flavored; adapt for BigQuery/Snowflake as needed.
