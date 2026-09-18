import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Edit3,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  Truck,
  Package,
  History,
  MoreHorizontal,
  ShieldCheck,
  FileText,
  CalendarDays,
  MapPin,
  User,
  ClipboardCheck,
  ChevronRight,
  X,
  Check,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetDeliveryChallanQuery,
  useUpdateDeliveryChallanMutation,
  useCompleteDeliveryChallanMutation,
} from "../../api/procuerment/delivery-challan.api";

/**
 * shadcn/ui
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";

export default function DeliveryChallanView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const [itemHistoryOpen, setItemHistoryOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [statusRemarks, setStatusRemarks] = useState("");

  const [completeRemarks, setCompleteRemarks] = useState("");

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetDeliveryChallanQuery(id, {
    skip: !id,
  });

  const [updateDeliveryChallan, updateState] =
    useUpdateDeliveryChallanMutation();

  const [completeDeliveryChallan, completeState] =
    useCompleteDeliveryChallanMutation();

  /**
   * Support both:
   *
   * response
   * response.data
   */
  const challan = useMemo(() => {
    if (!response) return null;

    if (response?.data && !Array.isArray(response.data)) {
      return response.data;
    }

    return response;
  }, [response]);

  const items = challan?.items || [];

  /**
   * -------------------------------------------------------------
   * HELPERS
   * -------------------------------------------------------------
   */

  const formatDate = (value) => {
    if (!value) return "—";

    const str = String(value).slice(0, 10);
    const parts = str.split("-");

    if (parts.length !== 3) return value;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  /**
   * FIX: this helper previously returned a raw JS `number` in the
   * `Number.isInteger(n)` branch instead of a `string`. jsPDF's
   * `doc.text()` calls `.split()` internally on whatever it's given,
   * which throws a TypeError when passed a number (not a string).
   * That threw inside `downloadPdf()`'s try block and always landed
   * in the catch -> "Unable to generate delivery challan PDF" toast.
   *
   * Now it always returns a string, so both jsPDF (`doc.text`) and
   * the JSX (`{number(...)}`) call sites are safe.
   */
  const number = (value) => {
    const n = Number(value || 0);

    if (Number.isInteger(n)) {
      return String(n);
    }

    return n.toFixed(3);
  };

  /**
   * -------------------------------------------------------------
   * ITEM SUMMARY
   * -------------------------------------------------------------
   */

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.ordered += Number(item.quantity || 0);
        acc.accepted += Number(item.accepted_quantity || 0);
        acc.shortage += Number(item.shortage_quantity || 0);
        acc.damaged += Number(item.damaged_quantity || 0);
        acc.rejected += Number(item.rejected_quantity || 0);

        return acc;
      },
      {
        ordered: 0,
        accepted: 0,
        shortage: 0,
        damaged: 0,
        rejected: 0,
      },
    );
  }, [items]);

  const hasOutstandingItems =
    summary.shortage > 0 ||
    summary.damaged > 0 ||
    summary.rejected > 0 ||
    summary.accepted < summary.ordered;

  /**
   * -------------------------------------------------------------
   * STATUS
   * -------------------------------------------------------------
   */

  const statusConfig = {
    DRAFT: {
      label: "Draft",
      icon: Clock3,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    },

    PENDING: {
      label: "Pending",
      icon: Clock3,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },

    PARTIALLY_ACCEPTED: {
      label: "Partially Accepted",
      icon: AlertCircle,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },

    ACCEPTED: {
      label: "Accepted",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    REJECTED: {
      label: "Rejected",
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-700",
    },

    COMPLETED: {
      label: "Completed",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };

  const currentStatus = statusConfig[challan?.status] || statusConfig.PENDING;

  const StatusIcon = currentStatus.icon;

  /**
   * -------------------------------------------------------------
   * OPEN ITEM HISTORY
   * -------------------------------------------------------------
   */

  const openItemHistory = (item) => {
    setSelectedItem(item);
    setItemHistoryOpen(true);
  };

  /**
   * -------------------------------------------------------------
   * UPDATE STATUS
   * -------------------------------------------------------------
   */

  const openStatusDialog = () => {
    setSelectedStatus(challan?.status || "PENDING");
    setStatusRemarks("");
    setStatusDialogOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Select a status");
      return;
    }

    try {
      await updateDeliveryChallan({
        id,
        data: {
          status: selectedStatus,
          status_remarks: statusRemarks || null,
        },
      }).unwrap();

      toast.success("Delivery challan status updated");

      setStatusDialogOpen(false);
    } catch (err) {
      toast.error(
        err?.data?.message || "Failed to update delivery challan status",
      );
    }
  };

  /**
   * -------------------------------------------------------------
   * COMPLETE CHALLAN
   * -------------------------------------------------------------
   */

  const submitComplete = async () => {
    try {
      await completeDeliveryChallan({
        id,
        data: {
          remarks: completeRemarks || null,
        },
      }).unwrap();

      toast.success("Delivery challan completed successfully");

      setCompleteDialogOpen(false);
      setCompleteRemarks("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to complete delivery challan");
    }
  };

  /**
   * -------------------------------------------------------------
   * DOWNLOAD A4 PDF
   *
   * This does NOT use window.print().
   *
   * We dynamically import jsPDF so the page itself doesn't need
   * to be printed.
   * -------------------------------------------------------------
   */

  const downloadPdf = async () => {
    try {
      toast.loading("Preparing A4 PDF...", {
        id: "dc-pdf",
      });

      const jsPDFModule = await import("jspdf");

      const { default: jsPDF } = jsPDFModule;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;

      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      let y = 15;

      /**
       * Header
       */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("DELIVERY CHALLAN", pageWidth / 2, y, {
        align: "center",
      });

      y += 7;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text("MATERIAL", pageWidth / 2, y, {
        align: "center",
      });

      y += 4;

      doc.setFontSize(7);

      doc.text("ARCHITECTURE · INTERIORS · TURNKEY", pageWidth / 2, y, {
        align: "center",
      });

      y += 10;

      /**
       * Challan details
       */
      doc.setFontSize(8);

      doc.setFont("helvetica", "bold");

      doc.text("CHALLAN NO", margin, y);

      doc.text("DATE", margin + 70, y);

      doc.text("STATUS", margin + 120, y);

      y += 5;

      doc.setFont("helvetica", "normal");

      doc.text(challan?.challan_number || "—", margin, y);

      doc.text(formatDate(challan?.challan_date), margin + 70, y);

      doc.text(currentStatus.label, margin + 120, y);

      y += 9;

      /**
       * Site address
       */
      doc.setFont("helvetica", "bold");

      doc.text("PROJECT SITE ADDRESS", margin, y);

      y += 5;

      doc.setFont("helvetica", "normal");

      const addressLines = doc.splitTextToSize(
        challan?.site_address || "—",
        contentWidth,
      );

      doc.text(addressLines, margin, y);

      y += Math.max(addressLines.length, 1) * 4 + 6;

      /**
       * Material table
       */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);

      const tableX = margin;
      const tableY = y;

      const col = {
        sno: 10,
        description: 105,
        unit: 25,
        qty: 30,
      };

      const rowHeight = 7;

      doc.rect(tableX, tableY, contentWidth, rowHeight);

      let x = tableX;

      doc.line(x + col.sno, tableY, x + col.sno, tableY + rowHeight);

      doc.line(
        x + col.sno + col.description,
        tableY,
        x + col.sno + col.description,
        tableY + rowHeight,
      );

      doc.line(
        x + col.sno + col.description + col.unit,
        tableY,
        x + col.sno + col.description + col.unit,
        tableY + rowHeight,
      );

      doc.text("S.No", tableX + 2, tableY + 4.5);

      doc.text("DESCRIPTION OF GOODS", tableX + col.sno + 2, tableY + 4.5);

      doc.text("UNIT", tableX + col.sno + col.description + 2, tableY + 4.5);

      doc.text(
        "QTY",
        tableX + col.sno + col.description + col.unit + 2,
        tableY + 4.5,
      );

      y += rowHeight;

      doc.setFont("helvetica", "normal");

      /**
       * Items
       */
      items.forEach((item, index) => {
        const description = item.description || item.material?.name || "—";

        const unit = item.material?.unit?.code || item.unit || "—";

        const qty = number(item.quantity);

        const descriptionLines = doc.splitTextToSize(
          description,
          col.description - 4,
        );

        const currentRowHeight = Math.max(
          rowHeight,
          descriptionLines.length * 4 + 4,
        );

        doc.rect(tableX, y, contentWidth, currentRowHeight);

        doc.line(tableX + col.sno, y, tableX + col.sno, y + currentRowHeight);

        doc.line(
          tableX + col.sno + col.description,
          y,
          tableX + col.sno + col.description,
          y + currentRowHeight,
        );

        doc.line(
          tableX + col.sno + col.description + col.unit,
          y,
          tableX + col.sno + col.description + col.unit,
          y + currentRowHeight,
        );

        doc.text(String(index + 1), tableX + 2, y + 4.5);

        doc.text(descriptionLines, tableX + col.sno + 2, y + 4.5);

        doc.text(unit, tableX + col.sno + col.description + 2, y + 4.5);

        doc.text(
          qty,
          tableX + col.sno + col.description + col.unit + 2,
          y + 4.5,
        );

        y += currentRowHeight;
      });

      /**
       * Empty rows to retain PDF appearance.
       */
      const minimumRows = 10;

      if (items.length < minimumRows) {
        for (let index = items.length; index < minimumRows; index++) {
          doc.rect(tableX, y, contentWidth, rowHeight);

          doc.line(tableX + col.sno, y, tableX + col.sno, y + rowHeight);

          doc.line(
            tableX + col.sno + col.description,
            y,
            tableX + col.sno + col.description,
            y + rowHeight,
          );

          doc.line(
            tableX + col.sno + col.description + col.unit,
            y,
            tableX + col.sno + col.description + col.unit,
            y + rowHeight,
          );

          doc.text(String(index + 1), tableX + 2, y + 4.5);

          y += rowHeight;
        }
      }

      y += 8;

      /**
       * Remarks
       */
      doc.setFont("helvetica", "bold");

      doc.text("REMARKS / DISCREPANCY", margin, y);

      y += 5;

      doc.setFont("helvetica", "normal");

      const remarks =
        challan?.general_remarks || challan?.discrepancy_notes || "—";

      const remarkLines = doc.splitTextToSize(remarks, contentWidth);

      doc.rect(margin, y, contentWidth, 20);

      doc.text(remarkLines, margin + 3, y + 5);

      y += 30;

      /**
       * Signatures
       */
      doc.setFont("helvetica", "bold");

      doc.text("DISPATCHED BY", margin, y);

      doc.text("RECEIVED BY", margin + 100, y);

      y += 9;

      doc.setFont("helvetica", "normal");

      doc.text(
        `Name · ${challan?.dispatched_by || "____________________"}`,
        margin,
        y,
      );

      doc.text(
        `Name · ${challan?.received_by || "____________________"}`,
        margin + 100,
        y,
      );

      y += 7;

      doc.text(
        `Date · ${
          formatDate(challan?.dispatched_at) === "—"
            ? "____________________"
            : formatDate(challan?.dispatched_at)
        }`,
        margin,
        y,
      );

      doc.text(
        `Date · ${
          formatDate(challan?.received_at) === "—"
            ? "____________________"
            : formatDate(challan?.received_at)
        }`,
        margin + 100,
        y,
      );

      /**
       * Footer
       */
      doc.setFontSize(7);
      doc.setTextColor(120);

      doc.text("Generated from INOS ERP", pageWidth / 2, pageHeight - 8, {
        align: "center",
      });

      doc.save(`${challan?.challan_number || "delivery-challan"}.pdf`);

      toast.success("A4 PDF downloaded", {
        id: "dc-pdf",
      });
    } catch (err) {
      console.error(err);

      toast.error("Unable to generate delivery challan PDF", {
        id: "dc-pdf",
      });
    }
  };

  /**
   * -------------------------------------------------------------
   * LOADING
   * -------------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Truck size={32} className="animate-pulse text-[#1F453B]" />

          <span>Loading delivery challan...</span>
        </div>
      </div>
    );
  }

  /**
   * -------------------------------------------------------------
   * ERROR
   * -------------------------------------------------------------
   */

  if (isError || !challan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center">
            <XCircle size={36} className="mx-auto text-red-500 mb-3" />

            <h2 className="font-semibold text-lg">
              Delivery Challan not found
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              {error?.data?.message ||
                "The delivery challan could not be loaded."}
            </p>

            <Button
              variant="outline"
              className="mt-5"
              onClick={() => nav("/procurement/delivery-challans")}
            >
              <ArrowLeft size={16} />
              Back to Delivery Challans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      {/* ==========================================================
          HEADER
      =========================================================== */}
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="max-w-[1500px] mx-auto px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => nav("/procurement/delivery-challans")}
              >
                <ArrowLeft size={18} />
              </Button>

              <div className="h-9 w-9 rounded-lg bg-[#E8EFEB] flex items-center justify-center">
                <Truck size={18} className="text-[#1F453B]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-[#1F453B] truncate">
                    {challan.challan_number}
                  </h1>

                  <Badge
                    variant="outline"
                    className={`gap-1.5 ${currentStatus.className}`}
                  >
                    <StatusIcon size={13} />
                    {currentStatus.label}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Delivery Challan · {formatDate(challan.challan_date)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isFetching && (
                <RefreshCcw
                  size={15}
                  className="animate-spin text-muted-foreground"
                />
              )}

              <Button variant="outline" onClick={downloadPdf}>
                <Download size={16} />
                Download A4 PDF
              </Button>

              <Button
                variant="outline"
                onClick={() => nav(`/procurement/delivery-challans/${id}/edit`)}
              >
                <Edit3 size={16} />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openStatusDialog}>
                    <RefreshCcw size={15} />
                    Update Status
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      if (!hasOutstandingItems) {
                        setCompleteDialogOpen(true);
                      } else {
                        toast.info(
                          "This challan still has outstanding quantities.",
                        );
                      }
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Complete Challan
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => toast.info("History is available below.")}
                  >
                    <History size={15} />
                    View History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          BODY
      =========================================================== */}
      <div className="max-w-[1500px] mx-auto px-5 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* ======================================================
              LEFT DOCUMENT AREA
          ======================================================= */}
          <div className="space-y-5">
            {/* Status alert */}
            {challan.status === "PARTIALLY_ACCEPTED" && (
              <Card className="border-amber-200 bg-amber-50/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />

                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">
                        Delivery partially accepted
                      </p>

                      <p className="text-sm text-amber-800 mt-1">
                        Some quantities are still short, damaged, rejected, or
                        otherwise not fully accepted.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setCompleteDialogOpen(true)}
                      className="bg-[#1F453B] hover:bg-[#16372F]"
                    >
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ====================================================
                A4 DOCUMENT PREVIEW
            ===================================================== */}
            <Card className="border-[#1F453B]/10 overflow-hidden">
              <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Delivery Challan</CardTitle>

                  <CardDescription>A4 document preview</CardDescription>
                </div>

                <Button variant="outline" size="sm" onClick={downloadPdf}>
                  <Download size={15} />
                  Download
                </Button>
              </CardHeader>

              <CardContent className="p-8 bg-[#EEF1F0]">
                {/* A4 PAGE */}
                <div
                  id="delivery-challan-a4"
                  className="mx-auto bg-white text-black shadow-xl"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    maxWidth: "100%",
                    padding: "14mm",
                  }}
                >
                  {/* PDF HEADER */}
                  <div className="text-center">
                    <h2 className="text-[22px] font-bold tracking-wide">
                      DELIVERY CHALLAN
                    </h2>

                    <div className="text-[10px] font-medium mt-1">MATERIAL</div>

                    <div className="text-[8px] mt-0.5 tracking-wide">
                      ARCHITECTURE · INTERIORS · TURNKEY
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 border-t border-black pt-3">
                    <div>
                      <div className="text-[9px] font-bold">CHALLAN NO</div>

                      <div className="text-[11px] mt-1">
                        {challan.challan_number || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-bold">DATE</div>

                      <div className="text-[11px] mt-1">
                        {formatDate(challan.challan_date)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-bold">STATUS</div>

                      <div className="text-[11px] mt-1">
                        {currentStatus.label}
                      </div>
                    </div>
                  </div>

                  {/* SITE */}
                  <div className="mt-7">
                    <div className="text-[9px] font-bold">
                      PROJECT SITE ADDRESS
                    </div>

                    <div className="border-b border-black/30 pb-3 mt-2 text-[10px] leading-5 min-h-[35px]">
                      {challan.site_address || "—"}
                    </div>
                  </div>

                  {/* MATERIAL */}
                  <div className="mt-7">
                    <div className="text-[9px] font-bold mb-2">MATERIAL</div>

                    <table className="w-full border-collapse border border-black text-[9px]">
                      <thead>
                        <tr>
                          <th className="border border-black px-2 py-2 text-left w-[9%]">
                            S.No
                          </th>

                          <th className="border border-black px-2 py-2 text-left">
                            DESCRIPTION OF GOODS
                          </th>

                          <th className="border border-black px-2 py-2 text-left w-[15%]">
                            UNIT
                          </th>

                          <th className="border border-black px-2 py-2 text-right w-[15%]">
                            QTY
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="border border-black px-2 py-2 align-top">
                              {index + 1}
                            </td>

                            <td className="border border-black px-2 py-2 align-top">
                              <div className="font-medium">
                                {item.description || item.material?.name || "—"}
                              </div>

                              {(item.brand || item.specification) && (
                                <div className="text-[8px] text-black/60 mt-1">
                                  {item.brand ? `${item.brand}` : ""}
                                  {item.brand && item.specification
                                    ? " · "
                                    : ""}
                                  {item.specification || ""}
                                </div>
                              )}
                            </td>

                            <td className="border border-black px-2 py-2 align-top">
                              {item.material?.unit?.code || item.unit || "—"}
                            </td>

                            <td className="border border-black px-2 py-2 align-top text-right">
                              {number(item.quantity)}
                            </td>
                          </tr>
                        ))}

                        {Array.from({
                          length: Math.max(0, 10 - items.length),
                        }).map((_, index) => (
                          <tr key={`empty-${index}`} className="h-8">
                            <td className="border border-black px-2">
                              {items.length + index + 1}
                            </td>

                            <td className="border border-black px-2" />

                            <td className="border border-black px-2" />

                            <td className="border border-black px-2" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* REMARKS */}
                  <div className="mt-8">
                    <div className="text-[9px] font-bold">
                      REMARKS / DISCREPANCY
                    </div>

                    <div className="border border-black min-h-[42px] mt-2 p-2 text-[9px] whitespace-pre-wrap">
                      {challan.general_remarks ||
                        challan.discrepancy_notes ||
                        ""}
                    </div>
                  </div>

                  {/* SIGNATURES */}
                  <div className="grid grid-cols-2 gap-12 mt-12">
                    <div>
                      <div className="text-[9px] font-bold">DISPATCHED BY</div>

                      <div className="mt-7 text-[9px]">
                        Name · {challan.dispatched_by || "____________________"}
                      </div>

                      <div className="mt-5 text-[9px]">
                        Date ·{" "}
                        {challan.dispatched_at
                          ? formatDate(challan.dispatched_at)
                          : "____________________"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-bold">RECEIVED BY</div>

                      <div className="mt-7 text-[9px]">
                        Name · {challan.received_by || "____________________"}
                      </div>

                      <div className="mt-5 text-[9px]">
                        Date ·{" "}
                        {challan.received_at
                          ? formatDate(challan.received_at)
                          : "____________________"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ====================================================
                ITEM DETAILS
            ===================================================== */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Material Receipt Details
                    </CardTitle>

                    <CardDescription>
                      Quantity acceptance and discrepancies
                    </CardDescription>
                  </div>

                  <Badge variant="outline">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F4F6F7]">
                      <tr>
                        <th className="text-left px-4 py-3">Material</th>

                        <th className="text-right px-4 py-3">Challan Qty</th>

                        <th className="text-right px-4 py-3">Accepted</th>

                        <th className="text-right px-4 py-3">Shortage</th>

                        <th className="text-right px-4 py-3">Damaged</th>

                        <th className="text-right px-4 py-3">Rejected</th>

                        <th className="text-left px-4 py-3">Condition</th>

                        <th className="text-right px-4 py-3">History</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-[#F8FAF9]"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {item.description || item.material?.name || "—"}
                            </div>

                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.material?.material_code || ""}
                              {item.brand ? ` · ${item.brand}` : ""}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {number(item.quantity)}
                          </td>

                          <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                            {number(item.accepted_quantity)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(item.shortage_quantity) > 0 ? (
                              <span className="text-amber-700 font-medium">
                                {number(item.shortage_quantity)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(item.damaged_quantity) > 0 ? (
                              <span className="text-red-700 font-medium">
                                {number(item.damaged_quantity)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(item.rejected_quantity) > 0 ? (
                              <span className="text-red-700 font-medium">
                                {number(item.rejected_quantity)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                item.condition_status === "GOOD"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }
                            >
                              {item.condition_status || "—"}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openItemHistory(item)}
                            >
                              <History size={15} />
                              History
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ======================================================
              RIGHT SIDEBAR
          ======================================================= */}
          <div className="space-y-5">
            {/* SUMMARY */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receipt Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SummaryBox label="Items" value={items.length} />

                  <SummaryBox
                    label="Total Qty"
                    value={number(summary.ordered)}
                  />

                  <SummaryBox
                    label="Accepted"
                    value={number(summary.accepted)}
                    success
                  />

                  <SummaryBox
                    label="Shortage"
                    value={number(summary.shortage)}
                    warning={summary.shortage > 0}
                  />

                  <SummaryBox
                    label="Damaged"
                    value={number(summary.damaged)}
                    danger={summary.damaged > 0}
                  />

                  <SummaryBox
                    label="Rejected"
                    value={number(summary.rejected)}
                    danger={summary.rejected > 0}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gate Pass</span>

                  {challan.gate_pass_received ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      <Check size={13} />
                      Received
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Material Check</span>

                  {challan.material_checked ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      <Check size={13} />
                      Checked
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CHALLAN INFO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challan Information</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <InfoRow
                  icon={FileText}
                  label="Challan No"
                  value={challan.challan_number}
                />

                <InfoRow
                  icon={CalendarDays}
                  label="Challan Date"
                  value={formatDate(challan.challan_date)}
                />

                <InfoRow
                  icon={MapPin}
                  label="Site Address"
                  value={challan.site_address || "—"}
                />

                <InfoRow
                  icon={Package}
                  label="Purchase Order"
                  value={
                    challan.purchase_order_id
                      ? `${challan.purchase_order_id.slice(0, 8)}...`
                      : "—"
                  }
                />

                <InfoRow
                  icon={User}
                  label="Vendor"
                  value={
                    challan.vendor_id
                      ? `${challan.vendor_id.slice(0, 8)}...`
                      : "—"
                  }
                />
              </CardContent>
            </Card>

            {/* CHECKLIST */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receiving Checklist</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <CheckRow
                  checked={challan.gate_pass_received}
                  label="Gate pass received"
                />

                <CheckRow
                  checked={challan.material_checked}
                  label="Material checked"
                />

                <CheckRow
                  checked={summary.shortage === 0}
                  label="No shortage"
                />

                <CheckRow
                  checked={summary.damaged === 0}
                  label="No damaged quantity"
                />

                <CheckRow
                  checked={summary.rejected === 0}
                  label="No rejected quantity"
                />
              </CardContent>
            </Card>

            {/* HISTORY */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">History</CardTitle>

                    <CardDescription>Challan activity</CardDescription>
                  </div>

                  <History size={18} className="text-muted-foreground" />
                </div>
              </CardHeader>

              <CardContent>
                <HistoryTimeline challan={challan} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ==========================================================
          STATUS DIALOG
      =========================================================== */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Challan Status</DialogTitle>

            <DialogDescription>
              Update the current receiving state of this delivery challan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>

                  <SelectItem value="PARTIALLY_ACCEPTED">
                    Partially Accepted
                  </SelectItem>

                  <SelectItem value="ACCEPTED">Accepted</SelectItem>

                  <SelectItem value="REJECTED">Rejected</SelectItem>

                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>

              <Textarea
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="Add a note about this status update..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={submitStatusUpdate}
              disabled={updateState.isLoading}
              className="bg-[#1F453B] hover:bg-[#16372F]"
            >
              {updateState.isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          COMPLETE DIALOG
      =========================================================== */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Delivery Challan</DialogTitle>

            <DialogDescription>
              Completing the challan marks the receiving process as finished.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {hasOutstandingItems && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle size={18} className="text-amber-600" />

                  <div className="text-sm text-amber-800">
                    There are still outstanding quantities on this challan.
                    Review the item quantities before completing it.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Completion Remarks</label>

              <Textarea
                value={completeRemarks}
                onChange={(e) => setCompleteRemarks(e.target.value)}
                placeholder="Add completion remarks..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={submitComplete}
              disabled={completeState.isLoading}
              className="bg-[#1F453B] hover:bg-[#16372F]"
            >
              {completeState.isLoading ? "Completing..." : "Complete Challan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          ITEM HISTORY MODAL
      =========================================================== */}
      <Dialog open={itemHistoryOpen} onOpenChange={setItemHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item History</DialogTitle>

            <DialogDescription>
              Quantity and status history for this delivery challan item.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-5">
              {/* Item */}
              <div className="rounded-xl border bg-[#F8FAF9] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#E8EFEB] flex items-center justify-center">
                    <Package size={18} className="text-[#1F453B]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {selectedItem.description ||
                        selectedItem.material?.name ||
                        "—"}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedItem.material?.material_code || ""}
                      {selectedItem.brand ? ` · ${selectedItem.brand}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <MiniStat label="Qty" value={number(selectedItem.quantity)} />

                <MiniStat
                  label="Accepted"
                  value={number(selectedItem.accepted_quantity)}
                  success
                />

                <MiniStat
                  label="Shortage"
                  value={number(selectedItem.shortage_quantity)}
                  warning
                />

                <MiniStat
                  label="Damaged"
                  value={number(selectedItem.damaged_quantity)}
                  danger
                />

                <MiniStat
                  label="Rejected"
                  value={number(selectedItem.rejected_quantity)}
                  danger
                />
              </div>

              <Separator />

              {/* History */}
              <div>
                <h4 className="text-sm font-semibold mb-4">Activity</h4>

                <div className="space-y-4">
                  {buildItemHistory(selectedItem, challan).map(
                    (event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-[#E8EFEB] flex items-center justify-center">
                            <event.icon size={15} className="text-[#1F453B]" />
                          </div>

                          {index <
                            buildItemHistory(selectedItem, challan).length -
                              1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>

                        <div className="pb-3">
                          <div className="font-medium text-sm">
                            {event.title}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            {event.description}
                          </div>

                          <div className="text-[11px] text-muted-foreground mt-1">
                            {event.date}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Existing remarks */}
              {(selectedItem.condition_notes || selectedItem.remarks) && (
                <>
                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Notes</h4>

                    {selectedItem.condition_notes && (
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.condition_notes}
                      </p>
                    )}

                    {selectedItem.remarks && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedItem.remarks}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * ================================================================
 * SMALL COMPONENTS
 * ================================================================
 */

function SummaryBox({ label, value, success, warning, danger }) {
  let valueClass = "text-[#1F453B]";

  if (success) {
    valueClass = "text-emerald-700";
  }

  if (warning) {
    valueClass = "text-amber-700";
  }

  if (danger) {
    valueClass = "text-red-700";
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>

      <div className={`text-xl font-semibold mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, success, warning, danger }) {
  let className = "";

  if (success) {
    className = "text-emerald-700";
  }

  if (warning) {
    className = "text-amber-700";
  }

  if (danger) {
    className = "text-red-700";
  }

  return (
    <div className="border rounded-lg p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>

      <div className={`font-semibold mt-0.5 ${className}`}>{value}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-muted-foreground mt-0.5" />

      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>

        <div className="text-sm font-medium mt-0.5 break-words">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function CheckRow({ checked, label }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`h-6 w-6 rounded-full flex items-center justify-center ${
            checked
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {checked ? <Check size={14} /> : <Clock3 size={14} />}
        </div>

        <span className="text-sm">{label}</span>
      </div>

      <span
        className={`text-xs font-medium ${
          checked ? "text-emerald-700" : "text-muted-foreground"
        }`}
      >
        {checked ? "Done" : "Pending"}
      </span>
    </div>
  );
}

function HistoryTimeline({ challan }) {
  const events = [];

  if (challan.createdAt) {
    events.push({
      title: "Delivery Challan Created",
      description: `Challan ${challan.challan_number} was created.`,
      date: formatHistoryDate(challan.createdAt),
      icon: FileText,
    });
  }

  if (challan.gate_pass_received) {
    events.push({
      title: "Gate Pass Received",
      description: "Gate pass has been marked as received.",
      date: formatHistoryDate(challan.updatedAt),
      icon: ShieldCheck,
    });
  }

  if (challan.material_checked) {
    events.push({
      title: "Material Checked",
      description: "Material inspection has been completed.",
      date: formatHistoryDate(challan.updatedAt),
      icon: ClipboardCheck,
    });
  }

  if (challan.status === "PARTIALLY_ACCEPTED") {
    events.push({
      title: "Partially Accepted",
      description: "The delivered quantities were partially accepted.",
      date: formatHistoryDate(challan.updatedAt),
      icon: AlertCircle,
    });
  }

  if (challan.status === "ACCEPTED") {
    events.push({
      title: "Accepted",
      description: "The delivery challan was accepted.",
      date: formatHistoryDate(challan.updatedAt),
      icon: CheckCircle2,
    });
  }

  if (challan.status === "COMPLETED") {
    events.push({
      title: "Completed",
      description: "The delivery challan receiving process was completed.",
      date: formatHistoryDate(challan.updatedAt),
      icon: CheckCircle2,
    });
  }

  if (!events.length) {
    events.push({
      title: "No history available",
      description: "No activity history has been recorded yet.",
      date: "—",
      icon: History,
    });
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon;

        return (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-[#E8EFEB] flex items-center justify-center">
                <Icon size={14} className="text-[#1F453B]" />
              </div>

              {index < events.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            <div className="pb-3">
              <div className="text-sm font-medium">{event.title}</div>

              <div className="text-xs text-muted-foreground mt-1">
                {event.description}
              </div>

              <div className="text-[11px] text-muted-foreground mt-1">
                {event.date}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildItemHistory(item, challan) {
  const history = [];

  history.push({
    title: "Item Added",
    description: `Quantity ${item.quantity || 0} was recorded on the delivery challan.`,
    date: formatHistoryDate(item.createdAt || challan.createdAt),
    icon: Package,
  });

  if (Number(item.accepted_quantity || 0) > 0) {
    history.push({
      title: "Quantity Accepted",
      description: `${item.accepted_quantity} quantity accepted.`,
      date: formatHistoryDate(item.updatedAt || challan.updatedAt),
      icon: CheckCircle2,
    });
  }

  if (Number(item.shortage_quantity || 0) > 0) {
    history.push({
      title: "Shortage Recorded",
      description: `${item.shortage_quantity} quantity recorded as shortage.`,
      date: formatHistoryDate(item.updatedAt || challan.updatedAt),
      icon: AlertCircle,
    });
  }

  if (Number(item.damaged_quantity || 0) > 0) {
    history.push({
      title: "Damage Recorded",
      description: `${item.damaged_quantity} quantity recorded as damaged.`,
      date: formatHistoryDate(item.updatedAt || challan.updatedAt),
      icon: AlertCircle,
    });
  }

  if (Number(item.rejected_quantity || 0) > 0) {
    history.push({
      title: "Quantity Rejected",
      description: `${item.rejected_quantity} quantity rejected.`,
      date: formatHistoryDate(item.updatedAt || challan.updatedAt),
      icon: XCircle,
    });
  }

  return history;
}

function formatHistoryDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
