import test from "node:test";
import assert from "node:assert/strict";
import { PROJECT_TYPE_OPTIONS, SITE_TYPES_BY_PROJECT, SITE_CONDITIONS_BY_PROJECT, changeBriefSiteField } from "./brief-site-options.js";
import { buildProjectBriefPayload, normalizeProjectBrief } from "./brief-form-helpers.js";

test("brief has exactly three project categories and category-specific options", () => {
  assert.deepEqual(PROJECT_TYPE_OPTIONS.map((item) => item.value), ["RESIDENTIAL", "COMMERCIAL", "INSTITUTIONAL"]);
  for (const { value } of PROJECT_TYPE_OPTIONS) {
    assert.ok(SITE_TYPES_BY_PROJECT[value].some((item) => item.value === "OTHER"));
    assert.ok(SITE_CONDITIONS_BY_PROJECT[value].some((item) => item.value === "OTHER"));
  }
  assert.ok(SITE_TYPES_BY_PROJECT.COMMERCIAL.some((item) => item.value === "HOTEL"));
  assert.ok(!SITE_TYPES_BY_PROJECT.RESIDENTIAL.some((item) => item.value === "HOTEL"));
  assert.ok(!SITE_CONDITIONS_BY_PROJECT.INSTITUTIONAL.some((item) => item.value === "COLD_SHELL"));
});
test("changing category clears incompatible selections and free text", () => {
  const result = changeBriefSiteField({ projectCategory: "RESIDENTIAL", projectType: "legacy-id", siteType: "OTHER", siteTypeOther: "Custom", siteCondition: "OTHER", siteConditionOther: "Custom condition" }, "projectCategory", "COMMERCIAL");
  for (const key of ["projectType", "siteType", "siteCondition", "siteTypeOther", "siteConditionOther"]) assert.equal(result[key], "");
  assert.equal(changeBriefSiteField({ siteTypeOther: "Old" }, "siteType", "OFFICE").siteTypeOther, "");
});
test("category and independent Other details survive save and edit", () => {
  const payload = buildProjectBriefPayload("project-id", { projectCategory: "INSTITUTIONAL", siteType: "OTHER", siteTypeOther: " Museum ", siteCondition: "OTHER", siteConditionOther: " Partial restoration " });
  const restored = normalizeProjectBrief(payload);
  assert.equal(restored.projectCategory, "INSTITUTIONAL");
  assert.equal(restored.siteTypeOther, "Museum");
  assert.equal(restored.siteConditionOther, "Partial restoration");
  assert.equal(buildProjectBriefPayload("project-id", { siteType: "OFFICE", siteTypeOther: "Stale" }).siteTypeOther, null);
});
