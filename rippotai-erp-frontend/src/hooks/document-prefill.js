import { missingSharedValue } from "./shared-project-data.js";

export const FORM_SEQUENCE = {
  brief: "client-brief",
  recce: "site-recce",
  scope: "scope-of-work",
  budget: "business-proposal",
  payment: "payment-schedule",
  plan: "plan-of-action",
  quotation: "estimates-quotations",
  procurement: "material-procurement-sheet",
  boq: "boq",
  purchaseOrder: "purchase-order",
  workOrder: "work-order",
  challan: "delivery-challan",
};

const scalarMaps = {
  brief: { siteAddress: "siteAddress", projectType: "projectTypeId" },
  recce: {
    site_address: "siteAddress",
    project_name: "projectName",
    client_name: "clientName",
    number_of_floors: "numberOfFloors",
    lift_available: "liftAvailable",
  },
  budget: { location: "siteAddress", client_name: "clientName" },
  boq: { location: "siteAddress", client_name: "clientName" },
  workOrder: { site_address: "siteAddress" },
  challan: { site_address: "siteAddress" },
};

const lines = (document) => {
  const rows = document?.categories?.length
    ? document.categories.flatMap((category) =>
        (category.items || []).map((item) => ({
          ...item,
          category_name: category.name,
        })),
      )
    : document?.items || [];
  return rows
    .filter((item) => !item.hidden)
    .map((item) =>
      item.calc_type === "L"
        ? { ...item, quantity: 1, rate: Number(item.amount ?? 0) }
        : item,
    );
};
const emptyLines = (rows) =>
  !rows?.some(
    (row) =>
      row.name ||
      row.particular ||
      row.description ||
      row.material_id ||
      row.materialId ||
      row.scope_of_work,
  );
