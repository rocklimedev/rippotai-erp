import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyDocumentPrefill } from "./document-prefill.js";
import { readStoredDraft } from "./use-autosave.js";
import {
  DOCUMENT_SEQUENCE,
  documentDestination,
  currentSequenceDocument,
} from "../config/documentSequence.js";

test("backend predecessor order follows the supplied document sequence", () => {
  const source = readFileSync(
    new URL(
      "../../../backend/src/modules/documents/document-prefill.ts",
      import.meta.url,
    ),
    "utf8",
  ).replace(/export const PREFILL_MODEL_SEQUENCE[\s\S]*/, "");
  const ids = [...source.matchAll(/\{ id: '([^']+)'/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(
    ids,
    DOCUMENT_SEQUENCE.filter((step) => step.action === "create").map(
      (step) => step.id,
    ),
  );
});

test("next step opens creation and keeps project and planner view", () => {
  const step = DOCUMENT_SEQUENCE.find((step) => step.id === "planner-pmc");
  const destination = documentDestination(step, "project-a", { create: true });
  assert.equal(
    destination,
    "/projects/planner/create?sequence=planner-pmc&projectId=project-a&view=PMC",
  );
  assert.equal(
    currentSequenceDocument(
      "/projects/planner/create",
      destination.split("?")[1],
    ),
    step,
  );
});

test("site recce inherits brief fields, false, zero, and independent room rows", () => {
  const next = applyDocumentPrefill(
    { site_address: "", number_of_floors: "", lift_available: "", floors: [] },
    {
      shared: {
        siteAddress: "Brief address",
        numberOfFloors: 0,
        liftAvailable: false,
      },
      documents: {
        "client-brief": {
          siteArea: 500,
          siteAreaUnit: "SQ_FT",
          spaceRequirements: [
            {
              id: "source-room",
              spaceName: "Kitchen",
              requirementDetails: "Storage",
            },
          ],
        },
      },
    },
    "recce",
  );
  assert.equal(next.site_address, "Brief address");
  assert.equal(next.number_of_floors, 0);
  assert.equal(next.lift_available, false);
  assert.equal(next.carpet_area_sqft, 500);
  assert.equal(next.rooms[0].room_name, "Kitchen");
  assert.equal(next.rooms[0].notes, "Storage");
  assert.equal(next.rooms[0].measurement_unit, "FT");
  assert.ok(next.rooms[0].id.startsWith("room-"));
  assert.notEqual(next.rooms[0].id, "source-room");
});

test("recce displays brief rooms even with legacy floor drafts and maps site restrictions", () => {
  const context = {
    documents: {
      "client-brief": {
        siteType: "BUILDER_FLOOR",
        siteCondition: "EXISTING_VACANT",
        spaceRequirements: [
          {
            spaceName: "Bedroom",
            requirementDetails: "Wardrobe",
            notes: "Keep window",
          },
        ],
        siteRestrictions: [
          { type: "societyRwaPermittedWorkTimings", details: "9–5" },
          {
            type: "materialMovementRestrictions",
            details: "Service lift only",
          },
          { type: "nocOrSecurityDepositRequired", details: "NOC required" },
        ],
      },
    },
  };
  const next = applyDocumentPrefill(
    { floors: [{ rooms: [] }], rooms: [] },
    context,
    "recce",
  );
  assert.equal(next.rooms[0].room_name, "Bedroom");
  assert.equal(next.rooms[0].notes, "Wardrobe\nKeep window");
  assert.equal(next.site_type, "FLOOR");
  assert.equal(next.existing_condition, "EXISTING VACANT");
  assert.equal(next.working_hours_allowed, "9–5");
  assert.equal(next.material_movement_rule, "Service lift only");
  assert.equal(next.society_rwa_restrictions, "NOC required");
  assert.equal(applyDocumentPrefill(next, context, "recce"), next);
  const manual = {
    rooms: [{ id: "saved-room", room_name: "Office" }],
    working_hours_allowed: "10–4",
  };
  const preserved = applyDocumentPrefill(manual, context, "recce");
  assert.equal(preserved.rooms, manual.rooms);
  assert.equal(preserved.working_hours_allowed, "10–4");
});

