import test from "node:test";
import assert from "node:assert/strict";
import { appAlert, appConfirm, appPrompt, getDialog, resolveDialog, subscribeDialogs } from "./app-dialog.js";

test("dialogs queue requests, preserve cancellation values, and ignore stale responses", async () => {
  let notifications = 0;
  const unsubscribe = subscribeDialogs(() => notifications++);
  const confirmation = appConfirm("Delete this record?");
  const first = getDialog();
  const prompt = appPrompt("Reason", "Original reason");
  const alert = appAlert("Complete");
  assert.equal(getDialog(), first);
  resolveDialog(first.id, false);
  assert.equal(await confirmation, false);
  assert.equal(getDialog().defaultValue, "Original reason");
  resolveDialog(first.id, true);
  assert.equal(getDialog().type, "prompt");
  resolveDialog(getDialog().id, null);
  assert.equal(await prompt, null);
  assert.equal(getDialog().message, "Complete");
  resolveDialog(getDialog().id, true);
  await alert;
  assert.equal(getDialog(), null);
  assert.equal(notifications, 6);
  unsubscribe();
});

test("prompt returns an empty submitted string separately from cancellation", async () => {
  const prompt = appPrompt("Optional notes");
  resolveDialog(getDialog().id, "");
  assert.equal(await prompt, "");
});
