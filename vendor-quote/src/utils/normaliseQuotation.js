// ---------------------------------------------------------------------------
// Helpers — normalise the camelCase API response into a consistent shape
// ---------------------------------------------------------------------------
export function normaliseQuotation(q) {
  if (!q) return null;
  return {
    id: q.id,
    quotation_number: q.quotationNumber,
    quotation_date: q.quotationDate,
    status: q.status,
    current_version: q.currentVersion ?? q.current_version ?? 0,

    project_snapshot: q.projectSnapshot ?? q.project_snapshot ?? {},
    vendor_snapshot: q.vendorSnapshot ?? q.vendor_snapshot ?? {},

    subtotal: Number(q.subtotal) || 0,
    additional_charges:
      Number(q.additionalCharges ?? q.additional_charges) || 0,
    global_discount_type:
      q.globalDiscountType ?? q.global_discount_type ?? "fixed",
    global_discount_value:
      Number(q.globalDiscountValue ?? q.global_discount_value) || 0,
    discount: Number(q.discount) || 0,
    tax_percent: Number(q.taxPercent ?? q.tax_percent) || 0,
    tax_amount: Number(q.taxAmount ?? q.tax_amount) || 0,
    total_amount: Number(q.totalAmount ?? q.total_amount) || 0,

    terms_conditions: q.termsConditions ?? q.terms_conditions ?? "",
    items: (q.items ?? []).map((item) => ({
      ...item,
      rate: Number(item.rate) || 0,
      quantity: Number(item.quantity) || 0,
      amount: Number(item.amount) || 0,
    })),

    created_by: q.createdBy ?? q.created_by,
    approved_by_name: q.approvedByName ?? q.approved_by_name,
    approved_at: q.approvedAt ?? q.approved_at,
    submitted_at: q.submittedAt ?? q.submitted_at,
    review_remarks: q.reviewRemarks ?? q.review_remarks,
    created_at: q.created_at,
    updated_at: q.updated_at,
  };
}
