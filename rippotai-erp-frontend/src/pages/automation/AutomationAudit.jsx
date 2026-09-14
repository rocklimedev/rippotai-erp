// src/pages/automation/AutomationAudit.jsx

import React from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  Plus,
  Settings2,
  Shield,
  User,
  Zap,
} from "lucide-react";

import { auditLogs } from "../../data/automationMockData";

const ActionBadge = ({ action }) => {
  const config = {
    UPDATED_RULE: {
      label: "Updated Rule",
      className: "bg-blue-50 text-blue-700",
    },
    ENABLED_RULE: {
      label: "Enabled Rule",
      className: "bg-emerald-50 text-emerald-700",
    },
    DISABLED_RULE: {
      label: "Disabled Rule",
      className: "bg-slate-100 text-slate-600",
    },
    CREATED_RULE: {
      label: "Created Rule",
      className: "bg-violet-50 text-violet-700",
    },
    CREATED_ESCALATION: {
      label: "Created Escalation",
      className: "bg-amber-50 text-amber-700",
    },
  };

  const item = config[action] || config.UPDATED_RULE;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
};

export default function AutomationAudit() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} />
            Automation Center / Audit
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Automation Audit Log
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track every configuration change made to the automation system.
          </p>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Changes This Week</p>
              <Activity size={19} className="text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">18</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Rules Modified</p>
              <GitBranch size={19} className="text-[#1F453B]" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">11</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Administrators</p>
              <Shield size={19} className="text-violet-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">3</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              Configuration History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest changes to automation rules and escalation policies.
            </p>
          </div>

          <div className="p-5">
            <div className="relative">
              <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-200" />

              <div className="space-y-7">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-slate-100">
                      <Settings2 size={16} className="text-slate-500" />
                    </div>

                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <ActionBadge action={log.action} />

                            <span className="font-mono text-[11px] text-slate-400">
                              {log.id}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-800">
                            {log.target}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {log.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-left md:text-right">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 md:justify-end">
                            <Clock3 size={13} />
                            {log.timestamp}
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600 md:justify-end">
                            <User size={13} />
                            {log.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audit principle */}
        <div className="rounded-2xl border border-[#1F453B]/20 bg-[#1F453B]/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <Shield size={19} className="text-[#1F453B]" />
            </div>

            <div>
              <h3 className="font-semibold text-[#1F453B]">
                Automation governance
              </h3>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Rule creation, activation, disabling, SLA changes and
                configuration updates should always generate an immutable audit
                entry. This provides traceability for automation behaviour
                across all INOS modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
