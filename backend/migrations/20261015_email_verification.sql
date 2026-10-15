-- Apply before deploying email verification. Do not mark existing users verified:
-- they must prove mailbox ownership through the verification flow.
ALTER TABLE users
  ADD COLUMN email_verified_at DATETIME NULL DEFAULT NULL,
  ADD COLUMN email_verified_address VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE verification_tokens
  ADD COLUMN email VARCHAR(255) NULL DEFAULT NULL;
