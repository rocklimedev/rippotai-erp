import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRefill } from '@/components/doc-list/useRefill';
import { PrefillNotice } from '@/components/PrefillNotice';
import CreateMaterialForm from '@/components/CreateMaterialForm';
import { usePermission } from '@/hooks/use-permission';
import { useSharedProjectData } from '../../hooks/use-shared-project-data';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  Pencil,
  PackagePlus,
  Layers,
} from 'lucide-react';
import { Modal } from '@/components/projects/_projects-ui';
import ProcurementColumns from '@/components/procurement-sheet/ProcurementColumns';
import {
  customColumn, customColumnIndex, EDIT_COLUMNS, placeProcurementColumn,
  procurementColumnOrder, SHEET_COLUMNS,
} from '@/components/procurement-sheet/columns';
import {
  customValuesOf,
  defaultMaterialsFor,
  freshSheets,
  itemSheet,
  sheetsOf,
} from '@/components/procurement-sheet/sheets';
import { toast } from 'sonner';

import {
  useCreateMaterialProcurementMutation,
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
  useUpdateMaterialProcurementMutation,
} from '../../api/procuerment/material-procurement.api';

import { useGetProjectsQuery } from '../../api/projects/project.api';

import { useGetMaterialsQuery } from '../../api/procuerment/material-master.api';

import { PageHeader } from '@/components/site-ops/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import '@/components/procurement-sheet/procurement-sheet.css';

// ============================================================
// EMPTY ITEM
// ============================================================

const createEmptyItem = (serialNo = 1, sheetName = '') => ({
  serialNo,
  sheetName,

  area: '',
  location: '',

  // Material Master
  materialId: '',
  brand: '',

  wallArea: '',
  floorArea: '',
  ceilingArea: '',
  totalArea: '',
  manualTotalArea: '',

  quantity: '',
  price: '',
  amount: '',
});

// ============================================================
// NUMBER HELPERS
// ============================================================

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

// ============================================================
// CALCULATE ITEM
// ============================================================

const calculateTotalArea = (item) => {
  const wallArea = toNumber(item.wallArea);
  const floorArea = toNumber(item.floorArea);
  const ceilingArea = toNumber(item.ceilingArea);
  return wallArea || floorArea || ceilingArea ? (wallArea + floorArea + ceilingArea).toFixed(2) : '';
};

const savedManualTotalArea = (item) => {
  if (item.totalArea == null) return '';
  const manual = item.isTotalAreaManual ?? (toNumber(item.totalArea) !== toNumber(calculateTotalArea(item)));
  return manual ? String(item.totalArea) : '';
};

const calculateItem = (item) => {
  const quantity = toNumber(item.quantity);
  const price = toNumber(item.price);

  return {
    ...item,

    totalArea: item.manualTotalArea || calculateTotalArea(item),

    amount: quantity || price ? (quantity * price).toFixed(2) : '',
  };
};

// ============================================================
// COMPONENT
// ============================================================

