import test from "node:test";
import assert from "node:assert/strict";
import { buildVendorEstimateWorkbook, vendorEstimateTrades } from "./vendorEstimateExcel.js";

const v = (id, name, items) => ({ id, name, items });
const trades = [
  { id: "t1", name: "Electrical", finalised_vendor_id: "a", vendors: [
    v("a", "Alpha", [{ id: "1", description: "Points", quantity: 10, rate: 100 }, { id: "2", description: "DB", quantity: 1, rate: null }]),
    v("b", "Beta", [{ id: "1", description: "Points", quantity: 10, rate: 90 }]) ] },
  { id: "t2", name: "Plumbing", finalised_vendor_id: "", vendors: [v("a", "Alpha", [{ id: "3", description: "Lump sum", quantity: null, rate: 500 }])] },
  { id: "t3", name: "Paint", finalised_vendor_id: "b", vendors: [v("b", "Beta", [{ id: "4", description: "Paint", quantity: 1, rate: 1 }])] },
];

test("estimate covers every trade the vendor quoted, finalised or not", async () => {
  const rows = vendorEstimateTrades(trades, trades[0].vendors[0]);
  assert.deepEqual(rows.map((r) => [r.trade.name, r.finalised]), [["Electrical", true], ["Plumbing", false]]);
  const wb = await buildVendorEstimateWorkbook({ title: "T", projectName: "P", vendor: trades[0].vendors[0], trades });
  const ws = wb.getWorksheet("Estimate");
  const values = [];
  let totalRow = 0;
  ws.eachRow((row, n) => {
    const line = row.values.join("|");
    values.push(line);
    if (line.includes("Total estimate")) totalRow = n;
  });
  const text = values.join("\n");
  assert.match(text, /Rate pending/);
  assert.match(text, /Not finalised/);
  assert.equal(ws.getRow(totalRow).getCell(5).value.result, 1500);
});
