# Distributed rate limiting

HTTP admission uses Redis-backed Nest throttler storage. One Lua script updates
each counter, its expiry, and its blocking period atomically using Redis TIME.
No local storage fallback is used. Redis connection/command waits are bounded
at 500 milliseconds; disconnected clients do not queue commands. Unavailable
security storage returns HTTP 503, so Redis availability is required for API traffic.

All replicas must use the same Redis endpoint/database and AUTH_TRACKER_SECRET.
When that secret is unset, JWT_SECRET is used. No random per-process tracker
secret remains. Rotate tracker secrets deliberately because doing so resets
the effective budgets. Set REDIS_URL or REDIS_HOST/REDIS_PORT, with optional
REDIS_PASSWORD and REDIS_DB. Existing explicit rate-limit environment overrides
still take precedence over defaults; lower AUTH_IP_RATE_LIMIT_MAX to 20 if an
older deployment explicitly sets it to 120.

The default auth-entry ceiling is 20 requests per IP per minute across routes,
in addition to the existing per-route IP+identity ceiling of 10. Rotating email
addresses or alternating login and forgot-password does not reset the IP budget.
Token-administration endpoints retain their separate session-tracker budget.
Configure TRUST_PROXY for the actual proxy topology; spoofed forwarding headers
are ignored unless the sender is trusted.

Login failures are keyed by normalized email, independently of IP. The fifth
failure triggers a 30-second cooldown; further failures after each cooldown
double that delay up to 15 minutes. Requests during an active cooldown neither
perform bcrypt/database login work nor extend the cooldown. Successful login
clears prior failures. State expires after 15 minutes without new failures.
This behavior applies to unknown accounts too and never disables users in SQL.
Login cooldowns return 429 and Retry-After; CAPTCHA is not required or introduced.

Regular HTTP unit tests substitute a test-local storage provider. To exercise
the real Lua scripts against Redis with random temporary keys:

```powershell
$env:RUN_REDIS_SECURITY_TESTS = '1'
node -r dotenv/config node_modules/jest/bin/jest.js --runInBand redis-security.integration.spec.ts
```

Run from backend/. The tests create two independent clients, race shared
counters, check expiry and progressive account cooldowns, and remove only their
own test keys. They never flush the database or use real account identifiers.
