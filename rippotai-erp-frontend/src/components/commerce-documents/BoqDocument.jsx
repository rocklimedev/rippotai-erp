import React, { forwardRef, useMemo } from "react";
import { RichText } from "@/components/boqs/RichTextEditor";
import { PrintDocument, has, fmtDate } from "../print-document";
import { qty, rs } from "../print-document/commerce";
import mark from "../../assets/rippotai_mark.png";
import "./boq-document.css";

export const BOQ_VARIANTS = {
  client: "Client copy",
  internal: "Internal copy",
  quantity_only: "Quantity only",
  vendor_enquiry: "Vendor enquiry",
};

export const boqFileName = (boq, variant = "client", template = false) => {
  const base = template
    ? `BOQ-Template_${String(boq?.name || "template").replace(/[^\w-]+/g, "-")}`
    : `BOQ_${String(boq?.boq_number || `${boq?.project?.name || "boq"}-v${boq?.version || 1}`).replace(/[^\w-]+/g, "-")}`;
  return `${base}${template ? "" : `_${variant.replace(/_/g, "-")}`}.pdf`;
};

const n = (value) => Number(value || 0);
const amount = (item) => has(item.amount) ? n(item.amount) : n(item.quantity) * n(item.rate);

const BoqDocument = forwardRef(function BoqDocument({ boq, variant = "client", template = false }, ref) {
  const hidePrice = variant === "quantity_only" || variant === "vendor_enquiry";
  const sections = useMemo(() => {
    if (!boq) return [];
    const categories = [...(boq.categories || [])]
      .sort((a, b) => n(a.sort_order) - n(b.sort_order))
      .map((category) => ({ ...category, items: [...(category.items || [])]
        .filter((item) => variant !== "client" || !item.hidden)
        .sort((a, b) => n(a.sort_order) - n(b.sort_order)) }))
      .filter((category) => category.items.length);
    const cols = ["S.No", "Description", "Location", "Unit", "#Qty", ...(hidePrice ? [] : ["#Rate", "#Amount"])];
    const grid = hidePrice ? "9mm 1fr 24mm 14mm 21mm" : "9mm 1fr 22mm 12mm 18mm 22mm 25mm";
    let serial = 0;
    const tables = categories.map((category) => {
      const rows = category.items.map((item) => ({ key: item.id, cells: [
        { text: String(++serial), strong: false },
        { text: <>{item.name}{has(item.notes) && <> — <RichText as="span" value={item.notes} /></>}</>, strong: false },
        item.location || "", item.unit || "", qty(item.quantity),
        ...(hidePrice ? [] : [rs(item.rate), rs(amount(item))]),
      ] }));
      if (!hidePrice) rows.push({ key: `total-${category.id}`, variant: "total", cells: ["", { text: `Subtotal — ${category.name}`, strong: true }, "", "", "", "", rs(category.items.reduce((sum, item) => sum + amount(item), 0))] });
      return { table: { heading: category.name, cols, template: grid, items: rows, allowSplit: true } };
    });
    const projectTotal = template ? n(boq.total_value) : n(boq.project_total);
    const finalTotal = template ? n(boq.total_value) : n(boq.final_total);
    const summary = [
      ["Project Total", projectTotal],
      ...[["Design Amount", boq.design_amount], ["Execution Amount", boq.execution_amount], ["Supervisor Amount", boq.supervisor_amount]].filter(([, value]) => n(value)),
      ...(boq.miscellaneous?.length ? boq.miscellaneous.filter((entry) => n(entry.value)).map((entry) => [entry.name, n(entry.value)]) : n(boq.misc_amount) ? [["Miscellaneous", n(boq.misc_amount)]] : []),
    ];
    return [{ blocks: [
      <div className="boq-meta" key="meta"><div>{template ? boq.name : boq.project?.name || boq.title}<br />{boq.location || boq.project?.site_location}</div>{!hidePrice && <div className="boq-estimate"><span>Estimate Total</span><b>{rs(finalTotal)}</b></div>}</div>,
      ...tables,
      !hidePrice && <div className="boq-cost-summary" key="summary"><h3>Cost Summary</h3>{summary.map(([label, value], index) => <div key={index}><span>{label}</span><span>{rs(value)}</span></div>)}<div className="boq-final"><b>Final Total</b><b>{rs(finalTotal)}</b></div></div>,
    ] }];
  }, [boq, variant, template, hidePrice]);
  if (!boq) return null;
  return <PrintDocument key={`${variant}-${template}`} ref={ref} className="boq-document" cover={false} numbered={false}
    header={<header className="boq-header"><img src={mark} alt="Rippotai" /><div><h1>Budget Breakdown</h1><span>{fmtDate(boq.date || boq.updated_at)}</span></div></header>}
    sections={sections} />;
});
export default BoqDocument;