const slug = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Create independent receiving rows; never reuse a predecessor's row identity. */
export function applyDocumentPrefill(current, context, type) {
  if (!context) return current;
  const shared = context.shared || {};
  const docs = context.documents || {};
  let next = current;
  const set = (field, value) => {
    if (!missingSharedValue(current[field]) || missingSharedValue(value))
      return;
    if (next === current) next = { ...current };
    next[field] = value;
  };
  const overview = (field, value) => {
    if (
      !missingSharedValue(current.Overview?.[field]) ||
      missingSharedValue(value)
    )
      return;
    next = { ...next, Overview: { ...next.Overview, [field]: value } };
  };
  const collection = (field, rows, empty = !current[field]?.length) => {
    if (!empty || !rows?.length) return;
    if (next === current) next = { ...current };
    next[field] = rows;
  };
  for (const [field, key] of Object.entries(scalarMaps[type] || {})) {
    if (
      ["budget", "boq"].includes(type) &&
      field === "location" &&
      String(shared[key] ?? "").length > 255
    )
      continue;
    set(field, shared[key]);
  }
  const brief = docs["client-brief"];
  const recce = docs["site-recce"];
  const scope = docs["scope-of-work"];
  const budget = docs["business-proposal"];
  const quotation = docs["estimates-quotations"];
  const boq = docs.boq;
  const po = docs["purchase-order"];
  const planner =
    docs["planner-procurement"] ||
    docs["planner-pmc"] ||
    docs["planner-consultancy"];
  if (type === "recce" && brief) {
    const siteTypes = {
      BUILDER_FLOOR: "FLOOR",
      BUNGALOW: "KOTHI",
      VILLA: "KOTHI",
    };
    if (["FLAT", "FLOOR", "KOTHI", "RAW"].includes(brief.siteType))
      set("site_type", brief.siteType);
    else set("site_type", siteTypes[brief.siteType]);
    if (brief.siteAreaUnit === "SQ_FT") set("carpet_area_sqft", brief.siteArea);
    set(
      "existing_condition",
      brief.siteCondition === "OTHER"
        ? brief.siteConditionOther
        : brief.siteCondition?.replaceAll("_", " "),
    );
    const restrictions = [...(brief.siteRestrictions || [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const restrictionText = (types) =>
      restrictions
        .filter((row) => types.includes(row.type) && row.details?.trim())
        .map((row) => row.details.trim())
        .join("\n");
    set(
      "working_hours_allowed",
      restrictionText(["societyRwaPermittedWorkTimings"]),
    );
    set(
      "material_movement_rule",
      restrictionText(["materialMovementRestrictions"]),
    );
    set(
      "society_rwa_restrictions",
      restrictionText([
        "nocOrSecurityDepositRequired",
        "structuralChangesPermitted",
        "neighbourSensitivities",
      ]),
    );
    const requirements = brief.spaceRequirements || [];
    collection(
      "rooms",
      [...requirements]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .filter((room) => room.spaceName)
        .map((room, index) => ({
          id: `room-prefill-${index}`,
          room_name: room.spaceName,
          room_type: "OTHER",
          room_type_other: room.spaceName,
          measurement_unit: "FT",
          notes: [room.requirementDetails, room.notes]
            .filter(Boolean)
            .join("\n"),
          sort_order: index,
          length: "",
          width: "",
          height: "",
        })),
      !current.rooms?.length,
    );
  }
  if (type === "scope") {
    overview("scope_summary", brief?.areasIncludedInScope);
    overview("specific_exclusions", brief?.areasExcludedFromScope);
    const rooms = recce?.rooms?.length
      ? recce.rooms.map((room) => ({
          name: room.room_name,
          description: room.notes || "",
        }))
      : (brief?.spaceRequirements || []).map((room) => ({
          name: room.spaceName,
          description: room.requirementDetails || "",
        }));
    const seen = new Set();
    collection(
      "Spaces",
      rooms
        .filter(
          (room) =>
            room.name &&
            !seen.has(room.name.trim().toLowerCase()) &&
            seen.add(room.name.trim().toLowerCase()),
        )
        .map((room, index) => ({
          ...room,
          id: `prefill-space-${index}`,
          slug: slug(room.name),
          sort_order: index + 1,
        })),
    );
  }
  if (type === "budget" && scope?.items?.length) {
    const categories = new Map();
    for (const item of scope.items.filter(
      (item) => item.isIncluded && !item.isExcluded,
    )) {
      const name = item.scopeCategory?.name || "Scope of Work";
      if (!categories.has(name))
        categories.set(name, {
          id: `prefill-category-${categories.size}`,
          name,
          sort_order: categories.size,
          items: [],
        });
      categories.get(name).items.push({
        id: `prefill-item-${item.id}`,
        name: item.scopeOfWork,
        location: item.projectSpace?.name || "",
        notes: item.notes || "",
        quantity: "",
        rate: "",
        unit: "",
        unit_id: "",
        calc_type: "M",
        sort_order: categories.get(name).items.length,
      });
    }
    collection("categories", [...categories.values()]);
  }
  if (type === "payment") {
    overview("total_contract_value", budget?.total_amount);
    overview("gst_rate", budget?.tax_percentage);
  }
  if (type === "plan") {
    overview("execution_description", scope?.scopeSummary);
    const phases = new Map();
    for (const item of planner?.items || []) {
      if (!item.phase_id) continue;
      const phase = item.phase || {};
      if (!phases.has(item.phase_id))
        phases.set(item.phase_id, {
          id: `prefill-phase-${item.phase_id}`,
          project_phase_id: item.phase_id,
          phase_number: phase.phase_number ?? phases.size + 1,
          phase_code: phase.phase_code || "",
          title: phase.title || item.work_name || "",
          description: phase.description || "",
          duration_min_days: "",
          duration_max_days: "",
          parallel_work_note: "",
          inclusion_note: "",
          gantt_start_offset_days: 0,
          gantt_duration_days: 0,
          sort_order: phases.size + 1,
        });
    }
    collection("phases", [...phases.values()]);
  }
  if (type === "quotation") {
    const sourceLines = lines(budget);
    collection(
      "items",
      sourceLines.map((item, index) => ({
        id: `prefill-quote-${index}`,
        particular: item.name,
        qty: Number(item.quantity ?? 0),
        rate: Number(item.rate ?? 0),
        unit_id: item.unit_id || null,
        remarks: item.notes || "",
      })),
      emptyLines(current.items),
    );
  }
  if (type === "procurement") {
    const sourceLines = lines(quotation);
    collection(
      "items",
      sourceLines.map((item, index) => {
        const description = item.particular || item.name || "";
        const matches = (context.materials || []).filter(
          (material) =>
            String(material.name || material.material_name || "")
              .trim()
              .toLowerCase() === description.trim().toLowerCase(),
        );
        return {
          serialNo: index + 1,
          area: "",
          location: "",
          materialId:
            item.material_id ||
            item.materialId ||
            (matches.length === 1 ? matches[0].id : ""),
          description,
          wallArea: "",
          floorArea: "",
          ceilingArea: "",
          totalArea: "",
          quantity: item.quantity ?? "",
          price: item.rate ?? "",
          amount: Number(item.quantity ?? 0) * Number(item.rate ?? 0),
        };
      }),
      emptyLines(current.items),
    );
  }
  if (type === "purchaseOrder") {
    const source = boq || quotation;
    const sourceLines = lines(source);
    if (sourceLines.length && emptyLines(current.items)) {
      next = {
        ...next,
        source_type: boq ? "BOQ" : "QUOTATION",
        source_reference_id: source.id,
        items: sourceLines.map((item, index) => {
          const description = item.name || item.particular || "";
          const matches = (context.materials || []).filter(
            (material) =>
              String(material.name || material.material_name || "")
                .trim()
                .toLowerCase() === description.trim().toLowerCase(),
          );
          const material = matches.length === 1 ? matches[0] : {};
          return {
            id: "",
            line_number: index + 1,
            material_id: item.material_id || material.id || "",
            description,
            brand: typeof material.brand === "string" ? material.brand : "",
            specification: material.specification || "",
            unit: item.unit || "",
            unit_id: item.unit_id || material.unit_id || "",
            hsn_code: material.hsn_code || "",
            ordered_quantity: item.quantity ?? 0,
            rate: item.rate ?? 0,
            amount: Number(item.quantity ?? 0) * Number(item.rate ?? 0),
            remarks: item.notes || item.remarks || "",
            source_reference_id: item.id,
            update_master: false,
          };
        }),
      };
    }
    // The quotation's vendor is valid only when that quotation supplies the lines.
    if (!boq) set("vendor_id", quotation?.vendorId);
  }
  if (type === "workOrder") {
    const sourceLines = lines(boq || quotation);
    collection(
      "items",
      sourceLines.map((item, index) => ({
        item_type: "SERVICE",
        description: item.name || item.particular || "",
        unit_id: item.unit_id || "",
        quantity: item.quantity ?? 0,
        rate: item.rate ?? 0,
        amount: Number(item.quantity ?? 0) * Number(item.rate ?? 0),
        remarks: item.notes || item.remarks || "",
        sort_order: index + 1,
      })),
      emptyLines(current.items),
    );
    set("working_hours", recce?.working_hours_allowed);
    set("target_completion_date", brief?.targetCompletionDate);
  }
  if (
    type === "challan" &&
    po?.items?.length &&
    emptyLines(current.items) &&
    missingSharedValue(current.purchase_order_id)
  ) {
    next = {
      ...next,
      purchase_order_id: po.id,
      vendor_id: current.vendor_id || po.vendor_id || "",
      site_id: current.site_id || po.site_id || "",
      items: po.items.map((item) => ({
        material_id: item.material_id || "",
        purchase_order_item_id: item.id,
        description: item.description || "",
        brand: item.brand || "",
        specification: item.specification || "",
        unit: item.unit || "",
        quantity: "",
        accepted_quantity: "",
        shortage_quantity: "",
        damaged_quantity: "",
        rejected_quantity: "",
        condition_status: "GOOD",
        condition_notes: "",
        stored_at: "",
        remarks: "",
      })),
    };
  }
  return next;
}
