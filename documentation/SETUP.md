# Local Development Setup

## Prerequisites

- Node.js (LTS) + npm
- A MySQL server (schema name currently hardcoded as `spsyn8lm_rippotai_erp` in `backend/src/config/database.config.ts` — you may want to parameterize this before running elsewhere)

## 1. Backend (`backend/`)

```bash
cd backend
npm install
```

### Required environment variables

No `.env.example` exists in the repo — these are reconstructed from source and **should be verified with the team**:

| Variable | Used in | Notes |
|---|---|---|
| `DB_HOST` | `config/database.config.ts` | defaults to `localhost` if unset |
| `DB_PORT` | `config/database.config.ts` | defaults to `3306` |
| `DB_USER` | `config/database.config.ts` | **required, no default** |
| `DB_PASS` | `config/database.config.ts` | **required, no default** |
| `JWT_SECRET` | `auth/auth.service.ts` | **required** — signs/verifies all JWTs |
| `CDN_INTERNAL_SECRET` | `common/guards/cdn.guard.ts` | shared secret checked against the `X-CDN-Secret` header on CDN-guarded routes |
| `PORT` | `main.ts` | defaults to `5000` |
| `NODE_ENV` | `main.ts`, `database.config.ts` | `development` enables Sequelize query logging |

The database name itself (`spsyn8lm_rippotai_erp`) is **hardcoded**, not read from an env var — flag this if you need a different DB name locally.

### Database schema

`synchronize: false` is set on the Sequelize connection, meaning **Nest will not auto-create tables** — you need the schema pre-loaded. The root-level `db.sql` covers most but not all tables (see the gap noted in the top-level README); there's no visible `migrations/` folder, so confirm with the team how schema changes are currently tracked and applied.

### Run it

```bash
npm run start:dev   # nest start --watch, http://localhost:5000/api/v1
```

Other scripts: `npm run build`, `npm run lint`, `npm run test` / `test:watch` / `test:cov` / `test:e2e`.

## 2. Frontend (`vendor-quote/`)

```bash
cd vendor-quote
npm install
```

### Environment

`lib/config.js` switches `API_URL` based on `process.env.NODE_ENV`:
- development → `http://localhost:5000/api/v1`
- production → `https://erp-api.rippotaiarchitecture.com/api/v1`

There's also a Vite env var read directly in the API layer:

| Variable | Used in | Purpose |
|---|---|---|
| `VITE_CDN_TOKEN` | `api/*.api.js` (`prepareHeaders`) | sent as `x-cdn-secret` header, matched against backend's `CDN_INTERNAL_SECRET` |

### Run it

```bash
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # production build
npm run preview   # preview a production build locally
npm run lint       # oxlint
```

The backend's CORS config (`main.ts`) explicitly allows `http://localhost:5173`, `:3000`, and `:3001`, plus the production frontend origin — if you run the dev server on a different port, add it there.

## Running both together

1. Start MySQL and load the schema.
2. Start the backend (`npm run start:dev` in `backend/`) — confirm it logs `Rippotai ERP API running on http://localhost:5000/api/v1`.
3. Start the frontend (`npm run dev` in `vendor-quote/`) — it will hit `localhost:5000` automatically in dev mode.
4. Log in via `/login` — you'll need at least one seeded `User` row with a bcrypt `password_hash` and a `Role` to sign in successfully.
