import React, { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  FileText,
  HardHat,
  Image,
  MapPin,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  useGetDailySiteReportsQuery,
  useGetSiteVisitLogQuery,
  useGetProjectMockupsQuery,
  useGetProjectRfisQuery,
  useGetProjectQcHistoryQuery,
  useGetProjectQcHandoffStatusQuery,
} from "@/api/site-ops.api";

const P = "#1F453B";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const statusStyles = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROPOSED: "border-blue-200 bg-blue-50 text-blue-700",
  REWORK: "border-orange-200 bg-orange-50 text-orange-700",
  PASS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAIL: "border-red-200 bg-red-50 text-red-700",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
};

function StatusBadge({ status }) {
  if (!status) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
  onClick,
}) {
  return (
    <Card
      className={cn(
        "border-slate-200 bg-white shadow-none transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>

            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {value}
            </div>

            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B]/10",
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5 text-[#1F453B]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F453B]/10">
          <Icon className="h-4.5 w-4.5 text-[#1F453B]" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>

      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-slate-600"
          onClick={onAction}
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>

      <p className="text-sm font-medium text-slate-700">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function SiteOperationsDashboard({
  projectId,
  project,
  onNavigate,
}) {
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);

  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 30);

  const fromString = fromDate.toISOString().slice(0, 10);

  /*
   * ---------------------------------------------------------
   * API DATA
   * ---------------------------------------------------------
   */

  const {
    data: reportsResponse,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useGetDailySiteReportsQuery(
    {
      projectId,
      from: fromString,
      to: todayString,
    },
    {
      skip: !projectId,
    },
  );

  const {
    data: visitsResponse,
    isLoading: visitsLoading,
    refetch: refetchVisits,
  } = useGetSiteVisitLogQuery(
    {
      projectId,
      from: fromString,
      to: todayString,
    },
    {
      skip: !projectId,
    },
  );

  const {
    data: mockupsResponse,
    isLoading: mockupsLoading,
    refetch: refetchMockups,
  } = useGetProjectMockupsQuery(
    {
      projectId,
    },
    {
      skip: !projectId,
    },
  );

  const {
    data: rfisResponse,
    isLoading: rfisLoading,
    refetch: refetchRfis,
  } = useGetProjectRfisQuery(
    {
      projectId,
    },
    {
      skip: !projectId,
    },
  );

  const {
    data: qcHistoryResponse,
    isLoading: qcLoading,
    refetch: refetchQc,
  } = useGetProjectQcHistoryQuery(projectId, {
    skip: !projectId,
  });

  const {
    data: handoffResponse,
    isLoading: handoffLoading,
    refetch: refetchHandoff,
  } = useGetProjectQcHandoffStatusQuery(projectId, {
    skip: !projectId,
  });

  /*
   * ---------------------------------------------------------
   * NORMALIZE API RESPONSES
   * ---------------------------------------------------------
   */

  const reports = useMemo(() => {
    if (Array.isArray(reportsResponse)) return reportsResponse;

    return (
      reportsResponse?.reports ||
      reportsResponse?.data ||
      reportsResponse?.items ||
      []
    );
  }, [reportsResponse]);

  const visits = useMemo(() => {
    if (Array.isArray(visitsResponse)) return visitsResponse;

    return (
      visitsResponse?.visits ||
      visitsResponse?.data ||
      visitsResponse?.items ||
      []
    );
  }, [visitsResponse]);

  const mockups = useMemo(() => {
    if (Array.isArray(mockupsResponse)) return mockupsResponse;

    return (
      mockupsResponse?.mockups ||
      mockupsResponse?.data ||
      mockupsResponse?.items ||
      []
    );
  }, [mockupsResponse]);

  const rfis = useMemo(() => {
    if (Array.isArray(rfisResponse)) return rfisResponse;

    return (
      rfisResponse?.rfis || rfisResponse?.data || rfisResponse?.items || []
    );
  }, [rfisResponse]);

  const qcHistory = useMemo(() => {
    if (Array.isArray(qcHistoryResponse)) return qcHistoryResponse;

    return (
      qcHistoryResponse?.history ||
      qcHistoryResponse?.data ||
      qcHistoryResponse?.items ||
      []
    );
  }, [qcHistoryResponse]);

  const handoffs = useMemo(() => {
    if (Array.isArray(handoffResponse)) return handoffResponse;

    return (
      handoffResponse?.handoffs ||
      handoffResponse?.data ||
      handoffResponse?.items ||
      []
    );
  }, [handoffResponse]);

  /*
   * ---------------------------------------------------------
   * DASHBOARD METRICS
   * ---------------------------------------------------------
   */

  const metrics = useMemo(() => {
    const openRfis = rfis.filter((r) => r.status === "OPEN").length;

    const pendingMockups = mockups.filter(
      (m) => m.status === "PROPOSED" || m.status === "UNDER_REVIEW",
    ).length;

    const failedQc = qcHistory.filter(
      (q) => q.result === "FAIL" || q.result === "REWORK",
    ).length;

    const passedQc = qcHistory.filter((q) => q.result === "PASS").length;

    const todayVisits = visits.filter(
      (v) => v.scheduledDate === todayString,
    ).length;

    const todayReport = reports.find((r) => r.reportDate === todayString);

    const handoffBlocked = handoffs.filter(
      (h) =>
        h.result === "FAIL" ||
        h.result === "REWORK" ||
        h.isClear === false ||
        h.handoffClear === false,
    ).length;

    return {
      reports: reports.length,
      todayReport,
      openRfis,
      pendingMockups,
      failedQc,
      passedQc,
      todayVisits,
      handoffBlocked,
    };
  }, [reports, visits, mockups, rfis, qcHistory, handoffs, todayString]);

  const qcPassRate =
    metrics.passedQc + metrics.failedQc > 0
      ? Math.round(
          (metrics.passedQc / (metrics.passedQc + metrics.failedQc)) * 100,
        )
      : 0;

  /*
   * ---------------------------------------------------------
   * RECENT ACTIVITY
   * ---------------------------------------------------------
   */

  const recentActivity = useMemo(() => {
    const activity = [];

    reports.slice(0, 5).forEach((report) => {
      activity.push({
        type: "report",
        icon: FileText,
        title: "Daily site report",
        description: report.workCompleted,
        date: report.reportDate,
        status: report.isShared ? "SHARED" : "DRAFT",
      });
    });

    rfis.slice(0, 5).forEach((rfi) => {
      activity.push({
        type: "rfi",
        icon: MessageSquareWarning,
        title: rfi.subject,
        description: `RFI-${String(rfi.rfiNumber).padStart(3, "0")}`,
        date: rfi.raisedAt,
        status: rfi.status,
      });
    });

    mockups.slice(0, 5).forEach((mockup) => {
      activity.push({
        type: "mockup",
        icon: Image,
        title: mockup.name,
        description: mockup.finishType || "Mockup",
        date: mockup.proposedAt,
        status: mockup.status,
      });
    });

    return activity
      .sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
      .slice(0, 8);
  }, [reports, rfis, mockups]);

  /*
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */

  const refreshAll = () => {
    refetchReports();
    refetchVisits();
    refetchMockups();
    refetchRfis();
    refetchQc();
    refetchHandoff();
  };

  /*
   * ---------------------------------------------------------
   * NAVIGATION
   * ---------------------------------------------------------
   */

  const navigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-full bg-[#F7F8F6]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Site Operations</span>
              {project?.name && (
                <>
                  <span>/</span>
                  <span>{project.name}</span>
                </>
              )}
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Site Operations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor site activity, quality, visits, RFIs and construction
              readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white"
              onClick={refreshAll}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            <Button
              size="sm"
              className="gap-2 bg-[#1F453B] hover:bg-[#16382F]"
              onClick={() => navigate("daily-report-new")}
            >
              <Plus className="h-4 w-4" />
              Daily Report
            </Button>
          </div>
        </div>

        {/* =====================================================
            KPI ROW
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Today's Site Report"
            value={metrics.todayReport ? "Ready" : "Missing"}
            description={
              metrics.todayReport
                ? metrics.todayReport.isShared
                  ? "Shared with team"
                  : "Not shared yet"
                : "Create today's report"
            }
            icon={metrics.todayReport ? CheckCircle2 : TriangleAlert}
            iconClassName={
              metrics.todayReport ? "bg-emerald-50" : "bg-amber-50"
            }
            onClick={() =>
              navigate(
                metrics.todayReport
                  ? `daily-report/${metrics.todayReport.id}`
                  : "daily-report-new",
              )
            }
          />

          <MetricCard
            title="Open RFIs"
            value={metrics.openRfis}
            description="Awaiting response or closure"
            icon={MessageSquareWarning}
            iconClassName="bg-amber-50"
            onClick={() => navigate("rfis")}
          />

          <MetricCard
            title="QC Handoffs Blocked"
            value={metrics.handoffBlocked}
            description="Trades waiting for clearance"
            icon={ShieldCheck}
            iconClassName="bg-red-50"
            onClick={() => navigate("qc")}
          />

          <MetricCard
            title="Today's Site Visits"
            value={metrics.todayVisits}
            description="Scheduled / logged visits"
            icon={MapPin}
            iconClassName="bg-blue-50"
            onClick={() => navigate("visits")}
          />
        </div>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* QC STATUS */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={ShieldCheck}
                  title="Quality & Handover"
                  description="Current QC health across project trades"
                  action="View QC"
                  onAction={() => navigate("qc")}
                />
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Pass Rate
                      </span>

                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="mt-3 text-2xl font-semibold text-slate-900">
                      {qcPassRate}%
                    </div>

                    <Progress value={qcPassRate} className="mt-3 h-1.5" />

                    <p className="mt-2 text-xs text-slate-500">
                      Based on recorded QC checks
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-red-700">
                        Rework / Failed
                      </span>

                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>

                    <div className="mt-3 text-2xl font-semibold text-red-700">
                      {metrics.failedQc}
                    </div>

                    <p className="mt-2 text-xs text-red-600">
                      Requires attention
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-700">
                        Handoff Blocked
                      </span>

                      <TriangleAlert className="h-4 w-4 text-amber-600" />
                    </div>

                    <div className="mt-3 text-2xl font-semibold text-amber-700">
                      {metrics.handoffBlocked}
                    </div>

                    <p className="mt-2 text-xs text-amber-600">
                      Next trade cannot proceed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DAILY REPORT */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={FileText}
                  title="Daily Site Reporting"
                  description="Latest site activity and reporting status"
                  action="View Reports"
                  onAction={() => navigate("daily-reports")}
                />
              </CardHeader>

              <CardContent>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : reports.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No site reports"
                    description="Daily site reports will appear here once created."
                  />
                ) : (
                  <div className="space-y-1">
                    {reports.slice(0, 5).map((report) => (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => navigate(`daily-report/${report.id}`)}
                        className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1F453B]/10">
                          <CalendarDays className="h-4 w-4 text-[#1F453B]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {report.reportDate}
                            </p>

                            {report.isShared && (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                              >
                                Shared
                              </Badge>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {report.workCompleted || "No work summary"}
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SITE VISITS */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={MapPin}
                  title="Site Visits"
                  description="Recent scheduled and completed visits"
                  action="View Visits"
                  onAction={() => navigate("visits")}
                />
              </CardHeader>

              <CardContent>
                {visitsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : visits.length === 0 ? (
                  <EmptyState
                    icon={MapPin}
                    title="No site visits"
                    description="Scheduled and logged visits will appear here."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {visits.slice(0, 6).map((visit) => (
                      <div
                        key={visit.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                              <Users className="h-4 w-4 text-slate-600" />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {visit.visitorName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {visit.visitorType}
                              </p>
                            </div>
                          </div>

                          <StatusBadge status={visit.status} />
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {visit.scheduledDate}
                          </span>

                          {visit.purpose && (
                            <span className="max-w-[150px] truncate">
                              {visit.purpose}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* QUICK ACTIONS */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Quick Actions
                </CardTitle>

                <CardDescription className="text-xs">
                  Common site operations
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("daily-report-new")}
                >
                  <FileText className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Daily Report</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("rfi-new")}
                >
                  <FileQuestion className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Raise RFI</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("mockup-new")}
                >
                  <Image className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Propose Mockup</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("qc-new")}
                >
                  <ClipboardCheck className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Record QC</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("visit-new")}
                >
                  <MapPin className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Log Visit</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 px-3 py-3 text-left"
                  onClick={() => navigate("checklists")}
                >
                  <ClipboardCheck className="h-4 w-4 text-[#1F453B]" />
                  <span className="text-xs">Checklists</span>
                </Button>
              </CardContent>
            </Card>

            {/* RFI QUEUE */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={MessageSquareWarning}
                  title="RFI Queue"
                  description="Items requiring response"
                  action="View All"
                  onAction={() => navigate("rfis")}
                />
              </CardHeader>

              <CardContent>
                {rfisLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rfis
                      .filter((rfi) => rfi.status === "OPEN")
                      .slice(0, 5)
                      .map((rfi) => (
                        <button
                          key={rfi.id}
                          type="button"
                          onClick={() => navigate(`rfi/${rfi.id}`)}
                          className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-400">
                                RFI-
                                {String(rfi.rfiNumber).padStart(3, "0")}
                              </span>

                              {rfi.priority && (
                                <span className="text-[10px] font-medium uppercase text-amber-600">
                                  {rfi.priority}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs font-medium text-slate-700">
                              {rfi.subject}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {rfi.routedToTeam?.name ||
                                "Awaiting team response"}
                            </p>
                          </div>
                        </button>
                      ))}

                    {metrics.openRfis === 0 && (
                      <EmptyState
                        icon={CheckCircle2}
                        title="No open RFIs"
                        description="Everything is currently responded to."
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MOCKUPS */}

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={Image}
                  title="Mockup Approvals"
                  description="Finishes awaiting clearance"
                  action="View Mockups"
                  onAction={() => navigate("mockups")}
                />
              </CardHeader>

              <CardContent>
                {mockupsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : mockups
                    .filter(
                      (m) =>
                        m.status === "PROPOSED" || m.status === "UNDER_REVIEW",
                    )
                    .slice(0, 4).length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No pending mockups"
                    description="There are no mockups awaiting review."
                  />
                ) : (
                  <div className="space-y-3">
                    {mockups
                      .filter(
                        (m) =>
                          m.status === "PROPOSED" ||
                          m.status === "UNDER_REVIEW",
                      )
                      .slice(0, 4)
                      .map((mockup) => (
                        <button
                          key={mockup.id}
                          type="button"
                          onClick={() => navigate(`mockup/${mockup.id}`)}
                          className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Image className="h-4 w-4 text-slate-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">
                              {mockup.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {mockup.finishType || "Finish mockup"}
                            </p>
                          </div>

                          <StatusBadge status={mockup.status} />
                        </button>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* =====================================================
            RECENT ACTIVITY
        ====================================================== */}

        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Activity}
              title="Recent Site Activity"
              description="Latest updates from site operations"
            />
          </CardHeader>

          <CardContent>
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="Site reports, RFIs and mockups will appear here."
              />
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {recentActivity.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={`${item.type}-${index}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F453B]/10">
                          <Icon className="h-4 w-4 text-[#1F453B]" />
                        </div>

                        {item.status && <StatusBadge status={item.status} />}
                      </div>

                      <p className="mt-3 truncate text-sm font-medium text-slate-800">
                        {item.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.description}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock3 className="h-3 w-3" />
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* =====================================================
            FOOTER STATUS
        ====================================================== */}

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Site Operations Command Center</span>

          <span>Monitoring reports, visits, QC, RFIs and mockups</span>
        </div>
      </div>
    </div>
  );
}
