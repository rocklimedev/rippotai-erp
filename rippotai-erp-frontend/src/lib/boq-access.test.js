import { test } from "node:test";
import assert from "node:assert/strict";
import { getBoqAccess } from "./boq-access.js";

const owner = { id: "owner", permissions: ["boq:submit", "boq:approve"] };
const boq = { created_by: "owner", status: "draft" };

test("missing actors, unknown ownership and other users have no actions", () => {
  for (const [doc, user] of [
    [boq, null], [boq, { ...owner, id: null }], [boq, { ...owner, id: "other" }],
    [{ ...boq, created_by: null }, owner], [undefined, owner],
  ]) {
    assert.deepEqual(getBoqAccess(doc, user), {
      isOwner: false, canSubmit: false, canApprove: false,
    });
  }
});

test("ownership alone does not grant workflow permissions", () => {
  assert.deepEqual(getBoqAccess(boq, { id: "owner" }), {
    isOwner: true, canSubmit: false, canApprove: false,
  });
  assert.equal(getBoqAccess(boq, { ...owner, permissions: ["boq:approve"] }).canSubmit, false);
  assert.equal(getBoqAccess({ ...boq, status: "awaiting_approval" }, { ...owner, permissions: ["boq:submit"] }).canApprove, false);
});

test("workflow actions require the matching status", () => {
  for (const status of ["draft", "in_progress", "awaiting_approval", "approved", "archived"]) {
    const access = getBoqAccess({ ...boq, status }, owner);
    assert.equal(access.canSubmit, ["draft", "in_progress"].includes(status));
    assert.equal(access.canApprove, status === "awaiting_approval");
  }
});
