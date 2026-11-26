import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/projects/_projects-ui';
import { customValuesOf, itemSheet, sheetsOf } from '@/components/procurement-sheet/sheets';
import ProcurementColumns from '@/components/procurement-sheet/ProcurementColumns';
import {
  customColumnIndex,
  procurementColumnOrder,
  RECORD_COLUMNS,
} from '@/components/procurement-sheet/columns';
import '@/components/procurement-sheet/procurement-sheet.css';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import DeleteMaterialProcurement from '@/components/materials/DeleteMaterialProcurement';
import {
  ArrowLeft,
  Calculator,
  Download,
  Edit,
  FileSpreadsheet,
  Layers,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
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
} from '@/lib/brandExcel';

import {
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
  useUpdateMaterialProcurementMutation,
} from '../../api/procuerment/material-procurement.api';
import { Input } from '@/components/ui/input';
import { useGetProjectsQuery } from '../../api/projects/project.api';
import { Label } from '@/components/ui/label';

import { PageHeader } from '@/components/site-ops/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusLabel = (status) => {
  if (!status) return '—';

  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const statusClass = (status) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted text-muted-foreground';

    case 'SUBMITTED':
      return 'bg-[#E7EEEB] text-[#0D3D2F]';

    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700';

    case 'PARTIALLY_PROCURED':
      return 'bg-orange-50 text-orange-700';

    case 'PROCURED':
      return 'bg-green-50 text-green-700';

    case 'CANCELLED':
      return 'bg-red-50 text-red-700';

    default:
      return 'bg-muted text-muted-foreground';
  }
};

const numberValue = (value) => Number(value || 0);

