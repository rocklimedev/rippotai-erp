import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../hooks/shared";
import BudgetSectionForm from "../../components/budget-estimates/BudgetSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";
import { useCreateBudgetEstimateMutation } from "../../api/budget-estimates.api";

const SAVE_KEY = "bc.budget-estimate.draft";

const BUDGET_SECTIONS = [
  {
    key: "basic",
    title: "Basic Information",
    fields: [
      {
        key: "estimate_number",
        label: "Estimate Number",
        type: "text",
        placeholder: "Auto-generated if left blank",
      },
      {
        key: "title",
        label: "Estimate Title",
        type: "text",
        placeholder: "Enter estimate title",
        required: true,
      },
      {
        key: "estimate_date",
        label: "Estimate Date",
        type: "date",
      },
      {
        key: "client_name",
        label: "Client Name",
        type: "text",
      },
      {
        key: "location",
        label: "Location",
        type: "text",
      },
      {
        key: "prepared_by",
        label: "Prepared By",
        type: "text",
      },
    ],
  },

  {
    key: "amounts",
    title: "Estimate Amounts",
    fields: [
      {
        key: "design_amount",
        label: "Design Amount",
        type: "number",
        step: "0.01",
      },
      {
        key: "execution_amount",
        label: "Execution Amount",
        type: "number",
        step: "0.01",
      },
      {
        key: "supervisor_amount",
        label: "Supervisor Amount",
        type: "number",
        step: "0.01",
      },
      {
        key: "additional_amount",
        label: "Additional Amount",
        type: "number",
        step: "0.01",
      },
      {
        key: "misc_percentage",
        label: "Miscellaneous %",
        type: "number",
        min: 0,
        step: "0.01",
      },
      {
        key: "tax_percentage",
        label: "Tax %",
        type: "number",
        min: 0,
        step: "0.01",
      },
      {
        key: "discount_amount",
        label: "Discount Amount",
        type: "number",
        min: 0,
        step: "0.01",
      },
    ],
  },

  {
    key: "categories",
    title: "Estimate Categories",
    type: "categories",
  },

  {
    key: "miscellaneous",
    title: "Miscellaneous",
    type: "miscellaneous",
  },

  {
    key: "terms",
    title: "Terms & Conditions",
    fields: [
      {
        key: "terms_html",
        label: "Terms & Conditions",
        type: "textarea",
        rows: 8,
        fullWidth: true,
      },
    ],
  },
];

const numberValue = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? 0 : number;
};

const nullableValue = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value;
};

