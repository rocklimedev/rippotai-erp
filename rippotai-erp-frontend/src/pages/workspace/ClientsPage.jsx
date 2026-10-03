// Client directory: /clients
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Phone, Mail, Building2, LayoutGrid, List } from "lucide-react";
import { Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SearchInput, Segmented, Pill, EmptyState, Avatar, Stats, StatTile } from "@/components/inos";
import { useGetWsClientsSummaryQuery } from "@/api/workspace/workspace.api";
import { useClientsList, inr, relTime, Loading, Meta } from "./shared";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clients, isLoading } = useClientsList();
  const { data: summary } = useGetWsClientsSummaryQuery();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [layout, setLayout] = useState("cards");

  const sum = useMemo(() => Object.fromEntries((summary || []).map((s) => [s.id, s])), [summary]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients
      .map((c) => ({ ...c, ...(sum[c.id] || {}), id: c.id }))
      .filter((c) => (filter === "active" ? Number(c.active_projects) > 0 : filter === "none" ? !Number(c.project_count) : true))
      .filter((c) => !s || [c.name, c.contact_person, c.email, c.phone, c.address].some((x) => String(x || "").toLowerCase().includes(s)))
      .sort((a, b) => Number(b.active_projects || 0) - Number(a.active_projects || 0) || a.name.localeCompare(b.name));
  }, [clients, sum, q, filter]);

  const totals = useMemo(() => {
    const list = Object.values(sum);
    return {
      clients: clients.length,
      active: list.filter((s) => Number(s.active_projects) > 0).length,
      projects: list.reduce((n, s) => n + Number(s.project_count || 0), 0),
      value: list.reduce((n, s) => n + Number(s.approved_value || 0), 0),
    };
  }, [sum, clients]);

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Clients" }]}
        title="Clients"
        subtitle="Everyone you design and build for — their projects, documents and payments in one place."
        actions={<Button variant="primary" icon={Plus} onClick={() => navigate("/clients/new")} data-testid="new-client">Add client</Button>}
      />
      <Stats>
        <StatTile label="Clients" value={totals.clients} icon={<Users size={16} />} />
        <StatTile label="With active projects" value={totals.active} icon={<Building2 size={16} />} tone="ok" onClick={() => setFilter("active")} active={filter === "active"} />
        <StatTile label="Projects" value={totals.projects} icon={<LayoutGrid size={16} />} tone="info" />
        <StatTile label="Approved value" value={inr(totals.value)} icon={<List size={16} />} tone="lilac" />
      </Stats>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, contact, phone or address" />
        <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "active", label: "Active projects" }, { value: "none", label: "No projects" }]} />
        <ToolbarSpacer />
        <Segmented value={layout} onChange={setLayout} options={[{ value: "cards", label: "Cards", icon: LayoutGrid }, { value: "table", label: "Table", icon: List }]} />
      </Toolbar>

      {isLoading ? (
        <Card><Loading /></Card>
      ) : !rows.length ? (
        <Card>
          <EmptyState icon={Users} title={q || filter !== "all" ? "No clients match" : "No clients yet"} text="Add a client to start a project, estimate or payment schedule for them." action={<Button variant="primary" icon={Plus} onClick={() => navigate("/clients/new")}>Add client</Button>} />
        </Card>
      ) : layout === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {rows.map((c) => (
            <Card key={c.id} onClick={() => navigate(`/clients/${c.id}`)} data-testid="client-card">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar name={c.name} size={42} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 650, fontSize: "var(--fs-h3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <Meta>{(c.contact_person && c.contact_person !== c.name ? c.contact_person : c.address) || "—"}</Meta>
                </div>
                {Number(c.active_projects) > 0 ? <Pill tone="ok" size="sm">Active</Pill> : Number(c.project_count) ? <Pill size="sm">Past</Pill> : <Pill tone="info" size="sm">New</Pill>}
              </div>
              <div style={{ display: "grid", gap: 4, marginTop: 14, fontSize: "var(--fs-sm)", color: "var(--text-2)" }}>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Phone size={13} /> {c.phone || "—"}</span>
                <span style={{ display: "flex", gap: 8, alignItems: "center", overflow: "hidden" }}><Mail size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.email || "—"}</span></span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <div><div className="tabular" style={{ fontWeight: 700 }}>{Number(c.project_count || 0)}</div><Meta>Projects</Meta></div>
                <div><div className="tabular" style={{ fontWeight: 700 }}>{inr(c.approved_value || 0)}</div><Meta>Approved</Meta></div>
                <div style={{ marginLeft: "auto", alignSelf: "end" }}><Meta>{c.last_activity ? `Active ${relTime(c.last_activity)}` : `Added ${relTime(c.created_at)}`}</Meta></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card flush>
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead><tr><th>Client</th><th>Phone</th><th>Email</th><th className="num">Projects</th><th className="num">Approved value</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="is-clickable" onClick={() => navigate(`/clients/${c.id}`)} data-testid="client-row">
                    <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Avatar name={c.name} size={30} /><div><div style={{ fontWeight: 600 }}>{c.name}</div><Meta>{c.contact_person || ""}</Meta></div></div></td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td className="num tabular">{Number(c.project_count || 0)}</td>
                    <td className="num tabular">{inr(c.approved_value || 0)}</td>
                    <td>{Number(c.active_projects) > 0 ? <Pill tone="ok" size="sm">Active</Pill> : <Pill size="sm">{Number(c.project_count) ? "Past" : "New"}</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Page>
  );
}
