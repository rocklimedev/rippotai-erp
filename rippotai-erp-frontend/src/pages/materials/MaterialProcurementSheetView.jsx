import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  Download,
  Edit,
  FileSpreadsheet,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import {
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
} from "../../api/procuerment/material-procurement.api";

import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const numberValue = (value) => Number(value || 0);

const formatNumber = (value, maximumFractionDigits = 2) =>
  numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const formatCurrency = (value) =>
  numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Resolve display values from item + materialMaster (matches your Excel columns) */
const resolveItem = (item) => {
  const master = item.materialMaster || {};

  return {
    serialNo: item.serialNo,
    area: item.area || "—",
    location: item.location || "—",
    material: item.material || master.category || master.name || "—",
    brand: item.brand || master.brand || "—",
    name: item.name || master.name || "—",
    code: item.code || master.material_code || "—",
    wallArea: item.wallArea,
    floorArea: item.floorArea,
    ceilingArea: item.ceilingArea,
    totalArea: item.totalArea,
    quantity: item.quantity,
    price: item.price,
    amount: item.amount,
  };
};

export default function MaterialProcurementSheetView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useGetMaterialProcurementQuery(id, {
    skip: !id,
  });

  const [submitMaterialProcurement, { isLoading: submitting }] =
    useSubmitMaterialProcurementMutation();

  const procurement = response?.data ?? response;

  if (isLoading || isFetching) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Material Procurement"
          description="Loading procurement sheet..."
        />
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading procurement sheet...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !procurement) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Material Procurement"
          description="The requested procurement sheet could not be found."
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Unable to load this procurement sheet.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/material-procurement")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Procurement
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = procurement.items || [];
  const resolvedItems = items.map(resolveItem);

  const project = procurement.project;
  const projectName =
    project?.name ||
    project?.projectName ||
    project?.title ||
    project?.code ||
    procurement.projectId ||
    "—";

  const totalArea = resolvedItems.reduce(
    (total, item) => total + numberValue(item.totalArea),
    0,
  );
  const totalQuantity = resolvedItems.reduce(
    (total, item) => total + numberValue(item.quantity),
    0,
  );
  const totalAmount = resolvedItems.reduce(
    (total, item) => total + numberValue(item.amount),
    0,
  );

  const handleSubmit = async () => {
    try {
      await submitMaterialProcurement(procurement.id).unwrap();
      toast.success("Material procurement submitted.");
    } catch (submitError) {
      toast.error(
        submitError?.data?.message ||
          submitError?.message ||
          "Unable to submit procurement.",
      );
    }
  };

  /** Download Excel that exactly matches the shared template structure */
  const handleDownloadExcel = () => {
    try {
      // Title row + blank row + header row (exactly like your template)
      const title = "MATERIAL PROCUREMENT LIST PROJECT MATERIAL";
      const headers = [
        "S. No.",
        "Area",
        "Location",
        "Material",
        "Brand",
        "Name",
        "Code",
        "Wall(Sq.ft)",
        "Floor(Sq.ft)",
        "Ceiling(Sq.ft)",
        "Total Area(Sq.ft)",
        "Quantity",
        "Price",
        "Amount",
      ];

      const dataRows = resolvedItems.map((item, index) => [
        item.serialNo ?? index + 1,
        item.area,
        item.location,
        item.material,
        item.brand,
        item.name,
        item.code,
        numberValue(item.wallArea),
        numberValue(item.floorArea),
        numberValue(item.ceilingArea),
        numberValue(item.totalArea),
        numberValue(item.quantity),
        numberValue(item.price),
        numberValue(item.amount),
      ]);

      // Totals row
      const totalsRow = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Totals",
        numberValue(totalArea),
        numberValue(totalQuantity),
        "",
        numberValue(totalAmount),
      ];

      const sheetData = [
        [title],
        [], // blank row under title (matches typical Excel layout)
        headers,
        ...dataRows,
        totalsRow,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths (reasonable defaults matching the template)
      worksheet["!cols"] = [
        { wch: 8 }, // S. No.
        { wch: 14 }, // Area
        { wch: 14 }, // Location
        { wch: 18 }, // Material
        { wch: 12 }, // Brand
        { wch: 22 }, // Name
        { wch: 14 }, // Code
        { wch: 12 }, // Wall
        { wch: 12 }, // Floor
        { wch: 14 }, // Ceiling
        { wch: 16 }, // Total Area
        { wch: 12 }, // Quantity
        { wch: 12 }, // Price
        { wch: 14 }, // Amount
      ];

      // Merge title across all columns
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Material Procurement");

      const fileName = `${procurement.procurementNo || "MP"}-Material-Procurement.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Excel downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file.");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={procurement.procurementNo || "Material Procurement"}
        description="Material procurement sheet details."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/material-procurement")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-wrap gap-2">
          {/* Download Excel – always available */}
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>

          {procurement.status === "DRAFT" && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/material-procurement/new?id=${procurement.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>

              <Button disabled={submitting} onClick={handleSubmit}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Procurement No.</p>
            <p className="mt-1 text-lg font-semibold">
              {procurement.procurementNo || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Project</p>
            <p className="mt-1 truncate text-lg font-semibold">{projectName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                  procurement.status,
                )}`}
              >
                {statusLabel(procurement.status)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="mt-1 text-lg font-semibold">
              {procurement.createdAt
                ? new Date(procurement.createdAt).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Procurement info */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Project
              </p>
              <p className="mt-1 font-medium">{projectName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Created By
              </p>
              <p className="mt-1 font-medium">
                {procurement.createdBy?.name ||
                  procurement.createdBy?.fullName ||
                  procurement.createdBy?.email ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Updated
              </p>
              <p className="mt-1 font-medium">
                {procurement.updatedAt
                  ? new Date(procurement.updatedAt).toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
          </div>

          {procurement.remarks && (
            <div className="mt-6 border-t pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Remarks
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {procurement.remarks}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== Excel-like sheet view ========== */}
      <Card className="overflow-hidden border-2 border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-[#217346]/px-4 py-3 text-white">
          {/* Excel green header bar */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <div>
              <CardTitle className="text-base font-semibold tracking-wide text-white">
                MATERIAL PROCUREMENT LIST – {projectName}
              </CardTitle>
              <p className="text-xs text-white/80">
                {items.length} material {items.length === 1 ? "item" : "items"}{" "}
                · {procurement.procurementNo}
              </p>
            </div>
          </div>
          <Calculator className="h-5 w-5 text-white/80" />
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Excel-style table */}
            <table className="w-full min-w-[1450px] border-collapse text-sm">
              <thead>
                {/* Title row (like Excel merged title) */}
                <tr className="bg-[#e2efda]">
                  <th
                    colSpan={14}
                    className="border border-[#b4b4b4] px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-[#1f4e2e]"
                  >
                    MATERIAL PROCUREMENT LIST PROJECT MATERIAL
                  </th>
                </tr>

                {/* Column headers – classic Excel look */}
                <tr className="bg-[#d9e1f2] text-[13px]">
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    S. No.
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Area
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Location
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Material
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Brand
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Name
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-left font-semibold text-slate-800">
                    Code
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Wall(Sq.ft)
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Floor(Sq.ft)
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Ceiling(Sq.ft)
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Total Area(Sq.ft)
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Quantity
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Price
                  </th>
                  <th className="border border-[#b4b4b4] px-3 py-2 text-right font-semibold text-slate-800">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {resolvedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="border border-[#b4b4b4] px-4 py-12 text-center text-muted-foreground"
                    >
                      No material items found.
                    </td>
                  </tr>
                ) : (
                  resolvedItems.map((item, index) => (
                    <tr
                      key={items[index]?.id || `${procurement.id}-${index}`}
                      className={
                        index % 2 === 0
                          ? "bg-white hover:bg-[#f2f2f2]"
                          : "bg-[#fafafa] hover:bg-[#f2f2f2]"
                      }
                    >
                      <td className="border border-[#b4b4b4] px-3 py-1.5 font-medium text-slate-700">
                        {item.serialNo ?? index + 1}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5">
                        {item.area}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5">
                        {item.location}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 font-medium">
                        {item.material}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5">
                        {item.brand}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5">
                        {item.name}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 font-mono text-xs">
                        {item.code}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right tabular-nums">
                        {formatNumber(item.wallArea)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right tabular-nums">
                        {formatNumber(item.floorArea)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right tabular-nums">
                        {formatNumber(item.ceilingArea)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right font-medium tabular-nums">
                        {formatNumber(item.totalArea)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right tabular-nums">
                        {formatNumber(item.quantity, 3)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right tabular-nums">
                        {formatNumber(item.price, 2)}
                      </td>
                      <td className="border border-[#b4b4b4] px-3 py-1.5 text-right font-medium tabular-nums">
                        {formatNumber(item.amount, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals row – Excel style */}
              <tfoot>
                <tr className="bg-[#fff2cc] font-semibold">
                  <td
                    colSpan={10}
                    className="border border-[#b4b4b4] px-3 py-2.5 text-right text-slate-800"
                  >
                    Totals
                  </td>
                  <td className="border border-[#b4b4b4] px-3 py-2.5 text-right tabular-nums">
                    {formatNumber(totalArea)}
                  </td>
                  <td className="border border-[#b4b4b4] px-3 py-2.5 text-right tabular-nums">
                    {formatNumber(totalQuantity, 3)}
                  </td>
                  <td className="border border-[#b4b4b4] px-3 py-2.5" />
                  <td className="border border-[#b4b4b4] px-3 py-2.5 text-right tabular-nums">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary footer */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Procurement Summary</p>
            <p className="text-sm text-muted-foreground">
              {items.length} items · {formatNumber(totalQuantity, 3)} total
              quantity
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">
              Total Procurement Value
            </p>
            <p className="text-2xl font-semibold">
              ₹ {formatCurrency(totalAmount)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
