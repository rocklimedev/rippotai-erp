# Account onboarding and email verification

Decision confirmed by the requesting stakeholder on 2026-10-15:
**disable public signup; administrators provision accounts**.
No runtime setting reopens public signup. The product/business owner and location
for rollout approval have been requested; no external owner has been contacted
or their approval assumed.

The requesting stakeholder also authorized manual administrator verification:
Admin Console → Users offers **Mark verified manually** and **Mark unverified**
without sending email. `PATCH /api/v1/users/:id/email-verification` accepts only
`{ "verified": true }` or `{ "verified": false }`. It requires ADMIN/SUPERADMIN
and `users:update`; it is not available to ordinary staff or public callers.
The server binds verification to the current address, records the administrator
and previous state in the activity log, and revokes existing sessions in one
transaction. It never enables a disabled account or issues a session.

## Intended flow

1. An ADMIN or SUPERADMIN with `users:create` provisions the account through
   user management, with its intended role and enabled/disabled state. The server
   records the authenticated administrator as `created_by`. Neither verification
   state nor role can be chosen through public signup.
2. The administrator provides the user their account details using the
   organization's approved credential-delivery process. Users can use the
   existing forgot-password flow to choose their password. Password reset does
   not verify an email or sign the user in.
3. The user selects **Verify your email** on the sign-in page and requests a link.
   Requests for nonexistent, disabled, or already verified accounts return the
   same generic response; they never create an account.
4. The link opens `/verify-email`. The user explicitly confirms verification
   with a POST, then signs in normally. Successful verification does not issue
   tokens, grant roles, or activate a disabled account.

`POST /api/v1/auth/signup` remains a classified, rate-limited endpoint solely to
reject old clients with HTTP 403. Both frontend registration routes explain that
an administrator must provision the account.

## Security controls

- Password login issues no session until the account is enabled and its current
  email is verified. Authentication of existing sessions checks the same state,
  including WebSocket connections using AuthService.
- Verification uses a random 256-bit token with only its SHA-256 digest stored
  in `verification_tokens`. Links expire after 24 hours and are single-use.
- Tokens are restricted to `email_verification`, the account, and the email at
  issuance. Row locks and one transaction cover verification and consumption.
  Existing sessions are revoked in that transaction, so previously issued
  tokens cannot become usable as a side effect of verification.
  Changed-email, wrong-purpose, disabled-account, expired, and reused links fail.
- The verified email address is stored alongside its timestamp. Changing an
  account's email immediately makes both login and existing sessions fail until
  the new email is verified, even if another code path changes the address.
- Request and confirm endpoints have explicit public classification, DTO
  validation, and authentication-entry rate limits. Links carry secrets in a
  URL fragment rather than a query string.

## Rollout and owner review

Apply `backend/migrations/20261015_email_verification.sql` **before** deploying
the backend. This migration has not been applied by this task. Configure
`FRONTEND_URL`, `BREVO_API_KEY`, `MAIL_FROM`, and `MAIL_NAME` for the target
environment and test delivery with a provisioned pilot account.

Existing accounts are deliberately not marked verified by migration. Their
existing sessions will be rejected and they must complete email verification
before signing in again. The business/product owner should approve the rollout
timing, staff communication, administrator provisioning responsibility, mailbox
recovery process, and support coverage for accounts with inaccessible email.
Administrators can use the audited manual verification action when they choose
not to send a verification email; legacy users do not receive automatic verification.

Validation: `npm test` includes `onboarding.spec.ts`, covering closed signup,
admin-only provisioning, blocked login before verification, hashed delivery,
verification followed by login, expiry, reuse, concurrent replay, changed email,
disabled accounts, wrong-purpose/tampered tokens, and existing-session rejection.
