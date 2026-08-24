import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useListVisitAssignmentsQuery,
  useGetVisitLogQuery,
  useDeactivateVisitAssignmentMutation,
  useCheckInSiteVisitMutation,
} from "@/api/site-ops.api";

const STATUS_STYLES = {
  SCHEDULED: "bg-slate-100 text-slate-700 border-slate-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MISSED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const FREQUENCY_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FIXED_SCHEDULE: "Fixed schedule",
  AD_HOC: "Ad hoc",
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
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] || "bg-slate-50"}>
      {status || "UNKNOWN"}
    </Badge>
  );
}

function VisitorTypeBadge({ type }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {type
        ? type
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "—"}
    </Badge>
  );
}

export default function SiteVisitsPage({ projectId }) {
  const [activeTab, setActiveTab] = useState("log");
  const [search, setSearch] = useState("");
  const [visitorType, setVisitorType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const today = new Date();

  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const to = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).toISOString();

  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useListVisitAssignmentsQuery(projectId, {
    skip: !projectId,
  });

  const {
    data: visitsData,
    isLoading: visitsLoading,
    refetch: refetchVisits,
  } = useGetVisitLogQuery(
    {
      projectId,
      from,
      to,
    },
    {
      skip: !projectId,
    },
  );

  const [deactivateAssignment] = useDeactivateVisitAssignmentMutation();

  const [checkInVisit, { isLoading: checkingIn }] =
    useCheckInSiteVisitMutation();

  const assignments = assignmentsData || [];
  const visits = visitsData || [];

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const matchesSearch =
        !query ||
        visit.visitorName?.toLowerCase().includes(query) ||
        visit.purpose?.toLowerCase().includes(query) ||
        visit.notes?.toLowerCase().includes(query);

      const matchesType =
        visitorType === "ALL" || visit.visitorType === visitorType;

      const matchesStatus = status === "ALL" || visit.status === status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [visits, search, visitorType, status]);

  const stats = useMemo(() => {
    return {
      total: visits.length,
      completed: visits.filter((v) => v.status === "COMPLETED").length,
      scheduled: visits.filter((v) => v.status === "SCHEDULED").length,
      missed: visits.filter((v) => v.status === "MISSED").length,
    };
  }, [visits]);

  const handleRefresh = () => {
    refetchAssignments();
    refetchVisits();
  };

  const handleDeactivate = async (id) => {
    await deactivateAssignment(id).unwrap();
    refetchAssignments();
  };

  const handleCheckIn = async (id) => {
    await checkInVisit(id).unwrap();
    refetchVisits();
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <div className="mx-auto max-w-[1500px] space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Site Operations
              <span>/</span>
              Site Visits
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F453B]">
              Site Visits
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage recurring site visit assignments and track actual site
              visits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button className="bg-[#1F453B] hover:bg-[#17382F]">
              <Plus className="mr-2 h-4 w-4" />
              Log Site Visit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
              </div>

              <div className="rounded-xl bg-[#E8EFEB] p-3">
                <CalendarDays className="h-5 w-5 text-[#1F453B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">
                  {stats.completed}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="mt-1 text-2xl font-semibold">{stats.scheduled}</p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Clock3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="mt-1 text-2xl font-semibold text-red-600">
                  {stats.missed}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("log")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "log"
                ? "border-[#1F453B] text-[#1F453B]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Visit Log
          </button>

          <button
            onClick={() => setActiveTab("assignments")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "assignments"
                ? "border-[#1F453B] text-[#1F453B]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Visit Assignments
          </button>
        </div>

        {/* Visit Log */}
        {activeTab === "log" && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base">Site Visit Log</CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    All scheduled, completed, missed and ad-hoc visits.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search visits..."
                      className="w-full pl-9 sm:w-[240px]"
                    />
                  </div>

                  <Select value={visitorType} onValueChange={setVisitorType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Visitor type" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ALL">All visitors</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="ARCHITECT">Architect</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ALL">All status</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="MISSED">Missed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {visitsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-[#E8EFEB] p-4">
                    <MapPin className="h-6 w-6 text-[#1F453B]" />
                  </div>

                  <h3 className="mt-4 font-medium">No site visits found</h3>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    No visits match the current filters for this project.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Actual Visit</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8EFEB]">
                                <UserCheck className="h-4 w-4 text-[#1F453B]" />
                              </div>

                              <div>
                                <p className="font-medium">
                                  {visit.visitorName}
                                </p>

                                {visit.loggedBy && (
                                  <p className="text-xs text-muted-foreground">
                                    Logged by {visit.loggedBy}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <VisitorTypeBadge type={visit.visitorType} />
                          </TableCell>

                          <TableCell>
                            {formatDate(visit.scheduledDate)}
                          </TableCell>

                          <TableCell>
                            {formatDateTime(visit.actualVisitAt)}
                          </TableCell>

                          <TableCell className="max-w-[260px] truncate">
                            {visit.purpose || "—"}
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={visit.status} />
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                {visit.status === "SCHEDULED" && (
                                  <DropdownMenuItem
                                    disabled={checkingIn}
                                    onClick={() => handleCheckIn(visit.id)}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Check In
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem>View Visit</DropdownMenuItem>

                                <DropdownMenuItem>Edit Visit</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assignments */}
        {activeTab === "assignments" && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Visit Assignments</CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Define who is expected to visit the site and how often.
                  </p>
                </div>

                <Button className="bg-[#1F453B] hover:bg-[#17382F]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assignment
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {assignmentsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-[#E8EFEB] p-4">
                    <Users className="h-6 w-6 text-[#1F453B]" />
                  </div>

                  <h3 className="mt-4 font-medium">No visit assignments</h3>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create an assignment for supervisors, architects, vendors,
                    contractors or clients.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor Type</TableHead>
                        <TableHead>Responsible Party</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <VisitorTypeBadge type={assignment.visitorType} />
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />

                              <span>
                                {assignment.externalPartyName ||
                                  assignment.team?.name ||
                                  `Team #${assignment.teamId || "—"}`}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            {FREQUENCY_LABELS[assignment.frequency] ||
                              assignment.frequency}
                          </TableCell>

                          <TableCell>
                            {assignment.scheduleDays?.length
                              ? assignment.scheduleDays.join(", ")
                              : "—"}
                          </TableCell>

                          <TableCell>
                            {assignment.isActive ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-gray-200 bg-gray-100 text-gray-600"
                              >
                                Inactive
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  Edit Assignment
                                </DropdownMenuItem>

                                {assignment.isActive && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeactivate(assignment.id)
                                    }
                                  >
                                    Deactivate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