export function BudgetEstimateForm() {
  const navigate = useNavigate();

  const { data: projects = [] } = useGetProjectsQuery();

  const [createBudgetEstimate, { isLoading: isSubmitting }] =
    useCreateBudgetEstimateMutation();

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    project_id: "",
    boq_id: "",
    source_template_id: "",

    estimate_number: "",
    title: "",

    client_name: "",
    location: "",
    prepared_by: "",
    estimate_date: "",

    misc_percentage: 0,

    design_amount: 0,
    execution_amount: 0,
    supervisor_amount: 0,
    additional_amount: 0,

    tax_percentage: 0,
    discount_amount: 0,

    terms_html: "",
    terms_template_id: "",
    terms_template_version: null,

    categories: [],
    miscellaneous: [],
  });

  const projectId = values?.project_id || "";

  // ============================================================
  // FIELD CHANGE
  // ============================================================

  const handleFieldChange = (section, key, value) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // ============================================================
  // PROJECT CHANGE
  // ============================================================

  const handleProjectChange = (value) => {
    setValues((current) => ({
      ...current,
      project_id: value,
    }));
  };

  // ============================================================
  // TOTAL PREVIEW
  // ============================================================

  const totals = useMemo(() => {
    const design = Number(values.design_amount || 0);

    const execution = Number(values.execution_amount || 0);

    const supervisor = Number(values.supervisor_amount || 0);

    const additional = Number(values.additional_amount || 0);

    const subtotal = design + execution + supervisor + additional;

    const miscPercentage = Number(values.misc_percentage || 0);

    const miscAmount = subtotal * (miscPercentage / 100);

    const taxPercentage = Number(values.tax_percentage || 0);

    const discount = Number(values.discount_amount || 0);

    const taxableAmount = subtotal + miscAmount - discount;

    const taxAmount = taxableAmount * (taxPercentage / 100);

    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      miscAmount,
      taxAmount,
      total,
    };
  }, [
    values.design_amount,
    values.execution_amount,
    values.supervisor_amount,
    values.additional_amount,
    values.misc_percentage,
    values.tax_percentage,
    values.discount_amount,
  ]);

  // ============================================================
  // BUILD PAYLOAD
  // ============================================================

  const buildPayload = () => {
    return {
      // --------------------------------------------------------
      // SOURCE
      // --------------------------------------------------------

      project_id: values.project_id,

      boq_id: nullableValue(values.boq_id),

      source_template_id: nullableValue(values.source_template_id),

      // --------------------------------------------------------
      // BASIC
      // --------------------------------------------------------

      estimate_number: values.estimate_number || undefined,

      title: values.title,

      status: "draft",

      // --------------------------------------------------------
      // SNAPSHOT
      // --------------------------------------------------------

      client_name: nullableValue(values.client_name),

      location: nullableValue(values.location),

      prepared_by: nullableValue(values.prepared_by),

      estimate_date: nullableValue(values.estimate_date),

      // --------------------------------------------------------
      // AMOUNTS
      // --------------------------------------------------------

      subtotal: totals.subtotal,

      misc_percentage: numberValue(values.misc_percentage) ?? 0,

      misc_amount: totals.miscAmount,

      design_amount: numberValue(values.design_amount) ?? 0,

      execution_amount: numberValue(values.execution_amount) ?? 0,

      supervisor_amount: numberValue(values.supervisor_amount) ?? 0,

      additional_amount: numberValue(values.additional_amount) ?? 0,

      tax_percentage: numberValue(values.tax_percentage) ?? 0,

      tax_amount: totals.taxAmount,

      discount_amount: numberValue(values.discount_amount) ?? 0,

      total_amount: totals.total,

      // --------------------------------------------------------
      // TERMS
      // --------------------------------------------------------

      terms_html: nullableValue(values.terms_html),

      terms_template_id: nullableValue(values.terms_template_id),

      terms_template_version: values.terms_template_version
        ? Number(values.terms_template_version)
        : null,

      // --------------------------------------------------------
      // CHILD COLLECTIONS
      // --------------------------------------------------------

      categories: Array.isArray(values.categories)
        ? values.categories.map((category, categoryIndex) => ({
            library_category_id: category.library_category_id || null,

            name: category.name || "",

            sort_order: category.sort_order ?? categoryIndex,

            items: Array.isArray(category.items)
              ? category.items.map((item, itemIndex) => ({
                  library_item_id: item.library_item_id || null,

                  boq_item_id: item.boq_item_id || null,

                  name: item.name || "",

                  unit_id: item.unit_id || null,

                  unit: item.unit || null,

                  quantity: numberValue(item.quantity) ?? 0,

                  rate: numberValue(item.rate) ?? 0,

                  amount:
                    numberValue(item.amount) ??
                    Number(item.quantity || 0) * Number(item.rate || 0),

                  calc_type: item.calc_type || "M",

                  location: item.location || null,

                  detail: item.detail || null,

                  notes: item.notes || null,

                  hidden: Boolean(item.hidden),

                  sort_order: item.sort_order ?? itemIndex,
                }))
              : [],
          }))
        : [],

      // --------------------------------------------------------
      // MISCELLANEOUS
      // --------------------------------------------------------

      miscellaneous: Array.isArray(values.miscellaneous)
        ? values.miscellaneous.map((item, index) => ({
            name: item.name || "",

            value: numberValue(item.value) ?? 0,

            notes: item.notes || null,

            sort_order: item.sort_order ?? index,
          }))
        : [],
    };
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!values.project_id) {
      toast.error("Select a project first");
      return;
    }

    if (!values.title?.trim()) {
      toast.error("Enter an estimate title");
      return;
    }

    try {
      const payload = buildPayload();

      console.log("Creating Budget Estimate:", payload);

      const data = await createBudgetEstimate(payload).unwrap();

      toast.success(
        `Budget estimate ${
          data?.estimate_number || data?.id || ""
        } created successfully`,
      );

      localStorage.removeItem(SAVE_KEY);

      if (data?.id) {
        navigate(`/budget-estimates/${data.id}`);
      } else {
        navigate("/budget-estimates");
      }
    } catch (error) {
      console.error("Budget estimate creation failed:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to create budget estimate",
      );
    }
  };

  // ============================================================
  // CUSTOM SECTIONS
  // ============================================================

  const renderSection = (section) => {
    if (section.type === "categories") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#333333]">
                Estimate Categories
              </h3>

              <p className="text-xs text-[#6B7B7C] mt-1">
                Add categories and their estimate items.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setValues((current) => ({
                  ...current,
                  categories: [
                    ...(current.categories || []),
                    {
                      library_category_id: null,
                      name: "",
                      sort_order: current.categories?.length || 0,
                      items: [],
                    },
                  ],
                }));
              }}
              className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-medium"
            >
              + Add Category
            </button>
          </div>

          {(values.categories || []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">No categories added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(values.categories || []).map((category, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Input
                      value={category.name || ""}
                      placeholder="Category name"
                      onChange={(event) => {
                        const categories = [...(values.categories || [])];

                        categories[categoryIndex] = {
                          ...categories[categoryIndex],
                          name: event.target.value,
                        };

                        setValues((current) => ({
                          ...current,
                          categories,
                        }));
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const categories = [...(values.categories || [])];

                        categories.splice(categoryIndex, 1);

                        setValues((current) => ({
                          ...current,
                          categories,
                        }));
                      }}
                      className="h-10 px-3 rounded-lg border border-red-200 text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 text-xs uppercase tracking-wide text-[#6B7B7C]">
                    Items
                  </div>

                  <div className="mt-2 space-y-2">
                    {(category.items || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Input
                            placeholder="Item name"
                            value={item.name || ""}
                            onChange={(event) => {
                              const categories = [...(values.categories || [])];

                              const items = [
                                ...(categories[categoryIndex].items || []),
                              ];

                              items[itemIndex] = {
                                ...items[itemIndex],
                                name: event.target.value,
                              };

                              categories[categoryIndex] = {
                                ...categories[categoryIndex],
                                items,
                              };

                              setValues((current) => ({
                                ...current,
                                categories,
                              }));
                            }}
                          />
                        </div>

                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity ?? ""}
                            onChange={(event) => {
                              const categories = [...(values.categories || [])];

                              const items = [
                                ...(categories[categoryIndex].items || []),
                              ];

                              const quantity = Number(event.target.value || 0);

                              items[itemIndex] = {
                                ...items[itemIndex],
                                quantity,
                                amount:
                                  quantity * Number(items[itemIndex].rate || 0),
                              };

                              categories[categoryIndex] = {
                                ...categories[categoryIndex],
                                items,
                              };

                              setValues((current) => ({
                                ...current,
                                categories,
                              }));
                            }}
                          />
                        </div>

                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Rate"
                            value={item.rate ?? ""}
                            onChange={(event) => {
                              const categories = [...(values.categories || [])];

                              const items = [
                                ...(categories[categoryIndex].items || []),
                              ];

                              const rate = Number(event.target.value || 0);

                              items[itemIndex] = {
                                ...items[itemIndex],
                                rate,
                                amount:
                                  Number(items[itemIndex].quantity || 0) * rate,
                              };

                              categories[categoryIndex] = {
                                ...categories[categoryIndex],
                                items,
                              };

                              setValues((current) => ({
                                ...current,
                                categories,
                              }));
                            }}
                          />
                        </div>

                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={item.amount ?? 0}
                            readOnly
                          />
                        </div>

                        <div className="col-span-1 flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const categories = [...(values.categories || [])];

                              const items = [
                                ...(categories[categoryIndex].items || []),
                              ];

                              items.splice(itemIndex, 1);

                              categories[categoryIndex] = {
                                ...categories[categoryIndex],
                                items,
                              };

                              setValues((current) => ({
                                ...current,
                                categories,
                              }));
                            }}
                            className="text-red-500 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const categories = [...(values.categories || [])];

                      const category = categories[categoryIndex];

                      categories[categoryIndex] = {
                        ...category,
                        items: [
                          ...(category.items || []),
                          {
                            library_item_id: null,
                            boq_item_id: null,
                            name: "",
                            unit_id: null,
                            unit: null,
                            quantity: 0,
                            rate: 0,
                            amount: 0,
                            calc_type: "M",
                            location: null,
                            detail: null,
                            notes: null,
                            hidden: false,
                            sort_order: category.items?.length || 0,
                          },
                        ],
                      };

                      setValues((current) => ({
                        ...current,
                        categories,
                      }));
                    }}
                    className="mt-3 text-sm font-medium text-[#1F453B]"
                  >
                    + Add Item
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (section.type === "miscellaneous") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#333333]">
                Miscellaneous Charges
              </h3>

              <p className="text-xs text-[#6B7B7C] mt-1">
                Add additional miscellaneous estimate values.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setValues((current) => ({
                  ...current,
                  miscellaneous: [
                    ...(current.miscellaneous || []),
                    {
                      name: "",
                      value: 0,
                      notes: "",
                      sort_order: current.miscellaneous?.length || 0,
                    },
                  ],
                }));
              }}
              className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-medium"
            >
              + Add
            </button>
          </div>

          {(values.miscellaneous || []).map((item, index) => (
            <div
              key={index}
              className="grid md:grid-cols-[1fr_180px_1fr_auto] gap-3 items-end rounded-lg border border-gray-200 p-3"
            >
              <div>
                <label className="text-xs font-semibold block mb-1">Name</label>

                <Input
                  value={item.name || ""}
                  placeholder="Charge name"
                  onChange={(event) => {
                    const miscellaneous = [...(values.miscellaneous || [])];

                    miscellaneous[index] = {
                      ...miscellaneous[index],
                      name: event.target.value,
                    };

                    setValues((current) => ({
                      ...current,
                      miscellaneous,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  Value
                </label>

                <Input
                  type="number"
                  value={item.value ?? 0}
                  onChange={(event) => {
                    const miscellaneous = [...(values.miscellaneous || [])];

                    miscellaneous[index] = {
                      ...miscellaneous[index],
                      value: Number(event.target.value || 0),
                    };

                    setValues((current) => ({
                      ...current,
                      miscellaneous,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  Notes
                </label>

                <Input
                  value={item.notes || ""}
                  placeholder="Optional notes"
                  onChange={(event) => {
                    const miscellaneous = [...(values.miscellaneous || [])];

                    miscellaneous[index] = {
                      ...miscellaneous[index],
                      notes: event.target.value,
                    };

                    setValues((current) => ({
                      ...current,
                      miscellaneous,
                    }));
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const miscellaneous = [...(values.miscellaneous || [])];

                  miscellaneous.splice(index, 1);

                  setValues((current) => ({
                    ...current,
                    miscellaneous,
                  }));
                }}
                className="h-10 px-3 rounded-lg border border-red-200 text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <BudgetSectionForm
      title="Budget Estimate"
      subtitle="Create and manage project budget estimates, categories, quantities, rates, taxes and miscellaneous charges."
      sections={BUDGET_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={handleProjectChange}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      renderSection={renderSection}
      submitLabel="Save Estimate"
    >
      {/* ======================================================
          TOTAL SUMMARY
      ======================================================= */}

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-[#6B7B7C]">Subtotal</div>

          <div className="mt-1 text-lg font-semibold">
            ₹
            {totals.subtotal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-[#6B7B7C]">Miscellaneous</div>

          <div className="mt-1 text-lg font-semibold">
            ₹
            {totals.miscAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-[#6B7B7C]">Tax</div>

          <div className="mt-1 text-lg font-semibold">
            ₹
            {totals.taxAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#1F453B]/20 bg-[#1F453B]/5 p-4">
          <div className="text-xs text-[#6B7B7C]">Total Estimate</div>

          <div className="mt-1 text-xl font-bold text-[#1F453B]">
            ₹
            {totals.total.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
    </BudgetSectionForm>
  );
}

export default BudgetEstimateForm;
