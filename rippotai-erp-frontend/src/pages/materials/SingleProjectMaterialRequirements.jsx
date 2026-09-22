import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Plus,
  Eye,
  Edit3,
  Package,
  ArrowLeft,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Shell, Card, Input } from "../../hooks/shared";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useGetMaterialRequirementsByProjectQuery } from "../../api/procuerment/material-requirement.api";

/* ============================================================
   BRAND
============================================================ */

const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";

const BRAND_TEXT = "text-[#1F453B]";

const BRAND_SOFT = "bg-[#E7F1EA] text-[#1F453B]";

/* ============================================================
   STATUS
============================================================ */

const getStatusClasses = (status) => {
  switch (String(status).toUpperCase()) {
    case "READY":
      return "bg-[#E7F1EA] text-[#1F453B]";

    case "IN_PROGRESS":
      return "bg-[#FFF3E8] text-[#A34D27]";

    case "COMPLETED":
      return "bg-[#E7F1EA] text-[#2F6B3F]";

    case "CANCELLED":
      return "bg-[#FCECEC] text-[#A33A3A]";

    case "DRAFT":
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status) => {
  switch (String(status).toUpperCase()) {
    case "READY":
      return CheckCircle2;

    case "IN_PROGRESS":
      return Clock3;

    case "COMPLETED":
      return CheckCircle2;

    case "CANCELLED":
      return XCircle;

    default:
      return Clock3;
  }
};

/* ============================================================
   HELPERS
============================================================ */

const getRequirementId = (requirement) =>
  requirement?.id ||
  requirement?.materialRequirementId ||
  requirement?.material_requirement_id ||
  "";

const getItemName = (requirement) =>
  requirement?.itemName ||
  requirement?.item_name ||
  requirement?.material?.name ||
  requirement?.material?.materialName ||
  requirement?.material?.material_name ||
  "Untitled";

const getCategory = (requirement) =>
  requirement?.category || requirement?.material?.category || "—";

const getSelection = (requirement) =>
  requirement?.selection ||
  requirement?.description ||
  requirement?.material?.description ||
  "—";

const getStyle = (requirement) =>
  requirement?.style || requirement?.material?.style || "";

const getFunctionalNeeds = (requirement) =>
  requirement?.functionalNeeds || requirement?.functional_needs || "";

const getMaterialCode = (requirement) =>
  requirement?.material?.materialCode ||
  requirement?.material?.material_code ||
  requirement?.materialCode ||
  requirement?.material_code ||
  "";

const getMaterialName = (requirement) =>
  requirement?.material?.name ||
  requirement?.material?.materialName ||
  requirement?.material?.material_name ||
  "";

const getStatus = (requirement) =>
  String(requirement?.status || "DRAFT").toUpperCase();

const getRequirementDate = (requirement) =>
  requirement?.requirementDate || requirement?.requirement_date || "";

const getUpdatedDate = (requirement) =>
  requirement?.updatedAt ||
  requirement?.updated_at ||
  requirement?.createdAt ||
  requirement?.created_at ||
  "";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.requirements)) {
    return response.requirements;
  }

  if (Array.isArray(response?.materialRequirements)) {
    return response.materialRequirements;
  }

  return [];
};

/* ============================================================
   MAIN
============================================================ */

