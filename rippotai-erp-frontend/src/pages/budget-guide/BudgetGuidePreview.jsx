import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Printer, Pencil, ArrowLeft } from "lucide-react";
import { Button, Card } from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import {
  useGetBudgetGuideQuery,
  useTransferBudgetGuideMutation,
} from "@/api/documents/budget-guides.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import "./budget-guide.css";

export function BudgetGuideDocument({ guide }) {
  const calc = guide.calculation;
  const money = (value) =>
    `${guide.currency} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const range = (low, high, open = false) =>
    `${money(low)} – ${money(high)}${open ? "+" : ""}`;
  const plans = calc.plans;
  return (
    <article className="bg-document">
      <header>
        <div className="bg-kicker">
          {guide.project_type || "General specification"} · {guide.status} ·
          Revision {guide.revision}
        </div>
        <h1>{guide.title}</h1>
        <p>{guide.introduction}</p>
        <p>
          <strong>Guide valid until {calc.valid_until}.</strong> Indicative
          rates valid until {calc.rates_valid_until}, subject to market
          revision.
        </p>
        <div className="bg-grid">
          <div>
            Issued: {guide.issue_date}
            <br />
            {guide.prepared_by && `Prepared by: ${guide.prepared_by}`}
          </div>
          <div>
            {guide.project?.name ||
              (guide.project_id ? "Linked project" : "Standalone guide")}
            <br />
            {guide.location}
          </div>
        </div>
        <div className="bg-scroll">
          <table className="bg-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Specification</th>
                <th>Target rate / {guide.area_unit}</th>
                <th>Build budget</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.key}>
                  <td>
                    <strong>{plan.name}</strong>
                  </td>
                  <td>{plan.specification || "To be specified"}</td>
                  <td>
                    {range(plan.rate_low, plan.rate_high, plan.upper_open)}
                  </td>
                  <td>
                    {plan.total_low == null
                      ? "Area not specified"
                      : range(
                          plan.total_low,
                          plan.total_high,
                          plan.upper_open &&
                            plan.costing_mode === "distribution",
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bg-footnote">
          {guide.built_up_area == null
            ? "No project area specified."
            : `Built-up area: ${Number(guide.built_up_area).toLocaleString("en-IN")} ${guide.area_unit}.`}{" "}
          Material rates use their own units and are not added to build budgets.{" "}
          {guide.status === "draft" && "Draft for review."}
        </p>
        {!!calc.warnings.length && (
          <div role="status">
            {calc.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}
      </header>
      {plans.map((plan, index) => (
        <div key={plan.key}>
          <section className="bg-section">
            <div className="bg-kicker">Specification plan {index + 1}</div>
            <h2>{plan.name}</h2>
            <p>{plan.specification}</p>
            <div className="bg-plan-summary">
              <strong>
                Target budget:{" "}
                {range(plan.rate_low, plan.rate_high, plan.upper_open)} /{" "}
                {guide.area_unit}
              </strong>
              <br />
              {plan.costing_mode === "distribution"
                ? "Cost distribution from target rate and built-up area"
                : "Itemized cost from quantities and item rates"}
            </div>
            <h3>Cost distribution</h3>
            <div className="bg-scroll">
              <table className="bg-table">
                <thead>
                  <tr>
                    <th>Head of cost</th>
                    <th>Share</th>
                    <th>
                      {plan.costing_mode === "distribution"
                        ? `Rate / ${guide.area_unit}`
                        : "Item amount"}
                    </th>
                    {plan.costing_mode === "distribution" &&
                      guide.built_up_area != null && <th>Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {plan.cost_heads.map((head, h) => (
                    <tr key={h}>
                      <td>
                        {head.name}
                        {head.notes && <small>{head.notes}</small>}
                      </td>
                      <td>
                        {plan.costing_mode === "distribution"
                          ? `${head.share_percent}%`
                          : "—"}
                      </td>
                      <td>
                        {plan.costing_mode === "distribution"
                          ? range(head.rate_low, head.rate_high)
                          : range(head.items_total_low, head.items_total_high)}
                      </td>
                      {plan.costing_mode === "distribution" &&
                        guide.built_up_area != null && (
                          <td>{range(head.amount_low, head.amount_high)}</td>
                        )}
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      {plan.costing_mode === "distribution"
                        ? `${plan.share_total}%`
                        : "—"}
                    </td>
                    <td>
                      <strong>
                        {plan.costing_mode === "distribution"
                          ? range(
                              plan.rate_low,
                              plan.rate_high,
                              plan.upper_open,
                            )
                          : range(plan.total_low, plan.total_high)}
                      </strong>
                    </td>
                    {plan.costing_mode === "distribution" &&
                      guide.built_up_area != null && (
                        <td>
                          <strong>
                            {range(
                              plan.total_low,
                              plan.total_high,
                              plan.upper_open,
                            )}
                          </strong>
                        </td>
                      )}
                  </tr>
                </tbody>
              </table>
            </div>
            {plan.cost_heads
              .filter((head) => head.items.length)
              .map((head, h) => (
                <div key={h}>
                  <h3>{head.name} — dedicated items</h3>
                  <div className="bg-scroll">
                    <table className="bg-table">
                      <thead>
                        <tr>
                          <th>Item & specification</th>
                          <th>Qty</th>
                          <th>Unit</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {head.items.map((item, i) => (
                          <tr key={i}>
                            <td>
                              {item.name}
                              {item.specification && (
                                <small>{item.specification}</small>
                              )}
                              {item.notes && <small>{item.notes}</small>}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>{range(item.rate_low, item.rate_high)}</td>
                            <td>{range(item.amount_low, item.amount_high)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4}>
                            <strong>Items subtotal</strong>
                          </td>
                          <td>
                            {range(head.items_total_low, head.items_total_high)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            {plan.costing_mode === "distribution" &&
              plan.cost_heads.some((head) => head.items.length) && (
                <p className="bg-footnote">
                  Dedicated item subtotals are shown separately. They are not
                  added to the percentage distribution.
                </p>
              )}
          </section>
          <section className="bg-section">
            <div className="bg-kicker">{plan.name}</div>
            <h2>Material Rate Schedule</h2>
            <p className="bg-footnote">
              Indicative material unit rates. Fitted rates include installation
              and associated labour; others are supply-only unless stated.
            </p>
            <div className="bg-scroll">
              <table className="bg-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Brand / make & specification</th>
                    <th>Indicative rate</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.materials.map((row, i) => (
                    <tr key={i}>
                      <td>{row.category}</td>
                      <td>
                        {row.brand_make}
                        {row.specification && (
                          <small>{row.specification}</small>
                        )}
                        {row.notes && <small>{row.notes}</small>}
                      </td>
                      <td>{range(row.rate_low, row.rate_high)}</td>
                      <td>
                        {row.unit}
                        {row.fitted && <small>Fitted</small>}
                      </td>
                    </tr>
                  ))}
                  {!plan.materials.length && (
                    <tr>
                      <td colSpan={4}>Material schedule to be completed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ))}
      <section className="bg-section">
        <div className="bg-kicker">Reference</div>
        <h2>How We Price</h2>
        <div className="bg-scroll">
          <table className="bg-table">
            <thead>
              <tr>
                <th>Head</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {guide.pricing_notes.map((note, i) => (
                <tr key={i}>
                  <td>
                    <strong>{note.heading}</strong>
                  </td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{note.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-section">
        <div className="bg-kicker">Next steps</div>
        <h2>What Happens Next</h2>
        <div className="bg-scroll">
          <table className="bg-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {guide.next_steps.map((note, i) => (
                <tr key={i}>
                  <td>
                    <strong>
                      {i + 1}. {note.heading}
                    </strong>
                  </td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{note.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bg-footnote">
          Guide validity: {guide.validity_months} months from issue. Rates:{" "}
          {guide.rate_validity_days} days from issue. Re-confirm rates before
          ordering. The final proposal and bill of quantities govern.
        </p>
      </section>
    </article>
  );
}
export default function BudgetGuidePreview() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const canRead = user?.permissions?.includes("budget-guides:read");
  const canCopy =
    canRead &&
    user?.permissions?.includes("budget-guides:create") &&
    user?.permissions?.includes("projects:read");
  const [projectId, setProjectId] = useState("");
  const [transfer, transferring] = useTransferBudgetGuideMutation();
  const projectQuery = useGetProjectsQuery(undefined, { skip: !canCopy });
  const projects = Array.isArray(projectQuery.data)
    ? projectQuery.data
    : projectQuery.data?.items || projectQuery.data?.data || [];
  const { data, isLoading, isError, error, refetch } = useGetBudgetGuideQuery(
    id,
    { skip: !canRead },
  );
  return (
    <div className="bg-preview-shell">
      <div className="bg-preview-actions">
        <Button
          icon={ArrowLeft}
          onClick={() => navigate("/ledger/budget-guides/all")}
        >
          Budget Guides
        </Button>
        {user?.permissions?.includes("budget-guides:update") && (
          <Button
            icon={Pencil}
            onClick={() => navigate(`/ledger/budget-guides/${id}/edit`)}
          >
            Edit guide
          </Button>
        )}
        <Button icon={Printer} disabled={!data} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>
      {data && canCopy && (
        <div className="bg-preview-actions">
          <details>
            <summary>Copy this guide to a project</summary>
            <p>
              The original remains unchanged; the project gets an independent
              draft.
            </p>
            <div className="bg-toolbar">
              <select
                className="inos-input"
                aria-label="Copy destination project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Choose a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                disabled={!projectId}
                loading={transferring.isLoading}
                onClick={async () => {
                  try {
                    const copy = await transfer({
                      id,
                      body: {
                        project_id: projectId,
                        expected_revision: data.revision,
                      },
                    }).unwrap();
                    toast.success("Project copy created");
                    setProjectId("");
                    navigate(
                      `/ledger/budget-guides/${copy.id}${user?.permissions?.includes("budget-guides:update") ? "/edit" : ""}`,
                    );
                  } catch (e) {
                    toast.error(
                      e?.data?.message || "Could not create project copy",
                    );
                  }
                }}
              >
                Create project copy
              </Button>
            </div>
            {projectQuery.isError && (
              <p role="alert">
                Could not load projects.{" "}
                <Button onClick={projectQuery.refetch}>Retry</Button>
              </p>
            )}
          </details>
        </div>
      )}
      {!canRead ? (
        <Card>You need budget guide read permission.</Card>
      ) : isLoading ? (
        <Card>Loading guide…</Card>
      ) : isError ? (
        <Card>
          <p role="alert">
            {error?.data?.message || "Could not load guide"}{" "}
            <Button onClick={refetch}>Retry</Button>
          </p>
        </Card>
      ) : (
        data && <BudgetGuideDocument guide={data} />
      )}
    </div>
  );
}
