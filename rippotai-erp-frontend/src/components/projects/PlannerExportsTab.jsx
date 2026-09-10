import React, { useMemo, useState } from "react";

import { toast } from "sonner";

import { Check, Download, FileText } from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  useGetPlannerItemsQuery,
  useGetProjectLocationsQuery,
} from "../../api/documents/project-planner.api";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ============================================================
// HELPERS
// ============================================================

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function flattenLocations(locations = []) {
  const result = [];

  const walk = (items) => {
    items.forEach((item) => {
      result.push(item);
      if (Array.isArray(item.children)) walk(item.children);
    });
  };

  walk(locations);
  return result;
}

function getFloorLocations(locations) {
  return flattenLocations(locations)
    .filter((location) => location.type === "FLOOR")
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

function getItemLocation(item, locationId) {
  return (item.locations || []).find(
    (relation) =>
      relation.location_id === locationId ||
      relation.location?.id === locationId,
  );
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PlannerExportsTab({
  projectId,
  plannerId,
  module,
  moduleLabel,
}) {
  const [exporting, setExporting] = useState(false);

  // PLANNER ITEMS
  const { data: plannerItemsResponse, isFetching: isLoadingItems } =
    useGetPlannerItemsQuery(
      { plannerId: plannerId || "" },
      { skip: !plannerId },
    );

  const plannerItems = unwrapArray(plannerItemsResponse);

  // PROJECT LOCATIONS
  const { data: locationsResponse, isFetching: isLoadingLocations } =
    useGetProjectLocationsQuery(projectId, { skip: !projectId });

  const locationTree = unwrapArray(locationsResponse);
  const floors = useMemo(() => getFloorLocations(locationTree), [locationTree]);

  // GROUP BY PHASE
  const itemsByPhase = useMemo(() => {
    const map = new Map();

    plannerItems.forEach((item) => {
      const phaseId = item.phase_id || item.phase?.id || "NO_PHASE";
      if (!map.has(phaseId)) {
        map.set(phaseId, { phase: item.phase || null, items: [] });
      }
      map.get(phaseId).items.push(item);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(a.phase?.sort_order || 0) - Number(b.phase?.sort_order || 0),
    );
  }, [plannerItems]);

  // STATS
  const stats = useMemo(() => {
    const applicable = plannerItems.filter(
      (item) => item.status !== "NOT_APPLICABLE",
    );
    const completed = applicable.filter(
      (item) => item.status === "COMPLETED",
    ).length;

    const progress =
      applicable.length > 0
        ? Math.round(
            applicable.reduce(
              (sum, item) => sum + Number(item.progress_pct || 0),
              0,
            ) / applicable.length,
          )
        : 0;

    return { total: plannerItems.length, completed, progress };
  }, [plannerItems]);

  // GENERATE PDF
  const handleGenerate = async () => {
    if (!plannerId) return toast.error("Planner is not available");
    if (plannerItems.length === 0)
      return toast.error("There are no planner items to export");

    const exportElement = document.getElementById("planner-export-content");
    if (!exportElement) return toast.error("Export content not found");

    setExporting(true);

    try {
      const canvas = await html2canvas(exportElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/jpeg", 0.95);

      let remainingHeight = imageHeight;
      let position = 0;

      pdf.addImage(imageData, "JPEG", 0, position, imageWidth, imageHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imageData, "JPEG", 0, position, imageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      const safeModule = String(module || "planner")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");

      pdf.save(`project_planner_${safeModule}_${todayIso()}.pdf`);
      toast.success("Planner PDF generated");
    } catch (error) {
      console.error("Planner export failed:", error);
      toast.error("Failed to generate planner PDF");
    } finally {
      setExporting(false);
    }
  };

  const isLoading = isLoadingItems || isLoadingLocations;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-5">
      {/* EXPORT HEADER */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {moduleLabel} export
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate the current planner as a landscape PDF.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={exporting || isLoading || plannerItems.length === 0}
            >
              {exporting ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Generating…" : "Generate PDF"}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryItem label="Phases" value={itemsByPhase.length} />
            <SummaryItem label="Work items" value={stats.total} />
            <SummaryItem label="Floors" value={floors.length} />
            <SummaryItem label="Progress" value={`${stats.progress}%`} />
          </div>
        </CardContent>
      </Card>

      {/* EXPORT PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export preview</CardTitle>
          <CardDescription>
            This is the content that will be included in the PDF.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : plannerItems.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                Nothing to export
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Initialize the planner before generating a PDF.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <div
                id="planner-export-content"
                className="min-w-[1000px] bg-white p-6"
              >
                {/* PDF HEADER */}
                <div className="mb-6 border-b pb-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">
                    Project planner
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-primary">
                    {moduleLabel}
                  </h2>
                  <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
                    <span>Generated: {formatDate(todayIso())}</span>
                    <span>Progress: {stats.progress}%</span>
                    <span>
                      Completed: {stats.completed} / {stats.total}
                    </span>
                  </div>
                </div>

                {/* PHASES */}
                <div className="space-y-6">
                  {itemsByPhase.map(({ phase, items }) => (
                    <div key={phase?.id || "NO_PHASE"}>
                      <div className="mb-2 rounded-md bg-muted px-3 py-2">
                        <div className="flex items-center gap-2">
                          {phase?.phase_code && (
                            <span className="text-xs font-medium tracking-wide text-muted-foreground">
                              {phase.phase_code}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-primary">
                            {phase?.title || "Phase"}
                          </span>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Work</TableHead>
                            <TableHead>Details</TableHead>
                            {floors.map((floor) => (
                              <TableHead key={floor.id} className="text-center">
                                {floor.name}
                              </TableHead>
                            ))}
                            <TableHead className="text-center">%</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.work_name || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.details || "—"}
                              </TableCell>

                              {floors.map((floor) => {
                                const relation = getItemLocation(
                                  item,
                                  floor.id,
                                );
                                const complete =
                                  relation?.status === "COMPLETED" ||
                                  Number(relation?.progress_pct || 0) >= 100;

                                return (
                                  <TableCell
                                    key={floor.id}
                                    className="text-center"
                                  >
                                    {!relation ? (
                                      <span className="text-muted-foreground/40">
                                        —
                                      </span>
                                    ) : complete ? (
                                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                                        <Check className="h-3 w-3" />
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {Math.round(
                                          Number(relation.progress_pct || 0),
                                        )}
                                        %
                                      </span>
                                    )}
                                  </TableCell>
                                );
                              })}

                              <TableCell className="text-center font-semibold">
                                {Math.round(Number(item.progress_pct || 0))}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default PlannerExportsTab;
