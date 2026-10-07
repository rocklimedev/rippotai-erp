import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Page, PageHeader, Card, Button } from "@/components/inos";
import {
  useGetSnagDocumentQuery,
  useDownloadSnagDocumentMutation,
} from "@/api/site-ops/snag-lists.api";
import { snagError } from "./SnagListsPage";
export default function SnagListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetSnagDocumentQuery(id);
  const [download, downloading] = useDownloadSnagDocumentMutation();
  if (isLoading)
    return (
      <Page>
        <p>Loading snag list…</p>
      </Page>
    );
  if (error || !data)
    return (
      <Page>
        <p role="alert">Unable to open snag list.</p>
        <Button onClick={() => navigate("/site-operations/snag-lists")}>
          Back to list
        </Button>
      </Page>
    );
  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations · Snag List"
        title={data.title}
        subtitle={`${data.project_name} · ${data.document_date} · Revision ${data.revision}`}
        actions={
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/site-operations/snag-lists")}>
              Back to list
            </Button>
            <Button
              onClick={() =>
                navigate(`/site-operations/snag-lists/${id}/workspace`)
              }
            >
              Edit
            </Button>
            <Button
              variant="primary"
              disabled={downloading.isLoading}
              loading={downloading.isLoading}
              onClick={async () => {
                try {
                  await download(id).unwrap();
                } catch (e) {
                  toast.error(snagError(e));
                }
              }}
            >
              Download Excel
            </Button>
          </div>
        }
      />
      <Card
        title={`${data.item_count} snag rows · ${data.open_count} not closed`}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="inos-table">
            <thead>
              <tr>
                {[
                  "S. No.",
                  "Floor",
                  "Room",
                  "Category",
                  "Observation",
                  "Photo",
                  "Scope",
                  "Status",
                  "Remarks",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.s_no}>
                  <td>{row.s_no}</td>
                  {["floor", "room", "category", "observation"].map((k) => (
                    <td
                      key={k}
                      style={{
                        minWidth: k === "observation" ? 250 : 120,
                        whiteSpace: "pre-wrap",
                        verticalAlign: "top",
                      }}
                    >
                      {row[k] || "—"}
                    </td>
                  ))}
                  <td>
                    {row.photos?.length
                      ? row.photos.map((url, i) => (
                          <a
                            key={url + i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={url}
                              alt={`Snag ${row.s_no}, photo ${i + 1}`}
                              style={{
                                width: 100,
                                height: 80,
                                objectFit: "cover",
                                margin: 4,
                              }}
                            />
                          </a>
                        ))
                      : "—"}
                  </td>
                  {["scope", "status", "remarks"].map((k) => (
                    <td
                      key={k}
                      style={{
                        minWidth: 150,
                        whiteSpace: "pre-wrap",
                        verticalAlign: "top",
                      }}
                    >
                      {row[k] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
