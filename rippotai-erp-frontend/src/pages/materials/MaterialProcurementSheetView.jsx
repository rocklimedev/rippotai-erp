import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecordContext from "@/components/record-context/RecordContext";
import VersionHistory from "@/components/record-context/VersionHistory";
import { useRecordInfo } from "@/components/record-context/useRecordInfo";
import DeleteMaterialProcurement from "@/components/materials/DeleteMaterialProcurement";
import {
  ArrowLeft,
  PackageSearch,
  Download,
  Edit,
  FileSpreadsheet,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import {
  AREA_FORMAT,
  INR_FORMAT,
  QTY_FORMAT,
  addMonogram,
  finishSheet,
  saveWorkbook,
  setWidths,
  styleBodyRow,
  styleHeaderRow,
  styleTotalsRow,
  writeBrandHeader,
  xlToday,
} from "@/lib/brandExcel";

import {
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
} from "../../api/procuerment/material-procurement.api";

import { Page, PageHeader, Button, Card, Stats, StatTile, Tabs, StatusPill, EmptyState } from "@/components/inos";

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
  const [tab, setTab] = useState("items");
  const { id } = useParams();
  const recordInfo = useRecordInfo("procurement-sheet", id);

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

  if (isLoading || (isFetching && !procurement)) return <Page><PageHeader title="Material Procurement" /><Card>Loading procurement sheet…</Card></Page>;
  if (error || !procurement) return <Page><PageHeader title="Material Procurement" /><Card><EmptyState icon={FileSpreadsheet} title="Unable to load procurement sheet" action={<Button onClick={() => navigate('/procurement/material-procurement/list')}>Back to procurement</Button>} /></Card></Page>;
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

  /** Download Excel: same columns as the shared template, in the Rippotai brand format. */
  const handleDownloadExcel = async () => {
    try {
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
      const last = headers.length;
      const HEADER = 5;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Rippotai Architecture";
      const sheet = workbook.addWorksheet("Material Procurement");
      setWidths(sheet, [8, 14, 14, 18, 14, 24, 12, 13, 13, 15, 15, 12, 14, 16]);
      writeBrandHeader(sheet, {
        title: "Material Procurement List – Project Material",
        // projectName falls back to the raw project id when the project is not loaded — never print an id.
        project: projectName === "—" || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(projectName) ? "" : projectName,
        meta: [procurement.procurementNo, xlToday()].filter(Boolean).join(" · "),
        lastCol: last,
        imageId: await addMonogram(workbook),
      });
      sheet.getRow(HEADER).values = headers;
      styleHeaderRow(sheet.getRow(HEADER), 1, last, { right: [8, 9, 10, 11, 12, 13, 14] });

      const formats = {
        8: AREA_FORMAT,
        9: AREA_FORMAT,
        10: AREA_FORMAT,
        11: AREA_FORMAT,
        12: QTY_FORMAT,
        13: INR_FORMAT,
        14: INR_FORMAT,
      };
      resolvedItems.forEach((item, index) => {
        const row = sheet.getRow(HEADER + 1 + index);
        row.values = [
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
        ];
        styleBodyRow(row, 1, last, formats);
        row.getCell(1).alignment = { vertical: "top", horizontal: "center" };
      });
      const lastItem = HEADER + resolvedItems.length;
      const totals = sheet.getRow(lastItem + 1);
      totals.getCell(10).value = "Totals";
      totals.getCell(11).value = numberValue(totalArea);
      totals.getCell(12).value = numberValue(totalQuantity);
      totals.getCell(14).value = numberValue(totalAmount);
      styleTotalsRow(totals, 1, last, formats);
      finishSheet(sheet, { headerRow: HEADER, lastCol: last, lastRow: lastItem + 1, filterTo: lastItem });

      await saveWorkbook(workbook, `${procurement.procurementNo || "MP"}-Material-Procurement.xlsx`);
      toast.success("Excel downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file.");
    }
  };

  return <Page>
    <PageHeader title={procurement.procurementNo || 'Material Procurement'} info={recordInfo} actions={<>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/procurement/material-procurement/list')}>Back</Button>
      <DeleteMaterialProcurement procurement={procurement} onDeleted={() => navigate('/procurement/material-procurement/list')} />
      <Button variant="secondary" icon={Download} onClick={handleDownloadExcel}>Download Excel</Button>
      {procurement.status === 'DRAFT' && <><Button variant="secondary" icon={Edit} onClick={() => navigate(`/procurement/material-procurement/${procurement.id}/edit`)}>Edit</Button><Button variant="primary" icon={Send} disabled={submitting} onClick={handleSubmit}>{submitting ? 'Submitting…' : 'Submit'}</Button></>}
    </>} />
    <RecordContext type="procurement-sheet" id={id} />
    <Stats>
      <StatTile label="Material items" value={items.length} icon={<PackageSearch />} />
      <StatTile label="Total area" value={formatNumber(totalArea)} meta="sq.ft" />
      <StatTile label="Total quantity" value={formatNumber(totalQuantity, 3)} />
      <StatTile label="Procurement value" value={`₹ ${formatCurrency(totalAmount)}`} />
    </Stats>
    <Card title="Procurement details" actions={<StatusPill status={procurement.status} />}>
      <dl className="inos-kv" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20 }}>
        <div><dt>Project</dt><dd>{projectName}</dd></div>
        <div><dt>Created by</dt><dd>{procurement.createdBy?.name || procurement.createdBy?.fullName || procurement.createdBy?.email || '—'}</dd></div>
        <div><dt>Created</dt><dd>{procurement.createdAt ? new Date(procurement.createdAt).toLocaleDateString('en-IN') : '—'}</dd></div>
        <div><dt>Last updated</dt><dd>{procurement.updatedAt ? new Date(procurement.updatedAt).toLocaleString('en-IN') : '—'}</dd></div>
      </dl>
    </Card>
    <Tabs value={tab} onChange={setTab} options={[{ value: 'items', label: 'Material items' }, { value: 'history', label: 'Version History' }]} />
    {tab === 'items' ? <>
      <Card title="Material procurement items" subtitle={`${items.length} items`} flush>
        <div className="inos-table-wrap"><table className="inos-table" style={{ minWidth: 1200 }}>
          <thead><tr><th>S.No</th><th>Area</th><th>Location</th><th style={{ minWidth: 230 }}>Material</th><th className="text-right">Wall (sq.ft)</th><th className="text-right">Floor (sq.ft)</th><th className="text-right">Ceiling (sq.ft)</th><th className="text-right">Total area</th><th className="text-right">Quantity</th><th className="text-right">Price</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{resolvedItems.length ? resolvedItems.map((item, index) => <tr key={items[index].id || index}>
            <td>{item.serialNo ?? index + 1}</td><td>{item.area}</td><td>{item.location}</td>
            <td><div className="font-semibold">{item.name}</div><div className="inos-hint">{item.material} · {item.brand}</div><div className="inos-hint">{item.code}</div></td>
            <td className="text-right tabular-nums">{formatNumber(item.wallArea)}</td><td className="text-right tabular-nums">{formatNumber(item.floorArea)}</td><td className="text-right tabular-nums">{formatNumber(item.ceilingArea)}</td><td className="text-right font-semibold tabular-nums">{formatNumber(item.totalArea)}</td><td className="text-right tabular-nums">{formatNumber(item.quantity, 3)}</td><td className="text-right tabular-nums">{formatCurrency(item.price)}</td><td className="text-right font-semibold tabular-nums">{formatCurrency(item.amount)}</td>
          </tr>) : <tr><td colSpan={11}><EmptyState icon={PackageSearch} title="No material items" /></td></tr>}</tbody>
          <tfoot><tr><td colSpan={7}>Totals</td><td className="text-right">{formatNumber(totalArea)}</td><td className="text-right">{formatNumber(totalQuantity, 3)}</td><td /><td className="text-right">₹ {formatCurrency(totalAmount)}</td></tr></tfoot>
        </table></div>
      </Card>
      {procurement.remarks && <Card title="Remarks"><p className="whitespace-pre-wrap text-sm">{procurement.remarks}</p></Card>}
    </> : <VersionHistory type="procurement-sheet" id={id} title="Version & approval history" />}
  </Page>;
}
