import { appConfirm } from "@/lib/app-dialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Archive, ClipboardList, HardHat, Plus, Save, Pencil, Trash2, Info } from "lucide-react";
import "./admin-dpr-workspace.css";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  Segmented,
  StatusPill,
  EmptyState,
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
    <Page className="admin-dpr-workspace">
      <PageHeader
        crumbs={[{ label: "Site Operations" }, { label: "DPR records", to: "/site-operations/admin-dpr" }, { label: "Workspace" }]}
        icon={<ClipboardList size={22} />}
        title="Admin DPR workspace"
        subtitle="Record project progress and admin coordination, then save the complete DPR to records."
        actions={
          <div className="dpr-actions">
            <Button icon={Archive} onClick={() => navigate("/site-operations/admin-dpr")}>
              DPR records
            </Button>
            <Button
              variant="primary"
              icon={Save}
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
      <Card className="dpr-controls" flush>
        <div className="dpr-toolbar">
          <Segmented value={kind} onChange={(value) => {
            setKind(value); setPage(1); setForm(null);
          }} options={[
            { value: "reports", label: "Project progress", icon: HardHat },
            { value: "logs", label: "Admin coordination", icon: ClipboardList },
          ]} />
          <Button icon={Plus} variant="primary" disabled={!!form} onClick={() =>
            setForm({ [dateKey]: today(), [statusKey]: "Pending", project_id: filters.project_id })
          }>Add entry</Button>
        </div>
        <div className="dpr-filters">
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
        <div className="dpr-note"><Info size={16} aria-hidden />
          <span>Save DPR captures both sections and the complete Excel for the selected period and project.
            {form && " Save or cancel your entry before saving the DPR."}</span>
        </div>
      </Card>
      {form && (
        <Card className="dpr-editor" title={form.id ? "Edit entry" : "New entry"} subtitle={kind === "reports" ? "Record site progress, materials and upcoming work." : "Track coordination, ownership and due dates."}>
          <form onSubmit={submit}>
            <div className="dpr-form-grid">
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
                  full={kind === "reports" || key === "details" || key === "remarks"}
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
            <div className="dpr-form-footer">
              <Button
                type="submit"
                variant="primary"
                icon={Save}
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
        className="dpr-entries" flush
        subtitle="Review daily activity and keep your report up to date."
        title={
          kind === "reports"
            ? "Project progress entries"
            : "Admin coordination entries"
        }
      >
        {isFetching ? (
          <div className="dpr-feedback" role="status">Loading entries…</div>
        ) : error ? (
          <div className="dpr-feedback" role="alert">{errorMessage(error)}</div>
        ) : !data?.data?.length ? (
          <EmptyState icon={kind === "reports" ? HardHat : ClipboardList} title="No entries for this period" text="Choose another date range or add an entry to start your daily progress report." />
        ) : (
          <div className="inos-table-wrap dpr-table-scroll">
            <table className="inos-table dpr-table">
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
                    <td><StatusPill status={row[statusKey]} /></td>
                    {fields.map(([key]) => (
                      <td
                        className="dpr-detail-cell"
                        key={key}
                      >
                        {row[key] || "—"}
                      </td>
                    ))}
                    <td>
                      <Button size="sm" icon={Pencil} onClick={() => setForm(row)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        disabled={removing.isLoading}
                        onClick={async () => {
                          if (!(await appConfirm("Delete this entry?"))) return;
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
        <div className="dpr-pagination">
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
