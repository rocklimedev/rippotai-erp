import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";
import {
  useGetDrawingsQuery,
  useUploadDrawingMutation,
} from "../../api/drawing.api"; // adjust to wherever drawingApi is defined
import { useGetProjectsQuery } from "../../api/project.api"; // adjust to wherever projectsApi is defined

/* ---------- Drawings ---------- */
export function DrawingsAll() {
  // Replaces api.get("/drawings") + useEffect/useState.
  const { data: rows = [] } = useGetDrawingsQuery();

  return (
    <Shell
      title="All Drawings"
      subtitle={`${rows.length} drawing${rows.length !== 1 ? "s" : ""} · revisions preserved`}
      action={
        <a
          href="/documents/drawings/upload"
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Upload size={14} /> Upload Drawing
        </a>
      }
    >
      <Card>
        <div className="table-container overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Drawing No.
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Title
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Discipline
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Rev.
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Issued
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[rgba(31,69,59,0.08)]"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-[#333333]">
                    {r.drawing_number}
                  </td>
                  <td className="px-3 py-2.5">{r.title}</td>
                  <td className="px-3 py-2.5">{r.discipline}</td>
                  <td className="px-3 py-2.5">{r.revision}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${r.status === "superseded" ? "bg-[#EAEEF0] text-[#6B7B7C]" : "bg-[#D8E0DA] text-[#333333]"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B7B7C]">
                    {(r.issue_date || "").slice(0, 10)}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#B5C4B6]">
                    No drawings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

export function DrawingUpload() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    project_id: "",
    title: "",
    drawing_number: "",
    discipline: "Architecture",
    revision: "R1",
    issue_date: "",
    issue_purpose: "",
    status: "Draft",
    remarks: "",
  });
  const [file, setFile] = useState(null);

  // Same projectsApi hook used in DocumentUpload — keeps both upload forms
  // pulling the project dropdown from one shared, cached source.
  const { data: projects = [] } = useGetProjectsQuery({});

  const [uploadDrawing, { isLoading: uploading }] = useUploadDrawingMutation();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a drawing file");
    try {
      // uploadDrawing builds the FormData internally (data fields + file),
      // matching the shape POST /drawings expects.
      await uploadDrawing({ data: form, file }).unwrap();
      toast.success("Drawing uploaded — previous revisions marked superseded");
      nav("/documents/drawings");
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <Shell
      title="Upload Drawing"
      subtitle="New revisions supersede prior ones · history is preserved"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl md:grid-cols-2">
          <div className="md:col-span-2">
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
          {[
            ["title", "Title"],
            ["drawing_number", "Drawing Number"],
            ["discipline", "Discipline"],
            ["revision", "Revision"],
            ["issue_date", "Issue Date", "date"],
            ["issue_purpose", "Issue Purpose"],
            ["status", "Status"],
            ["remarks", "Remarks"],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                {label}
              </label>
              <Input
                type={type || "text"}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <div className="md:col-span-2">
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
          <button
            disabled={uploading}
            className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold w-fit inline-flex items-center gap-2 md:col-span-2 disabled:opacity-60"
          >
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload Drawing"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
