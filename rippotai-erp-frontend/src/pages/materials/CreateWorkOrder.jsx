import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  FileText,
  ChevronDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { useCreateWorkOrderMutation } from "../../api/procuerment/work-order.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetUnitsQuery } from "../../api/meta/unit.api";
import { useGetTermsTemplatesQuery } from "../../api/meta/terms.api";

/* =========================================================
   DEFAULT ROWS
========================================================= */

const emptyItem = {
  item_type: "SERVICE",
  description: "",
  unit_id: "",
  quantity: 1,
  rate: 0,
  amount: 0,
  remarks: "",
};

const emptyPaymentStage = {
  stage_name: "",
  due_date: "",
  percentage: 0,
  amount: 0,
  remarks: "",
};

const emptyTerm = {
  description: "",
  is_mandatory: true,
};

/* =========================================================
   HELPERS
========================================================= */

const getRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.rows)) return response.rows;
  return [];
};

const getId = (item) => item?.id;

const getProjectName = (project) =>
  project?.name ||
  project?.project_name ||
  project?.projectName ||
  project?.title ||
  "-";

const getVendorName = (vendor) =>
  vendor?.name ||
  vendor?.company_name ||
  vendor?.companyName ||
  vendor?.vendor_name ||
  "-";

const getUnitName = (unit) => unit?.code || unit?.name || "-";

const getTemplateName = (template) => template?.name || "Untitled Template";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const calculateItemAmount = (item) => {
  const quantity = Number(item.quantity || 0);
  const rate = Number(item.rate || 0);

  return quantity * rate;
};

