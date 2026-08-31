import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PaymentSectionForm } from "../../components/payments/PaymentSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";
import { useCreatePaymentScheduleMutation } from "../../api/payment-schedules.api";
import { useGetTermsTemplatesQuery } from "../../api/terms.api";
import {
  PAYMENT_SCHEDULE_SECTIONS,
  STANDARD_MILESTONE_TEMPLATE,
} from "../../hooks/payment-schedule-section";

import { Plus, Trash2, Wand2 } from "lucide-react";

const SAVE_KEY = "bc.payment-schedule";

const toNumberOrUndefined = (v) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function PaymentScheduleForm() {
  const navigate = useNavigate();

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projects = [] } = useGetProjectsQuery();

  // ============================================================
  // TERMS TEMPLATES
  // ============================================================

  const { data: termsTemplates = [], isLoading: isTermsLoading } =
    useGetTermsTemplatesQuery();

  // ============================================================
  // CREATE PAYMENT SCHEDULE
  // ============================================================

  const [createPaymentSchedule, { isLoading }] =
    useCreatePaymentScheduleMutation();

  // ============================================================
  // PROJECT
  // ============================================================

  const [projectId, setProjectId] = React.useState("");

  // ============================================================
  // FORM STATE
  // ============================================================

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    Overview: {
      title: "Payment Schedule",
      total_contract_value: "",
      gst_rate: "",
      terms_template_id: "",
      terms_version: "",
    },
    milestones: [],
  });

  // ============================================================
  // GENERIC FIELD CHANGE
  // ============================================================

  const handleFieldChange = (section, key, value) => {
    setValues((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  // ============================================================
  // OVERVIEW
  // ============================================================

  const overview = values.Overview || {};

  const contractValue = Number(overview.total_contract_value) || 0;

  const gstRate = overview.gst_rate === "" ? null : Number(overview.gst_rate);

  const gstAmount = gstRate ? round2((contractValue * gstRate) / 100) : 0;

  const totalPayable = round2(contractValue + gstAmount);

  // ============================================================
  // SELECTED TERMS TEMPLATE
  // ============================================================

  const selectedTermsTemplate = useMemo(() => {
    if (!overview.terms_template_id) {
      return null;
    }

    return (
      termsTemplates.find(
        (template) => template.id === overview.terms_template_id,
      ) || null
    );
  }, [overview.terms_template_id, termsTemplates]);

  // ============================================================
  // MILESTONES
  // ============================================================

  const milestones = values.milestones || [];

  const totalPercentage = useMemo(
    () =>
      round2(
        milestones.reduce(
          (sum, milestone) => sum + (Number(milestone.percentage) || 0),
          0,
        ),
      ),
    [milestones],
  );

  // ============================================================
  // TERMS TEMPLATE CHANGE
  // ============================================================

  const handleTermsTemplateChange = (templateId) => {
    const template = termsTemplates.find((item) => item.id === templateId);

    setValues((prev) => ({
      ...prev,
      Overview: {
        ...(prev.Overview || {}),
        terms_template_id: templateId,
        terms_version: template ? String(template.current_version) : "",
      },
    }));
  };

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================

  const renderOverviewSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Overview</h3>

          <p className="text-sm text-[#6B7B7C] mt-1">
            Total contract value, GST and terms for this payment schedule.
            Milestone amounts are calculated from the percentages set on the
            next section.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ================================================== */}
          {/* TITLE */}
          {/* ================================================== */}

          <div className="md:col-span-2">
            <label className="bc-label">Title</label>

            <input
              type="text"
              value={overview.title || ""}
              onChange={(e) =>
                handleFieldChange("Overview", "title", e.target.value)
              }
              placeholder="Payment Schedule"
              className="bc-input w-full"
            />
          </div>

          {/* ================================================== */}
          {/* TERMS TEMPLATE */}
          {/* ================================================== */}

          <div className="md:col-span-2">
            <label className="bc-label">Terms & Conditions</label>

            <select
              className="bc-input w-full"
              value={overview.terms_template_id || ""}
              onChange={(e) => handleTermsTemplateChange(e.target.value)}
              disabled={isTermsLoading}
            >
              <option value="">
                {isTermsLoading
                  ? "Loading terms templates..."
                  : "Select Terms Template"}
              </option>

              {termsTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.is_default ? " (Default)" : ""}
                  {` — v${template.current_version}`}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-[#94A3A5] mt-1">
              Select the terms and conditions that will be attached to this
              payment schedule.
            </p>

            {!isTermsLoading && termsTemplates.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No active terms templates are available.
              </p>
            )}
          </div>

          {/* ================================================== */}
          {/* TERMS VERSION */}
          {/* ================================================== */}

          {overview.terms_template_id && (
            <div className="md:col-span-2">
              <label className="bc-label">Terms Version</label>

              <input
                type="text"
                readOnly
                value={
                  overview.terms_version
                    ? `Version ${overview.terms_version}`
                    : ""
                }
                className="bc-input w-full bg-gray-50 text-[#6B7B7C]"
              />

              <p className="text-[11px] text-[#94A3A5] mt-1">
                The template's current version is automatically selected. The
                payment schedule stores this version so historical schedules
                remain unchanged if the template is updated later.
              </p>

              {selectedTermsTemplate && (
                <p className="text-[11px] text-[#6B7B7C] mt-1">
                  Selected:{" "}
                  <span className="font-medium">
                    {selectedTermsTemplate.name}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* ================================================== */}
          {/* CONTRACT VALUE */}
          {/* ================================================== */}

          <div>
            <label className="bc-label">Total Contract Value</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={overview.total_contract_value || ""}
              onChange={(e) =>
                handleFieldChange(
                  "Overview",
                  "total_contract_value",
                  e.target.value,
                )
              }
              placeholder="0.00"
              className="bc-input w-full"
            />

            <p className="text-[11px] text-[#94A3A5] mt-1">
              Exclusive of GST and variations
            </p>
          </div>

          {/* ================================================== */}
          {/* GST RATE */}
          {/* ================================================== */}

          <div>
            <label className="bc-label">GST Rate</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={overview.gst_rate || ""}
              onChange={(e) =>
                handleFieldChange("Overview", "gst_rate", e.target.value)
              }
              placeholder="e.g. 18"
              className="bc-input w-full"
            />

            <p className="text-[11px] text-[#94A3A5] mt-1">
              Percent. Leave blank if not yet applicable.
            </p>
          </div>

          {/* ================================================== */}
          {/* GST AMOUNT */}
          {/* ================================================== */}

          <div>
            <label className="bc-label">GST Amount</label>

            <input
              type="text"
              readOnly
              value={gstAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
              className="bc-input w-full bg-gray-50 text-[#6B7B7C]"
            />

            <p className="text-[11px] text-[#94A3A5] mt-1">
              Calculated from contract value × GST rate
            </p>
          </div>

          {/* ================================================== */}
          {/* TOTAL PAYABLE */}
          {/* ================================================== */}

          <div>
            <label className="bc-label">Total Payable</label>

            <input
              type="text"
              readOnly
              value={totalPayable.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
              className="bc-input w-full bg-gray-50 text-[#6B7B7C]"
            />

            <p className="text-[11px] text-[#94A3A5] mt-1">
              Contract value + GST amount
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // MILESTONES SECTION
  // ============================================================

  const renderMilestonesSection = () => {
    const nextMilestoneCode = () => `M${milestones.length + 1}`;

    const addMilestone = () => {
      setValues((prev) => {
        const list = prev.milestones || [];

        return {
          ...prev,

          milestones: [
            ...list,
            {
              id: crypto.randomUUID(),
              milestone_code: nextMilestoneCode(),
              title: "",
              description: "",
              release_trigger: "",
              percentage: "",
            },
          ],
        };
      });
    };

    const loadStandardMilestones = () => {
      setValues((prev) => ({
        ...prev,

        milestones: STANDARD_MILESTONE_TEMPLATE.map((milestone) => ({
          id: crypto.randomUUID(),
          ...milestone,
        })),
      }));
    };

    const updateMilestone = (index, field, value) => {
      setValues((prev) => ({
        ...prev,

        milestones: (prev.milestones || []).map((milestone, i) =>
          i === index
            ? {
                ...milestone,
                [field]: value,
              }
            : milestone,
        ),
      }));
    };

    const removeMilestone = (index) => {
      setValues((prev) => ({
        ...prev,

        milestones: (prev.milestones || []).filter((_, i) => i !== index),
      }));
    };

    const moveMilestone = (index, direction) => {
      setValues((prev) => {
        const list = [...(prev.milestones || [])];

        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= list.length) {
          return prev;
        }

        [list[index], list[newIndex]] = [list[newIndex], list[index]];

        return {
          ...prev,
          milestones: list,
        };
      });
    };

    const percentageIsValid = Math.abs(totalPercentage - 100) < 0.01;

    return (
      <div className="space-y-6">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">Payment Milestones</h3>

            <p className="text-sm text-[#6B7B7C] mt-1">
              Define the release schedule from booking to handover.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
                percentageIsValid
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {totalPercentage}% of 100%
            </span>
          </div>
        </div>

        {/* ================================================== */}
        {/* ACTIONS */}
        {/* ================================================== */}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addMilestone}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32]"
          >
            <Plus size={16} />
            Add Milestone
          </button>

          <button
            type="button"
            onClick={loadStandardMilestones}
            disabled={milestones.length > 0}
            className="flex items-center gap-2 border border-[#1F453B] text-[#1F453B] px-4 py-2 rounded-lg text-sm hover:bg-[#F4F6F7] disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              milestones.length > 0
                ? "Clear existing milestones first to load the template"
                : "Load the standard 7-phase milestone template"
            }
          >
            <Wand2 size={16} />
            Load Standard Milestones
          </button>
        </div>

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {milestones.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No milestones added yet.</p>

            <p className="text-xs text-[#94A3A5] mt-1">
              Add milestones one at a time, or load the standard template.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const pct = Number(milestone.percentage) || 0;

              const amount = round2((contractValue * pct) / 100);

              const missingTitle = !milestone.title;

              const missingCode = !milestone.milestone_code;

              return (
                <div
                  key={milestone.id}
                  className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                >
                  {/* ================================================== */}
                  {/* MILESTONE HEADER */}
                  {/* ================================================== */}

                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1F453B] text-white flex items-center justify-center font-semibold shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-[140px] max-w-[140px]">
                        <input
                          type="text"
                          value={milestone.milestone_code}
                          onChange={(e) =>
                            updateMilestone(
                              index,
                              "milestone_code",
                              e.target.value,
                            )
                          }
                          placeholder="M1"
                          className={`bc-input h-9 w-full font-semibold ${
                            missingCode ? "border-red-400" : ""
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(index, "title", e.target.value)
                          }
                          placeholder="Milestone title"
                          className={`bc-input h-9 w-full ${
                            missingTitle ? "border-red-400" : ""
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveMilestone(index, "up")}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={index === milestones.length - 1}
                          onClick={() => moveMilestone(index, "down")}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Remove milestone"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ================================================== */}
                  {/* MILESTONE BODY */}
                  {/* ================================================== */}

                  <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="bc-label">
                          Coverage & Release Trigger
                        </label>

                        <textarea
                          rows={3}
                          value={milestone.description}
                          onChange={(e) =>
                            updateMilestone(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="What this milestone covers"
                          className="bc-input w-full"
                        />
                      </div>

                      <div>
                        <label className="bc-label">Release Trigger Note</label>

                        <textarea
                          rows={3}
                          value={milestone.release_trigger}
                          onChange={(e) =>
                            updateMilestone(
                              index,
                              "release_trigger",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. DUE ON SIGNING — BEFORE SITE START"
                          className="bc-input w-full"
                        />
                      </div>
                    </div>

                    {/* ================================================== */}
                    {/* PERCENTAGE / AMOUNT */}
                    {/* ================================================== */}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="bc-label">Share</label>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={milestone.percentage}
                            onChange={(e) =>
                              updateMilestone(
                                index,
                                "percentage",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="bc-input w-full pr-7"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3A5] text-sm">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="bc-label">Amount</label>

                        <input
                          type="text"
                          readOnly
                          value={amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                          className="bc-input w-full bg-white text-[#6B7B7C]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION ROUTER
  // ============================================================

  const renderSection = (section) => {
    if (section.type === "overview") {
      return renderOverviewSection();
    }

    if (section.type === "milestones") {
      return renderMilestonesSection();
    }

    return null;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!milestones.length) {
      return toast.error("Add at least one milestone.");
    }

    // ========================================================
    // TERMS VALIDATION
    // ========================================================

    if (overview.terms_template_id && !overview.terms_version) {
      return toast.error("Unable to determine the selected terms version.");
    }

    // ========================================================
    // MILESTONE VALIDATION
    // ========================================================

    const incomplete = milestones.filter(
      (milestone) =>
        !milestone.milestone_code ||
        !milestone.title ||
        milestone.percentage === "",
    );

    if (incomplete.length > 0) {
      return toast.error(
        `${incomplete.length} milestone${
          incomplete.length > 1 ? "s are" : " is"
        } missing a code, title or share. Fill these in or remove the row before saving.`,
      );
    }

    // ========================================================
    // DUPLICATE CODE VALIDATION
    // ========================================================

    const codes = milestones.map((milestone) =>
      milestone.milestone_code.trim().toUpperCase(),
    );

    const duplicateCodes = codes.filter(
      (code, index) => codes.indexOf(code) !== index,
    );

    if (duplicateCodes.length > 0) {
      return toast.error(
        `Milestone codes must be unique. Duplicate: ${[
          ...new Set(duplicateCodes),
        ].join(", ")}`,
      );
    }

    // ========================================================
    // PERCENTAGE VALIDATION
    // ========================================================

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return toast.error(
        `Milestone shares must add up to 100% (currently ${totalPercentage}%).`,
      );
    }

    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {
      projectId,

      title: overview.title || "Payment Schedule",

      totalContractValue: contractValue,

      gstRate: toNumberOrUndefined(overview.gst_rate),

      gstAmount,

      totalPayable,

      // ======================================================
      // TERMS
      // ======================================================

      termsTemplateId: overview.terms_template_id || undefined,

      termsVersion: toNumberOrUndefined(overview.terms_version),

      // ======================================================
      // MILESTONES
      // ======================================================

      milestones: milestones.map(({ id, ...milestone }, index) => ({
        milestoneNumber: index + 1,

        milestoneCode: milestone.milestone_code.trim(),

        title: milestone.title,

        description: milestone.description || undefined,

        releaseTrigger: milestone.release_trigger || undefined,

        percentage: Number(milestone.percentage) || 0,

        amount: round2(
          (contractValue * (Number(milestone.percentage) || 0)) / 100,
        ),

        sortOrder: index + 1,
      })),
    };

    // ==========================================================
    // CREATE
    // ==========================================================

    try {
      const schedule = await createPaymentSchedule(payload).unwrap();

      toast.success("Payment Schedule created successfully.");

      localStorage.removeItem(SAVE_KEY);

      navigate(`/payment-schedules/${schedule.id}`);
    } catch (error) {
      console.error("Payment Schedule creation failed:", error);

      toast.error(error?.data?.message || "Failed to create Payment Schedule.");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PaymentSectionForm
      title="Payment Schedule"
      subtitle="Define contract value, GST, terms and milestone-based payment releases for this project"
      submitLabel="Save Payment Schedule"
      sections={PAYMENT_SCHEDULE_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      renderSection={renderSection}
    />
  );
}
