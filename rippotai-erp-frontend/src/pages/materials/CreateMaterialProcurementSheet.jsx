import { useEffect, useMemo, useState, useCallback } from "react";
import { useRefill } from "@/components/doc-list/useRefill";
import { PrefillNotice } from "@/components/PrefillNotice";
import { useSharedProjectData } from '../../hooks/use-shared-project-data';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Send, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateMaterialProcurementMutation,
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
  useUpdateMaterialProcurementMutation,
} from "../../api/procuerment/material-procurement.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

import { Page, PageHeader, Button, Card, Field, TextInput, SelectInput, TextArea, Stats, StatTile } from "@/components/inos";

// ============================================================
// EMPTY ITEM
// ============================================================

const createEmptyItem = (serialNo = 1) => ({
  serialNo,

  area: "",
  location: "",

  // Material Master
  materialId: "",

  wallArea: "",
  floorArea: "",
  ceilingArea: "",
  totalArea: "",

  quantity: "",
  price: "",
  amount: "",
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

const calculateItem = (item) => {
  const wallArea = toNumber(item.wallArea);
  const floorArea = toNumber(item.floorArea);
  const ceilingArea = toNumber(item.ceilingArea);

  const totalArea = wallArea + floorArea + ceilingArea;

  const quantity = toNumber(item.quantity);
  const price = toNumber(item.price);

  return {
    ...item,

    totalArea: wallArea || floorArea || ceilingArea ? totalArea.toFixed(2) : "",

    amount: quantity || price ? (quantity * price).toFixed(2) : "",
  };
};

// ============================================================
// COMPONENT
// ============================================================

export default function CreateMaterialProcurementSheet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ============================================================
  // URL
  // ============================================================

  const projectIdFromUrl =
    searchParams.get("projectId") || searchParams.get("project_id");

  const { id: routeId } = useParams();
  const editId = routeId || searchParams.get("id");

  const isEdit = Boolean(editId);

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery();

  // ============================================================
  // MATERIAL MASTER
  // ============================================================

  const { data: materialsResponse, isLoading: materialsLoading } =
    useGetMaterialsQuery({
      isActive: true,
    });

  // ============================================================
  // EXISTING PROCUREMENT
  // ============================================================

  const { data: existingResponse, isLoading: existingLoading } =
    useGetMaterialProcurementQuery(editId, {
      skip: !editId,
    });

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

  const projects =
    projectsResponse?.data?.data ??
    projectsResponse?.data ??
    projectsResponse ??
    [];

  // ============================================================
  // NORMALIZE MATERIALS
  // ============================================================

  const materials =
    materialsResponse?.data?.data ??
    materialsResponse?.data ??
    materialsResponse ??
    [];

  // ============================================================
  // EXISTING
  // ============================================================

  const existing = existingResponse?.data ?? existingResponse;

  // ============================================================
  // STATE
  // ============================================================

  const [projectId, setProjectId] = useState(projectIdFromUrl || "");
  useRefill({ type: "procurement-sheet", label: "Procurement Sheet", projectId, enabled: !isEdit, editPath: (id) => `/procurement/material-procurement/${id}/edit` });

  const [remarks, setRemarks] = useState("");

  const [items, setItems] = useState([createEmptyItem(1)]);
  const procurementValues = useMemo(() => ({ items }), [items]);
  const setProcurementValues = useCallback(updater => setItems(current => updater({ items: current }).items), []);
  const prefill = useSharedProjectData(projectId, 'procurement', procurementValues, setProcurementValues, !isEdit && !materialsLoading, materials);

  const [initialized, setInitialized] = useState(false);

  // ============================================================
  // INITIALIZE EDIT DATA
  // ============================================================

  useEffect(() => {
    if (!isEdit || !existing || initialized) {
      return;
    }

    setProjectId(existing.projectId || "");

    setRemarks(existing.remarks || "");

    const existingItems = existing.items || [];

    setItems(
      existingItems.length
        ? existingItems.map((item, index) =>
            calculateItem({
              serialNo: item.serialNo || index + 1,

              area: item.area || "",

              location: item.location || "",

              materialId: item.materialId || item.materialMaster?.id || "",

              wallArea: item.wallArea ?? "",

              floorArea: item.floorArea ?? "",

              ceilingArea: item.ceilingArea ?? "",

              totalArea: item.totalArea ?? "",

              quantity: item.quantity ?? "",

              price: item.price ?? "",

              amount: item.amount ?? "",
            }),
          )
        : [createEmptyItem(1)],
    );

    setInitialized(true);
  }, [existing, initialized, isEdit]);

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
    setItems((current) => [...current, createEmptyItem(current.length + 1)]);
  };

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error("At least one material item is required.");

      return;
    }

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

    items: items
      .filter((item) => item.materialId)
      .map((item, index) => ({
        serialNo: index + 1,

        materialId: item.materialId,

        area: item.area.trim() || undefined,

        location: item.location.trim() || undefined,

        wallArea: item.wallArea === "" ? undefined : toNumber(item.wallArea),

        floorArea: item.floorArea === "" ? undefined : toNumber(item.floorArea),

        ceilingArea:
          item.ceilingArea === "" ? undefined : toNumber(item.ceilingArea),

        totalArea: item.totalArea === "" ? undefined : toNumber(item.totalArea),

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
      toast.error("Please select a project.");

      return false;
    }

    const validItems = items.filter(
      (item) => item.materialId || item.area.trim() || item.location.trim(),
    );

    if (!validItems.length) {
      toast.error("Add at least one material item.");

      return false;
    }

    const missingMaterial = validItems.find((item) => !item.materialId);

    if (missingMaterial) {
      toast.error("Please select a Material Master for every item.");

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

        toast.success("Material procurement updated.");

        navigate(`/procurement/material-procurement/${editId}`);
      } else {
        const response = await createMaterialProcurement(payload).unwrap();

        const created = response?.data ?? response;

        toast.success("Material procurement created.");

        if (created?.id) {
          navigate(`/procurement/material-procurement/${created.id}`);
        } else {
          navigate("/procurement/material-procurement/list");
        }
      }
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save material procurement.",
      );
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
        throw new Error("Procurement ID was not returned by the server.");
      }

      await submitMaterialProcurement(procurementId).unwrap();

      toast.success("Material procurement submitted.");

      navigate(`/procurement/material-procurement/${procurementId}`);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to submit material procurement.",
      );
    }
  };

  // ============================================================
  // BUSY
  // ============================================================

  const busy =
    creating || updating || submitting || existingLoading || materialsLoading;

  // ============================================================
  // LOADING EDIT
  // ============================================================

  if (isEdit && existingLoading) return <Page><PageHeader title="Edit Material Procurement" /><Card>Loading procurement sheet…</Card></Page>;
  const amountLabel = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const renderNumberInput = (item, index, key, label) => <TextInput type="number" min="0" aria-label={`${label} for item ${index + 1}`} value={item[key]} disabled={busy} onChange={(e) => updateItem(index, key, e.target.value)} placeholder="0" />;
  return <Page>
    <PageHeader title={isEdit ? 'Edit Material Procurement' : 'Create Material Procurement'} info={existing?.procurementNo} actions={<>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/procurement/material-procurement/list')}>Back</Button>
      <Button variant="secondary" icon={Save} disabled={busy} onClick={handleSave}>{creating || updating ? 'Saving…' : 'Save Draft'}</Button>
      <Button variant="primary" icon={Send} disabled={busy} onClick={handleSubmit}>{submitting ? 'Submitting…' : 'Save & Submit'}</Button>
    </>} />
    <PrefillNotice prefill={prefill} />
    <Stats>
      <StatTile label="Material items" value={items.filter((item) => item.materialId).length} icon={<PackageSearch />} />
      <StatTile label="Total area" value={totals.totalArea.toFixed(2)} meta="sq.ft" />
      <StatTile label="Total quantity" value={totals.quantity.toFixed(3)} />
      <StatTile label="Procurement value" value={`₹ ${amountLabel(totals.amount)}`} />
    </Stats>
    <Card title="Procurement details"><div className="inos-form-grid">
      <Field label="Project" required htmlFor="project"><SelectInput id="project" value={projectId} disabled={Boolean(projectIdFromUrl) || isEdit || projectsLoading || busy} onChange={(e) => setProjectId(e.target.value)} placeholder="Select project">
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.projectName || project.title || project.code || project.id}</option>)}
      </SelectInput></Field>
      <Field label="Remarks" optional htmlFor="remarks"><TextArea id="remarks" rows={2} value={remarks} disabled={busy} placeholder="Add remarks for this procurement sheet" onChange={(e) => setRemarks(e.target.value)} /></Field>
    </div></Card>
    <Card title="Material procurement items" subtitle="Choose materials, enter measurements and set quantities and prices." flush actions={<Button variant="secondary" icon={Plus} onClick={addItem} disabled={busy}>Add material</Button>}>
      <div className="inos-table-wrap"><table className="inos-table" style={{ minWidth: 1550 }}>
        <thead><tr><th rowSpan={2}>S.No</th><th rowSpan={2} style={{ minWidth: 140 }}>Area</th><th rowSpan={2} style={{ minWidth: 140 }}>Location</th><th rowSpan={2} style={{ minWidth: 280 }}>Material *</th><th colSpan={4} className="text-center">Surface area · sq.ft</th><th colSpan={3} className="text-center">Quantity & pricing</th><th rowSpan={2} aria-label="Item actions" /></tr>
          <tr><th>Wall</th><th>Floor</th><th>Ceiling</th><th>Total area</th><th>Quantity</th><th>Price</th><th className="text-right">Amount</th></tr>
        </thead>
        <tbody>{items.map((item, index) => {
          const material = materials.find((entry) => entry.id === item.materialId);
          return <tr key={`material-${index}`}>
            <td>{index + 1}</td>
            <td><TextInput aria-label={`Area for item ${index + 1}`} value={item.area} disabled={busy} onChange={(e) => updateItem(index, 'area', e.target.value)} placeholder="Area" /></td>
            <td><TextInput aria-label={`Location for item ${index + 1}`} value={item.location} disabled={busy} onChange={(e) => updateItem(index, 'location', e.target.value)} placeholder="Location" /></td>
            <td><SelectInput aria-label={`Material for item ${index + 1}`} value={item.materialId} disabled={busy} onChange={(e) => updateItem(index, 'materialId', e.target.value)} placeholder={materialsLoading ? 'Loading materials…' : item.description || 'Select material'}>
              {materials.map((entry) => <option key={entry.id} value={entry.id}>{entry.material_code ? `${entry.material_code} — ` : ''}{entry.name}{entry.brand ? ` (${entry.brand})` : ''}</option>)}
            </SelectInput>{material && <div className="inos-hint mt-1">{material.category ? `${material.category} · ` : ''}{material.unit?.name || 'Unit not specified'}</div>}</td>
            <td style={{ minWidth: 100 }}>{renderNumberInput(item, index, 'wallArea', 'Wall area')}</td><td style={{ minWidth: 100 }}>{renderNumberInput(item, index, 'floorArea', 'Floor area')}</td><td style={{ minWidth: 100 }}>{renderNumberInput(item, index, 'ceilingArea', 'Ceiling area')}</td>
            <td className="text-right font-semibold tabular-nums">{item.totalArea || '—'}</td><td style={{ minWidth: 100 }}>{renderNumberInput(item, index, 'quantity', 'Quantity')}</td><td style={{ minWidth: 110 }}>{renderNumberInput(item, index, 'price', 'Price')}</td><td className="text-right font-semibold tabular-nums whitespace-nowrap">{item.amount === '' ? '—' : `₹ ${amountLabel(item.amount)}`}</td>
            <td><Button variant="ghost" icon={Trash2} aria-label={`Remove material ${index + 1}`} disabled={busy || items.length === 1} onClick={() => removeItem(index)} /></td>
          </tr>;
        })}</tbody>
        <tfoot><tr><td colSpan={7}>Totals</td><td className="text-right">{totals.totalArea.toFixed(2)}</td><td className="text-right">{totals.quantity.toFixed(3)}</td><td /><td className="text-right whitespace-nowrap">₹ {amountLabel(totals.amount)}</td><td /></tr></tfoot>
      </table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="inos-hint">Total area and amount calculate automatically. Material details come from Material Master.</p><Button variant="ghost" icon={Plus} onClick={addItem} disabled={busy}>Add material</Button></div>
    </Card>
  </Page>;
}