const stripHtml = (html = "") => {
  if (!html) return "";

  const div = document.createElement("div");
  div.innerHTML = html;

  return div.textContent || div.innerText || "";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CreateWorkOrder() {
  const navigate = useNavigate();

  const [createWorkOrder, { isLoading }] = useCreateWorkOrderMutation();

  /* -------------------------------------------------------
     MASTER DATA
  ------------------------------------------------------- */

  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery();

  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery();

  const { data: unitsData, isLoading: unitsLoading } = useGetUnitsQuery();

  const { data: termsTemplatesData, isLoading: termsTemplatesLoading } =
    useGetTermsTemplatesQuery();

  const projects = getRows(projectsData);
  const vendors = getRows(vendorsData);
  const units = getRows(unitsData);
  const termsTemplates = getRows(termsTemplatesData);

  const activeUnits = useMemo(
    () => units.filter((unit) => unit?.is_active !== false),
    [units],
  );

  const activeTermsTemplates = useMemo(
    () =>
      termsTemplates.filter(
        (template) => template?.is_active !== false && !template?.deleted_at,
      ),
    [termsTemplates],
  );

  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */

  const [form, setForm] = useState({
    project_id: "",
    vendor_id: "",

    work_order_date: new Date().toISOString().slice(0, 10),

    target_completion_date: "",

    agency: "",
    site_address: "",
    site_contact_person: "",
    site_lead: "",
    site_phone: "",
    site_email: "",
    site_gstin: "",
    working_hours: "",

    discount: 0,
    gst_percentage: 18,
    cartage: 0,
    payment_terms: "",

    terms_template_id: "",

    items: [{ ...emptyItem }],
    payment_stages: [{ ...emptyPaymentStage }],
    terms: [],
  });

  /* -------------------------------------------------------
     CALCULATIONS
  ------------------------------------------------------- */

  const itemsTotal = useMemo(
    () => form.items.reduce((sum, item) => sum + calculateItemAmount(item), 0),
    [form.items],
  );

  const discountAmount = useMemo(
    () => Number(form.discount || 0),
    [form.discount],
  );

  const taxableAmount = useMemo(
    () => Math.max(itemsTotal - discountAmount, 0),
    [itemsTotal, discountAmount],
  );

  const gstAmount = useMemo(
    () => (taxableAmount * Number(form.gst_percentage || 0)) / 100,
    [taxableAmount, form.gst_percentage],
  );

  const cartage = Number(form.cartage || 0);

  const grandTotal = useMemo(
    () => taxableAmount + gstAmount + cartage,
    [taxableAmount, gstAmount, cartage],
  );

  const paymentAllocated = useMemo(
    () =>
      form.payment_stages.reduce(
        (sum, stage) => sum + Number(stage.amount || 0),
        0,
      ),
    [form.payment_stages],
  );

  const paymentRemaining = Math.max(grandTotal - paymentAllocated, 0);

  const selectedTemplate = useMemo(
    () =>
      activeTermsTemplates.find(
        (template) => template.id === form.terms_template_id,
      ),
    [activeTermsTemplates, form.terms_template_id],
  );

  /* -------------------------------------------------------
     GENERAL FIELD
  ------------------------------------------------------- */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* -------------------------------------------------------
     ITEMS
  ------------------------------------------------------- */

  const updateItem = (index, field, value) => {
    setForm((current) => {
      const items = [...current.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      if (field === "quantity" || field === "rate") {
        items[index].amount = calculateItemAmount(items[index]);
      }

      return {
        ...current,
        items,
      };
    });
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...emptyItem,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  /* -------------------------------------------------------
     PAYMENT STAGES
  ------------------------------------------------------- */

  const updatePaymentStage = (index, field, value) => {
    setForm((current) => {
      const payment_stages = [...current.payment_stages];

      payment_stages[index] = {
        ...payment_stages[index],
        [field]: value,
      };

      if (field === "percentage") {
        const percentage = Number(value || 0);

        payment_stages[index].amount = (grandTotal * percentage) / 100;
      }

      return {
        ...current,
        payment_stages,
      };
    });
  };

  const addPaymentStage = () => {
    setForm((current) => ({
      ...current,
      payment_stages: [
        ...current.payment_stages,
        {
          ...emptyPaymentStage,
        },
      ],
    }));
  };

  const removePaymentStage = (index) => {
    setForm((current) => ({
      ...current,
      payment_stages:
        current.payment_stages.length === 1
          ? current.payment_stages
          : current.payment_stages.filter(
              (_, stageIndex) => stageIndex !== index,
            ),
    }));
  };

  /* -------------------------------------------------------
     TERMS
  ------------------------------------------------------- */

  const updateTerm = (index, field, value) => {
    setForm((current) => {
      const terms = [...current.terms];

      terms[index] = {
        ...terms[index],
        [field]: value,
      };

      return {
        ...current,
        terms,
      };
    });
  };

  const addTerm = () => {
    setForm((current) => ({
      ...current,
      terms: [
        ...current.terms,
        {
          ...emptyTerm,
        },
      ],
    }));
  };

  const removeTerm = (index) => {
    setForm((current) => ({
      ...current,
      terms: current.terms.filter((_, termIndex) => termIndex !== index),
    }));
  };

  /* -------------------------------------------------------
     TEMPLATE
  ------------------------------------------------------- */

  const handleTemplateChange = (templateId) => {
    const template = activeTermsTemplates.find(
      (item) => item.id === templateId,
    );

    setForm((current) => ({
      ...current,
      terms_template_id: templateId || "",
      terms: templateId
        ? [
            {
              description: template?.content_html || "",
              is_mandatory: true,
            },
          ]
        : [],
    }));
  };

  /* -------------------------------------------------------
     SUBMIT
  ------------------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.project_id) {
      toast.error("Please select a project");
      return;
    }

    if (!form.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }

    if (!form.work_order_date) {
      toast.error("Please select work order date");
      return;
    }

    const validItems = form.items.filter(
      (item) =>
        item.description?.trim() &&
        item.unit_id &&
        Number(item.quantity) > 0 &&
        Number(item.rate) >= 0,
    );

    if (!validItems.length) {
      toast.error("Add at least one valid work order item with a unit");
      return;
    }

    const invalidUnit = validItems.find(
      (item) => !activeUnits.some((unit) => unit.id === item.unit_id),
    );

    if (invalidUnit) {
      toast.error("One or more selected units are invalid");
      return;
    }

    if (paymentAllocated > grandTotal + 0.01) {
      toast.error("Payment stages cannot exceed the work order total");
      return;
    }

    if (form.terms_template_id && !selectedTemplate) {
      toast.error("Selected terms template is no longer active");
      return;
    }

    const payload = {
      project_id: form.project_id,
      vendor_id: form.vendor_id,

      work_order_date: form.work_order_date,

      ...(form.target_completion_date
        ? {
            target_completion_date: form.target_completion_date,
          }
        : {}),

      ...(form.agency.trim()
        ? {
            agency: form.agency.trim(),
          }
        : {}),

      ...(form.site_address.trim()
        ? {
            site_address: form.site_address.trim(),
          }
        : {}),

      ...(form.site_contact_person.trim()
        ? {
            site_contact_person: form.site_contact_person.trim(),
          }
        : {}),

      ...(form.site_lead.trim()
        ? {
            site_lead: form.site_lead.trim(),
          }
        : {}),

      ...(form.site_phone.trim()
        ? {
            site_phone: form.site_phone.trim(),
          }
        : {}),

      ...(form.site_email.trim()
        ? {
            site_email: form.site_email.trim(),
          }
        : {}),

      ...(form.site_gstin.trim()
        ? {
            site_gstin: form.site_gstin.trim(),
          }
        : {}),

      ...(form.working_hours.trim()
        ? {
            working_hours: form.working_hours.trim(),
          }
        : {}),

      ...(Number(form.discount) > 0
        ? {
            discount: Number(form.discount),
          }
        : {}),

      ...(Number(form.gst_percentage) >= 0
        ? {
            gst_percentage: Number(form.gst_percentage),
          }
        : {}),

      ...(Number(form.cartage) > 0
        ? {
            cartage: Number(form.cartage),
          }
        : {}),

      ...(form.payment_terms.trim()
        ? {
            payment_terms: form.payment_terms.trim(),
          }
        : {}),

      ...(form.terms_template_id
        ? {
            terms_template_id: form.terms_template_id,
          }
        : {}),

      items: validItems.map((item, index) => ({
        sort_order: index + 1,

        item_type: item.item_type || "SERVICE",

        description: item.description.trim(),

        quantity: Number(item.quantity),

        unit_id: item.unit_id,

        rate: Number(item.rate),

        amount: calculateItemAmount(item),

        ...(item.remarks?.trim()
          ? {
              remarks: item.remarks.trim(),
            }
          : {}),
      })),

      payment_stages: form.payment_stages
        .filter((stage) => stage.stage_name?.trim())
        .map((stage, index) => ({
          sort_order: index + 1,

          stage_name: stage.stage_name.trim(),

          ...(stage.due_date
            ? {
                due_date: stage.due_date,
              }
            : {}),

          amount: Number(stage.amount || 0),

          ...(stage.remarks?.trim()
            ? {
                remarks: stage.remarks.trim(),
              }
            : {}),
        })),

      terms: form.terms
        .filter((term) => term.description?.trim())
        .map((term, index) => ({
          sort_order: index + 1,

          description: term.description.trim(),

          is_mandatory: term.is_mandatory !== false,

          ...(form.terms_template_id
            ? {
                terms_template_id: form.terms_template_id,
              }
            : {}),
        })),
    };

    try {
      const response = await createWorkOrder(payload).unwrap();

      const createdId =
        response?.id || response?.data?.id || response?.workOrder?.id;

      toast.success("Work order created successfully");

      if (createdId) {
        navigate(`/work-orders/${createdId}`);
      } else {
        navigate("/work-orders");
      }
    } catch (error) {
      const message =
        error?.data?.message || error?.message || "Unable to create work order";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#EAEEF0] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/work-orders")}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft size={19} />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B] text-white">
                <FileText size={20} />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Create Work Order
                </h1>

                <p className="text-sm text-slate-500">
                  Create a vendor work order for a project.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/work-orders")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#17382f] disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {isLoading ? "Creating..." : "Create Work Order"}
              </button>
            </div>
          </div>

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the project and vendor for this work order.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Project" required>
                <select
                  value={form.project_id}
                  onChange={(event) =>
                    updateField("project_id", event.target.value)
                  }
                  disabled={projectsLoading}
                  className="input"
                  required
                >
                  <option value="">
                    {projectsLoading ? "Loading projects..." : "Select project"}
                  </option>

                  {projects.map((project) => (
                    <option key={getId(project)} value={getId(project)}>
                      {getProjectName(project)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vendor" required>
                <select
                  value={form.vendor_id}
                  onChange={(event) =>
                    updateField("vendor_id", event.target.value)
                  }
                  disabled={vendorsLoading}
                  className="input"
                  required
                >
                  <option value="">
                    {vendorsLoading ? "Loading vendors..." : "Select vendor"}
                  </option>

                  {vendors.map((vendor) => (
                    <option key={getId(vendor)} value={getId(vendor)}>
                      {getVendorName(vendor)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Work Order Date" required>
                <input
                  type="date"
                  value={form.work_order_date}
                  onChange={(event) =>
                    updateField("work_order_date", event.target.value)
                  }
                  className="input"
                  required
                />
              </Field>

              <Field label="Target Completion Date">
                <input
                  type="date"
                  value={form.target_completion_date}
                  onChange={(event) =>
                    updateField("target_completion_date", event.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Agency">
                <input
                  value={form.agency}
                  onChange={(event) =>
                    updateField("agency", event.target.value)
                  }
                  className="input"
                  placeholder="Agency / contractor"
                />
              </Field>

              <Field label="Working Hours">
                <input
                  value={form.working_hours}
                  onChange={(event) =>
                    updateField("working_hours", event.target.value)
                  }
                  className="input"
                  placeholder="e.g. 9:00 AM - 6:00 PM"
                />
              </Field>
            </div>
          </section>

          {/* =================================================
              SITE INFORMATION
          ================================================= */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">Site Information</h2>

              <p className="mt-1 text-sm text-slate-500">
                Site and project contact details captured on the work order.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Site Contact Person">
                <input
                  value={form.site_contact_person}
                  onChange={(event) =>
                    updateField("site_contact_person", event.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Site Lead">
                <input
                  value={form.site_lead}
                  onChange={(event) =>
                    updateField("site_lead", event.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Site Address" className="lg:col-span-3">
                <textarea
                  value={form.site_address}
                  onChange={(event) =>
                    updateField("site_address", event.target.value)
                  }
                  className="input min-h-[90px] resize-y"
                />
              </Field>
            </div>
          </section>

          {/* =================================================
              ITEMS
          ================================================= */}

          <section className="rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Work Order Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add work, services or deliverables.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2 text-sm font-medium text-[#1F453B] hover:bg-[#1F453B]/5"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1050px] w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-8 px-2 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      #
                    </th>

                    <th className="w-[140px] px-2 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Type
                    </th>

                    <th className="px-2 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Description
                    </th>

                    <th className="w-[150px] px-2 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Unit
                    </th>

                    <th className="w-[110px] px-2 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Qty
                    </th>

                    <th className="w-[140px] px-2 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Rate
                    </th>

                    <th className="w-[150px] px-2 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Amount
                    </th>

                    <th className="w-12 px-2 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {form.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-2 py-3 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-2 py-3">
                        <select
                          value={item.item_type}
                          onChange={(event) =>
                            updateItem(index, "item_type", event.target.value)
                          }
                          className="table-input"
                        >
                          <option value="SERVICE">Service</option>

                          <option value="DELIVERABLE">Deliverable</option>
                        </select>
                      </td>

                      <td className="px-2 py-3">
                        <input
                          value={item.description}
                          onChange={(event) =>
                            updateItem(index, "description", event.target.value)
                          }
                          className="table-input"
                          placeholder="Work description"
                        />
                      </td>

                      <td className="px-2 py-3">
                        <select
                          value={item.unit_id}
                          onChange={(event) =>
                            updateItem(index, "unit_id", event.target.value)
                          }
                          disabled={unitsLoading}
                          className="table-input"
                        >
                          <option value="">
                            {unitsLoading ? "Loading..." : "Select unit"}
                          </option>

                          {activeUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {getUnitName(unit)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                          className="table-input text-right"
                        />
                      </td>

                      <td className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(event) =>
                            updateItem(index, "rate", event.target.value)
                          }
                          className="table-input text-right"
                        />
                      </td>

                      <td className="px-2 py-3 text-right text-sm font-semibold text-slate-800">
                        {currency(calculateItemAmount(item))}
                      </td>

                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      colSpan={6}
                      className="px-2 pt-5 text-right text-sm font-semibold text-slate-700"
                    >
                      Subtotal
                    </td>

                    <td className="px-2 pt-5 text-right text-base font-bold text-[#1F453B]">
                      {currency(itemsTotal)}
                    </td>

                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* =================================================
              COMMERCIALS
          ================================================= */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">Commercials</h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure discount, GST, cartage and payment terms.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Discount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(event) =>
                    updateField("discount", event.target.value)
                  }
                  className="input text-right"
                />
              </Field>

              <Field label="GST %">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.gst_percentage}
                  onChange={(event) =>
                    updateField("gst_percentage", event.target.value)
                  }
                  className="input text-right"
                />
              </Field>

              <Field label="Cartage">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cartage}
                  onChange={(event) =>
                    updateField("cartage", event.target.value)
                  }
                  className="input text-right"
                />
              </Field>

              <Field label="Payment Terms">
                <input
                  value={form.payment_terms}
                  onChange={(event) =>
                    updateField("payment_terms", event.target.value)
                  }
                  className="input"
                  placeholder="e.g. As per payment stages"
                />
              </Field>
            </div>

            <div className="mt-5 ml-auto max-w-md space-y-2 border-t border-slate-100 pt-4">
              <SummaryRow label="Subtotal" value={currency(itemsTotal)} />

              <SummaryRow
                label="Discount"
                value={`- ${currency(discountAmount)}`}
              />

              <SummaryRow
                label="Taxable Amount"
                value={currency(taxableAmount)}
              />

              <SummaryRow
                label={`GST (${Number(form.gst_percentage || 0)}%)`}
                value={currency(gstAmount)}
              />

              <SummaryRow label="Cartage" value={currency(cartage)} />

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-[#1F453B]">
                <span>Total</span>
                <span>{currency(grandTotal)}</span>
              </div>
            </div>
          </section>

          {/* =================================================
              PAYMENT STAGES
          ================================================= */}

          <section className="rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Payment Stages</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Define milestone-based payment stages.
                </p>
              </div>

              <button
                type="button"
                onClick={addPaymentStage}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2 text-sm font-medium text-[#1F453B] hover:bg-[#1F453B]/5"
              >
                <Plus size={16} />
                Add Stage
              </button>
            </div>

            <div className="space-y-3 p-5">
              {form.payment_stages.map((stage, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[1fr_130px_180px_1fr_auto]"
                >
                  <input
                    value={stage.stage_name}
                    onChange={(event) =>
                      updatePaymentStage(
                        index,
                        "stage_name",
                        event.target.value,
                      )
                    }
                    className="input"
                    placeholder="Stage name"
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={stage.percentage}
                    onChange={(event) =>
                      updatePaymentStage(
                        index,
                        "percentage",
                        event.target.value,
                      )
                    }
                    className="input text-right"
                    placeholder="%"
                  />

                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                    {currency(stage.amount)}
                  </div>

                  <input
                    type="date"
                    value={stage.due_date}
                    onChange={(event) =>
                      updatePaymentStage(index, "due_date", event.target.value)
                    }
                    className="input"
                  />

                  <button
                    type="button"
                    onClick={() => removePaymentStage(index)}
                    disabled={form.payment_stages.length === 1}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Allocated</div>

                  <div className="text-lg font-bold text-[#1F453B]">
                    {currency(paymentAllocated)}
                  </div>

                  <div
                    className={`text-xs ${
                      paymentRemaining > 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {paymentRemaining > 0
                      ? `${currency(paymentRemaining)} remains unallocated`
                      : "Fully allocated"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              TERMS TEMPLATE
          ================================================= */}

          <section className="rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">
                Terms & Conditions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a Terms Template. The selected content is stored as a
                snapshot on the work order.
              </p>
            </div>

            <div className="p-5">
              <Field label="Terms Template">
                <div className="relative">
                  <select
                    value={form.terms_template_id}
                    onChange={(event) =>
                      handleTemplateChange(event.target.value)
                    }
                    disabled={termsTemplatesLoading}
                    className="input appearance-none pr-10"
                  >
                    <option value="">
                      {termsTemplatesLoading
                        ? "Loading templates..."
                        : "Select terms template"}
                    </option>

                    {activeTermsTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {getTemplateName(template)}
                        {template.is_default ? " — Default" : ""}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </Field>

              {selectedTemplate && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedTemplate.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        Version {selectedTemplate.current_version || 1}
                      </div>
                    </div>

                    <Eye size={17} className="text-slate-400" />
                  </div>

                  <div className="max-h-[350px] overflow-y-auto p-5">
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html:
                          selectedTemplate.content_html ||
                          "<p>No template content available.</p>",
                      }}
                    />
                  </div>
                </div>
              )}

              {!selectedTemplate && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No terms template selected.
                </div>
              )}

              {/* Manual additional terms */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Additional Terms
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add individual terms in addition to the selected template.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTerm}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2 text-sm font-medium text-[#1F453B] hover:bg-[#1F453B]/5"
                  >
                    <Plus size={16} />
                    Add Term
                  </button>
                </div>

                {form.terms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    No additional terms.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.terms.map((term, index) => (
                      <div
                        key={index}
                        className="grid gap-3 md:grid-cols-[1fr_auto]"
                      >
                        <textarea
                          value={term.description}
                          onChange={(event) =>
                            updateTerm(index, "description", event.target.value)
                          }
                          className="input min-h-[80px] resize-y"
                          placeholder="Additional term..."
                        />

                        <button
                          type="button"
                          onClick={() => removeTerm(index)}
                          className="self-start rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              BOTTOM ACTIONS
          ================================================= */}

          <div className="flex justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate("/work-orders")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#17382f] disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {isLoading ? "Creating..." : "Create Work Order"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(30 41 59);
          outline: none;
        }

        .input:focus {
          border-color: #1F453B;
          box-shadow: 0 0 0 3px rgba(31, 69, 59, 0.08);
        }

        .input::placeholder {
          color: rgb(148 163 184);
        }

        .table-input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.5rem 0.625rem;
          font-size: 0.8125rem;
          color: rgb(30 41 59);
          outline: none;
        }

        .table-input:focus {
          border-color: #1F453B;
          box-shadow: 0 0 0 3px rgba(31, 69, 59, 0.06);
        }

        .table-input::placeholder {
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
