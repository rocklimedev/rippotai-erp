import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Shell, Card, Input, TextArea, CATEGORIES } from "../../hooks/shared";
import { useCreateDocumentMutation } from "../../api/document.api"; // adjust to wherever documentApi is defined
import { useGetProjectsQuery } from "../../api/project.api"; // adjust to wherever projectsApi is defined

/* ---------- Upload Document ---------- */
export function DocumentUpload() {
  const nav = useNavigate();
  // Prefill project_id from ?project_id=… query param (used by Documents dashboard "+" icons)
  const initialProjectId =
    new URLSearchParams(window.location.search).get("project_id") || "";
  const [form, setForm] = useState({
    project_id: initialProjectId,
    category: "Agreements",
    title: "",
    visibility: "internal",
    remarks: "",
  });
  const [file, setFile] = useState(null);

  const [createDocument, { isLoading: uploading }] =
    useCreateDocumentMutation();

  // Replaces the manual api.get("/projects") + useEffect/useState with the
  // projectsApi RTK Query hook. getProjects takes { status, includeArchived };
  // omit them to get the plain unfiltered list this form needs.
  const { data: projects = [] } = useGetProjectsQuery({});

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a file");
    try {
      // createDocument builds the FormData internally (data fields + file),
      // matching the shape POST /documents expects.
      await createDocument({ data: form, file }).unwrap();
      toast.success("Document uploaded");
      nav("/documents/all");
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <Shell
      title="Upload Document"
      subtitle="Attach a file to a project — PDF · Excel · Image (max 25 MB)"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-4 max-w-xl">
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>
            <select
              required
              className="bc-input h-10 w-full"
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>
            <select
              className="bc-input h-10 w-full"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Visibility
            </label>
            <select
              className="bc-input h-10 w-full"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <option value="internal">Internal only</option>
              <option value="client">Visible to client</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              File
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="text-[14px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Remarks
            </label>
            <TextArea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
          <button
            disabled={uploading}
            className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold w-fit inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
