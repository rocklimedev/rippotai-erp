import test from "node:test";
import assert from "node:assert/strict";
import {
  applySavedShortlistEntry,
  createShortlistSaveQueue,
  mergeSavedShortlistRow,
  reconcileConfirmedShortlistRows,
} from "./shortlist-grid.js";

function skeleton() {
  return {
    grid: [
      {
        trade: "Plumber",
        rows: [
          {
            working_type: "Contractor",
            entry_id: null,
            name_of_vendor: null,
            vendor_id: null,
            material_id: null,
            estimate_value: null,
            quotation_value: null,
            is_selected: false,
          },
        ],
      },
    ],
  };
}

test("confirmed vendor and amount edits appear in the initially empty grid row", () => {
  const grid = skeleton();
  applySavedShortlistEntry(grid, {
    id: "entry",
    trade: "Plumber",
    working_type: "Contractor",
    vendor_id: "vendor",
    name_of_vendor: "Vendor A",
    estimate_value: "12500.00",
    quotation_value: "12000.00",
  });
  const row = grid.grid[0].rows[0];
  assert.equal(row.entry_id, "entry");
  assert.equal(row.name_of_vendor, "Vendor A");
  assert.equal(row.estimate_value, "12500.00");
  assert.equal(row.quotation_value, "12000.00");
});

test("material saves use the associated material name and preserve zero amounts", () => {
  const grid = skeleton();
  applySavedShortlistEntry(grid, {
    id: "entry",
    trade: "Plumber",
    working_type: "Contractor",
    material_id: "material",
    material: { name: "Copper pipe" },
    estimate_value: 0,
  });
  assert.equal(grid.grid[0].rows[0].name_of_vendor, "Copper pipe");
  assert.equal(grid.grid[0].rows[0].estimate_value, 0);
});

test("rapid edits to one row save in order instead of overwriting newer input", async () => {
  const queue = createShortlistSaveQueue();
  const grid = skeleton();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const calls = [];
  const first = queue("row", async () => {
    calls.push("first");
    await gate;
    applySavedShortlistEntry(grid, {
      id: "entry",
      trade: "Plumber",
      working_type: "Contractor",
      estimate_value: 100,
    });
  });
  const second = queue("row", async () => {
    calls.push("second");
    applySavedShortlistEntry(grid, {
      id: "entry",
      trade: "Plumber",
      working_type: "Contractor",
      estimate_value: 200,
    });
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["first"]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(calls, ["first", "second"]);
  assert.equal(grid.grid[0].rows[0].estimate_value, 200);
});

test("a failed row save does not block the next edit or another row", async () => {
  const queue = createShortlistSaveQueue();
  const failed = queue("row", async () => {
    throw new Error("Save failed");
  });
  const next = queue("row", async () => "saved");
  const other = queue("other", async () => "other saved");
  await assert.rejects(failed, /Save failed/);
  assert.equal(await next, "saved");
  assert.equal(await other, "other saved");
});

test("an amount-only save does not erase the previously confirmed vendor or material", () => {
  for (const name of ["Vendor A", "Copper pipe"]) {
    const grid = skeleton();
    Object.assign(grid.grid[0].rows[0], {
      entry_id: "entry",
      name_of_vendor: name,
    });
    applySavedShortlistEntry(grid, { id: "entry", estimate_value: 0 });
    assert.equal(grid.grid[0].rows[0].name_of_vendor, name);
    assert.equal(grid.grid[0].rows[0].estimate_value, 0);
  }
});

test("confirmed values remain visible over a stale background read and are released when acknowledged", () => {
  const grid = skeleton();
  const saved = mergeSavedShortlistRow(grid.grid[0].rows[0], {
    id: "entry",
    trade: "Plumber",
    working_type: "Contractor",
    vendor_id: "vendor",
    name_of_vendor: "Vendor A",
    estimate_value: "100.00",
  });
  const confirmed = { "shortlist:Plumber:Contractor": saved };
  assert.deepEqual(
    reconcileConfirmedShortlistRows(confirmed, grid, "shortlist"),
    confirmed,
  );
  applySavedShortlistEntry(grid, { ...saved, id: "entry", trade: "Plumber" });
  grid.grid[0].rows[0].estimate_value = 100;
  assert.deepEqual(
    reconcileConfirmedShortlistRows(confirmed, grid, "shortlist"),
    {},
  );
});

test("successive confirmed saves preserve earlier input and deliberate clears remain cleared", () => {
  const row = skeleton().grid[0].rows[0];
  const material = mergeSavedShortlistRow(row, {
    id: "entry",
    trade: "Plumber",
    material_id: "material",
    name_of_vendor: "Copper pipe",
  });
  const amount = mergeSavedShortlistRow(material, {
    id: "entry",
    quotation_value: 500,
  });
  assert.equal(amount.name_of_vendor, "Copper pipe");
  assert.equal(amount.material_id, "material");
  assert.equal(amount.quotation_value, 500);
  const cleared = mergeSavedShortlistRow(amount, {
    id: "entry",
    name_of_vendor: null,
    material_id: null,
  });
  assert.equal(cleared.name_of_vendor, null);
  assert.equal(cleared.material_id, null);
});

test("amount edit and selection share a queue, so selection cannot race an outstanding save", async () => {
  const queue = createShortlistSaveQueue();
  const calls = [];
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const edit = queue("shortlist:Plumber", async () => {
    calls.push("edit");
    await waiting;
    calls.push("edit saved");
  });
  const select = queue("shortlist:Plumber", async () => {
    calls.push("selection");
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["edit"]);
  release();
  await Promise.all([edit, select]);
  assert.deepEqual(calls, ["edit", "edit saved", "selection"]);
});
