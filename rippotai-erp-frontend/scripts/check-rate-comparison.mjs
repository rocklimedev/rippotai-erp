import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import React from "react";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Exercise the actual pages with cached API responses; no live account or DB.
const server = await createServer({
  configFile: false,
  plugins: [react()],
  resolve: { alias: { "@": path.resolve("src") } },
  server: { middlewareMode: true },
});
try {
  const { default: Workspace } = await server.ssrLoadModule(
    "/src/pages/boq/BoqVendorRateComparison.jsx",
  );
  const { default: List } = await server.ssrLoadModule(
    "/src/pages/boq/VendorRateComparisonList.jsx",
  );
  const { AuthProvider } = await server.ssrLoadModule(
    "/src/context/AuthContext.jsx",
  );
  const { baseApi } = await server.ssrLoadModule("/src/store/baseApi.js");
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  const sheet = {
    id: "sheet-1",
    title: "Saved finishes comparison",
    project_id: "project-1",
    boq_id: "boq-1",
    revision: 4,
    project: { id: "project-1", name: "Test project" },
    boq: { id: "boq-1", title: "Original BOQ" },
    updatedAt: "2026-10-08T10:00:00Z",
    snapshot: {
      schema_version: 1,
      boq: {
        id: "boq-1",
        project_id: "project-1",
        title: "Original BOQ",
        categories: [
          {
            id: "category-1",
            name: "Finishes",
            items: [
              {
                id: "item-1",
                description: "Frozen tile item",
                specification: "Matte",
                unit: "sqm",
                quantity: 2,
                rate: 150,
                amount: 300,
              },
            ],
          },
        ],
      },
      vendors: [{ id: "vendor-1", name: "Original vendor" }],
      selected_vendor_ids: ["vendor-1"],
      vendor_names: { "vendor-1": "Saved quote label" },
      vendor_rates: { "item-1__vendor-1": "125.5" },
    },
  };
  store.dispatch(
    baseApi.util.upsertQueryEntries([
      {
        endpointName: "getVendorTrades",
        arg: undefined,
        value: [
          { id: "catalogue-1", name: "Site Preparation" },
          { id: "catalogue-2", name: "SANITARY" },
          { id: "catalogue-3", name: "Lighting" },
          { id: "catalogue-4", name: "Live database trade" },
        ],
      },
      { endpointName: "getRateComparison", arg: "sheet-1", value: sheet },
      { endpointName: "getRateComparisons", arg: undefined, value: [sheet] },
      { endpointName: "getProjects", arg: undefined, value: [sheet.project] },
      { endpointName: "getVendors", arg: { status: "ACTIVE" }, value: [] },
      { endpointName: "getUnits", arg: undefined, value: [{ code: "kg" }] },
    ]),
  );
  const render = (url, component, route) =>
    renderToString(
      React.createElement(
        Provider,
        { store },
        React.createElement(
          MemoryRouter,
          { initialEntries: [url] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: route,
              element: React.createElement(
                AuthProvider,
                null,
                React.createElement(component),
              ),
            }),
          ),
        ),
      ),
    );
  const html = render(
    "/procurement/vendors/rate-comparison/sheet-1/edit?trade=category-1",
    Workspace,
    "/procurement/vendors/rate-comparison/:id/edit",
  );
  assert.ok(
    html.includes("Frozen tile item"),
    "Historical vendor quotes must survive source changes",
  );
  assert.ok(
    html.includes("trade-comparison-table") &&
      html.includes('aria-label="Edit vendor 1"'),
    "Trade opens the saved quote with shared scope and a header edit control",
  );
  assert.ok(
    html.includes("Saved quote label"),
    "Saved vendors must survive an empty live vendor list",
  );
  assert.match(html, /id="comparison-title"[^>]*readOnly=""/i, 'Saved comparison name is read-only');
  assert.ok(
    html.includes('value="125.5"'),
    "Entered vendor rates must be restored",
  );
  assert.ok(
    html.includes("₹251"),
    "Vendor totals must be recalculated from restored quotes",
  );
  assert.doesNotMatch(html, /GST/);
  assert.ok(
    !html.includes("Original BOQ") && !html.includes("Changed source"),
    "Workspace must not show a BOQ reference",
  );
  assert.equal((html.match(/aria-label="Item description 1"/g) || []).length, 1, "Item description is entered once for all vendors");
  assert.match(html, /<select[^>]*aria-label="Unit 1"[^>]*>[\s\S]*?<option value="sqm" selected="">sqm<\/option><option value="kg">kg<\/option><option value="Lump">Lump sum<\/option><\/select>/, "The unit dropdown offers catalogue units and lump sums and preserves older saved units");
  const list = render(
    "/procurement/vendors/rate-comparison",
    List,
    "/procurement/vendors/rate-comparison",
  );
  assert.ok(
    list.includes("Saved finishes comparison") && list.includes("Test project"),
    "List must show saved sheets and their projects",
  );

  assert.ok(
    !Object.values(store.getState()[baseApi.reducerPath].queries).some(
      ({ endpointName }) => /^getBoqs?/.test(endpointName),
    ),
    "Workspace must not query BOQs",
  );
  const newSnapshot = {
    schema_version: 2,
    trades: [
      {
        id: "trade-2",
        name: "Independent trade",
        finalised_vendor_id: "vendor-2",
        vendors: [
          {
            id: "vendor-2",
            name: "Independent vendor",
            items: [
              {
                id: "line-2",
                description: "Independent scope",
                quantity: null,
                unit: "Lump",
                rate: 1200,
              },
            ],
          },
        ],
      },
    ],
  };
  store.dispatch(
    baseApi.util.upsertQueryEntries([
      {
        endpointName: "getRateComparison",
        arg: "sheet-1",
        value: { ...sheet, snapshot: newSnapshot },
      },
    ]),
  );
  const independent = render(
    "/procurement/vendors/rate-comparison/sheet-1/edit",
    Workspace,
    "/procurement/vendors/rate-comparison/:id/edit",
  );
  assert.ok(
    independent.includes('aria-label="Finalised vendor summary"') &&
      independent.includes("Independent vendor") &&
      independent.includes("Total finalised amount") &&
      independent.includes("₹1,200") &&
      !independent.includes("trade-comparison-table"),
    "Overview opens by default with the workbook summary and finalised totals",
  );
  const fiveSnapshot = structuredClone(newSnapshot);
  const trade = fiveSnapshot.trades[0];
  const original = trade.vendors[0];
  trade.vendors.push(...[null, 900, 1500, 1000].map((rate, index) => ({
    id: "added-" + index,
    name: "Added vendor " + (index + 1),
    slot: index + 2,
    items: [{ ...original.items[0], rate }],
  })));
  store.dispatch(baseApi.util.upsertQueryEntries([{
    endpointName: "getRateComparison",
    arg: "sheet-1",
    value: { ...sheet, snapshot: fiveSnapshot },
  }]));
  const five = render("/procurement/vendors/rate-comparison/sheet-1/edit?trade=trade-2",
    Workspace, "/procurement/vendors/rate-comparison/:id/edit");
  assert.equal((five.match(/<article class="vc-quote/g) || []).length, 5);
  assert.equal((five.match(/<article class="vc-quote is-expanded"/g) || []).length, 1);
  assert.match(five, /Vendor (?:<!-- -->)?5[\s\S]*Added vendor 4/);
  assert.match(five, /class="vc-quote-rate is-pending"[^>]*>Pending/);
  assert.match(five, /class="vc-quote-rate is-low"[^>]*>₹900/);
  assert.match(five, /aria-label="Scroll left"/);
  assert.match(five, /aria-label="Scroll right"/);
  assert.match(five, /class="vc-add-vendor"/);
  assert.match(five, /class="vc-add-tile"/);
  assert.equal((five.match(/aria-label="Edit vendor [1-5]"/g) || []).length, 5);
  assert.ok(five.includes("+ Add item"));
  assert.equal((five.match(/aria-label="Item description 1"/g) || []).length, 1);
  assert.match(five, /<input[^>]*aria-label="Quantity 1"[^>]*disabled=""/);
  assert.ok(five.includes('<option value="Lump" selected="">Lump sum</option>'));
  const fresh = render(
    "/procurement/vendors/rate-comparison/new?tab=comparison",
    Workspace,
    "/procurement/vendors/rate-comparison/new",
  );
  assert.ok(
    fresh.includes('aria-label="Search trades"') &&
      /vc-trade-list[\s\S]*trade-comparison-table/.test(fresh) &&
      fresh.includes('Version History'),
    'The comparison sheet displays searchable trades above the comparison table',
  );
  assert.ok(
    fresh.includes("Select project") &&
      !fresh.includes("Select BOQ") &&
      fresh.includes("Site Preparation") &&
      fresh.includes("SANITARY") &&
      fresh.includes("Lighting") &&
      fresh.includes("Live database trade"),
    "New workspace must use project and independent trades",
  );
  console.log(
    "Rate comparison page checks passed: legacy quotes, rates, vendors, totals, project list, BOQ-free workspace.",
  );
  store.dispatch(baseApi.util.resetApiState());
} finally {
  await server.close();
}
