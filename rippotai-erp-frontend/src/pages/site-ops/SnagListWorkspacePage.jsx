import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      <Page>
        <p>Loading snag list…</p>
      </Page>
    );
  if (id && error)
    return (
      <Page>
        <p role="alert">Unable to load snag list.</p>
        <Button onClick={() => navigate("/site-operations/snag-lists")}>
          Back to list
        </Button>
      </Page>
    );
  return (
    <Page>
      <PageHeader
        eyebrow="Site Operations"
        title={id ? "Edit snag list" : "Create snag list"}
        subtitle="Record site observations using the Snag list sheet fields."
        actions={
          <Button
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
        <Card>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
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
        <Card title="Snag rows">
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
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={item.key}>
                    <td>{index + 1}</td>
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
                    <td style={{ minWidth: 200 }}>
                      <input
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
                      {item.photos.map((url, n) => (
                        <div key={url + n}>
                          <a href={url} target="_blank" rel="noreferrer">
                            Photo {n + 1}
                          </a>
                          <Button
                            disabled={uploading || saving.isLoading}
                            onClick={() =>
                              editRow(
                                item.key,
                                "photos",
                                item.photos.filter((_, j) => j !== n),
                              )
                            }
                          >
                            Remove
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
                    <td style={{ minWidth: 160 }}>
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
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <Button
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
          <p>
            Photos are retained as attachment links in Excel. Saving preserves
            this revision's records and complete Excel file.
          </p>
        </Card>
      </form>
    </Page>
  );
}
