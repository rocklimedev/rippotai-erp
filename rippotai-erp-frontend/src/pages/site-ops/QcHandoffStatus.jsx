import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Clock3,
  ChevronDown,
  Loader2,
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

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useGetQcHandoffStatusQuery } from "@/api/site-ops.api";

/**
 * PAGE 7 — QC HANDOFF STATUS
 *
 * Endpoint:
 * GET /site-ops/qc/projects/:projectId/handoff-status
 *
 * Purpose:
 * Shows whether each phase / trade is currently cleared
 * to hand off work to the next trade.
 */

const statusConfig = {
  PASS: {
    label: "Cleared",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  FAIL: {
    label: "Failed",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },

  REWORK: {
    label: "Rework Required",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  PENDING: {
    label: "Pending QC",
    icon: Clock3,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-3 py-1 ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  className = "",
}) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </p>

            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B]/10">
            <Icon className="h-5 w-5 text-[#1F453B]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QcHandoffStatus() {
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState({});

  /*
   * Replace this with your actual project selector/query.
   *
   * The API requires:
   * GET /site-ops/qc/projects/:projectId/handoff-status
   */
  const selectedProjectId = projectId ? Number(projectId) : undefined;

  const { data, isLoading, isFetching, refetch } = useGetQcHandoffStatusQuery(
    selectedProjectId,
    {
      skip: !selectedProjectId,
    },
  );

  /*
   * The backend response may be either:
   *
   * [
   *   {...}
   * ]
   *
   * or:
   *
   * {
   *   data: [...]
   * }
   *
   * Normalize both here.
   */
  const rows = useMemo(() => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.handoffStatus)) {
      return data.handoffStatus;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  }, [data]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.stepName,
        row.phaseName,
        row.tradeName,
        row.tradeTeamName,
        row.teamName,
        row.nextTradeName,
        row.status,
        row.result,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      const rowStatus =
        row.status || row.result || (row.isClear ? "PASS" : "PENDING");

      const matchesStatus =
        statusFilter === "ALL" || rowStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const total = rows.length;

    const cleared = rows.filter(
      (row) =>
        row.status === "PASS" ||
        row.result === "PASS" ||
        row.isClear === true ||
        row.handoffClear === true,
    ).length;

    const failed = rows.filter(
      (row) => row.status === "FAIL" || row.result === "FAIL",
    ).length;

    const rework = rows.filter(
      (row) => row.status === "REWORK" || row.result === "REWORK",
    ).length;

    const pending = Math.max(0, total - cleared - failed - rework);

    return {
      total,
      cleared,
      failed,
      rework,
      pending,
    };
  }, [rows]);

  const toggleRow = (id) => {
    setExpandedRows((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const getRowStatus = (row) => {
    if (row.status) return row.status;
    if (row.result) return row.result;

    if (row.isClear === true || row.handoffClear === true) {
      return "PASS";
    }

    return "PENDING";
  };

  const getRowId = (row, index) =>
    row.id || `${row.stepId || row.phaseId || "row"}-${index}`;

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              Site Operations
              <span>/</span>
              QC
              <span>/</span>
              Handoff Status
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
                QC Handoff Status
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                See which phases and trades are cleared to hand work over to the
                next trade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={!selectedProjectId || isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* PROJECT SELECTOR */}
        {/* ===================================================== */}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="w-full lg:max-w-md">
                <label className="mb-2 block text-sm font-medium">
                  Project
                </label>

                {/*
                  Replace this with useGetProjectsQuery()
                  when the project selector is connected.
                */}
                <Input
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  placeholder="Enter project ID"
                  type="number"
                />
              </div>

              {!selectedProjectId && (
                <Alert className="border-amber-200 bg-amber-50 lg:flex-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />

                  <AlertTitle className="text-amber-800">
                    Select a project
                  </AlertTitle>

                  <AlertDescription className="text-amber-700">
                    Choose a project to view its current QC handoff status.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===================================================== */}
        {/* SUMMARY */}
        {/* ===================================================== */}

        {selectedProjectId && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="Total Handoffs"
              value={summary.total}
              description="Tracked phases / trades"
              icon={ClipboardCheck}
            />

            <SummaryCard
              title="Cleared"
              value={summary.cleared}
              description="Ready for next trade"
              icon={CheckCircle2}
            />

            <SummaryCard
              title="Pending"
              value={summary.pending}
              description="QC still required"
              icon={Clock3}
            />

            <SummaryCard
              title="Rework"
              value={summary.rework}
              description="Correction required"
              icon={AlertTriangle}
            />

            <SummaryCard
              title="Failed"
              value={summary.failed}
              description="Handoff blocked"
              icon={XCircle}
            />
          </div>
        )}

        {/* ===================================================== */}
        {/* STATUS OVERVIEW */}
        {/* ===================================================== */}

        {selectedProjectId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Handoff Overview</CardTitle>

                  <CardDescription>
                    Latest QC result for each phase and trade.
                  </CardDescription>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search phase or trade..."
                      className="w-full pl-9 sm:w-[240px]"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>

                      <SelectItem value="PASS">Cleared</SelectItem>

                      <SelectItem value="PENDING">Pending</SelectItem>

                      <SelectItem value="REWORK">Rework</SelectItem>

                      <SelectItem value="FAIL">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading QC handoff status...
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1F453B]/10">
                    <ClipboardCheck className="h-6 w-6 text-[#1F453B]" />
                  </div>

                  <h3 className="font-medium">No handoff records found</h3>

                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {search || statusFilter !== "ALL"
                      ? "Try changing your search or status filter."
                      : "There are no QC handoff records for this project yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[40px]" />

                        <TableHead>Phase / Step</TableHead>

                        <TableHead>Trade</TableHead>

                        <TableHead>Latest QC</TableHead>

                        <TableHead>Attempt</TableHead>

                        <TableHead>Checked By</TableHead>

                        <TableHead>Checked At</TableHead>

                        <TableHead className="text-right">Handoff</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredRows.map((row, index) => {
                        const id = getRowId(row, index);
                        const status = getRowStatus(row);
                        const isExpanded = !!expandedRows[id];

                        const phaseName =
                          row.stepName ||
                          row.phaseName ||
                          row.step?.name ||
                          `Step ${row.stepId || "-"}`;

                        const tradeName =
                          row.tradeName ||
                          row.tradeTeamName ||
                          row.teamName ||
                          row.tradeTeam?.name ||
                          `Team ${row.tradeTeamId || "-"}`;

                        const checkedBy =
                          row.checkedBy || row.latestSignOff?.checkedBy || "-";

                        const checkedAt =
                          row.checkedAt || row.latestSignOff?.checkedAt;

                        const attempt =
                          row.attemptNumber ||
                          row.latestSignOff?.attemptNumber ||
                          "-";

                        return (
                          <React.Fragment key={id}>
                            <TableRow
                              className={
                                status === "PASS"
                                  ? "bg-emerald-50/20"
                                  : status === "FAIL"
                                    ? "bg-red-50/20"
                                    : status === "REWORK"
                                      ? "bg-amber-50/20"
                                      : ""
                              }
                            >
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleRow(id)}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </Button>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <p className="font-medium">{phaseName}</p>

                                  {row.stepId && (
                                    <p className="text-xs text-muted-foreground">
                                      Step #{row.stepId}
                                    </p>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F453B]/10">
                                    <ClipboardCheck className="h-3.5 w-3.5 text-[#1F453B]" />
                                  </div>

                                  <span>{tradeName}</span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <StatusBadge status={status} />
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">{attempt}</span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">{checkedBy}</span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {checkedAt
                                    ? new Date(checkedAt).toLocaleString()
                                    : "-"}
                                </span>
                              </TableCell>

                              <TableCell className="text-right">
                                {status === "PASS" ? (
                                  <div className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ready
                                    <ArrowRight className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Blocked
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>

                            {/* ================================= */}
                            {/* EXPANDED DETAIL */}
                            {/* ================================= */}

                            {isExpanded && (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className="bg-muted/20 p-0"
                                >
                                  <div className="grid gap-6 p-6 lg:grid-cols-3">
                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Current Status
                                      </p>

                                      <div className="mt-2">
                                        <StatusBadge status={status} />
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Next Trade
                                      </p>

                                      <p className="mt-2 text-sm font-medium">
                                        {row.nextTradeName ||
                                          row.nextTeamName ||
                                          "Next trade not specified"}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Handoff Decision
                                      </p>

                                      <p
                                        className={`mt-2 text-sm font-medium ${
                                          status === "PASS"
                                            ? "text-emerald-700"
                                            : "text-red-700"
                                        }`}
                                      >
                                        {status === "PASS"
                                          ? "Work can be handed off."
                                          : "Handoff is currently blocked."}
                                      </p>
                                    </div>

                                    <div className="lg:col-span-3">
                                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        QC Notes
                                      </p>

                                      <div className="mt-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                                        {row.notes ||
                                          row.latestSignOff?.notes ||
                                          "No QC notes recorded."}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================================================== */}
        {/* HANDOFF RULE */}
        {/* ===================================================== */}

        {selectedProjectId && (
          <Alert className="border-[#B5C4B6] bg-[#F2F6F3]">
            <ClipboardCheck className="h-4 w-4 text-[#1F453B]" />

            <AlertTitle className="text-[#1F453B]">Handoff rule</AlertTitle>

            <AlertDescription className="text-[#52635B]">
              A trade is considered cleared only when its latest QC sign-off is
              marked <strong>PASS</strong>. Failed or rework results keep the
              handoff blocked until another QC check passes.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
