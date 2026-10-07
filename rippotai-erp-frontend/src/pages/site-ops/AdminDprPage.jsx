import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  TextInput,
  SelectInput,
} from "@/components/inos";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import {
  useListAdminDprDocumentsQuery,
  useDownloadSavedAdminDprMutation,
} from "@/api/site-ops/admin-dpr.api";
const errorMessage = (e) =>
  typeof e?.data?.message === "string"
    ? e.data.message
    : e?.data?.message?.join?.(", ") || "Request failed. Please try again.";
export default function AdminDprPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isFetching, error } = useListAdminDprDocumentsQuery({
    project_id: projectId || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });
  const { data: projectData } = useGetProjectsQuery({});
  const projects = Array.isArray(projectData)
    ? projectData
    : projectData?.data || projectData?.items || [];
  const [download, exporting] = useDownloadSavedAdminDprMutation();
  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations"
        title="Admin DPR records"
        subtitle="Saved DPR documents across all projects. Open a document or download its complete Excel."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate("/site-operations/admin-dpr/workspace")}
          >
            Create DPR
          </Button>
        }
      />
      <Card>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="Project">
            <SelectInput
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Search">
            <TextInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search saved DPRs"
            />
          </Field>
        </div>
      </Card>
      <Card title="Saved DPRs">
        {isFetching ? (
          <p>Loading DPR records…</p>
        ) : error ? (
          <p role="alert">{errorMessage(error)}</p>
        ) : !data?.data?.length ? (
          <p>
            No saved DPR documents yet. Create one in the workspace to retain
            the complete report and Excel.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Projects</th>
                  <th>Period</th>
                  <th>Progress entries</th>
                  <th>Admin entries</th>
                  <th>Saved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        to={`/site-operations/admin-dpr/${row.id}`}
                        style={{ textDecoration: "underline" }}
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td>
                      {row.project_names?.join(", ") ||
                        "All projects / no entries"}
                    </td>
                    <td>
                      {row.from_date || "All dates"}
                      {row.to_date && row.to_date !== row.from_date
                        ? ` to ${row.to_date}`
                        : ""}
                    </td>
                    <td>{row.report_count}</td>
                    <td>{row.log_count}</td>
                    <td>
                      {new Date(row.created_at).toLocaleString("en-IN")}
                      <div>{row.created_by_name}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() =>
                          navigate(`/site-operations/admin-dpr/${row.id}`)
                        }
                      >
                        Open DPR
                      </Button>
                      <Button
                        disabled={exporting.isLoading}
                        onClick={async () => {
                          try {
                            await download(row.id).unwrap();
                          } catch (err) {
                            toast.error(errorMessage(err));
                          }
                        }}
                      >
                        Download Excel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <Button
            disabled={page === 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} · {data?.meta?.total || 0} documents
          </span>
          <Button
            disabled={page >= (data?.meta?.total_pages || 1) || isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </Page>
  );
}
