import test from "node:test";
import assert from "node:assert/strict";
import { fillSharedProjectFields } from "./shared-project-data.js";

test("fills blanks, preserves manual values, false and zero", () => {
  const fields = {
    address: "siteAddress",
    lift: "liftAvailable",
    floors: "numberOfFloors",
  };
  assert.deepEqual(
    fillSharedProjectFields(
      { address: " " },
      { siteAddress: "Site A", liftAvailable: false, numberOfFloors: 0 },
      fields,
    ),
    { address: "Site A", lift: false, floors: 0 },
  );
  const current = { address: "Manual", lift: false, floors: 0 };
  assert.equal(
    fillSharedProjectFields(
      current,
      { siteAddress: "Other", liftAvailable: true, numberOfFloors: 3 },
      fields,
    ),
    current,
  );
});
