# Rippotai ERP frontend

Review owner: ERP frontend maintainers
Last reviewed: 2026-10-10

React 19 SPA built with Vite, Redux Toolkit Query, React Router, Tailwind and Radix UI. This is the ERP frontend; `vendor-quote` is a separate application.

- Install: `npm ci`
- Development: `npm run dev`
- Production build: `npm run build` (outputs `dist`)
- Preview production build: `npm run preview`
- BOQ access tests: `node --test src/lib/boq-access.test.js`

Command Center consumes `/command-center` through `src/api/projects/command-center.api.js`. Its portfolio and dashboard freshness is governed by the API's [read models](../documentation/dashboard-read-models.md). The server remains authoritative for mutation permissions. BOQ workspace ownership and workflow button visibility are derived from the authenticated user and BOQ creator.

See `src/lib/config.js` and `src/store/baseApi.js` for API connection configuration; do not commit credentials in environment files.
