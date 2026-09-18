export const formatStatus = (status) =>
  String(status || "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const getWorkOrderNumber = (workOrder) =>
  workOrder?.wo_id ||
  workOrder?.work_order_number ||
  workOrder?.workOrderNumber ||
  workOrder?.wo_number ||
  workOrder?.woNumber ||
  workOrder?.number ||
  `WO-${String(workOrder?.id || "").slice(0, 8)}`;

export const getProjectName = (workOrder) =>
  workOrder?.project?.name ||
  workOrder?.project?.project_name ||
  workOrder?.project_name ||
  workOrder?.projectName ||
  "-";

export const getVendorName = (workOrder) =>
  workOrder?.vendor?.name ||
  workOrder?.vendor?.company_name ||
  workOrder?.contractor_company_name ||
  workOrder?.contractor_name ||
  workOrder?.vendor_name ||
  workOrder?.vendorName ||
  "-";

export const getItems = (workOrder) =>
  Array.isArray(workOrder?.items)
    ? workOrder.items
    : Array.isArray(workOrder?.work_order_items)
      ? workOrder.work_order_items
      : Array.isArray(workOrder?.workOrderItems)
        ? workOrder.workOrderItems
        : [];

export const getPaymentStages = (workOrder) =>
  Array.isArray(workOrder?.payment_stages)
    ? workOrder.payment_stages
    : Array.isArray(workOrder?.paymentStages)
      ? workOrder.paymentStages
      : [];

export const getTerms = (workOrder) =>
  Array.isArray(workOrder?.terms)
    ? workOrder.terms
    : Array.isArray(workOrder?.work_order_terms)
      ? workOrder.work_order_terms
      : [];

export const getUnitName = (unit) => {
  if (!unit) return "";

  if (typeof unit === "string") return unit;

  return unit.name || unit.code || "";
};

export const getUnitCode = (unit) => {
  if (!unit || typeof unit === "string") return "";

  return unit.code || "";
};

export const getTermTitle = (term, index) =>
  term?.title ||
  term?.name ||
  term?.terms_template?.name ||
  `Term ${index + 1}`;

export const getTermDescription = (term) =>
  term?.description || term?.terms_template?.content_html || "";
