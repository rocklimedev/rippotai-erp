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

The backend explicitly allowlists these origins (`main.ts`):

- `http://localhost:5173`, `:3000`, `:3001` (local dev)
- `https://vendors-quote.rippotaiarchitecture.com` (production frontend)

Add any new frontend deployment origin here before it can call the API from the browser.
