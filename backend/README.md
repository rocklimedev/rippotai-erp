# Rippotai ERP API

Review owner: ERP backend maintainers
Last reviewed: 2026-10-10

NestJS API with Sequelize/MySQL, JWT authentication, Redis caching and Socket.IO notifications. Source lives in `src`; the HTTP prefix is `/api/v1` and the default port is 5000.

Install dependencies with `npm ci`. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `REDIS_HOST` and `REDIS_PORT` in your local environment. Database configuration currently names `spsyn8lm_rippotai_erp`; schema synchronization is disabled, so provision the schema and apply relevant SQL migrations before running.

- Development: `npm run start:dev`
- Build: `npm run build`
- Production: `npm run start:prod` after building
- Command Center tests: `npx jest --config test/command-center-jest.json --runInBand`

See [dashboard read models](../documentation/dashboard-read-models.md) for projection coverage, freshness, invalidation, fallback and the evaluation of durable projections. See [HTTP security](../documentation/http-security.md) for authentication and public route behavior. SQL migrations are in `migrations`; module code is in `src/modules`.
