import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  comparisonTrades,
  quoteAmount,
  quoteTotal,
  completeQuote,
} from "./vendorComparisonData.js";
import { buildVendorComparisonWorkbook } from "./vendorComparisonExcel.js";
const vendor = {
  id: "v1",
  name: "Vendor A",
  notes: "Includes labour",
  items: [
    { id: "i1", description: "Work", quantity: null, rate: 130000 },
    { id: "i2", description: "Discount", quantity: null, rate: -1000 },
  ],
};
test("lump sums, discounts, explicit zero and incomplete quotes", () => {
  assert.equal(quoteTotal(vendor), 129000);
  assert.equal(quoteAmount({ quantity: 0, rate: 100 }), 0);
  assert.equal(quoteAmount({ quantity: null, rate: null }), null);
  assert.equal(completeQuote(vendor), true);
  assert.equal(completeQuote({ items: [] }), false);
});
test("legacy quotes retain values and finalisation without BOQ fields", () => {
  const trades = comparisonTrades({
    schema_version: 1,
    boq: {
      categories: [
        {
          id: "c1",
          name: "Civil",
          items: [{ id: "i1", description: "Work", quantity: 2 }],
        },
      ],
    },
    selected_vendor_ids: ["v1"],
    vendors: [{ id: "v1", name: "A" }],
    vendor_rates: { i1__v1: "50" },
    finalised_vendors: { c1: "v1" },
  });
  assert.equal(quoteTotal(trades[0].vendors[0]), 100);
  assert.equal(trades[0].finalised_vendor_id, "v1");
  assert.equal(JSON.stringify(trades).includes("boq"), false);
});
test("export has independent quote lines, linked totals and no BOQ block", async () => {
  const trades = [
    {
      id: "t1",
      name: "Civil/Works",
      vendors: [
        vendor,
        {
          id: "v2",
          name: "B",
          items: [
            {
              id: "i3",
              description: "Separate scope",
              quantity: 2,
              rate: 80000,
            },
          ],
        },
      ],
      finalised_vendor_id: "v1",
    },
  ];
  const bytes = await buildVendorComparisonWorkbook(
    await readFile(
      new URL(
        "../../assets/xlsx-templates/vendor-comparison-v2.xlsx",
        import.meta.url,
      ),
    ),
    {
      title: "Comparison",
      projectName: "Project",
      trades,
    },
  );
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  const sheet = wb.worksheets[1];
  assert.equal(sheet.getCell("C7").value, "Work");
  assert.equal(sheet.getCell("I7").value, "Separate scope");
  assert.equal(sheet.getCell("F8").result, -1000);
  assert.equal(sheet.getCell("J3").result, 129000);
  assert.equal(wb.getWorksheet("Comparison").getCell("E6").result, 129000);
  assert.equal(sheet.getCell("D3").dataValidation.type, "list");
  assert.equal(sheet.getCell("B24").value, "Notes: Includes labour");
  const original = new ExcelJS.Workbook();
  await original.xlsx.load(
    await readFile(
      new URL(
        "../../assets/xlsx-templates/vendor-comparison-v2.xlsx",
        import.meta.url,
      ),
    ),
  );
  assert.deepEqual(
    sheet.getCell("C7").style,
    original.worksheets[1].getCell("I7").style,
  );
  assert.equal(
    sheet.getColumn(3).width,
    original.worksheets[1].getColumn(9).width,
  );
  assert.deepEqual(
    wb.worksheets[0].getCell("B1").style,
    original.worksheets[0].getCell("B1").style,
  );
  wb.eachSheet((s) =>
    s.eachRow((r) =>
      r.eachCell((c) => assert.doesNotMatch(String(c.value), /BOQ/)),
    ),
  );
});

