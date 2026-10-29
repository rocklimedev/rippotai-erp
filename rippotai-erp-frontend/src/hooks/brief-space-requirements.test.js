import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProjectBrief, buildProjectBriefPayload } from "./brief-form-helpers.js";

test("multiple requirement points round-trip as one space record", () => {
  const values = normalizeProjectBrief({ spaceRequirements: [
    { spaceName: "Kitchen", requirementDetails: "Island counter\nExtra storage\nTask lighting", sortOrder: 0 },
  ] });
  const spaces = buildProjectBriefPayload("project", values).spaceRequirements;
  assert.equal(spaces.length, 1);
  assert.equal(spaces[0].spaceName, "Kitchen");
  assert.equal(spaces[0].requirementDetails, "Island counter\nExtra storage\nTask lighting");
  const reopened = normalizeProjectBrief({ spaceRequirements: spaces });
  assert.deepEqual(reopened.spaceRequirements[0].requirements.split("\n"), [
    "Island counter", "Extra storage", "Task lighting",
  ]);
});

test("existing single requirements remain editable alongside additional points", () => {
  const values = normalizeProjectBrief({ spaceRequirements: [
    { spaceName: "Bedroom", requirementDetails: "Wardrobe", sortOrder: 0 },
  ] });
  values.spaceRequirements[0].requirements += "\nReading nook";
  assert.equal(buildProjectBriefPayload("project", values).spaceRequirements[0].requirementDetails,
    "Wardrobe\nReading nook");
});
