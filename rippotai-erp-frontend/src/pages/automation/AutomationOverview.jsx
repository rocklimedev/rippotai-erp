// src/pages/automation/AutomationOverview.jsx

import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  PlayCircle,
  Plus,
  Settings2,
  ShieldCheck,
  Zap,
  XCircle,
} from "lucide-react";

import {
  automationPhases,
  automationRules,
  automationRuns,
  automationStats,
} from "../../data/automationMockData";

const StatCard = ({ icon: Icon, label, value, subtitle, iconClass = "" }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className={`rounded-xl bg-slate-100 p-3 ${iconClass}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    DISABLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] || styles.DISABLED
      }`}
    >
      {status}
    </span>
  );
};

export default function AutomationOverview() {
  const recentRuns = automationRuns.slice(0, 5);
  const topRules = [...automationRules]
    .filter((rule) => rule.status === "ACTIVE")
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Automation Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor, control and audit automation across every INOS phase.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Activity size={17} />
              Run Logs
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#17382f]">
              <Plus size={17} />
              Create Rule
            </button>
          </div>
        </div>

        {/* Health Banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <ShieldCheck className="text-emerald-600" size={24} />
            </div>

            <div>
              <p className="font-semibold text-emerald-900">
                Automation system is healthy
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {automationStats.successRate}% successful executions over the
                current monitoring period.
              </p>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
            View system health
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={GitBranch}
            label="Active Rules"
            value={automationStats.activeRules}
            subtitle="+4 rules this month"
            iconClass="text-[#1F453B]"
          />

          <StatCard
            icon={PlayCircle}
            label="Executions Today"
            value={automationStats.executionsToday}
            subtitle="+12.4% compared to yesterday"
            iconClass="text-blue-600"
          />

          <StatCard
            icon={XCircle}
            label="Failed Executions"
            value={automationStats.failedExecutions}
            subtitle="1.7% failure rate"
            iconClass="text-red-600"
          />

          <StatCard
            icon={AlertTriangle}
            label="Pending Escalations"
            value={automationStats.pendingEscalations}
            subtitle="3 critical cases"
            iconClass="text-amber-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Success Rate"
            value={`${automationStats.successRate}%`}
            subtitle="Across all automations"
            iconClass="text-emerald-600"
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Phase Coverage */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Phase Automation Coverage
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Automation rules currently mapped to each process phase.
                  </p>
                </div>

                <Settings2 size={19} className="text-slate-400" />
              </div>
            </div>

            <div className="space-y-5 p-5">
              {automationPhases.map((phase) => (
                <div key={phase.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-center text-xs font-bold leading-8 text-slate-600">
                        {phase.rules}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {phase.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {phase.executions} executions
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-slate-700">
                      {phase.coverage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#1F453B]"
                      style={{ width: `${phase.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rules */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">
                Most Executed Rules
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Rules with highest execution volume.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {topRules.map((rule) => (
                <div key={rule.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {rule.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {rule.phase}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-slate-700">
                      {rule.executions}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Success rate</span>
                    <span className="font-semibold text-emerald-600">
                      {rule.successRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Automation Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest automation engine executions.
              </p>
            </div>

            <button className="text-sm font-semibold text-[#1F453B]">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rule
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trigger
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {run.rule}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{run.id}</p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {run.project}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {run.trigger}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={run.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock3 size={14} />
                        {run.startedAt}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
