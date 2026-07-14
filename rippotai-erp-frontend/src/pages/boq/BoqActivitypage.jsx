import React, { useState } from "react";
import { useGetActivityQuery } from "../../api/boq.api";

/* ============ BOQ Activity ============ */

export function BoqActivityPage() {
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    date_from: "",
    date_to: "",
  });

  const { data: rows = [], isLoading } = useGetActivityQuery({
    ...(filters.user && { user: filters.user }),
    ...(filters.action && { action: filters.action }),
    ...(filters.date_from && { date_from: filters.date_from }),
    ...(filters.date_to && { date_to: filters.date_to }),
  });

  const actions = Array.from(new Set(rows.map((r) => r.action)));

  const users = Array.from(new Set(rows.map((r) => r.user)));

  return (
    <div className="space-y-6" data-testid="boq-activity-page">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          BOQ · Settings
        </div>

        <h1 className="text-[34px] font-bold text-[#333333]">Activity</h1>

        <p className="text-[13.5px] text-[#6B7B7C] mt-1">
          Every change made inside the BOQ module — creations, edits, approvals,
          item moves, rate changes.
        </p>
      </div>

      <div className="bc-card p-3 flex flex-wrap items-center gap-2">
        <select
          className="h-9 px-2 rounded-lg border"
          value={filters.user}
          onChange={(e) =>
            setFilters({
              ...filters,
              user: e.target.value,
            })
          }
        >
          <option value="">All users</option>

          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <select
          className="h-9 px-2 rounded-lg border"
          value={filters.action}
          onChange={(e) =>
            setFilters({
              ...filters,
              action: e.target.value,
            })
          }
        >
          <option value="">All actions</option>

          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="h-9 px-2 rounded-lg border"
          value={filters.date_from}
          onChange={(e) =>
            setFilters({
              ...filters,
              date_from: e.target.value,
            })
          }
        />

        <input
          type="date"
          className="h-9 px-2 rounded-lg border"
          value={filters.date_to}
          onChange={(e) =>
            setFilters({
              ...filters,
              date_to: e.target.value,
            })
          }
        />

        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() =>
              setFilters({
                user: "",
                action: "",
                date_from: "",
                date_to: "",
              })
            }
            className="text-[12px] text-[#7A2E1A] font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bc-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b">
              <th className="px-4 py-3">When</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Target</th>
              <th className="px-3 py-3">Details</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  Loading activity...
                </td>
              </tr>
            )}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[#6B7B7C]"
                >
                  No activity yet.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#EAEEF0]">
                <td className="px-4 py-3 text-[12.5px]">
                  {new Date(r.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                <td className="px-3 py-3">{r.user}</td>

                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#EAEEF0] text-[11px] font-semibold">
                    {r.action}
                  </span>
                </td>

                <td className="px-3 py-3 font-semibold">{r.target}</td>

                <td className="px-3 py-3 text-[#6B7B7C]">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BoqActivityPage;
