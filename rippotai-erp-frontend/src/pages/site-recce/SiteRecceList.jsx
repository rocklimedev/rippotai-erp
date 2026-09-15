import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  ClipboardList,
  MapPin,
  User,
  CalendarDays,
  Home,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Shell } from "../../hooks/shared";

import {
  useGetSiteReccesQuery,
  useDeleteSiteRecceMutation,
} from "../../api/documents/site-recce.api";

// ============================================================
// HELPERS
// ============================================================

const SITE_TYPE_LABELS = {
  FLAT: "Flat",
  FLOOR: "Floor",
  KOTHI: "Kothi",
  RAW: "Raw",
};

const formatSiteType = (type) => {
  if (!type) return "—";

  return (
    SITE_TYPE_LABELS[type] ||
    type
      .toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value).slice(0, 10);
  }
};

const getProjectName = (recce) => {
  return recce?.project_name || recce?.project?.name || "Unassigned Project";
};

// ============================================================
// COMPONENT
// ============================================================

export default function SiteRecceList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [siteType, setSiteType] = useState("");
  const [collapsed, setCollapsed] = useState({});

  // ==========================================================
  // API
  // ==========================================================

  const {
    data: rows = [],
    isLoading,
    isFetching,
    error,
  } = useGetSiteReccesQuery();

  const [deleteSiteRecce] = useDeleteSiteRecceMutation();

  // ==========================================================
  // NORMALIZE RESPONSE
  // ==========================================================

  const recces = useMemo(() => {
    if (Array.isArray(rows)) {
      return rows;
    }

    if (Array.isArray(rows?.data)) {
      return rows.data;
    }

    return [];
  }, [rows]);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    return recces.filter((recce) => {
      const projectName = getProjectName(recce);

      const searchableText = [
        projectName,
        recce.client_name,
        recce.site_address,
        recce.accompanied_by,
        recce.site_engineer?.name,
        recce.site_engineer?.email,
        recce.site_type,
        recce.unit_floor_no,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);
      const matchesSiteType = !siteType || recce.site_type === siteType;

      return matchesSearch && matchesSiteType;
    });
  }, [recces, q, siteType]);

  // ==========================================================
  // GROUP BY PROJECT
  // ==========================================================

  const groups = useMemo(() => {
    const grouped = {};

    for (const recce of filteredRows) {
      const projectName = getProjectName(recce);

      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }

      grouped[projectName].push(recce);
    }

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  // ==========================================================
  // DELETE
  // ==========================================================

  const removeRecce = async (recce) => {
    const projectName = getProjectName(recce);

    const confirmed = window.confirm(
      `Delete site recce for "${projectName}"?\n\nThis will remove the site recce and its rooms/photos.`,
    );

    if (!confirmed) return;

    try {
      await deleteSiteRecce(recce.id).unwrap();
      toast.success("Site recce deleted successfully");
    } catch (err) {
      toast.error(
        err?.data?.message ||
          err?.data?.detail ||
          "Failed to delete site recce",
      );
    }
  };

  // ============================================================
  // TOGGLE GROUP
  // ============================================================

  const toggleGroup = (projectName) => {
    setCollapsed((current) => ({
      ...current,
      [projectName]: !current[projectName],
    }));
  };

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <Shell>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Site Recces
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage site reconnaissance reports
            </p>
          </div>

          <Button onClick={() => nav("/crm/forms/site-reki")}>
            <Plus className="mr-2 h-4 w-4" />
            New Site Recce
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-2 font-medium text-destructive">
              Failed to load site recces
            </div>
            <div className="text-sm text-muted-foreground">
              {error?.data?.message ||
                error?.data?.detail ||
                "Something went wrong while loading the records."}
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Site Recces
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage site reconnaissance reports, measurements and site
            photographs
          </p>
        </div>

        <Button
          onClick={() => nav("/crm/forms/site-reki")}
          data-testid="site-recce-new-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Site Recce
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">
                  Total Recces
                </div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {recces.length}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Projects</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {groups.length}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Home className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">
                  Rooms Measured
                </div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {recces.reduce(
                    (total, recce) => total + (recce.rooms?.length || 0),
                    0,
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Home className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Photos</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {recces.reduce(
                    (total, recce) =>
                      total +
                      (recce.rooms || []).reduce(
                        (roomTotal, room) =>
                          roomTotal + (room.photos?.length || 0),
                        0,
                      ),
                    0,
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search project, client, address..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={siteType || "all"}
          onValueChange={(v) => setSiteType(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All site types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All site types</SelectItem>
            <SelectItem value="FLAT">Flat</SelectItem>
            <SelectItem value="FLOOR">Floor</SelectItem>
            <SelectItem value="KOTHI">Kothi</SelectItem>
            <SelectItem value="RAW">Raw</SelectItem>
          </SelectContent>
        </Select>

        {(q || siteType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setSiteType("");
            }}
          >
            Clear filters ×
          </Button>
        )}
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        {/* TABLE HEADER */}
        <div className="hidden grid-cols-12 border-b bg-muted/50 px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
          <div className="col-span-4">Project / Site</div>
          <div className="col-span-2">Site Engineer</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Rooms</div>
          <div className="col-span-1">Floors</div>
          <div className="col-span-2">Recce Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* LOADING */}
        {isLoading || isFetching ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading site recces...
          </div>
        ) : (
          <>
            {/* PROJECT GROUPS */}
            {groups.map(([projectName, items]) => {
              const isCollapsed = !!collapsed[projectName];

              return (
                <div key={projectName} className="border-b last:border-0">
                  {/* PROJECT HEADER */}
                  <div
                    onClick={() => toggleGroup(projectName)}
                    className="flex cursor-pointer items-center gap-3 bg-background px-6 py-4 hover:bg-muted/50"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}

                    <div className="flex-1 font-semibold text-foreground">
                      {projectName}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        · {items.length} recce
                        {items.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* RECCE ROWS */}
                  {!isCollapsed &&
                    items.map((recce) => {
                      const rooms = recce.rooms || [];
                      const photoCount = rooms.reduce(
                        (total, room) => total + (room.photos?.length || 0),
                        0,
                      );

                      return (
                        <div
                          key={recce.id}
                          onClick={() => nav(`/crm/recce/${recce.id}`)}
                          className="cursor-pointer border-t px-6 py-4 transition-colors hover:bg-muted/50"
                          data-testid={`site-recce-row-${recce.id}`}
                        >
                          {/* DESKTOP */}
                          <div className="hidden grid-cols-12 items-center text-sm md:grid">
                            {/* PROJECT / SITE */}
                            <div className="col-span-4 pr-4">
                              <div className="font-medium text-foreground">
                                {recce.project_name ||
                                  recce.project?.name ||
                                  "Untitled Site Recce"}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {recce.site_address ||
                                    recce.project?.site_location ||
                                    "No address"}
                                </span>
                              </div>
                              {recce.client_name && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Client: {recce.client_name}
                                </div>
                              )}
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                ID: {recce.id?.slice(0, 8)}...
                              </div>
                            </div>

                            {/* SITE ENGINEER */}
                            <div className="col-span-2 pr-3">
                              {recce.site_engineer ? (
                                <div>
                                  <div className="flex items-center gap-1.5 text-foreground">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{recce.site_engineer.name}</span>
                                  </div>
                                  {recce.site_engineer.email && (
                                    <div className="mt-1 truncate text-xs text-muted-foreground">
                                      {recce.site_engineer.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Not assigned
                                </span>
                              )}
                            </div>

                            {/* SITE TYPE */}
                            <div className="col-span-1">
                              <Badge variant="secondary">
                                {formatSiteType(recce.site_type)}
                              </Badge>
                            </div>

                            {/* ROOMS */}
                            <div className="col-span-1">
                              <div className="font-medium">
                                {recce.number_of_rooms ?? rooms.length ?? 0}
                              </div>
                              {photoCount > 0 && (
                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                  {photoCount} photo
                                  {photoCount !== 1 ? "s" : ""}
                                </div>
                              )}
                            </div>

                            {/* FLOORS */}
                            <div className="col-span-1 font-medium">
                              {recce.number_of_floors ?? "—"}
                            </div>

                            {/* DATE */}
                            <div className="col-span-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(recce.recce_date)}
                              </div>
                              {recce.unit_floor_no && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Unit/Floor: {recce.unit_floor_no}
                                </div>
                              )}
                            </div>

                            {/* ACTIONS */}
                            <div
                              className="col-span-1 flex justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => nav(`/crm/recce/${recce.id}`)}
                                title="View"
                                data-testid={`site-recce-view-${recce.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  nav(`/crm/recce/${recce.id}/edit`)
                                }
                                title="Edit"
                                data-testid={`site-recce-edit-${recce.id}`}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeRecce(recce)}
                                title="Delete"
                                data-testid={`site-recce-delete-${recce.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* MOBILE */}
                          <div className="md:hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-foreground">
                                  {recce.project_name ||
                                    recce.project?.name ||
                                    "Untitled Site Recce"}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {recce.site_address ||
                                      recce.project?.site_location ||
                                      "No address"}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                {formatSiteType(recce.site_type)}
                              </Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-muted-foreground">
                                  Site Engineer
                                </div>
                                <div className="mt-1 text-foreground">
                                  {recce.site_engineer?.name || "Not assigned"}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Recce Date
                                </div>
                                <div className="mt-1 text-foreground">
                                  {formatDate(recce.recce_date)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Rooms
                                </div>
                                <div className="mt-1 text-foreground">
                                  {recce.number_of_rooms ?? rooms.length ?? 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Floors
                                </div>
                                <div className="mt-1 text-foreground">
                                  {recce.number_of_floors ?? "—"}
                                </div>
                              </div>
                            </div>

                            <div
                              className="mt-4 flex justify-end gap-1 border-t pt-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => nav(`/crm/recce/${recce.id}`)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  nav(`/crm/recce/${recce.id}/edit`)
                                }
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeRecce(recce)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {/* EMPTY STATE */}
            {filteredRows.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="h-7 w-7 text-primary" />
                </div>
                <div className="font-medium text-foreground">
                  {q || siteType
                    ? "No site recces found"
                    : "No site recces yet"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {q || siteType
                    ? "Try changing your search or filters."
                    : "Start a new site recce to record site measurements and photographs."}
                </div>
                {!q && !siteType && (
                  <Button
                    className="mt-5"
                    onClick={() => nav("/crm/forms/site-reki")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Site Recce
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </Shell>
  );
}
