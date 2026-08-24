import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  ClipboardCheck,
  ChevronRight,
  Eye,
  CalendarDays,
  User,
  Layers3,
  Users,
  AlertCircle,
} from "lucide-react";

import { useGetQcHistoryQuery } from "@/api/site-ops.api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUS_CONFIG = {
  PASS: {
    label: "Passed",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  FAIL: {
    label: "Failed",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },
  REWORK: {
    label: "Rework",
    icon: RotateCcw,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
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

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    icon: AlertCircle,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>

            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>

          <div className="rounded-lg bg-slate-100 p-2.5">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QcHistoryPage({ projectId, projectName = "Project" }) {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [selectedQc, setSelectedQc] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetQcHistoryQuery(projectId, {
      skip: !projectId,
    });

  /*
   * Depending on your service response this may already be an array
   * or may be wrapped inside { data: [] }.
   */
  const history = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.history)) return data.history;

    return [];
  }, [data]);

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesStatus =
        resultFilter === "ALL" || item.result === resultFilter;

      if (!matchesStatus) return false;

      if (!term) return true;

      return [
        item.result,
        item.checkedBy,
        item.tradeTeam?.name,
        item.step?.name,
        item.checklistTemplate?.name,
        item.notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [history, search, resultFilter]);

  const summary = useMemo(() => {
    const total = history.length;

    const passed = history.filter((item) => item.result === "PASS").length;

    const failed = history.filter((item) => item.result === "FAIL").length;

    const rework = history.filter((item) => item.result === "REWORK").length;

    return {
      total,
      passed,
      failed,
      rework,
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Site Operations</span>
              <ChevronRight className="h-4 w-4" />
              <span>Quality Control</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900">QC History</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 p-2.5">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  QC History
                </h1>

                <p className="text-sm text-slate-500">
                  Review quality checks, handoffs and rework history for{" "}
                  {projectName}.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Checks"
            value={summary.total}
            description="QC sign-offs recorded"
            icon={ClipboardCheck}
          />

          <SummaryCard
            title="Passed"
            value={summary.passed}
            description="Handoffs cleared"
            icon={CheckCircle2}
          />

          <SummaryCard
            title="Failed"
            value={summary.failed}
            description="Checks requiring attention"
            icon={XCircle}
          />

          <SummaryCard
            title="Rework"
            value={summary.rework}
            description="Checks requiring another attempt"
            icon={RotateCcw}
          />
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />

            <AlertDescription className="flex items-center justify-between">
              <span>Unable to load QC history.</span>

              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search checklist, trade, step, checker..."
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />

                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Results</SelectItem>

                    <SelectItem value="PASS">Passed</SelectItem>

                    <SelectItem value="FAIL">Failed</SelectItem>

                    <SelectItem value="REWORK">Rework</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">QC Sign-offs</CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredHistory.length} record
                  {filteredHistory.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <QcTableSkeleton />
            ) : filteredHistory.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70">
                      <TableHead className="pl-6">Result</TableHead>

                      <TableHead>Checklist</TableHead>

                      <TableHead>Step / Phase</TableHead>

                      <TableHead>Trade</TableHead>

                      <TableHead>Attempt</TableHead>

                      <TableHead>Checked By</TableHead>

                      <TableHead>Checked At</TableHead>

                      <TableHead className="w-[70px]" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setSelectedQc(item)}
                      >
                        <TableCell className="pl-6">
                          <StatusBadge status={item.result} />
                        </TableCell>

                        <TableCell>
                          <div className="max-w-[260px]">
                            <p className="font-medium text-slate-900">
                              {item.checklistTemplate?.name ||
                                `Checklist #${item.checklistTemplateId}`}
                            </p>

                            {item.notes && (
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-slate-400" />

                            <span className="text-sm text-slate-700">
                              {item.step?.name || `Step #${item.stepId}`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />

                            <span className="text-sm text-slate-700">
                              {item.tradeTeam?.name ||
                                `Team #${item.tradeTeamId}`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            #{item.attemptNumber || 1}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />

                            <span className="text-sm">{item.checkedBy}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays className="h-4 w-4 text-slate-400" />

                            {formatDateTime(item.checkedAt)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQc(item);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          DETAIL SHEET
      ====================================================== */}

      <Sheet
        open={!!selectedQc}
        onOpenChange={(open) => {
          if (!open) setSelectedQc(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedQc && (
            <>
              <SheetHeader>
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <ClipboardCheck className="h-5 w-5 text-slate-700" />
                  </div>

                  <StatusBadge status={selectedQc.result} />
                </div>

                <SheetTitle>QC Sign-off #{selectedQc.id}</SheetTitle>

                <SheetDescription>
                  Recorded on {formatDateTime(selectedQc.checkedAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* BASIC INFORMATION */}

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Check Details
                  </h3>

                  <div className="mt-3 rounded-lg border bg-white">
                    <DetailRow
                      label="Checklist"
                      value={
                        selectedQc.checklistTemplate?.name ||
                        `#${selectedQc.checklistTemplateId}`
                      }
                    />

                    <DetailRow
                      label="Step / Phase"
                      value={selectedQc.step?.name || `#${selectedQc.stepId}`}
                    />

                    <DetailRow
                      label="Trade"
                      value={
                        selectedQc.tradeTeam?.name ||
                        `#${selectedQc.tradeTeamId}`
                      }
                    />

                    <DetailRow
                      label="Attempt"
                      value={`Attempt ${selectedQc.attemptNumber || 1}`}
                    />

                    <DetailRow
                      label="Checked By"
                      value={selectedQc.checkedBy}
                    />

                    <DetailRow
                      label="Checked At"
                      value={formatDateTime(selectedQc.checkedAt)}
                    />
                  </div>
                </section>

                <Separator />

                {/* NOTES */}

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notes
                  </h3>

                  <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {selectedQc.notes ||
                      "No notes were added to this QC sign-off."}
                  </div>
                </section>

                <Separator />

                {/* ITEM RESULTS */}

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Checklist Results
                    </h3>

                    {selectedQc.itemResults && (
                      <Badge variant="secondary">
                        {selectedQc.itemResults.length} items
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(selectedQc.itemResults || []).map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-slate-800">
                            {item.templateItem?.text ||
                              `Checklist item #${item.templateItemId}`}
                          </p>

                          <Badge variant="outline" className="shrink-0">
                            {item.result}
                          </Badge>
                        </div>

                        {item.remark && (
                          <p className="mt-2 text-xs text-slate-500">
                            {item.remark}
                          </p>
                        )}
                      </div>
                    ))}

                    {(!selectedQc.itemResults ||
                      selectedQc.itemResults.length === 0) && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                        No individual checklist results available.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-right text-sm font-medium text-slate-900">
        {value || "—"}
      </span>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function QcTableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-[240px]" />
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <ClipboardCheck className="h-7 w-7 text-slate-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No QC history found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No quality-control sign-offs match the current filters.
      </p>
    </div>
  );
}
