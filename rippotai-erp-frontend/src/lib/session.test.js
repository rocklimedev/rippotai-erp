import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getSessionToken,
  persistSession,
  initializeSession,
  clearStoredSession,
} from "./session.js";

function storage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i],
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}
beforeEach(() => {
  globalThis.sessionStorage = storage();
  globalThis.localStorage = storage();
});
function token(lifetime = 1200) {
  const iat = Math.floor(Date.now() / 1000);
  return `header.${btoa(JSON.stringify({ iat, exp: iat + lifetime }))}.signature`;
}
test("stores only an ID and keeps credentials out of localStorage", () => {
  const jwt = token();
  persistSession(jwt, {
    id: "staff",
    permissions: ["users:create"],
    roleName: "ADMIN",
  });
  assert.equal(localStorage.length, 0);
  assert.deepEqual(JSON.parse(sessionStorage.getItem("bc_user")), {
    id: "staff",
  });
  assert.equal(getSessionToken(), jwt);
});

test("accepts a fresh API token when the browser clock is behind", () => {
  const browserNow = Date.now();
  const iat = Math.floor(browserNow / 1000) + 120;
  const jwt = `header.${btoa(JSON.stringify({ iat, exp: iat + 1200 }))}.signature`;
  persistSession(jwt, { id: "staff" });
  assert.equal(getSessionToken(sessionStorage, browserNow), jwt);
  assert.equal(sessionStorage.getItem("bc_token"), jwt);
});
test("expires idle and hard-expired sessions and clears their drafts", () => {
  persistSession(token(), { id: "staff" });
  localStorage.setItem("bc.draft.staff.form", "client data");
  assert.equal(getSessionToken(sessionStorage, Date.now() + 600_000), null);
  assert.equal(localStorage.length, 0);
  const jwt = token();
  persistSession(jwt, { id: "staff" });
  sessionStorage.setItem("bc_activity", String(Date.now() + 1200_000));
  assert.equal(getSessionToken(sessionStorage, Date.now() + 1200_000), null);
});
test("rejects old week-long tokens and purges the old credential cache", () => {
  persistSession(token(7 * 86400), { id: "staff" });
  assert.equal(getSessionToken(), null);
  localStorage.setItem("bc_token", "old-token");
  localStorage.setItem("bc_user", '{"permissions":["users:create"]}');
  initializeSession();
  assert.equal(localStorage.getItem("bc_token"), null);
  assert.equal(localStorage.getItem("bc_user"), null);
});
test("logout removes all session metadata and drafts while preserving preferences", () => {
  persistSession(token(), { id: "staff" });
  localStorage.setItem("theme", "dark");
  localStorage.setItem("bc.scope-of-work.new", "legacy client data");
  clearStoredSession();
  assert.equal(sessionStorage.length, 0);
  assert.equal(localStorage.length, 1);
  assert.equal(localStorage.getItem("theme"), "dark");
});
