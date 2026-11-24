# Browser session policy

Access JWTs and their revocable database sessions expire after 24 hours.
The API rejects a session after 24 hours without an authenticated request,
using `last_used_at` (or creation time for a session not yet used). JWTs with a
longer lifetime, including previously issued seven-day tokens, are rejected.
Role and permission grants are loaded from the database on authenticated
requests; client-provided claims do not authorize operations.

The frontend stores the bearer token in tab-scoped `sessionStorage`, with only
the user ID as persisted identity metadata. It fetches `/auth/me` before
restoring the signed-in UI. Roles and permission lists remain in memory.
Live same-origin tabs share the active token through BroadcastChannel before
rendering, so opening another tab does not require another login. User activity
and logout are synchronized for the same token. Credentials remain in
sessionStorage; closing all tabs ends this sharing. Each new tab still validates
the session through `/auth/me` and loads current permissions from the API.
Legacy localStorage tokens and identity objects are discarded on startup.
24 hours without user input also ends the browser session, even when
background requests would otherwise keep the server session active.
Expiry/logout clears drafts and the RTK Query cache.

This implements a one-day lifetime and idle timeout. It does not implement
refresh cookies or automatic renewal: users must sign in again after expiry.
SessionStorage is still readable by same-origin JavaScript, so the frontend
production build includes a CSP that blocks inline/eval scripts. The policy is
generated from `VITE_BACKEND_URL`; additional API/CDN fetch origins can be listed
in `VITE_CSP_CONNECT_ORIGINS` (comma-separated origins) at build time. PWA
registration is an external script to comply with the CSP. Development keeps
Vite's normal hot-reload behavior. Prefer serving the same CSP as an HTTP header
at the frontend host, and set `frame-ancestors 'none'` there (not supported by
meta CSP). Backend Helmet headers alone cannot protect a separately hosted UI.

Deploy backend and frontend together. Sign in again to receive a one-day token;
existing shorter tokens keep their original expiry.
