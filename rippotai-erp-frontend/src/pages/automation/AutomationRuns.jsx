// src/pages/automation/AutomationRuns.jsx

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  PlayCircle,
  Search,
  XCircle,
  Zap,
} from "lucide-react";

import { automationRuns } from "../../data/automationMockData";

const StatusBadge = ({ status }) => {
  const config = {
    SUCCESS: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    FAILED: {
      className: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  };

  const item = config[status] || config.SUCCESS;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
};

export default function AutomationRuns() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [phase, setPhase] = useState("ALL");

  const phases = [...new Set(automationRuns.map((run) => run.phase))];

  const filteredRuns = useMemo(() => {
    return automationRuns.filter((run) => {
      const matchesSearch =
        !search ||
        run.rule.toLowerCase().includes(search.toLowerCase()) ||
        run.project.toLowerCase().includes(search.toLowerCase()) ||
        run.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "ALL" || run.status === status;
      const matchesPhase = phase === "ALL" || run.phase === phase;

      return matchesSearch && matchesStatus && matchesPhase;
    });
  }, [search, status, phase]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} />
            Automation Center / Run Logs
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Automation Run Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Every automation execution, result and payload is recorded here.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Runs</p>
              <PlayCircle size={19} className="text-blue-600" />
            </div>

            <p className="mt-2 text-3xl font-bold text-slate-900">347</p>
            <p className="mt-1 text-xs text-slate-400">Today</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Successful</p>
              <CheckCircle2 size={19} className="text-emerald-600" />
            </div>

            <p className="mt-2 text-3xl font-bold text-emerald-600">341</p>
            <p className="mt-1 text-xs text-slate-400">98.3% success</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Failed</p>
              <XCircle size={19} className="text-red-600" />
            </div>

            <p className="mt-2 text-3xl font-bold text-red-600">6</p>
            <p className="mt-1 text-xs text-slate-400">Requires attention</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_220px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search executions..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#1F453B] focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
            >
              <option value="ALL">All Phases</option>
              {phases.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
              <Filter size={16} />
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Execution
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rule
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phase
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Started
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-600">
                        {run.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {run.rule}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {run.trigger}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {run.project}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {run.phase}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={run.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock3 size={14} />
                        {run.duration}ms
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {run.startedAt}
                    </td>

                    <td className="px-5 py-4">
                      <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#1F453B] hover:bg-[#1F453B]/5">
                        <Eye size={15} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRuns.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">
              No execution logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
