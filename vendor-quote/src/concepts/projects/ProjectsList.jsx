import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
} from "../../api/project.api";
import { formatCurrency, getStatusConfig } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  LayoutList,
  MapPin,
} from "lucide-react";
import ProjectFormModal from "../../components/projects/ProjectFormModal";

export default function ProjectsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [view, setView] = useState(
    () => localStorage.getItem("projects_view") || "list",
  );

  const setViewPref = (v) => {
    setView(v);
    localStorage.setItem("projects_view", v);
  };

  // RTK Query hooks
  const {
    data: projects = [],
    isLoading,
    error,
  } = useGetProjectsQuery({
    search,
  });
  const [deleteProject] = useDeleteProjectMutation();

  const handleSave = () => {
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Archive this project? It will no longer appear in new quotations.",
      )
    )
      return;
    try {
      await deleteProject(id).unwrap();
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  return (
    <div className="p-6">
      {modal && (
        <ProjectFormModal
          project={modal.project}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#333333]">Projects</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-[#E5E7EB] rounded-md overflow-hidden">
            <button
              onClick={() => setViewPref("list")}
              className={`p-2 ${
                view === "list"
                  ? "bg-[#1A3C34] text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewPref("grid")}
              className={`p-2 ${
                view === "grid"
                  ? "bg-[#1A3C34] text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            data-testid="add-project-btn"
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-[#1A3C34] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          data-testid="project-search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          Loading...
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">Error loading projects</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">No projects found</p>
          <button
            onClick={() => setModal({ type: "add" })}
            className="mt-2 text-sm text-[#1A3C34] hover:underline"
          >
            Add your first project
          </button>
        </div>
      ) : view === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => {
            const cfg = getStatusConfig(p.status);
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="font-semibold text-[#333333] text-sm flex-1 group-hover:text-[#1A3C34] transition-colors">
                    {p.name}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {p.site_location}
                </div>
                {p.description && (
                  <div className="text-xs text-gray-400 line-clamp-2 mb-3">
                    {p.description}
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-[#F3F4F6] flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-[#333333]">
                      {p.quotation_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Quotations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(p.approved_value || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Approved</div>
                  </div>
                  <div
                    className="ml-auto flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setModal({ type: "edit", project: p })}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {user?.role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Project Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Site Location
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Quotations
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Approved Value
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => {
                  const cfg = getStatusConfig(p.status);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#333333]">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.site_location}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-[#333333]">
                        {p.quotation_count || 0}
                      </td>
                      <td className="px-4 py-3 text-green-700 font-medium">
                        {formatCurrency(p.approved_value || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`view-project-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${p.id}`);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: "edit", project: p });
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {user?.role === "ADMIN" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
