import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Send, Calculator } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateMaterialProcurementMutation,
  useGetMaterialProcurementQuery,
  useSubmitMaterialProcurementMutation,
  useUpdateMaterialProcurementMutation,
} from "../../api/procuerment/material-procurement.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

import { PageHeader } from "@/components/site-ops/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const editId = searchParams.get("id");

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

  const [remarks, setRemarks] = useState("");

  const [items, setItems] = useState([createEmptyItem(1)]);

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

        navigate(`/material-procurement/${editId}`);
      } else {
        const response = await createMaterialProcurement(payload).unwrap();

        const created = response?.data ?? response;

        toast.success("Material procurement created.");

        if (created?.id) {
          navigate(`/material-procurement/${created.id}`);
        } else {
          navigate("/material-procurement");
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

      navigate(`/material-procurement/${procurementId}`);
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

  if (isEdit && existingLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Material Procurement"
          description="Loading procurement sheet..."
        />

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
        title={
          isEdit ? "Edit Material Procurement" : "Create Material Procurement"
        }
        description={
          isEdit
            ? "Update the material procurement sheet."
            : "Create a digital material procurement sheet for a project."
        }
      />

      {/* ========================================================
          TOP ACTIONS
      ======================================================== */}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/material-procurement")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {creating || updating ? "Saving..." : "Save Draft"}
          </Button>

          <Button disabled={busy} onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Submitting..." : "Save & Submit"}
          </Button>
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
              disabled={
                Boolean(projectIdFromUrl) || isEdit || projectsLoading || busy
              }
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
              Select materials from Material Master and enter the required
              quantities and pricing.
            </p>
          </div>

          <Button variant="outline" onClick={addItem} disabled={busy}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1450px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-14 px-3 py-3 text-left font-medium">#</th>

                  <th className="min-w-[150px] px-3 py-3 text-left font-medium">
                    Area
                  </th>

                  <th className="min-w-[150px] px-3 py-3 text-left font-medium">
                    Location
                  </th>

                  <th className="min-w-[260px] px-3 py-3 text-left font-medium">
                    Material Master *
                  </th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">
                    Wall (Sq.ft)
                  </th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">
                    Floor (Sq.ft)
                  </th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">
                    Ceiling (Sq.ft)
                  </th>

                  <th className="min-w-[130px] px-3 py-3 text-left font-medium">
                    Total Area
                  </th>

                  <th className="min-w-[110px] px-3 py-3 text-left font-medium">
                    Quantity
                  </th>

                  <th className="min-w-[120px] px-3 py-3 text-left font-medium">
                    Price
                  </th>

                  <th className="min-w-[130px] px-3 py-3 text-left font-medium">
                    Amount
                  </th>

                  <th className="w-16 px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => {
                  const selectedMaterial = materials.find(
                    (material) => material.id === item.materialId,
                  );

                  return (
                    <tr
                      key={`material-${index}`}
                      className="border-b last:border-b-0"
                    >
                      {/* SERIAL */}

                      <td className="px-3 py-2 align-top font-medium">
                        {index + 1}
                      </td>

                      {/* AREA */}

                      <td className="px-2 py-2">
                        <Input
                          value={item.area}
                          disabled={busy}
                          onChange={(event) =>
                            updateItem(index, "area", event.target.value)
                          }
                          placeholder="Area"
                        />
                      </td>

                      {/* LOCATION */}

                      <td className="px-2 py-2">
                        <Input
                          value={item.location}
                          disabled={busy}
                          onChange={(event) =>
                            updateItem(index, "location", event.target.value)
                          }
                          placeholder="Location"
                        />
                      </td>

                      {/* MATERIAL MASTER */}

                      <td className="px-2 py-2">
                        <select
                          value={item.materialId}
                          disabled={busy}
                          onChange={(event) =>
                            updateItem(index, "materialId", event.target.value)
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">
                            {materialsLoading
                              ? "Loading materials..."
                              : "Select material"}
                          </option>

                          {materials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.material_code
                                ? `${material.material_code} — `
                                : ""}
                              {material.name}

                              {material.brand ? ` (${material.brand})` : ""}
                            </option>
                          ))}
                        </select>

                        {/* SELECTED MATERIAL INFO */}

                        {selectedMaterial && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {selectedMaterial.category
                              ? `${selectedMaterial.category} • `
                              : ""}

                            {selectedMaterial.unit?.name
                              ? selectedMaterial.unit.name
                              : "Unit not specified"}
                          </div>
                        )}
                      </td>

                      {/* WALL */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.wallArea}
                          disabled={busy}
                          onChange={(event) =>
                            updateItem(index, "wallArea", event.target.value)
                          }
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
                          onChange={(event) =>
                            updateItem(index, "floorArea", event.target.value)
                          }
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
                          onChange={(event) =>
                            updateItem(index, "ceilingArea", event.target.value)
                          }
                          placeholder="0"
                        />
                      </td>

                      {/* TOTAL AREA */}

                      <td className="px-2 py-2">
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 font-medium">
                          {item.totalArea || "—"}
                        </div>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          disabled={busy}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
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
                          onChange={(event) =>
                            updateItem(index, "price", event.target.value)
                          }
                          placeholder="0.00"
                        />
                      </td>

                      {/* AMOUNT */}

                      <td className="px-2 py-2">
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 font-medium">
                          {item.amount || "—"}
                        </div>
                      </td>

                      {/* DELETE */}

                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busy || items.length === 1}
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
                  <td colSpan={7} className="px-3 py-4 text-right">
                    <span className="inline-flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Totals
                    </span>
                  </td>

                  <td className="px-3 py-4">{totals.totalArea.toFixed(2)}</td>

                  <td className="px-3 py-4">{totals.quantity.toFixed(3)}</td>

                  <td />

                  <td className="px-3 py-4">
                    ₹{" "}
                    {totals.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ADD */}

          <div className="mt-4 flex justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Total area and amount are calculated automatically. Material
              details are pulled from Material Master.
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
          onClick={() => navigate("/material-procurement")}
        >
          Cancel
        </Button>

        <Button variant="outline" disabled={busy} onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />

          {creating || updating ? "Saving..." : "Save Draft"}
        </Button>

        <Button disabled={busy} onClick={handleSubmit}>
          <Send className="mr-2 h-4 w-4" />

          {submitting ? "Submitting..." : "Save & Submit"}
        </Button>
      </div>
    </div>
  );
}
