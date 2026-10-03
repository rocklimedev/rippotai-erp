// Inventory: site stock per project × material, and the movement ledger.
// /inventory/site-inventory/all (stock) and /inventory/site-inventory/transactions (movements)
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Boxes, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, PackageX } from "lucide-react";
import { Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SearchInput, SelectInput, Tabs, Pill, EmptyState, Stats, StatTile, Progress } from "@/components/inos";
import { useGetWsInventoryOverviewQuery } from "@/api/workspace/workspace.api";
import { fmtDate, Loading, Meta } from "./shared";

const num = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const stockState = (r) => {
  const bal = Number(r.balance);
  if (bal <= 0) return { tone: "bad", label: "Out of stock" };
  if (Number(r.received) > 0 && bal / Number(r.received) < 0.15) return { tone: "warn", label: "Low" };
  return { tone: "ok", label: "In stock" };
};
const TYPE_TONE = { RECEIPT: "ok", ISSUE: "info", RETURN_TO_VENDOR: "peach", RETURN_FROM_CONTRACTOR: "lilac", ADJUSTMENT_IN: "mute", ADJUSTMENT_OUT: "mute", TRANSFER_IN: "lilac", TRANSFER_OUT: "lilac" };
const pretty = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase());

export default function InventoryPage({ tab: initialTab = "stock" }) {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const project = sp.get("project_id") || "";
  const material = sp.get("material_id") || "";
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const { data, isLoading, isError, refetch } = useGetWsInventoryOverviewQuery(project || undefined);

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);
    v ? n.set(k, v) : n.delete(k);
    setSp(n, { replace: true });
  };

  const stock = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.stock || [])
      .filter((r) => !s || `${r.material_name} ${r.material_code} ${r.category} ${r.project_name}`.toLowerCase().includes(s))
      .filter((r) => !state || stockState(r).tone === state);
  }, [data, q, state]);
  const moves = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.movements || [])
      .filter((m) => !material || m.material_code === material || m.material_name === material)
      .filter((m) => !s || `${m.material_name} ${m.material_code} ${m.project_name} ${m.transaction_type} ${m.issued_to || ""} ${m.remarks || ""}`.toLowerCase().includes(s));
  }, [data, q, material]);

  const totals = useMemo(() => {
    const all = data?.stock || [];
    return {
      lines: all.length,
      low: all.filter((r) => stockState(r).tone === "warn").length,
      out: all.filter((r) => stockState(r).tone === "bad").length,
      receipts: (data?.movements || []).filter((m) => m.direction === "IN").length,
      issues: (data?.movements || []).filter((m) => m.direction === "OUT").length,
    };
  }, [data]);

  const record = () => navigate(`/inventory/site-inventory/transactions/new${project ? `?project_id=${project}` : ""}`);

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Inventory", to: "/inventory" }, { label: tab === "stock" ? "Site inventory" : "Movements" }]}
        title={tab === "stock" ? "Site inventory" : "Inventory movements"}
        subtitle="Material received at site, issued to trades and what's left — per project."
        actions={<Button variant="primary" icon={Plus} onClick={record} data-testid="record-txn">Record movement</Button>}
      />
      <Stats>
        <StatTile label="Stock lines" value={totals.lines} icon={<Boxes size={16} />} onClick={() => { setTab("stock"); setState(""); }} />
        <StatTile label="Low stock" value={totals.low} icon={<AlertTriangle size={16} />} tone="warn" onClick={() => { setTab("stock"); setState("warn"); }} active={state === "warn"} />
        <StatTile label="Out of stock" value={totals.out} icon={<PackageX size={16} />} tone="bad" onClick={() => { setTab("stock"); setState("bad"); }} active={state === "bad"} />
        <StatTile label="Receipts" value={totals.receipts} icon={<ArrowDownToLine size={16} />} tone="ok" onClick={() => setTab("moves")} />
        <StatTile label="Issues" value={totals.issues} icon={<ArrowUpFromLine size={16} />} tone="info" onClick={() => setTab("moves")} />
      </Stats>
      <Tabs value={tab} onChange={(v) => { setTab(v); navigate(v === "stock" ? `/inventory/site-inventory/all?${sp}` : `/inventory/site-inventory/transactions?${sp}`, { replace: true }); }} options={[{ value: "stock", label: "Stock", count: stock.length }, { value: "moves", label: "Movements", count: moves.length }]} />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder={tab === "stock" ? "Search material, code or category" : "Search material, trade, remarks"} />
        <SelectInput value={project} onChange={(e) => setParam("project_id", e.target.value)} style={{ width: 240 }} aria-label="Project">
          <option value="">All projects</option>
          {(data?.projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectInput>
        {tab === "stock" && (
          <SelectInput value={state} onChange={(e) => setState(e.target.value)} style={{ width: 160 }} aria-label="Stock status">
            <option value="">Any status</option><option value="ok">In stock</option><option value="warn">Low</option><option value="bad">Out of stock</option>
          </SelectInput>
        )}
        {material && tab === "moves" && <Button size="sm" variant="ghost" onClick={() => setParam("material_id", "")}>Material: {material} ×</Button>}
        <ToolbarSpacer />
      </Toolbar>

      {isLoading ? (
        <Card><Loading /></Card>
      ) : isError ? (
        <Card><EmptyState icon={Boxes} title="Couldn't load inventory" action={<Button onClick={refetch}>Retry</Button>} /></Card>
      ) : tab === "stock" ? (
        <Card flush>
          {!stock.length ? (
            <EmptyState icon={Boxes} title={q || state ? "No materials match" : "No stock recorded yet"} text="Receive material against a delivery challan or record opening stock to start the ledger." action={<Button variant="primary" icon={Plus} onClick={record}>Record movement</Button>} />
          ) : (
            <div className="inos-table-wrap">
              <table className="inos-table">
                <thead><tr><th>Material</th>{!project && <th>Project</th>}<th className="num">Received</th><th className="num">Issued</th><th className="num">Balance</th><th>Used</th><th>Last movement</th><th>Status</th></tr></thead>
                <tbody>
                  {stock.map((r) => {
                    const st = stockState(r);
                    const used = Number(r.received) ? (Number(r.issued) / Number(r.received)) * 100 : 0;
                    return (
                      <tr key={`${r.project_id}:${r.material_id}`} className="is-clickable" data-testid="stock-row"
                        onClick={() => { setTab("moves"); const n = new URLSearchParams(sp); n.set("project_id", r.project_id); n.set("material_id", r.material_code); navigate(`/inventory/site-inventory/transactions?${n}`, { replace: true }); }}>
                        <td><div style={{ fontWeight: 600 }}>{r.material_name}</div><Meta>{r.material_code} · {r.category}</Meta></td>
                        {!project && <td>{r.project_name}</td>}
                        <td className="num tabular">{num(r.received)} <Meta>{r.unit}</Meta></td>
                        <td className="num tabular">{num(r.issued)}</td>
                        <td className="num tabular" style={{ fontWeight: 700 }}>{num(r.balance)} <Meta>{r.unit}</Meta></td>
                        <td style={{ minWidth: 110 }}><div style={{ width: 90 }}><Progress value={used} tone={used > 85 ? "warn" : undefined} /></div></td>
                        <td>{fmtDate(r.last_movement)}</td>
                        <td><Pill tone={st.tone} size="sm">{st.label}</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card flush>
          {!moves.length ? (
            <EmptyState icon={ArrowDownToLine} title="No movements match" text="Clear the search or pick another project." />
          ) : (
            <div className="inos-table-wrap">
              <table className="inos-table">
                <thead><tr><th>Date</th><th>Material</th>{!project && <th>Project</th>}<th>Type</th><th className="num">Quantity</th><th>Issued to / from</th><th>Store</th></tr></thead>
                <tbody>
                  {moves.map((m) => (
                    <tr key={m.id} className="is-clickable" onClick={() => navigate(`/inventory/site-inventory/transactions/${m.id}`)} data-testid="move-row">
                      <td>{fmtDate(m.transaction_date)}</td>
                      <td><div style={{ fontWeight: 600 }}>{m.material_name}</div><Meta>{m.material_code}</Meta></td>
                      {!project && <td>{m.project_name}</td>}
                      <td><Pill tone={TYPE_TONE[m.transaction_type] || "mute"} size="sm">{pretty(m.transaction_type)}</Pill></td>
                      <td className="num tabular" style={{ fontWeight: 650, color: m.direction === "IN" ? "var(--ok-fg)" : "var(--text)" }}>{m.direction === "IN" ? "+" : "−"}{num(m.quantity)} <Meta>{m.unit}</Meta></td>
                      <td>{m.issued_to || m.trade || (m.reference_type ? pretty(m.reference_type) : "—")}</td>
                      <td><Meta>{m.storage_location || "—"}</Meta></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Page>
  );
}
