// Work order PDF — captured from the shared Rippotai print kit document (see WorkOrderPrintDocument).
import { downloadDocumentPdf } from "@/components/print-document";

export async function downloadWorkOrderPdf(element, orderNumber) {
  const root = element?.classList?.contains("pd-doc") ? element : element?.querySelector(".pd-doc");
  if (!root) throw new Error("The work order document is not ready.");
  const name = String(orderNumber || "work-order").replace(/[<>:"/\\|?*\s]+/g, "-").trim() || "work-order";
  await downloadDocumentPdf(root, `Work-Order_${name}.pdf`, { title: `Work Order ${orderNumber || ""}`.trim() });
}
