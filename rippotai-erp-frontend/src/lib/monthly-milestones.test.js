import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyMilestones } from "./monthly-milestones.js";
const build = (extra = {}) =>
  buildMonthlyMilestones({
    firstDate: "2027-01-31",
    months: 3,
    percentage: 100,
    contractValue: 1000,
    ...extra,
  });
test("month end stays anchored to the first payment day", () =>
  assert.deepEqual(
    build().map((m) => m.dueDate),
    ["2027-01-31", "2027-02-28", "2027-03-31"],
  ));
test("leap year and year rollover", () =>
  assert.deepEqual(
    build({ firstDate: "2023-12-31", months: 4 }).map((m) => m.dueDate),
    ["2023-12-31", "2024-01-31", "2024-02-29", "2024-03-31"],
  ));
test("shares and amounts reconcile with final rounding balance", () => {
  const rows = build({ months: 23, percentage: 65, contractValue: 543210.12 });
  assert.equal(
    rows.reduce((s, m) => s + Math.round(m.percentage * 100), 0),
    6500,
  );
  assert.equal(
    rows.reduce((s, m) => s + Math.round(m.amount * 100), 0),
    Math.round(543210.12 * 65),
  );
});
test("appending monthly payments cannot reuse a milestone code", () =>
  assert.deepEqual(
    build({ existingCodes: ["MONTH1", "month3"] }).map((m) => m.code),
    ["MONTH2", "MONTH4", "MONTH5"],
  ));
test("invalid dates, fractional counts and invalid allocations are rejected", () => {
  for (const options of [
    { firstDate: "2027-02-30" },
    { months: 0 },
    { months: 1.5 },
    { months: 121 },
    { percentage: 0 },
    { percentage: 101 },
  ])
    assert.throws(() => build(options));
});
