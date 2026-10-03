import React, { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  ChevronRight,
  FolderKanban,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Move,
  Copy,
  Settings2,
  Layers3,
  AlertTriangle,
  FilePlus2,
  FolderPlus,
  SearchX,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  SearchInput,
  EmptyState,
  Pill,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ChoiceGroup,
} from "@/components/inos";

import {
  useGetProjectPhasesQuery,
  useCreateProjectPhaseMutation,
  useUpdateProjectPhaseMutation,
  useDeleteProjectPhaseMutation,
} from "../../api/projects/project.api";

import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
} from "../../api/documents/document.api";

import {
  AdminModal,
  ModalActions,
  RowMenu,
  ToggleRow,
  adminCrumbs,
  humanize,
  plural,
} from "../settings/_admin-ui";

/* =========================================================
   Helpers
========================================================= */

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const getId = (item) => item?.id ?? item?._id ?? null;

const getName = (item) =>
  item?.name || item?.title || item?.label || item?.code || "Untitled";

const getCode = (item) =>
  item?.code || item?.phase_code || item?.phaseCode || item?.documentCode || "";

/** "01 BRIEF" -> "Brief" (the number is shown separately) */
const phaseLabel = (phase) => {
  const raw = getName(phase).replace(/^\d+[\s._-]+/, "");
  return humanize(raw) || getName(phase);
};

const toCode = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getDescription = (item) => item?.description || "";

const getActive = (item) => {
  if (typeof item?.isActive === "boolean") return item.isActive;
  if (typeof item?.active === "boolean") return item.active;
  if (typeof item?.status === "string") {
    return !["INACTIVE", "DISABLED", "ARCHIVED"].includes(
      item.status.toUpperCase(),
    );
  }
  return true;
};

const getPhaseIdFromDocument = (documentType) =>
  documentType?.projectPhaseId ||
  documentType?.phaseId ||
  documentType?.project_phase_id ||
  documentType?.phase?.id ||
  null;

/* =========================================================
   Main Component
========================================================= */

