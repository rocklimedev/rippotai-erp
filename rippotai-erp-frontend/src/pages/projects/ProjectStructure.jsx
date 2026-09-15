import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Move,
  Copy,
  Settings2,
  Layers3,
  X,
  Save,
  AlertTriangle,
  ArrowRight,
  FilePlus2,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";

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
  item?.code || item?.phaseCode || item?.documentCode || "";

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
  /* -------------------------------------------------------
     Queries
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Mutations
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Data
  ------------------------------------------------------- */

  const phases = useMemo(
    () => normalizeArray(phasesResponse),
    [phasesResponse],
  );

  const documentTypes = useMemo(
    () => normalizeArray(documentTypesResponse),
    [documentTypesResponse],
  );

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */

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

  const [actionMenu, setActionMenu] = useState(null);

  /* -------------------------------------------------------
     Selected items
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Phase -> Documents
  ------------------------------------------------------- */

  const documentsByPhase = useMemo(() => {
    const grouped = {};

    phases.forEach((phase) => {
      grouped[getId(phase)] = [];
    });

    documentTypes.forEach((documentType) => {
      const phaseId = getPhaseIdFromDocument(documentType);

      if (!grouped[phaseId]) {
        grouped[phaseId] = [];
      }

      grouped[phaseId].push(documentType);
    });

    return grouped;
  }, [phases, documentTypes]);

  /* -------------------------------------------------------
     Search
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Refresh
  ------------------------------------------------------- */

  const handleRefresh = async () => {
    await Promise.all([refetchPhases(), refetchDocumentTypes()]);

    toast.success("Project structure refreshed");
  };

  /* -------------------------------------------------------
     Expand / collapse
  ------------------------------------------------------- */

  const togglePhase = (phaseId) => {
    setExpandedPhases((previous) => ({
      ...previous,
      [phaseId]: !previous[phaseId],
    }));
  };

  /* -------------------------------------------------------
     Select phase
  ------------------------------------------------------- */

  const handleSelectPhase = (phase) => {
    const id = getId(phase);

    setSelectedPhaseId(id);
    setSelectedDocumentId(null);

    if (!expandedPhases[id]) {
      setExpandedPhases((previous) => ({
        ...previous,
        [id]: true,
      }));
    }

    setActionMenu(null);
  };

  /* -------------------------------------------------------
     Select document
  ------------------------------------------------------- */

  const handleSelectDocument = (documentType) => {
    setSelectedDocumentId(getId(documentType));
    setSelectedPhaseId(getPhaseIdFromDocument(documentType));
    setActionMenu(null);
  };

  /* =======================================================
     PHASE MODAL
  ======================================================= */

  const openCreatePhase = () => {
    setPhaseForm({
      name: "",
      code: "",
      description: "",
    });

    setModal("create-phase");
  };

  const openEditPhase = (phase) => {
    setPhaseForm({
      name: phase?.name || "",
      code: phase?.code || "",
      description: phase?.description || "",
    });

    setSelectedPhaseId(getId(phase));
    setModal("edit-phase");
    setActionMenu(null);
  };

  const submitPhase = async (event) => {
    event.preventDefault();

    if (!phaseForm.name.trim()) {
      toast.error("Phase name is required");
      return;
    }

    try {
      if (modal === "create-phase") {
        const response = await createProjectPhase({
          name: phaseForm.name.trim(),
          code: phaseForm.code.trim() || undefined,
          description: phaseForm.description.trim() || undefined,
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
          data: {
            name: phaseForm.name.trim(),
            code: phaseForm.code.trim() || undefined,
            description: phaseForm.description.trim() || undefined,
          },
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
      phaseCode: selectedPhaseForDocument?.code || "",
      targetType: "",
      isActive: true,
    });

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

    setSelectedDocumentId(getId(documentType));
    setSelectedPhaseId(getPhaseIdFromDocument(documentType));

    setModal("edit-document");
    setActionMenu(null);
  };

  const submitDocument = async (event) => {
    event.preventDefault();

    if (!documentForm.name.trim()) {
      toast.error("Document type name is required");
      return;
    }

    if (!documentForm.projectPhaseId) {
      toast.error("Please select a project phase");
      return;
    }

    try {
      const payload = {
        name: documentForm.name.trim(),
        code: documentForm.code.trim() || undefined,
        description: documentForm.description.trim() || undefined,
        projectPhaseId: documentForm.projectPhaseId,
        phaseCode: documentForm.phaseCode || undefined,
        targetType: documentForm.targetType || undefined,
        isActive: documentForm.isActive,
      };

      if (modal === "create-document") {
        const response = await createDocumentType(payload).unwrap();

        const createdDocument =
          response?.data || response?.item || response?.result || response;

        const createdId = getId(createdDocument);

        if (createdId) {
          setSelectedDocumentId(createdId);
        }

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
     MOVE DOCUMENT
  ======================================================= */

  const openMoveDocument = (documentType) => {
    setSelectedDocumentId(getId(documentType));

    setDocumentForm({
      ...documentForm,
      projectPhaseId: getPhaseIdFromDocument(documentType) || "",
    });

    setModal("move-document");
    setActionMenu(null);
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
          phaseCode: destinationPhase?.code || undefined,
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

  /* =======================================================
     DUPLICATE DOCUMENT
  ======================================================= */

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

    setActionMenu(null);
  };

  /* =======================================================
     TOGGLE DOCUMENT
  ======================================================= */

  const toggleDocumentStatus = async (documentType) => {
    const id = getId(documentType);

    if (!id) return;

    try {
      await updateDocumentType({
        id,
        data: {
          isActive: !getActive(documentType),
        },
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

    setActionMenu(null);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const requestDeletePhase = (phase) => {
    setDeleteTarget({
      type: "phase",
      item: phase,
    });

    setActionMenu(null);
  };

  const requestDeleteDocument = (documentType) => {
    setDeleteTarget({
      type: "document",
      item: documentType,
    });

    setActionMenu(null);
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

        if (selectedDocumentId === id) {
          setSelectedDocumentId(null);
        }

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

  /* =======================================================
     Loading
  ======================================================= */

  const isLoading = phasesLoading || documentTypesLoading;

  const isRefreshing = phasesFetching || documentTypesFetching;

  const isSaving =
    creatingPhase ||
    updatingPhase ||
    creatingDocumentType ||
    updatingDocumentType;

  /* =======================================================
     Stats
  ======================================================= */

  const activeDocuments = documentTypes.filter(getActive).length;

  const inactiveDocuments = documentTypes.length - activeDocuments;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="min-h-screen bg-[#F7F8F6]"
      onClick={() => setActionMenu(null)}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-[#D8E0DA] bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F453B] text-white shadow-sm">
                  <Layers3 size={22} />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-[#1F453B]">
                    Project Structure
                  </h1>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Manage project phases, document types and workflow structure
                    from one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRefresh();
                }}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8E0DA] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#F7F8F6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openCreatePhase();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16372F]"
              >
                <FolderPlus size={16} />
                Add Phase
              </button>
            </div>
          </div>

          {/* Stats */}

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<FolderKanban size={18} />}
              label="Phases"
              value={phases.length}
            />

            <StatCard
              icon={<FileText size={18} />}
              label="Document Types"
              value={documentTypes.length}
            />

            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Active Documents"
              value={activeDocuments}
            />

            <StatCard
              icon={<XCircle size={18} />}
              label="Inactive Documents"
              value={inactiveDocuments}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="border-b border-[#D8E0DA] bg-white px-6 py-3">
        <div className="relative max-w-xl">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search phases or document types..."
            className="w-full rounded-lg border border-[#D8E0DA] bg-[#F7F8F6] py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#1F453B] focus:bg-white focus:ring-2 focus:ring-[#1F453B]/10"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="p-6">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-xl border border-[#D8E0DA] bg-white shadow-sm xl:grid-cols-[360px_minmax(0,1fr)_330px]">
            {/* =================================================
                LEFT TREE
            ================================================= */}

            <div className="border-b border-[#D8E0DA] xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between border-b border-[#D8E0DA] px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1F453B]">
                    Project Tree
                  </h2>

                  <p className="text-xs text-gray-500">
                    Phases & document types
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openCreatePhase();
                  }}
                  className="rounded-lg p-2 text-[#1F453B] transition hover:bg-[#D8E0DA]/40"
                  title="Add phase"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="max-h-[650px] overflow-y-auto p-2">
                {filteredPhases.length === 0 ? (
                  <EmptyTree search={search} onAddPhase={openCreatePhase} />
                ) : (
                  filteredPhases.map((phase) => {
                    const phaseId = getId(phase);
                    const phaseDocuments = documentsByPhase[phaseId] || [];

                    const isExpanded = expandedPhases[phaseId] || !!search;

                    const isSelected =
                      selectedPhaseId === phaseId && !selectedDocumentId;

                    return (
                      <div key={phaseId} className="mb-1">
                        {/* Phase */}

                        <div
                          className={`group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
                            isSelected
                              ? "border-[#1F453B]/20 bg-[#D8E0DA]/50"
                              : "border-transparent hover:bg-[#F7F8F6]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePhase(phaseId);
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#1F453B]"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectPhase(phase);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1F453B]/10 text-[#1F453B]">
                              <FolderKanban size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-gray-800">
                                {getName(phase)}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                {getCode(phase) && (
                                  <span>{getCode(phase)}</span>
                                )}

                                <span>
                                  {phaseDocuments.length} document
                                  {phaseDocuments.length === 1 ? "" : "s"}
                                </span>
                              </div>
                            </div>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                setActionMenu((previous) =>
                                  previous?.type === "phase" &&
                                  previous?.id === phaseId
                                    ? null
                                    : {
                                        type: "phase",
                                        id: phaseId,
                                      },
                                );
                              }}
                              className="rounded-md p-1.5 text-gray-400 opacity-0 transition hover:bg-white hover:text-gray-700 group-hover:opacity-100"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {actionMenu?.type === "phase" &&
                              actionMenu?.id === phaseId && (
                                <PhaseActionMenu
                                  phase={phase}
                                  onEdit={() => openEditPhase(phase)}
                                  onAddDocument={() =>
                                    openCreateDocument(phase)
                                  }
                                  onDelete={() => requestDeletePhase(phase)}
                                />
                              )}
                          </div>
                        </div>

                        {/* Documents */}

                        {isExpanded && (
                          <div className="ml-6 border-l border-[#D8E0DA] pl-2">
                            {phaseDocuments.length === 0 ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCreateDocument(phase);
                                }}
                                className="my-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-400 transition hover:bg-[#F7F8F6] hover:text-[#1F453B]"
                              >
                                <FilePlus2 size={14} />
                                Add document type
                              </button>
                            ) : (
                              phaseDocuments.map((documentType) => {
                                const documentId = getId(documentType);

                                const documentSelected =
                                  selectedDocumentId === documentId;

                                return (
                                  <div
                                    key={documentId}
                                    className={`group relative mb-1 flex items-center gap-2 rounded-lg border px-2 py-2 transition ${
                                      documentSelected
                                        ? "border-[#C6A15B]/40 bg-[#C6A15B]/10"
                                        : "border-transparent hover:bg-[#F7F8F6]"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleSelectDocument(documentType);
                                      }}
                                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                      <FileText
                                        size={15}
                                        className={
                                          documentSelected
                                            ? "text-[#C6A15B]"
                                            : "text-gray-400"
                                        }
                                      />

                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-gray-700">
                                          {getName(documentType)}
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                          {getCode(documentType) && (
                                            <span>{getCode(documentType)}</span>
                                          )}

                                          {!getActive(documentType) && (
                                            <span className="text-red-500">
                                              Inactive
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </button>

                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          setActionMenu((previous) =>
                                            previous?.type === "document" &&
                                            previous?.id === documentId
                                              ? null
                                              : {
                                                  type: "document",
                                                  id: documentId,
                                                },
                                          );
                                        }}
                                        className="rounded-md p-1.5 text-gray-400 opacity-0 transition hover:bg-white hover:text-gray-700 group-hover:opacity-100"
                                      >
                                        <MoreVertical size={15} />
                                      </button>

                                      {actionMenu?.type === "document" &&
                                        actionMenu?.id === documentId && (
                                          <DocumentActionMenu
                                            documentType={documentType}
                                            onEdit={() =>
                                              openEditDocument(documentType)
                                            }
                                            onMove={() =>
                                              openMoveDocument(documentType)
                                            }
                                            onDuplicate={() =>
                                              duplicateDocument(documentType)
                                            }
                                            onToggle={() =>
                                              toggleDocumentStatus(documentType)
                                            }
                                            onDelete={() =>
                                              requestDeleteDocument(
                                                documentType,
                                              )
                                            }
                                          />
                                        )}
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            {phaseDocuments.length > 0 && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCreateDocument(phase);
                                }}
                                className="my-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#1F453B] transition hover:bg-[#D8E0DA]/40"
                              >
                                <Plus size={14} />
                                Add document type
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* =================================================
                CENTER
            ================================================= */}

            <div className="min-w-0 border-b border-[#D8E0DA] xl:border-b-0 xl:border-r">
              {selectedDocument ? (
                <DocumentDetails
                  documentType={selectedDocument}
                  phase={
                    phases.find(
                      (phase) =>
                        getId(phase) ===
                        getPhaseIdFromDocument(selectedDocument),
                    ) || null
                  }
                  onEdit={() => openEditDocument(selectedDocument)}
                  onMove={() => openMoveDocument(selectedDocument)}
                  onDuplicate={() => duplicateDocument(selectedDocument)}
                  onToggle={() => toggleDocumentStatus(selectedDocument)}
                  onDelete={() => requestDeleteDocument(selectedDocument)}
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

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="min-w-0">
              {selectedDocument ? (
                <DocumentConfiguration
                  documentType={selectedDocument}
                  phase={
                    phases.find(
                      (phase) =>
                        getId(phase) ===
                        getPhaseIdFromDocument(selectedDocument),
                    ) || null
                  }
                  onEdit={() => openEditDocument(selectedDocument)}
                />
              ) : selectedPhase ? (
                <PhaseConfiguration
                  phase={selectedPhase}
                  documents={documentsByPhase[selectedPhaseId] || []}
                  onEdit={() => openEditPhase(selectedPhase)}
                />
              ) : (
                <StructureInfo />
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          MODALS
      ===================================================== */}

      {modal === "create-phase" && (
        <Modal
          title="Create Project Phase"
          description="Create a new phase in the project workflow."
          onClose={() => setModal(null)}
        >
          <PhaseForm
            form={phaseForm}
            setForm={setPhaseForm}
            onSubmit={submitPhase}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel="Create Phase"
          />
        </Modal>
      )}

      {modal === "edit-phase" && (
        <Modal
          title="Edit Project Phase"
          description="Update the selected project phase."
          onClose={() => setModal(null)}
        >
          <PhaseForm
            form={phaseForm}
            setForm={setPhaseForm}
            onSubmit={submitPhase}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal === "create-document" && (
        <Modal
          title="Create Document Type"
          description="Add a document type under a project phase."
          onClose={() => setModal(null)}
          wide
        >
          <DocumentForm
            form={documentForm}
            setForm={setDocumentForm}
            phases={phases}
            onSubmit={submitDocument}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel="Create Document Type"
          />
        </Modal>
      )}

      {modal === "edit-document" && (
        <Modal
          title="Edit Document Type"
          description="Update document type configuration."
          onClose={() => setModal(null)}
          wide
        >
          <DocumentForm
            form={documentForm}
            setForm={setDocumentForm}
            phases={phases}
            onSubmit={submitDocument}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal === "move-document" && (
        <Modal
          title="Move Document Type"
          description="Move this document type to another project phase."
          onClose={() => setModal(null)}
        >
          <form onSubmit={submitMoveDocument}>
            <div className="space-y-4">
              <div className="rounded-lg border border-[#D8E0DA] bg-[#F7F8F6] p-3">
                <div className="text-xs font-medium text-gray-500">
                  Document
                </div>

                <div className="mt-1 font-semibold text-gray-800">
                  {selectedDocument ? getName(selectedDocument) : "Document"}
                </div>
              </div>

              <SelectField
                label="Destination Phase"
                required
                value={documentForm.projectPhaseId}
                onChange={(event) =>
                  setDocumentForm((previous) => ({
                    ...previous,
                    projectPhaseId: event.target.value,
                  }))
                }
              >
                <option value="">Select phase</option>

                {phases.map((phase) => (
                  <option key={getId(phase)} value={getId(phase)}>
                    {getName(phase)}
                    {getCode(phase) ? ` (${getCode(phase)})` : ""}
                  </option>
                ))}
              </SelectField>
            </div>

            <ModalFooter
              onCancel={() => setModal(null)}
              loading={updatingDocumentType}
              submitLabel="Move Document"
            />
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          loading={deletingPhase || deletingDocumentType}
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#D8E0DA] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8E0DA]/60 text-[#1F453B]">
          {icon}
        </div>

        <div>
          <div className="text-lg font-bold text-[#1F453B]">{value}</div>

          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PHASE ACTION MENU
========================================================= */

function PhaseActionMenu({ phase, onEdit, onAddDocument, onDelete }) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-xl border border-[#D8E0DA] bg-white p-1.5 shadow-xl"
    >
      <ActionMenuButton
        icon={<FilePlus2 size={15} />}
        label="Add Document Type"
        onClick={onAddDocument}
      />

      <ActionMenuButton
        icon={<Pencil size={15} />}
        label="Edit Phase"
        onClick={onEdit}
      />

      <div className="my-1 border-t border-[#D8E0DA]" />

      <ActionMenuButton
        danger
        icon={<Trash2 size={15} />}
        label="Delete Phase"
        onClick={onDelete}
      />
    </div>
  );
}

/* =========================================================
   DOCUMENT ACTION MENU
========================================================= */

function DocumentActionMenu({
  documentType,
  onEdit,
  onMove,
  onDuplicate,
  onToggle,
  onDelete,
}) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="absolute right-0 top-7 z-30 w-48 overflow-hidden rounded-xl border border-[#D8E0DA] bg-white p-1.5 shadow-xl"
    >
      <ActionMenuButton
        icon={<Pencil size={15} />}
        label="Edit"
        onClick={onEdit}
      />

      <ActionMenuButton
        icon={<Move size={15} />}
        label="Move to Phase"
        onClick={onMove}
      />

      <ActionMenuButton
        icon={<Copy size={15} />}
        label="Duplicate"
        onClick={onDuplicate}
      />

      <ActionMenuButton
        icon={
          getActive(documentType) ? (
            <XCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )
        }
        label={getActive(documentType) ? "Deactivate" : "Activate"}
        onClick={onToggle}
      />

      <div className="my-1 border-t border-[#D8E0DA]" />

      <ActionMenuButton
        danger
        icon={<Trash2 size={15} />}
        label="Delete"
        onClick={onDelete}
      />
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionMenuButton({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* =========================================================
   PHASE DETAILS
========================================================= */

function PhaseDetails({
  phase,
  documents,
  onEdit,
  onDelete,
  onAddDocument,
  onSelectDocument,
}) {
  return (
    <div className="h-full">
      <div className="border-b border-[#D8E0DA] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F453B]/10 text-[#1F453B]">
              <FolderKanban size={23} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {getName(phase)}
                </h2>

                {getCode(phase) && (
                  <span className="rounded-md bg-[#D8E0DA] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1F453B]">
                    {getCode(phase)}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">Project phase</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-[#D8E0DA] p-2 text-gray-600 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
              title="Edit phase"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
              title="Delete phase"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {getDescription(phase) && (
          <div className="mt-5 rounded-xl border border-[#D8E0DA] bg-[#F7F8F6] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Description
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {getDescription(phase)}
            </p>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Document Types</h3>

            <p className="mt-1 text-xs text-gray-500">
              Documents belonging to this phase.
            </p>
          </div>

          <button
            type="button"
            onClick={onAddDocument}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16372F]"
          >
            <Plus size={14} />
            Add Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8E0DA] bg-[#F7F8F6] p-8 text-center">
            <FileText size={28} className="mx-auto text-gray-300" />

            <div className="mt-3 text-sm font-semibold text-gray-700">
              No document types
            </div>

            <p className="mt-1 text-xs text-gray-400">
              Add the first document type for this phase.
            </p>

            <button
              type="button"
              onClick={onAddDocument}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2 text-xs font-semibold text-[#1F453B] hover:bg-[#D8E0DA]/40"
            >
              <Plus size={14} />
              Add Document Type
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((documentType) => (
              <button
                key={getId(documentType)}
                type="button"
                onClick={() => onSelectDocument(documentType)}
                className="group flex w-full items-center gap-3 rounded-xl border border-[#D8E0DA] bg-white p-3 text-left transition hover:border-[#1F453B]/30 hover:bg-[#F7F8F6]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C6A15B]/10 text-[#C6A15B]">
                  <FileText size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800">
                    {getName(documentType)}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {getCode(documentType) && (
                      <span className="text-[11px] text-gray-400">
                        {getCode(documentType)}
                      </span>
                    )}

                    <StatusBadge active={getActive(documentType)} />
                  </div>
                </div>

                <ChevronRight
                  size={17}
                  className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F453B]"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT DETAILS
========================================================= */

function DocumentDetails({
  documentType,
  phase,
  onEdit,
  onMove,
  onDuplicate,
  onToggle,
  onDelete,
}) {
  return (
    <div className="h-full">
      <div className="border-b border-[#D8E0DA] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C6A15B]/10 text-[#C6A15B]">
              <FileText size={23} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {getName(documentType)}
                </h2>

                <StatusBadge active={getActive(documentType)} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {getCode(documentType) && (
                  <span>Code: {getCode(documentType)}</span>
                )}

                {phase && (
                  <>
                    <span>•</span>
                    <span>Phase: {getName(phase)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-[#D8E0DA] p-2 text-gray-600 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
              title="Edit"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={onMove}
              className="rounded-lg border border-[#D8E0DA] p-2 text-gray-600 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
              title="Move"
            >
              <Move size={16} />
            </button>

            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg border border-[#D8E0DA] p-2 text-gray-600 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg border border-[#D8E0DA] p-2 text-gray-600 hover:bg-[#F7F8F6] hover:text-[#1F453B]"
              title={getActive(documentType) ? "Deactivate" : "Activate"}
            >
              {getActive(documentType) ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {getDescription(documentType) && (
          <div className="mt-5 rounded-xl border border-[#D8E0DA] bg-[#F7F8F6] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Description
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {getDescription(documentType)}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <InfoCard
          label="Target Type"
          value={documentType?.targetType || "Not configured"}
        />

        <InfoCard
          label="Phase"
          value={phase ? getName(phase) : "Not assigned"}
        />

        <InfoCard
          label="Phase Code"
          value={documentType?.phaseCode || phase?.code || "Not configured"}
        />

        <InfoCard
          label="Status"
          value={getActive(documentType) ? "Active" : "Inactive"}
        />
      </div>

      <div className="mx-5 rounded-xl border border-[#D8E0DA] bg-white p-4">
        <div className="flex items-start gap-3">
          <Settings2 size={18} className="mt-0.5 text-[#1F453B]" />

          <div>
            <div className="text-sm font-semibold text-gray-800">
              Future Configuration
            </div>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Requirements, approvals, templates, deliverables, checklists and
              automations can be configured here as the project structure
              evolves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PHASE CONFIGURATION
========================================================= */

function PhaseConfiguration({ phase, documents, onEdit }) {
  return (
    <div>
      <div className="border-b border-[#D8E0DA] p-4">
        <div className="flex items-center gap-2">
          <Settings2 size={17} className="text-[#1F453B]" />

          <h3 className="font-bold text-gray-800">Phase Configuration</h3>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <ConfigSection
          title="Basic Information"
          items={[
            {
              label: "Name",
              value: getName(phase),
            },
            {
              label: "Code",
              value: getCode(phase) || "—",
            },
            {
              label: "Documents",
              value: String(documents.length),
            },
          ]}
        />

        <ConfigSection
          title="Workflow"
          items={[
            {
              label: "Requirements",
              value: "Not configured",
            },
            {
              label: "Deliverables",
              value: "Not configured",
            },
            {
              label: "Approvals",
              value: "Not configured",
            },
            {
              label: "Gates",
              value: "Not configured",
            },
          ]}
        />

        <ConfigSection
          title="Future Actions"
          items={[
            {
              label: "Checklists",
              value: "Available later",
            },
            {
              label: "Templates",
              value: "Available later",
            },
            {
              label: "Automations",
              value: "Available later",
            },
          ]}
        />

        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2.5 text-sm font-semibold text-[#1F453B] transition hover:bg-[#D8E0DA]/40"
        >
          <Pencil size={15} />
          Configure Phase
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT CONFIGURATION
========================================================= */

function DocumentConfiguration({ documentType, phase, onEdit }) {
  return (
    <div>
      <div className="border-b border-[#D8E0DA] p-4">
        <div className="flex items-center gap-2">
          <Settings2 size={17} className="text-[#1F453B]" />

          <h3 className="font-bold text-gray-800">Document Configuration</h3>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <ConfigSection
          title="Basic Information"
          items={[
            {
              label: "Name",
              value: getName(documentType),
            },
            {
              label: "Code",
              value: getCode(documentType) || "—",
            },
            {
              label: "Phase",
              value: phase ? getName(phase) : "Not assigned",
            },
            {
              label: "Status",
              value: getActive(documentType) ? "Active" : "Inactive",
            },
          ]}
        />

        <ConfigSection
          title="Workflow Configuration"
          items={[
            {
              label: "Requirements",
              value: "Not configured",
            },
            {
              label: "Approval",
              value: "Not configured",
            },
            {
              label: "Template",
              value: "Not configured",
            },
            {
              label: "Deliverables",
              value: "Not configured",
            },
          ]}
        />

        <ConfigSection
          title="Future Actions"
          items={[
            {
              label: "Checklist",
              value: "Available later",
            },
            {
              label: "Automation",
              value: "Available later",
            },
            {
              label: "Gate",
              value: "Available later",
            },
          ]}
        />

        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1F453B] px-3 py-2.5 text-sm font-semibold text-[#1F453B] transition hover:bg-[#D8E0DA]/40"
        >
          <Pencil size={15} />
          Edit Document Type
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CONFIG SECTION
========================================================= */

function ConfigSection({ title, items }) {
  return (
    <div className="rounded-xl border border-[#D8E0DA] bg-white">
      <div className="border-b border-[#D8E0DA] px-3 py-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {title}
        </h4>
      </div>

      <div className="divide-y divide-[#D8E0DA]">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <span className="text-xs text-gray-500">{item.label}</span>

            <span className="max-w-[160px] truncate text-right text-xs font-medium text-gray-700">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   WELCOME PANEL
========================================================= */

function WelcomePanel({ phases, documents, onAddPhase, onAddDocument }) {
  return (
    <div className="flex h-full min-h-[600px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8E0DA]/60 text-[#1F453B]">
          <Layers3 size={30} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[#1F453B]">
          Project Structure
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Manage the structure of your project workflow. Create phases and
          organize document types inside each phase.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <MiniStat
            icon={<FolderKanban size={17} />}
            value={phases.length}
            label="Phases"
          />

          <MiniStat
            icon={<FileText size={17} />}
            value={documents.length}
            label="Documents"
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onAddPhase}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16372F]"
          >
            <FolderPlus size={16} />
            Add Phase
          </button>

          <button
            type="button"
            onClick={onAddDocument}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1F453B] px-4 py-2.5 text-sm font-semibold text-[#1F453B] hover:bg-[#D8E0DA]/40"
          >
            <FilePlus2 size={16} />
            Add Document
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STRUCTURE INFO
========================================================= */

function StructureInfo() {
  return (
    <div>
      <div className="border-b border-[#D8E0DA] p-4">
        <div className="flex items-center gap-2">
          <Settings2 size={17} className="text-[#1F453B]" />

          <h3 className="font-bold text-gray-800">Structure</h3>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <InfoBlock
          icon={<FolderKanban size={17} />}
          title="Phases"
          description="Phases represent the major stages of your project workflow."
        />

        <InfoBlock
          icon={<FileText size={17} />}
          title="Document Types"
          description="Document types belong to phases and define the documents used during each stage."
        />

        <InfoBlock
          icon={<CheckCircle2 size={17} />}
          title="Future Configuration"
          description="Requirements, gates, approvals, checklists, deliverables and automations can be added to this structure."
        />
      </div>
    </div>
  );
}

/* =========================================================
   INFO BLOCK
========================================================= */

function InfoBlock({ icon, title, description }) {
  return (
    <div className="rounded-xl border border-[#D8E0DA] bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D8E0DA]/60 text-[#1F453B]">
          {icon}
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-800">{title}</div>

          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ icon, value, label }) {
  return (
    <div className="rounded-xl border border-[#D8E0DA] bg-white p-3">
      <div className="flex items-center gap-2">
        <div className="text-[#1F453B]">{icon}</div>

        <div>
          <div className="font-bold text-[#1F453B]">{value}</div>

          <div className="text-[11px] text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#D8E0DA] bg-white p-4">
      <div className="text-xs font-medium text-gray-400">{label}</div>

      <div className="mt-1 truncate text-sm font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   PHASE FORM
========================================================= */

function PhaseForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <TextField
          label="Phase Name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              name: event.target.value,
            }))
          }
          placeholder="e.g. Design"
        />

        <TextField
          label="Phase Code"
          value={form.code}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              code: event.target.value,
            }))
          }
          placeholder="e.g. DESIGN"
        />

        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          placeholder="Describe this project phase..."
        />
      </div>

      <ModalFooter
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}

/* =========================================================
   DOCUMENT FORM
========================================================= */

function DocumentForm({
  form,
  setForm,
  phases,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}) {
  const selectedPhase = phases.find(
    (phase) => getId(phase) === form.projectPhaseId,
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextField
            label="Document Type Name"
            required
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Concept Design"
          />
        </div>

        <TextField
          label="Document Code"
          value={form.code}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              code: event.target.value,
            }))
          }
          placeholder="e.g. CONCEPT_DESIGN"
        />

        <SelectField
          label="Project Phase"
          required
          value={form.projectPhaseId}
          onChange={(event) => {
            const phaseId = event.target.value;

            const phase = phases.find((item) => getId(item) === phaseId);

            setForm((previous) => ({
              ...previous,
              projectPhaseId: phaseId,
              phaseCode: phase?.code || "",
            }));
          }}
        >
          <option value="">Select phase</option>

          {phases.map((phase) => (
            <option key={getId(phase)} value={getId(phase)}>
              {getName(phase)}
              {getCode(phase) ? ` (${getCode(phase)})` : ""}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Target Type"
          value={form.targetType}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              targetType: event.target.value,
            }))
          }
          placeholder="e.g. PROJECT"
        />

        <TextField
          label="Phase Code"
          value={selectedPhase?.code || form.phaseCode || ""}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              phaseCode: event.target.value,
            }))
          }
          placeholder="e.g. DESIGN"
        />

        <div className="md:col-span-2">
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Describe this document type..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#D8E0DA] bg-[#F7F8F6] p-4">
            <div>
              <div className="text-sm font-semibold text-gray-800">
                Active Document Type
              </div>

              <div className="mt-1 text-xs text-gray-500">
                Inactive document types can remain in the system without being
                used for new workflows.
              </div>
            </div>

            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[#1F453B]"
            />
          </label>
        </div>
      </div>

      <ModalFooter
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}

/* =========================================================
   INPUTS
========================================================= */

function TextField({ label, required = false, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[#D8E0DA] bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </span>

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-lg border border-[#D8E0DA] bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
      />
    </label>
  );
}

function SelectField({ label, required = false, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-[#D8E0DA] bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
      >
        {children}
      </select>
    </label>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({ title, description, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${
          wide ? "max-w-2xl" : "max-w-lg"
        } overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-[#D8E0DA] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1F453B]">{title}</h2>

            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#F7F8F6] hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL FOOTER
========================================================= */

function ModalFooter({ onCancel, loading, submitLabel }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-[#D8E0DA] pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-[#D8E0DA] px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#F7F8F6] disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16372F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : (
          <Save size={15} />
        )}

        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

/* =========================================================
   DELETE MODAL
========================================================= */

function DeleteModal({ target, onCancel, onConfirm, loading }) {
  const isPhase = target?.type === "phase";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={21} />
          </div>

          <h2 className="mt-4 text-base font-bold text-gray-900">
            Delete {isPhase ? "Project Phase" : "Document Type"}?
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You are about to delete{" "}
            <strong className="text-gray-700">{getName(target?.item)}</strong>.
            This action may affect existing project configuration and cannot be
            easily reversed.
          </p>

          {isPhase && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700">
              Make sure this phase is not being used by active projects before
              deleting it.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E0DA] bg-[#F7F8F6] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#D8E0DA] bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <RefreshCw size={15} className="animate-spin" />}

            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY TREE
========================================================= */

function EmptyTree({ search, onAddPhase }) {
  return (
    <div className="px-4 py-12 text-center">
      <FolderKanban size={30} className="mx-auto text-gray-300" />

      <div className="mt-3 text-sm font-semibold text-gray-700">
        {search ? "No matching structure" : "No project phases"}
      </div>

      <p className="mt-1 text-xs leading-5 text-gray-400">
        {search
          ? "Try another search term."
          : "Create your first project phase to start building the tree."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onAddPhase}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16372F]"
        >
          <Plus size={14} />
          Add Phase
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-xl border border-[#D8E0DA] bg-white shadow-sm xl:grid-cols-[360px_minmax(0,1fr)_330px]">
      <div className="animate-pulse border-b border-[#D8E0DA] p-4 xl:border-b-0 xl:border-r">
        <div className="h-5 w-32 rounded bg-gray-200" />

        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="animate-pulse border-b border-[#D8E0DA] p-6 xl:border-b-0 xl:border-r">
        <div className="h-7 w-52 rounded bg-gray-200" />

        <div className="mt-4 h-24 rounded-xl bg-gray-100" />

        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="animate-pulse p-5">
        <div className="h-5 w-44 rounded bg-gray-200" />

        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
