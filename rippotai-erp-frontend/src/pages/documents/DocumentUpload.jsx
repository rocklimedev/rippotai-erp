import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

import { Shell, Card, Input, TextArea } from "../../hooks/shared";

import {
  useCreateDocumentMutation,
  useGetDocumentTypesQuery,
} from "../../api/document.api";

import { useGetProjectsQuery } from "../../api/project.api";

/* ============================================================
   Upload Document
   ============================================================ */

export function DocumentUpload() {
  const nav = useNavigate();

  /* ------------------------------------------------------------
     Query string
     ------------------------------------------------------------ */

  const searchParams = new URLSearchParams(window.location.search);

  const initialProjectId =
    searchParams.get("projectId") || searchParams.get("project_id") || "";

  const initialDocumentTypeId =
    searchParams.get("documentTypeId") ||
    searchParams.get("document_type_id") ||
    "";

  /* ------------------------------------------------------------
     Form
     ------------------------------------------------------------ */

  const [form, setForm] = useState({
    projectId: initialProjectId,
    documentTypeId: initialDocumentTypeId,
    title: "",
    visibility: "internal",
    remarks: "",
  });

  const [file, setFile] = useState(null);
  const [documentTypeSearch, setDocumentTypeSearch] = useState("");
  const [showDocumentTypeDropdown, setShowDocumentTypeDropdown] =
    useState(false);
  /* ------------------------------------------------------------
     API
     ------------------------------------------------------------ */

  const [createDocument, { isLoading: uploading }] =
    useCreateDocumentMutation();

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  const {
    data: documentTypesResponse,
    isLoading: documentTypesLoading,
    isFetching: documentTypesFetching,
  } = useGetDocumentTypesQuery({
    isActive: true,
  });

  /* ------------------------------------------------------------
     Normalize projects
     ------------------------------------------------------------ */

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    if (Array.isArray(projectsResponse?.items)) {
      return projectsResponse.items;
    }

    if (Array.isArray(projectsResponse?.data)) {
      return projectsResponse.data;
    }

    if (Array.isArray(projectsResponse?.results)) {
      return projectsResponse.results;
    }

    return [];
  }, [projectsResponse]);

  /* ------------------------------------------------------------
     Normalize document types
     ------------------------------------------------------------ */

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesResponse)) {
      return documentTypesResponse;
    }

    if (Array.isArray(documentTypesResponse?.items)) {
      return documentTypesResponse.items;
    }

    if (Array.isArray(documentTypesResponse?.data)) {
      return documentTypesResponse.data;
    }

    if (Array.isArray(documentTypesResponse?.results)) {
      return documentTypesResponse.results;
    }

    return [];
  }, [documentTypesResponse]);

  /* ------------------------------------------------------------
     Selected document type
     ------------------------------------------------------------ */

  const selectedDocumentType = useMemo(() => {
    if (!form.documentTypeId) {
      return null;
    }

    return (
      documentTypes.find(
        (type) => String(type.id) === String(form.documentTypeId),
      ) || null
    );
  }, [documentTypes, form.documentTypeId]);

  /* ------------------------------------------------------------
     Categories derived from document types
     
     This allows the UI to group document types by category
     without maintaining a hard-coded CATEGORIES array.
     ------------------------------------------------------------ */

  const documentTypeCategories = useMemo(() => {
    const categories = new Map();

    documentTypes.forEach((type) => {
      const category =
        type.category || type.documentCategory || type.group || "Other";

      if (!categories.has(category)) {
        categories.set(category, []);
      }

      categories.get(category).push(type);
    });

    return Array.from(categories.entries()).map(([category, types]) => ({
      category,
      types,
    }));
  }, [documentTypes]);

  /* ------------------------------------------------------------
     Keep selected document type valid
     ------------------------------------------------------------ */

  useEffect(() => {
    if (
      form.documentTypeId &&
      documentTypes.some(
        (type) => String(type.id) === String(form.documentTypeId),
      )
    ) {
      return;
    }

    // Do nothing
  }, [documentTypes]);
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
     Document type change
     ------------------------------------------------------------ */

  const handleDocumentTypeChange = (event) => {
    const documentTypeId = event.target.value;

    setForm((current) => ({
      ...current,
      documentTypeId,
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
     * Backend:
     *
     * limits: {
     *   fileSize: 500 * 1024 * 1024
     * }
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

    if (!form.documentTypeId) {
      toast.error("Please select a document type");
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
      /*
       * Category comes from the selected DocumentType.
       *
       * This means the frontend no longer depends on:
       *
       * CATEGORIES = [...]
       */

      const category =
        selectedDocumentType?.category ||
        selectedDocumentType?.documentCategory ||
        selectedDocumentType?.group ||
        "";

      await createDocument({
        data: {
          projectId: form.projectId,

          /*
           * IMPORTANT
           * This is the new DocumentType relation.
           */
          documentTypeId: form.documentTypeId,

          /*
           * Keep category if your CreateDocumentDto
           * still supports it.
           *
           * If category has been completely removed from
           * CreateDocumentDto, simply remove this field.
           */
          ...(category
            ? {
                category,
              }
            : {}),

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
     Loading state
     ------------------------------------------------------------ */

  const loadingDocumentTypes = documentTypesLoading || documentTypesFetching;

  /* ------------------------------------------------------------
     Render
     ------------------------------------------------------------ */

  return (
    <Shell
      title="Upload Document"
      subtitle="Attach a document to a project — PDF · Excel · Image · Other files (max 500 MB)"
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
                  {project.name ||
                    project.projectName ||
                    `Project ${project.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* ====================================================
    Document Type - Searchable Dropdown
    ==================================================== */}

          <div className="relative">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Document Type
            </label>

            <div className="relative">
              <Input
                required
                disabled={loadingDocumentTypes || uploading}
                value={selectedDocumentType?.name || documentTypeSearch}
                placeholder={
                  loadingDocumentTypes
                    ? "Loading document types…"
                    : "Type to search document type..."
                }
                onChange={(event) => {
                  const value = event.target.value;

                  setDocumentTypeSearch(value);

                  // Clear selected document type when user starts typing
                  if (
                    selectedDocumentType &&
                    value !== selectedDocumentType.name
                  ) {
                    setForm((current) => ({
                      ...current,
                      documentTypeId: "",
                    }));
                  }

                  setShowDocumentTypeDropdown(true);
                }}
                onFocus={() => {
                  setShowDocumentTypeDropdown(true);
                }}
                onBlur={() => {
                  // Small delay so option click can fire
                  setTimeout(() => {
                    setShowDocumentTypeDropdown(false);
                  }, 150);
                }}
              />

              {showDocumentTypeDropdown && documentTypes.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-[#DDD8CE] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {documentTypes
                    .filter((type) => {
                      const search = documentTypeSearch.toLowerCase().trim();

                      if (!search) return true;

                      return (
                        type.name?.toLowerCase().includes(search) ||
                        type.code?.toLowerCase().includes(search) ||
                        type.phaseName?.toLowerCase().includes(search) ||
                        type.sectionName?.toLowerCase().includes(search)
                      );
                    })
                    .map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F5F3EF] border-b border-[#EEEAE3] last:border-b-0"
                        onMouseDown={(event) => {
                          event.preventDefault();

                          setForm((current) => ({
                            ...current,
                            documentTypeId: type.id,
                          }));

                          setDocumentTypeSearch(type.name || type.code || "");
                          setShowDocumentTypeDropdown(false);
                        }}
                      >
                        <div className="text-[14px] font-medium text-[#333333]">
                          {type.name || type.code}
                        </div>

                        {type.code && (
                          <div className="text-[11px] text-[#7A8586] mt-0.5">
                            {type.code}
                          </div>
                        )}
                      </button>
                    ))}

                  {documentTypes.filter((type) => {
                    const search = documentTypeSearch.toLowerCase().trim();

                    if (!search) return true;

                    return (
                      type.name?.toLowerCase().includes(search) ||
                      type.code?.toLowerCase().includes(search) ||
                      type.phaseName?.toLowerCase().includes(search) ||
                      type.sectionName?.toLowerCase().includes(search)
                    );
                  }).length === 0 && (
                    <div className="px-3 py-3 text-[13px] text-[#7A8586]">
                      No document types found
                    </div>
                  )}
                </div>
              )}
            </div>
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
              placeholder={
                selectedDocumentType
                  ? `e.g. ${selectedDocumentType.name || "Document"}`
                  : "Enter document title"
              }
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
                uploading ||
                projectsLoading ||
                loadingDocumentTypes ||
                !form.projectId ||
                !form.documentTypeId ||
                !file
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
