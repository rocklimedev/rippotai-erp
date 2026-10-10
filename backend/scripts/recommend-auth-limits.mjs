// Reads exported JSON-line telemetry. Prints recommendations, never edits configuration.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

assert.ok(process.argv[2], 'Usage: node scripts/recommend-auth-limits.mjs traffic.jsonl');
const rows = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  .filter((row) => row.event === 'security.traffic_window' && row.windowMs === 60000);
// Throttled traffic is censored; attack-heavy windows should not inflate normal-use limits.
const healthy = rows.filter((row) => row.requests > 0 && row.throttled === 0 && !row.trackingTruncated && row.failures / row.requests <= 0.05 && row.observedWindowMs >= 54000);
const entries = healthy.filter((row) => /\bauth\/(login|signup|forgot-password|reset-password)$/.test(row.route));
const tokens = healthy.filter((row) => /\bauth\/tokens(?:\/|$)/.test(row.route));
function percentile(values, fraction) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  assert.ok(sorted.length, 'No usable telemetry samples');
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
function recommendation(samples, field, floor) {
  if (samples.length < 30) return { status: 'insufficient_observations', healthyWindows: samples.length };
  const observedP99 = percentile(samples.map((row) => row[field]), 0.99);
  return { status: 'review_required', healthyWindows: samples.length, observedP99, suggestedLimitPerMinute: Math.max(floor, Math.ceil(observedP99 * 2)) };
}
console.log(JSON.stringify({
  policy: 'p99 of healthy per-minute peak traffic with 2x headroom; existing defaults are floors',
  examinedWindows: rows.length, excludedWindows: rows.length - healthy.length,
  AUTH_RATE_LIMIT_MAX: recommendation(entries, 'maxRequestsPerTracker', 10),
  TOKEN_RATE_LIMIT_MAX: recommendation(tokens, 'maxRequestsPerTracker', 120),
  AUTH_IP_RATE_LIMIT_MAX: recommendation([...entries, ...tokens], 'maxRequestsPerIp', 120),
  note: 'Collect representative peak/business-hour traffic across all replicas. Review shared NAT/proxy behavior, failures and blocked attempts before applying. No configuration was changed.',
}, null, 2));