test("scope receives recce rooms and brief scope without duplicating names", () => {
  const next = applyDocumentPrefill(
    { Overview: { scope_summary: "", notes: "Keep me" }, Spaces: [] },
    {
      documents: {
        "site-recce": {
          rooms: [{ room_name: "Kitchen" }, { room_name: "kitchen" }],
        },
        "client-brief": {
          areasIncludedInScope: "Interiors",
          areasExcludedFromScope: "Exterior",
        },
      },
    },
    "scope",
  );
  assert.equal(next.Overview.scope_summary, "Interiors");
  assert.equal(next.Overview.specific_exclusions, "Exterior");
  assert.equal(next.Overview.notes, "Keep me");
  assert.equal(next.Spaces.length, 1);
});

test("budget includes only included scope items; does not invent quantities and prices", () => {
  const next = applyDocumentPrefill(
    { categories: [] },
    {
      documents: {
        "scope-of-work": {
          items: [
            {
              id: "included",
              scopeOfWork: "Wardrobes",
              isIncluded: true,
              scopeCategory: { name: "Carpentry" },
              projectSpace: { name: "Bedroom" },
            },
            {
              id: "excluded",
              scopeOfWork: "Painting",
              isIncluded: true,
              isExcluded: true,
            },
          ],
        },
      },
    },
    "budget",
  );
  assert.equal(next.categories[0].items[0].name, "Wardrobes");
  assert.equal(next.categories[0].items[0].location, "Bedroom");
  assert.equal(next.categories[0].items[0].quantity, "");
  assert.equal(next.categories[0].items[0].rate, "");
  assert.equal(next.categories.length, 1);
});

test("payment inherits commercial values while preserving explicit edits", () => {
  const context = {
    documents: {
      "business-proposal": { total_amount: "150000", tax_percentage: 0 },
    },
  };
  assert.deepEqual(
    applyDocumentPrefill(
      { Overview: { total_contract_value: "", gst_rate: "" } },
      context,
      "payment",
    ).Overview,
    { total_contract_value: "150000", gst_rate: 0 },
  );
  const current = {
    Overview: { total_contract_value: "200000", gst_rate: 18 },
  };
  assert.equal(applyDocumentPrefill(current, context, "payment"), current);
});

test("purchase order receives BOQ quantities/rates, material IDs and source references", () => {
  const next = applyDocumentPrefill(
    { items: [{ description: "", ordered_quantity: 1 }], vendor_id: "" },
    {
      materials: [{ id: "material-a", name: "Tiles" }],
      documents: {
        boq: {
          id: "boq-a",
          categories: [
            {
              items: [
                { id: "source-item", name: "Tiles", quantity: 20, rate: 50 },
              ],
            },
          ],
        },
      },
    },
    "purchaseOrder",
  );
  assert.equal(next.source_reference_id, "boq-a");
  assert.equal(next.items[0].material_id, "material-a");
  assert.equal(next.items[0].ordered_quantity, 20);
  assert.equal(next.items[0].amount, 1000);
  assert.equal(next.items[0].id, "");
  assert.equal(next.items[0].source_reference_id, "source-item");
});

test("delivery challan links PO lines without claiming quantities were received", () => {
  const next = applyDocumentPrefill(
    { purchase_order_id: "", items: [{ description: "" }] },
    {
      documents: {
        "purchase-order": {
          id: "po-a",
          vendor_id: "vendor-a",
          items: [
            { id: "po-item", material_id: "material-a", ordered_quantity: 100 },
          ],
        },
      },
    },
    "challan",
  );
  assert.equal(next.purchase_order_id, "po-a");
  assert.equal(next.items[0].purchase_order_item_id, "po-item");
  assert.equal(next.items[0].quantity, "");
  assert.equal(next.items[0].accepted_quantity, "");
});

test("a manual collection stays intact on source refetch", () => {
  const current = { items: [{ description: "Custom line", quantity: 5 }] };
  assert.equal(
    applyDocumentPrefill(
      current,
      { documents: { boq: { items: [{ name: "Other", quantity: 2 }] } } },
      "workOrder",
    ),
    current,
  );
});

test("draft keys isolate projects; invalid storage falls back to a fresh draft", () => {
  const storage = {
    getItem: (key) =>
      ({
        "scope.a": '{"site":"A"}',
        "scope.b": '{"site":"B"}',
        invalid: "invalid-json",
      })[key],
  };
  assert.equal(readStoredDraft("scope.a", {}, storage).site, "A");
  assert.equal(readStoredDraft("scope.b", {}, storage).site, "B");
  assert.deepEqual(readStoredDraft("new", { site: "" }, storage), { site: "" });
  assert.deepEqual(readStoredDraft("invalid", { site: "" }, storage), {
    site: "",
  });
});
