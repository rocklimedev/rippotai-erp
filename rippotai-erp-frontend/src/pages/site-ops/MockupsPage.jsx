import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Image as ImageIcon,
  MapPin,
  CalendarDays,
  User,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUpRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";

import { Textarea } from "@/components/ui/textarea";

import {
  useGetMockupsByProjectQuery,
  useProposeMockupMutation,
  useReviewMockupMutation,
} from "@/api/site-ops.api";

const STATUS_CONFIG = {
  PROPOSED: {
    label: "Proposed",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  REWORK: {
    label: "Rework",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: RotateCcw,
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PROPOSED;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>

            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F453B]/10 text-[#1F453B]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <ImageIcon className="h-7 w-7 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold">No mockups found</h3>

        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Create a mockup proposal for a finish or construction detail that
          needs approval before site-wide rollout.
        </p>

        <Button
          onClick={onCreate}
          className="mt-5 bg-[#1F453B] hover:bg-[#16352D]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Propose Mockup
        </Button>
      </CardContent>
    </Card>
  );
}

function MockupCard({ mockup, onView, onReview }) {
  const image = mockup.referenceImageUrls?.[0] || null;

  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9] bg-muted">
        {image ? (
          <img
            src={image}
            alt={mockup.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <StatusBadge status={mockup.status} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(mockup)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {mockup.status !== "APPROVED" && (
              <DropdownMenuItem onClick={() => onReview(mockup)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Review
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{mockup.name}</h3>

            {mockup.finishType && (
              <p className="mt-1 text-sm text-muted-foreground">
                {mockup.finishType}
              </p>
            )}
          </div>

          {mockup.clearedForRollout && (
            <Badge
              variant="outline"
              className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <Check className="mr-1 h-3 w-3" />
              Rollout Cleared
            </Badge>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          {mockup.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{mockup.location}</span>
            </div>
          )}

          {mockup.proposedBy && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{mockup.proposedBy}</span>
            </div>
          )}

          {mockup.proposedAt && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{new Date(mockup.proposedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => onView(mockup)}>
            View Details
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          {mockup.status !== "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(mockup)}
            >
              Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MockupDetailsDialog({ mockup, open, onOpenChange }) {
  if (!mockup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{mockup.name}</DialogTitle>

            <StatusBadge status={mockup.status} />
          </div>

          <DialogDescription>
            Mockup proposal and approval details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-xl border bg-muted">
            {mockup.referenceImageUrls?.length ? (
              <img
                src={mockup.referenceImageUrls[0]}
                alt={mockup.name}
                className="aspect-video h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Finish Type
              </p>
              <p className="mt-1 text-sm">{mockup.finishType || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="mt-1 text-sm">{mockup.location || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Proposed By
              </p>
              <p className="mt-1 text-sm">{mockup.proposedBy || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Proposed At
              </p>
              <p className="mt-1 text-sm">
                {mockup.proposedAt
                  ? new Date(mockup.proposedAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {mockup.description && (
          <div>
            <p className="text-sm font-medium">Description</p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {mockup.description}
            </p>
          </div>
        )}

        {mockup.reviewNotes && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">Review Notes</p>

            <p className="mt-2 text-sm text-muted-foreground">
              {mockup.reviewNotes}
            </p>
          </div>
        )}

        {mockup.reviewedBy && (
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Reviewed by </span>
              <span className="font-medium">{mockup.reviewedBy}</span>
            </div>

            {mockup.reviewedAt && (
              <div>
                <span className="text-muted-foreground">Reviewed </span>
                <span className="font-medium">
                  {new Date(mockup.reviewedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ mockup, open, onOpenChange, onSubmit, loading }) {
  const [status, setStatus] = useState("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");

  React.useEffect(() => {
    if (open) {
      setStatus("APPROVED");
      setReviewNotes("");
    }
  }, [open]);

  const submit = () => {
    onSubmit({
      id: mockup.id,
      body: {
        status,
        reviewNotes,
      },
    });
  };

  if (!mockup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Mockup</DialogTitle>

          <DialogDescription>
            Review "{mockup.name}" and record the decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Decision</label>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="APPROVED">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Approved
                  </span>
                </SelectItem>

                <SelectItem value="REWORK">
                  <span className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-orange-600" />
                    Rework Required
                  </span>
                </SelectItem>

                <SelectItem value="REJECTED">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rejected
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Review Notes
            </label>

            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add review comments, corrections or approval notes..."
              rows={5}
            />
          </div>

          {status === "APPROVED" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Approving this mockup</p>
                  <p className="mt-1 text-emerald-700">
                    The finish can be cleared for rollout once approved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={loading}
            className="bg-[#1F453B] hover:bg-[#16352D]"
          >
            {loading ? "Saving..." : "Save Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProposeMockupDialog({ open, onOpenChange, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: "",
    finishType: "",
    location: "",
    description: "",
    proposedBy: "",
    stepId: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = () => {
    onSubmit({
      name: form.name,
      finishType: form.finishType || null,
      location: form.location || null,
      description: form.description || null,
      proposedBy: form.proposedBy,
      stepId: form.stepId ? Number(form.stepId) : null,
      proposedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose Mockup</DialogTitle>

          <DialogDescription>
            Submit a finish or construction detail for review before site-wide
            rollout.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Mockup Name
            </label>

            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Living room flooring mockup - Option B"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Finish Type
            </label>

            <Input
              value={form.finishType}
              onChange={(e) => update("finishType", e.target.value)}
              placeholder="Flooring, Paint, Cladding..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Location</label>

            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Living Room / Lobby / Site..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Proposed By
            </label>

            <Input
              value={form.proposedBy}
              onChange={(e) => update("proposedBy", e.target.value)}
              placeholder="Name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Step ID</label>

            <Input
              type="number"
              value={form.stepId}
              onChange={(e) => update("stepId", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the proposed mockup, finish, specification or installation detail..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={!form.name || !form.proposedBy || loading}
            className="bg-[#1F453B] hover:bg-[#16352D]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MockupsPage({ projectId }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState("grid");

  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selectedMockup, setSelectedMockup] = useState(null);

  const { data, isLoading, isFetching } = useGetMockupsByProjectQuery(
    {
      projectId,
      status: status === "ALL" ? undefined : status,
    },
    {
      skip: !projectId,
    },
  );

  const [proposeMockup, { isLoading: proposing }] = useProposeMockupMutation();

  const [reviewMockup, { isLoading: reviewing }] = useReviewMockupMutation();

  const mockups = useMemo(() => {
    const list = Array.isArray(data) ? data : data?.data || data?.mockups || [];

    return list.filter((item) => {
      if (!search.trim()) return true;

      const q = search.toLowerCase();

      return [
        item.name,
        item.finishType,
        item.location,
        item.proposedBy,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [data, search]);

  const stats = useMemo(() => {
    return {
      total: mockups.length,
      proposed: mockups.filter((m) => m.status === "PROPOSED").length,
      approved: mockups.filter((m) => m.status === "APPROVED").length,
      rework: mockups.filter((m) => m.status === "REWORK").length,
      rollout: mockups.filter((m) => m.clearedForRollout).length,
    };
  }, [mockups]);

  const handleCreate = async (body) => {
    await proposeMockup({
      projectId,
      ...body,
    }).unwrap();

    setCreateOpen(false);
  };

  const handleReview = async ({ id, body }) => {
    await reviewMockup({
      id,
      ...body,
    }).unwrap();

    setReviewOpen(false);
    setSelectedMockup(null);
  };

  const openDetails = (mockup) => {
    setSelectedMockup(mockup);
    setDetailsOpen(true);
  };

  const openReview = (mockup) => {
    setSelectedMockup(mockup);
    setReviewOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Site Operations</span>
            <span>/</span>
            <span>Mockups</span>
          </div>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Mockups
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage finish mockups and approvals before site-wide rollout.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#1F453B] hover:bg-[#16352D]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Propose Mockup
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Mockups"
          value={stats.total}
          description="Project proposals"
          icon={ImageIcon}
        />

        <StatCard
          title="Pending Review"
          value={stats.proposed}
          description="Awaiting decision"
          icon={Clock3}
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          description="Approved finishes"
          icon={CheckCircle2}
        />

        <StatCard
          title="Rework"
          value={stats.rework}
          description="Needs revision"
          icon={RotateCcw}
        />

        <StatCard
          title="Rollout Cleared"
          value={stats.rollout}
          description="Ready for execution"
          icon={Check}
        />
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mockups, finishes, locations..."
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PROPOSED">Proposed</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REWORK">Rework</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border bg-muted/30 p-1">
              <Button
                size="sm"
                variant={view === "grid" ? "secondary" : "ghost"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant={view === "list" ? "secondary" : "ghost"}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading || isFetching ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item}>
              <div className="aspect-[16/9] animate-pulse bg-muted" />
              <CardContent className="space-y-3 p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mockups.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : view === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mockups.map((mockup) => (
            <MockupCard
              key={mockup.id}
              mockup={mockup}
              onView={openDetails}
              onReview={openReview}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border/60 shadow-sm">
          <div className="divide-y">
            {mockups.map((mockup) => (
              <div
                key={mockup.id}
                className="flex flex-col gap-4 p-4 transition hover:bg-muted/30 md:flex-row md:items-center"
              >
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {mockup.referenceImageUrls?.[0] ? (
                    <img
                      src={mockup.referenceImageUrls[0]}
                      alt={mockup.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{mockup.name}</h3>

                    <StatusBadge status={mockup.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    {mockup.finishType && <span>{mockup.finishType}</span>}

                    {mockup.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {mockup.location}
                      </span>
                    )}

                    {mockup.proposedBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {mockup.proposedBy}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetails(mockup)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>

                  {mockup.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => openReview(mockup)}
                      className="bg-[#1F453B] hover:bg-[#16352D]"
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <ProposeMockupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        loading={proposing}
      />

      <MockupDetailsDialog
        mockup={selectedMockup}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ReviewDialog
        mockup={selectedMockup}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSubmit={handleReview}
        loading={reviewing}
      />
    </div>
  );
}
