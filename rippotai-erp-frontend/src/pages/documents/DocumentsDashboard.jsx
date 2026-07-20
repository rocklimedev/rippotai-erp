import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RefreshCw, Plus, FolderOpen, FileText } from "lucide-react";

import { useGetDocumentsQuery } from "../../api/document.api";
import { useGetDrawingsQuery } from "../../api/drawing.api";

export default function DocumentsDashboard() {
  const nav = useNavigate();

  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch: refetchDocuments,
    error: documentsError,
  } = useGetDocumentsQuery();

  const {
    data: drawings = [],
    isLoading: drawingsLoading,
    refetch: refetchDrawings,
    error: drawingsError,
  } = useGetDrawingsQuery();

  const loading = documentsLoading || drawingsLoading;

  React.useEffect(() => {
    if (documentsError || drawingsError) {
      toast.error("Failed to load documents");
    }
  }, [documentsError, drawingsError]);

  const refresh = () => {
    refetchDocuments();
    refetchDrawings();
  };

  /**
   * Normalize API data
   *
   * Backend structure:
   *
   * {
   *   id,
   *   projectId,
   *   category,
   *   project:{
   *      id,
   *      name
   *   }
   * }
   *
   */

  const items = [
    ...documents.map((doc) => ({
      id: doc.id,

      project_id: doc.projectId,

      project_name: doc.project?.name || doc.project_name || "Unknown Project",

      category: doc.category || "Documents",

      type: "document",
    })),

    ...drawings.map((drawing) => ({
      id: drawing.id,

      project_id: drawing.projectId,

      project_name:
        drawing.project?.name || drawing.project_name || "Unknown Project",

      category: drawing.category || "Drawings",

      type: "drawing",
    })),
  ];

  /**
   * Group documents by project
   */

  const projects = Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.project_id]) {
        acc[item.project_id] = {
          project_id: item.project_id,

          project_name: item.project_name,

          count: 0,

          categories: {},
        };
      }

      acc[item.project_id].count++;

      if (!acc[item.project_id].categories[item.category]) {
        acc[item.project_id].categories[item.category] = 0;
      }

      acc[item.project_id].categories[item.category]++;

      return acc;
    }, {}),
  );

  return (
    <div>
      {/* Header */}

      <div
        className="
          flex items-center justify-between
          mb-4 gap-3 flex-wrap
        "
      >
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

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="
              inline-flex
              items-center
              justify-center
              w-9 h-9
              rounded-lg
              border
              bg-white
              hover:bg-gray-50
            "
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => nav("/documents/upload")}
            className="
              flex items-center gap-2
              h-9 px-4
              rounded-lg
              text-white
              text-sm
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
      ) : projects.length === 0 ? (
        <div
          className="
              py-16
              text-center
              text-[#B5C4B6]
            "
        >
          <FolderOpen
            size={40}
            className="
                mx-auto mb-3
              "
          />

          <div>No documents found</div>
        </div>
      ) : (
        <div
          className="
              grid
              grid-cols-2
              xl:grid-cols-3
              2xl:grid-cols-4
              gap-4
            "
        >
          {projects.map((project) => (
            <div
              key={project.project_id}
              onClick={() =>
                nav(`/documents/all?projectId=${project.project_id}`)
              }
              className="
                    bc-card
                    p-5
                    cursor-pointer
                    hover:shadow-md
                    transition
                  "
            >
              <div
                className="
                      flex
                      items-start
                      gap-3
                      mb-3
                    "
              >
                <div
                  className="
                        w-10
                        h-10
                        rounded-lg
                        bg-[#EAEEF0]
                        flex
                        items-center
                        justify-center
                      "
                >
                  <FileText size={18} />
                </div>

                <div
                  className="
                        min-w-0
                      "
                >
                  <div
                    className="
                          font-semibold
                          text-[#333333]
                          truncate
                        "
                  >
                    {project.project_name}
                  </div>

                  <div
                    className="
                          text-xs
                          text-gray-500
                          mt-1
                        "
                  >
                    {Object.entries(project.categories)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" • ")}
                  </div>
                </div>
              </div>

              <div
                className="
                      border-t
                      pt-3
                      flex
                      justify-between
                      items-center
                    "
              >
                <span
                  className="
                        text-3xl
                        font-bold
                        text-[#333333]
                      "
                >
                  {project.count}
                </span>

                <span
                  className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-gray-500
                      "
                >
                  files
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
