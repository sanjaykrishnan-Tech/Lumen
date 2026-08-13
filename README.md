# Lumen

Mini analytics platform (Mixpanel-style) — SDK, real-time pipeline, dashboard.

## Structure

```
apps/
  dashboard/   React + TS + Tailwind + Recharts dashboard (Phase 1-2)
  backend/     Node/Express ingestion + Postgres + Socket.io (Phase 3)
packages/
  shared-types/  AnalyticsEvent/EventFilter/DataService types shared by dashboard + backend
  sdk/           Tracking SDK (Phase 4)
```

## Status

Phase 3 done: real ingestion API (Postgres-backed) with Socket.io real-time push. The
dashboard talks to the real backend by default; a mock data service is still available
for offline/demo use (see `VITE_USE_MOCK` below).

## Roadmap

See project plan — later phases add the SDK, a demo app generating live events, and
production-style concerns (Redis caching, dedup, rate limiting, rollups) once there's a
concrete bottleneck to point to.

## Development

Requires Docker (for Postgres) and Node matching `.nvmrc` (`nvm use`).

```
yarn install

yarn db:up        # start Postgres
yarn db:migrate   # create the events table
yarn db:seed       # backfill ~2500 realistic historical events

yarn dev:backend   # http://localhost:4000
yarn dev:dashboard # http://localhost:5173
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and `apps/dashboard/.env.example`
to `apps/dashboard/.env` to customize ports/URLs. Set `VITE_USE_MOCK=true` in the
dashboard's `.env` to run against the built-in mock data service instead of the backend.

### API

- `GET /api/events?eventTypes=a,b&search=foo&from=ISO&to=ISO` — query events
- `POST /api/events` with `{ "events": [{ "eventType", "userId", "properties"?, "timestamp"? }] }` — ingest a batch; broadcasts each event over Socket.io on success
