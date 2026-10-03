// Design Studio → Drawings register: thumbnail grid or table, filtered by project / discipline / status.
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, CloudUpload, Eye, FileStack, HardHat, LayoutGrid, List, Layers } from "lucide-react";

import { Page, PageHeader, Card, Button, Stats, StatTile, SearchInput, Segmented, Pill, EmptyState, SelectInput } from "@/components/inos";
import { useGetDrawingsQuery } from "@/api/documents/drawing.api";
import { useGetProjectsQuery } from "@/api/projects/project.api";

import { FileThumb } from "./DrawingBits";
import { DISCIPLINES, STATUSES, formatBytes, formatDate, latestRevision, phaseLabel, statusTone, updatedAt } from "./drawingUtils";
import "./drawings.css";

export default function DrawingsRegister() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") || "";
  const [q, setQ] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("grid");
  const [shown, setShown] = useState(30);

  const { data: rows = [], isLoading, isError } = useGetDrawingsQuery(projectId ? { projectId } : {});
  const { data: projects = [] } = useGetProjectsQuery({});
  const projectName = (id) => projects.find((p) => p.id === id)?.name || "—";

  const setProject = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set("project", id);
    else next.delete("project");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...rows]
      .filter((d) => !discipline || d.discipline === discipline)
      .filter((d) => !status || (d.status || "Draft") === status)
      .filter(
        (d) =>
          !s ||
          [d.drawingNumber, d.title, d.discipline, projectName(d.projectId)].filter(Boolean).some((t) => String(t).toLowerCase().includes(s)),
      )
      .sort((a, b) => new Date(updatedAt(b) || 0) - new Date(updatedAt(a) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, discipline, status, projects]);

  const count = (st) => rows.filter((d) => (d.status || "Draft") === st).length;
  const revisions = rows.reduce((n, d) => n + (d.revisions?.length || 0), 0);
  const uploadHref = projectId ? `/design-studio/upload?project=${projectId}` : "/design-studio/upload";

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Design Studio", to: "/design-studio" }, { label: "Drawings" }]}
        title="Drawing register"
        subtitle={`${rows.length} drawing${rows.length === 1 ? "" : "s"}${projectId ? ` in ${projectName(projectId)}` : " across all projects"} · every revision preserved`}
        actions={
          <Button variant="primary" icon={CloudUpload} onClick={() => nav(uploadHref)}>
            Upload drawings
          </Button>
        }
      />

      <Stats>
        <StatTile label="Drawings" value={rows.length} meta={`${revisions} revision${revisions === 1 ? "" : "s"}`} icon={<FileStack />} active={!status} onClick={() => setStatus("")} />
        <StatTile label="For review" value={count("For Review")} icon={<Eye />} tone="lilac" active={status === "For Review"} onClick={() => setStatus(status === "For Review" ? "" : "For Review")} />
        <StatTile label="Approved" value={count("Approved")} icon={<CheckCircle2 />} tone="ok" active={status === "Approved"} onClick={() => setStatus(status === "Approved" ? "" : "Approved")} />
        <StatTile label="For construction" value={count("For Construction")} icon={<HardHat />} tone="info" active={status === "For Construction"} onClick={() => setStatus(status === "For Construction" ? "" : "For Construction")} />
        <StatTile label="Superseded" value={count("Superseded")} icon={<Layers />} active={status === "Superseded"} onClick={() => setStatus(status === "Superseded" ? "" : "Superseded")} />
      </Stats>

      <div className="ds-filters">
        <SearchInput value={q} onChange={setQ} placeholder="Search number, title, project…" />
        <SelectInput value={projectId} onChange={(e) => setProject(e.target.value)} aria-label="Project" placeholder="All projects">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={discipline} onChange={(e) => setDiscipline(e.target.value)} aria-label="Discipline" placeholder="All disciplines">
          {DISCIPLINES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.value}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" placeholder="All statuses">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
        <div style={{ flex: 1 }} />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "grid", label: "Grid", icon: LayoutGrid },
            { value: "list", label: "List", icon: List },
          ]}
        />
      </div>

      {isLoading ? (
        <Card>
          <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading drawings…</div>
        </Card>
      ) : isError ? (
        <Card>
          <EmptyState title="Couldn't load drawings" text="The server didn't respond. Try again in a moment." />
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={FileStack}
            title={rows.length ? "No drawings match these filters" : "No drawings yet"}
            text={rows.length ? "Clear a filter or search for something else." : "Upload PDFs, DWG/DXF files or images to start the register."}
            action={
              rows.length ? (
                <Button
                  variant="soft"
                  onClick={() => {
                    setQ("");
                    setDiscipline("");
                    setStatus("");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="soft" icon={CloudUpload} onClick={() => nav(uploadHref)}>
                  Upload drawings
                </Button>
              )
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="ds-cards">
          {filtered.slice(0, shown).map((d) => {
            const rev = latestRevision(d);
            return (
              <button type="button" key={d.id} className="ds-dcard" onClick={() => nav(`/design-studio/${d.id}`)} data-testid={`drawing-card-${d.id}`}>
                <FileThumb name={rev?.filename || d.drawingNumber} mime={rev?.mime} src={rev?.url} size="lg" />
                <div className="ds-dcard__body">
                  <span className="ds-dcard__num">{d.drawingNumber}</span>
                  <span className="ds-dcard__title">{d.title}</span>
                  <span className="ds-dcard__sub">
                    {projectId ? phaseLabel(d.phaseCode) : projectName(d.projectId)} · {d.discipline || "—"}
                  </span>
                  <div className="ds-dcard__foot">
                    <span className="ds-rev">
                      Rev {rev?.revision || "—"}
                      {d.revisions?.length > 1 ? ` · ${d.revisions.length}` : ""}
                    </span>
                    <Pill tone={statusTone(d.status)} size="sm">
                      {d.status || "Draft"}
                    </Pill>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Card flush>
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th />
                  <th>Drawing no.</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Discipline</th>
                  <th>Rev</th>
                  <th>Status</th>
                  <th>Sheet</th>
                  <th className="num">Size</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((d) => {
                  const rev = latestRevision(d);
                  return (
                    <tr key={d.id} className="is-clickable" onClick={() => nav(`/design-studio/${d.id}`)} data-testid={`drawing-row-${d.id}`}>
                      <td style={{ width: 56 }}>
                        <FileThumb name={rev?.filename || d.drawingNumber} mime={rev?.mime} src={rev?.url} size="sm" />
                      </td>
                      <td className="ds-mono" style={{ fontWeight: 650, fontSize: 13 }}>
                        {d.drawingNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.title}</td>
                      <td className="muted">{projectName(d.projectId)}</td>
                      <td>{d.discipline || "—"}</td>
                      <td>
                        <span className="ds-rev">{rev?.revision || "—"}</span>
                      </td>
                      <td>
                        <Pill tone={statusTone(d.status)} size="sm">
                          {d.status || "Draft"}
                        </Pill>
                      </td>
                      <td className="muted">{[d.sheetSize, d.scale].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="num muted">{formatBytes(rev?.size)}</td>
                      <td className="muted">{formatDate(updatedAt(d))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && filtered.length > shown && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            Showing {shown} of {filtered.length}
          </span>
          <Button variant="secondary" onClick={() => setShown((n) => n + 30)}>
            Show more
          </Button>
        </div>
      )}
    </Page>
  );
}
