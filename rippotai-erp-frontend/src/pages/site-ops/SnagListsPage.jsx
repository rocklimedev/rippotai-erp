import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  TextInput,
} from "@/components/inos";
import { useSiteProjects, ProjectPicker } from "./siteProjects";
import {
  useListSnagDocumentsQuery,
  useDownloadSnagDocumentMutation,
} from "@/api/site-ops/snag-lists.api";
export const snagError = (e) =>
  typeof e?.data?.message === "string"
    ? e.data.message
    : e?.data?.message?.join?.(", ") || "Request failed. Please try again.";
export default function SnagListsPage() {
  const navigate = useNavigate();
  const { projects } = useSiteProjects();
  const [projectId, setProjectId] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const { data, isFetching, error } = useListSnagDocumentsQuery({
    project_id: projectId || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });
  const [download, downloading] = useDownloadSnagDocumentMutation();
  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations"
        title="Snag Lists"
        subtitle="Project snag documents, photos and rectification progress."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate("/site-operations/snag-lists/workspace")}
          >
            Create snag list
          </Button>
        }
      />
      <Card>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="Project">
            <ProjectPicker
              projects={projects}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Search">
            <TextInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Document or project"
            />
          </Field>
        </div>
      </Card>
      <Card title="Saved documents">
        {isFetching ? (
          <p>Loading snag lists…</p>
        ) : error ? (
          <p role="alert">{snagError(error)}</p>
        ) : !data?.data?.length ? (
          <p>No snag lists found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="inos-table">
              <thead>
                <tr>
                  {[
                    "Document",
                    "Project",
                    "Date",
                    "Rows",
                    "Not closed",
                    "Revision",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td>{d.project_name}</td>
                    <td>{d.document_date}</td>
                    <td>{d.item_count}</td>
                    <td>{d.open_count}</td>
                    <td>{d.revision}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() =>
                          navigate(`/site-operations/snag-lists/${d.id}`)
                        }
                      >
                        Open
                      </Button>
                      <Button
                        onClick={() =>
                          navigate(
                            `/site-operations/snag-lists/${d.id}/workspace`,
                          )
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={downloading.isLoading}
                        onClick={async () => {
                          try {
                            await download(d.id).unwrap();
                          } catch (e) {
                            toast.error(snagError(e));
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
