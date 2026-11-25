// Command Center › Procurement — every vendor quotation, two ways:
//   Vendor view  — each vendor, the projects it quoted for and the amounts.
//   Project view — each project, its finalised vendors with their latest quotation.
// A quotation is created from the vendor finalised in the comparison sheet, so the
// quotations ARE the finalised vendors. Rejected / cancelled ones are left out.
import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Package, Store } from "lucide-react";
import { Card, EmptyState, Pill, SearchInput, Segmented } from "@/components/inos";
import { useGetProcurementQuotationsQuery } from "@/api/procuerment/procurement-quotation.api";
import "./procurement-panel.css";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const VIEWS = [
  { value: "vendor", label: "Vendor view", icon: Store },
  { value: "project", label: "Project view", icon: Building2 },
];
const TONE = { DRAFT: "mute", SUBMITTED: "warn", APPROVED: "ok", ORDERED: "brand" };
const pretty = (s) => String(s || "").toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const list = (d) => (Array.isArray(d) ? d : d?.data || d?.items || []);

function group(rows, keyOf, nameOf) {
  const m = new Map();
  rows.forEach((r) => {
    const k = keyOf(r);
    if (!m.has(k)) m.set(k, { key: k, name: nameOf(r), rows: [] });
    m.get(k).rows.push(r);
  });
  return [...m.values()]
    .map((g) => ({ ...g, total: g.rows.reduce((s, r) => s + Number(r.total_amount || 0), 0) }))
    .sort((a, b) => b.total - a.total);
}

function QuoteLink({ q, onOpen }) {
  return (
    <button type="button" className="pp-link" onClick={() => onOpen(`/procurement/quotations/${q.id}`)}>
      {q.quotation_number} · v{q.version || 1} <ArrowUpRight aria-hidden />
    </button>
  );
}

export default function ProcurementPanel({ onOpen }) {
  const [view, setView] = useState("vendor");
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useGetProcurementQuotationsQuery({}, { refetchOnMountOrArgChange: 60 });

  const rows = useMemo(
    () => list(data).filter((r) => !["REJECTED", "CANCELLED"].includes(String(r.status).toUpperCase())),
    [data],
  );
  const term = q.trim().toLowerCase();
  const shown = term
    ? rows.filter((r) => `${r.vendor_name} ${r.project_name} ${r.quotation_number}`.toLowerCase().includes(term))
    : rows;
  const vendors = useMemo(() => group(shown, (r) => r.vendor_id || r.vendor_name, (r) => r.vendor_name || "Vendor"), [shown]);
  const projects = useMemo(() => group(shown, (r) => r.project_id || r.project_name, (r) => r.project_name || "Project"), [shown]);
  const total = shown.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  return (
    <Card
      title="Procurement"
      subtitle={`${rows.length} quotation${rows.length === 1 ? "" : "s"} · ${inr(total)} quoted`}
      actions={<Segmented value={view} onChange={setView} options={VIEWS} />}
    >
      <div className="pp-toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={view === "vendor" ? "Search vendors or projects" : "Search projects or vendors"} />
      </div>
      {isLoading && <p className="cc-muted">Loading quotations…</p>}
      {isError && <p className="cc-muted">Couldn't load quotations.</p>}
      {!isLoading && !isError && !shown.length && (
        <EmptyState icon={Package} title="No quotations yet" text="Finalise a vendor in a Vendor Comparison Sheet and create its quotation." />
      )}

      {view === "vendor" &&
        vendors.map((v) => (
          <section key={v.key} className="pp-group" data-testid="pp-vendor">
            <header className="pp-group__head">
              <div>
                <h4>{v.name}</h4>
                <span className="cc-muted">
                  {v.rows[0]?.vendor_type || "Vendor"} · {v.rows.length} project{v.rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <strong className="tabular">{inr(v.total)}</strong>
            </header>
            <table className="pp-table">
              <thead>
                <tr><th>Project</th><th>Quotation</th><th>Status</th><th className="is-num">Amount</th></tr>
              </thead>
              <tbody>
                {v.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.project_name}</td>
                    <td><QuoteLink q={r} onOpen={onOpen} /></td>
                    <td><Pill size="sm" tone={TONE[r.status] || "mute"}>{pretty(r.status)}</Pill></td>
                    <td className="is-num tabular">{inr(r.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

      {view === "project" &&
        projects.map((p) => (
          <section key={p.key} className="pp-group" data-testid="pp-project">
            <header className="pp-group__head">
              <div>
                <h4>{p.name}</h4>
                <span className="cc-muted">
                  {p.rows.length} finalised vendor{p.rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <strong className="tabular">{inr(p.total)}</strong>
            </header>
            <table className="pp-table">
              <thead>
                <tr><th>Finalised vendor</th><th>Latest quotation</th><th>Status</th><th className="is-num">Amount</th></tr>
              </thead>
              <tbody>
                {p.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="pp-strong">{r.vendor_name}</span>
                      {r.vendor_type && <span className="pp-sub">{r.vendor_type}</span>}
                    </td>
                    <td><QuoteLink q={r} onOpen={onOpen} /></td>
                    <td><Pill size="sm" tone={TONE[r.status] || "mute"}>{pretty(r.status)}</Pill></td>
                    <td className="is-num tabular">{inr(r.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
    </Card>
  );
}
