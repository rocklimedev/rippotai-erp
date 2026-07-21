import React, { useState } from "react";
import { useGetLeadActivitiesQuery } from "../../api/leads.api";

/* ============ Leads Activity ============ */

export function ProjectActivity() {
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    date_from: "",
    date_to: "",
  });

  const { data: rows = [], isLoading } = useGetLeadActivitiesQuery({
    ...(filters.user && {
      user: filters.user,
    }),

    ...(filters.action && {
      action: filters.action,
    }),

    ...(filters.date_from && {
      date_from: filters.date_from,
    }),

    ...(filters.date_to && {
      date_to: filters.date_to,
    }),
  });

  /*
    Transform API response

    API:
    {
      text,
      lead:{
        name,
        owner,
        stage
      }
    }

    UI:
    {
      action,
      user,
      target,
      details
    }
  */

  const activities = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,

    // user who performed action
    user: r.lead?.owner || "System",

    // extract action
    action: r.text?.split(" ").slice(0, 3).join(" "),

    // lead name
    target: r.lead?.name || "-",

    // complete message
    details: r.text || "-",

    stage: r.lead?.stage,
  }));

  const actions = Array.from(new Set(activities.map((r) => r.action)));

  const users = Array.from(new Set(activities.map((r) => r.user)));

  return (
    <div className="space-y-6" data-testid="leads-activity-page">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          Leads · Activity
        </div>

        <h1 className="text-[34px] font-bold text-[#333333]">Activity</h1>

        <p className="text-[13.5px] text-[#6B7B7C] mt-1">
          Every change made inside the Leads module — notes, stage changes,
          follow-ups, proposals and updates.
        </p>
      </div>

      {/* FILTERS */}

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
            className="text-[12px] text-[#7A2E1A] font-semibold"
            onClick={() =>
              setFilters({
                user: "",
                action: "",
                date_from: "",
                date_to: "",
              })
            }
          >
            Clear
          </button>
        )}
      </div>

      {/* TABLE */}

      <div className="bc-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b">
              <th className="px-4 py-3">When</th>

              <th className="px-3 py-3">User</th>

              <th className="px-3 py-3">Action</th>

              <th className="px-3 py-3">Lead</th>

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

            {!isLoading && activities.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[#6B7B7C]"
                >
                  No activity yet.
                </td>
              </tr>
            )}

            {activities.map((r) => (
              <tr key={r.id} className="border-b border-[#EAEEF0]">
                <td className="px-4 py-3 text-[12.5px]">
                  {new Date(r.createdAt).toLocaleString("en-IN", {
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

export default ProjectActivity;
