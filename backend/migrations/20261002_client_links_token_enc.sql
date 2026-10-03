-- Keep an encrypted copy of each client-link token so staff can copy a link again and
-- signed-in clients see their links on /client-home (lookups still use token_hash).
ALTER TABLE client_links ADD COLUMN IF NOT EXISTS token_enc VARCHAR(255) NULL AFTER token_hint;
