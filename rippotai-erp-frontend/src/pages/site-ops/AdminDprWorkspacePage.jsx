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
  TextArea,
  SelectInput,
} from "@/components/inos";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import {
  useListAdminDprQuery,
  useSaveAdminDprMutation,
  useDeleteAdminDprMutation,
  useCreateAdminDprDocumentMutation,
} from "@/api/site-ops/admin-dpr.api";

const statuses = ["Pending", "In Progress", "Completed", "Blocked"];
const reportFields = [
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
  ["details", "Details"],
  ["pending_with", "Pending with"],
  ["due_date", "Due date"],
  ["remarks", "Remarks"],
];
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const errorMessage = (error) =>
  typeof error?.data?.message === "string"
    ? error.data.message
    : error?.data?.message?.join?.(", ") || "Request failed. Please try again.";

export default function AdminDprWorkspacePage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState("reports");
  const [filters, setFilters] = useState({
    from_date: today(),
    to_date: today(),
    project_id: "",
  });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value),
  );
  const { data, isFetching, error } = useListAdminDprQuery({
    kind,
    ...params,
    page,
    limit: 20,
  });
  const { data: projectData } = useGetProjectsQuery({});
  const projects = Array.isArray(projectData)
    ? projectData
    : projectData?.data || projectData?.items || [];
  const [save, saving] = useSaveAdminDprMutation();
  const [remove, removing] = useDeleteAdminDprMutation();
  const [archive, archiving] = useCreateAdminDprDocumentMutation();
  const saveDocument = async () => {
    try {
      const document = await archive(params).unwrap();
      toast.success("DPR saved to records");
      navigate(`/site-operations/admin-dpr/${document.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const dateKey = kind === "reports" ? "report_date" : "log_date";
  const statusKey = kind === "reports" ? "work_status" : "status";
  const fields = kind === "reports" ? reportFields : logFields;
  const change = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const projectOptions = (
    <>
      <option value="">
        {kind === "reports" ? "Select project" : "No project"}
      </option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </>
  );
  const submit = async (event) => {
    event.preventDefault();
    const body = {
      kind,
      [dateKey]: form[dateKey],
      [statusKey]: form[statusKey],
    };
    if (form.id) body.id = form.id;
    // Explicit nulls let edits clear optional dates and project associations.
    body.project_id = form.project_id || null;
    for (const [key] of fields)
      body[key] = form[key] || (key === "due_date" ? null : "");
    try {
      await save(body).unwrap();
      setForm(null);
      toast.success("Entry saved");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations"
        title="Admin DPR workspace"
        subtitle="Record project progress and admin coordination, then save the complete DPR to records."
        actions={
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/site-operations/admin-dpr")}>
              DPR records
            </Button>
            <Button
              variant="primary"
              loading={archiving.isLoading}
              disabled={
                !!form ||
                archiving.isLoading ||
                (!!filters.from_date &&
                  !!filters.to_date &&
                  filters.from_date > filters.to_date)
              }
              onClick={() => saveDocument()}
            >
              Save DPR
            </Button>
          </div>
        }
      />
      <Card>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <Button
            variant={kind === "reports" ? "primary" : "secondary"}
            onClick={() => {
              setKind("reports");
              setPage(1);
              setForm(null);
            }}
          >
            Project progress
          </Button>
          <Button
            variant={kind === "logs" ? "primary" : "secondary"}
            onClick={() => {
              setKind("logs");
              setPage(1);
              setForm(null);
            }}
          >
            Admin coordination
          </Button>
          <Button
            onClick={() =>
              setForm({
                [dateKey]: today(),
                [statusKey]: "Pending",
                project_id: filters.project_id,
              })
            }
          >
            Add entry
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <Field label="From date">
            <TextInput
              type="date"
              value={filters.from_date}
              onChange={(e) => updateFilter("from_date", e.target.value)}
            />
          </Field>
          <Field label="To date">
            <TextInput
              type="date"
              min={filters.from_date}
              value={filters.to_date}
              onChange={(e) => updateFilter("to_date", e.target.value)}
            />
          </Field>
          <Field label="Project">
            <SelectInput
              value={filters.project_id}
              onChange={(e) => updateFilter("project_id", e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <p>
          Saving a DPR retains both sections and the complete Excel for the
          selected dates and project. Save or cancel the open entry before
          saving the document.
        </p>
      </Card>
      {form && (
        <Card title={form.id ? "Edit entry" : "New entry"}>
          <form onSubmit={submit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              <Field label="Date" required>
                <TextInput
                  required
                  type="date"
                  value={form[dateKey] || ""}
                  onChange={(e) => change(dateKey, e.target.value)}
                />
              </Field>
              <Field label="Project" required={kind === "reports"}>
                <SelectInput
                  required={kind === "reports"}
                  value={form.project_id || ""}
                  onChange={(e) => change("project_id", e.target.value)}
                >
                  {projectOptions}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  value={form[statusKey]}
                  onChange={(e) => change(statusKey, e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </SelectInput>
              </Field>
              {fields.map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  required={key === "work_type" || key === "details"}
                >
                  {key === "due_date" ? (
                    <TextInput
                      type="date"
                      value={form[key] || ""}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  ) : (
                    <TextArea
                      required={key === "work_type" || key === "details"}
                      maxLength={
                        key === "work_type"
                          ? 150
                          : key === "pending_with"
                            ? 255
                            : undefined
                      }
                      value={form[key] || ""}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <Button
                type="submit"
                variant="primary"
                loading={saving.isLoading}
              >
                Save entry
              </Button>
              <Button onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      <Card
        title={
          kind === "reports"
            ? "Project progress entries"
            : "Admin coordination entries"
        }
      >
        {isFetching ? (
          <p>Loading entries…</p>
        ) : error ? (
          <p role="alert">{errorMessage(error)}</p>
        ) : !data?.data?.length ? (
          <p>No entries for the selected dates and project.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Status</th>
                  {fields.map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>{row[dateKey]}</td>
                    <td>{row.project?.name || "—"}</td>
                    <td>{row[statusKey]}</td>
                    {fields.map(([key]) => (
                      <td
                        style={{ minWidth: 160, whiteSpace: "pre-wrap" }}
                        key={key}
                      >
                        {row[key] || "—"}
                      </td>
                    ))}
                    <td>
                      <Button onClick={() => setForm(row)}>Edit</Button>
                      <Button
                        disabled={removing.isLoading}
                        onClick={async () => {
                          if (!window.confirm("Delete this entry?")) return;
                          try {
                            await remove({ kind, id: row.id }).unwrap();
                            if (form?.id === row.id) setForm(null);
                            toast.success("Entry deleted");
                          } catch (err) {
                            toast.error(errorMessage(err));
                          }
                        }}
                      >
                        Delete
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
            Page {page} · {data?.meta?.total || 0} entries
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
