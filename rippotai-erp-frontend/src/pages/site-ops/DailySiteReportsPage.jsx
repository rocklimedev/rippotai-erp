import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  CloudRain,
  Sun,
  Cloud,
  MoreHorizontal,
  Eye,
  Pencil,
  Share2,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";

import {
  useGetDailySiteReportsByProjectQuery,
  useCreateDailySiteReportMutation,
  useUpdateDailySiteReportMutation,
  useShareDailySiteReportMutation,
} from "@/api/site-ops.api";

const DailySiteReportsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const {
    data: reportsData,
    isLoading,
    isFetching,
  } = useGetDailySiteReportsByProjectQuery(
    {
      projectId: selectedProjectId,
    },
    {
      skip: !selectedProjectId,
    },
  );

  const [shareReport, { isLoading: isSharing }] =
    useShareDailySiteReportMutation();

  const reports = useMemo(() => {
    const rows = Array.isArray(reportsData)
      ? reportsData
      : reportsData?.data || reportsData?.reports || [];

    return rows.filter((report) => {
      const q = search.trim().toLowerCase();

      if (!q) return true;

      return (
        report.reportDate?.toLowerCase().includes(q) ||
        report.reportedBy?.toLowerCase().includes(q) ||
        report.workCompleted?.toLowerCase().includes(q) ||
        report.issues?.toLowerCase().includes(q)
      );
    });
  }, [reportsData, search]);

  const handleShare = async (report) => {
    try {
      await shareReport(report.id).unwrap();
    } catch (error) {
      console.error("Failed to share report", error);
    }
  };

  const getWeatherIcon = (condition) => {
    const value = String(condition || "").toUpperCase();

    if (value.includes("RAIN")) {
      return <CloudRain size={17} />;
    }

    if (value.includes("CLOUD")) {
      return <Cloud size={17} />;
    }

    return <Sun size={17} />;
  };

  const stats = useMemo(() => {
    const total = reports.length;

    const shared = reports.filter((r) => r.isShared).length;

    const withIssues = reports.filter(
      (r) => r.issues && r.issues.trim().length > 0,
    ).length;

    const manpower = reports.reduce((sum, report) => {
      const entries = report.manpower || [];

      return (
        sum +
        entries.reduce(
          (entrySum, entry) => entrySum + Number(entry.headcount || 0),
          0,
        )
      );
    }, 0);

    return {
      total,
      shared,
      withIssues,
      manpower,
    };
  }, [reports]);

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#1F2937]">
      {/* Header */}
      <div className="border-b border-[#E5E7E3] bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-[#7A847F]">
                <FileText size={15} />
                Site Operations
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#16352A]">
                Daily Site Reports
              </h1>

              <p className="mt-1 text-sm text-[#6B7280]">
                Track daily site progress, manpower, weather and issues.
              </p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#16352A]"
            >
              <Plus size={17} />
              New Daily Report
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Project selector */}
        <div className="mb-5 rounded-xl border border-[#E5E7E3] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7A847F]">
                Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-[#DDE3DE] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
              >
                <option value="">Select a project</option>

                {/* Replace with project query */}
                <option value="1">Project 001</option>
                <option value="2">Project 002</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={FileText} label="Total Reports" value={stats.total} />

          <StatCard
            icon={CheckCircle2}
            label="Shared Reports"
            value={stats.shared}
          />

          <StatCard
            icon={AlertTriangle}
            label="Reports With Issues"
            value={stats.withIssues}
          />

          <StatCard
            icon={Users}
            label="Reported Manpower"
            value={stats.manpower}
          />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E5E7E3] bg-white p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A938E]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full rounded-lg border border-[#DDE3DE] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#1F453B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-[#7A847F]" />

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-[#DDE3DE] bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7E3] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7E3] px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#16352A]">Daily Reports</h2>

              <p className="mt-0.5 text-xs text-[#7A847F]">
                {isFetching ? "Updating..." : `${reports.length} reports`}
              </p>
            </div>
          </div>

          {!selectedProjectId ? (
            <EmptyState
              icon={FileText}
              title="Select a project"
              description="Choose a project to view its daily site reports."
            />
          ) : isLoading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No daily reports"
              description="Create the first daily site report for this project."
              action={
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-medium text-white"
                >
                  <Plus size={16} />
                  Create Report
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E5E7E3] bg-[#FAFBFA] text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Weather
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Work Completed
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Manpower
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Issues
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Reported By
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7A847F]">
                      Status
                    </th>

                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => {
                    const manpower = (report.manpower || []).reduce(
                      (sum, item) => sum + Number(item.headcount || 0),
                      0,
                    );

                    return (
                      <tr
                        key={report.id}
                        className="border-b border-[#EEF0ED] last:border-b-0 hover:bg-[#FAFBFA]"
                      >
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="font-medium text-[#16352A] hover:underline"
                          >
                            {formatDate(report.reportDate)}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                            {getWeatherIcon(report.weatherCondition)}
                            <span>
                              {formatWeather(report.weatherCondition)}
                            </span>
                          </div>
                        </td>

                        <td className="max-w-[300px] px-5 py-4">
                          <p className="truncate text-sm text-[#374151]">
                            {report.workCompleted || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users size={15} className="text-[#7A847F]" />
                            {manpower || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {report.issues ? (
                            <div className="flex items-center gap-2 text-sm text-[#92400E]">
                              <AlertTriangle size={15} />
                              Yes
                            </div>
                          ) : (
                            <span className="text-sm text-[#7A847F]">None</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#4B5563]">
                          {report.reportedBy}
                        </td>

                        <td className="px-5 py-4">
                          {report.isShared ? (
                            <StatusBadge label="Shared" icon={CheckCircle2} />
                          ) : (
                            <StatusBadge label="Draft" icon={FileText} muted />
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              title="View"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye size={16} />
                            </IconButton>

                            {!report.isShared && (
                              <IconButton
                                title="Share"
                                disabled={isSharing}
                                onClick={() => handleShare(report)}
                              >
                                <Share2 size={16} />
                              </IconButton>
                            )}

                            <IconButton title="More">
                              <MoreHorizontal size={17} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create modal placeholder */}
      {showCreate && (
        <CreateReportModal
          projectId={selectedProjectId}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Details drawer */}
      {selectedReport && (
        <ReportDetails
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-[#E5E7E3] bg-white p-4">
    <div className="flex items-center justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF0EC] text-[#1F453B]">
        <Icon size={18} />
      </div>
    </div>

    <div className="mt-4">
      <div className="text-2xl font-semibold text-[#16352A]">{value}</div>
      <div className="mt-0.5 text-sm text-[#7A847F]">{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ label, icon: Icon, muted }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      muted ? "bg-[#F1F3F1] text-[#6B7280]" : "bg-[#EAF4ED] text-[#28613F]"
    }`}
  >
    <Icon size={13} />
    {label}
  </span>
);

const IconButton = ({ children, title, onClick, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EEF2EF] hover:text-[#1F453B] disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </button>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0EC] text-[#1F453B]">
      <Icon size={22} />
    </div>

    <h3 className="mt-4 font-semibold text-[#16352A]">{title}</h3>

    <p className="mt-1 max-w-sm text-sm text-[#7A847F]">{description}</p>

    {action}
  </div>
);

const LoadingState = () => (
  <div className="flex min-h-[360px] items-center justify-center">
    <div className="flex items-center gap-3 text-sm text-[#7A847F]">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D8E0DA] border-t-[#1F453B]" />
      Loading reports...
    </div>
  </div>
);

const CreateReportModal = ({ projectId, onClose }) => {
  const [createReport, { isLoading }] = useCreateDailySiteReportMutation();

  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    weatherCondition: "",
    weatherNotes: "",
    workCompleted: "",
    issues: "",
    reportedBy: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      await createReport({
        projectId: Number(projectId),
        ...form,
      }).unwrap();

      onClose();
    } catch (error) {
      console.error("Failed to create daily report", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5E7E3] px-6 py-4">
          <div>
            <h2 className="font-semibold text-[#16352A]">
              New Daily Site Report
            </h2>

            <p className="mt-0.5 text-xs text-[#7A847F]">
              Record today's site activity.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-sm text-[#6B7280] hover:text-[#1F453B]"
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Report Date">
              <input
                type="date"
                value={form.reportDate}
                onChange={(e) => update("reportDate", e.target.value)}
                required
                className="input"
              />
            </Field>

            <Field label="Weather">
              <select
                value={form.weatherCondition}
                onChange={(e) => update("weatherCondition", e.target.value)}
                className="input"
              >
                <option value="">Select weather</option>
                <option value="SUNNY">Sunny</option>
                <option value="CLOUDY">Cloudy</option>
                <option value="RAIN">Rain</option>
              </select>
            </Field>
          </div>

          <Field label="Weather Notes">
            <textarea
              value={form.weatherNotes}
              onChange={(e) => update("weatherNotes", e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Optional weather details..."
            />
          </Field>

          <Field label="Work Completed">
            <textarea
              value={form.workCompleted}
              onChange={(e) => update("workCompleted", e.target.value)}
              rows={5}
              required
              className="input resize-none"
              placeholder="Describe work completed today..."
            />
          </Field>

          <Field label="Issues">
            <textarea
              value={form.issues}
              onChange={(e) => update("issues", e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Record delays, blockers or site issues..."
            />
          </Field>

          <Field label="Reported By">
            <input
              value={form.reportedBy}
              onChange={(e) => update("reportedBy", e.target.value)}
              required
              className="input"
              placeholder="Name"
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-[#E5E7E3] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DDE3DE] px-4 py-2.5 text-sm font-medium text-[#4B5563]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-[#1F453B] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportDetails = ({ report, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
    <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E7E3] bg-white px-6 py-4">
        <div>
          <h2 className="font-semibold text-[#16352A]">Daily Site Report</h2>

          <p className="text-sm text-[#7A847F]">
            {formatDate(report.reportDate)}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-[#6B7280] hover:text-[#1F453B]"
        >
          Close
        </button>
      </div>

      <div className="space-y-6 p-6">
        <DetailSection title="Weather">
          <div className="text-sm text-[#374151]">
            {formatWeather(report.weatherCondition)}
          </div>

          {report.weatherNotes && (
            <p className="mt-1 text-sm text-[#6B7280]">{report.weatherNotes}</p>
          )}
        </DetailSection>

        <DetailSection title="Work Completed">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#374151]">
            {report.workCompleted}
          </p>
        </DetailSection>

        <DetailSection title="Issues">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#374151]">
            {report.issues || "No issues reported."}
          </p>
        </DetailSection>

        <DetailSection title="Manpower">
          {(report.manpower || []).length === 0 ? (
            <p className="text-sm text-[#7A847F]">No manpower entries.</p>
          ) : (
            <div className="divide-y divide-[#EEF0ED] rounded-lg border border-[#E5E7E3]">
              {report.manpower.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-[#374151]">
                    {entry.team?.name || `Team #${entry.teamId}`}
                  </span>

                  <span className="font-medium text-[#16352A]">
                    {entry.headcount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        <DetailSection title="Report">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Reported By" value={report.reportedBy} />

            <Info label="Status" value={report.isShared ? "Shared" : "Draft"} />

            <Info label="Created" value={formatDateTime(report.createdAt)} />

            <Info
              label="Shared At"
              value={
                report.sharedAt ? formatDateTime(report.sharedAt) : "Not shared"
              }
            />
          </div>
        </DetailSection>
      </div>
    </div>
  </div>
);

const DetailSection = ({ title, children }) => (
  <section>
    <h3 className="mb-2 text-sm font-semibold text-[#16352A]">{title}</h3>

    {children}
  </section>
);

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-[#8A938E]">
      {label}
    </div>

    <div className="mt-1 text-sm text-[#374151]">{value || "—"}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-[#374151]">
      {label}
    </label>

    {children}
  </div>
);

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWeather = (value) => {
  if (!value) return "Not recorded";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default DailySiteReportsPage;
