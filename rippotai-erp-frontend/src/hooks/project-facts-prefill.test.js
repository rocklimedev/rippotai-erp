import test from "node:test";
import assert from "node:assert/strict";
import { applyDocumentPrefill } from "./document-prefill.js";

const rooms = [
  { name: "Living Room", notes: "Double height", source: "client-brief" },
  { name: "Kitchen", length: 12, width: 10, unit: "FT", source: "client-brief" },
];
const context = {
  shared: {
    siteAddress: "Plot 7",
    siteArea: "250.00",
    siteAreaUnit: "GAJ",
    siteAreaSqft: 2250,
    numberOfFloors: 3,
    liftAvailable: true,
    budget: "4500000.00",
    clientName: "Mehra",
    roomCount: 2,
    rooms,
  },
  sources: {
    siteAddress: { sequence: "project" },
    siteArea: { sequence: "client-brief" },
  },
  documents: {},
};

test("brief receives canonical facts and rooms without overwriting typed values", () => {
  const trace = {};
  const next = applyDocumentPrefill(
    { siteAddress: "Typed", siteArea: "", liftAvailable: "", spaceRequirements: [], hasSpaceRequirements: "No" },
    context,
    "brief",
    trace,
  );
  assert.equal(next.siteAddress, "Typed");
  assert.equal(next.siteArea, "250");
  assert.equal(next.initialClientBudget, "4500000");
  assert.equal(next.liftAvailable, "Yes");
  assert.equal(next.hasSpaceRequirements, "Yes");
  assert.deepEqual(next.spaceRequirements.map((r) => r.spaceName), ["Living Room", "Kitchen"]);
  assert.equal(trace.siteArea, "client-brief");
  assert.equal(trace.siteAddress, undefined);
});

test("recce rooms, carpet area and room count come from the canonical facts", () => {
  const next = applyDocumentPrefill({ rooms: [], carpet_area_sqft: "", number_of_rooms: "" }, context, "recce");
  assert.equal(next.carpet_area_sqft, "2250");
  assert.equal(next.number_of_rooms, 2);
  assert.equal(next.rooms[1].room_name, "Kitchen");
  assert.equal(next.rooms[1].length, 12);
});

test("scope spaces and budget sections are pre-populated from rooms", () => {
  const scope = applyDocumentPrefill({ Spaces: [] }, context, "scope");
  assert.deepEqual(scope.Spaces.map((s) => s.name), ["Living Room", "Kitchen"]);
  assert.match(scope.Spaces[1].description, /12 x 10 ft/);
  const budget = applyDocumentPrefill({ categories: [], location: "", client_name: "" }, context, "budget");
  assert.deepEqual(budget.categories.map((c) => c.name), ["Living Room", "Kitchen"]);
  assert.equal(budget.location, "Plot 7");
  assert.equal(budget.client_name, "Mehra");
});
