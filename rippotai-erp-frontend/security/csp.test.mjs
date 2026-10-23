import { test } from "node:test";
import assert from "node:assert/strict";
import { productionCsp } from "./csp.mjs";

test("production CSP forbids inline scripts and eval", () => {
  const policy = productionCsp();
  assert.equal(
    policy.split("; ").find((part) => part.startsWith("script-src")),
    "script-src 'self'",
  );
  assert.ok(!policy.includes("unsafe-eval"));
  assert.ok(policy.includes("object-src 'none'"));
});
test("allows the configured API and websocket origins without wildcard connections", () => {
  const policy = productionCsp({
    VITE_BACKEND_URL: "https://custom.example/api/v1",
  });
  assert.ok(policy.includes("https://custom.example wss://custom.example"));
  assert.ok(!policy.includes("connect-src *"));
  assert.throws(() =>
    productionCsp({ VITE_BACKEND_URL: "javascript:alert(1)" }),
  );
});
