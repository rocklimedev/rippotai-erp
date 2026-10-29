import { appConfirm } from "@/lib/app-dialog";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Save, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader, Card, Button } from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import {
  useGetBudgetGuideQuery,
  useGetBudgetGuideTemplateQuery,
  useLazyGetBudgetGuideTemplateQuery,
  useCreateBudgetGuideMutation,
  useUpdateBudgetGuideMutation,
  useTransferBudgetGuideMutation,
} from "@/api/documents/budget-guides.api";
import "./budget-guide.css";

const message = (e) =>
  Array.isArray(e?.data?.message)
    ? e.data.message.join("; ")
    : e?.data?.message || "Could not save budget guide";
const clone = (data) => JSON.parse(JSON.stringify(data));
const fields = [
  "title",
  "project_id",
  "project_type",
  "location",
  "prepared_by",
  "currency",
  "area_unit",
  "built_up_area",
  "issue_date",
  "validity_months",
  "rate_validity_days",
  "status",
  "introduction",
  "plans",
  "pricing_notes",
  "next_steps",
];
const num = (value) => (value === "" ? 0 : Number(value));
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  ...props
}) {
  return (
    <label className="bg-field">
      {label}
      <input
        className="inos-input"
        value={value ?? ""}
        type={type}
        required={required}
        onChange={(e) =>
          onChange(type === "number" ? num(e.target.value) : e.target.value)
        }
        {...props}
      />
    </label>
  );
}
function NoteEditor({ title, notes, onChange }) {
  return (
    <Card
      title={title}
      actions={
        <Button
          icon={Plus}
          onClick={() => onChange([...notes, { heading: "", text: "" }])}
          disabled={notes.length >= 30}
        >
          Add note
        </Button>
      }
    >
      {notes.map((note, index) => (
        <div className="bg-head" key={index}>
          <div className="bg-grid">
            <Field
              label="Heading"
              value={note.heading}
              required
              maxLength={255}
              onChange={(heading) =>
                onChange(
                  notes.map((n, i) => (i === index ? { ...n, heading } : n)),
                )
              }
            />
            <label className="bg-field">
              Details
              <textarea
                className="inos-input"
                maxLength={8000}
                value={note.text}
                onChange={(e) =>
                  onChange(
                    notes.map((n, i) =>
                      i === index ? { ...n, text: e.target.value } : n,
                    ),
                  )
                }
              />
            </label>
          </div>
          <Button
            size="sm"
            icon={Trash2}
            onClick={() => onChange(notes.filter((_, i) => i !== index))}
          >
            Remove note
          </Button>
        </div>
      ))}
    </Card>
  );
}
export default function BudgetGuideEditor() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const permissions = user?.permissions || [],
    canRead = permissions.includes("budget-guides:read");
  const canEdit = permissions.includes(
    `budget-guides:${id ? "update" : "create"}`,
  );
  const canProject = permissions.includes("projects:read");
  const existing = useGetBudgetGuideQuery(id, { skip: !id || !canRead });
  const template = useGetBudgetGuideTemplateQuery(undefined, {
    skip: !!id || !canRead,
  });
  const projectQuery = useGetProjectsQuery(undefined, {
    skip: !canProject || !canEdit,
  });
  const projects = Array.isArray(projectQuery.data)
    ? projectQuery.data
    : projectQuery.data?.items || projectQuery.data?.data || [];
  const [loadTemplate, loadingTemplate] = useLazyGetBudgetGuideTemplateQuery();
  const [create, creating] = useCreateBudgetGuideMutation(),
    [update, updating] = useUpdateBudgetGuideMutation(),
    [transfer, transferring] = useTransferBudgetGuideMutation();
  const [draft, setDraft] = useState(null),
    [tab, setTab] = useState(0),
    [dirty, setDirty] = useState(false),
    [transferProject, setTransferProject] = useState(""),
    [conflict, setConflict] = useState(false);
  const source = id ? existing : template;
  useEffect(() => {
    setDraft(null);
    setDirty(false);
    setTransferProject("");
    setConflict(false);
  }, [id]);
  useEffect(() => {
    if (!draft && source.currentData) setDraft(clone(source.currentData));
  }, [source.currentData, draft]);
  const edit = (patch) => {
    setDraft((old) => ({ ...old, ...patch }));
    setDirty(true);
  };
  if (!canRead || !canEdit)
    return (
      <Page>
        <Card>
          You need budget guide read and {id ? "update" : "create"} permissions.
        </Card>
      </Page>
    );
  if (!draft)
    return (
      <Page>
        <Card>
          {source.isError ? (
            <p role="alert">
              {message(source.error)}{" "}
              <Button onClick={source.refetch}>Retry</Button>
            </p>
          ) : (
            "Loading budget guide…"
          )}
        </Card>
      </Page>
    );
  const plan = draft.plans[tab],
    busy =
      creating.isLoading ||
      updating.isLoading ||
      transferring.isLoading ||
      loadingTemplate.isFetching;
  const patchPlan = (patch) =>
    edit({
      plans: draft.plans.map((p, i) => (i === tab ? { ...p, ...patch } : p)),
    });
  const patchHead = (index, patch) =>
    patchPlan({
      cost_heads: plan.cost_heads.map((head, i) =>
        i === index ? { ...head, ...patch } : head,
      ),
    });
  const patchItem = (headIndex, itemIndex, patch) =>
    patchHead(headIndex, {
      items: plan.cost_heads[headIndex].items.map((item, i) =>
        i === itemIndex ? { ...item, ...patch } : item,
      ),
    });
  const share = plan.cost_heads.reduce(
    (total, head) => total + Number(head.share_percent || 0),
    0,
  );
  const itemLow = plan.cost_heads.reduce(
    (sum, h) =>
      sum +
      h.items.reduce(
        (s, item) =>
          s + Number(item.quantity || 0) * Number(item.rate_low || 0),
        0,
      ),
    0,
  );
  const itemHigh = plan.cost_heads.reduce(
    (sum, h) =>
      sum +
      h.items.reduce(
        (s, item) =>
          s + Number(item.quantity || 0) * Number(item.rate_high || 0),
        0,
      ),
    0,
  );
  const money = (value) =>
    `${draft.currency} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const submit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(fields.map((key) => [key, draft[key]]));
    try {
      const result = await (
        id
          ? update({ id, body: { ...body, expected_revision: draft.revision } })
          : create(body)
      ).unwrap();
      setDraft(clone(result));
      setDirty(false);
      setConflict(false);
      toast.success("Budget guide saved");
      if (!id)
        navigate(
          `/ledger/budget-guides/${result.id}${permissions.includes("budget-guides:update") ? "/edit" : ""}`,
          { replace: true },
        );
    } catch (error) {
      if (error.status === 409) setConflict(true);
      toast.error(message(error));
    }
  };
  return (
    <Page className="bg-editor">
      <PageHeader
        crumbs={[
          { label: "Ledger", to: "/ledger" },
          { label: "Budget Guides", to: "/ledger/budget-guides/all" },
        ]}
        title={id ? "Edit Budget Guide" : "New Budget Guide"}
        subtitle="Three editable plans with independent cost items and material schedules. A project is optional."
        actions={
          <>
            {id && (
              <Button
                icon={FileText}
                disabled={dirty}
                onClick={() => navigate(`/ledger/budget-guides/${id}`)}
              >
                Preview saved guide
              </Button>
            )}
            <Button
              variant="primary"
              icon={Save}
              type="submit"
              form="budget-guide-form"
              loading={busy}
            >
              Save guide
            </Button>
          </>
        }
      />
      {dirty && (
        <p role="status">
          You have unsaved changes. Save before previewing or copying to a
          project.
        </p>
      )}
      {conflict && (
        <p role="alert">
          Another person updated this guide.{" "}
          <Button
            onClick={async () => {
              if (
                !(await appConfirm(
                  "Reload the latest guide and discard your unsaved edits?",
                ))
              )
                return;
              try {
                const latest = await existing.refetch().unwrap();
                setDraft(clone(latest));
                setDirty(false);
                setConflict(false);
              } catch (e) {
                toast.error(message(e));
              }
            }}
          >
            Reload latest guide
          </Button>
        </p>
      )}
      <form id="budget-guide-form" onSubmit={submit}>
        <fieldset
          disabled={busy}
          style={{ border: 0, padding: 0, minWidth: 0 }}
        >
          <Card
            title="Guide details"
            actions={
              !id && (
                <Button
                  onClick={async () => {
                    if (
                      dirty &&
                      !(await appConfirm(
                        "Replace this draft with the construction reference template?",
                      ))
                    )
                      return;
                    try {
                      const seed = await loadTemplate("construction").unwrap();
                      setDraft(clone(seed));
                      setDirty(true);
                      toast.info(
                        "Reference prices loaded. Review them before publishing.",
                      );
                    } catch (e) {
                      toast.error(message(e));
                    }
                  }}
                >
                  Use construction reference
                </Button>
              )
            }
          >
            <div className="bg-grid">
              <Field
                label="Guide title"
                value={draft.title}
                required
                maxLength={255}
                onChange={(title) => edit({ title })}
              />
              <label className="bg-field">
                Project (optional)
                <select
                  className="inos-input"
                  disabled={!canProject}
                  value={draft.project_id || ""}
                  onChange={(e) => edit({ project_id: e.target.value || null })}
                >
                  <option value="">Standalone / generic</option>
                  {draft.project_id &&
                    !projects.some((p) => p.id === draft.project_id) && (
                      <option value={draft.project_id}>
                        {draft.project?.name || "Linked project"}
                      </option>
                    )}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Project type"
                value={draft.project_type}
                maxLength={255}
                onChange={(project_type) => edit({ project_type })}
              />
              <Field
                label="Location / rate region"
                value={draft.location}
                maxLength={255}
                onChange={(location) => edit({ location })}
              />
              <Field
                label="Prepared by"
                value={draft.prepared_by}
                maxLength={255}
                onChange={(prepared_by) => edit({ prepared_by })}
              />
              <Field
                label="Currency (3-letter code)"
                value={draft.currency}
                required
                pattern="[A-Z]{3}"
                maxLength={3}
                onChange={(currency) =>
                  edit({ currency: currency.toUpperCase() })
                }
              />
              <Field
                label="Built-up area unit"
                value={draft.area_unit}
                required
                maxLength={80}
                onChange={(area_unit) => edit({ area_unit })}
              />
              <label className="bg-field">
                Built-up area (optional)
                <input
                  className="inos-input"
                  type="number"
                  min="0"
                  max="100000000"
                  step="0.0001"
                  value={draft.built_up_area ?? ""}
                  onChange={(e) =>
                    edit({
                      built_up_area:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <Field
                label="Issue date"
                type="date"
                required
                value={draft.issue_date}
                onChange={(issue_date) => edit({ issue_date })}
              />
              <Field
                label="Guide validity (months)"
                type="number"
                required
                min={1}
                max={60}
                step={1}
                value={draft.validity_months}
                onChange={(validity_months) => edit({ validity_months })}
              />
              <Field
                label="Rate validity (days)"
                type="number"
                required
                min={1}
                max={365}
                step={1}
                value={draft.rate_validity_days}
                onChange={(rate_validity_days) => edit({ rate_validity_days })}
              />
              <label className="bg-field">
                Status
                <select
                  className="inos-input"
                  value={draft.status}
                  onChange={(e) => edit({ status: e.target.value })}
                >
                  {["draft", "published", "archived"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            {projectQuery.isError && (
              <p role="alert">
                Projects could not be loaded.{" "}
                <Button onClick={projectQuery.refetch}>Retry projects</Button>
              </p>
            )}
            <label className="bg-field">
              Introduction
              <textarea
                className="inos-input"
                maxLength={8000}
                value={draft.introduction}
                onChange={(e) => edit({ introduction: e.target.value })}
              />
            </label>
          </Card>
          <div className="bg-tabs" role="tablist" aria-label="Budget plans">
            {draft.plans.map((p, i) => (
              <Button
                key={p.key}
                role="tab"
                aria-selected={tab === i}
                variant={tab === i ? "primary" : "secondary"}
                onClick={() => setTab(i)}
              >
                {i + 1}. {p.name}
              </Button>
            ))}
          </div>
          <Card title={`${plan.name} plan`}>
            <div className="bg-grid">
              <Field
                label="Plan name"
                value={plan.name}
                required
                maxLength={100}
                onChange={(name) => patchPlan({ name })}
              />
              <label className="bg-field">
                Costing method
                <select
                  className="inos-input"
                  value={plan.costing_mode}
                  onChange={(e) => patchPlan({ costing_mode: e.target.value })}
                >
                  <option value="distribution">
                    Target rate × cost share × area
                  </option>
                  <option value="itemized">
                    Sum of item quantities × rates
                  </option>
                </select>
              </label>
              <Field
                label={`Target lower rate / ${draft.area_unit}`}
                type="number"
                required
                min={0}
                max={100000000}
                step="0.01"
                value={plan.rate_low}
                onChange={(rate_low) => patchPlan({ rate_low })}
              />
              <Field
                label={`Target upper rate / ${draft.area_unit}`}
                type="number"
                required
                min={plan.rate_low}
                max={100000000}
                step="0.01"
                value={plan.rate_high}
                onChange={(rate_high) => patchPlan({ rate_high })}
              />
              <label className="bg-field">
                Upper range
                <input
                  type="checkbox"
                  checked={plan.upper_open}
                  onChange={(e) => patchPlan({ upper_open: e.target.checked })}
                />{" "}
                May exceed upper rate (+)
              </label>
            </div>
            <label className="bg-field">
              Specification
              <textarea
                className="inos-input"
                maxLength={4000}
                value={plan.specification}
                onChange={(e) => patchPlan({ specification: e.target.value })}
              />
            </label>
            <div className="bg-plan-summary">
              {plan.costing_mode === "distribution" ? (
                <>
                  Cost shares: <strong>{Number(share.toFixed(2))}%</strong>
                  {Math.abs(share - 100) > 0.005 &&
                    " · Must total 100% before publishing."}
                  <div>
                    {draft.built_up_area == null
                      ? "Enter built-up area to calculate a project budget."
                      : `Indicative build budget: ${money(plan.rate_low * draft.built_up_area)} – ${money(plan.rate_high * draft.built_up_area)}${plan.upper_open ? "+" : ""}`}
                  </div>
                </>
              ) : (
                <div>
                  Itemized budget: {money(itemLow)} – {money(itemHigh)}
                </div>
              )}
              <small>
                Material rate schedules are reference rates and are not added to
                these totals.
              </small>
            </div>
            <div className="bg-toolbar">
              <h3>Cost breakdown & items</h3>
              <Button
                icon={Plus}
                disabled={plan.cost_heads.length >= 100}
                onClick={() =>
                  patchPlan({
                    cost_heads: [
                      ...plan.cost_heads,
                      { name: "", share_percent: 0, notes: "", items: [] },
                    ],
                  })
                }
              >
                Add cost head
              </Button>
            </div>
            {!plan.cost_heads.length && (
              <p>
                Add cost heads, then add any dedicated items under each head.
              </p>
            )}
            {plan.cost_heads.map((head, h) => (
              <div className="bg-head" key={h}>
                <div className="bg-grid">
                  <Field
                    label="Cost head"
                    required
                    value={head.name}
                    maxLength={255}
                    onChange={(name) => patchHead(h, { name })}
                  />
                  <Field
                    label="Share (%)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={head.share_percent}
                    onChange={(share_percent) =>
                      patchHead(h, { share_percent })
                    }
                  />
                  <Field
                    label="Head notes"
                    value={head.notes || ""}
                    maxLength={4000}
                    onChange={(notes) => patchHead(h, { notes })}
                  />
                </div>
                {plan.costing_mode === "distribution" && (
                  <p>
                    Allocated rate:{" "}
                    {money((plan.rate_low * head.share_percent) / 100)} –{" "}
                    {money((plan.rate_high * head.share_percent) / 100)} /{" "}
                    {draft.area_unit}
                  </p>
                )}
                <div className="bg-scroll">
                  <table className="bg-table">
                    <thead>
                      <tr>
                        <th>Item / specification</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Lower rate</th>
                        <th>Upper rate</th>
                        <th>Amount range</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {head.items.map((item, j) => (
                        <tr key={j}>
                          <td className="bg-wide">
                            <input
                              aria-label="Item name"
                              className="inos-input"
                              placeholder="Item name"
                              required
                              maxLength={255}
                              value={item.name}
                              onChange={(e) =>
                                patchItem(h, j, { name: e.target.value })
                              }
                            />
                            <textarea
                              aria-label="Item specification"
                              className="inos-input"
                              placeholder="Specification"
                              maxLength={4000}
                              value={item.specification || ""}
                              onChange={(e) =>
                                patchItem(h, j, {
                                  specification: e.target.value,
                                })
                              }
                            />
                            <input
                              aria-label="Item notes"
                              className="inos-input"
                              placeholder="Notes"
                              maxLength={4000}
                              value={item.notes || ""}
                              onChange={(e) =>
                                patchItem(h, j, { notes: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              aria-label="Item unit"
                              className="inos-input"
                              required
                              maxLength={80}
                              value={item.unit}
                              onChange={(e) =>
                                patchItem(h, j, { unit: e.target.value })
                              }
                            />
                          </td>
                          {["quantity", "rate_low", "rate_high"].map((key) => (
                            <td key={key} className="bg-number">
                              <input
                                aria-label={`Item ${key}`}
                                className="inos-input"
                                type="number"
                                required
                                min={key === "rate_high" ? item.rate_low : 0}
                                max={100000000}
                                step={key === "quantity" ? "0.0001" : "0.01"}
                                value={item[key]}
                                onChange={(e) =>
                                  patchItem(h, j, {
                                    [key]: num(e.target.value),
                                  })
                                }
                              />
                            </td>
                          ))}
                          <td>
                            {money(item.quantity * item.rate_low)} –{" "}
                            {money(item.quantity * item.rate_high)}
                          </td>
                          <td>
                            <Button
                              icon={Trash2}
                              aria-label="Remove item"
                              onClick={() =>
                                patchHead(h, {
                                  items: head.items.filter((_, i) => i !== j),
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-toolbar">
                  <Button
                    size="sm"
                    icon={Plus}
                    disabled={head.items.length >= 200}
                    onClick={() =>
                      patchHead(h, {
                        items: [
                          ...head.items,
                          {
                            name: "",
                            specification: "",
                            unit: "unit",
                            quantity: 1,
                            rate_low: 0,
                            rate_high: 0,
                            notes: "",
                          },
                        ],
                      })
                    }
                  >
                    Add item
                  </Button>
                  <Button
                    size="sm"
                    icon={Trash2}
                    onClick={async () => {
                      if (
                        head.items.length &&
                        !(await appConfirm("Remove this cost head and its items?"))
                      )
                        return;
                      patchPlan({
                        cost_heads: plan.cost_heads.filter((_, i) => i !== h),
                      });
                    }}
                  >
                    Remove cost head
                  </Button>
                </div>
              </div>
            ))}
            <div className="bg-toolbar">
              <h3>Material rate schedule</h3>
              <Button
                icon={Plus}
                disabled={plan.materials.length >= 200}
                onClick={() =>
                  patchPlan({
                    materials: [
                      ...plan.materials,
                      {
                        category: "",
                        brand_make: "",
                        specification: "",
                        unit: "unit",
                        rate_low: 0,
                        rate_high: 0,
                        fitted: false,
                        notes: "",
                      },
                    ],
                  })
                }
              >
                Add material
              </Button>
            </div>
            <div className="bg-scroll">
              <table className="bg-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Brand / make & specification</th>
                    <th>Unit</th>
                    <th>Lower rate</th>
                    <th>Upper rate</th>
                    <th>Fitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {plan.materials.map((material, m) => {
                    const change = (patch) =>
                      patchPlan({
                        materials: plan.materials.map((row, i) =>
                          i === m ? { ...row, ...patch } : row,
                        ),
                      });
                    return (
                      <tr key={m}>
                        <td className="bg-wide">
                          <input
                            aria-label="Material category"
                            className="inos-input"
                            value={material.category}
                            required
                            maxLength={255}
                            onChange={(e) =>
                              change({ category: e.target.value })
                            }
                          />
                          <textarea
                            className="inos-input"
                            aria-label="Material notes"
                            placeholder="Notes"
                            maxLength={4000}
                            value={material.notes || ""}
                            onChange={(e) => change({ notes: e.target.value })}
                          />
                        </td>
                        <td className="bg-wide">
                          <input
                            aria-label="Brand / make"
                            className="inos-input"
                            maxLength={1000}
                            value={material.brand_make}
                            onChange={(e) =>
                              change({ brand_make: e.target.value })
                            }
                          />
                          <textarea
                            aria-label="Material specification"
                            className="inos-input"
                            placeholder="Specification"
                            maxLength={4000}
                            value={material.specification || ""}
                            onChange={(e) =>
                              change({ specification: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            aria-label="Material unit"
                            className="inos-input"
                            required
                            maxLength={80}
                            value={material.unit}
                            onChange={(e) => change({ unit: e.target.value })}
                          />
                        </td>
                        {["rate_low", "rate_high"].map((key) => (
                          <td key={key} className="bg-number">
                            <input
                              aria-label={`Material ${key}`}
                              type="number"
                              className="inos-input"
                              min={key === "rate_high" ? material.rate_low : 0}
                              required
                              max={100000000}
                              step="0.01"
                              value={material[key]}
                              onChange={(e) =>
                                change({ [key]: num(e.target.value) })
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            aria-label="Supply and installation included"
                            type="checkbox"
                            checked={material.fitted}
                            onChange={(e) =>
                              change({ fitted: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <Button
                            icon={Trash2}
                            aria-label="Remove material"
                            onClick={() =>
                              patchPlan({
                                materials: plan.materials.filter(
                                  (_, i) => i !== m,
                                ),
                              })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {!plan.materials.length && (
                    <tr>
                      <td colSpan={7}>Add material rates for this plan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <NoteEditor
            title="Pricing notes & exclusions"
            notes={draft.pricing_notes}
            onChange={(pricing_notes) => edit({ pricing_notes })}
          />
          <NoteEditor
            title="Next steps"
            notes={draft.next_steps}
            onChange={(next_steps) => edit({ next_steps })}
          />
          <div className="bg-toolbar">
            <Button variant="primary" type="submit" icon={Save} loading={busy}>
              Save guide
            </Button>
            <Button
              onClick={async () => {
                if (dirty && !(await appConfirm("Leave without saving changes?")))
                  return;
                navigate("/ledger/budget-guides/all");
              }}
            >
              Back to guides
            </Button>
          </div>
        </fieldset>
      </form>
      {id && canProject && permissions.includes("budget-guides:create") && (
        <Card
          title="Copy guide to a project"
          subtitle="Creates an independent draft linked to the selected project. This guide stays unchanged."
        >
          <div className="bg-toolbar">
            <select
              className="inos-input"
              aria-label="Destination project"
              value={transferProject}
              onChange={(e) => setTransferProject(e.target.value)}
            >
              <option value="">Choose a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button
              disabled={!transferProject || dirty || busy}
              onClick={async () => {
                try {
                  const result = await transfer({
                    id,
                    body: {
                      project_id: transferProject,
                      expected_revision: draft.revision,
                    },
                  }).unwrap();
                  toast.success("Project copy created");
                  navigate(`/ledger/budget-guides/${result.id}/edit`);
                } catch (e) {
                  toast.error(message(e));
                }
              }}
            >
              Create project copy
            </Button>
          </div>
        </Card>
      )}
    </Page>
  );
}
