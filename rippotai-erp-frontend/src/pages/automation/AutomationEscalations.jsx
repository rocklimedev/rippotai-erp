// src/pages/automation/AutomationEscalations.jsx

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  ShieldAlert,
  TimerReset,
  Zap,
} from "lucide-react";

import { escalations, escalationRules } from "../../data/automationMockData";

const PriorityBadge = ({ priority }) => {
  const styles = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[priority]
      }`}
    >
      {priority}
    </span>
  );
};

export default function AutomationEscalations() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center / Escalations
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Escalation Center
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage SLA timers and automatically escalate overdue work.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={17} />
            Create SLA Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Open</p>
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">9</p>
            <p className="mt-1 text-xs text-slate-400">
              Active escalation cases
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Critical</p>
              <ShieldAlert className="text-red-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold text-red-600">3</p>
            <p className="mt-1 text-xs text-slate-400">
              Require immediate attention
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Breached</p>
              <TimerReset className="text-orange-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold text-orange-600">5</p>
            <p className="mt-1 text-xs text-slate-400">SLA has been exceeded</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Resolved</p>
              <CheckCircle2 className="text-emerald-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-600">24</p>
            <p className="mt-1 text-xs text-slate-400">Resolved this month</p>
          </div>
        </div>

        {/* Active Escalations */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">Active Escalations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current cases requiring attention.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {escalations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-xl p-3 ${
                      item.priority === "CRITICAL"
                        ? "bg-red-50"
                        : item.priority === "HIGH"
                          ? "bg-orange-50"
                          : "bg-amber-50"
                    }`}
                  >
                    <AlertTriangle
                      size={20}
                      className={
                        item.priority === "CRITICAL"
                          ? "text-red-600"
                          : item.priority === "HIGH"
                            ? "text-orange-600"
                            : "text-amber-600"
                      }
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">
                        {item.title}
                      </p>

                      <PriorityBadge priority={item.priority} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                      <span>{item.id}</span>
                      <span>{item.project}</span>
                      <span>{item.type}</span>
                      <span>{item.age} old</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:justify-end">
                  <div>
                    <p className="text-xs text-slate-400">Current Level</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Level {item.currentLevel}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Assigned To</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {item.assignedTo}
                    </p>
                  </div>

                  <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#1F453B] hover:bg-[#1F453B]/5">
                    Open
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Rules */}
        <div>
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">
              SLA Escalation Rules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define how overdue records move through escalation levels.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {escalationRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-[#1F453B]/5 p-2">
                        <Clock3 size={18} className="text-[#1F453B]" />
                      </div>

                      <h3 className="font-semibold text-slate-900">
                        {rule.name}
                      </h3>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {rule.trigger}
                    </p>
                  </div>

                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Initial SLA</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {rule.sla}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Active Cases</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {rule.activeCases}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {rule.levels.map((level, index) => (
                    <div key={level.level} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {level.level}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-700">
                            {level.recipient}
                          </span>

                          <span className="text-xs font-semibold text-slate-400">
                            After {level.after}
                          </span>
                        </div>
                      </div>

                      {index < rule.levels.length - 1 && (
                        <div className="absolute" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} />
                    {rule.status}
                  </span>

                  <button className="text-xs font-semibold text-[#1F453B]">
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
