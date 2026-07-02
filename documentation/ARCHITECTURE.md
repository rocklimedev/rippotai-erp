# Architecture

## Stack

| Layer | Tech |
|---|---|
| Backend framework | NestJS (TypeScript) |
| ORM | Sequelize, via `sequelize-typescript` decorators |
| Database | MySQL (`mysql2` driver) |
| Auth | JWT (`jsonwebtoken` + `passport-jwt`), bcrypt password hashing |
| Realtime | Socket.IO (`@nestjs/platform-socket.io`, `@nestjs/websockets`) |
| File transfer | `ssh2-sftp-client` (see `backend/common.md` — CDN/SFTP integration) |
| Frontend framework | React (Vite) |
| Frontend state | Redux Toolkit + **RTK Query** (`@reduxjs/toolkit/query/react`) — not plain `react-query`/`swr` despite those being listed as deps |
| Routing | `react-router-dom` v6-style, with a custom route-config layer |
| UI kit | Radix UI primitives + `class-variance-authority`/`tailwind-merge` (shadcn-style), Tailwind CSS |
| Forms | `react-hook-form` + `zod` (via `@hookform/resolvers`) |
| Charts | `recharts` (used on Reports/Dashboard) |

## High-level request flow

```
Browser (React SPA)
   │  axios / RTK Query fetchBaseQuery
   │  Authorization: Bearer <JWT>
   ▼
NestJS API  (global prefix /api/v1)
   │  ValidationPipe (whitelist, transform)
   │  JwtAuthGuard on protected routes
   ▼
Sequelize models  ──▶  MySQL
   │
   └─▶ NotificationBroadcastService ──▶ Socket.IO gateway ──▶ connected clients (/notifications namespace)
```

## Backend module boundaries

The NestJS app is organized as one `AppModule` importing 10 feature modules under `backend/src/modules/`:

```
auth          — login, JWT tokens, verification tokens
rbac          — roles, permissions, role-permissions
users         — user accounts, signatures
vendors       — vendor directory, categories, business types
projects      — project directory
quotations    — quotations, items, versions
reports       — read-only aggregate/analytics queries
settings      — key/value app settings
engagement    — activity logs + notifications (+ websocket gateway)
metas         — units of measurement
```

Each module follows the standard Nest shape: `*.module.ts` wires together one or more `*.controller.ts` + `*.service.ts` pairs, with Sequelize models under `models/` and validation DTOs under `dto/`.

Cross-module references are common and expected in this domain — e.g. `Quotation` belongs to both `Project` and `Vendor`; `AuthToken`/`ActivityLog`/`Notification` all belong to `User`. See each module doc's "Data models" section for the exact `BelongsTo`/`HasMany` relations.

## Frontend structure

```
vendor-quote/src/
├── api/          RTK Query "slice" per domain (one createApi() per file)
├── concepts/     Page-level components (one folder per domain, roughly 1:1 with backend modules)
├── components/   Reusable UI — common/, ui/ (shadcn primitives), and per-domain feature components
├── router/       Route config (routes/*.routes.jsx) + Router.jsx + PrivateRoute.jsx
├── store/        Redux store setup + useAuth() hook
├── hooks/        Misc hooks (toast, notification socket)
├── lib/          config (API_URL), socket.js (Socket.IO client), utils (cn())
└── App.jsx       Entry component
```

The frontend intentionally mirrors the backend's domain boundaries: `concepts/quotations` + `api/quotation.api.js` + `router/routes/quotation.routes.jsx` together implement the same "Quotations" feature the backend's `quotations` module exposes.

## Auth model

Stateless JWTs augmented with a server-side revocation check (see [backend/auth.md](./backend/auth.md)) — every authenticated request re-validates the token's hash against the `auth_tokens` table, so logout / "revoke all sessions" actually work despite using JWTs. The frontend stores the raw JWT in `localStorage` (key `token`) and reads the current user via `GET /auth/me` (`useAuth()` hook, backed by RTK Query's `useMeQuery`).

## Realtime notifications

`NotificationBroadcastService` (backend) pushes events over a Socket.IO `/notifications` namespace, keyed by `userId`. The frontend connects via `lib/socket.js` and consumes it through the `useNotificationSocket` hook, feeding the notification bell UI (`components/notification/`).