export default function SingleProjectMaterialRequirements() {
  const nav = useNavigate();

  const { projectId } = useParams();

  const [q, setQ] = useState("");

  /* ==========================================================
     QUERY
  ========================================================== */

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMaterialRequirementsByProjectQuery(projectId, {
    skip: !projectId,
  });

  /* ==========================================================
     NORMALIZE
  ========================================================== */

  const rows = useMemo(() => {
    return normalizeArrayResponse(response);
  }, [response]);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((requirement) => {
      const values = [
        getItemName(requirement),
        getCategory(requirement),
        getSelection(requirement),
        getStyle(requirement),
        getFunctionalNeeds(requirement),
        getStatus(requirement),
        getMaterialCode(requirement),
        getMaterialName(requirement),
        getRequirementDate(requirement),
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [rows, q]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const total = rows.length;

  const completed = rows.filter(
    (requirement) => getStatus(requirement) === "COMPLETED",
  ).length;

  const ready = rows.filter(
    (requirement) => getStatus(requirement) === "READY",
  ).length;

  const inProgress = rows.filter(
    (requirement) => getStatus(requirement) === "IN_PROGRESS",
  ).length;

  const draft = rows.filter(
    (requirement) => getStatus(requirement) === "DRAFT",
  ).length;

  /* ==========================================================
     ACTIONS
  ========================================================== */

  const handleCreate = () => {
    nav(`/procurement/requirements/add?project_id=${projectId}`);
  };

  const handleView = (requirement) => {
    const id = getRequirementId(requirement);

    if (!id) {
      return;
    }

    nav(`/procurement/requirements/${id}`);
  };

  const handleEdit = (requirement) => {
    const id = getRequirementId(requirement);

    if (!id) {
      return;
    }

    nav(`/procurement/requirements/${id}/edit`);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Shell
      title="Project Material Requirements"
      subtitle={`${total} requirement${
        total !== 1 ? "s" : ""
      } for this project`}
      action={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button type="button" className={BRAND} onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Requirement
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground">Total</div>

            <div className="mt-1 text-xl font-bold">{total}</div>

            <div className="text-[10.5px] text-muted-foreground">
              requirements
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground">Draft</div>

            <div className="mt-1 text-xl font-bold">{draft}</div>

            <div className="text-[10.5px] text-muted-foreground">
              requirements
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground">Ready</div>

            <div className="mt-1 text-xl font-bold text-[#1F453B]">{ready}</div>

            <div className="text-[10.5px] text-muted-foreground">
              ready for procurement
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground">In Progress</div>

            <div className="mt-1 text-xl font-bold text-[#A34D27]">
              {inProgress}
            </div>

            <div className="text-[10.5px] text-muted-foreground">
              requirements
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground">Completed</div>

            <div className="mt-1 text-xl font-bold text-[#2F6B3F]">
              {completed}
            </div>

            <div className="text-[10.5px] text-muted-foreground">completed</div>
          </Card>
        </div>

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search material, category, selection, style..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="max-w-md"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>

          {q && (
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredRows.length}
              </span>{" "}
              of <span className="font-semibold text-foreground">{total}</span>{" "}
              requirements
            </span>
          )}
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {isError && (
          <Card>
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Package className="mb-3 h-9 w-9 text-muted-foreground/50" />

              <p className="text-sm font-semibold text-destructive">
                Failed to load material requirements
              </p>

              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                {error?.data?.message ||
                  error?.data?.detail ||
                  error?.error ||
                  "Please try again."}
              </p>

              <Button
                type="button"
                className={cn(BRAND, "mt-4")}
                size="sm"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* ====================================================
            TABLE
        ==================================================== */}

        {!isError && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-[#F4F6F7]">
                  <tr>
                    {/* MATERIAL */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Material
                    </th>

                    {/* CATEGORY */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Category
                    </th>

                    {/* SELECTION */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Selection
                    </th>

                    {/* STYLE */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Style
                    </th>

                    {/* REQUIRED BY */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Required By
                    </th>

                    {/* STATUS */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Status
                    </th>

                    {/* UPDATED */}
                    <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Updated
                    </th>

                    {/* ACTIONS */}
                    <th className="w-[110px] px-3 py-3 text-right text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* INITIAL LOADING */}
                  {isLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading material requirements...
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* ROWS */}
                  {!isLoading &&
                    filteredRows.map((requirement) => {
                      const id = getRequirementId(requirement);

                      const itemName = getItemName(requirement);

                      const category = getCategory(requirement);

                      const selection = getSelection(requirement);

                      const style = getStyle(requirement);

                      const materialCode = getMaterialCode(requirement);

                      const requirementDate = getRequirementDate(requirement);

                      const status = getStatus(requirement);

                      const updated = getUpdatedDate(requirement);

                      const StatusIcon = getStatusIcon(status);

                      return (
                        <tr
                          key={id || `${itemName}-${category}`}
                          onClick={() => handleView(requirement)}
                          className="cursor-pointer border-t border-[rgba(31,69,59,0.08)] transition-colors hover:bg-[#F4F6F7]"
                        >
                          {/* MATERIAL */}
                          <td className="px-3 py-3">
                            <div className="flex min-w-[190px] items-center gap-2">
                              <div
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  BRAND_SOFT,
                                )}
                              >
                                <Package
                                  className={cn("h-4 w-4", BRAND_TEXT)}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="truncate font-semibold text-[#333333]">
                                  {itemName}
                                </div>

                                {materialCode && (
                                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                                    {materialCode}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* CATEGORY */}
                          <td className="px-3 py-3 text-[#6B7B7C]">
                            {category}
                          </td>

                          {/* SELECTION */}
                          <td className="max-w-[300px] px-3 py-3 text-[#6B7B7C]">
                            <span className="block truncate">{selection}</span>
                          </td>

                          {/* STYLE */}
                          <td className="max-w-[180px] px-3 py-3 text-[#6B7B7C]">
                            <span className="block truncate">
                              {style || "—"}
                            </span>
                          </td>

                          {/* REQUIRED BY */}
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="flex items-center gap-1.5 text-[#6B7B7C]">
                              <CalendarDays className="h-3.5 w-3.5" />

                              {formatDate(requirementDate)}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-3 py-3">
                            <Badge
                              className={cn(
                                "gap-1 rounded-full px-2 py-1 text-[10px] font-semibold hover:bg-transparent",
                                getStatusClasses(status),
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />

                              {status.replaceAll("_", " ")}
                            </Badge>
                          </td>

                          {/* UPDATED */}
                          <td className="whitespace-nowrap px-3 py-3 text-[#6B7B7C]">
                            {formatDate(updated)}
                          </td>

                          {/* ACTIONS */}
                          <td
                            className="px-3 py-3 text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[#EAEEF0]"
                                onClick={() => handleView(requirement)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[#EAEEF0]"
                                onClick={() => handleEdit(requirement)}
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {/* EMPTY */}
                  {!isLoading && !isFetching && !filteredRows.length && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />

                        <p className="text-sm font-semibold">
                          {q
                            ? "No material requirements match your search."
                            : "No material requirements have been added to this project yet."}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {q
                            ? "Try changing your search terms."
                            : "Create the first material requirement for this project."}
                        </p>

                        {!q && (
                          <Button
                            type="button"
                            className={cn(BRAND, "mt-4")}
                            size="sm"
                            onClick={handleCreate}
                          >
                            <Plus className="h-4 w-4" />
                            New Requirement
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BACKGROUND REFRESH */}
            {isFetching && !isLoading && (
              <div className="flex items-center justify-center gap-2 border-t bg-muted/20 py-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Refreshing material requirements...
              </div>
            )}
          </Card>
        )}
      </div>
    </Shell>
  );
}
