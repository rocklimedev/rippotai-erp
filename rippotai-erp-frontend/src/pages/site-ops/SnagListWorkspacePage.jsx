import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ClipboardCheck, Info, Plus, Save, Trash2, X } from "lucide-react";
import "./snag-list-workspace.css";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  Pill,
  StatusPill,
} from "@/components/inos";
import { useSiteProjects } from "./siteProjects";
import {
  useGetSnagDocumentQuery,
  useSaveSnagDocumentMutation,
  useUploadSnagPhotoMutation,
} from "@/api/site-ops/snag-lists.api";
import { snagError } from "./SnagListsPage";
const statuses = ["Open", "In Progress", "Rectified", "Closed"];
const row = () => ({
  key: crypto.randomUUID(),
  floor: "",
  room: "",
  category: "",
  observation: "",
  photos: [],
  scope: "",
  status: "Open",
  remarks: "",
});
const initial = () => ({
  title: "Snag list",
  project_id: "",
  document_date: new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }),
  items: [row()],
});
export default function SnagListWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useSiteProjects();
  const {
    currentData: existing,
    isFetching,
    error,
  } = useGetSnagDocumentQuery(id, { skip: !id });
  const loaded = useRef(null);
  const [form, setForm] = useState(initial);
  const [save, saving] = useSaveSnagDocumentMutation();
  const [upload] = useUploadSnagPhotoMutation();
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    loaded.current = null;
    setForm(initial());
  }, [id]);
  useEffect(() => {
    if (existing && loaded.current !== id) {
      setForm({
        ...existing,
        items: existing.items.map((i) => ({ ...i, key: crypto.randomUUID() })),
      });
      loaded.current = id;
    }
  }, [existing, id]);
  const editRow = (key, field, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
    }));
  const uploadPhotos = async (key, files) => {
    const target = form.items.find((i) => i.key === key);
    if (!files.length) return;
    if ((target?.photos.length || 0) + files.length > 10)
      return toast.error("Attach up to 10 photos per snag row");
    setUploading(true);
    try {
      for (const file of files) {
        const result = await upload(file).unwrap();
        setForm((f) => ({
          ...f,
          items: f.items.map((i) =>
            i.key === key ? { ...i, photos: [...i.photos, result.url] } : i,
          ),
        }));
      }
    } catch (e) {
      toast.error(snagError(e));
    } finally {
      setUploading(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    const body = {
      title: form.title,
      project_id: form.project_id,
      document_date: form.document_date,
      items: form.items.map(({ key, s_no, ...item }) => item),
      ...(id ? { id, revision: form.revision } : {}),
    };
    try {
      const saved = await save(body).unwrap();
      toast.success("Snag list saved");
      navigate(`/site-operations/snag-lists/${saved.id}`);
    } catch (e) {
      toast.error(snagError(e));
    }
  };
  if (id && isFetching && loaded.current !== id)
    return (
      <Page className="snag-list-workspace">
        <Card><div className="snag-feedback" role="status">Loading snag list…</div></Card>
      </Page>
    );
  if (id && error)
    return (
      <Page className="snag-list-workspace">
        <Card><div className="snag-feedback" role="alert">Unable to load snag list.</div></Card>
        <Button onClick={() => navigate("/site-operations/snag-lists")}>
          Back to list
        </Button>
      </Page>
    );
  return (
    <Page className="snag-list-workspace">
      <PageHeader
        crumbs={[{ label: "Site Operations" }, { label: "Snag lists", to: "/site-operations/snag-lists" }, { label: id ? "Edit" : "Workspace" }]}
        icon={<ClipboardCheck size={22} />}
        title={id ? "Edit snag list" : "Create snag list"}
        subtitle="Capture site observations, assign scope and track rectification in one place."
        actions={
          <Button
            icon={ArrowLeft}
            onClick={() =>
              navigate(
                id
                  ? `/site-operations/snag-lists/${id}`
                  : "/site-operations/snag-lists",
              )
            }
          >
            Back
          </Button>
        }
      />
      <form onSubmit={submit}>
        <Card title="Document details" subtitle="Set the project and inspection date for this snag list.">
          <div className="snag-details-grid">
            <Field label="Title" required>
              <TextInput
                required
                maxLength={255}
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Field>
            <Field label="Project" required>
              <SelectInput
                required
                disabled={!!id}
                value={form.project_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, project_id: e.target.value }))
                }
              >
                <option value="">Select project</option>
                {id && !projects.some((p) => p.id === form.project_id) && (
                  <option value={form.project_id}>{form.project_name}</option>
                )}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Document date" required>
              <TextInput
                required
                type="date"
                value={form.document_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, document_date: e.target.value }))
                }
              />
            </Field>
          </div>
        </Card>
        <Card className="snag-rows" flush title="Site observations"
          subtitle="Record each snag with its location, photos and current status."
          actions={<Pill tone="brand" dot={false}>{form.items.length} {form.items.length === 1 ? "observation" : "observations"}</Pill>}>
          <div className="inos-table-wrap snag-table-scroll" tabIndex={0} role="region" aria-label="Editable site observations">
            <table className="inos-table snag-table">
              <caption className="snag-sr-only">Site observations with location, attachments, scope and rectification status</caption>
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
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={item.key}>
                    <td><span className="snag-row-number">{String(index + 1).padStart(2, "0")}</span></td>
                    {["floor", "room", "category", "observation"].map((k) => (
                      <td
                        key={k}
                        style={{ minWidth: k === "observation" ? 250 : 150 }}
                      >
                        <TextArea
                          aria-label={`${k}, row ${index + 1}`}
                          required={k === "observation"}
                          maxLength={
                            k === "floor"
                              ? 100
                              : k === "observation"
                                ? 10000
                                : 150
                          }
                          value={item[k]}
                          onChange={(e) => editRow(item.key, k, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="snag-photo-cell">
                      <input
                        className="snag-photo-input"
                        aria-label={`Upload photos, row ${index + 1}`}
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={
                          uploading ||
                          saving.isLoading ||
                          item.photos.length >= 10
                        }
                        onChange={(e) => {
                          uploadPhotos(
                            item.key,
                            Array.from(e.target.files || []),
                          );
                          e.target.value = "";
                        }}
                      />
                      <p className="snag-photo-hint">{item.photos.length}/10 photos{uploading ? " · Uploading…" : ""}</p>
                      {item.photos.map((url, n) => (
                        <div className="snag-attachment" key={url + n}>
                          <a href={url} target="_blank" rel="noreferrer">
                            Photo {n + 1}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={X}
                            aria-label={`Remove photo ${n + 1}, row ${index + 1}`}
                            disabled={uploading || saving.isLoading}
                            onClick={() =>
                              editRow(
                                item.key,
                                "photos",
                                item.photos.filter((_, j) => j !== n),
                              )
                            }
                          >
                          </Button>
                        </div>
                      ))}
                    </td>
                    <td style={{ minWidth: 150 }}>
                      <TextArea
                        aria-label={`Scope, row ${index + 1}`}
                        maxLength={150}
                        value={item.scope}
                        onChange={(e) =>
                          editRow(item.key, "scope", e.target.value)
                        }
                      />
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div className="snag-status"><StatusPill status={item.status} /></div>
                      <SelectInput
                        aria-label={`Status, row ${index + 1}`}
                        value={item.status}
                        onChange={(e) =>
                          editRow(item.key, "status", e.target.value)
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </SelectInput>
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <TextArea
                        aria-label={`Remarks, row ${index + 1}`}
                        maxLength={5000}
                        value={item.remarks}
                        onChange={(e) =>
                          editRow(item.key, "remarks", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        aria-label={`Remove observation ${index + 1}`}
                        disabled={
                          form.items.length === 1 ||
                          uploading ||
                          saving.isLoading
                        }
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            items: f.items.filter((i) => i.key !== item.key),
                          }))
                        }
                      >
                        Remove row
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="snag-save-bar">
            <span className="snag-save-hint">{form.items.length} of 500 observations</span>
            <div className="snag-save-actions">
            <Button
              icon={Plus}
              disabled={
                form.items.length >= 500 || uploading || saving.isLoading
              }
              onClick={() =>
                setForm((f) => ({ ...f, items: [...f.items, row()] }))
              }
            >
              Add row
            </Button>
            <Button
              icon={Save}
              type="submit"
              variant="primary"
              loading={saving.isLoading}
              disabled={
                uploading || saving.isLoading || (id && loaded.current !== id)
              }
            >
              Save snag list
            </Button>
            </div>
          </div>
          <div className="snag-note"><Info size={16} aria-hidden /><span>
            Photos are retained as attachment links in Excel. Saving preserves
            this revision's records and complete Excel file.
          </span></div>
        </Card>
      </form>
    </Page>
  );
}
