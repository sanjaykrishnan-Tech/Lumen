# Lumen

Mini analytics platform (Mixpanel-style) — SDK, real-time pipeline, dashboard.

## Structure

```
apps/
  dashboard/   React + TS + Tailwind + Recharts dashboard (Phase 1-2)
  backend/     Node/Express ingestion + Postgres + Socket.io (Phase 3)
  demo-app/    Task management app that fires real events via @lumen/sdk (Phase 5)
packages/
  shared-types/  AnalyticsEvent/EventFilter/DataService types shared by dashboard + backend
  sdk/           @lumen/sdk tracking SDK — init()/track(), auto-batched, offline queue (Phase 4)
```

## Status

Phase 5 done: a small task management app (`apps/demo-app`) uses `@lumen/sdk` to fire
real events — `page_view`, `task_created`, `task_completed`, `task_reopened`,
`task_deleted`, and filter-tab clicks — so the dashboard now has genuine, SDK-driven
traffic instead of only synthetic/seeded data.

## Roadmap

See project plan — remaining work is production-style concerns (Redis caching, dedup,
rate limiting, rollups) once there's a concrete bottleneck to point to.

## Development

Requires Docker (for Postgres) and Node matching `.nvmrc` (`nvm use`).

```
yarn install
yarn build:sdk    # dashboard and demo-app both depend on the built @lumen/sdk output

yarn db:up        # start Postgres
yarn db:migrate   # create the events table
yarn db:seed       # backfill ~2500 realistic historical events

yarn dev:backend   # http://localhost:4000
yarn dev:dashboard # http://localhost:5173
yarn dev:demo      # http://localhost:5174 — generates real SDK events as you use it
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and `apps/dashboard/.env.example`
to `apps/dashboard/.env` to customize ports/URLs. Set `VITE_USE_MOCK=true` in the
dashboard's `.env` to run against the built-in mock data service instead of the backend.

### API

- `GET /api/events?eventTypes=a,b&search=foo&from=ISO&to=ISO` — query events
- `POST /api/events` with `{ "events": [{ "eventType", "userId", "properties"?, "timestamp"? }] }` — ingest a batch; broadcasts each event over Socket.io on success

### SDK (`@lumen/sdk`)

```ts
import { init, track } from '@lumen/sdk'

init({ apiUrl: 'http://localhost:4000', batchSize: 10, flushIntervalMs: 5000 })
track('page_view', { page: '/pricing' })
```

Or via a plain `<script>` tag using the IIFE build (`dist/index.global.js`), which
exposes a global `Lumen` object with the same `init`/`track`/`flush` API.

Events are queued in memory and localStorage, flushed once `batchSize` is reached or
`flushIntervalMs` elapses, and left in the queue to retry on the next flush if the
request fails — so events survive a page reload while offline.

Build it with `yarn workspace @lumen/sdk build` (outputs to `packages/sdk/dist`).
