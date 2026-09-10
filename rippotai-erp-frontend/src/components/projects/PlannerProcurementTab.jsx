import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Card, Input } from "../../hooks/shared";

import {
  useListProcurementCategoriesQuery,
  useListVendorProcurementsQuery,
  useCreateVendorProcurementMutation,
  useUpdateVendorProcurementMutation,
  useDeleteVendorProcurementMutation,
} from "../../api/documents/project-planner.api";

// Date columns tracked per row, matched to the model / DTO field names.
const DATE_FIELDS = [
  { key: "estimate_finalised_date", label: "Estimate Finalised" },
  { key: "quotation_finalised_date", label: "Quotation Finalised" },
  { key: "labour_start_date", label: "Labour Start" },
  { key: "labour_end_date", label: "Labour End" },
  { key: "material_purchase_date", label: "Material Purchased" },
  { key: "material_received_date", label: "Material Received" },
];

function toDateInputValue(value) {
  if (!value) return "";
  // Handles both ISO strings and Date objects coming back from the API.
  return String(value).slice(0, 10);
}

export function PlannerProcurementTab({ projectId }) {
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  const { data: categories = [] } = useListProcurementCategoriesQuery();

  const { data: rows, isFetching } = useListVendorProcurementsQuery(projectId, {
    skip: !projectId,
  });

  const [createRow, { isLoading: isCreating }] =
    useCreateVendorProcurementMutation();
  const [updateRow] = useUpdateVendorProcurementMutation();
  const [deleteRow] = useDeleteVendorProcurementMutation();

  const rowList = Array.isArray(rows) ? rows : [];

  const categoryLabel = (id) =>
    categories.find((category) => category.id === id)?.name || "—";

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------

  const handleAddRow = async () => {
    if (!newCategoryId) {
      toast.error("Select a procurement category");
      return;
    }
    try {
      await createRow({
        projectId,
        procurement_category_id: newCategoryId,
        vendor_name: newVendorName.trim() || null,
      }).unwrap();
      toast.success("Row added");
      setNewCategoryId("");
      setNewVendorName("");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to add row",
      );
    }
  };

  const handleFieldChange = async (row, field, value) => {
    try {
      await updateRow({
        projectId,
        rowId: row.id,
        [field]: value || null,
      }).unwrap();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to update row",
      );
    }
  };

  const handleRemoveRow = async (row) => {
    if (!window.confirm("Remove this procurement row?")) return;
    try {
      await deleteRow({ projectId, rowId: row.id }).unwrap();
      toast.success("Row removed");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to remove row",
      );
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="space-y-5">
      <Card>
        {isFetching ? (
          <p className="text-sm text-[#6B7B7C]">Loading procurement…</p>
        ) : rowList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No vendor / procurement rows yet. Add one below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 font-semibold text-[#333333]">
                    Category
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-[#333333]">
                    Vendor
                  </th>
                  {DATE_FIELDS.map((field) => (
                    <th
                      key={field.key}
                      className="text-left py-2 px-2 font-semibold text-[#333333] whitespace-nowrap"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rowList.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-[#333333]">
                      {row.category?.name ||
                        categoryLabel(row.procurement_category_id)}
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="bc-input h-8 text-sm w-36"
                        defaultValue={row.vendor_name || ""}
                        onBlur={(event) =>
                          handleFieldChange(
                            row,
                            "vendor_name",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    {DATE_FIELDS.map((field) => (
                      <td key={field.key} className="py-2 px-2">
                        <input
                          type="date"
                          className="bc-input h-8 text-sm"
                          defaultValue={toDateInputValue(row[field.key])}
                          onChange={(event) =>
                            handleFieldChange(
                              row,
                              field.key,
                              event.target.value,
                            )
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-[#333333] mb-3">Add Row</h3>
        <div className="grid grid-cols-[220px_1fr_auto] gap-2">
          <select
            className="bc-input h-10"
            value={newCategoryId}
            onChange={(event) => setNewCategoryId(event.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Vendor name (optional)"
            value={newVendorName}
            onChange={(event) => setNewVendorName(event.target.value)}
          />
          <button
            type="button"
            onClick={handleAddRow}
            disabled={isCreating}
            className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {categories.length === 0 && (
          <p className="mt-2 text-xs text-amber-700">
            No procurement categories exist yet. Add them from Master Data
            before adding rows here.
          </p>
        )}
      </Card>
    </div>
  );
}

export default PlannerProcurementTab;
