import test from "node:test";
import assert from "node:assert/strict";
import { acquirePrivateImage } from "./private-image.js";

test("shares measuring/visible downloads, limits concurrency, and releases blobs", async () => {
  const originalFetch = globalThis.fetch;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let active = 0;
  let peak = 0;
  let calls = 0;
  const revoked = [];
  globalThis.fetch = async () => {
    calls++;
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setImmediate(resolve));
    active--;
    return { ok: true, blob: async () => new Blob(["photo"]) };
  };
  URL.createObjectURL = () => `blob:${calls}`;
  URL.revokeObjectURL = (url) => revoked.push(url);
  try {
    const leases = Array.from({ length: 8 }, (_, i) => acquirePrivateImage(`https://cdn/private-${i}.jpg`));
    const duplicate = acquirePrivateImage("https://cdn/private-0.jpg");
    assert.equal(duplicate.promise, leases[0].promise);
    await Promise.all(leases.map((lease) => lease.promise));
    assert.equal(calls, 8);
    assert.equal(peak, 2);
    leases.forEach((lease) => lease.release());
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(revoked.length, 7);
    duplicate.release();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(revoked.length, 8);
  } finally {
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test("retries server failures but does not retry expired signatures", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => ({ ok: false, status: ++calls < 3 ? 500 : 403 });
  const lease = acquirePrivateImage("https://cdn/retry.jpg");
  try {
    await assert.rejects(lease.promise, /403/);
    assert.equal(calls, 3);
  } finally {
    lease.release();
    globalThis.fetch = originalFetch;
  }
});
