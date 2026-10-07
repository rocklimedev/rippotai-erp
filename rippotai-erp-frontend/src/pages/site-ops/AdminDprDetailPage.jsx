import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Page, PageHeader, Card, Button } from "@/components/inos";
import {
  useGetAdminDprDocumentQuery,
  useDownloadSavedAdminDprMutation,
} from "@/api/site-ops/admin-dpr.api";
const reportFields = [
  ["report_date", "Date"],
  ["project", "Project"],
  ["work_status", "Work status"],
  ["work_details", "Work details"],
  ["contractor_working", "Contractor working"],
  ["work_planned_tomorrow", "Work planned tomorrow"],
  ["material_required_tomorrow", "Material required tomorrow"],
  ["material_sent_from_vendor", "Material sent from vendor"],
  ["material_sent_from_inventory", "Material sent from inventory"],
  ["issues_blockers", "Issues / blockers"],
];
const logFields = [
  ["work_type", "Work type"],
  ["project", "Project"],
  ["details", "Details"],
  ["status", "Status"],
  ["pending_with", "Pending with"],
  ["due_date", "Due date"],
  ["remarks", "Remarks"],
];
function DocumentSection({ title, rows, fields }) {
  return (
    <Card title={`${title} (${rows.length})`}>
      {!rows.length ? (
        <p>No entries in this section.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="inos-table">
            <thead>
              <tr>
                {fields.map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  {fields.map(([key]) => (
                    <td
                      key={key}
                      style={{
                        minWidth: key === "project" ? 180 : 160,
                        whiteSpace: "pre-wrap",
                        verticalAlign: "top",
                      }}
                    >
                      {(key === "project" ? row.project?.name : row[key]) ||
                        "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
export default function AdminDprDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAdminDprDocumentQuery(id);
  const [download, exporting] = useDownloadSavedAdminDprMutation();
  if (isLoading)
    return (
      <Page>
        <p>Loading DPR document…</p>
      </Page>
    );
  if (error || !data)
    return (
      <Page>
        <PageHeader
          title="DPR unavailable"
          actions={
            <Button onClick={() => navigate("/site-operations/admin-dpr")}>
              Back to records
            </Button>
          }
        />
        <p role="alert">Unable to open this saved DPR.</p>
      </Page>
    );
  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations · Saved DPR"
        title={data.title}
        subtitle={`Saved ${new Date(data.created_at).toLocaleString("en-IN")}${data.created_by_name ? ` by ${data.created_by_name}` : ""}`}
        actions={
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={() => navigate("/site-operations/admin-dpr")}>
              Back to records
            </Button>
            <Button
              variant="primary"
              loading={exporting.isLoading}
              onClick={async () => {
                try {
                  await download(id).unwrap();
                } catch (err) {
                  toast.error(err?.data?.message || "Unable to download Excel");
                }
              }}
            >
              Download complete Excel
            </Button>
          </div>
        }
      />
      <Card>
        <p>
          <strong>Projects:</strong>{" "}
          {data.project_names?.join(", ") || "All projects / no entries"}
        </p>
        <p>
          <strong>Period:</strong> {data.from_date || "All dates"}
          {data.to_date && data.to_date !== data.from_date
            ? ` to ${data.to_date}`
            : ""}
        </p>
        <p>
          This document contains the saved progress and coordination records.
          Its Excel download retains the complete workbook as saved.
        </p>
      </Card>
      <DocumentSection
        title="Project progress"
        rows={data.reports || []}
        fields={reportFields}
      />
      <DocumentSection
        title="Admin coordination"
        rows={data.logs || []}
        fields={logFields}
      />
    </Page>
  );
}
