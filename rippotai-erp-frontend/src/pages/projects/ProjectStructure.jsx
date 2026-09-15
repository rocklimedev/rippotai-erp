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
  FilePlus2,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  return (
    <div className="min-h-screen bg-muted/40">
      {/* HEADER */}
      <div className="border-b bg-background">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Project Structure
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Manage project phases, document types and workflow structure
                  from one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button onClick={openCreatePhase}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Phase
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<FolderKanban className="h-4 w-4" />}
              label="Phases"
              value={phases.length}
            />
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              label="Document Types"
              value={documentTypes.length}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Active Documents"
              value={activeDocuments}
            />
            <StatCard
              icon={<XCircle className="h-4 w-4" />}
              label="Inactive Documents"
              value={inactiveDocuments}
            />
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="border-b bg-background px-6 py-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phases or document types..."
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="p-6">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-xl border bg-background shadow-sm xl:grid-cols-[360px_minmax(0,1fr)_330px]">
            {/* LEFT TREE */}
            <div className="border-b xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Project Tree
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Phases & document types
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openCreatePhase}
                  title="Add phase"
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
                        <div
                          className={`group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
                            isSelected
                              ? "border-primary/20 bg-muted"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => togglePhase(phaseId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleSelectPhase(phase)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FolderKanban className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold">
                                {getName(phase)}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => openCreateDocument(phase)}
                              >
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                Add Document Type
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditPhase(phase)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Phase
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => requestDeletePhase(phase)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Phase
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {isExpanded && (
                          <div className="ml-6 border-l pl-2">
                            {phaseDocuments.length === 0 ? (
                              <Button
                                variant="ghost"
                                className="my-1 h-auto w-full justify-start gap-2 px-3 py-2 text-xs text-muted-foreground"
                                onClick={() => openCreateDocument(phase)}
                              >
                                <FilePlus2 className="h-3.5 w-3.5" />
                                Add document type
                              </Button>
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
                                        ? "border-amber-500/40 bg-amber-500/10"
                                        : "border-transparent hover:bg-muted/50"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSelectDocument(documentType)
                                      }
                                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                      <FileText
                                        className={`h-4 w-4 ${
                                          documentSelected
                                            ? "text-amber-600"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">
                                          {getName(documentType)}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                          {getCode(documentType) && (
                                            <span>{getCode(documentType)}</span>
                                          )}
                                          {!getActive(documentType) && (
                                            <span className="text-destructive">
                                              Inactive
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                        >
                                          <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                      >
                                        <DropdownMenuItem
                                          onClick={() =>
                                            openEditDocument(documentType)
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            openMoveDocument(documentType)
                                          }
                                        >
                                          <Move className="mr-2 h-4 w-4" />
                                          Move to Phase
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            duplicateDocument(documentType)
                                          }
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            toggleDocumentStatus(documentType)
                                          }
                                        >
                                          {getActive(documentType) ? (
                                            <XCircle className="mr-2 h-4 w-4" />
                                          ) : (
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                          )}
                                          {getActive(documentType)
                                            ? "Deactivate"
                                            : "Activate"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() =>
                                            requestDeleteDocument(documentType)
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                );
                              })
                            )}

                            {phaseDocuments.length > 0 && (
                              <Button
                                variant="ghost"
                                className="my-1 h-auto w-full justify-start gap-2 px-3 py-2 text-xs font-medium"
                                onClick={() => openCreateDocument(phase)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add document type
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CENTER */}
            <div className="min-w-0 border-b xl:border-b-0 xl:border-r">
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

            {/* RIGHT */}
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

      {/* MODALS */}
      <Dialog
        open={modal === "create-phase" || modal === "edit-phase"}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal === "create-phase"
                ? "Create Project Phase"
                : "Edit Project Phase"}
            </DialogTitle>
            <DialogDescription>
              {modal === "create-phase"
                ? "Create a new phase in the project workflow."
                : "Update the selected project phase."}
            </DialogDescription>
          </DialogHeader>
          <PhaseForm
            form={phaseForm}
            setForm={setPhaseForm}
            onSubmit={submitPhase}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel={
              modal === "create-phase" ? "Create Phase" : "Save Changes"
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "create-document" || modal === "edit-document"}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modal === "create-document"
                ? "Create Document Type"
                : "Edit Document Type"}
            </DialogTitle>
            <DialogDescription>
              {modal === "create-document"
                ? "Add a document type under a project phase."
                : "Update document type configuration."}
            </DialogDescription>
          </DialogHeader>
          <DocumentForm
            form={documentForm}
            setForm={setDocumentForm}
            phases={phases}
            onSubmit={submitDocument}
            onCancel={() => setModal(null)}
            loading={isSaving}
            submitLabel={
              modal === "create-document"
                ? "Create Document Type"
                : "Save Changes"
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "move-document"}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Document Type</DialogTitle>
            <DialogDescription>
              Move this document type to another project phase.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitMoveDocument}>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Document
                </div>
                <div className="mt-1 font-semibold">
                  {selectedDocument ? getName(selectedDocument) : "Document"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Destination Phase <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={documentForm.projectPhaseId || ""}
                  onValueChange={(value) =>
                    setDocumentForm((prev) => ({
                      ...prev,
                      projectPhaseId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={getId(phase)} value={getId(phase)}>
                        {getName(phase)}
                        {getCode(phase) ? ` (${getCode(phase)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
                disabled={updatingDocumentType}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingDocumentType}>
                {updatingDocumentType ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Move className="mr-2 h-4 w-4" />
                )}
                {updatingDocumentType ? "Moving..." : "Move Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>
              Delete{" "}
              {deleteTarget?.type === "phase"
                ? "Project Phase"
                : "Document Type"}
              ?
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to delete{" "}
              <strong className="text-foreground">
                {getName(deleteTarget?.item)}
              </strong>
              . This action may affect existing project configuration and cannot
              be easily reversed.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.type === "phase" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Make sure this phase is not being used by active projects before
              deleting it.
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deletingPhase || deletingDocumentType}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingPhase || deletingDocumentType}
            >
              {(deletingPhase || deletingDocumentType) && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deletingPhase || deletingDocumentType ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================
   Sub-components (converted)
========================================================= */

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{getName(phase)}</h2>
                {getCode(phase) && (
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {getCode(phase)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Project phase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {getDescription(phase) && (
          <div className="mt-5 rounded-xl border bg-muted/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {getDescription(phase)}
            </p>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold">Document Types</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Documents belonging to this phase.
            </p>
          </div>
          <Button size="sm" onClick={onAddDocument}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Document
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <FileText className="mx-auto h-7 w-7 text-muted-foreground" />
            <div className="mt-3 text-sm font-semibold">No document types</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Add the first document type for this phase.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onAddDocument}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Document Type
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((documentType) => (
              <button
                key={getId(documentType)}
                type="button"
                onClick={() => onSelectDocument(documentType)}
                className="group flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left transition hover:border-primary/30 hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{getName(documentType)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {getCode(documentType) && (
                      <span className="text-[11px] text-muted-foreground">
                        {getCode(documentType)}
                      </span>
                    )}
                    <StatusBadge active={getActive(documentType)} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{getName(documentType)}</h2>
                <StatusBadge active={getActive(documentType)} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            <Button variant="outline" size="icon" onClick={onEdit} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onMove} title="Move">
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDuplicate}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggle}
              title={getActive(documentType) ? "Deactivate" : "Activate"}
            >
              {getActive(documentType) ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {getDescription(documentType) && (
          <div className="mt-5 rounded-xl border bg-muted/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
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

      <div className="mx-5 rounded-xl border p-4">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-semibold">Future Configuration</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
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

function PhaseConfiguration({ phase, documents, onEdit }) {
  return (
    <div>
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Phase Configuration</h3>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <ConfigSection
          title="Basic Information"
          items={[
            { label: "Name", value: getName(phase) },
            { label: "Code", value: getCode(phase) || "—" },
            { label: "Documents", value: documents.length },
          ]}
        />
        <ConfigSection
          title="Workflow"
          items={[
            { label: "Requirements", value: "Not configured" },
            { label: "Deliverables", value: "Not configured" },
            { label: "Approvals", value: "Not configured" },
            { label: "Gates", value: "Not configured" },
          ]}
        />
        <ConfigSection
          title="Future Actions"
          items={[
            { label: "Checklists", value: "Available later" },
            { label: "Templates", value: "Available later" },
            { label: "Automations", value: "Available later" },
          ]}
        />
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Configure Phase
        </Button>
      </div>
    </div>
  );
}

function DocumentConfiguration({ documentType, phase, onEdit }) {
  return (
    <div>
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Document Configuration</h3>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <ConfigSection
          title="Basic Information"
          items={[
            { label: "Name", value: getName(documentType) },
            { label: "Code", value: getCode(documentType) || "—" },
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
            { label: "Requirements", value: "Not configured" },
            { label: "Approval", value: "Not configured" },
            { label: "Template", value: "Not configured" },
            { label: "Deliverables", value: "Not configured" },
          ]}
        />
        <ConfigSection
          title="Future Actions"
          items={[
            { label: "Checklist", value: "Available later" },
            { label: "Automation", value: "Available later" },
            { label: "Gate", value: "Available later" },
          ]}
        />
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Document Type
        </Button>
      </div>
    </div>
  );
}

function ConfigSection({ title, items }) {
  return (
    <div className="rounded-xl border">
      <div className="border-b px-3 py-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="max-w-[160px] truncate text-right text-xs font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WelcomePanel({ phases, documents, onAddPhase, onAddDocument }) {
  return (
    <div className="flex h-full min-h-[600px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-primary">
          <Layers3 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-bold">Project Structure</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Manage the structure of your project workflow. Create phases and
          organize document types inside each phase.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <MiniStat
            icon={<FolderKanban className="h-4 w-4" />}
            value={phases.length}
            label="Phases"
          />
          <MiniStat
            icon={<FileText className="h-4 w-4" />}
            value={documents.length}
            label="Documents"
          />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onAddPhase}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Phase
          </Button>
          <Button variant="outline" onClick={onAddDocument}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>
    </div>
  );
}

function StructureInfo() {
  return (
    <div>
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Structure</h3>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <InfoBlock
          icon={<FolderKanban className="h-4 w-4" />}
          title="Phases"
          description="Phases represent the major stages of your project workflow."
        />
        <InfoBlock
          icon={<FileText className="h-4 w-4" />}
          title="Document Types"
          description="Document types belong to phases and define the documents used during each stage."
        />
        <InfoBlock
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Future Configuration"
          description="Requirements, gates, approvals, checklists, deliverables and automations can be added to this structure."
        />
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, description }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <div>
          <div className="font-bold">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      }
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

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
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>
            Phase Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Design"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Phase Code</Label>
          <Input
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="e.g. DESIGN"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Describe this project phase..."
            rows={4}
          />
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {loading ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

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
      <div className="grid gap-4 py-2 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <Label>
            Document Type Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Concept Design"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Document Code</Label>
          <Input
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="e.g. CONCEPT_DESIGN"
          />
        </div>

        <div className="space-y-2">
          <Label>
            Project Phase <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.projectPhaseId || ""}
            onValueChange={(value) => {
              const phase = phases.find((item) => getId(item) === value);
              setForm((prev) => ({
                ...prev,
                projectPhaseId: value,
                phaseCode: phase?.code || "",
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={getId(phase)} value={getId(phase)}>
                  {getName(phase)}
                  {getCode(phase) ? ` (${getCode(phase)})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Type</Label>
          <Input
            value={form.targetType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                targetType: e.target.value,
              }))
            }
            placeholder="e.g. PROJECT"
          />
        </div>

        <div className="space-y-2">
          <Label>Phase Code</Label>
          <Input
            value={selectedPhase?.code || form.phaseCode || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                phaseCode: e.target.value,
              }))
            }
            placeholder="e.g. DESIGN"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Describe this document type..."
            rows={4}
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/40 p-4">
            <div>
              <div className="text-sm font-semibold">Active Document Type</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Inactive document types can remain in the system without being
                used for new workflows.
              </div>
            </div>
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: Boolean(checked),
                }))
              }
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {loading ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EmptyTree({ search, onAddPhase }) {
  return (
    <div className="px-4 py-12 text-center">
      <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
      <div className="mt-3 text-sm font-semibold">
        {search ? "No matching structure" : "No project phases"}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {search
          ? "Try another search term."
          : "Create your first project phase to start building the tree."}
      </p>
      {!search && (
        <Button size="sm" className="mt-4" onClick={onAddPhase}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Phase
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-xl border bg-background shadow-sm xl:grid-cols-[360px_minmax(0,1fr)_330px]">
      <div className="animate-pulse border-b p-4 xl:border-b-0 xl:border-r">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      <div className="animate-pulse border-b p-6 xl:border-b-0 xl:border-r">
        <div className="h-7 w-52 rounded bg-muted" />
        <div className="mt-4 h-24 rounded-xl bg-muted" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
      <div className="animate-pulse p-5">
        <div className="h-5 w-44 rounded bg-muted" />
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
