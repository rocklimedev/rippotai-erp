import { appConfirm } from "@/lib/app-dialog";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader, Card, Button, Pill } from "@/components/inos";
import { useAuth } from "@/context/AuthContext";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import {
  useGetBudgetGuidesQuery,
  useDeleteBudgetGuideMutation,
} from "@/api/documents/budget-guides.api";
import "./budget-guide.css";

export default function BudgetGuideList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const can = (permission) =>
    user?.permissions?.includes(`budget-guides:${permission}`);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [scope, setScope] = useState(""),
    [page, setPage] = useState(1);
  const projectQuery = useGetProjectsQuery(undefined, {
    skip: !can("read") || !user?.permissions?.includes("projects:read"),
  });
  const projects = Array.isArray(projectQuery.data)
    ? projectQuery.data
    : projectQuery.data?.items || projectQuery.data?.data || [];
  const result = useGetBudgetGuidesQuery(
    {
      search,
      status: status || undefined,
      generic: scope === "generic" ? true : undefined,
      project_id: scope && scope !== "generic" ? scope : undefined,
      page,
      limit: 30,
    },
    { skip: !can("read") },
  );
  const [remove, removing] = useDeleteBudgetGuideMutation();
  return (
    <Page>
      <PageHeader
        eyebrow="Ledger"
        title="Budget Guides"
        subtitle="Compare three specification plans, build cost breakdowns and maintain material rates. Link a project whenever you need one."
        actions={
          can("create") && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => navigate("/ledger/budget-guides/new")}
            >
              New budget guide
            </Button>
          )
        }
      />
      {!can("read") ? (
        <Card>You need budget guide read permission.</Card>
      ) : (
        <Card>
          <div className="bg-toolbar">
            <label>
              Search
              <input
                className="inos-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Guide title"
              />
            </label>
            <label>
              Status
              <select
                className="inos-input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {["draft", "published", "archived"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Project scope
              <select
                className="inos-input"
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All guides</option>
                <option value="generic">Standalone guides</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {result.isLoading ? (
            <p>Loading guides…</p>
          ) : result.isError ? (
            <p role="alert">
              {result.error?.data?.message || "Could not load guides."}{" "}
              <Button onClick={result.refetch}>Retry</Button>
            </p>
          ) : (
            <>
              <div className="bg-scroll">
                <table className="bg-table">
                  <thead>
                    <tr>
                      <th>Guide</th>
                      <th>Project / type</th>
                      <th>Status</th>
                      <th>Issued</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data?.items?.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link to={`/ledger/budget-guides/${row.id}`}>
                            {row.title}
                          </Link>
                          <small>Revision {row.revision}</small>
                        </td>
                        <td>
                          {row.project?.name ||
                            (row.project_id ? "Linked project" : "Standalone")}
                          <small>{row.project_type || "General"}</small>
                        </td>
                        <td>
                          <Pill
                            tone={row.status === "published" ? "ok" : "neutral"}
                          >
                            {row.status}
                          </Pill>
                        </td>
                        <td>{row.issue_date}</td>
                        <td>
                          <div className="bg-actions">
                            <Button
                              icon={FileText}
                              size="sm"
                              onClick={() =>
                                navigate(`/ledger/budget-guides/${row.id}`)
                              }
                            >
                              View
                            </Button>
                            {can("update") && (
                              <Button
                                icon={Pencil}
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/ledger/budget-guides/${row.id}/edit`,
                                  )
                                }
                              >
                                Edit
                              </Button>
                            )}
                            {can("delete") && (
                              <Button
                                icon={Trash2}
                                size="sm"
                                disabled={removing.isLoading}
                                aria-label={`Delete ${row.title}`}
                                onClick={async () => {
                                  if (
                                    !(await appConfirm(
                                      `Delete "${row.title}"? Project copies will remain.`,
                                    ))
                                  )
                                    return;
                                  try {
                                    await remove({
                                      id: row.id,
                                      revision: row.revision,
                                    }).unwrap();
                                    toast.success("Guide deleted");
                                  } catch (e) {
                                    toast.error(
                                      e?.data?.message ||
                                        "Could not delete guide",
                                    );
                                  }
                                }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!result.data?.items?.length && (
                      <tr>
                        <td colSpan={5}>
                          No budget guides yet. Create a standalone guide or
                          start from the reference template.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-toolbar">
                <span>
                  {result.data?.total || 0} guides · Page {page}
                </span>
                <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  disabled={page * 30 >= (result.data?.total || 0)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </Page>
  );
}
