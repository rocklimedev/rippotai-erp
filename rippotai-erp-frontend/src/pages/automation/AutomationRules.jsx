// src/pages/automation/AutomationRules.jsx

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  TestTube2,
  ToggleLeft,
  ToggleRight,
  Zap,
} from "lucide-react";

import { automationRules } from "../../data/automationMockData";

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    DISABLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] || styles.DISABLED
      }`}
    >
      {status}
    </span>
  );
};

export default function AutomationRules() {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const filteredRules = useMemo(() => {
    return automationRules.filter((rule) => {
      const matchesSearch =
        !search ||
        rule.name.toLowerCase().includes(search.toLowerCase()) ||
        rule.description.toLowerCase().includes(search.toLowerCase()) ||
        rule.trigger.toLowerCase().includes(search.toLowerCase());

      const matchesPhase = phase === "ALL" || rule.phase === phase;
      const matchesStatus = status === "ALL" || rule.status === status;

      return matchesSearch && matchesPhase && matchesStatus;
    });
  }, [search, phase, status]);

  const phases = [...new Set(automationRules.map((rule) => rule.phase))];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center / Rules
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Automation Rules
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Central registry for every automation rule running across INOS.
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#17382f]">
            <Plus size={17} />
            Create Rule
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Rules</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {automationRules.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {automationRules.filter((r) => r.status === "ACTIVE").length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Draft</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {automationRules.filter((r) => r.status === "DRAFT").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rules, triggers or descriptions..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#1F453B] focus:bg-white"
              />
            </div>

            <div className="relative">
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">All Phases</option>
                {phases.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="DISABLED">Disabled</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rule
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phase
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trigger
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project Type
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Runs
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {rule.name}
                        </p>
                        <p className="mt-1 max-w-[280px] text-xs leading-5 text-slate-400">
                          {rule.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {rule.phase}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {rule.trigger}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {rule.actions.slice(0, 2).map((action) => (
                          <div
                            key={action}
                            className="flex items-center gap-1.5 text-xs text-slate-500"
                          >
                            <CheckCircle2
                              size={13}
                              className="text-emerald-500"
                            />
                            {action}
                          </div>
                        ))}

                        {rule.actions.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{rule.actions.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {rule.projectTypes.map((type) => (
                          <span
                            key={type}
                            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {rule.executions}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        {rule.successRate || 0}% success
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={rule.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="Edit"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          title="Test"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <TestTube2 size={16} />
                        </button>

                        <button
                          title="Duplicate"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          title="Toggle"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          {rule.status === "ACTIVE" ? (
                            <ToggleRight
                              size={19}
                              className="text-emerald-600"
                            />
                          ) : (
                            <ToggleLeft size={19} />
                          )}
                        </button>

                        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                          <MoreHorizontal size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRules.length === 0 && (
            <div className="py-16 text-center">
              <Zap className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 font-semibold text-slate-700">
                No automation rules found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
