import { termsToText, textToTermsHtml } from "@/lib/terms";
import React, { useEffect, useMemo, useRef } from "react";
import { useSharedProjectData } from "../../hooks/use-shared-project-data";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button, TextInput, EmptyState } from "@/components/inos";
import {
  LineTable,
  RemoveRow,
  AddRow,
  TotalsCard,
  Affix,
  inr,
  todayISO,
} from "@/components/forms/commerce-form-ui";
import BudgetSectionForm from "../../components/budget-estimates/BudgetSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useCreateBudgetEstimateMutation,
  useGetBudgetEstimateQuery,
  useUpdateBudgetEstimateMutation,
} from "../../api/documents/budget-estimates.api";

const SAVE_KEY = "bc.budget-estimate.draft";

const BUDGET_SECTIONS = [
  {
    key: "basic",
    title: "Estimate details",
    description: "Name the estimate and who it is for.",
    fields: [
      {
        key: "estimate_number",
        label: "Estimate number",
        description: "Leave blank to auto-generate.",
        type: "text",
        placeholder: "e.g. EST-2026-031",
      },
      {
        key: "title",
        label: "Estimate title",
        type: "text",
        placeholder: "e.g. Kapoor Farmhouse — interiors budget",
        required: true,
      },
      {
        key: "estimate_date",
        label: "Estimate date",
        type: "date",
      },
      {
        key: "client_name",
        label: "Client name",
        type: "text",
        placeholder: "e.g. Mr. & Mrs. Kapoor",
      },
      {
        key: "location",
        label: "Location",
        type: "text",
        placeholder: "e.g. Chhatarpur, New Delhi",
      },
      {
        key: "prepared_by",
        label: "Prepared by",
        type: "text",
      },
    ],
  },

  {
    key: "amounts",
    title: "Amounts",
    description:
      "Headline figures. Miscellaneous % and tax % apply on top; discount comes off before tax.",
    fields: [
      {
        key: "design_amount",
        label: "Design",
        affix: "₹",
        type: "number",
        step: "0.01",
      },
      {
        key: "execution_amount",
        label: "Execution",
        affix: "₹",
        type: "number",
        step: "0.01",
      },
      {
        key: "supervisor_amount",
        label: "Supervision",
        affix: "₹",
        type: "number",
        step: "0.01",
      },
      {
        key: "additional_amount",
        label: "Additional",
        affix: "₹",
        type: "number",
        step: "0.01",
      },
      {
        key: "misc_percentage",
        label: "Miscellaneous",
        affix: "%",
        type: "number",
        min: 0,
        step: "0.01",
      },
      {
        key: "tax_percentage",
        label: "Tax",
        affix: "%",
        type: "number",
        min: 0,
        step: "0.01",
      },
      {
        key: "discount_amount",
        label: "Discount",
        affix: "₹",
        type: "number",
        min: 0,
        step: "0.01",
      },
    ],
  },

  {
    key: "categories",
    title: "Categories & items",
    description:
      "Break the estimate into categories with quantity × rate lines.",
    type: "categories",
  },

  {
    key: "miscellaneous",
    title: "Miscellaneous charges",
    description: "One-off charges listed separately on the estimate.",
    type: "miscellaneous",
  },

  {
    key: "terms",
    title: "Terms & conditions",
    description: "Printed at the end of the estimate.",
    fields: [
      {
        key: "terms_html",
        label: "Terms",
        type: "textarea",
        placeholder: "e.g. Rates valid for 30 days. GST extra as applicable.",
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

const dateOnly = (v) => (v ? String(v).slice(0, 10) : "");

/** Server estimate → form values (edit mode). */
function estimateToValues(e) {
  const bySort = (a, b) =>
    Number(a.sort_order || 0) - Number(b.sort_order || 0);
  return {
    project_id: e.project_id || "",
    boq_id: e.boq_id || "",
    source_template_id: e.source_template_id || "",
    estimate_number: e.estimate_number || "",
    title: e.title || "",
    client_name: e.client_name || "",
    location: e.location || "",
    prepared_by: e.prepared_by || "",
    estimate_date: dateOnly(e.estimate_date),
    misc_percentage: Number(e.misc_percentage || 0),
    design_amount: Number(e.design_amount || 0),
    execution_amount: Number(e.execution_amount || 0),
    supervisor_amount: Number(e.supervisor_amount || 0),
    additional_amount: Number(e.additional_amount || 0),
    tax_percentage: Number(e.tax_percentage || 0),
    discount_amount: Number(e.discount_amount || 0),
    terms_html: termsToText(e.terms_html),
    terms_template_id: e.terms_template_id || "",
    terms_template_version: e.terms_template_version ?? null,
    categories: [...(e.categories || [])].sort(bySort).map((c) => ({
      library_category_id: c.library_category_id || null,
      name: c.name || "",
      sort_order: c.sort_order ?? 0,
      items: [...(c.items || [])].sort(bySort).map((i) => ({
        library_item_id: i.library_item_id || null,
        boq_item_id: i.boq_item_id || null,
        name: i.name || i.libraryItem?.name || "",
        unit_id: i.unit_id || null,
        unit: i.unit || null,
        quantity: Number(i.quantity || 0),
        rate: Number(i.rate || 0),
        amount:
          i.amount != null
            ? Number(i.amount)
            : Number(i.quantity || 0) * Number(i.rate || 0),
        calc_type: i.calc_type || "M",
        location: i.location || null,
        detail: i.detail || null,
        notes: i.notes || null,
        hidden: Boolean(i.hidden),
        sort_order: i.sort_order ?? 0,
      })),
    })),
    miscellaneous: [...(e.miscellaneous || [])].sort(bySort).map((m) => ({
      name: m.name || "",
      value: Number(m.value || 0),
      notes: m.notes || "",
      sort_order: m.sort_order ?? 0,
    })),
  };
}

export function BudgetEstimateForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(editId);

  const { data: projects = [] } = useGetProjectsQuery();

  const [createBudgetEstimate, { isLoading: isCreating }] =
    useCreateBudgetEstimateMutation();
  const [updateBudgetEstimate, { isLoading: isUpdating }] =
    useUpdateBudgetEstimateMutation();
  const isSubmitting = isCreating || isUpdating;

  const {
    data: existing,
    isLoading: loadingExisting,
    isError: loadError,
  } = useGetBudgetEstimateQuery(editId, { skip: !isEdit });

  const draftKey = `${SAVE_KEY}.${isEdit ? editId : searchParams.get('projectId') || searchParams.get('project_id') || 'new'}`;
  const [values, setValues] = useAutoSave(
    draftKey,
    {
      project_id: searchParams.get('projectId') || searchParams.get('project_id') || '',
      boq_id: "",
      source_template_id: "",

      estimate_number: "",
      title: "",

      client_name: "",
      location: "",
      prepared_by: "",
      estimate_date: todayISO(),

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
    },
  );

  const projectId = values?.project_id || "";
  useSharedProjectData(
    projectId,
    "budget",
    values,
    setValues,
    !isEdit || Boolean(existing),
  );

  // Edit mode: load the saved estimate into the form once (server copy wins over any local draft).
  const loadedFor = useRef(null);
  useEffect(() => {
    if (isEdit && existing && loadedFor.current !== existing.id) {
      loadedFor.current = existing.id;
      setValues(estimateToValues(existing));
    }
  }, [isEdit, existing, setValues]);

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

      ...(isEdit ? {} : { status: "draft" }),

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

      terms_html: nullableValue(textToTermsHtml(values.terms_html)),

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

      if (isEdit) {
        const data = await updateBudgetEstimate({
          id: editId,
          body: payload,
        }).unwrap();
        toast.success(`Budget estimate ${data?.estimate_number || ""} updated`);
        localStorage.removeItem(`${SAVE_KEY}.${editId}`);
        navigate(`/ledger/budget-estimate/${editId}`);
        return;
      }

      const data = await createBudgetEstimate(payload).unwrap();

      toast.success(
        `Budget estimate ${
          data?.estimate_number || data?.id || ""
        } created successfully`,
      );

      localStorage.removeItem(draftKey);

      if (data?.id) {
        navigate(`/ledger/budget-estimate/${data.id}`);
      } else {
        navigate("/ledger/budget-estimates/all");
      }
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          (isEdit
            ? "Failed to update budget estimate"
            : "Failed to create budget estimate"),
      );
    }
  };

  // ============================================================
  // CUSTOM SECTIONS
  // ============================================================

  const setCategories = (updater) =>
    setValues((current) => ({
      ...current,
      categories: updater([...(current.categories || [])]),
    }));

  const setCategoryItem = (categoryIndex, itemIndex, patch) =>
    setCategories((categories) => {
      const items = [...(categories[categoryIndex].items || [])];
      items[itemIndex] = patch(items[itemIndex]);
      categories[categoryIndex] = { ...categories[categoryIndex], items };
      return categories;
    });

  const addCategory = () =>
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

  const addCategoryItem = (categoryIndex) =>
    setCategories((categories) => {
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
      return categories;
    });

  const addMisc = () =>
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

  const setMisc = (index, patch) =>
    setValues((current) => {
      const miscellaneous = [...(current.miscellaneous || [])];
      miscellaneous[index] = { ...miscellaneous[index], ...patch };
      return { ...current, miscellaneous };
    });

  const removeMisc = (index) =>
    setValues((current) => {
      const miscellaneous = [...(current.miscellaneous || [])];
      miscellaneous.splice(index, 1);
      return { ...current, miscellaneous };
    });

  const categoriesTotal = (values.categories || []).reduce(
    (sum, category) =>
      sum +
      (category.items || []).reduce(
        (s, item) => s + Number(item.amount || 0),
        0,
      ),
    0,
  );

  const miscTotal = (values.miscellaneous || []).reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  const renderSection = (section) => {
    if (section.type === "categories") {
      const categories = values.categories || [];

      if (!categories.length) {
        return (
          <div className="cf-block">
            <EmptyState
              title="No categories yet"
              text="Add a category such as Flooring or Carpentry, then its line items."
              action={
                <Button variant="soft" icon={Plus} onClick={addCategory}>
                  Add category
                </Button>
              }
            />
          </div>
        );
      }

      return (
        <div style={{ display: "grid", gap: 14 }}>
          {categories.map((category, categoryIndex) => {
            const categorySum = (category.items || []).reduce(
              (s, item) => s + Number(item.amount || 0),
              0,
            );
            return (
              <div
                key={categoryIndex}
                className="cf-block"
                style={{ padding: 0, gap: 0, overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 14px",
                  }}
                >
                  <TextInput
                    value={category.name || ""}
                    placeholder="Category name, e.g. Flooring"
                    aria-label={`Category ${categoryIndex + 1} name`}
                    onChange={(event) => {
                      const name = event.target.value;
                      setCategories((list) => {
                        list[categoryIndex] = { ...list[categoryIndex], name };
                        return list;
                      });
                    }}
                    style={{ fontWeight: 600, maxWidth: 420 }}
                  />
                  <span
                    className="tabular"
                    style={{
                      marginLeft: "auto",
                      fontWeight: 650,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {inr(categorySum)}
                  </span>
                  <RemoveRow
                    label="Remove category"
                    onClick={() =>
                      setCategories((list) => {
                        list.splice(categoryIndex, 1);
                        return list;
                      })
                    }
                  />
                </div>
                {(category.items || []).length > 0 && (
                  <LineTable minWidth={560}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="num" style={{ width: 110 }}>
                          Qty
                        </th>
                        <th className="num" style={{ width: 140 }}>
                          Rate
                        </th>
                        <th className="num" style={{ width: 140 }}>
                          Amount
                        </th>
                        <th className="actions" aria-label="Row actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {(category.items || []).map((item, itemIndex) => (
                        <tr key={itemIndex}>
                          <td>
                            <TextInput
                              placeholder="e.g. Italian marble laying"
                              value={item.name || ""}
                              onChange={(event) => {
                                const name = event.target.value;
                                setCategoryItem(
                                  categoryIndex,
                                  itemIndex,
                                  (it) => ({ ...it, name }),
                                );
                              }}
                            />
                          </td>
                          <td className="num">
                            <TextInput
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={item.quantity ?? ""}
                              onChange={(event) => {
                                const quantity = Number(
                                  event.target.value || 0,
                                );
                                setCategoryItem(
                                  categoryIndex,
                                  itemIndex,
                                  (it) => ({
                                    ...it,
                                    quantity,
                                    amount: quantity * Number(it.rate || 0),
                                  }),
                                );
                              }}
                            />
                          </td>
                          <td className="num">
                            <Affix pre="₹">
                              <TextInput
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={item.rate ?? ""}
                                onChange={(event) => {
                                  const rate = Number(event.target.value || 0);
                                  setCategoryItem(
                                    categoryIndex,
                                    itemIndex,
                                    (it) => ({
                                      ...it,
                                      rate,
                                      amount: Number(it.quantity || 0) * rate,
                                    }),
                                  );
                                }}
                              />
                            </Affix>
                          </td>
                          <td className="cf-amount">{inr(item.amount ?? 0)}</td>
                          <td className="actions">
                            <RemoveRow
                              onClick={() =>
                                setCategories((list) => {
                                  const items = [
                                    ...(list[categoryIndex].items || []),
                                  ];
                                  items.splice(itemIndex, 1);
                                  list[categoryIndex] = {
                                    ...list[categoryIndex],
                                    items,
                                  };
                                  return list;
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </LineTable>
                )}
                <div
                  className="cf-section__footer"
                  style={{ background: "transparent" }}
                >
                  <AddRow onClick={() => addCategoryItem(categoryIndex)}>
                    Add item
                  </AddRow>
                </div>
              </div>
            );
          })}
          <div>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={addCategory}
            >
              Add category
            </Button>
          </div>
        </div>
      );
    }

    if (section.type === "miscellaneous") {
      const misc = values.miscellaneous || [];
      return (
        <div style={{ display: "grid", gap: 10 }}>
          {misc.length > 0 && (
            <div
              className="cf-block"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <LineTable minWidth={560}>
                <thead>
                  <tr>
                    <th>Charge</th>
                    <th className="num" style={{ width: 160 }}>
                      Value
                    </th>
                    <th>Notes</th>
                    <th className="actions" aria-label="Row actions" />
                  </tr>
                </thead>
                <tbody>
                  {misc.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <TextInput
                          value={item.name || ""}
                          placeholder="e.g. Debris removal"
                          onChange={(event) =>
                            setMisc(index, { name: event.target.value })
                          }
                        />
                      </td>
                      <td className="num">
                        <Affix pre="₹">
                          <TextInput
                            type="number"
                            inputMode="decimal"
                            value={item.value ?? 0}
                            onChange={(event) =>
                              setMisc(index, {
                                value: Number(event.target.value || 0),
                              })
                            }
                          />
                        </Affix>
                      </td>
                      <td>
                        <TextInput
                          value={item.notes || ""}
                          placeholder="Optional"
                          onChange={(event) =>
                            setMisc(index, { notes: event.target.value })
                          }
                        />
                      </td>
                      <td className="actions">
                        <RemoveRow onClick={() => removeMisc(index)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </LineTable>
            </div>
          )}
          <div>
            <AddRow onClick={addMisc}>Add charge</AddRow>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isEdit && (loadingExisting || loadError || existing?.locked)) {
    return (
      <div className="inos-page inos-page--narrow" style={{ paddingTop: 32 }}>
        <EmptyState
          title={
            loadingExisting
              ? "Loading estimate…"
              : loadError
                ? "Estimate not found"
                : "This estimate is locked"
          }
          text={
            existing?.locked
              ? "Unlock it from the estimate page before editing."
              : undefined
          }
          action={
            !loadingExisting && (
              <Button
                variant="soft"
                onClick={() => navigate(`/ledger/budget-estimate/${editId}`)}
              >
                Back to estimate
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <BudgetSectionForm
      title={
        isEdit
          ? `Edit ${existing?.estimate_number || "budget estimate"}`
          : "New budget estimate"
      }
      subtitle="Headline amounts, category lines and charges — totals update as you type."
      crumbs={[
        { label: "Ledger", to: "/ledger" },
        { label: "Budget estimates", to: "/ledger/budget-estimates/all" },
        ...(isEdit
          ? [
              {
                label: existing?.estimate_number || "Estimate",
                to: `/ledger/budget-estimate/${editId}`,
              },
              { label: "Edit" },
            ]
          : [{ label: "New" }]),
      ]}
      onCancel={() => navigate(-1)}
      sections={BUDGET_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={handleProjectChange}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      renderSection={renderSection}
      submitLabel={isEdit ? "Save changes" : "Save estimate"}
      aside={
        <TotalsCard
          title="Summary"
          rows={[
            { label: "Subtotal", value: inr(totals.subtotal) },
            {
              label: `Miscellaneous${Number(values.misc_percentage) ? ` (${values.misc_percentage}%)` : ""}`,
              value: inr(totals.miscAmount),
            },
            {
              label: "Discount",
              value: `− ${inr(values.discount_amount || 0)}`,
            },
            {
              label: `Tax${Number(values.tax_percentage) ? ` (${values.tax_percentage}%)` : ""}`,
              value: inr(totals.taxAmount),
            },
          ]}
          totalLabel="Total estimate"
          total={inr(totals.total)}
          meta={
            categoriesTotal || miscTotal
              ? `Category lines ${inr(categoriesTotal)} · Charges ${inr(miscTotal)}`
              : null
          }
        />
      }
    />
  );
}

export default BudgetEstimateForm;
