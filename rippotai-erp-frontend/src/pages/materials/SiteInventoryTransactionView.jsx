import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Shell, Card } from "../../hooks/shared";

import {
  useGetInventoryTransactionQuery,
  useReverseInventoryTransactionMutation,
} from "../../api/procuerment/inventory.api";

export default function SiteInventoryTransactionView() {
  const nav = useNavigate();

  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || "";

  const { data, isLoading } = useGetInventoryTransactionQuery(id, {
    skip: !id,
  });

  const [reverseTransaction, { isLoading: reversing }] =
    useReverseInventoryTransactionMutation();

  const transaction = data?.data || data || {};

  const type =
    transaction.transaction_type || transaction.transactionType || "—";

  const direction = transaction.direction || getDirection(type);

  const quantity = Number(transaction.quantity || 0);

  const material = transaction.material || {};

  const unit = transaction.unit || material.unit || {};

  const reverse = async () => {
    const reason = window.prompt("Why are you reversing this transaction?");

    if (!reason?.trim()) {
      return;
    }

    try {
      await reverseTransaction({
        id,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Transaction reversed successfully.");
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.error ||
        "Unable to reverse transaction.";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  if (isLoading) {
    return (
      <Shell title="Transaction" subtitle="Loading transaction...">
        <Card>
          <div className="p-10 text-center text-[#8A9899]">
            Loading transaction...
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title="Inventory Transaction"
      subtitle={`Transaction ID: ${id}`}
      action={
        <button
          onClick={() => nav(-1)}
          className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      }
    >
      {/* HEADER */}

      <Card>
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                direction === "IN" ? "bg-[#EAF3EE]" : "bg-[#FDECEC]"
              }`}
            >
              {direction === "IN" ? (
                <ArrowDownToLine size={20} className="text-[#1F453B]" />
              ) : (
                <ArrowUpFromLine size={20} className="text-[#A94442]" />
              )}
            </div>

            <div>
              <div className="text-[12px] text-[#7B898A]">{direction}</div>

              <h2 className="text-[20px] font-bold text-[#1F453B]">
                {String(type).replaceAll("_", " ")}
              </h2>
            </div>
          </div>

          {!transaction.reversal_of_id && (
            <button
              onClick={reverse}
              disabled={reversing}
              className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {reversing ? "Reversing..." : "Reverse"}
            </button>
          )}
        </div>
      </Card>

      {/* QUANTITY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard
          label="Quantity"
          value={`${direction === "IN" ? "+" : "-"}${quantity.toLocaleString("en-IN")}`}
        />

        <InfoCard
          label="Unit"
          value={unit?.name || unit?.code || transaction.unit_name || "—"}
        />

        <InfoCard
          label="Date"
          value={String(transaction.transaction_date || "").slice(0, 10)}
        />
      </div>

      {/* DETAILS */}

      <Card>
        <div className="p-5">
          <h3 className="font-bold text-[#1F453B] mb-4">Transaction Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Detail
              label="Material"
              value={
                material.name ||
                material.material_name ||
                transaction.material_name ||
                transaction.material_id ||
                "—"
              }
            />

            <Detail
              label="Material Code"
              value={material.material_code || transaction.material_code || "—"}
            />

            <Detail label="Project" value={transaction.project_id || "—"} />

            <Detail label="Site" value={transaction.site_id || "All Project"} />

            <Detail
              label="Storage Location"
              value={transaction.storage_location || "—"}
            />

            <Detail
              label="Condition"
              value={transaction.condition_status || "—"}
            />

            <Detail
              label="Reference Type"
              value={transaction.reference_type || "—"}
            />

            <Detail
              label="Reference ID"
              value={transaction.reference_id || "—"}
            />

            <Detail
              label="Reference Item"
              value={transaction.reference_item_id || "—"}
            />

            <Detail label="Vendor" value={transaction.vendor_id || "—"} />

            <Detail
              label="Contractor"
              value={transaction.contractor_id || "—"}
            />

            <Detail label="Trade" value={transaction.trade || "—"} />

            <Detail label="Issued To" value={transaction.issued_to || "—"} />

            <Detail
              label="Work Reference"
              value={transaction.work_reference || "—"}
            />

            <Detail label="Created By" value={transaction.created_by || "—"} />
          </div>
        </div>
      </Card>

      {/* NOTES */}

      {(transaction.remarks || transaction.condition_notes) && (
        <Card>
          <div className="p-5 space-y-4">
            {transaction.remarks && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[#7B898A]">
                  Remarks
                </div>

                <div className="mt-1 text-[13px] text-[#333333]">
                  {transaction.remarks}
                </div>
              </div>
            )}

            {transaction.condition_notes && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[#7B898A]">
                  Condition Notes
                </div>

                <div className="mt-1 text-[13px] text-[#333333]">
                  {transaction.condition_notes}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* REVERSAL */}

      {transaction.reversal_of_id && (
        <Card>
          <div className="p-5 bg-[#FFF8E8] rounded-xl">
            <div className="text-[12px] font-bold text-[#8A681D]">
              Correction Transaction
            </div>

            <div className="text-[13px] mt-1">This transaction reverses:</div>

            <div className="font-mono text-[12px] mt-1">
              {transaction.reversal_of_id}
            </div>

            {transaction.reversal_reason && (
              <div className="mt-3">
                <div className="text-[11px] uppercase text-[#8A681D]">
                  Reason
                </div>

                <div className="text-[13px] mt-1">
                  {transaction.reversal_reason}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </Shell>
  );
}

function getDirection(type) {
  if (
    [
      "RECEIPT",
      "RETURN_FROM_CONTRACTOR",
      "TRANSFER_IN",
      "ADJUSTMENT_IN",
    ].includes(type)
  ) {
    return "IN";
  }

  return "OUT";
}

function InfoCard({ label, value }) {
  return (
    <Card>
      <div className="p-5">
        <div className="text-[11px] uppercase tracking-wide text-[#7B898A]">
          {label}
        </div>

        <div className="text-[20px] font-bold text-[#1F453B] mt-1">
          {value || "—"}
        </div>
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[#8A9899]">
        {label}
      </div>

      <div className="text-[13px] font-medium text-[#333333] mt-1 break-all">
        {value || "—"}
      </div>
    </div>
  );
}
