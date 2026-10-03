import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, Button, Card, EmptyState, SelectInput } from "@/components/inos";
import { STAGES, stageOf, formatINR } from "@/hooks/stages";
import { useDeleteLeadMutation, useUpdateLeadMutation } from "@/api/connectors/leads.api";
import { shortDate, isPast, errorText } from "./utils";

const COLS = [
  { key: "title", label: "Deal", get: (d) => (d.title || "").toLowerCase() },
  { key: "stage", label: "Stage", get: (d) => STAGES.findIndex((s) => s.id === d.stage) },
  { key: "amount", label: "Value", num: true, get: (d) => d.amount ?? -1 },
  { key: "owner", label: "Owner", get: (d) => (d.owner || "").toLowerCase() },
  { key: "expectedClose", label: "Expected close", get: (d) => d.expectedClose || "9999" },
  { key: "source", label: "Source", get: (d) => (d.source || "").toLowerCase() },
  { key: "daysInStage", label: "In stage", num: true, get: (d) => d.daysInStage },
  { key: "createdAt", label: "Created", get: (d) => d.createdAt || "" },
];

/** Sortable table with inline stage pill and bulk actions. */
export default function DealsList({ deals, meta, onOpen, onMove, onCreate }) {
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [selected, setSelected] = useState(() => new Set());
  const [bulkStage, setBulkStage] = useState("");
  const [bulkOwner, setBulkOwner] = useState("");
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const rows = useMemo(() => {
    const col = COLS.find((c) => c.key === sort.key) || COLS[0];
    const out = [...deals].sort((a, b) => {
      const x = col.get(a);
      const y = col.get(b);
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return sort.dir === "desc" ? out.reverse() : out;
  }, [deals, sort]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const ids = [...selected].filter((id) => deals.some((d) => d.id === id));

  const applyStage = async (stage) => {
    if (!stage) return;
    const targets = deals.filter((d) => ids.includes(d.id) && d.stage !== stage);
    for (const d of targets) onMove(d, stage, { silent: true });
    toast.success(`Moved ${targets.length} deal${targets.length === 1 ? "" : "s"} to ${stageOf(stage).label}`);
    setBulkStage("");
  };

  const applyOwner = async (value) => {
    if (!value) return;
    const o = meta?.owners?.find((x) => (x.id || x.name) === value);
    try {
      await Promise.all(ids.map((id) => updateLead({ id, ...(o?.id ? { ownerId: o.id, owner: o.name } : { owner: o?.name }) }).unwrap()));
      toast.success(`Owner set to ${o?.name}`);
    } catch (err) {
      toast.error(errorText(err));
    }
    setBulkOwner("");
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${ids.length} deal${ids.length === 1 ? "" : "s"}? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteLead(id).unwrap()));
      toast.success("Deleted");
      setSelected(new Set());
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  if (!deals.length) {
    return (
      <Card>
        <EmptyState title="No deals match" text="Clear the filters or add a new deal." action={<Button variant="primary" onClick={onCreate}>New deal</Button>} />
      </Card>
    );
  }

  return (
    <Card flush className="crm-list">
      {ids.length > 0 && (
        <div className="crm-bulkbar" data-testid="bulk-bar">
          <span>{ids.length} selected</span>
          <SelectInput className="crm-select-sm" value={bulkStage} onChange={(e) => applyStage(e.target.value)} placeholder="Move to stage…" aria-label="Move selected to stage">
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </SelectInput>
          <SelectInput className="crm-select-sm" value={bulkOwner} onChange={(e) => applyOwner(e.target.value)} placeholder="Assign owner…" aria-label="Assign owner">
            {(meta?.owners || []).map((o) => (
              <option key={o.id || o.name} value={o.id || o.name}>
                {o.name}
              </option>
            ))}
          </SelectInput>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={bulkDelete}>
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} style={{ marginLeft: "auto" }}>
            Clear
          </Button>
        </div>
      )}
      <div className="inos-table-wrap">
        <table className="inos-table" data-testid="deals-table">
          <thead>
            <tr>
              <th className="cb">
                <input
                  type="checkbox"
                  checked={allChecked}
                  aria-label="Select all"
                  onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                />
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`sortable ${c.num ? "num" : ""}`}
                  onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "asc" ? "desc" : "asc" }))}
                  aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.label}
                  <span className="sort-ind">
                    {sort.key === c.key ? sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const s = stageOf(d.stage);
              const late = d.expectedClose && isPast(d.expectedClose) && !s.closed && !s.won;
              return (
                <tr key={d.id} className={`is-clickable ${selected.has(d.id) ? "is-selected" : ""}`} onClick={() => onOpen(d)}>
                  <td className="cb" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} aria-label={`Select ${d.title}`} />
                  </td>
                  <td>
                    <div className="crm-cell-title">{d.title}</div>
                    <div className="crm-cell-sub">{d.clientName || d.company || d.contact}</div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="crm-stage-select"
                      value={d.stage}
                      style={{ background: s.bg, color: s.fg }}
                      onChange={(e) => onMove(d, e.target.value)}
                      aria-label="Stage"
                    >
                      {STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num" style={{ fontWeight: 650 }}>{d.amount ? formatINR(d.amount) : "—"}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={d.owner || "?"} size={24} />
                      {d.owner || <span className="muted">Unassigned</span>}
                    </span>
                  </td>
                  <td style={late ? { color: "var(--bad-fg)", fontWeight: 600 } : undefined}>{d.expectedClose ? shortDate(d.expectedClose) : <span className="muted">—</span>}</td>
                  <td className="muted">{d.source || "—"}</td>
                  <td className="num">{d.daysInStage}d</td>
                  <td className="muted">{shortDate(d.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
