# Deployment

## Backend

Deployed as a Docker image via GitHub Actions (`.github/workflows/rippotai-erp-backend-deploy.yml`), triggered on push to `main` when files under `backend/**` change.

Pipeline:

1. Build a Docker image from `./backend` and push to `ghcr.io/rocklimedev/rippotai-erp-api:latest`.
2. SSH into the production VPS and run `docker compose pull backend && docker compose up -d backend --force-recreate --remove-orphans` inside `/opt/apps/rippotai-erp-api`.

### `docker-compose.yml`

```yaml
services:
  backend:
    image: ghcr.io/rocklimedev/rippotai-erp-api:latest
    restart: always
    ports:
      - "5002:5000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: 5000
```

- Host port **5002** maps to container port **5000**.
- All secrets (`DB_*`, `JWT_SECRET`, `CDN_INTERNAL_SECRET`) are expected in a `.env` file on the VPS next to the compose file — not committed to the repo.
- Required GitHub Actions secrets: `RIPPOTAIERPAPI_GHCR_TOKEN` (GHCR auth) and `VPS_SSH_KEY`.

## Frontend

No deploy workflow was found for `vendor-quote/` in `.github/workflows/` — the production API URL hardcoded in `lib/config.js` (`https://erp-api.rippotaiarchitecture.com/api/v1`) and the CORS-allowed origin `https://vendors-quote.rippotaiarchitecture.com` in the backend both imply it's deployed separately (static hosting — Vercel/Netlify/similar, given a Vite app), but confirm the actual hosting setup and CI with whoever owns that piece.

## CORS

HTTP and Socket.IO share the approved origins in `backend/src/common/security/cors.config.ts`:

- `http://localhost:5173`, `http://localhost:3000`, `http://localhost:3001`
- `https://vendors-quote.rippotaiarchitecture.com`
- `https://rippotai-erp-qga2.vercel.app`
- `https://inos.rippotaiarchitecture.com`

Add new frontend deployment origins to this list and restart the backend. Both transports enable credentials and use this list in development and production, including the Redis Socket.IO adapter. Gateway options cannot override the Redis adapter's origin policy.

The local public `/cdn` static-file fallback separately permits `Access-Control-Allow-Origin: *` so image exports can draw uploaded photos. CORS governs browser HTTP access, including Socket.IO polling; notification connections still require a valid token.


See [Confidential file access and migration](confidential-files.md) for private-storage settings, expiring access, and the required inventory and cache-purge procedure.


Heavy PDF/Excel generation requires a separately supervised export worker. See [Export workers](export-workers.md) for the Redis queue, 202 protocol, concurrency/resource limits and rollout instructions.
