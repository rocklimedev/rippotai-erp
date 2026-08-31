import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

import { Shell, Card, Input, TextArea, CATEGORIES } from "../../hooks/shared";

import { useCreateDocumentMutation } from "../../api/document.api";

import { useGetProjectsQuery } from "../../api/project.api";

/* ============================================================
   Upload Document
   ============================================================ */

export function DocumentUpload() {
  const nav = useNavigate();

  /* ------------------------------------------------------------
     Project from query string

     Supports both:
       ?projectId=uuid
       ?project_id=uuid

     New standard is projectId.
     ------------------------------------------------------------ */

  const searchParams = new URLSearchParams(window.location.search);

  const initialProjectId =
    searchParams.get("projectId") || searchParams.get("project_id") || "";

  /* ------------------------------------------------------------
     Form
     ------------------------------------------------------------ */

  const [form, setForm] = useState({
    projectId: initialProjectId,
    category: "Agreements",
    title: "",
    visibility: "internal",
    remarks: "",
  });

  const [file, setFile] = useState(null);

  /* ------------------------------------------------------------
     API
     ------------------------------------------------------------ */

  const [createDocument, { isLoading: uploading }] =
    useCreateDocumentMutation();

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  /*
   * Depending on your projectsApi response this may be:
   *
   *   [...]
   *
   * or:
   *
   *   { data: [...] }
   *
   * or:
   *
   *   { items: [...] }
   */

  const projects = Array.isArray(projectsResponse)
    ? projectsResponse
    : projectsResponse?.items || projectsResponse?.data || [];

  /* ------------------------------------------------------------
     Field helper
     ------------------------------------------------------------ */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ------------------------------------------------------------
     File selection
     ------------------------------------------------------------ */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    /*
     * Backend controller currently allows 500 MB.
     *
     * Keep the UI validation consistent with the actual backend
     * limit rather than the old "25 MB" text.
     */

    const maxSize = 500 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      toast.error("File size cannot exceed 500 MB");

      event.target.value = "";
      setFile(null);

      return;
    }

    setFile(selectedFile);
  };

  /* ------------------------------------------------------------
     Submit
     ------------------------------------------------------------ */

  const submit = async (event) => {
    event.preventDefault();

    if (!form.projectId) {
      toast.error("Please select a project");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      await createDocument({
        data: {
          projectId: form.projectId,
          category: form.category,
          title: form.title.trim(),
          visibility: form.visibility,
          remarks: form.remarks.trim(),
        },
        file,
      }).unwrap();

      toast.success("Document uploaded successfully");

      nav("/documents/all");
    } catch (error) {
      console.error("Document upload failed:", error);

      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          error?.message ||
          "Upload failed",
      );
    }
  };

  /* ------------------------------------------------------------
     Render
     ------------------------------------------------------------ */

  return (
    <Shell
      title="Upload Document"
      subtitle="Attach a file to a project — PDF · Excel · Image · Other files (max 500 MB)"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-4 max-w-xl">
          {/* ====================================================
              Project
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>

            <select
              required
              disabled={projectsLoading || uploading}
              className="bc-input h-10 w-full disabled:opacity-60"
              value={form.projectId}
              onChange={(event) => updateField("projectId", event.target.value)}
            >
              <option value="">
                {projectsLoading ? "Loading projects…" : "Select project…"}
              </option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* ====================================================
              Category
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>

            <select
              disabled={uploading}
              className="bc-input h-10 w-full disabled:opacity-60"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* ====================================================
              Title
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>

            <Input
              required
              disabled={uploading}
              value={form.title}
              placeholder="Enter document title"
              onChange={(event) => updateField("title", event.target.value)}
            />
          </div>

          {/* ====================================================
              Visibility
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Visibility
            </label>

            <select
              disabled={uploading}
              className="bc-input h-10 w-full disabled:opacity-60"
              value={form.visibility}
              onChange={(event) =>
                updateField("visibility", event.target.value)
              }
            >
              <option value="internal">Internal only</option>

              <option value="client">Visible to client</option>
            </select>
          </div>

          {/* ====================================================
              File
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              File
            </label>

            <div className="border border-dashed border-[#B5C4B6] rounded-xl p-4 bg-[#FAF8F5]">
              <input
                id="document-file"
                type="file"
                required
                disabled={uploading}
                onChange={handleFileChange}
                className="text-[14px] w-full disabled:opacity-60"
              />

              {file && (
                <div className="flex items-center gap-2 mt-3 text-[12px] text-[#6B7B7C]">
                  <FileText size={15} />

                  <span className="truncate">{file.name}</span>

                  <span className="shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              Remarks
              ==================================================== */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Remarks
            </label>

            <TextArea
              rows={3}
              disabled={uploading}
              value={form.remarks}
              placeholder="Optional remarks..."
              onChange={(event) => updateField("remarks", event.target.value)}
            />
          </div>

          {/* ====================================================
              Actions
              ==================================================== */}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={uploading}
              onClick={() => nav("/documents/all")}
              className="h-11 px-5 rounded-lg border border-[#DDD8CE] text-[#333333] font-semibold disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                uploading || projectsLoading || !form.projectId || !file
              }
              className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Upload size={15} />

              {uploading ? "Uploading…" : "Upload Document"}
            </button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
