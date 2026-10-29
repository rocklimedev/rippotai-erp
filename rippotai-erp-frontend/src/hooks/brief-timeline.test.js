import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProjectBrief, buildProjectBriefPayload } from "./brief-form-helpers.js";
import { BRIEF_SECTIONS } from "./brief-sections.js";

test("timeline presets save and exclude hidden flexible dates", () => {
  for (const expectedTimeline of ["3-6 months", "6-12 months", "12-18 months"]) {
    const values = normalizeProjectBrief({ expectedTimeline, desiredStartDate: "2026-11-01", siteHandoverDate: "2027-01-01" });
    const payload = buildProjectBriefPayload("project", values);
    assert.equal(payload.expectedTimeline, expectedTimeline);
    assert.equal(payload.desiredStartDate, null);
    assert.equal(payload.siteHandoverDate, null);
  }
});

test("flexible and legacy briefs preserve the existing date fields", () => {
  const values = normalizeProjectBrief({ desiredStartDate: "2026-11-01", siteHandoverDate: "2027-01-01" });
  assert.equal(values.expectedTimeline, "Flexible");
  const payload = buildProjectBriefPayload("project", values);
  assert.equal(payload.desiredStartDate, "2026-11-01");
  assert.equal(payload.siteHandoverDate, "2027-01-01");
  const fields = BRIEF_SECTIONS.find((section) => section.key === "timeline").fields;
  for (const key of ["desiredStartDate", "siteHandoverDate"]) {
    assert.deepEqual(fields.find((field) => field.key === key).showWhen, { field: "expectedTimeline", value: "Flexible" });
  }
});
