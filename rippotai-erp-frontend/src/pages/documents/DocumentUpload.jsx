import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, FileText, Lock, Eye, CloudUpload } from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  FormSection,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  ChoiceGroup,
} from "@/components/inos";
import "@/components/projects/projects-ui.css";

import {
  useCreateDocumentMutation,
  useGetDocumentTypesQuery,
} from "../../api/documents/document.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

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

      nav("/projects/documents/all");
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

  const filteredTypes = documentTypes.filter((type) => {
    const search = documentTypeSearch.toLowerCase().trim();
    if (!search) return true;
    return (
      type.name?.toLowerCase().includes(search) ||
      type.code?.toLowerCase().includes(search) ||
      type.phaseName?.toLowerCase().includes(search) ||
      type.sectionName?.toLowerCase().includes(search)
    );
  });

  const selectedProject = projects.find((project) => String(project.id) === String(form.projectId));

  return (
    <Page width="form">
      <PageHeader
        crumbs={[
          { label: "Projects", to: "/projects" },
          { label: "Documents", to: "/projects/documents/all" },
          { label: "Upload" },
        ]}
        title="Upload document"
        subtitle="Attach a file to a project checklist — PDF, Excel, images or any other file up to 500 MB."
      />

      <form onSubmit={submit} className="inos-form">
        <FormSection step={1} title="Where it belongs" description="Pick the project and the checklist item this file satisfies.">
          <Field label="Project" required full>
            <SelectInput
              required
              disabled={projectsLoading || uploading}
              value={form.projectId}
              onChange={(event) => updateField("projectId", event.target.value)}
            >
              <option value="">{projectsLoading ? "Loading projects…" : "Select project"}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.projectName || `Project ${project.id}`}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label="Document type"
            required
            full
            hint={
              selectedDocumentType
                ? [selectedDocumentType.phaseName, selectedDocumentType.code].filter(Boolean).join(" · ") || undefined
                : "Type to search by name, code or phase."
            }
          >
            <div className="pj-combo">
              <TextInput
                required
                disabled={loadingDocumentTypes || uploading}
                value={selectedDocumentType?.name || documentTypeSearch}
                placeholder={loadingDocumentTypes ? "Loading document types…" : "e.g. Site measurement drawing"}
                role="combobox"
                aria-expanded={showDocumentTypeDropdown}
                onChange={(event) => {
                  const value = event.target.value;
                  setDocumentTypeSearch(value);
                  if (selectedDocumentType && value !== selectedDocumentType.name) {
                    setForm((current) => ({ ...current, documentTypeId: "" }));
                  }
                  setShowDocumentTypeDropdown(true);
                }}
                onFocus={() => setShowDocumentTypeDropdown(true)}
                onBlur={() => setTimeout(() => setShowDocumentTypeDropdown(false), 150)}
              />

              {showDocumentTypeDropdown && documentTypes.length > 0 && (
                <div className="pj-combo__list" role="listbox">
                  {filteredTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      role="option"
                      aria-selected={String(type.id) === String(form.documentTypeId)}
                      className="pj-combo__opt"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setForm((current) => ({ ...current, documentTypeId: type.id }));
                        setDocumentTypeSearch(type.name || type.code || "");
                        setShowDocumentTypeDropdown(false);
                      }}
                    >
                      <div className="pj-combo__opt-title">{type.name || type.code}</div>
                      {(type.code || type.phaseName) && (
                        <div className="pj-combo__opt-sub">{[type.code, type.phaseName].filter(Boolean).join(" · ")}</div>
                      )}
                    </button>
                  ))}
                  {filteredTypes.length === 0 && (
                    <div className="pj-combo__opt pj-combo__opt-sub">No document types found</div>
                  )}
                </div>
              )}
            </div>
          </Field>
        </FormSection>

        <FormSection step={2} title="The file" description="Name it clearly so the team can find it later.">
          <Field label="Title" required full>
            <TextInput
              required
              disabled={uploading}
              value={form.title}
              placeholder={selectedDocumentType ? `e.g. ${selectedDocumentType.name || "Document"} — rev A` : "e.g. Ground floor plan — rev A"}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </Field>

          <Field label="File" required full hint="Max 500 MB.">
            <label className="pj-drop" htmlFor="document-file" style={{ position: "relative" }}>
              <span className="inos-icon-tile">
                {file ? <FileText aria-hidden /> : <CloudUpload aria-hidden />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="pj-cell-title pj-truncate" style={{ display: "block" }}>
                  {file ? file.name : "Choose a file to upload"}
                </span>
                <span className="pj-cell-sub" style={{ display: "block" }}>
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB — click to change` : "PDF, Excel, images or other files"}
                </span>
              </span>
              <span className="inos-btn inos-btn--secondary inos-btn--sm">Browse</span>
              <input id="document-file" type="file" required disabled={uploading} onChange={handleFileChange} />
            </label>
          </Field>

          <Field label="Who can see it" full>
            <ChoiceGroup
              name="Visibility"
              value={form.visibility}
              onChange={(value) => updateField("visibility", value)}
              options={[
                { value: "internal", label: "Internal only", icon: Lock },
                { value: "client", label: "Visible to client", icon: Eye },
              ]}
            />
          </Field>

          <Field label="Remarks" optional full>
            <TextArea
              rows={3}
              disabled={uploading}
              value={form.remarks}
              placeholder="e.g. Revised after client walkthrough on site"
              onChange={(event) => updateField("remarks", event.target.value)}
            />
          </Field>
        </FormSection>

        <div className="inos-form-actions">
          <span className="inos-form-actions__note">
            {selectedProject ? `Uploading to ${selectedProject.name}` : "Select a project, document type and file to continue."}
          </span>
          <div className="inos-form-actions__buttons">
            <Button variant="ghost" disabled={uploading} onClick={() => nav("/projects/documents/all")}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Upload}
              disabled={uploading || projectsLoading || loadingDocumentTypes || !form.projectId || !form.documentTypeId || !file}
            >
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
