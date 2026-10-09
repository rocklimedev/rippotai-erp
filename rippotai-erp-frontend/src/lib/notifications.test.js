import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  notificationDestination,
  notificationGroup,
  defaultNotificationPreferences,
} from "./notifications.js";

test("CRM, drawing and task notifications open their actual routes", () => {
  for (const [entity_type, expected] of Object.entries({
    lead: "/crm/pipeline?deal=123",
    site_recce: "/crm/recce/123",
    brief: "/crm/brief/123",
    drawing: "/design-studio/123",
    task: "/tasks/123",
  })) {
    assert.equal(
      notificationDestination({ entity_type, entity_id: "123" }),
      expected,
    );
  }
});
test("deleted, missing and unknown entities do not create broken routes", () => {
  assert.equal(
    notificationDestination({
      entity_type: "task",
      entity_id: "123",
      type: "task_deleted",
    }),
    null,
  );
  assert.equal(notificationDestination({ entity_type: "task" }), null);
  assert.equal(
    notificationDestination({ entity_type: "unknown", entity_id: "123" }),
    null,
  );
});
test("preferences classify current and legacy notifications", () => {
  assert.equal(notificationGroup({ type: "task_completed" }), "tasks");
  assert.equal(
    notificationGroup({ type: "system", entity_type: "scope_of_work" }),
    "crm",
  );
  assert.equal(notificationGroup({ type: "drawing_uploaded" }), "drawings");
  assert.equal(notificationGroup({ type: "announcement" }), "other");
  assert.ok(Object.values(defaultNotificationPreferences).every(Boolean));
});

test("new user-facing domains open real workspaces and registers", () => {
  for (const [entity_type, expected] of Object.entries({
    payment_schedule: "/ledger/payment-schedule/parent",
    boq: "/ledger/boq/parent",
    work_order: "/procurement/work-order/parent",
    delivery_challan: "/procurement/delivery-challans/parent",
    project_planner: "/projects/planner/parent",
    vendor_shortlist: "/procurement/vendors/shortlists/parent",
    daily_site_report: "/site-operations/daily-reports/parent",
    rfi: "/site-operations/rfis",
    team: "/console/users",
    note: "/tasks/notes",
  }))
    assert.equal(
      notificationDestination({ entity_type, entity_id: "parent" }),
      expected,
    );
  assert.equal(
    notificationDestination({ entity_type: "purchase_order" }),
    "/procurement/purchase-orders",
  );
  assert.equal(
    notificationDestination({ entity_type: "boq" }),
    "/ledger/boq/all",
  );
  assert.equal(
    notificationDestination({ entity_type: "project_gate", entity_id: "123" }),
    "/projects",
  );
  assert.equal(
    notificationDestination({
      entity_type: "project_gate",
      entity_id: "11111111-1111-4111-8111-111111111111",
    }),
    "/projects/11111111-1111-4111-8111-111111111111",
  );
});

test("new preferences keep procurement, finance, site and administration distinct", () => {
  for (const [entity_type, expected] of Object.entries({
    work_order: "procurement",
    material_procurement: "procurement",
    inventory: "procurement",
    payment_schedule: "finance",
    boq: "finance",
    rfi: "siteOperations",
    qc_sign_off: "siteOperations",
    team: "administration",
    project_phase: "administration",
    role: "administration",
    project_planner: "projects",
  }))
    assert.equal(notificationGroup({ entity_type, type: "system" }), expected);
});

test("every newly enabled backend entity has a frontend notification destination", () => {
  const source = readFileSync(
    new URL(
      "../../../backend/src/modules/engagement/frontend-notification-sources.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const entities = new Set(
    [...source.matchAll(/entity:\s*["']([^"']+)["']/g)].map(
      (match) => match[1],
    ),
  );
  assert.ok(entities.size > 30);
  for (const entity_type of entities)
    assert.ok(
      notificationDestination({ entity_type, entity_id: "record" }),
      `${entity_type} needs a route`,
    );
});
