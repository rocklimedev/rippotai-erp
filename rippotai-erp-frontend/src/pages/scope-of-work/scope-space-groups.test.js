import test from "node:test";
import assert from "node:assert/strict";
import { mergeScopeSpaces, scopeItemsForSpace } from "./scope-space-groups.js";

test("edit mode includes unused project spaces and merges saved spaces once", () => {
  const spaces = mergeScopeSpaces([
    { id: "kitchen", name: "Kitchen", slug: "kitchen" },
    { id: "bedroom", name: "Bedroom" },
  ], [{ id: "kitchen", name: "Kitchen" }, { id: "new", name: "Study" }]);
  assert.deepEqual(spaces.map((space) => space.id), ["kitchen", "bedroom", "new"]);
  assert.equal(spaces[0].slug, "kitchen");
  assert.deepEqual(scopeItemsForSpace([{ project_space_id: "kitchen" }], "bedroom", spaces), []);
});

test("grouping preserves flat item identities and indices for editing and saving", () => {
  const spaces = [{ id: "a" }, { id: "b" }];
  const items = [
    { id: "one", project_space_id: "b", scope_category_id: "civil", scope_of_work: "Tiles" },
    { id: "two", project_space_id: "a", scope_category_id: "wood", scope_of_work: "Storage" },
    { id: "three", project_space_id: "b", is_excluded: true, notes: "Keep notes" },
    { id: "four", project_space_id: "missing" },
  ];
  const grouped = scopeItemsForSpace(items, "b", spaces);
  assert.deepEqual(grouped.map(({ index }) => index), [0, 2]);
  assert.equal(grouped[1].item, items[2]);
  assert.equal(grouped[1].item.is_excluded, true);
  assert.deepEqual(scopeItemsForSpace(items, null, spaces).map(({ index }) => index), [3]);
  assert.equal(items.length, 4);
});
