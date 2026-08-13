# Lumen

Mini analytics platform (Mixpanel-style) — SDK, real-time pipeline, dashboard.

## Structure

```
apps/
  dashboard/   React + TS + Tailwind + Recharts dashboard (Phase 1-2)
  backend/     Node/Express ingestion + Postgres + Socket.io (Phase 3)
packages/
  sdk/         Tracking SDK (Phase 4)
```

## Status

Phase 1 in progress: dashboard shell with a mock data service simulating real-time events.

## Roadmap

See project plan — later phases add real ingestion, the SDK, a demo app generating live events, and production-style concerns (Redis caching, dedup, rate limiting, rollups) once there's a concrete bottleneck to point to.

## Development

```
yarn install
yarn dev:dashboard
```
