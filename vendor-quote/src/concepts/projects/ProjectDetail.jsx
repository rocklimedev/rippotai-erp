import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  formatCurrency,
  formatDate,
  getStatusConfig,
} from "../../utils/helpers";
import {
  ArrowLeft,
  Eye,
  Edit,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="p-6 text-sm text-gray-400">Loading...</div>;
  if (!project)
    return <div className="p-6 text-sm text-red-500">Project not found</div>;

  const { summary = {} } = project;
  const statusCfg = getStatusConfig(project.status);

  return (
    <div className="p-6">
      {/* Header */}
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#333333] mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#333333]">
              {project.name}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{project.site_location}</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] mb-4">
            Project Overview
          </h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <span className="text-gray-500">Project Name</span>
              <div className="font-medium mt-0.5">{project.name}</div>
            </div>
            <div>
              <span className="text-gray-500">Site Location</span>
              <div className="font-medium mt-0.5">{project.site_location}</div>
            </div>
            <div>
              <span className="text-gray-500">Start Date</span>
              <div className="font-medium mt-0.5">
                {formatDate(project.start_date) || "—"}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Expected Completion</span>
              <div className="font-medium mt-0.5">
                {formatDate(project.expected_completion) || "—"}
              </div>
            </div>
            {project.description && (
              <div className="col-span-2">
                <span className="text-gray-500">Description</span>
                <div className="mt-0.5 text-gray-700">
                  {project.description}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              label: "Total Quotations",
              value: summary.total || 0,
              icon: FolderOpen,
              color: "text-gray-600",
              bg: "bg-gray-100",
            },
            {
              label: "Pending",
              value: summary.pending || 0,
              icon: Clock,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
            },
            {
              label: "Approved",
              value: summary.approved || 0,
              icon: CheckCircle,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Declined",
              value: summary.declined || 0,
              icon: XCircle,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${card.bg}`}
              >
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs text-gray-400">{card.label}</div>
              </div>
            </div>
          ))}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-green-50">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-base font-bold text-green-700">
                {formatCurrency(summary.approved_value || 0)}
              </div>
              <div className="text-xs text-gray-400">Approved Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#333333]">
            Project Quotations
          </h2>
        </div>
        {!project.quotations?.length ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No quotations linked to this project
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Quotation #
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Version
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {project.quotations.map((q) => {
                const cfg = getStatusConfig(q.status);
                return (
                  <tr
                    key={q.id}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#E31E24]">
                      {q.quotation_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{q.vendor_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {q.current_version > 0
                        ? `V${q.current_version}`
                        : "Draft"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(q.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(q.quotation_date)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
