import { clearLocalDrafts } from "./draft-storage.js";

export const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
export const ACCESS_LIFETIME_MS = 20 * 60 * 1000;

export function clearStoredSession(
  storage = sessionStorage,
  drafts = localStorage,
) {
  const hadSession = Boolean(storage.getItem("bc_token"));
  storage.removeItem("bc_token");
  storage.removeItem("bc_user");
  storage.removeItem("bc_activity");
  clearLocalDrafts(drafts);
  if (hadSession && typeof window !== "undefined") {
    window.dispatchEvent(new Event("bc:session-ended"));
  }
}

export function persistIdentity(user, storage = sessionStorage) {
  // Connector queries need an ID. Roles and permissions stay in memory and
  // must be fetched again from the authenticated /auth/me endpoint on reload.
  storage.setItem("bc_user", JSON.stringify({ id: user.id }));
}

export function persistSession(token, user, storage = sessionStorage) {
  storage.setItem("bc_token", token);
  storage.setItem("bc_activity", String(Date.now()));
  persistIdentity(user, storage);
}

export function getSessionToken(storage = sessionStorage, now = Date.now()) {
  const token = storage.getItem("bc_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    const expiry = payload.exp * 1000;
    const issued = payload.iat * 1000;
    const activity = Number(storage.getItem("bc_activity"));
    if (
      !Number.isFinite(expiry) ||
      !Number.isFinite(issued) ||
      expiry <= now ||
      issued > now ||
      expiry <= issued ||
      expiry - issued > ACCESS_LIFETIME_MS ||
      !activity ||
      now - activity >= IDLE_TIMEOUT_MS
    )
      throw new Error("Expired session");
    return token;
  } catch {
    clearStoredSession(storage);
    return null;
  }
}

export function initializeSession() {
  // Never migrate an old, week-long token or cached authorization claims.
  if (localStorage.getItem("bc_token") || localStorage.getItem("bc_user")) {
    localStorage.removeItem("bc_token");
    localStorage.removeItem("bc_user");
    clearLocalDrafts();
  }
  getSessionToken();
}