test("template expands for additional trades and long quotes, preserving slot positions", async () => {
  const template = await readFile(
    new URL(
      "../../assets/xlsx-templates/vendor-comparison-v2.xlsx",
      import.meta.url,
    ),
  );
  const trades = Array.from({ length: 32 }, (_, index) => ({
    id: `trade-${index}`,
    name: `Trade ${index}`,
    finalised_vendor_id: "v3",
    vendors: [
      {
        id: "v3",
        name: "Third vendor",
        slot: 2,
        notes: "Delivery included",
        items: Array.from({ length: 20 }, (_, i) => ({
          id: `item-${i}`,
          description: `Line ${i}`,
          quantity: 2,
          rate: 100,
        })),
      },
    ],
  }));
  const bytes = await buildVendorComparisonWorkbook(template, {
    title: "Growth",
    trades,
  });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  assert.equal(wb.worksheets.length, 33);
  const sheet = wb.worksheets[1];
  assert.equal(sheet.getCell("N5").value, "Third vendor");
  assert.equal(sheet.getCell("O26").value, "Line 19");
  assert.equal(sheet.getCell("N29").result, 4000);
  assert.equal(sheet.getCell("J3").result, 4000);
  assert.equal(wb.worksheets[0].getCell("B40").result, 128000);
  assert.equal(sheet.getCell("B5").value, "Vendor 1");
});

test("database seed matches the workbook and sheets use live catalogue identities", async () => {
  const { createDefaultTrades } = await import("./vendorComparisonData.js");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    await readFile(
      new URL(
        "../../assets/xlsx-templates/vendor-comparison-v2.xlsx",
        import.meta.url,
      ),
    ),
  );
  const names = wb.worksheets.slice(1).map((s) => s.name);
  const unique = [
    ...new Set(
      names.map((name) => {
        const base = name.replace(/\s*\(\d+\)$/, "");
        return names.includes(base) ? base : name;
      }),
    ),
  ];
  const migration = await readFile(
    new URL(
      "../../../../backend/migrations/20261116_vendor_trades.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const seededNames = [...migration.matchAll(/\(UUID\(\), '([^']+)'/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(seededNames, unique);
  const catalogue = [...seededNames, "New database trade"].map((name, i) => ({
    id: `database-${i}`,
    name,
  }));
  const first = createDefaultTrades(catalogue),
    second = createDefaultTrades(catalogue);
  assert.equal(first.length, 27);
  assert.equal(first[0].id, catalogue[0].id);
  assert.equal(first.at(-1).name, "New database trade");
  first[0].vendors.push({ id: "test" });
  first.splice(0, 1);
  assert.equal(second.length, 27);
  assert.ok(second.every((t) => t.vendors.length === 0));
  assert.equal(createDefaultTrades([]).length, 0);
});

test('shared comparison rows align old quotes without losing rates or notes', async () => {
  const { sharedComparisonTrade, withComparisonItems } = await import('./vendorComparisonData.js');
  const trade = sharedComparisonTrade({ id: 't', name: 'Civil', vendors: [
    { id: 'a', name: 'A', notes: 'A notes', items: [{ id: 'a1', description: 'Tiles', quantity: 2, rate: 100 }, { id: 'a2', description: 'Labour', quantity: null, rate: 50 }] },
    { id: 'b', name: 'B', notes: 'B notes', items: [{ id: 'b1', description: 'Tiles', quantity: 2, rate: 120 }, { id: 'b2', description: 'Different scope', quantity: 1, rate: 30 }] },
  ] });
  assert.equal(trade.items.length, 3);
  assert.deepEqual(trade.vendors.map(quoteTotal), [250, 270]);
  assert.equal(trade.vendors[1].items[0].id, trade.items[0].id);
  assert.equal(trade.vendors[0].items[2].rate, null);
  assert.equal(trade.vendors[1].notes, 'B notes');
  const edited = withComparisonItems(trade, trade.items.map((i, index) => index === 0 ? { ...i, description: 'Floor tiles', quantity: 3, unit: 'sqm' } : i));
  assert.ok(edited.vendors.every((v) => v.items[0].description === 'Floor tiles' && v.items[0].quantity === 3));
  const [reopened] = comparisonTrades(JSON.parse(JSON.stringify({ schema_version: 2, trades: [edited] })));
  assert.equal(reopened.items[0].unit, 'sqm');
  assert.ok(reopened.vendors.every((vendor) => vendor.items[0].unit === 'sqm'));
  assert.deepEqual(edited.vendors.map((v) => v.items[0].rate), [100, 120]);
  assert.deepEqual(edited.vendors.map(quoteTotal), [350, 390]);
  const removed = withComparisonItems(edited, edited.items.slice(1));
  assert.ok(removed.vendors.every((v) => v.items.length === 2));
});
