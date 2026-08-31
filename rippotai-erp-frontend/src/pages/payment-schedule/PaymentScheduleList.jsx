import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, CreditCard } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetPaymentSchedulesQuery } from "../../api/payment-schedules.api";

export default function PaymentScheduleList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // ------------------------------------------------------------
  // Project filter
  // ------------------------------------------------------------

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ------------------------------------------------------------
  // Get payment schedules
  // ------------------------------------------------------------

  const {
    data: rows = [],
    isFetching,
    isLoading,
  } = useGetPaymentSchedulesQuery(
    projectFilter ? { project_id: projectFilter } : undefined,
  );

  // ------------------------------------------------------------
  // Client-side search
  // ------------------------------------------------------------

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((r) => {
      const title = r.title || "";

      const projectName =
        r.project_name || r.projectName || r.project?.name || "";

      const status = r.status || "";

      const totalContractValue =
        r.total_contract_value ?? r.totalContractValue ?? "";

      const totalPayable = r.total_payable ?? r.totalPayable ?? "";

      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term) ||
        String(totalContractValue).includes(term) ||
        String(totalPayable).includes(term)
      );
    });
  }, [rows, q]);

  // ------------------------------------------------------------
  // Clear project filter
  // ------------------------------------------------------------

  const clearProjectFilter = () => {
    nav("/ledger/payment-schedule/all");
  };

  // ------------------------------------------------------------
  // Create
  // ------------------------------------------------------------

  const handleCreate = () => {
    if (projectFilter) {
      nav(`/ledger/forms/payment-schedule?project_id=${projectFilter}`);
    } else {
      nav("/ledger/forms/payment-schedule");
    }
  };

  // ------------------------------------------------------------
  // Format currency
  // ------------------------------------------------------------

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(number);
  };

  // ------------------------------------------------------------
  // Status
  // ------------------------------------------------------------

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[#E8F3EE] text-[#1F453B]";

      case "COMPLETED":
        return "bg-[#EAF1F8] text-[#315A7D]";

      case "CANCELLED":
        return "bg-[#FBEAEA] text-[#9B3D3D]";

      case "DRAFT":
      default:
        return "bg-[#F4F6F7] text-[#6B7B7C]";
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <Shell
      title="Payment Schedules"
      subtitle={`${rows.length} schedule${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : " across the workspace"}`}
      action={
        <button
          onClick={handleCreate}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          data-testid="payment-schedule-new-btn"
        >
          <Plus size={14} />
          New Payment Schedule
        </button>
      }
    >
      {/* --------------------------------------------------------
          Filters
      --------------------------------------------------------- */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search payment schedules…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <button
            onClick={clearProjectFilter}
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* --------------------------------------------------------
          Table
      --------------------------------------------------------- */}

      <Card>
        <div className="overflow-x-auto">
          <table
            className="w-full text-[14px]"
            data-testid="payment-schedule-table"
          >
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Schedule
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Contract Value
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Payable
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Milestones
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Updated
                </th>

                <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* ------------------------------------------------
                  Rows
              ------------------------------------------------- */}

              {!isLoading &&
                filteredRows.map((r) => {
                  const projectName =
                    r.project_name || r.projectName || r.project?.name || "—";

                  const contractValue =
                    r.total_contract_value ?? r.totalContractValue;

                  const payable = r.total_payable ?? r.totalPayable;

                  const milestonesCount =
                    r.milestones?.length ??
                    r.total_milestones ??
                    r.totalMilestones ??
                    0;

                  const status = r.status || "DRAFT";

                  const updated =
                    r.updated_at ||
                    r.updatedAt ||
                    r.created_at ||
                    r.createdAt ||
                    "";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => nav(`/ledger/payment-schedule/${r.id}`)}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                      data-testid={`payment-schedule-row-${r.id}`}
                    >
                      {/* Schedule */}

                      <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <CreditCard
                            size={14}
                            className="shrink-0 text-[#B5C4B6]"
                          />

                          <span className="truncate">
                            {r.title || "Payment Schedule"}
                          </span>
                        </div>
                      </td>

                      {/* Project */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[240px]">
                        <span className="truncate block">{projectName}</span>
                      </td>

                      {/* Contract Value */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {formatCurrency(contractValue)}
                      </td>

                      {/* Payable */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] font-medium">
                        {formatCurrency(payable)}
                      </td>

                      {/* Milestones */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {milestonesCount}
                      </td>

                      {/* Status */}

                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Updated */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {String(updated).slice(0, 10) || "—"}
                      </td>

                      {/* Actions */}

                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            onClick={() =>
                              nav(`/ledger/payment-schedule/${r.id}`)
                            }
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                            title="View"
                            data-testid={`payment-schedule-view-${r.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() =>
                              nav(`/ledger/payment-schedules/${r.id}/edit`)
                            }
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                            title="Edit"
                            data-testid={`payment-schedule-edit-${r.id}`}
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* ------------------------------------------------
                  Loading
              ------------------------------------------------- */}

              {isFetching && (
                <tr>
                  <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                    Loading payment schedules...
                  </td>
                </tr>
              )}

              {/* ------------------------------------------------
                  Empty
              ------------------------------------------------- */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                    {q
                      ? "No payment schedules match your search."
                      : projectFilter
                        ? "No payment schedules found for this project."
                        : "No payment schedules yet. Create the first one from a project."}
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
