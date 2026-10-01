import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  FileSpreadsheet,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Pencil,
} from "lucide-react";

import { useGetMaterialProcurementsQuery } from "../../api/procuerment/material-procurement.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "IN_PROGRESS",
  "PARTIALLY_PROCURED",
  "PROCURED",
  "CANCELLED",
];

const statusLabel = (status) => {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const statusClass = (status) => {
  switch (status) {
    case "DRAFT":
      return "bg-muted text-muted-foreground";

    case "SUBMITTED":
      return "bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";

    case "PARTIALLY_PROCURED":
      return "bg-orange-50 text-orange-700";

    case "PROCURED":
      return "bg-green-50 text-green-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-muted text-muted-foreground";
  }
};

const getProjectName = (procurement, projects) => {
  if (procurement.project?.name) {
    return procurement.project.name;
  }

  if (procurement.project?.projectName) {
    return procurement.project.projectName;
  }

  const project = projects.find((item) => item.id === procurement.projectId);

  return (
    project?.name ||
    project?.projectName ||
    project?.title ||
    project?.code ||
    procurement.projectId ||
    "—"
  );
};

const getItems = (procurement) => procurement.items || [];

const getTotalAmount = (procurement) =>
  getItems(procurement).reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

const getTotalQuantity = (procurement) =>
  getItems(procurement).reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

export default function MaterialProcurementSheetList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [projectFilter, setProjectFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: procurementResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetMaterialProcurementsQuery(
    projectFilter
      ? {
          projectId: projectFilter,
        }
      : {},
  );

  const { data: projectsResponse } = useGetProjectsQuery();

  const procurements =
    procurementResponse?.data ??
    procurementResponse?.data?.data ??
    procurementResponse ??
    [];

  const projects =
    projectsResponse?.data ??
    projectsResponse?.data?.data ??
    projectsResponse ??
    [];

  const filteredProcurements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return procurements.filter((procurement) => {
      const matchesStatus =
        statusFilter === "ALL" || procurement.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const projectName = getProjectName(procurement, projects);

      const itemText = getItems(procurement)
        .map((item) =>
          [
            item.material,
            item.brand,
            item.name,
            item.code,
            item.area,
            item.location,
          ]
            .filter(Boolean)
            .join(" "),
        )
        .join(" ");

      return [
        procurement.procurementNo,
        projectName,
        procurement.status,
        itemText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [procurements, projects, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Procurement"
        description="Manage digital material procurement sheets for projects."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button onClick={() => navigate("/material-procurement/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Procurement
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search procurement, material, brand, code..."
                className="pl-9"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Projects</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ||
                    project.projectName ||
                    project.title ||
                    project.code ||
                    project.id}
                </option>
              ))}
            </select>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All Statuses" : statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading material procurements...
            </div>
          ) : filteredProcurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              </div>

              <div>
                <h3 className="font-medium">No procurement sheets found</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a material procurement sheet to get started.
                </p>
              </div>

              <Button onClick={() => navigate("/material-procurement/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Procurement
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium">
                      Procurement No.
                    </th>

                    <th className="px-5 py-3 text-left font-medium">Project</th>

                    <th className="px-5 py-3 text-left font-medium">
                      Materials
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-right font-medium">Amount</th>

                    <th className="px-5 py-3 text-left font-medium">Status</th>

                    <th className="px-5 py-3 text-left font-medium">Created</th>

                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProcurements.map((procurement) => {
                    const items = getItems(procurement);

                    const totalAmount = getTotalAmount(procurement);

                    const totalQuantity = getTotalQuantity(procurement);

                    return (
                      <tr
                        key={procurement.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/material-procurement/${procurement.id}`}
                            className="font-medium hover:underline"
                          >
                            {procurement.procurementNo || procurement.id}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-[260px] truncate">
                            {getProjectName(procurement, projects)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium">{items.length}</span>{" "}
                          <span className="text-muted-foreground">
                            item
                            {items.length === 1 ? "" : "s"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {totalQuantity.toLocaleString("en-IN", {
                            maximumFractionDigits: 3,
                          })}
                        </td>

                        <td className="px-5 py-4 text-right font-medium">
                          ₹{" "}
                          {totalAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                              procurement.status,
                            )}`}
                          >
                            {statusLabel(procurement.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {procurement.createdAt
                            ? new Date(
                                procurement.createdAt,
                              ).toLocaleDateString("en-IN")
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View"
                              asChild
                            >
                              <Link
                                to={`/procurement/material-procurement/${procurement.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>

                            {procurement.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                asChild
                              >
                                <Link
                                  to={`/material-procurement/new?id=${procurement.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {filteredProcurements.length}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {procurements.length}
        </span>{" "}
        procurement sheets
      </div>
    </div>
  );
}
