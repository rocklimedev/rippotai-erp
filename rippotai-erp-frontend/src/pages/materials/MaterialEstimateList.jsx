import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Shell, Card, Input } from "../../hooks/shared";
import { useAuth } from "@/context/AuthContext";

import {
  useApproveMaterialEstimateMutation,
  useCreateMaterialEstimateMutation,
  useGetMaterialEstimatesForRequirementQuery,
  useRejectMaterialEstimateMutation,
} from "../../api/procuerment/procurent.api";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const errorText = (error, fallback) =>
  error?.data?.message || error?.message || fallback;

/**
 * Procurement estimate for one material requirement. An estimate is created
 * PENDING and is then approved (or rejected); purchase orders are raised
 * directly against the approved estimate.
 */
export default function MaterialEstimateList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ quantity: "", unit: "", unitRate: "" });

  const requirementId =
    new URLSearchParams(window.location.search).get(
      "material_requirement_id",
    ) || "";

  const { data, isLoading, isFetching } =
    useGetMaterialEstimatesForRequirementQuery(requirementId, {
      skip: !requirementId,
    });
  const [createEstimate, { isLoading: isCreating }] =
    useCreateMaterialEstimateMutation();
  const [approveEstimate, { isLoading: isApproving }] =
    useApproveMaterialEstimateMutation();
  const [rejectEstimate, { isLoading: isRejecting }] =
    useRejectMaterialEstimateMutation();

  // The backend keeps one estimate per requirement.
  const rows = useMemo(() => {
    if (Array.isArray(data)) return data;
    return data?.id ? [data] : [];
  }, [data]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        (r.unit || "").toLowerCase().includes(term) ||
        (r.approvalStatus || r.approval_status || "")
          .toLowerCase()
          .includes(term),
    );
  }, [rows, q]);

  const approver = user?.name || user?.email || user?.id || "INOS user";

  const create = async (event) => {
    event.preventDefault();
    try {
      await createEstimate({
        materialRequirementId: requirementId,
        quantity: Number(draft.quantity),
        unit: draft.unit.trim(),
        unitRate: Number(draft.unitRate),
      }).unwrap();
      setDraft({ quantity: "", unit: "", unitRate: "" });
      toast.success("Estimate created");
    } catch (error) {
      toast.error(errorText(error, "Couldn't create the estimate"));
    }
  };

  const decide = async (id, approve) => {
    try {
      await (approve ? approveEstimate : rejectEstimate)({
        id,
        body: { approvedBy: approver },
      }).unwrap();
      toast.success(approve ? "Estimate approved" : "Estimate rejected");
    } catch (error) {
      toast.error(errorText(error, "Couldn't update the estimate"));
    }
  };

  const busy = isApproving || isRejecting;
  const canCreate =
    requirementId &&
    !rows.length &&
    Number(draft.quantity) > 0 &&
    draft.unit.trim() &&
    draft.unitRate !== "";

  return (
    <Shell
      title="Material Estimates"
      subtitle={
        requirementId
          ? `${rows.length} estimate${rows.length !== 1 ? "s" : ""}`
          : "Open a material requirement to estimate it"
      }
      action={
        <button
          onClick={() => nav("/procurement/requirements")}
          className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[14px] font-semibold"
        >
          Requirements
        </button>
      }
    >
      {requirementId && !isLoading && !rows.length && (
        <Card>
          <form
            onSubmit={create}
            className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end"
          >
            <label className="text-[13px] font-semibold text-[#333333]">
              Quantity
              <Input
                type="number"
                min="0"
                step="any"
                value={draft.quantity}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quantity: e.target.value }))
                }
              />
            </label>
            <label className="text-[13px] font-semibold text-[#333333]">
              Unit
              <Input
                value={draft.unit}
                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
              />
            </label>
            <label className="text-[13px] font-semibold text-[#333333]">
              Unit rate (₹)
              <Input
                type="number"
                min="0"
                step="any"
                value={draft.unitRate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, unitRate: e.target.value }))
                }
              />
            </label>
            <button
              type="submit"
              disabled={!canCreate || isCreating}
              className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              New Estimate
            </button>
          </form>
        </Card>
      )}

      {rows.length > 1 && (
        <Input
          placeholder="Search estimates…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Quantity</th>
                <th className="text-left px-3 py-3">Unit</th>
                <th className="text-left px-3 py-3">Unit Rate</th>
                <th className="text-left px-3 py-3">Total</th>
                <th className="text-left px-3 py-3">Approval</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => {
                  const status = String(
                    r.approvalStatus || r.approval_status || "PENDING",
                  ).toUpperCase();
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-[rgba(31,69,59,0.08)]"
                    >
                      <td className="px-3 py-2.5">{r.quantity ?? "—"}</td>
                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {r.unit || "—"}
                      </td>
                      <td className="px-3 py-2.5">{money(r.unitRate)}</td>
                      <td className="px-3 py-2.5 font-semibold">
                        {money(r.totalAmount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-xs font-semibold">
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => decide(r.id, true)}
                              disabled={busy}
                              className="p-1.5 rounded hover:bg-[#EAEEF0]"
                              title="Approve"
                              aria-label="Approve estimate"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => decide(r.id, false)}
                              disabled={busy}
                              className="p-1.5 rounded hover:bg-[#EAEEF0]"
                              title="Reject"
                              aria-label="Reject estimate"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : status === "APPROVED" ? (
                          <button
                            onClick={() =>
                              nav("/procurement/purchase-orders/new")
                            }
                            className="text-[12.5px] font-semibold hover:underline"
                          >
                            Raise PO
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}

              {isFetching && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    Loading estimates...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    {requirementId
                      ? "No estimate for this requirement yet."
                      : "Choose a requirement from the Requirements list."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
