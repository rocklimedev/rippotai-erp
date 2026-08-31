import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RefreshCw, Plus, FolderOpen, FileText, Layers3 } from "lucide-react";

import { useGetDocumentsQuery } from "../../api/document.api";
import { useGetDrawingsQuery } from "../../api/drawing.api";
import { useGetProjectsQuery } from "../../api/project.api";

/* ============================================================
   HELPERS
============================================================ */

const getProjectId = (item) => {
  return item?.projectId || item?.project_id || item?.project?.id || "";
};

const getProjectName = (item, projectMap) => {
  const projectId = getProjectId(item);

  return (
    item?.project?.name ||
    item?.project_name ||
    projectMap[projectId] ||
    "Unassigned"
  );
};

const getDocumentType = (document) => {
  return document?.documentType?.name || document?.category || "Documents";
};

const getDrawingCategory = (drawing) => {
  return drawing?.category || drawing?.drawingType?.name || "Drawings";
};

/* ============================================================
   DOCUMENTS DASHBOARD
============================================================ */

export default function DocumentsDashboard() {
  const nav = useNavigate();

  /* ==========================================================
     DOCUMENTS
  ========================================================== */

  const {
    data: documentsResponse,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
    error: documentsError,
  } = useGetDocumentsQuery();

  /* ==========================================================
     DRAWINGS
  ========================================================== */

  const {
    data: drawingsResponse,
    isLoading: drawingsLoading,
    refetch: refetchDrawings,
    error: drawingsError,
  } = useGetDrawingsQuery();

  /* ==========================================================
     PROJECTS
     
     Needed because the document response may only contain
     projectId and not project.name.
  ========================================================== */

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({});

  /* ==========================================================
     NORMALIZE RESPONSES
  ========================================================== */

  const documents = useMemo(() => {
    if (Array.isArray(documentsResponse)) {
      return documentsResponse;
    }

    return documentsResponse?.data || documentsResponse?.documents || [];
  }, [documentsResponse]);

  const drawings = useMemo(() => {
    if (Array.isArray(drawingsResponse)) {
      return drawingsResponse;
    }

    return drawingsResponse?.data || drawingsResponse?.drawings || [];
  }, [drawingsResponse]);

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* ==========================================================
     PROJECT MAP
  ========================================================== */

  const projectMap = useMemo(() => {
    const map = {};

    projects.forEach((project) => {
      if (!project?.id) return;

      map[project.id] =
        project.name ||
        project.projectName ||
        project.title ||
        project.code ||
        project.id;
    });

    return map;
  }, [projects]);

  /* ==========================================================
     ERROR HANDLING
  ========================================================== */

  React.useEffect(() => {
    if (documentsError || drawingsError) {
      toast.error("Failed to load documents");
    }
  }, [documentsError, drawingsError]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const loading = documentsLoading || drawingsLoading || projectsLoading;

  /* ==========================================================
     REFRESH
  ========================================================== */

  const refresh = () => {
    refetchDocuments();
    refetchDrawings();
  };

  /* ==========================================================
     NORMALIZED ITEMS
     
     Document:
       documentType.name
       projectId

     Drawing:
       category
       projectId
  ========================================================== */

  const items = useMemo(() => {
    const documentItems = documents.map((document) => {
      const projectId = getProjectId(document);

      return {
        id: document.id,

        project_id: projectId,

        project_name: getProjectName(document, projectMap),

        category: getDocumentType(document),

        type: "document",

        document_type: document?.documentType || null,
      };
    });

    const drawingItems = drawings.map((drawing) => {
      const projectId = getProjectId(drawing);

      return {
        id: drawing.id,

        project_id: projectId,

        project_name: getProjectName(drawing, projectMap),

        category: getDrawingCategory(drawing),

        type: "drawing",

        document_type: null,
      };
    });

    return [...documentItems, ...drawingItems];
  }, [documents, drawings, projectMap]);

  /* ==========================================================
     GROUP BY PROJECT
  ========================================================== */

  const projectGroups = useMemo(() => {
    const grouped = {};

    for (const item of items) {
      /*
       * If there is genuinely no project ID,
       * keep it under a stable "unassigned" key.
       */

      const projectId = item.project_id || "unassigned";

      if (!grouped[projectId]) {
        grouped[projectId] = {
          project_id: projectId,

          project_name: item.project_name || "Unassigned",

          count: 0,

          documents: 0,

          drawings: 0,

          categories: {},
        };
      }

      const group = grouped[projectId];

      group.count++;

      if (item.type === "document") {
        group.documents++;
      }

      if (item.type === "drawing") {
        group.drawings++;
      }

      const category = item.category || "Other";

      if (!group.categories[category]) {
        group.categories[category] = 0;
      }

      group.categories[category]++;
    }

    return Object.values(grouped).sort((a, b) =>
      a.project_name.localeCompare(b.project_name),
    );
  }, [items]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex items-center justify-between
          mb-5 gap-3 flex-wrap
        "
      >
        <div>
          <h1
            className="
              text-[36px]
              font-bold
              text-[#333333]
            "
            style={{
              fontFamily: "Poppins",
            }}
          >
            Documents
          </h1>

          <p className="text-[13px] text-[#6B7B7C] mt-1">
            Manage project documents, drawings and approvals
          </p>
        </div>

        <div className="flex gap-2">
          {/* REFRESH */}

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              w-9 h-9
              rounded-lg
              border
              bg-white
              hover:bg-gray-50
              disabled:opacity-50
            "
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* ADD DOCUMENT */}

          <button
            type="button"
            onClick={() => nav("/documents/upload")}
            className="
              flex items-center gap-2
              h-9 px-4
              rounded-lg
              text-white
              text-sm
              font-semibold
            "
            style={{
              background: "#1F453B",
            }}
          >
            <Plus size={14} />
            Add Document
          </button>
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      {!loading && projectGroups.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-5">
          <div className="bc-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B7B7C]">
              Projects
            </div>

            <div className="text-[25px] font-bold text-[#333333] mt-1">
              {projectGroups.length}
            </div>
          </div>

          <div className="bc-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B7B7C]">
              Documents
            </div>

            <div className="text-[25px] font-bold text-[#333333] mt-1">
              {documents.length}
            </div>
          </div>

          <div className="bc-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B7B7C]">
              Drawings
            </div>

            <div className="text-[25px] font-bold text-[#333333] mt-1">
              {drawings.length}
            </div>
          </div>

          <div className="bc-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B7B7C]">
              Total Files
            </div>

            <div className="text-[25px] font-bold text-[#333333] mt-1">
              {items.length}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div
          className="
            py-16
            text-center
            text-gray-400
          "
        >
          Loading projects...
        </div>
      ) : projectGroups.length === 0 ? (
        /* ====================================================
           EMPTY
        ==================================================== */

        <div
          className="
            py-16
            text-center
            text-[#B5C4B6]
          "
        >
          <FolderOpen size={40} className="mx-auto mb-3" />

          <div className="text-[14px]">No documents found</div>

          <div className="text-[12px] mt-1 text-[#8A9697]">
            Upload a document to get started.
          </div>
        </div>
      ) : (
        /* ====================================================
           PROJECT GRID
        ==================================================== */

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            2xl:grid-cols-4
            gap-4
          "
        >
          {projectGroups.map((project) => (
            <div
              key={project.project_id}
              onClick={() =>
                nav(
                  `/documents/all?project_id=${encodeURIComponent(
                    project.project_id,
                  )}`,
                )
              }
              className="
                  bc-card
                  p-5
                  cursor-pointer
                  hover:shadow-md
                  hover:-translate-y-[1px]
                  transition-all
                "
            >
              {/* ==========================================
                    PROJECT HEADER
                ========================================== */}

              <div
                className="
                    flex
                    items-start
                    gap-3
                    mb-4
                  "
              >
                <div
                  className="
                      w-10
                      h-10
                      shrink-0
                      rounded-lg
                      bg-[#EAEEF0]
                      flex
                      items-center
                      justify-center
                      text-[#1F453B]
                    "
                >
                  <FolderOpen size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className="
                        font-semibold
                        text-[#333333]
                        truncate
                      "
                    title={project.project_name}
                  >
                    {project.project_name}
                  </div>

                  <div className="text-[11px] text-[#8A9697] mt-1">
                    Project files
                  </div>
                </div>
              </div>

              {/* ==========================================
                    FILE TYPE COUNTS
                ========================================== */}

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-lg bg-[#F4F6F7] px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-[#1F453B]" />

                    <span className="text-[11px] text-[#6B7B7C]">
                      Documents
                    </span>
                  </div>

                  <div className="text-[20px] font-bold text-[#333333] mt-1">
                    {project.documents}
                  </div>
                </div>

                <div className="rounded-lg bg-[#F4F6F7] px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Layers3 size={13} className="text-[#1F453B]" />

                    <span className="text-[11px] text-[#6B7B7C]">Drawings</span>
                  </div>

                  <div className="text-[20px] font-bold text-[#333333] mt-1">
                    {project.drawings}
                  </div>
                </div>
              </div>

              {/* ==========================================
                    CATEGORIES
                ========================================== */}

              <div className="border-t pt-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#8A9697] mb-2">
                  Document Types
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(project.categories)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <span
                        key={key}
                        className="
                              inline-flex
                              items-center
                              gap-1
                              px-2
                              py-1
                              rounded-md
                              bg-[#F0F4F1]
                              text-[10.5px]
                              text-[#40534B]
                            "
                        title={`${key}: ${value}`}
                      >
                        <span className="truncate max-w-[150px]">{key}</span>

                        <span className="font-bold">{value}</span>
                      </span>
                    ))}

                  {Object.keys(project.categories).length > 4 && (
                    <span
                      className="
                          px-2
                          py-1
                          rounded-md
                          bg-[#EAEEF0]
                          text-[10.5px]
                          text-[#6B7B7C]
                        "
                    >
                      +{Object.keys(project.categories).length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* ==========================================
                    TOTAL
                ========================================== */}

              <div
                className="
                    border-t
                    mt-4
                    pt-3
                    flex
                    justify-between
                    items-center
                  "
              >
                <div>
                  <span
                    className="
                        text-3xl
                        font-bold
                        text-[#333333]
                      "
                  >
                    {project.count}
                  </span>

                  <span className="text-[12px] text-[#6B7B7C] ml-1">files</span>
                </div>

                <span
                  className="
                      text-[11px]
                      font-semibold
                      text-[#1F453B]
                    "
                >
                  View files →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