export default function ProjectStructure() {
  const {
    data: phasesResponse,
    isLoading: phasesLoading,
    isFetching: phasesFetching,
    refetch: refetchPhases,
  } = useGetProjectPhasesQuery({});

  const {
    data: documentTypesResponse,
    isLoading: documentTypesLoading,
    isFetching: documentTypesFetching,
    refetch: refetchDocumentTypes,
  } = useGetDocumentTypesQuery({});

  const [createProjectPhase, { isLoading: creatingPhase }] =
    useCreateProjectPhaseMutation();
  const [updateProjectPhase, { isLoading: updatingPhase }] =
    useUpdateProjectPhaseMutation();
  const [deleteProjectPhase, { isLoading: deletingPhase }] =
    useDeleteProjectPhaseMutation();

  const [createDocumentType, { isLoading: creatingDocumentType }] =
    useCreateDocumentTypeMutation();
  const [updateDocumentType, { isLoading: updatingDocumentType }] =
    useUpdateDocumentTypeMutation();
  const [deleteDocumentType, { isLoading: deletingDocumentType }] =
    useDeleteDocumentTypeMutation();

  const phases = useMemo(
    () => normalizeArray(phasesResponse),
    [phasesResponse],
  );
  const documentTypes = useMemo(
    () => normalizeArray(documentTypesResponse),
    [documentTypesResponse],
  );

  const [search, setSearch] = useState("");
  const [expandedPhases, setExpandedPhases] = useState({});
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [modal, setModal] = useState(null);

  const [phaseForm, setPhaseForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [documentForm, setDocumentForm] = useState({
    name: "",
    code: "",
    description: "",
    projectPhaseId: "",
    phaseCode: "",
    targetType: "",
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [phaseErrors, setPhaseErrors] = useState({});
  const [documentErrors, setDocumentErrors] = useState({});

  const selectedPhase = useMemo(() => {
    return phases.find((phase) => getId(phase) === selectedPhaseId) || null;
  }, [phases, selectedPhaseId]);

  const selectedDocument = useMemo(() => {
    return (
      documentTypes.find(
        (documentType) => getId(documentType) === selectedDocumentId,
      ) || null
    );
  }, [documentTypes, selectedDocumentId]);

  const documentsByPhase = useMemo(() => {
    const grouped = {};
    phases.forEach((phase) => {
      grouped[getId(phase)] = [];
    });
    documentTypes.forEach((documentType) => {
      const phaseId = getPhaseIdFromDocument(documentType);
      if (!grouped[phaseId]) grouped[phaseId] = [];
      grouped[phaseId].push(documentType);
    });
    return grouped;
  }, [phases, documentTypes]);

  const filteredPhases = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return phases;

    return phases.filter((phase) => {
      const phaseId = getId(phase);
      const phaseMatch =
        getName(phase).toLowerCase().includes(query) ||
        getCode(phase).toLowerCase().includes(query) ||
        getDescription(phase).toLowerCase().includes(query);

      const phaseDocuments = documentsByPhase[phaseId] || [];
      const documentMatch = phaseDocuments.some((documentType) => {
        return (
          getName(documentType).toLowerCase().includes(query) ||
          getCode(documentType).toLowerCase().includes(query) ||
          getDescription(documentType).toLowerCase().includes(query)
        );
      });

      return phaseMatch || documentMatch;
    });
  }, [search, phases, documentsByPhase]);

  const handleRefresh = async () => {
    await Promise.all([refetchPhases(), refetchDocumentTypes()]);
    toast.success("Project structure refreshed");
  };

  const togglePhase = (phaseId) => {
    setExpandedPhases((previous) => ({
      ...previous,
      [phaseId]: !previous[phaseId],
    }));
  };

  const handleSelectPhase = (phase) => {
    const id = getId(phase);
    setSelectedPhaseId(id);
    setSelectedDocumentId(null);
    if (!expandedPhases[id]) {
      setExpandedPhases((previous) => ({ ...previous, [id]: true }));
    }
  };

  const handleSelectDocument = (documentType) => {
    setSelectedDocumentId(getId(documentType));
    setSelectedPhaseId(getPhaseIdFromDocument(documentType));
  };

  /* =======================================================
     PHASE MODAL
  ======================================================= */

  const openCreatePhase = () => {
    setPhaseForm({ name: "", code: "", description: "" });
    setPhaseErrors({});
    setModal("create-phase");
  };

  const openEditPhase = (phase) => {
    setPhaseForm({
      name: getName(phase) === "Untitled" ? "" : getName(phase),
      code: getCode(phase),
      description: phase?.description || "",
    });
    setPhaseErrors({});
    setSelectedPhaseId(getId(phase));
    setModal("edit-phase");
  };

  const submitPhase = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!phaseForm.name.trim()) errs.name = "Phase name is required.";
    if (!toCode(phaseForm.code || phaseForm.name)) errs.code = "A short code is required.";
    setPhaseErrors(errs);
    if (Object.keys(errs).length) return;

    // API expects title / phase_code / phase_number; legacy aliases kept
    const title = phaseForm.name.trim();
    const code = toCode(phaseForm.code || phaseForm.name);
    const phasePayload = {
      title,
      name: title,
      phase_code: code,
      code,
      description: phaseForm.description.trim() || undefined,
    };

    try {
      if (modal === "create-phase") {
        const nextNumber =
          phases.reduce((m, p) => Math.max(m, Number(p.phase_number) || 0), 0) + 1;
        const response = await createProjectPhase({
          ...phasePayload,
          phase_number: nextNumber,
        }).unwrap();

        const createdPhase =
          response?.data || response?.item || response?.result || response;
        const createdId = getId(createdPhase);

        if (createdId) {
          setSelectedPhaseId(createdId);
          setExpandedPhases((previous) => ({
            ...previous,
            [createdId]: true,
          }));
        }
        toast.success("Project phase created");
      } else if (modal === "edit-phase") {
        if (!selectedPhaseId) {
          toast.error("Phase not selected");
          return;
        }
        await updateProjectPhase({
          id: selectedPhaseId,
          ...phasePayload,
        }).unwrap();
        toast.success("Project phase updated");
      }

      setModal(null);
      await refetchPhases();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save project phase",
      );
    }
  };

  /* =======================================================
     DOCUMENT TYPE MODAL
  ======================================================= */

  const openCreateDocument = (phase = null) => {
    const phaseId = phase ? getId(phase) : selectedPhaseId;
    const selectedPhaseForDocument =
      phases.find((item) => getId(item) === phaseId) || null;

    setDocumentForm({
      name: "",
      code: "",
      description: "",
      projectPhaseId: phaseId || "",
      phaseCode: getCode(selectedPhaseForDocument),
      targetType: "DOCUMENT",
      isActive: true,
    });
    setDocumentErrors({});
    setModal("create-document");
  };

  const openEditDocument = (documentType) => {
    setDocumentForm({
      name: documentType?.name || "",
      code: documentType?.code || "",
      description: documentType?.description || "",
      projectPhaseId: getPhaseIdFromDocument(documentType) || "",
      phaseCode: documentType?.phaseCode || documentType?.phase?.code || "",
      targetType: documentType?.targetType || "",
      isActive: getActive(documentType),
    });
    setDocumentErrors({});
    setSelectedDocumentId(getId(documentType));
    setSelectedPhaseId(getPhaseIdFromDocument(documentType));
    setModal("edit-document");
  };

  const submitDocument = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!documentForm.name.trim()) errs.name = "Document type name is required.";
    if (!toCode(documentForm.code || documentForm.name)) errs.code = "A short code is required.";
    if (!documentForm.projectPhaseId) errs.projectPhaseId = "Choose a project phase.";
    setDocumentErrors(errs);
    if (Object.keys(errs).length) return;

    const docPhase = phases.find((p) => getId(p) === documentForm.projectPhaseId);

    try {
      const payload = {
        name: documentForm.name.trim(),
        code: toCode(documentForm.code || documentForm.name) || undefined,
        description: documentForm.description.trim() || undefined,
        projectPhaseId: documentForm.projectPhaseId,
        phaseCode: documentForm.phaseCode || getCode(docPhase) || undefined,
        phaseName: docPhase ? getName(docPhase) : undefined,
        targetType: documentForm.targetType || undefined,
        isActive: documentForm.isActive,
      };

      if (modal === "create-document") {
        const response = await createDocumentType(payload).unwrap();
        const createdDocument =
          response?.data || response?.item || response?.result || response;
        const createdId = getId(createdDocument);
        if (createdId) setSelectedDocumentId(createdId);
        setSelectedPhaseId(documentForm.projectPhaseId);
        setExpandedPhases((previous) => ({
          ...previous,
          [documentForm.projectPhaseId]: true,
        }));
        toast.success("Document type created");
      } else if (modal === "edit-document") {
        if (!selectedDocumentId) {
          toast.error("Document type not selected");
          return;
        }
        await updateDocumentType({
          id: selectedDocumentId,
          data: payload,
        }).unwrap();
        setSelectedPhaseId(documentForm.projectPhaseId);
        setExpandedPhases((previous) => ({
          ...previous,
          [documentForm.projectPhaseId]: true,
        }));
        toast.success("Document type updated");
      }

      setModal(null);
      await refetchDocumentTypes();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save document type",
      );
    }
  };

  /* =======================================================
     MOVE / DUPLICATE / TOGGLE / DELETE
  ======================================================= */

  const openMoveDocument = (documentType) => {
    setSelectedDocumentId(getId(documentType));
    setDocumentForm((prev) => ({
      ...prev,
      projectPhaseId: getPhaseIdFromDocument(documentType) || "",
    }));
    setModal("move-document");
  };

  const submitMoveDocument = async (event) => {
    event.preventDefault();
    if (!selectedDocumentId) {
      toast.error("Document type not selected");
      return;
    }
    if (!documentForm.projectPhaseId) {
      toast.error("Please select a destination phase");
      return;
    }

    try {
      const destinationPhase = phases.find(
        (phase) => getId(phase) === documentForm.projectPhaseId,
      );
      await updateDocumentType({
        id: selectedDocumentId,
        data: {
          projectPhaseId: documentForm.projectPhaseId,
          phaseCode: getCode(destinationPhase) || undefined,
          phaseName: destinationPhase ? getName(destinationPhase) : undefined,
        },
      }).unwrap();

      setSelectedPhaseId(documentForm.projectPhaseId);
      setExpandedPhases((previous) => ({
        ...previous,
        [documentForm.projectPhaseId]: true,
      }));
      toast.success("Document type moved");
      setModal(null);
      await refetchDocumentTypes();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to move document type",
      );
    }
  };

  const duplicateDocument = async (documentType) => {
    try {
      const phaseId = getPhaseIdFromDocument(documentType);
      await createDocumentType({
        name: `${getName(documentType)} Copy`,
        code: getCode(documentType)
          ? `${getCode(documentType)}_COPY`
          : undefined,
        description: getDescription(documentType) || undefined,
        projectPhaseId: phaseId || undefined,
        phaseCode:
          documentType?.phaseCode || documentType?.phase?.code || undefined,
        targetType: documentType?.targetType || undefined,
        isActive: getActive(documentType),
      }).unwrap();
      toast.success("Document type duplicated");
      await refetchDocumentTypes();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to duplicate document type",
      );
    }
  };

  const toggleDocumentStatus = async (documentType) => {
    const id = getId(documentType);
    if (!id) return;
    try {
      await updateDocumentType({
        id,
        data: { isActive: !getActive(documentType) },
      }).unwrap();
      toast.success(
        getActive(documentType)
          ? "Document type deactivated"
          : "Document type activated",
      );
      await refetchDocumentTypes();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to update document type",
      );
    }
  };

  const requestDeletePhase = (phase) => {
    setDeleteTarget({ type: "phase", item: phase });
  };

  const requestDeleteDocument = (documentType) => {
    setDeleteTarget({ type: "document", item: documentType });
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.item) return;
    try {
      if (deleteTarget.type === "phase") {
        const id = getId(deleteTarget.item);
        await deleteProjectPhase(id).unwrap();
        if (selectedPhaseId === id) {
          setSelectedPhaseId(null);
          setSelectedDocumentId(null);
        }
        toast.success("Project phase deleted");
        await Promise.all([refetchPhases(), refetchDocumentTypes()]);
      }
      if (deleteTarget.type === "document") {
        const id = getId(deleteTarget.item);
        await deleteDocumentType(id).unwrap();
        if (selectedDocumentId === id) setSelectedDocumentId(null);
        toast.success("Document type deleted");
        await refetchDocumentTypes();
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to delete item",
      );
    }
  };

  const isLoading = phasesLoading || documentTypesLoading;
  const isRefreshing = phasesFetching || documentTypesFetching;
  const isSaving =
    creatingPhase ||
    updatingPhase ||
    creatingDocumentType ||
    updatingDocumentType;

  const activeDocuments = documentTypes.filter(getActive).length;
  const inactiveDocuments = documentTypes.length - activeDocuments;


  /* =======================================================
     Render
  ======================================================= */

  const phaseOf = (documentType) =>
    phases.find((phase) => getId(phase) === getPhaseIdFromDocument(documentType)) || null;

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Project structure")}
        title="Project structure"
        subtitle="Phases and the document types inside them — the skeleton every new project is built on."
        actions={
          <>
            <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="primary" icon={FolderPlus} onClick={openCreatePhase} data-testid="ps-add-phase-btn">
              Add phase
            </Button>
          </>
        }
      />

      <Stats>
        <StatTile label="Phases" value={phases.length} icon={<FolderKanban />} />
        <StatTile label="Document types" value={documentTypes.length} icon={<FileText />} tone="info" />
        <StatTile label="Active" value={activeDocuments} icon={<CheckCircle2 />} tone="ok" />
        <StatTile label="Inactive" value={inactiveDocuments} icon={<XCircle />} tone="peach" />
      </Stats>

      <div className="adm-split adm-split--wide">
        {/* LEFT TREE */}
        <section className="inos-card adm-sticky">
          <div className="inos-card__header" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div>
                <h2 className="inos-section-title">Structure</h2>
                <p className="inos-section-sub">
                  {plural(phases.length, "phase")} · {plural(documentTypes.length, "document type")}
                </p>
              </div>
              <Button variant="ghost" size="sm" icon={Plus} onClick={openCreatePhase} aria-label="Add phase" title="Add phase" />
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search phases or documents" />
          </div>

          {isLoading ? (
            <div className="adm-tree">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="adm-tree__row" style={{ padding: 10 }}>
                  <div className="adm-skel" style={{ width: `${80 - i * 6}%` }} />
                </div>
              ))}
            </div>
          ) : filteredPhases.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : FolderKanban}
              title={search ? "Nothing matches" : "No phases yet"}
              text={search ? "Try another search term." : "Create your first phase to start building the tree."}
              action={
                !search && (
                  <Button variant="soft" icon={Plus} onClick={openCreatePhase}>
                    Add phase
                  </Button>
                )
              }
            />
          ) : (
            <div className="adm-tree" role="tree" aria-label="Project structure">
              {filteredPhases.map((phase) => {
                const phaseId = getId(phase);
                const phaseDocuments = documentsByPhase[phaseId] || [];
                const isExpanded = expandedPhases[phaseId] || !!search;
                const isSelected = selectedPhaseId === phaseId && !selectedDocumentId;

                return (
                  <div key={phaseId} role="treeitem" aria-expanded={isExpanded}>
                    <div className="adm-tree__row" aria-current={isSelected}>
                      <button
                        type="button"
                        className="adm-tree__caret"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        onClick={() => togglePhase(phaseId)}
                      >
                        <ChevronRight aria-hidden />
                      </button>

                      <button type="button" onClick={() => handleSelectPhase(phase)} className="adm-tree__main">
                        <span className="adm-num" style={{ width: 28, height: 28, fontSize: 11.5 }}>
                          {phase.phase_number ?? "•"}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="adm-tree__name" style={{ display: "block" }}>
                            {phaseLabel(phase)}
                          </span>
                          <span className="adm-tree__meta" style={{ display: "block" }}>
                            {plural(phaseDocuments.length, "document")}
                          </span>
                        </span>
                      </button>

                      <span className="adm-tree__more">
                        <RowMenu
                          label={`Actions for ${getName(phase)}`}
                          items={[
                            { label: "Add document type", icon: FilePlus2, onClick: () => openCreateDocument(phase) },
                            { label: "Edit phase", icon: Pencil, onClick: () => openEditPhase(phase) },
                            "sep",
                            { label: "Delete phase", icon: Trash2, danger: true, onClick: () => requestDeletePhase(phase) },
                          ]}
                        />
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="adm-tree__children" role="group">
                        {phaseDocuments.map((documentType) => {
                          const documentId = getId(documentType);
                          const documentSelected = selectedDocumentId === documentId;
                          const DocIcon = documentType?.targetType === "DRAWING" ? PenTool : FileText;

                          return (
                            <div key={documentId} className="adm-tree__row" aria-current={documentSelected} role="treeitem">
                              <button type="button" onClick={() => handleSelectDocument(documentType)} className="adm-tree__main" style={{ paddingLeft: 6 }}>
                                <DocIcon size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden />
                                <span style={{ minWidth: 0 }}>
                                  <span className="adm-tree__name" style={{ display: "block" }}>
                                    {getName(documentType)}
                                  </span>
                                  <span className="adm-tree__meta" style={{ display: "block" }}>
                                    {getCode(documentType) || "No code"}
                                    {!getActive(documentType) && " · Inactive"}
                                  </span>
                                </span>
                              </button>

                              <span className="adm-tree__more">
                                <RowMenu
                                  label={`Actions for ${getName(documentType)}`}
                                  items={[
                                    { label: "Edit", icon: Pencil, onClick: () => openEditDocument(documentType) },
                                    { label: "Move to phase", icon: Move, onClick: () => openMoveDocument(documentType) },
                                    { label: "Duplicate", icon: Copy, onClick: () => duplicateDocument(documentType) },
                                    {
                                      label: getActive(documentType) ? "Deactivate" : "Activate",
                                      icon: getActive(documentType) ? XCircle : CheckCircle2,
                                      onClick: () => toggleDocumentStatus(documentType),
                                    },
                                    "sep",
                                    { label: "Delete", icon: Trash2, danger: true, onClick: () => requestDeleteDocument(documentType) },
                                  ]}
                                />
                              </span>
                            </div>
                          );
                        })}

                        <button type="button" className="adm-tree__add" onClick={() => openCreateDocument(phase)}>
                          <Plus aria-hidden />
                          Add document type
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT DETAIL */}
        <div style={{ minWidth: 0 }}>
          {selectedDocument ? (
            <DocumentDetails
              documentType={selectedDocument}
              phase={phaseOf(selectedDocument)}
              onEdit={() => openEditDocument(selectedDocument)}
              onMove={() => openMoveDocument(selectedDocument)}
              onDuplicate={() => duplicateDocument(selectedDocument)}
              onToggle={() => toggleDocumentStatus(selectedDocument)}
              onDelete={() => requestDeleteDocument(selectedDocument)}
              onBack={() => setSelectedDocumentId(null)}
            />
          ) : selectedPhase ? (
            <PhaseDetails
              phase={selectedPhase}
              documents={documentsByPhase[selectedPhaseId] || []}
              onEdit={() => openEditPhase(selectedPhase)}
              onDelete={() => requestDeletePhase(selectedPhase)}
              onAddDocument={() => openCreateDocument(selectedPhase)}
              onSelectDocument={handleSelectDocument}
            />
          ) : (
            <WelcomePanel
              phases={phases}
              documents={documentTypes}
              onAddPhase={openCreatePhase}
              onAddDocument={() => openCreateDocument(null)}
            />
          )}
        </div>
      </div>

      {/* MODALS */}
      <AdminModal
        open={modal === "create-phase" || modal === "edit-phase"}
        as="form"
        onSubmit={submitPhase}
        onClose={() => setModal(null)}
        busy={isSaving}
        icon={FolderKanban}
        title={modal === "create-phase" ? "Add phase" : "Edit phase"}
        subtitle={modal === "create-phase" ? "It will be added at the end of the workflow." : "Update the selected project phase."}
        width={540}
        footer={
          <ModalActions
            onCancel={() => setModal(null)}
            submitting={isSaving}
            submitLabel={modal === "create-phase" ? "Add phase" : "Save changes"}
          />
        }
      >
        <PhaseForm form={phaseForm} setForm={setPhaseForm} errors={phaseErrors} />
      </AdminModal>

      <AdminModal
        open={modal === "create-document" || modal === "edit-document"}
        as="form"
        onSubmit={submitDocument}
        onClose={() => setModal(null)}
        busy={isSaving}
        icon={FileText}
        tone="info"
        title={modal === "create-document" ? "Add document type" : "Edit document type"}
        subtitle={modal === "create-document" ? "Add a document type under a project phase." : "Update document type configuration."}
        width={620}
        footer={
          <ModalActions
            onCancel={() => setModal(null)}
            submitting={isSaving}
            submitLabel={modal === "create-document" ? "Add document type" : "Save changes"}
          />
        }
      >
        <DocumentForm form={documentForm} setForm={setDocumentForm} phases={phases} errors={documentErrors} />
      </AdminModal>

      <AdminModal
        open={modal === "move-document"}
        as="form"
        onSubmit={submitMoveDocument}
        onClose={() => setModal(null)}
        busy={updatingDocumentType}
        icon={Move}
        title="Move document type"
        subtitle={`Move “${selectedDocument ? getName(selectedDocument) : "document"}” to another phase.`}
        width={480}
        footer={
          <ModalActions
            onCancel={() => setModal(null)}
            submitting={updatingDocumentType}
            submittingLabel="Moving…"
            submitLabel="Move"
            icon={Move}
          />
        }
      >
        <Field label="Destination phase" required htmlFor="mv-phase">
          <SelectInput
            id="mv-phase"
            value={documentForm.projectPhaseId || ""}
            onChange={(e) => setDocumentForm((prev) => ({ ...prev, projectPhaseId: e.target.value }))}
            placeholder="Choose a phase"
          >
            {phases.map((phase) => (
              <option key={getId(phase)} value={getId(phase)}>
                {getName(phase)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </AdminModal>

      <AdminModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        busy={deletingPhase || deletingDocumentType}
        icon={AlertTriangle}
        tone="bad"
        title={`Delete ${deleteTarget?.type === "phase" ? "phase" : "document type"}?`}
        subtitle={
          <>
            <strong style={{ color: "var(--text)" }}>{getName(deleteTarget?.item)}</strong> will be removed. This may affect
            existing project configuration and can't easily be undone.
          </>
        }
        width={460}
        footer={
          <ModalActions
            onCancel={() => setDeleteTarget(null)}
            onSubmit={confirmDelete}
            submitting={deletingPhase || deletingDocumentType}
            submittingLabel="Deleting…"
            submitLabel="Delete"
            icon={Trash2}
            danger
          />
        }
      >
        {deleteTarget?.type === "phase" ? (
          <div className="adm-callout adm-callout--warn">
            <AlertTriangle aria-hidden />
            Make sure no active project uses this phase before deleting it.
          </div>
        ) : (
          <p className="adm-section__desc" style={{ margin: 0 }}>
            Projects that already produced this document keep their files.
          </p>
        )}
      </AdminModal>
    </Page>
  );
}

/* =========================================================
   Sub-components
========================================================= */

function DetailHeader({ icon: Icon, tone, title, badges, meta, actions }) {
  return (
    <div className="inos-card__header" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
        <span className={`inos-icon-tile inos-icon-tile--lg${tone ? ` inos-icon-tile--${tone}` : ""}`}>
          <Icon aria-hidden />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 className="inos-section-title" style={{ fontSize: 18 }}>
              {title}
            </h2>
            {badges}
          </div>
          {meta && <p className="inos-section-sub">{meta}</p>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{actions}</div>
    </div>
  );
}

function KV({ items }) {
  return (
    <div className="adm-kv">
      {items.map((item) => {
        const empty = item.value == null || item.value === "";
        return (
          <div key={item.label} className="adm-kv__item">
            <div className="adm-kv__label">{item.label}</div>
            <div className={`adm-kv__value${empty ? " is-empty" : ""}`}>{empty ? "Not set" : item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function ComingSoon({ items }) {
  return (
    <div className="adm-soon">
      <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--lilac">
        <Settings2 aria-hidden />
      </span>
      <div>
        <div className="adm-soon__title">Workflow configuration — coming soon</div>
        <div className="adm-soon__text">{items.join(", ")} will be configurable here as the project structure evolves.</div>
      </div>
    </div>
  );
}

function PhaseDetails({ phase, documents, onEdit, onDelete, onAddDocument, onSelectDocument }) {
  return (
    <section className="inos-card">
      <DetailHeader
        icon={FolderKanban}
        title={phaseLabel(phase)}
        badges={getCode(phase) && <span className="adm-code">{getCode(phase)}</span>}
        meta={`Phase ${phase.phase_number ?? ""}${phase.module ? ` · ${humanize(phase.module)}` : ""}`}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={onDelete} aria-label="Delete phase" title="Delete phase" />
          </>
        }
      />

      {getDescription(phase) && (
        <div className="adm-section">
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{getDescription(phase)}</p>
        </div>
      )}

      <div className="adm-section">
        <div className="adm-section__head">
          <div>
            <h3 className="adm-section__title">Document types</h3>
            <p className="adm-section__desc">What this phase is expected to produce.</p>
          </div>
          <Button variant="soft" size="sm" icon={Plus} onClick={onAddDocument}>
            Add document type
          </Button>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            icon={FilePlus2}
            title="No document types in this phase"
            text="Add the documents or drawings this phase should deliver, e.g. a site recce report."
          />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {documents.map((documentType) => (
              <button
                key={getId(documentType)}
                type="button"
                onClick={() => onSelectDocument(documentType)}
                className="adm-list__item"
                style={{ border: "1px solid var(--line)" }}
              >
                <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--info">
                  {documentType?.targetType === "DRAWING" ? <PenTool aria-hidden /> : <FileText aria-hidden />}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="adm-list__name" style={{ display: "block" }}>
                    {getName(documentType)}
                  </span>
                  <span className="adm-list__sub" style={{ display: "block" }}>
                    {getCode(documentType) || "No code"}
                  </span>
                </span>
                <StatusBadge active={getActive(documentType)} />
                <ChevronRight size={16} style={{ color: "var(--text-3)" }} aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adm-section">
        <KV
          items={[
            { label: "Code", value: getCode(phase) },
            { label: "Order", value: phase.phase_number },
            { label: "Documents", value: documents.length },
          ]}
        />
        <ComingSoon items={["Requirements", "deliverables", "approvals", "gates", "checklists", "automations"]} />
      </div>
    </section>
  );
}

function DocumentDetails({ documentType, phase, onEdit, onMove, onDuplicate, onToggle, onDelete, onBack }) {
  const active = getActive(documentType);
  return (
    <section className="inos-card">
      <DetailHeader
        icon={documentType?.targetType === "DRAWING" ? PenTool : FileText}
        tone="info"
        title={getName(documentType)}
        badges={<StatusBadge active={active} />}
        meta={
          <>
            {phase ? (
              <button type="button" className="adm-link-btn" onClick={onBack} style={{ fontSize: 13 }}>
                {phaseLabel(phase)}
              </button>
            ) : (
              "No phase"
            )}
            {getCode(documentType) && <> · {getCode(documentType)}</>}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
            <RowMenu
              label="More actions"
              items={[
                { label: "Move to phase", icon: Move, onClick: onMove },
                { label: "Duplicate", icon: Copy, onClick: onDuplicate },
                { label: active ? "Deactivate" : "Activate", icon: active ? XCircle : CheckCircle2, onClick: onToggle },
                "sep",
                { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
              ]}
            />
          </>
        }
      />

      {getDescription(documentType) && (
        <div className="adm-section">
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{getDescription(documentType)}</p>
        </div>
      )}

      <div className="adm-section">
        <KV
          items={[
            { label: "Kind", value: documentType?.targetType ? humanize(documentType.targetType) : "" },
            { label: "Phase", value: phase ? phaseLabel(phase) : "" },
            { label: "Phase code", value: documentType?.phaseCode || getCode(phase) },
            { label: "Status", value: active ? "Active" : "Inactive" },
          ]}
        />
        <ComingSoon items={["Requirements", "approvals", "templates", "deliverables", "checklists"]} />
      </div>
    </section>
  );
}

function WelcomePanel({ phases, documents, onAddPhase, onAddDocument }) {
  return (
    <Card>
      <EmptyState
        icon={Layers3}
        title="Select a phase or document"
        text={`Pick anything in the tree to see its details. You have ${plural(phases.length, "phase")} and ${plural(
          documents.length,
          "document type",
        )} so far.`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="soft" icon={FilePlus2} onClick={onAddDocument} disabled={!phases.length}>
              Add document type
            </Button>
            <Button variant="ghost" icon={FolderPlus} onClick={onAddPhase}>
              Add phase
            </Button>
          </div>
        }
      />
    </Card>
  );
}

function StatusBadge({ active }) {
  return (
    <Pill tone={active ? "ok" : "mute"} size="sm">
      {active ? "Active" : "Inactive"}
    </Pill>
  );
}

function PhaseForm({ form, setForm, errors = {} }) {
  return (
    <div className="inos-form-grid">
      <Field label="Phase name" required full error={errors.name} htmlFor="psf-name">
        <TextInput
          id="psf-name"
          autoFocus
          value={form.name}
          invalid={!!errors.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Design development"
        />
      </Field>
      <Field label="Code" required={!form.name} full error={errors.code} htmlFor="psf-code" hint="Leave blank to generate from the name.">
        <TextInput
          id="psf-code"
          value={form.code}
          invalid={!!errors.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder={toCode(form.name) || "e.g. 05_DESIGN"}
          className="adm-upper"
        />
      </Field>
      <Field label="Description" optional full htmlFor="psf-desc">
        <TextArea
          id="psf-desc"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="What happens in this phase and what it delivers."
          rows={3}
        />
      </Field>
    </div>
  );
}

function DocumentForm({ form, setForm, phases, errors = {} }) {
  return (
    <div className="inos-form-grid">
      <Field label="Name" required full error={errors.name} htmlFor="dsf-name">
        <TextInput
          id="dsf-name"
          autoFocus
          value={form.name}
          invalid={!!errors.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Concept design presentation"
        />
      </Field>

      <Field label="Project phase" required error={errors.projectPhaseId} htmlFor="dsf-phase">
        <SelectInput
          id="dsf-phase"
          value={form.projectPhaseId || ""}
          invalid={!!errors.projectPhaseId}
          onChange={(e) => {
            const value = e.target.value;
            const phase = phases.find((item) => getId(item) === value);
            setForm((prev) => ({ ...prev, projectPhaseId: value, phaseCode: getCode(phase) }));
          }}
          placeholder="Choose a phase"
        >
          {phases.map((phase) => (
            <option key={getId(phase)} value={getId(phase)}>
              {getName(phase)}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Code" error={errors.code} htmlFor="dsf-code" hint="Leave blank to generate from the name.">
        <TextInput
          id="dsf-code"
          value={form.code}
          invalid={!!errors.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder={toCode(form.name) || "e.g. CONCEPT_DESIGN"}
          className="adm-upper"
        />
      </Field>

      <Field label="Kind" full>
        <ChoiceGroup
          name="Kind"
          value={form.targetType || "DOCUMENT"}
          onChange={(v) => setForm((prev) => ({ ...prev, targetType: v }))}
          options={[
            { value: "DOCUMENT", label: "Document", icon: FileText },
            { value: "DRAWING", label: "Drawing", icon: PenTool },
          ]}
        />
      </Field>

      <Field label="Description" optional full htmlFor="dsf-desc">
        <TextArea
          id="dsf-desc"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="What this document contains and who prepares it."
          rows={3}
        />
      </Field>

      <div className="span-full">
        <ToggleRow
          label="Active"
          hint="Inactive document types stay on record but aren't used for new workflows."
          checked={form.isActive}
          onChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
        />
      </div>
    </div>
  );
}