export default function CreateMaterialProcurementSheet() {
  const canCreateMaterial = usePermission('materials', 'create');
  const [createMaterialRow, setCreateMaterialRow] = useState(null);
  const [createdMaterials, setCreatedMaterials] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ============================================================
  // URL
  // ============================================================

  const projectIdFromUrl = searchParams.get('projectId') || searchParams.get('project_id');

  const { id: routeId } = useParams();
  const editId = routeId || searchParams.get('id');

  const isEdit = Boolean(editId);

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projectsResponse, isLoading: projectsLoading } = useGetProjectsQuery();

  // ============================================================
  // MATERIAL MASTER
  // ============================================================

  const { data: materialsResponse, isLoading: materialsLoading } = useGetMaterialsQuery({
    isActive: true,
  });

  // ============================================================
  // EXISTING PROCUREMENT
  // ============================================================

  const { data: existingResponse, isLoading: existingLoading } = useGetMaterialProcurementQuery(
    editId,
    {
      skip: !editId,
    },
  );

  // ============================================================
  // MUTATIONS
  // ============================================================

  const [createMaterialProcurement, { isLoading: creating }] =
    useCreateMaterialProcurementMutation();

  const [updateMaterialProcurement, { isLoading: updating }] =
    useUpdateMaterialProcurementMutation();

  const [submitMaterialProcurement, { isLoading: submitting }] =
    useSubmitMaterialProcurementMutation();

  // ============================================================
  // NORMALIZE PROJECTS
  // ============================================================

  const projects = projectsResponse?.data?.data ?? projectsResponse?.data ?? projectsResponse ?? [];

  // ============================================================
  // NORMALIZE MATERIALS
  // ============================================================

  const materials = useMemo(() => {
    const list =
      materialsResponse?.data?.data ?? materialsResponse?.data ?? materialsResponse ?? [];
    const fetched = Array.isArray(list) ? list : [];
    const fetchedIds = new Set(fetched.map((material) => material.id));
    return [...fetched, ...createdMaterials.filter((material) => !fetchedIds.has(material.id))];
  }, [materialsResponse, createdMaterials]);

  // ============================================================
  // EXISTING
  // ============================================================

  const existing = existingResponse?.data ?? existingResponse;
  // Submitted sheets stay editable: save keeps their status, no second submit.
  const alreadySubmitted = isEdit && !!existing?.status && existing.status !== 'DRAFT';

  // ============================================================
  // STATE
  // ============================================================

  const [projectId, setProjectId] = useState(projectIdFromUrl || '');
  useRefill({
    type: 'procurement-sheet',
    label: 'Procurement Sheet',
    projectId,
    enabled: !isEdit,
    editPath: (id) => `/procurement/material-procurement/${id}/edit`,
  });

  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState([]);
  const [sheets, setSheets] = useState(() => freshSheets());
  const [activeSheet, setActiveSheet] = useState(
    () => searchParams.get('sheet') || freshSheets()[0].name,
  );
  const [sheetDialog, setSheetDialog] = useState(() =>
    searchParams.get('newSheet') ? { mode: 'new', name: '' } : null,
  );
  const procurementValues = useMemo(() => ({ items }), [items]);
  const setProcurementValues = useCallback(
    (updater) => setItems((current) => updater({ items: current }).items),
    [],
  );
  const prefill = useSharedProjectData(
    projectId,
    'procurement',
    procurementValues,
    setProcurementValues,
    !isEdit && !materialsLoading,
    materials,
  );

  const [initialized, setInitialized] = useState(false);

  // ============================================================
  // INITIALIZE EDIT DATA
  // ============================================================

  useEffect(() => {
    if (!isEdit || !existing || initialized) {
      return;
    }

    setProjectId(existing.projectId || '');

    setRemarks(existing.remarks || '');

    const existingItems = existing.items || [];
    const savedSheets = sheetsOf(existing);
    setSheets(savedSheets);
    const wanted = searchParams.get('sheet');
    setActiveSheet(savedSheets.some((sh) => sh.name === wanted) ? wanted : savedSheets[0]?.name);

    setItems(
      existingItems.length
        ? existingItems.map((item, index) =>
            calculateItem({
              serialNo: item.serialNo || index + 1,

              sheetName: itemSheet(item, savedSheets),

              area: item.area || '',

              location: item.location || '',

              materialId: item.materialId || item.materialMaster?.id || '',
              brand: item.brand || '',
              customValues: customValuesOf(item),

              wallArea: item.wallArea ?? '',

              floorArea: item.floorArea ?? '',

              ceilingArea: item.ceilingArea ?? '',

              manualTotalArea: savedManualTotalArea(item),

              quantity: item.quantity ?? '',

              price: item.price ?? '',

              amount: item.amount ?? '',
            }),
          )
        : [],
    );

    setInitialized(true);
  }, [existing, initialized, isEdit, searchParams]);

  // ============================================================
  // SHEETS (material types)
  // ============================================================

  const materialsById = useMemo(
    () => Object.fromEntries(materials.map((m) => [m.id, m])),
    [materials],
  );

  const sheetOfRow = (item) =>
    item.sheetName && sheets.some((sheet) => sheet.name === item.sheetName)
      ? item.sheetName
      : itemSheet(item, sheets, materialsById);

  const currentSheet = sheets.find((sheet) => sheet.name === activeSheet) || sheets[0];
  const activeName = currentSheet?.name;
  const customFields = currentSheet?.customFields ?? [];
  const columnOrder = procurementColumnOrder(currentSheet);
  const totalsStart = columnOrder.indexOf('totalArea');
  const customFieldDialog = sheetDialog?.mode === 'custom-field';
  const movingField = customFieldDialog && sheetDialog.fieldIndex !== undefined;

  const openCustomField = (fieldIndex) => {
    const position = columnOrder.indexOf(customColumn(fieldIndex));
    setSheetDialog({
      mode: 'custom-field',
      fieldIndex,
      name: customFields[fieldIndex] ?? '',
      side: position === 0 ? 'before' : 'after',
      anchor: position < 0 ? columnOrder.at(-1) : columnOrder[position === 0 ? 1 : position - 1],
    });
  };

  const visibleRows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => sheetOfRow(item) === activeName);

  const sheetStats = Object.fromEntries(
    sheets.map((sheet) => [sheet.name, { count: 0, amount: 0 }]),
  );
  items.forEach((item) => {
    const stat = sheetStats[sheetOfRow(item)];
    if (stat) {
      stat.count += 1;
      stat.amount += toNumber(item.amount);
    }
  });

  const sheetTypeMaterials = defaultMaterialsFor(currentSheet, materials);
  const sheetTypeIds = new Set(sheetTypeMaterials.map((m) => m.id));
  const otherMaterials = materials.filter((m) => !sheetTypeIds.has(m.id));

  const saveSheetDialog = () => {
    const name = String(sheetDialog?.name || '').trim();
    if (customFieldDialog) {
      if (!name) return toast.error('Enter a field name.');
      if (!movingField && customFields.some((field) => field.toLowerCase() === name.toLowerCase())) {
        return toast.error('A custom field with this name already exists.');
      }
      const column = customColumn(sheetDialog.fieldIndex ?? customFields.length);
      setSheets((current) => current.map((sheet) => (
        sheet.name === activeName ? {
          ...sheet,
          customFields: movingField ? customFields : [...customFields, name],
          columnOrder: placeProcurementColumn(columnOrder, column, sheetDialog.anchor, sheetDialog.side),
        } : sheet
      )));
      setSheetDialog(null);
      return;
    }
    if (!name) return toast.error('Enter a category name.');
    const clash = sheets.some(
      (sheet) => sheet.name.toLowerCase() === name.toLowerCase() && sheet.name !== sheetDialog.from,
    );
    if (clash) return toast.error('A category with this name already exists.');
    if (sheetDialog.mode === 'new') {
      setSheets((current) => [...current, { name, type: null }]);
    } else {
      const from = sheetDialog.from;
      setSheets((current) =>
        current.map((sheet) => (sheet.name === from ? { ...sheet, name } : sheet)),
      );
      setItems((current) =>
        current.map((item) => (sheetOfRow(item) === from ? { ...item, sheetName: name } : item)),
      );
    }
    setActiveSheet(name);
    setSheetDialog(null);
  };

  const deleteSheet = () => {
    const name = sheetDialog?.from;
    if (sheets.length === 1) {
      toast.error('A procurement sheet needs at least one material type.');
      return;
    }
    const remaining = sheets.filter((sheet) => sheet.name !== name);
    setItems((current) =>
      current
        .filter((item) => sheetOfRow(item) !== name)
        .map((item, index) => ({ ...item, serialNo: index + 1 })),
    );
    setSheets(remaining);
    setActiveSheet(remaining[0].name);
    setSheetDialog(null);
  };

  const addDefaultMaterials = () => {
    const have = new Set(visibleRows.map(({ item }) => item.materialId).filter(Boolean));
    const fresh = sheetTypeMaterials.filter((m) => !have.has(m.id));
    if (!fresh.length) {
      toast.info(
        sheetTypeMaterials.length
          ? 'All default materials of this type are already in the sheet.'
          : 'No materials of this type are available yet.',
      );
      return;
    }
    setItems((current) => [
      // drop untouched blank rows of this sheet before adding the defaults
      ...current.filter(
        (item) =>
          !(
            sheetOfRow(item) === activeName &&
            !item.materialId &&
            !item.area.trim() &&
            !item.location.trim()
          ),
      ),
      ...fresh.map((m, i) => ({
        ...createEmptyItem(current.length + i + 1, activeName),
        materialId: m.id,
      })),
    ]);
    toast.success(
      `${fresh.length} default material${fresh.length === 1 ? '' : 's'} added to ${activeName}.`,
    );
  };

  // ============================================================
  // TOTALS
  // ============================================================

  const totals = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        accumulator.totalArea += toNumber(item.totalArea);

        accumulator.quantity += toNumber(item.quantity);

        accumulator.amount += toNumber(item.amount);

        return accumulator;
      },
      {
        totalArea: 0,
        quantity: 0,
        amount: 0,
      },
    );
  }, [items]);

  // ============================================================
  // UPDATE ITEM
  // ============================================================

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return calculateItem({
          ...item,
          [field]: value,
        });
      }),
    );
  };

  // ============================================================
  // ADD ITEM
  // ============================================================

  const addItem = () => {
    setItems((current) => [...current, createEmptyItem(current.length + 1, activeSheet)]);
  };

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const removeItem = (index) => {
    setItems((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          serialNo: itemIndex + 1,
        })),
    );
  };

  // ============================================================
  // BUILD PAYLOAD
  // ============================================================

  const buildPayload = () => ({
    projectId,

    remarks: remarks.trim() || undefined,

    sheets: sheets.map((sheet) => ({
      name: sheet.name,
      ...(sheet.type ? { type: sheet.type } : {}),
      customFields: sheet.customFields,
      columnOrder: sheet.columnOrder,
    })),

    items: items
      .filter((item) => item.materialId)
      .map((item, index) => ({
        serialNo: index + 1,

        materialId: item.materialId,
        brand: item.brand?.trim() || undefined,
        customValues: item.customValues,

        sheetName: sheetOfRow(item),

        area: item.area.trim() || undefined,

        location: item.location.trim() || undefined,

        wallArea: item.wallArea === '' ? undefined : toNumber(item.wallArea),

        floorArea: item.floorArea === '' ? undefined : toNumber(item.floorArea),

        ceilingArea: item.ceilingArea === '' ? undefined : toNumber(item.ceilingArea),

        totalArea: item.totalArea === '' ? undefined : toNumber(item.totalArea),
        isTotalAreaManual: Boolean(item.manualTotalArea),

        quantity: toNumber(item.quantity),

        price: toNumber(item.price),

        amount: toNumber(item.amount),
      })),
  });

  // ============================================================
  // VALIDATE
  // ============================================================

  const validate = () => {
    if (!projectId) {
      toast.error('Please select a project.');

      return false;
    }

    const validItems = items.filter(
      (item) => item.materialId || item.area.trim() || item.location.trim(),
    );

    if (!validItems.length) {
      toast.error('Add at least one material item.');

      return false;
    }

    const missingMaterial = validItems.find((item) => !item.materialId);

    if (missingMaterial) {
      toast.error('Please select a material for every item.');

      return false;
    }

    if (validItems.some((item) => toNumber(item.manualTotalArea) < 0)) {
      toast.error('Enter a total area of zero or more.');
      return false;
    }

    return true;
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      const payload = buildPayload();

      if (isEdit) {
        await updateMaterialProcurement({
          id: editId,
          ...payload,
        }).unwrap();

        toast.success('Material procurement updated.');

        navigate(`/procurement/material-procurement/${editId}`);
      } else {
        const response = await createMaterialProcurement(payload).unwrap();

        const created = response?.data ?? response;

        toast.success('Material procurement created.');

        if (created?.id) {
          navigate(`/procurement/material-procurement/${created.id}`);
        } else {
          navigate('/procurement/material-procurement/list');
        }
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Unable to save material procurement.');
    }
  };

  // ============================================================
  // SAVE & SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      let procurementId = editId;

      const payload = buildPayload();

      if (!procurementId) {
        const response = await createMaterialProcurement(payload).unwrap();

        const created = response?.data ?? response;

        procurementId = created?.id;
      } else {
        await updateMaterialProcurement({
          id: editId,
          ...payload,
        }).unwrap();
      }

      if (!procurementId) {
        throw new Error('Procurement ID was not returned by the server.');
      }

      await submitMaterialProcurement(procurementId).unwrap();

      toast.success('Material procurement submitted.');

      navigate(`/procurement/material-procurement/${procurementId}`);
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || 'Unable to submit material procurement.',
      );
    }
  };

  // ============================================================
  // BUSY
  // ============================================================

  const busy = creating || updating || submitting || existingLoading || materialsLoading;

  // ============================================================
  // LOADING EDIT
  // ============================================================

  if (isEdit && existingLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
        eyebrow="Procurement" title="Edit Material Procurement" description="Loading procurement sheet..." />

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading procurement sheet...
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Procurement"
        title={isEdit ? 'Edit Material Procurement' : 'Create Material Procurement'}
        description={
          <>
            {isEdit
              ? 'Update the material procurement sheet.'
              : 'Create a digital material procurement sheet for a project.'}
            <PrefillNotice prefill={prefill} />
          </>
        }
      />

      {/* ========================================================
          TOP ACTIONS
      ======================================================== */}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/procurement/material-procurement/list')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {creating || updating ? 'Saving...' : (alreadySubmitted ? 'Save changes' : 'Save Draft')}
          </Button>

          {!alreadySubmitted && (
            <Button disabled={busy} onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Submitting...' : 'Save & Submit'}
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================
          PROCUREMENT DETAILS
      ======================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Procurement Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          {/* PROJECT */}

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>

            <select
              id="project"
              value={projectId}
              disabled={Boolean(projectIdFromUrl) || isEdit || projectsLoading || busy}
              onChange={(event) => setProjectId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select project</option>

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
          </div>

          {/* REMARKS */}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>

            <Input
              id="remarks"
              value={remarks}
              disabled={busy}
              placeholder="Optional remarks"
              onChange={(event) => setRemarks(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          ITEMS
      ======================================================== */}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Material Procurement Items</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Pick a category tab, then add its materials, quantities and
              prices.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setSheetDialog({ mode: 'new', name: '' })}
            disabled={busy}
          >
            <Layers className="mr-2 h-4 w-4" />
            Add category
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mps-tabs" role="tablist" aria-label="Procurement categories">
            {sheets.map((sheet) => {
              const stat = sheetStats[sheet.name] || { count: 0, amount: 0 };
              return (
                <button
                  key={sheet.name}
                  type="button"
                  role="tab"
                  aria-selected={sheet.name === activeName}
                  className={`mps-tab ${sheet.name === activeName ? 'is-active' : ''}`}
                  onClick={() => setActiveSheet(sheet.name)}
                >
                  <span>{sheet.name}</span>
                  <span className="mps-tab__count">{stat.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mps-sheetbar">
            <div>
              <strong>{activeName}</strong>
              <span className="mps-muted">
                {' '}
                · {visibleRows.length} item{visibleRows.length === 1 ? '' : 's'} · ₹{' '}
                {(sheetStats[activeName]?.amount || 0).toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(currentSheet?.type || sheetTypeMaterials.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDefaultMaterials}
                  disabled={busy || materialsLoading}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add default materials
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCustomField()}
                disabled={busy || customFields.length >= 20}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add custom field
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSheetDialog({ mode: 'rename', from: activeName, name: activeName })
                }
                disabled={busy}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setSheetDialog({ mode: 'delete', from: activeName })}
                disabled={busy || sheets.length === 1}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete sheet
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1450px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <ProcurementColumns order={columnOrder} standard={EDIT_COLUMNS} renderCustom={(fieldIndex) => (
                    <th scope="col" className="min-w-[150px] px-3 py-3 text-left font-medium">
                      <button type="button" disabled={busy} onClick={() => openCustomField(fieldIndex)}
                        aria-label={`Move ${customFields[fieldIndex]} column`} className="inline-flex items-center gap-2">
                        {customFields[fieldIndex]} <Pencil className="h-3 w-3" />
                      </button>
                    </th>
                  )}>
                  <th className="w-14 px-3 py-3 text-left font-medium">#</th>

                  <th className="min-w-[150px] px-3 py-3 text-left font-medium">Area</th>

                  <th className="min-w-[150px] px-3 py-3 text-left font-medium">Location</th>

                  <th className="min-w-[260px] px-3 py-3 text-left font-medium">
                    Material *
                  </th>

                  <th className="min-w-[150px] px-3 py-3 text-left font-medium">Brand</th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">Wall (Sq.ft)</th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">Floor (Sq.ft)</th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">Ceiling (Sq.ft)</th>

                  <th className="min-w-[130px] px-3 py-3 text-left font-medium">Total Area</th>

                  <th className="min-w-[110px] px-3 py-3 text-left font-medium">Quantity</th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">Price</th>

                  <th className="min-w-[130px] px-3 py-3 text-left font-medium">Amount</th>

                  </ProcurementColumns>

                  <th className="w-16 px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={13 + customFields.length} className="px-3 py-10 text-center text-muted-foreground">
                      No materials in {activeName} yet.{' '}
                      {currentSheet?.type || sheetTypeMaterials.length > 0
                        ? 'Use “Add default materials” or “Add Material”.'
                        : 'Use “Add Material”.'}
                    </td>
                  </tr>
                )}
                {visibleRows.map(({ item, index }, rowIndex) => {
                  const selectedMaterial = materialsById[item.materialId];

                  return (
                    <tr key={`material-${index}`} className="border-b last:border-b-0">
                      <ProcurementColumns order={columnOrder} standard={EDIT_COLUMNS} renderCustom={(fieldIndex) => (
                        <td className="px-2 py-2">
                          <Input
                            aria-label={`${customFields[fieldIndex]} for row ${rowIndex + 1}`}
                            value={item.customValues?.[fieldIndex] ?? ''}
                            maxLength={500}
                            disabled={busy}
                            onChange={(event) => updateItem(index, 'customValues', customFields.map(
                              (_, valueIndex) => valueIndex === fieldIndex
                                ? event.target.value
                                : item.customValues?.[valueIndex] ?? '',
                            ))}
                          />
                        </td>
                      )}>
                      {/* SERIAL */}

                      <td className="px-3 py-2 align-top font-medium">{rowIndex + 1}</td>

                      {/* AREA */}

                      <td className="px-2 py-2">
                        <Input
                          value={item.area}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'area', event.target.value)}
                          placeholder="Area"
                        />
                      </td>

                      {/* LOCATION */}

                      <td className="px-2 py-2">
                        <Input
                          value={item.location}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'location', event.target.value)}
                          placeholder="Location"
                        />
                      </td>

                      {/* MATERIAL MASTER */}

                      <td className="px-2 py-2">
                        <select
                          value={item.materialId}
                          disabled={busy}
                          onChange={(event) => {
                            const { value } = event.target;
                            if (value === 'create-material') {
                              setCreateMaterialRow(index);
                              return;
                            }
                            updateItem(index, 'materialId', value);
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">
                            {materialsLoading
                              ? 'Loading materials...'
                              : item.description || 'Select material'}
                          </option>
                          {canCreateMaterial && <option value="create-material">+ Create Material</option>}

                          {[
                            [sheetTypeMaterials, activeName],
                            [otherMaterials, sheetTypeMaterials.length ? 'Other materials' : null],
                          ].map(([list, label]) => {
                            if (!list.length) return null;
                            const options = list.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.name}
                                {material.brand ? ` (${material.brand})` : ''}
                              </option>
                            ));
                            return label ? (
                              <optgroup key={label} label={label}>
                                {options}
                              </optgroup>
                            ) : (
                              options
                            );
                          })}
                        </select>

                        {/* SELECTED MATERIAL INFO */}

                        {selectedMaterial && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {selectedMaterial.category ? `${selectedMaterial.category} • ` : ''}

                            {selectedMaterial.unit?.name
                              ? selectedMaterial.unit.name
                              : 'Unit not specified'}
                          </div>
                        )}
                      </td>

                      <td className="px-2 py-2">
                        <Input
                          aria-label={`Brand for row ${rowIndex + 1}`}
                          value={item.brand ?? ''}
                          placeholder={selectedMaterial?.brand || 'Optional'}
                          maxLength={150}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'brand', event.target.value)}
                        />
                      </td>

                      {/* WALL */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.wallArea}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'wallArea', event.target.value)}
                          placeholder="0"
                        />
                      </td>

                      {/* FLOOR */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.floorArea}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'floorArea', event.target.value)}
                          placeholder="0"
                        />
                      </td>

                      {/* CEILING */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.ceilingArea}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'ceilingArea', event.target.value)}
                          placeholder="0"
                        />
                      </td>

                      {/* TOTAL AREA */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={`Total area for row ${rowIndex + 1}`}
                          aria-describedby="procurement-total-area-hint"
                          value={item.manualTotalArea ?? ''}
                          placeholder={item.totalArea || 'Auto'}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'manualTotalArea', event.target.value)}
                        />
                      </td>

                      {/* QUANTITY */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                          placeholder="0"
                        />
                      </td>

                      {/* PRICE */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.price}
                          disabled={busy}
                          onChange={(event) => updateItem(index, 'price', event.target.value)}
                          placeholder="0.00"
                        />
                      </td>

                      {/* AMOUNT */}

                      <td className="px-2 py-2">
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 font-medium">
                          {item.amount || '—'}
                        </div>
                      </td>

                      </ProcurementColumns>

                      {/* DELETE */}

                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busy}
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* ==================================================
                  TOTALS
              ================================================== */}

              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td colSpan={totalsStart} className="px-3 py-4 text-right">
                    <span className="inline-flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Totals · all sheets
                    </span>
                  </td>

                  {columnOrder.slice(totalsStart).map((column) => (
                    <td key={column} className="px-3 py-4">{{
                      totalArea: totals.totalArea.toFixed(2),
                      quantity: totals.quantity.toFixed(3),
                      amount: `₹ ${totals.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      })}`,
                    }[column]}</td>
                  ))}

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ADD */}

          <div className="mt-4 flex justify-between gap-3">
            <p id="procurement-total-area-hint" className="text-xs text-muted-foreground">
              Enter a Total Area manually or leave it blank to use Wall, Floor and Ceiling combined.
            </p>

            <Button variant="outline" onClick={addItem} disabled={busy}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          BOTTOM ACTIONS
      ======================================================== */}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => navigate('/procurement/material-procurement/list')}
        >
          Cancel
        </Button>

        <Button variant="outline" disabled={busy} onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />

          {creating || updating ? 'Saving...' : (alreadySubmitted ? 'Save changes' : 'Save Draft')}
        </Button>

        {!alreadySubmitted && (
          <Button disabled={busy} onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            {submitting ? 'Submitting...' : 'Save & Submit'}
          </Button>
        )}
      </div>
      {createMaterialRow !== null && (
        <CreateMaterialForm
          onCancel={() => setCreateMaterialRow(null)}
          onSuccess={(material) => {
            setCreatedMaterials((current) => [...current, material]);
            updateItem(createMaterialRow, 'materialId', material.id);
            setCreateMaterialRow(null);
            toast.success('Material created and selected.');
          }}
        />
      )}

      {sheetDialog && (
        <Modal
          open
          onClose={() => setSheetDialog(null)}
          title={
            sheetDialog.mode === 'new'
              ? 'Add procurement category'
              : sheetDialog.mode === 'rename'
                ? 'Rename sheet'
                : customFieldDialog ? (movingField ? 'Move custom field' : 'Add custom field') : 'Delete sheet?'
          }
          width={440}
          footer={
            <>
              <Button variant="outline" onClick={() => setSheetDialog(null)}>
                Cancel
              </Button>
              {sheetDialog.mode === 'delete' ? (
                <Button variant="destructive" onClick={deleteSheet}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete sheet
                </Button>
              ) : (
                <Button onClick={saveSheetDialog}>
                  {sheetDialog.mode === 'new'
                    ? 'Add category'
                    : customFieldDialog ? (movingField ? 'Move field' : 'Add field') : 'Rename'}
                </Button>
              )}
            </>
          }
        >
          {sheetDialog.mode === 'delete' ? (
            <p className="text-sm leading-relaxed">
              <strong>{sheetDialog.from}</strong> and its {sheetStats[sheetDialog.from]?.count || 0}{' '}
              material
              {(sheetStats[sheetDialog.from]?.count || 0) === 1 ? '' : 's'} will be removed from
              this procurement sheet when you save.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sheet-name">
                {customFieldDialog ? 'Field name' : 'Category name'}
              </Label>
              <Input
                id="sheet-name"
                autoFocus
                maxLength={customFieldDialog ? 80 : 120}
                value={sheetDialog.name}
                readOnly={movingField}
                list={sheetDialog.mode === 'new' ? 'procurement-category-names' : undefined}
                placeholder={customFieldDialog ? 'e.g. Finish' : 'e.g. Wallpaper'}
                onChange={(event) => setSheetDialog((d) => ({ ...d, name: event.target.value }))}
                onKeyDown={(event) => event.key === 'Enter' && saveSheetDialog()}
              />
              {sheetDialog.mode === 'new' && (
                <datalist id="procurement-category-names">
                  {[...new Set(materials.map((material) => material.category?.trim()).filter(Boolean))]
                    .filter((category) => !sheets.some((sheet) => sheet.name.toLowerCase() === category.toLowerCase()))
                    .sort((a, b) => a.localeCompare(b))
                    .map((category) => <option key={category} value={category} />)}
                </datalist>
              )}
              {customFieldDialog && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span>Placement</span>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3"
                      value={sheetDialog.side} onChange={(event) => setSheetDialog({ ...sheetDialog, side: event.target.value })}>
                      <option value="before">Before</option>
                      <option value="after">After</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Column</span>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3"
                      value={sheetDialog.anchor} onChange={(event) => setSheetDialog({ ...sheetDialog, anchor: event.target.value })}>
                      {columnOrder.filter((column) => column !== customColumn(sheetDialog.fieldIndex)).map((column) => (
                        <option key={column} value={column}>
                          {SHEET_COLUMNS[column] ?? customFields[customColumnIndex(column)]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
