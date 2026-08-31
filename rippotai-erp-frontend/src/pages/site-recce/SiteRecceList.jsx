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

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetSiteReccesQuery,
  useDeleteSiteRecceMutation,
} from "../../api/site-recce.api";

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

    // Defensive handling in case backend later returns:
    // { data: [...] }
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

    if (!confirmed) {
      return;
    }

    try {
      await deleteSiteRecce(recce.id).unwrap();

      toast.success("Site recce deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F453B]">
              Site Recces
            </h1>

            <p className="text-sm text-gray-500">
              Manage site reconnaissance reports
            </p>
          </div>

          <button
            onClick={() => nav("/crm/forms/site-reki")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17372F]"
          >
            <Plus className="w-4 h-4" />
            New Site Recce
          </button>
        </div>

        <Card className="p-12 text-center">
          <div className="text-red-500 font-medium mb-2">
            Failed to load site recces
          </div>

          <div className="text-sm text-gray-500">
            {error?.data?.message ||
              error?.data?.detail ||
              "Something went wrong while loading the records."}
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F453B]">Site Recces</h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage site reconnaissance reports, measurements and site
            photographs
          </p>
        </div>

        <button
          onClick={() => nav("/crm/forms/site-reki")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17372F] transition-colors"
          data-testid="site-recce-new-btn"
        >
          <Plus className="w-4 h-4" />
          New Site Recce
        </button>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Total Recces</div>

              <div className="text-2xl font-semibold text-[#1F453B] mt-1">
                {recces.length}
              </div>
            </div>

            <div className="w-10 h-10 rounded-lg bg-[#E8F0ED] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#1F453B]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Projects</div>

              <div className="text-2xl font-semibold text-[#1F453B] mt-1">
                {groups.length}
              </div>
            </div>

            <div className="w-10 h-10 rounded-lg bg-[#E8F0ED] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#1F453B]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Rooms Measured</div>

              <div className="text-2xl font-semibold text-[#1F453B] mt-1">
                {recces.reduce(
                  (total, recce) => total + (recce.rooms?.length || 0),
                  0,
                )}
              </div>
            </div>

            <div className="w-10 h-10 rounded-lg bg-[#E8F0ED] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#1F453B]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Photos</div>

              <div className="text-2xl font-semibold text-[#1F453B] mt-1">
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

            <div className="w-10 h-10 rounded-lg bg-[#E8F0ED] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#1F453B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Search project, client, address..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <select
          value={siteType}
          onChange={(e) => setSiteType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1F453B]/20"
        >
          <option value="">All site types</option>

          <option value="FLAT">Flat</option>
          <option value="FLOOR">Floor</option>
          <option value="KOTHI">Kothi</option>
          <option value="RAW">Raw</option>
        </select>

        {(q || siteType) && (
          <button
            onClick={() => {
              setQ("");
              setSiteType("");
            }}
            className="text-[13px] text-[#333333] font-semibold px-2"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <Card className="overflow-hidden">
        {/* TABLE HEADER */}

        <div className="hidden md:grid grid-cols-12 bg-[#F8F9FA] border-b text-xs font-medium text-[#666666] py-3 px-6">
          <div className="col-span-4">Project / Site</div>

          <div className="col-span-2">Site Engineer</div>

          <div className="col-span-1">Type</div>

          <div className="col-span-1">Rooms</div>

          <div className="col-span-1">Floors</div>

          <div className="col-span-2">Recce Date</div>

          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {isLoading || isFetching ? (
          <div className="p-12 text-center text-gray-500">
            Loading site recces...
          </div>
        ) : (
          <>
            {/* ==================================================
                PROJECT GROUPS
            ================================================== */}

            {groups.map(([projectName, items]) => {
              const isCollapsed = !!collapsed[projectName];

              return (
                <div key={projectName} className="border-b last:border-0">
                  {/* PROJECT HEADER */}

                  <div
                    onClick={() => toggleGroup(projectName)}
                    className="px-6 py-4 flex items-center gap-3 bg-white hover:bg-[#F9FAFB] cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}

                    <div className="font-semibold text-[#1F453B] flex-1">
                      {projectName}

                      <span className="text-sm font-normal text-gray-500 ml-2">
                        · {items.length} recce
                        {items.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <ClipboardList className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* ==================================================
                      RECCE ROWS
                  ================================================== */}

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
                          className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer px-6 py-4 transition-colors"
                          data-testid={`site-recce-row-${recce.id}`}
                        >
                          {/* DESKTOP */}

                          <div className="hidden md:grid grid-cols-12 items-center text-sm">
                            {/* PROJECT / SITE */}

                            <div className="col-span-4 pr-4">
                              <div className="font-medium text-[#222]">
                                {recce.project_name ||
                                  recce.project?.name ||
                                  "Untitled Site Recce"}
                              </div>

                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />

                                <span className="truncate">
                                  {recce.site_address ||
                                    recce.project?.site_location ||
                                    "No address"}
                                </span>
                              </div>

                              {recce.client_name && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Client: {recce.client_name}
                                </div>
                              )}

                              <div className="text-[11px] text-gray-400 mt-1">
                                ID: {recce.id?.slice(0, 8)}...
                              </div>
                            </div>

                            {/* SITE ENGINEER */}

                            <div className="col-span-2 pr-3">
                              {recce.site_engineer ? (
                                <div>
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <User className="w-3.5 h-3.5 text-gray-400" />

                                    <span>{recce.site_engineer.name}</span>
                                  </div>

                                  {recce.site_engineer.email && (
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                      {recce.site_engineer.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">
                                  Not assigned
                                </span>
                              )}
                            </div>

                            {/* SITE TYPE */}

                            <div className="col-span-1">
                              <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-[#E8F0ED] text-[#1F453B]">
                                {formatSiteType(recce.site_type)}
                              </span>
                            </div>

                            {/* ROOMS */}

                            <div className="col-span-1">
                              <div className="font-medium">
                                {recce.number_of_rooms ?? rooms.length ?? 0}
                              </div>

                              {photoCount > 0 && (
                                <div className="text-[11px] text-gray-400 mt-0.5">
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

                            <div className="col-span-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />

                                {formatDate(recce.recce_date)}
                              </div>

                              {recce.unit_floor_no && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Unit/Floor: {recce.unit_floor_no}
                                </div>
                              )}
                            </div>

                            {/* ACTIONS */}

                            <div
                              className="col-span-1 flex justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => nav(`/crm/recce/${recce.id}`)}
                                className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                                title="View"
                                data-testid={`site-recce-view-${recce.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  nav(`/crm/recce/${recce.id}/edit`)
                                }
                                className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                                title="Edit"
                                data-testid={`site-recce-edit-${recce.id}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => removeRecce(recce)}
                                className="p-1.5 rounded hover:bg-[#F4E1D6] text-[#B04D26]"
                                title="Delete"
                                data-testid={`site-recce-delete-${recce.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* ==================================================
                              MOBILE
                          ================================================== */}

                          <div className="md:hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-[#222]">
                                  {recce.project_name ||
                                    recce.project?.name ||
                                    "Untitled Site Recce"}
                                </div>

                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0" />

                                  <span className="truncate">
                                    {recce.site_address ||
                                      recce.project?.site_location ||
                                      "No address"}
                                  </span>
                                </div>
                              </div>

                              <span className="shrink-0 inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-[#E8F0ED] text-[#1F453B]">
                                {formatSiteType(recce.site_type)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                              <div>
                                <div className="text-gray-400">
                                  Site Engineer
                                </div>

                                <div className="text-gray-700 mt-1">
                                  {recce.site_engineer?.name || "Not assigned"}
                                </div>
                              </div>

                              <div>
                                <div className="text-gray-400">Recce Date</div>

                                <div className="text-gray-700 mt-1">
                                  {formatDate(recce.recce_date)}
                                </div>
                              </div>

                              <div>
                                <div className="text-gray-400">Rooms</div>

                                <div className="text-gray-700 mt-1">
                                  {recce.number_of_rooms ?? rooms.length ?? 0}
                                </div>
                              </div>

                              <div>
                                <div className="text-gray-400">Floors</div>

                                <div className="text-gray-700 mt-1">
                                  {recce.number_of_floors ?? "—"}
                                </div>
                              </div>
                            </div>

                            <div
                              className="flex justify-end gap-1 mt-4 pt-3 border-t"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => nav(`/crm/recce/${recce.id}`)}
                                className="p-2 rounded hover:bg-[#EAEEF0] text-[#333333]"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  nav(`/crm/recce/${recce.id}/edit`)
                                }
                                className="p-2 rounded hover:bg-[#EAEEF0] text-[#333333]"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => removeRecce(recce)}
                                className="p-2 rounded hover:bg-[#F4E1D6] text-[#B04D26]"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {filteredRows.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#E8F0ED] flex items-center justify-center mb-4">
                  <ClipboardList className="w-7 h-7 text-[#1F453B]" />
                </div>

                <div className="font-medium text-gray-700">
                  {q || siteType
                    ? "No site recces found"
                    : "No site recces yet"}
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  {q || siteType
                    ? "Try changing your search or filters."
                    : "Start a new site recce to record site measurements and photographs."}
                </div>

                {!q && !siteType && (
                  <button
                    onClick={() => nav("/crm/forms/site-reki")}
                    className="mt-5 h-10 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Site Recce
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </Shell>
  );
}
