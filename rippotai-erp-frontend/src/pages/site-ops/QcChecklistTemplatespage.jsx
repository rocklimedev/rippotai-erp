import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  MoreHorizontal,
  ClipboardCheck,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ListChecks,
  Users,
  Workflow,
} from "lucide-react";

const mockTemplates = [
  {
    id: 1,
    name: "Electrical First Fix QC",
    trade: "Electrical",
    step: "First Fix",
    description:
      "Checks electrical conduit routing, boxes, and approved drawing compliance.",
    items: 12,
    required: 10,
    isActive: true,
    updatedAt: "22 Aug 2026",
  },
  {
    id: 2,
    name: "Flooring Handover QC",
    trade: "Flooring",
    step: "Flooring",
    description:
      "Quality checklist before flooring area is handed over to the next trade.",
    items: 15,
    required: 14,
    isActive: true,
    updatedAt: "21 Aug 2026",
  },
  {
    id: 3,
    name: "False Ceiling QC",
    trade: "False Ceiling",
    step: "Ceiling",
    description:
      "Inspection checklist for framework, levels, joints and finish readiness.",
    items: 9,
    required: 8,
    isActive: true,
    updatedAt: "20 Aug 2026",
  },
  {
    id: 4,
    name: "Painting Surface Preparation",
    trade: "Painting",
    step: "Surface Preparation",
    description:
      "Checks substrate preparation before primer and final painting.",
    items: 8,
    required: 7,
    isActive: false,
    updatedAt: "18 Aug 2026",
  },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function QcChecklistTemplatesPage() {
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("ALL");
  const [stepFilter, setStepFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [templates, setTemplates] = useState(mockTemplates);

  const trades = useMemo(
    () => ["ALL", ...new Set(templates.map((item) => item.trade))],
    [templates],
  );

  const steps = useMemo(
    () => ["ALL", ...new Set(templates.map((item) => item.step))],
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.trade.toLowerCase().includes(q) ||
        template.step.toLowerCase().includes(q) ||
        template.description?.toLowerCase().includes(q);

      const matchesTrade =
        tradeFilter === "ALL" || template.trade === tradeFilter;

      const matchesStep = stepFilter === "ALL" || template.step === stepFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && template.isActive) ||
        (statusFilter === "INACTIVE" && !template.isActive);

      return matchesSearch && matchesTrade && matchesStep && matchesStatus;
    });
  }, [templates, search, tradeFilter, stepFilter, statusFilter]);

  const toggleStatus = (id) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id
          ? {
              ...template,
              isActive: !template.isActive,
            }
          : template,
      ),
    );
  };

  const activeCount = templates.filter((item) => item.isActive).length;

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#1F2937]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-[#6B7280]">
                <ClipboardCheck className="h-4 w-4" />
                Site Operations
                <ChevronRight className="h-4 w-4" />
                Quality Control
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#16352A]">
                QC Checklist Templates
              </h1>

              <p className="mt-1 text-sm text-[#6B7280]">
                Create and manage reusable quality checklists for trades and
                process steps.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#16352A] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#21483A]"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={ClipboardCheck}
            label="Total Templates"
            value={templates.length}
            description="Reusable QC checklists"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Active Templates"
            value={activeCount}
            description="Available for QC sign-off"
          />

          <SummaryCard
            icon={ListChecks}
            label="Checklist Items"
            value={templates.reduce(
              (total, template) => total + template.items,
              0,
            )}
            description="Across all templates"
          />
        </div>

        {/* Filters */}
        <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search checklist templates..."
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] pl-9 pr-3 text-sm outline-none transition focus:border-[#16352A] focus:ring-1 focus:ring-[#16352A]"
              />
            </div>

            <FilterSelect
              icon={Users}
              value={tradeFilter}
              onChange={setTradeFilter}
              options={trades}
              placeholder="Trade"
            />

            <FilterSelect
              icon={Workflow}
              value={stepFilter}
              onChange={setStepFilter}
              options={steps}
              placeholder="Process Step"
            />

            <FilterSelect
              icon={SlidersHorizontal}
              value={statusFilter}
              onChange={setStatusFilter}
              options={["ALL", "ACTIVE", "INACTIVE"]}
              placeholder="Status"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1F2937]">
                Checklist Templates
              </h2>

              <p className="mt-0.5 text-xs text-[#6B7280]">
                {filteredTemplates.length} templates
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Template
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Trade
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Process Step
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Checklist
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Updated
                  </th>

                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                {filteredTemplates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onToggleStatus={toggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {!filteredTemplates.length && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF2EF]">
                <ClipboardCheck className="h-5 w-5 text-[#16352A]" />
              </div>

              <h3 className="text-sm font-semibold text-[#1F2937]">
                No checklist templates found
              </h3>

              <p className="mt-1 text-sm text-[#6B7280]">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-[#16352A]">{value}</p>

          <p className="mt-1 text-xs text-[#9CA3AF]">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2EF]">
          <Icon className="h-5 w-5 text-[#16352A]" />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, options }) {
  return (
    <div className="relative min-w-[170px]">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-8 text-sm text-[#374151] outline-none focus:border-[#16352A] focus:ring-1 focus:ring-[#16352A]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL"
              ? "All"
              : option.charAt(0) + option.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

function TemplateRow({ template, onToggleStatus }) {
  return (
    <tr className="border-b border-[#F0F1F0] last:border-b-0 hover:bg-[#FAFBFA]">
      {/* Template */}
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2EF]">
            <ClipboardCheck className="h-4 w-4 text-[#16352A]" />
          </div>

          <div className="min-w-0">
            <button
              type="button"
              className="text-left text-sm font-semibold text-[#16352A] hover:underline"
            >
              {template.name}
            </button>

            <p className="mt-1 max-w-[390px] truncate text-xs text-[#6B7280]">
              {template.description}
            </p>
          </div>
        </div>
      </td>

      {/* Trade */}
      <td className="px-5 py-4">
        <span className="inline-flex items-center rounded-md bg-[#F1F4F2] px-2.5 py-1 text-xs font-medium text-[#36554A]">
          {template.trade}
        </span>
      </td>

      {/* Step */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-[#374151]">
          <Workflow className="h-4 w-4 text-[#9CA3AF]" />
          {template.step}
        </div>
      </td>

      {/* Checklist */}
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[#374151]">
            {template.items} items
          </p>

          <p className="mt-0.5 text-xs text-[#6B7280]">
            {template.required} required
          </p>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => onToggleStatus(template.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            template.isActive
              ? "bg-[#E8F3ED] text-[#246044]"
              : "bg-[#F1F2F2] text-[#6B7280]",
          )}
        >
          {template.isActive ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}

          {template.isActive ? "Active" : "Inactive"}
        </button>
      </td>

      {/* Updated */}
      <td className="px-5 py-4 text-sm text-[#6B7280]">{template.updatedAt}</td>

      {/* Actions */}
      <td className="px-3 py-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F3] hover:text-[#16352A]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
