import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  MessageSquareWarning,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Paperclip,
  MoreHorizontal,
  Eye,
  Send,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  useGetRfisByProjectQuery,
  useRerouteRfiMutation,
  useRespondToRfiMutation,
  useCloseRfiMutation,
} from "@/api/site-ops.api";

/* =========================================================
   STATUS CONFIG
========================================================= */

const statusConfig = {
  OPEN: {
    label: "Open",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: MessageSquareWarning,
  },

  RESPONDED: {
    label: "Responded",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  CLOSED: {
    label: "Closed",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: CheckCircle2,
  },

  PENDING: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
};

/* =========================================================
   PRIORITY CONFIG
========================================================= */

const priorityConfig = {
  LOW: {
    label: "Low",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },

  NORMAL: {
    label: "Normal",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },

  HIGH: {
    label: "High",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  URGENT: {
    label: "Urgent",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

/* =========================================================
   BADGES
========================================================= */

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

function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.NORMAL;

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-3 py-1 ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
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

/* =========================================================
   PAGE
========================================================= */

export default function RfisPage() {
  const [projectId, setProjectId] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [activeTab, setActiveTab] = useState("all");

  const [selectedRfi, setSelectedRfi] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);

  const [responseOpen, setResponseOpen] = useState(false);

  const [rerouteOpen, setRerouteOpen] = useState(false);

  const [response, setResponse] = useState("");

  const [teamId, setTeamId] = useState("");

  const selectedProjectId = projectId ? Number(projectId) : undefined;

  /* =========================================================
     QUERY
  ========================================================= */

  const { data, isLoading, isFetching, refetch } = useGetRfisByProjectQuery(
    {
      projectId: selectedProjectId,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    },
    {
      skip: !selectedProjectId,
    },
  );

  /* =========================================================
     MUTATIONS
  ========================================================= */

  const [rerouteRfi, rerouteState] = useRerouteRfiMutation();

  const [respondToRfi, respondState] = useRespondToRfiMutation();

  const [closeRfi, closeState] = useCloseRfiMutation();

  /* =========================================================
     NORMALIZE RESPONSE
  ========================================================= */

  const rfis = useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.rfis)) {
      return data.rfis;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  }, [data]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredRfis = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rfis.filter((rfi) => {
      const searchable = [
        rfi.rfiNumber,
        rfi.subject,
        rfi.query,
        rfi.raisedBy,
        rfi.routedToTeamName,
        rfi.routedToTeam?.name,
        rfi.status,
        rfi.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesPriority =
        priorityFilter === "ALL" || rfi.priority === priorityFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "open" && rfi.status === "OPEN") ||
        (activeTab === "responded" && rfi.status === "RESPONDED") ||
        (activeTab === "closed" && rfi.status === "CLOSED");

      return matchesSearch && matchesPriority && matchesTab;
    });
  }, [rfis, search, priorityFilter, activeTab]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const open = rfis.filter((r) => r.status === "OPEN").length;

    const responded = rfis.filter((r) => r.status === "RESPONDED").length;

    const closed = rfis.filter((r) => r.status === "CLOSED").length;

    const urgent = rfis.filter(
      (r) => r.priority === "URGENT" && r.status !== "CLOSED",
    ).length;

    const high = rfis.filter(
      (r) => r.priority === "HIGH" && r.status !== "CLOSED",
    ).length;

    return {
      total: rfis.length,
      open,
      responded,
      closed,
      urgent,
      high,
    };
  }, [rfis]);

  /* =========================================================
     OPEN VIEW
  ========================================================= */

  const openView = (rfi) => {
    setSelectedRfi(rfi);
    setViewOpen(true);
  };

  /* =========================================================
     RESPOND
  ========================================================= */

  const openResponse = (rfi) => {
    setSelectedRfi(rfi);
    setResponse(rfi.response || "");
    setResponseOpen(true);
  };

  const handleRespond = async () => {
    if (!selectedRfi || !response.trim()) {
      return;
    }

    await respondToRfi({
      id: selectedRfi.id,
      body: {
        response: response.trim(),
      },
    }).unwrap();

    setResponseOpen(false);
    setResponse("");
    setSelectedRfi(null);
    refetch();
  };

  /* =========================================================
     REROUTE
  ========================================================= */

  const openReroute = (rfi) => {
    setSelectedRfi(rfi);
    setTeamId(rfi.routedToTeamId ? String(rfi.routedToTeamId) : "");
    setRerouteOpen(true);
  };

  const handleReroute = async () => {
    if (!selectedRfi || !teamId) {
      return;
    }

    await rerouteRfi({
      id: selectedRfi.id,
      body: {
        routedToTeamId: Number(teamId),
      },
    }).unwrap();

    setRerouteOpen(false);
    setTeamId("");
    setSelectedRfi(null);
    refetch();
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = async (rfi) => {
    await closeRfi(rfi.id).unwrap();

    refetch();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareWarning className="h-4 w-4" />
              Site Operations
              <span>/</span>
              RFIs
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F2937]">
              Requests for Information
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Track site queries, route them to the right team, record
              responses, and close them out.
            </p>
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

            <Button className="bg-[#1F453B] hover:bg-[#16352A]">
              <Plus className="mr-2 h-4 w-4" />
              Raise RFI
            </Button>
          </div>
        </div>

        {/* ===================================================
            PROJECT
        =================================================== */}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="w-full lg:max-w-md">
                <label className="mb-2 block text-sm font-medium">
                  Project
                </label>

                <Input
                  type="number"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Enter project ID"
                />
              </div>

              {!selectedProjectId && (
                <Alert className="border-amber-200 bg-amber-50 lg:flex-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />

                  <AlertTitle className="text-amber-800">
                    Select a project
                  </AlertTitle>

                  <AlertDescription className="text-amber-700">
                    Select a project to view its RFIs.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===================================================
            SUMMARY
        =================================================== */}

        {selectedProjectId && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="Total RFIs"
              value={summary.total}
              description="All project RFIs"
              icon={MessageSquareWarning}
            />

            <SummaryCard
              title="Open"
              value={summary.open}
              description="Awaiting response"
              icon={Clock3}
            />

            <SummaryCard
              title="Responded"
              value={summary.responded}
              description="Response received"
              icon={CheckCircle2}
            />

            <SummaryCard
              title="Urgent"
              value={summary.urgent}
              description="Requires immediate attention"
              icon={AlertTriangle}
            />

            <SummaryCard
              title="Closed"
              value={summary.closed}
              description="Completed RFIs"
              icon={CheckCircle2}
            />
          </div>
        )}

        {/* ===================================================
            MAIN TABLE
        =================================================== */}

        {selectedProjectId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle>RFI Register</CardTitle>

                  <CardDescription>
                    All information requests raised against this project.
                  </CardDescription>
                </div>

                {/* TABS */}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>

                    <TabsTrigger value="open">Open</TabsTrigger>

                    <TabsTrigger value="responded">Responded</TabsTrigger>

                    <TabsTrigger value="closed">Closed</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* FILTERS */}

                <div className="flex flex-col gap-2 lg:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search RFI number, subject, query, team..."
                      className="pl-9"
                    />
                  </div>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ALL">All Priorities</SelectItem>

                      <SelectItem value="URGENT">Urgent</SelectItem>

                      <SelectItem value="HIGH">High</SelectItem>

                      <SelectItem value="NORMAL">Normal</SelectItem>

                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex min-h-[350px] items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading RFIs...
                  </div>
                </div>
              ) : filteredRfis.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1F453B]/10">
                    <MessageSquareWarning className="h-6 w-6 text-[#1F453B]" />
                  </div>

                  <h3 className="font-medium">No RFIs found</h3>

                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {search || priorityFilter !== "ALL"
                      ? "Try changing your filters."
                      : "No information requests have been raised for this project."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>RFI</TableHead>

                        <TableHead>Subject</TableHead>

                        <TableHead>Priority</TableHead>

                        <TableHead>Status</TableHead>

                        <TableHead>Routed To</TableHead>

                        <TableHead>Raised By</TableHead>

                        <TableHead>Raised</TableHead>

                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredRfis.map((rfi) => (
                        <TableRow key={rfi.id} className="group">
                          {/* RFI NUMBER */}

                          <TableCell>
                            <button
                              type="button"
                              onClick={() => openView(rfi)}
                              className="font-semibold text-[#1F453B] hover:underline"
                            >
                              RFI-
                              {String(rfi.rfiNumber || rfi.id).padStart(3, "0")}
                            </button>
                          </TableCell>

                          {/* SUBJECT */}

                          <TableCell>
                            <div className="max-w-[280px]">
                              <p className="truncate font-medium">
                                {rfi.subject}
                              </p>

                              {rfi.step?.name && (
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {rfi.step.name}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* PRIORITY */}

                          <TableCell>
                            <PriorityBadge priority={rfi.priority} />
                          </TableCell>

                          {/* STATUS */}

                          <TableCell>
                            <StatusBadge status={rfi.status} />
                          </TableCell>

                          {/* TEAM */}

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F453B]/10">
                                <ArrowRight className="h-3.5 w-3.5 text-[#1F453B]" />
                              </div>

                              <span className="text-sm">
                                {rfi.routedToTeam?.name ||
                                  rfi.routedToTeamName ||
                                  `Team #${rfi.routedToTeamId}`}
                              </span>
                            </div>
                          </TableCell>

                          {/* RAISED BY */}

                          <TableCell>
                            <span className="text-sm">{rfi.raisedBy}</span>
                          </TableCell>

                          {/* DATE */}

                          <TableCell>
                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                              {rfi.raisedAt
                                ? new Date(rfi.raisedAt).toLocaleDateString()
                                : "-"}
                            </span>
                          </TableCell>

                          {/* ACTIONS */}

                          <TableCell>
                            <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View"
                                onClick={() => openView(rfi)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {rfi.status === "OPEN" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Respond"
                                  onClick={() => openResponse(rfi)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}

                              {rfi.status !== "CLOSED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reroute"
                                  onClick={() => openReroute(rfi)}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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

        {/* ===================================================
            DETAIL DIALOG
        =================================================== */}

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            {selectedRfi && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning className="h-5 w-5 text-[#1F453B]" />

                    <DialogTitle>
                      RFI-
                      {String(selectedRfi.rfiNumber || selectedRfi.id).padStart(
                        3,
                        "0",
                      )}
                    </DialogTitle>
                  </div>

                  <DialogDescription>
                    RFI details and response history.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* STATUS */}

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={selectedRfi.status} />

                    <PriorityBadge priority={selectedRfi.priority} />
                  </div>

                  {/* SUBJECT */}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subject
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {selectedRfi.subject}
                    </p>
                  </div>

                  {/* QUERY */}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Query
                    </p>

                    <div className="mt-2 rounded-lg border bg-muted/20 p-4 text-sm leading-6">
                      {selectedRfi.query}
                    </div>
                  </div>

                  {/* META */}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Raised By
                      </p>

                      <p className="mt-1 text-sm">{selectedRfi.raisedBy}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Raised At
                      </p>

                      <p className="mt-1 text-sm">
                        {selectedRfi.raisedAt
                          ? new Date(selectedRfi.raisedAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Routed To
                      </p>

                      <p className="mt-1 text-sm">
                        {selectedRfi.routedToTeam?.name ||
                          selectedRfi.routedToTeamName ||
                          `Team #${selectedRfi.routedToTeamId}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Process Step
                      </p>

                      <p className="mt-1 text-sm">
                        {selectedRfi.step?.name || selectedRfi.stepName || "-"}
                      </p>
                    </div>
                  </div>

                  {/* ATTACHMENTS */}

                  {selectedRfi.attachmentUrls?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Attachments
                      </p>

                      <div className="mt-2 space-y-2">
                        {selectedRfi.attachmentUrls.map((url, index) => (
                          <a
                            key={url || index}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted"
                          >
                            <Paperclip className="h-4 w-4" />
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RESPONSE */}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Response
                    </p>

                    <div className="mt-2 rounded-lg border bg-muted/20 p-4 text-sm leading-6">
                      {selectedRfi.response ? (
                        selectedRfi.response
                      ) : (
                        <span className="text-muted-foreground">
                          No response recorded yet.
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedRfi.respondedBy && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Responded By
                        </p>

                        <p className="mt-1 text-sm">
                          {selectedRfi.respondedBy}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Responded At
                        </p>

                        <p className="mt-1 text-sm">
                          {selectedRfi.respondedAt
                            ? new Date(selectedRfi.respondedAt).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  {selectedRfi.status === "OPEN" && (
                    <Button
                      onClick={() => {
                        setViewOpen(false);
                        openResponse(selectedRfi);
                      }}
                      className="bg-[#1F453B] hover:bg-[#16352A]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Respond
                    </Button>
                  )}

                  {selectedRfi.status !== "CLOSED" && (
                    <Button
                      variant="outline"
                      disabled={closeState.isLoading}
                      onClick={() => handleClose(selectedRfi)}
                    >
                      {closeState.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Close RFI
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ===================================================
            RESPONSE DIALOG
        =================================================== */}

        <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to RFI</DialogTitle>

              <DialogDescription>
                Record the official response for{" "}
                <strong>
                  RFI-
                  {selectedRfi?.rfiNumber}
                </strong>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">{selectedRfi?.subject}</p>

                <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                  {selectedRfi?.query}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Response
                </label>

                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter the response / clarification..."
                  rows={7}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResponseOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={!response.trim() || respondState.isLoading}
                onClick={handleRespond}
                className="bg-[#1F453B] hover:bg-[#16352A]"
              >
                {respondState.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================================================
            REROUTE DIALOG
        =================================================== */}

        <Dialog open={rerouteOpen} onOpenChange={setRerouteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reroute RFI</DialogTitle>

              <DialogDescription>
                Change the team responsible for answering this RFI.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">{selectedRfi?.subject}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  RFI-
                  {selectedRfi?.rfiNumber}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Team ID
                </label>

                <Input
                  type="number"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="Enter destination team ID"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Replace this input with your Team selector when the teams API
                  is connected.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRerouteOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={!teamId || rerouteState.isLoading}
                onClick={handleReroute}
                className="bg-[#1F453B] hover:bg-[#16352A]"
              >
                {rerouteState.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Reroute RFI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
