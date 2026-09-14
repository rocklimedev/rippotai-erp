// src/pages/automation/AutomationRunDetails.jsx

import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  RefreshCcw,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";

import { automationRuns } from "../../data/automationMockData";

export default function AutomationRunDetails() {
  const run = automationRuns[3];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} />
          Back to Run Logs
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center / Run Details
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{run.rule}</h1>

              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                FAILED
              </span>
            </div>

            <p className="mt-2 font-mono text-xs text-slate-400">{run.id}</p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
            <RefreshCcw size={16} />
            Retry Execution
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Project
            </p>
            <p className="mt-2 font-semibold text-slate-800">{run.project}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Phase
            </p>
            <p className="mt-2 font-semibold text-slate-800">{run.phase}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Trigger
            </p>
            <p className="mt-2 font-semibold text-slate-800">{run.trigger}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Duration
            </p>
            <p className="mt-2 flex items-center gap-2 font-semibold text-slate-800">
              <Clock3 size={16} />
              {run.duration}ms
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Started
            </p>
            <p className="mt-2 font-semibold text-slate-800">{run.startedAt}</p>
          </div>
        </div>

        {/* Error */}
        {run.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />

              <div>
                <p className="font-semibold text-red-900">
                  Automation execution failed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {run.error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Conditions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">
                Conditions Evaluated
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {run.conditions.map((condition) => (
                <div
                  key={condition.label}
                  className="flex items-center gap-3 p-4"
                >
                  <CheckCircle2
                    size={18}
                    className={
                      condition.passed ? "text-emerald-500" : "text-red-500"
                    }
                  />

                  <span className="text-sm text-slate-700">
                    {condition.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">Actions Executed</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {run.actions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-3">
                    {action.status === "SUCCESS" ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : action.status === "FAILED" ? (
                      <XCircle size={18} className="text-red-500" />
                    ) : (
                      <Clock3 size={18} className="text-slate-400" />
                    )}

                    <span className="text-sm text-slate-700">
                      {action.label}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-500">
                    {action.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payload */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[#1F453B]" />
              <h2 className="font-semibold text-slate-900">Event Payload</h2>
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
              <Copy size={14} />
              Copy JSON
            </button>
          </div>

          <pre className="overflow-x-auto bg-slate-950 p-5 text-sm leading-6 text-slate-200">
            {JSON.stringify(run.payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