const formatNumber = (value, maximumFractionDigits = 2) =>
  numberValue(value).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const formatCurrency = (value) =>
  numberValue(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Resolve display values from item + materialMaster (matches your Excel columns) */
const resolveItem = (item) => {
  const master = item.materialMaster || {};

  return {
    serialNo: item.serialNo,
    area: item.area || '—',
    location: item.location || '—',
    material: item.material || master.category || master.name || '—',
    brand: item.brand || master.brand || '—',
    name: item.name || master.name || '—',
    code: item.code || master.material_code || '—',
    customValues: customValuesOf(item),
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
  const recordInfo = useRecordInfo('procurement-sheet', id);

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
  const [updateMaterialProcurement, { isLoading: savingSheets }] =
    useUpdateMaterialProcurementMutation();
  const [activeSheet, setActiveSheet] = useState(null);
  const { data: projectsData } = useGetProjectsQuery({});
  const [sheetDialog, setSheetDialog] = useState(null);

  const procurement = response?.data ?? response;

  if (isLoading || isFetching) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Procurement"
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
          eyebrow="Procurement"
          title="Material Procurement"
          description="The requested procurement sheet could not be found."
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to load this procurement sheet.</p>
            <Button
              variant="outline"
              onClick={() => navigate('/procurement/material-procurement/list')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Procurement
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allItems = procurement.items || [];
  const sheets = sheetsOf(procurement);
  const sheetOf = (item) => itemSheet(item, sheets);
  const activeName = sheets.some((sheet) => sheet.name === activeSheet)
    ? activeSheet
    : sheets[0]?.name;
  const activeSheetDefinition = sheets.find((sheet) => sheet.name === activeName);
  const customFields = activeSheetDefinition?.customFields ?? [];
  const columnOrder = procurementColumnOrder(activeSheetDefinition, true);
  const totalsStart = columnOrder.indexOf('totalArea');
  const sheetStats = Object.fromEntries(
    sheets.map((sheet) => [sheet.name, { count: 0, amount: 0 }]),
  );
  allItems.forEach((item) => {
    const stat = sheetStats[sheetOf(item)];
    if (stat) {
      stat.count += 1;
      stat.amount += numberValue(item.amount);
    }
  });
  const items = allItems.filter((item) => sheetOf(item) === activeName);
  const resolvedItems = items.map(resolveItem);
  // Every procurement sheet can be edited (submitted ones keep their status).
  const canEdit = true;

  const toPayloadItem = (item, sheetName, index) => {
    const num = (v) => (v === null || v === undefined || v === '' ? undefined : Number(v));
    return {
      serialNo: index + 1,
      materialId: item.materialId || item.materialMaster?.id,
      brand: item.brand || undefined,
      customValues: customValuesOf(item),
      sheetName,
      area: item.area || undefined,
      location: item.location || undefined,
      wallArea: num(item.wallArea),
      floorArea: num(item.floorArea),
      ceilingArea: num(item.ceilingArea),
      totalArea: num(item.totalArea),
      isTotalAreaManual: item.isTotalAreaManual ?? undefined,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      amount: Number(item.amount || 0),
    };
  };

  /** Save a new sheet list; rows of a renamed sheet follow it, rows of a deleted sheet are dropped. */
  const saveSheets = async (nextSheets, { rename, remove } = {}) => {
    const nextItems = allItems
      .map((item) => {
        const current = sheetOf(item);
        if (remove && current === remove) return null;
        return { item, sheetName: rename && current === rename.from ? rename.to : current };
      })
      .filter(Boolean)
      .map(({ item, sheetName }, index) => toPayloadItem(item, sheetName, index));
    try {
      await updateMaterialProcurement({
        id: procurement.id,
        sheets: nextSheets.map((sheet) => ({
          name: sheet.name,
          ...(sheet.type ? { type: sheet.type } : {}),
          customFields: sheet.customFields,
          columnOrder: sheet.columnOrder,
        })),
        ...(rename || remove ? { items: nextItems } : {}),
      }).unwrap();
      return true;
    } catch (saveError) {
      toast.error(saveError?.data?.message || saveError?.message || 'Unable to update the sheets.');
      return false;
    }
  };

  const confirmSheetDialog = async () => {
    if (sheetDialog.mode === 'delete') {
      if (sheets.length === 1)
        return toast.error('A procurement sheet needs at least one material type.');
      const remaining = sheets.filter((sheet) => sheet.name !== sheetDialog.from);
      if (await saveSheets(remaining, { remove: sheetDialog.from })) {
        toast.success(`${sheetDialog.from} deleted.`);
        setActiveSheet(remaining[0].name);
        setSheetDialog(null);
      }
      return;
    }
    const name = String(sheetDialog.name || '').trim();
    if (!name) return toast.error('Enter a category name.');
    if (
      sheets.some(
        (sheet) =>
          sheet.name.toLowerCase() === name.toLowerCase() && sheet.name !== sheetDialog.from,
      )
    )
      return toast.error('A category with this name already exists.');
    const next =
      sheetDialog.mode === 'new'
        ? [...sheets, { name, type: null }]
        : sheets.map((sheet) => (sheet.name === sheetDialog.from ? { ...sheet, name } : sheet));
    const ok = await saveSheets(
      next,
      sheetDialog.mode === 'rename' ? { rename: { from: sheetDialog.from, to: name } } : {},
    );
    if (ok) {
      toast.success(sheetDialog.mode === 'new' ? `${name} category added.` : 'Category renamed.');
      setActiveSheet(name);
      setSheetDialog(null);
    }
  };

  const projectList = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || projectsData?.items || [];
  const project = procurement.project || projectList.find((p) => p.id === procurement.projectId);
  const projectName = project?.name || project?.projectName || project?.title || '—';

  const allResolved = allItems.map(resolveItem);
  const sheetArea = resolvedItems.reduce((total, item) => total + numberValue(item.totalArea), 0);
  const sheetQuantity = resolvedItems.reduce(
    (total, item) => total + numberValue(item.quantity),
    0,
  );
  const sheetAmount = resolvedItems.reduce((total, item) => total + numberValue(item.amount), 0);

  const totalQuantity = allResolved.reduce((total, item) => total + numberValue(item.quantity), 0);
  const totalAmount = allResolved.reduce((total, item) => total + numberValue(item.amount), 0);

  const handleSubmit = async () => {
    try {
      await submitMaterialProcurement(procurement.id).unwrap();
      toast.success('Material procurement submitted.');
    } catch (submitError) {
      toast.error(
        submitError?.data?.message || submitError?.message || 'Unable to submit procurement.',
      );
    }
  };

  /** Download Excel: same columns as the shared template, in the Rippotai brand format. */
  const handleDownloadExcel = async () => {
    try {
      const headers = [
        'S. No.',
        'Area',
        'Location',
        'Material',
        'Brand',
        'Name',
        'Code',
        'Wall(Sq.ft)',
        'Floor(Sq.ft)',
        'Ceiling(Sq.ft)',
        'Total Area(Sq.ft)',
        'Quantity',
        'Price',
        'Amount',
      ];
      const HEADER = 5;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Rippotai Architecture';
      const imageId = await addMonogram(workbook);
      const standardFormats = {
        8: AREA_FORMAT,
        9: AREA_FORMAT,
        10: AREA_FORMAT,
        11: AREA_FORMAT,
        12: QTY_FORMAT,
        13: INR_FORMAT,
        14: INR_FORMAT,
      };
      // Include sheets that have rows or custom column definitions.
      const groups = sheets
        .map((sheetDef) => ({
          name: sheetDef.name,
          customFields: sheetDef.customFields ?? [],
          columnOrder: procurementColumnOrder(sheetDef, true),
          rows: allItems.filter((item) => sheetOf(item) === sheetDef.name).map(resolveItem),
        }))
        .filter((group) => group.rows.length || group.customFields.length);
      if (!groups.length)
        groups.push({
          name: 'Material Procurement',
          rows: [],
          customFields: [],
          columnOrder: RECORD_COLUMNS,
        });
      const usedNames = new Set();
      groups.forEach((group) => {
        const fromStandard = (values, customValue) =>
          group.columnOrder.map((column) =>
            column.startsWith('custom-')
              ? customValue(customColumnIndex(column))
              : values[RECORD_COLUMNS.indexOf(column)],
          );
        const columnNumber = (column) => group.columnOrder.indexOf(column) + 1;
        const groupHeaders = fromStandard(headers, (index) => group.customFields[index]);
        const last = groupHeaders.length;
        const formats = Object.fromEntries(
          Object.entries(standardFormats).map(([index, format]) => [
            columnNumber(RECORD_COLUMNS[Number(index) - 1]),
            format,
          ]),
        );
        let tab =
          group.name
            .replace(/[\\/?*[\]:]/g, ' ')
            .slice(0, 31)
            .trim() || 'Sheet';
        while (usedNames.has(tab.toLowerCase())) tab = `${tab.slice(0, 28)} ${usedNames.size}`;
        usedNames.add(tab.toLowerCase());
        const sheet = workbook.addWorksheet(tab);
        setWidths(
          sheet,
          fromStandard([8, 14, 14, 18, 14, 24, 12, 13, 13, 15, 15, 12, 14, 16], () => 22),
        );
        writeBrandHeader(sheet, {
          title: `Material Procurement List – ${group.name}`,
          // projectName falls back to the raw project id when the project is not loaded — never print an id.
          project:
            projectName === '—' || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(projectName)
              ? ''
              : projectName,
          meta: [procurement.procurementNo, xlToday()].filter(Boolean).join(' · '),
          lastCol: last,
          imageId,
        });
        sheet.getRow(HEADER).values = groupHeaders;
        styleHeaderRow(sheet.getRow(HEADER), 1, last, { right: Object.keys(formats).map(Number) });
        group.rows.forEach((item, index) => {
          const row = sheet.getRow(HEADER + 1 + index);
          row.values = fromStandard(
            [
              index + 1,
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
            ],
            (fieldIndex) => item.customValues[fieldIndex] ?? '',
          );
          styleBodyRow(row, 1, last, formats);
          row.getCell(columnNumber('serialNo')).alignment = {
            vertical: 'top',
            horizontal: 'center',
          };
        });
        const lastItem = HEADER + group.rows.length;
        const totals = sheet.getRow(lastItem + 1);
        totals.getCell(columnNumber('ceilingArea')).value = 'Totals';
        totals.getCell(columnNumber('totalArea')).value = group.rows.reduce(
          (t, i) => t + numberValue(i.totalArea),
          0,
        );
        totals.getCell(columnNumber('quantity')).value = group.rows.reduce(
          (t, i) => t + numberValue(i.quantity),
          0,
        );
        totals.getCell(columnNumber('amount')).value = group.rows.reduce(
          (t, i) => t + numberValue(i.amount),
          0,
        );
        styleTotalsRow(totals, 1, last, formats);
        finishSheet(sheet, {
          headerRow: HEADER,
          lastCol: last,
          lastRow: lastItem + 1,
          filterTo: lastItem,
        });
      });

      await saveWorkbook(
        workbook,
        `${procurement.procurementNo || 'MP'}-Material-Procurement.xlsx`,
      );
      toast.success('Excel downloaded successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel file.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Procurement"
        title={procurement.procurementNo || 'Material Procurement'}
        description={recordInfo}
      />
      <RecordContext type="procurement-sheet" id={id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/procurement/material-procurement/list')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-wrap gap-2">
          <DeleteMaterialProcurement
            procurement={procurement}
            onDeleted={() => navigate('/procurement/material-procurement/list')}
          />
          {/* Download Excel – always available */}
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>

          <Button variant="outline" asChild>
            <Link
              to={`/procurement/material-procurement/${procurement.id}/edit`}
              data-testid="procurement-edit"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {procurement.status === 'DRAFT' && (
            <Button disabled={submitting} onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Procurement No.</p>
            <p className="mt-1 text-lg font-semibold">{procurement.procurementNo || '—'}</p>
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
                ? new Date(procurement.createdAt).toLocaleDateString('en-IN')
                : '—'}
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
              <p className="mt-1 font-medium">{projectName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Created By</p>
              <p className="mt-1 font-medium">
                {procurement.createdBy?.name ||
                  procurement.createdBy?.fullName ||
                  procurement.createdBy?.email ||
                  '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Updated</p>
              <p className="mt-1 font-medium">
                {procurement.updatedAt
                  ? new Date(procurement.updatedAt).toLocaleString('en-IN')
                  : '—'}
              </p>
            </div>
          </div>

          {procurement.remarks && (
            <div className="mt-6 border-t pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remarks</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{procurement.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== Excel-like sheet view ========== */}
      <Card className="mps-sheet overflow-hidden">
        <CardHeader className="mps-sheet__head">
          <div className="flex items-center gap-2">
            <span className="inos-icon-tile inos-icon-tile--sm" aria-hidden>
              <FileSpreadsheet />
            </span>
            <div>
              <CardTitle className="mps-sheet__title">
                Material procurement list – {projectName}
              </CardTitle>
              <p className="mps-muted">
                {allItems.length} material {allItems.length === 1 ? 'item' : 'items'} in{' '}
                {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'} ·{' '}
                {procurement.procurementNo}
              </p>
            </div>
          </div>
          <Calculator className="mps-sheet__icon" aria-hidden />
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-4 pt-3">
            <div className="mps-tabs" role="tablist" aria-label="Procurement categories">
              {sheets.map((sheet) => (
                <button
                  key={sheet.name}
                  type="button"
                  role="tab"
                  aria-selected={sheet.name === activeName}
                  className={`mps-tab ${sheet.name === activeName ? 'is-active' : ''}`}
                  onClick={() => setActiveSheet(sheet.name)}
                >
                  <span>{sheet.name}</span>
                  <span className="mps-tab__count">{sheetStats[sheet.name]?.count || 0}</span>
                </button>
              ))}
            </div>
            <div className="mps-sheetbar">
              <div>
                <strong>{activeName}</strong>
                <span className="mps-muted">
                  {' '}
                  · {items.length} item{items.length === 1 ? '' : 's'} · ₹{' '}
                  {formatCurrency(sheetAmount)}
                </span>
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/procurement/material-procurement/${procurement.id}/edit?sheet=${encodeURIComponent(activeName || '')}`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit sheet
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingSheets}
                    onClick={() => setSheetDialog({ mode: 'new', name: '' })}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Add category
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingSheets}
                    onClick={() =>
                      setSheetDialog({ mode: 'rename', from: activeName, name: activeName })
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={savingSheets || sheets.length === 1}
                    onClick={() => setSheetDialog({ mode: 'delete', from: activeName })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete sheet
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            {/* Excel-style table */}
            <table className="mps-table">
              <thead>
                {/* Title row (like Excel merged title) */}
                <tr className="mps-table__title">
                  <th colSpan={14 + customFields.length} className="mps-c">
                    Material procurement list – {activeName}
                  </th>
                </tr>

                {/* Column headers – classic Excel look */}
                <tr className="mps-table__head">
                  <ProcurementColumns
                    order={columnOrder}
                    standard={RECORD_COLUMNS}
                    renderCustom={(fieldIndex) => (
                      <th scope="col" className="mps-c">
                        {customFields[fieldIndex]}
                      </th>
                    )}
                  >
                    <th className="mps-c">S. No.</th>
                    <th className="mps-c">Area</th>
                    <th className="mps-c">Location</th>
                    <th className="mps-c">Material</th>
                    <th className="mps-c">Brand</th>
                    <th className="mps-c">Name</th>
                    <th className="mps-c">Code</th>
                    <th className="mps-c is-num">Wall(Sq.ft)</th>
                    <th className="mps-c is-num">Floor(Sq.ft)</th>
                    <th className="mps-c is-num">Ceiling(Sq.ft)</th>
                    <th className="mps-c is-num">Total Area(Sq.ft)</th>
                    <th className="mps-c is-num">Quantity</th>
                    <th className="mps-c is-num">Price</th>
                    <th className="mps-c is-num">Amount</th>
                  </ProcurementColumns>
                </tr>
              </thead>

              <tbody>
                {resolvedItems.length === 0 ? (
                  <tr>
                    <td colSpan={14 + customFields.length} className="mps-c mps-empty">
                      No materials in {activeName} yet.
                    </td>
                  </tr>
                ) : (
                  resolvedItems.map((item, index) => (
                    <tr
                      key={items[index]?.id || `${procurement.id}-${index}`}
                      className={index % 2 === 0 ? 'mps-row' : 'mps-row is-alt'}
                    >
                      <ProcurementColumns
                        order={columnOrder}
                        standard={RECORD_COLUMNS}
                        renderCustom={(fieldIndex) => (
                          <td className="mps-c">{item.customValues[fieldIndex] || '—'}</td>
                        )}
                      >
                        <td className="mps-c mps-sno">{index + 1}</td>
                        <td className="mps-c">{item.area}</td>
                        <td className="mps-c">{item.location}</td>
                        <td className="mps-c is-strong">{item.material}</td>
                        <td className="mps-c">{item.brand}</td>
                        <td className="mps-c">{item.name}</td>
                        <td className="mps-c mps-code">{item.code}</td>
                        <td className="mps-c is-num">{formatNumber(item.wallArea)}</td>
                        <td className="mps-c is-num">{formatNumber(item.floorArea)}</td>
                        <td className="mps-c is-num">{formatNumber(item.ceilingArea)}</td>
                        <td className="mps-c is-num is-strong">{formatNumber(item.totalArea)}</td>
                        <td className="mps-c is-num">{formatNumber(item.quantity, 3)}</td>
                        <td className="mps-c is-num">{formatNumber(item.price, 2)}</td>
                        <td className="mps-c is-num is-strong">{formatNumber(item.amount, 2)}</td>
                      </ProcurementColumns>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals row – Excel style */}
              <tfoot>
                <tr className="mps-table__total">
                  <td colSpan={totalsStart} className="mps-c is-num">
                    Totals · {activeName}
                  </td>
                  {columnOrder.slice(totalsStart).map((column) => (
                    <td key={column} className="mps-c is-num">
                      {
                        {
                          totalArea: formatNumber(sheetArea),
                          quantity: formatNumber(sheetQuantity, 3),
                          amount: formatCurrency(sheetAmount),
                        }[column]
                      }
                    </td>
                  ))}
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
              {allItems.length} items in {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'}{' '}
              · {formatNumber(totalQuantity, 3)} total quantity
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Total Procurement Value</p>
            <p className="text-2xl font-semibold">₹ {formatCurrency(totalAmount)}</p>
          </div>
        </CardContent>
      </Card>
      <VersionHistory type="procurement-sheet" id={id} />
      {sheetDialog && (
        <Modal
          open
          onClose={() => !savingSheets && setSheetDialog(null)}
          title={
            sheetDialog.mode === 'new'
              ? 'Add procurement category'
              : sheetDialog.mode === 'rename'
                ? 'Rename sheet'
                : 'Delete sheet?'
          }
          width={440}
          footer={
            <>
              <Button
                variant="outline"
                disabled={savingSheets}
                onClick={() => setSheetDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant={sheetDialog.mode === 'delete' ? 'destructive' : 'default'}
                disabled={savingSheets}
                onClick={confirmSheetDialog}
              >
                {savingSheets
                  ? 'Saving…'
                  : sheetDialog.mode === 'new'
                    ? 'Add category'
                    : sheetDialog.mode === 'rename'
                      ? 'Rename'
                      : 'Delete sheet'}
              </Button>
            </>
          }
        >
          {sheetDialog.mode === 'delete' ? (
            <p className="text-sm leading-relaxed">
              <strong>{sheetDialog.from}</strong> and its {sheetStats[sheetDialog.from]?.count || 0}{' '}
              material
              {(sheetStats[sheetDialog.from]?.count || 0) === 1 ? '' : 's'} will be removed from
              this procurement sheet.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="view-sheet-name">Category name</Label>
              <Input
                id="view-sheet-name"
                autoFocus
                maxLength={120}
                value={sheetDialog.name}
                placeholder="e.g. Wallpaper"
                onChange={(event) => setSheetDialog((d) => ({ ...d, name: event.target.value }))}
                onKeyDown={(event) => event.key === 'Enter' && confirmSheetDialog()}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
