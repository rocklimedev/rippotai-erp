# Password policy and recovery

On 2026-10-15 the requesting stakeholder approved **12 characters** as the
minimum for newly set passwords. The review's recommendation was not treated
as a previously approved policy.

The server enforces the same minimum on password reset, authenticated password
change, administrator provisioning, and administrator password edits. Signup
remains disabled; its DTO also uses the shared minimum. There are no character
composition rules or periodic forced rotations. Passwords are not trimmed.
New passwords exceeding 72 UTF-8 bytes are rejected to prevent bcrypt truncation;
this includes multi-byte Unicode input. Frontend forms show the same limits.

Existing hashes are unchanged. Login does not apply the new length rule or call
the breach service, so existing passwords remain usable, subject to the existing
enabled-account and email-verification requirements. New/reset passwords use
the existing bcrypt cost of 10.

## Breached-password screening

New passwords are checked server-side using the
[Pwned Passwords range API](https://haveibeenpwned.com/API/v3#PwnedPasswords).
Only the first five hexadecimal characters of the password's SHA-1 digest are
sent over HTTPS. The full password and digest are never sent. Responses request
`Add-Padding: true`; zero-count padded matches are ignored. This SHA-1 operation
is exclusively for the lookup, not password storage. No API key is required.

The backend needs outbound HTTPS access to `api.pwnedpasswords.com`. Requests
have a three-second timeout and reject redirects. Breached passwords receive
HTTP 400. An unavailable, malformed, or timed-out screening response returns
HTTP 503 and defers the new password write rather than silently skipping the
check. Login remains available during outages. A reset link is not consumed by
screening failure and can be retried while it is valid. Tests mock screening;
they never send passwords to an external service.

## Recovery and abuse controls

Forgot-password responses are generic for known and unknown accounts, including
email delivery failure. Only SHA-256 digests of random 256-bit reset tokens are
stored; links expire after one hour. Reset token input must be 64 lowercase hex
characters. Successful reset atomically updates the password, consumes outstanding
reset tokens, and revokes sessions. The account remains subject to email
verification and enabled-state checks; resetting does not create a session.

Reset rechecks token state and expiration after screening/hashing under database
row locks. Concurrent reuse of the same token cannot change the password twice.

Login, disabled signup, forgot-password, reset-password, and change-password use
authentication-entry throttling. `AUTH_RATE_LIMIT_MAX` defaults to 10 per 60-second
identity/IP window and `AUTH_IP_RATE_LIMIT_MAX` defaults to 20 across auth-entry routes per IP.
The identity is a shared-secret HMAC, never the raw email/token. Reset attempts
are keyed by the reset token; an injected email cannot change that identity.
The IP budget also bounds attempts that rotate tokens. A 429 includes Retry-After.

Redis stores the rate counters atomically across replicas and restarts. Login
failures also have a temporary per-account cooldown after five failures, starting
at 30 seconds and doubling to a 15-minute cap. Unknown accounts follow the same
policy. Redis outages reject admission with 503 rather than disabling protection.

`npm test` covers length and UTF-8 byte boundaries, breached/padded results,
screening outages, legacy password login, enforcement on every password write,
reset expiry/replay/concurrency, generic forgot-password responses, per-identity
throttling, rotating-token IP throttling, and ignored spoofed forwarding headers.
