// src/pages/automation/AutomationRuleBuilder.jsx

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Clock3,
  GitBranch,
  Mail,
  Plus,
  Save,
  Send,
  Settings2,
  TestTube2,
  Trash2,
  Users,
  Zap,
} from "lucide-react";

const SectionCard = ({ number, title, description, icon: Icon, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-4 border-b border-slate-100 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1F453B] text-sm font-bold text-white">
        {number}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-[#1F453B]" />
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>

    <div className="p-5">{children}</div>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>

    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#1F453B] focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  </label>
);

export default function AutomationRuleBuilder() {
  const [ruleName, setRuleName] = useState("RFI Overdue 24 Hours");
  const [description, setDescription] = useState(
    "Escalate RFIs that remain unanswered for more than 24 hours.",
  );

  const [triggerEntity, setTriggerEntity] = useState("RFI");
  const [triggerEvent, setTriggerEvent] = useState("SLA_EXCEEDED");

  const [conditions, setConditions] = useState([
    {
      id: 1,
      field: "status",
      operator: "equals",
      value: "OPEN",
    },
    {
      id: 2,
      field: "ageHours",
      operator: "greater_than",
      value: "24",
    },
    {
      id: 3,
      field: "project.status",
      operator: "not_equals",
      value: "COMPLETED",
    },
  ]);

  const [actions, setActions] = useState([
    {
      id: 1,
      type: "NOTIFICATION",
      recipient: "Project Manager",
      channel: "IN_APP",
    },
    {
      id: 2,
      type: "ESCALATION",
      recipient: "Operations Manager",
      channel: "IN_APP",
    },
    {
      id: 3,
      type: "CLIQ",
      recipient: "Site Operations",
      channel: "CLIQ",
    },
  ]);

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        id: Date.now(),
        field: "priority",
        operator: "equals",
        value: "HIGH",
      },
    ]);
  };

  const removeCondition = (id) => {
    setConditions((prev) => prev.filter((item) => item.id !== id));
  };

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "NOTIFICATION",
        recipient: "Project Manager",
        channel: "IN_APP",
      },
    ]);
  };

  const removeAction = (id) => {
    setActions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
              <ArrowLeft size={16} />
              Back to Rules
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center / Rule Builder
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Create Automation Rule
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
              <Save size={17} />
              Save Draft
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl border border-[#1F453B] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F453B]">
              <TestTube2 size={17} />
              Test Rule
            </button>

            <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
              <Send size={17} />
              Publish Rule
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rule Name
              </span>

              <input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#1F453B] focus:bg-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Project Type
              </span>

              <select className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#1F453B] focus:bg-white">
                <option>All Project Types</option>
                <option>CONSULTANCY</option>
                <option>VENDOR_PROCUREMENT</option>
                <option>PMC</option>
              </select>
            </label>

            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </span>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1F453B] focus:bg-white"
              />
            </label>
          </div>
        </div>

        {/* Trigger */}
        <SectionCard
          number="1"
          title="Trigger"
          description="Define the event that starts this automation."
          icon={Zap}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Entity"
              value={triggerEntity}
              onChange={setTriggerEntity}
              options={[
                { value: "RFI", label: "RFI" },
                { value: "TASK", label: "Task" },
                { value: "APPROVAL", label: "Approval" },
                { value: "PROJECT", label: "Project" },
                { value: "GATE", label: "Gate" },
                { value: "MATERIAL", label: "Material" },
              ]}
            />

            <SelectField
              label="Event"
              value={triggerEvent}
              onChange={setTriggerEvent}
              options={[
                { value: "SLA_EXCEEDED", label: "SLA Exceeded" },
                { value: "CREATED", label: "Created" },
                { value: "UPDATED", label: "Updated" },
                { value: "STATUS_CHANGED", label: "Status Changed" },
                { value: "APPROVED", label: "Approved" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
          </div>

          <div className="mt-5 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-xl border border-[#1F453B]/20 bg-[#1F453B]/5 px-4 py-3 text-sm font-medium text-[#1F453B]">
              <Zap size={16} />
              WHEN {triggerEntity} → {triggerEvent}
            </div>
          </div>
        </SectionCard>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="rounded-full border border-slate-200 bg-white p-2 shadow-sm">
            <ArrowDown size={18} className="text-slate-400" />
          </div>
        </div>

        {/* Conditions */}
        <SectionCard
          number="2"
          title="Conditions"
          description="Define when the automation is allowed to execute."
          icon={GitBranch}
        >
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={condition.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_180px_1fr_auto]"
              >
                <select
                  value={condition.field}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((item) =>
                        item.id === condition.id
                          ? { ...item, field: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="status">RFI Status</option>
                  <option value="ageHours">Age in Hours</option>
                  <option value="priority">Priority</option>
                  <option value="project.status">Project Status</option>
                  <option value="assignedTo">Assigned To</option>
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((item) =>
                        item.id === condition.id
                          ? { ...item, operator: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="greater_than">greater than</option>
                  <option value="less_than">less than</option>
                  <option value="contains">contains</option>
                </select>

                <input
                  value={condition.value}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((item) =>
                        item.id === condition.id
                          ? { ...item, value: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                />

                <button
                  onClick={() => removeCondition(condition.id)}
                  className="flex h-10 items-center justify-center rounded-lg px-3 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>

                {index < conditions.length - 1 && <div className="absolute" />}
              </div>
            ))}
          </div>

          <button
            onClick={addCondition}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-[#1F453B] hover:text-[#1F453B]"
          >
            <Plus size={16} />
            Add Condition
          </button>

          <div className="mt-5 flex items-center gap-2">
            <span className="rounded-lg bg-[#1F453B] px-3 py-1.5 text-xs font-bold text-white">
              AND
            </span>
            <span className="text-xs text-slate-400">
              All conditions must be true
            </span>
          </div>
        </SectionCard>

        <div className="flex justify-center">
          <div className="rounded-full border border-slate-200 bg-white p-2 shadow-sm">
            <ArrowDown size={18} className="text-slate-400" />
          </div>
        </div>

        {/* Actions */}
        <SectionCard
          number="3"
          title="Actions"
          description="Define what INOS should do when the rule matches."
          icon={Settings2}
        >
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <select
                  value={action.type}
                  onChange={(e) =>
                    setActions((prev) =>
                      prev.map((item) =>
                        item.id === action.id
                          ? { ...item, type: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="NOTIFICATION">Send Notification</option>
                  <option value="TASK">Create Task</option>
                  <option value="ESCALATION">Create Escalation</option>
                  <option value="CLIQ">Send Cliq Message</option>
                  <option value="EMAIL">Send Email</option>
                  <option value="UPDATE">Update Record</option>
                </select>

                <select
                  value={action.recipient}
                  onChange={(e) =>
                    setActions((prev) =>
                      prev.map((item) =>
                        item.id === action.id
                          ? { ...item, recipient: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option>Project Manager</option>
                  <option>Site Engineer</option>
                  <option>Designer</option>
                  <option>Procurement</option>
                  <option>Operations Manager</option>
                  <option>Super Admin</option>
                </select>

                <select
                  value={action.channel}
                  onChange={(e) =>
                    setActions((prev) =>
                      prev.map((item) =>
                        item.id === action.id
                          ? { ...item, channel: e.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="IN_APP">In-App</option>
                  <option value="EMAIL">Email</option>
                  <option value="CLIQ">Zoho Cliq</option>
                </select>

                <button
                  onClick={() => removeAction(action.id)}
                  className="flex h-10 items-center justify-center rounded-lg px-3 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addAction}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-[#1F453B] hover:text-[#1F453B]"
          >
            <Plus size={16} />
            Add Action
          </button>
        </SectionCard>

        {/* Preview */}
        <div className="rounded-2xl border border-[#1F453B]/20 bg-[#1F453B]/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <TestTube2 size={20} className="text-[#1F453B]" />
            </div>

            <div>
              <h3 className="font-semibold text-[#1F453B]">Rule Preview</h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                When <strong>{triggerEntity}</strong> triggers{" "}
                <strong>{triggerEvent}</strong>, and all{" "}
                <strong>{conditions.length} conditions</strong> match, INOS will
                execute <strong>{actions.length} actions</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600">
            Cancel
          </button>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1F453B] bg-white px-5 py-2.5 text-sm font-semibold text-[#1F453B]">
            <TestTube2 size={16} />
            Test Rule
          </button>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F453B] px-5 py-2.5 text-sm font-semibold text-white">
            <Check size={16} />
            Publish Rule
          </button>
        </div>
      </div>
    </div>
  );
}
