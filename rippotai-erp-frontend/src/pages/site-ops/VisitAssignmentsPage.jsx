import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Edit3,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useGetVisitAssignmentsByProjectQuery,
  useCreateVisitAssignmentMutation,
  useGetVisitAssignmentsQuery,
  useDeactivateVisitAssignmentMutation,
} from "@/api/site-ops.api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VISITOR_TYPES = [
  "SUPERVISOR",
  "ARCHITECT",
  "VENDOR",
  "CONTRACTOR",
  "CLIENT",
];

const FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "FIXED_SCHEDULE",
  "AD_HOC",
];

const DAYS = [
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
  { value: 7, label: "Sun", full: "Sunday" },
];

const formatLabel = (value) => {
  if (!value) return "—";

  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getFrequencyDescription = (frequency) => {
  switch (frequency) {
    case "DAILY":
      return "Every day";
    case "WEEKLY":
      return "Once every week";
    case "FORTNIGHTLY":
      return "Once every two weeks";
    case "MONTHLY":
      return "Once every month";
    case "FIXED_SCHEDULE":
      return "Specific days";
    case "AD_HOC":
      return "As required";
    default:
      return "—";
  }
};

const getInitialForm = () => ({
  projectId: "",
  visitorType: "",
  teamId: "",
  externalPartyName: "",
  frequency: "",
  scheduleDays: [],
});

export default function VisitAssignmentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [visitorType, setVisitorType] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [form, setForm] = useState(getInitialForm());

  /*
   * Fetch all visit assignments.
   */
  const { data, isLoading, isFetching } = useGetVisitAssignmentsQuery();

  /*
   * Create visit assignment.
   */
  const [createAssignment, { isLoading: creating }] =
    useCreateVisitAssignmentMutation();

  /*
   * Deactivate visit assignment.
   */
  const [deactivateAssignment, { isLoading: deactivating }] =
    useDeactivateVisitAssignmentMutation();

  const assignments = useMemo(() => {
    if (Array.isArray(data)) return data;

    return data?.data || data?.assignments || [];
  }, [data]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesStatus =
        status === "all" ||
        (status === "active"
          ? assignment.isActive !== false
          : assignment.isActive === false);

      const matchesType =
        visitorType === "all" || assignment.visitorType === visitorType;

      const searchable = [
        assignment.externalPartyName,
        assignment.visitorType,
        assignment.frequency,
        assignment.project?.name,
        assignment.project?.projectName,
        assignment.team?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus && matchesType && (!query || searchable.includes(query))
      );
    });
  }, [assignments, search, status, visitorType]);

  const stats = useMemo(() => {
    const active = assignments.filter((item) => item.isActive !== false);

    return {
      total: assignments.length,
      active: active.length,
      internal: active.filter((item) => item.teamId).length,
      external: active.filter((item) => item.externalPartyName).length,
    };
  }, [assignments]);

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setForm(getInitialForm());
    setDialogOpen(true);
  };

  const openEditDialog = (assignment) => {
    setEditingAssignment(assignment);

    setForm({
      projectId: assignment.projectId ? String(assignment.projectId) : "",
      visitorType: assignment.visitorType || "",
      teamId: assignment.teamId ? String(assignment.teamId) : "",
      externalPartyName: assignment.externalPartyName || "",
      frequency: assignment.frequency || "",
      scheduleDays: assignment.scheduleDays || [],
    });

    setDialogOpen(true);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleDay = (day) => {
    setForm((current) => {
      const exists = current.scheduleDays.includes(day);

      return {
        ...current,
        scheduleDays: exists
          ? current.scheduleDays.filter((item) => item !== day)
          : [...current.scheduleDays, day].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.projectId || !form.visitorType || !form.frequency) {
      return;
    }

    const payload = {
      projectId: Number(form.projectId),
      visitorType: form.visitorType,
      frequency: form.frequency,
      teamId: form.teamId ? Number(form.teamId) : null,
      externalPartyName: form.externalPartyName.trim() || null,
      scheduleDays:
        form.frequency === "FIXED_SCHEDULE" ? form.scheduleDays : null,
    };

    try {
      await createAssignment(payload).unwrap();

      setDialogOpen(false);
      setForm(getInitialForm());
      setEditingAssignment(null);
    } catch (error) {
      console.error("Failed to create visit assignment", error);
    }
  };

  const handleDeactivate = async (assignment) => {
    try {
      await deactivateAssignment(assignment.id).unwrap();
    } catch (error) {
      console.error("Failed to deactivate visit assignment", error);
    }
  };

  const getProjectName = (assignment) =>
    assignment.project?.name ||
    assignment.project?.projectName ||
    `Project #${assignment.projectId}`;

  const getTeamName = (assignment) =>
    assignment.team?.name ||
    assignment.team?.teamName ||
    (assignment.teamId ? `Team #${assignment.teamId}` : null);
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Site Operations</span>
              <span>/</span>
              <span>Visits</span>
              <span>/</span>
              <span className="text-foreground">Assignments</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Visit Assignments
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Define who is expected to visit each project and how frequently.
            </p>
          </div>

          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Visit
          </Button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Assignments"
            value={stats.total}
            icon={CalendarDays}
          />

          <StatCard title="Active" value={stats.active} icon={Clock3} />

          <StatCard
            title="Internal Teams"
            value={stats.internal}
            icon={Users}
          />

          <StatCard
            title="External Parties"
            value={stats.external}
            icon={CircleUserRound}
          />
        </div>

        {/* =====================================================
            MAIN CARD
        ===================================================== */}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-base">Visit Schedule</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Recurring and ad-hoc site visit responsibilities.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* Search */}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search assignments..."
                    className="w-full pl-9 sm:w-[240px]"
                  />
                </div>

                {/* Visitor type */}

                <Select value={visitorType} onValueChange={setVisitorType}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Visitor type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All visitor types</SelectItem>

                    {VISITOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="mt-4" />

            <Tabs value={status} onValueChange={setStatus} className="pt-3">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>

                <TabsTrigger value="all">All</TabsTrigger>

                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/30">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3">Project</th>

                    <th className="px-4 py-3">Visitor</th>

                    <th className="px-4 py-3">Assigned To</th>

                    <th className="px-4 py-3">Frequency</th>

                    <th className="px-4 py-3">Schedule</th>

                    <th className="px-4 py-3">Status</th>

                    <th className="w-[60px] px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isLoading || isFetching ? (
                    <LoadingRows />
                  ) : filteredAssignments.length === 0 ? (
                    <EmptyState onCreate={openCreateDialog} />
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <AssignmentRow
                        key={assignment.id}
                        assignment={assignment}
                        projectName={getProjectName(assignment)}
                        teamName={getTeamName(assignment)}
                        onEdit={() => openEditDialog(assignment)}
                        onDeactivate={() => handleDeactivate(assignment)}
                        deactivating={deactivating}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}

            {filteredAssignments.length > 0 && (
              <div className="border-t px-6 py-3 text-xs text-muted-foreground">
                Showing {filteredAssignments.length} of {assignments.length}{" "}
                assignments
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =======================================================
          CREATE / EDIT DIALOG
      ======================================================= */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment
                ? "Edit Visit Assignment"
                : "Schedule Site Visit"}
            </DialogTitle>

            <DialogDescription>
              Define who should visit the project and how often.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Project */}

            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>

              <Input
                value={form.projectId}
                onChange={(event) =>
                  updateForm("projectId", event.target.value)
                }
                placeholder="Project ID"
              />
            </div>

            {/* Visitor Type */}

            <div className="space-y-2">
              <label className="text-sm font-medium">Visitor Type</label>

              <Select
                value={form.visitorType}
                onValueChange={(value) => updateForm("visitorType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visitor type" />
                </SelectTrigger>

                <SelectContent>
                  {VISITOR_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment target */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Team ID</label>

                <Input
                  value={form.teamId}
                  onChange={(event) => updateForm("teamId", event.target.value)}
                  placeholder="Internal team ID"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">External Party</label>

                <Input
                  value={form.externalPartyName}
                  onChange={(event) =>
                    updateForm("externalPartyName", event.target.value)
                  }
                  placeholder="Vendor / contractor / client"
                />
              </div>
            </div>

            {/* Frequency */}

            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>

              <Select
                value={form.frequency}
                onValueChange={(value) => updateForm("frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>

                <SelectContent>
                  {FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      <div className="flex flex-col">
                        <span>{formatLabel(frequency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fixed schedule */}

            {form.frequency === "FIXED_SCHEDULE" && (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium">Visit Days</p>

                  <p className="text-xs text-muted-foreground">
                    Select the days this visitor is expected on site.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const selected = form.scheduleDays.includes(day.value);

                    return (
                      <Button
                        key={day.value}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}

            {form.frequency && (
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">Schedule Summary</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {getFrequencyDescription(form.frequency)}

                      {form.frequency === "FIXED_SCHEDULE" &&
                        form.scheduleDays.length > 0 &&
                        ` — ${form.scheduleDays
                          .map(
                            (day) =>
                              DAYS.find((item) => item.value === day)?.label,
                          )
                          .join(", ")}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={
                creating ||
                !form.projectId ||
                !form.visitorType ||
                !form.frequency
              }
            >
              {creating
                ? "Saving..."
                : editingAssignment
                  ? "Save Changes"
                  : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =============================================================
   STAT CARD
============================================================= */

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>

          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

/* =============================================================
   ASSIGNMENT ROW
============================================================= */

function AssignmentRow({
  assignment,
  projectName,
  teamName,
  onEdit,
  onDeactivate,
  deactivating,
}) {
  const isActive = assignment.isActive !== false;

  const schedule =
    assignment.frequency === "FIXED_SCHEDULE"
      ? (assignment.scheduleDays || [])
          .map((day) => DAYS.find((item) => item.value === day)?.label)
          .filter(Boolean)
          .join(", ") || "No days selected"
      : getFrequencyDescription(assignment.frequency);

  return (
    <tr className="group hover:bg-muted/20">
      {/* Project */}

      <td className="px-6 py-4">
        <div className="font-medium">{projectName}</div>

        <div className="mt-0.5 text-xs text-muted-foreground">
          Project #{assignment.projectId}
        </div>
      </td>

      {/* Visitor */}

      <td className="px-4 py-4">
        <Badge variant="outline">{formatLabel(assignment.visitorType)}</Badge>
      </td>

      {/* Assigned To */}

      <td className="px-4 py-4">
        {teamName ? (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />

            <span>{teamName}</span>
          </div>
        ) : assignment.externalPartyName ? (
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />

            <span>{assignment.externalPartyName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Not assigned</span>
        )}
      </td>

      {/* Frequency */}

      <td className="px-4 py-4">
        <span className="font-medium">{formatLabel(assignment.frequency)}</span>
      </td>

      {/* Schedule */}

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />

          <span className="text-muted-foreground">{schedule}</span>
        </div>
      </td>

      {/* Status */}

      <td className="px-4 py-4">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </td>

      {/* Actions */}

      <td className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-60 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            {isActive && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDeactivate}
                  disabled={deactivating}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

/* =============================================================
   LOADING
============================================================= */

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      {Array.from({ length: 7 }).map((__, cell) => (
        <td key={cell} className="px-4 py-5">
          <div className="h-4 rounded bg-muted" />
        </td>
      ))}
    </tr>
  ));
}

/* =============================================================
   EMPTY
============================================================= */

function EmptyState({ onCreate }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="text-sm font-semibold">No visit assignments found</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create an assignment to define who should visit the site and how
            frequently.
          </p>

          <Button className="mt-5" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </div>
      </td>
    </tr>
  );
}
