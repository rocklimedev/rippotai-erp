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
      { endpointName: "getRateComparison", arg: "sheet-1", value: sheet },
      { endpointName: "getRateComparisons", arg: undefined, value: [sheet] },
      { endpointName: "getProjects", arg: undefined, value: [sheet.project] },
      { endpointName: "getVendors", arg: { status: "ACTIVE" }, value: [] },
      {
        endpointName: "getBoqById",
        arg: "boq-1",
        value: { id: "boq-1", title: "Changed source", categories: [] },
      },
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
              element: React.createElement(component),
            }),
          ),
        ),
      ),
    );
  const html = render(
    "/procurement/vendors/rate-comparison/sheet-1/edit",
    Workspace,
    "/procurement/vendors/rate-comparison/:id/edit",
  );
  assert.ok(
    html.includes("Frozen tile item"),
    "Saved BOQ lines must survive source changes",
  );
  assert.ok(
    html.includes("Saved quote label"),
    "Saved vendors must survive an empty live vendor list",
  );
  assert.ok(
    html.includes('value="125.5"'),
    "Entered vendor rates must be restored",
  );
  assert.ok(
    html.includes("251.00"),
    "L1 totals must be recalculated from restored rates and quantities",
  );
  assert.ok(
    html.includes("Original BOQ") && !html.includes("Changed source"),
    "Reopening must use the frozen BOQ",
  );
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
    list.includes("/sheet-1/edit"),
    "Saved sheet must link to its edit workspace",
  );
  const fresh = render(
    "/procurement/vendors/rate-comparison/new",
    Workspace,
    "/procurement/vendors/rate-comparison/new",
  );
  assert.ok(
    fresh.includes("Select project") && fresh.includes("Select BOQ"),
    "New workspace must require project and BOQ selection",
  );
  console.log(
    "Rate comparison page checks passed: restore snapshot, rates, vendors, totals, list links, new workspace.",
  );
  store.dispatch(baseApi.util.resetApiState());
} finally {
  await server.close();
}
