import { termsToText, textToTermsHtml } from "@/lib/terms";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Wand2, Pencil, Eye, Code, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Button, Field, TextInput, SelectInput, TextArea, EmptyState, Page } from "@/components/inos";
import {
  Grid,
  Affix,
  TotalsCard,
  Callout,
  IconAction,
  RemoveRow,
  LoadingBlock,
  inr,
} from "@/components/forms/commerce-form-ui";

import { PaymentSectionForm } from "../../components/payments/PaymentSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useCreatePaymentScheduleMutation,
  useUpdatePaymentScheduleMutation,
  useGetPaymentScheduleQuery,
} from "../../api/documents/payment-schedules.api";
import {
  useGetTermsTemplatesQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
} from "../../api/meta/terms.api";
import {
  PAYMENT_SCHEDULE_SECTIONS,
  STANDARD_MILESTONE_TEMPLATE,
} from "../../hooks/payment-schedule-section";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  TermsPreview,
  TermsFullDisplay,
} from "../../components/settings/TermsDisplay";

const SAVE_KEY = "bc.payment-schedule";

const toNumberOrUndefined = (v) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const calcAmountFromPct = (contractValue, pct) =>
  round2((Number(contractValue) * (Number(pct) || 0)) / 100);

const calcPctFromAmount = (contractValue, amount) => {
  const cv = Number(contractValue) || 0;
  if (cv <= 0) return 0;
  return round2(((Number(amount) || 0) * 100) / cv);
};

const str = (v) => (v === null || v === undefined ? "" : String(v));

const SCOPES = [
  { value: "GLOBAL", label: "Global" },
  { value: "PROJECT", label: "Projects" },
  { value: "CLIENT", label: "Clients" },
  { value: "BOQ", label: "Bill of Quantities" },
  { value: "ESTIMATE", label: "Estimates" },
];

const EMPTY_VALUES = {
  Overview: {
    title: "Payment Schedule",
    total_contract_value: "",
    gst_rate: "",
    terms_template_id: "",
    terms_version: "",
  },
  milestones: [],
};

export function PaymentScheduleForm({ scheduleId: scheduleIdProp }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // ============================================================
  // MODE (create vs edit)
  // ============================================================

  const scheduleId = scheduleIdProp || routeId;
  const isEdit = Boolean(scheduleId);

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projects = [] } = useGetProjectsQuery();

  // ============================================================
  // TERMS TEMPLATES
  // ============================================================

  const { data: termsTemplates = [], isLoading: isTermsLoading } =
    useGetTermsTemplatesQuery();

  const [createTemplate, { isLoading: isCreatingTemplate }] =
    useCreateTermsTemplateMutation();

  const [updateContent, { isLoading: isSavingContent }] =
    useUpdateTermsTemplateContentMutation();

  // ============================================================
  // EXISTING SCHEDULE (edit mode only)
  // ============================================================

  const { data: existing, isLoading: isLoadingExisting } =
    useGetPaymentScheduleQuery(scheduleId, { skip: !isEdit });

  // ============================================================
  // CREATE / UPDATE PAYMENT SCHEDULE
  // ============================================================

  const [createPaymentSchedule, { isLoading: isCreating }] =
    useCreatePaymentScheduleMutation();

  const [updatePaymentSchedule, { isLoading: isUpdating }] =
    useUpdatePaymentScheduleMutation();

  const isSubmitting = isCreating || isUpdating;

  // ============================================================
  // PROJECT
  // ============================================================

  const [searchParams] = useSearchParams();
  const [projectId, setProjectId] = React.useState(
    () => (!isEdit && (searchParams.get("projectId") || searchParams.get("project_id"))) || "",
  );

  // ============================================================
  // FORM STATE
  // ============================================================

  // Separate draft key for edits so they never overwrite the "new" draft
  const draftKey = isEdit ? `${SAVE_KEY}.${scheduleId}` : SAVE_KEY;

  const [values, setValues] = useAutoSave(draftKey, EMPTY_VALUES);

  // ============================================================
  // HYDRATE FORM FROM SERVER (edit mode)
  // ============================================================

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isEdit || !existing || hydratedRef.current) return;
    hydratedRef.current = true;

    setProjectId(existing.projectId ?? existing.project?.id ?? "");

    setValues({
      Overview: {
        title: existing.title || "Payment Schedule",
        total_contract_value: str(existing.totalContractValue),
        gst_rate: str(existing.gstRate),
        terms_template_id: existing.termsTemplateId || "",
        terms_version: str(existing.termsVersion),
      },
      milestones: [...(existing.milestones || [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((m) => ({
          id: m.id || crypto.randomUUID(),
          milestone_code: m.milestoneCode || "",
          title: m.title || "",
          description: m.description || "",
          release_trigger: m.releaseTrigger || "",
          percentage: str(m.percentage),
          amount: str(m.amount),
        })),
    });
  }, [isEdit, existing, setValues]);

  // ============================================================
  // TERMS MODALS STATE
  // ============================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    scope: "GLOBAL",
    content_html: "",
  });

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // ============================================================
  // GENERIC FIELD CHANGE
  // ============================================================

  const handleFieldChange = (section, key, value) => {
    setValues((prev) => {
      const next = {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [key]: value,
        },
      };

      // When contract value changes, recalculate all milestone amounts from their %
      if (section === "Overview" && key === "total_contract_value") {
        const cv = Number(value) || 0;
        next.milestones = (prev.milestones || []).map((m) => ({
          ...m,
          amount:
            m.percentage !== "" && m.percentage !== undefined
              ? String(calcAmountFromPct(cv, m.percentage))
              : m.amount,
        }));
      }

      return next;
    });
  };

  // ============================================================
  // OVERVIEW DERIVED
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
    if (!overview.terms_template_id) return null;
    return (
      termsTemplates.find((t) => t.id === overview.terms_template_id) || null
    );
  }, [overview.terms_template_id, termsTemplates]);

  // ============================================================
  // MILESTONES
  // ============================================================

  const milestones = values.milestones || [];

  const totalPercentage = useMemo(
    () =>
      round2(
        milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0),
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
  // CREATE / EDIT TERMS HANDLERS
  // ============================================================

  const resetCreateForm = () =>
    setCreateForm({ name: "", scope: "GLOBAL", content_html: "" });

  const handleCreateTemplate = async () => {
    if (!createForm.name.trim() || !createForm.content_html.trim()) {
      toast.error("Name and content are required");
      return;
    }
    try {
      const created = await createTemplate({ ...createForm, name: createForm.name.trim(), content_html: textToTermsHtml(createForm.content_html) }).unwrap();
      toast.success("Template created");
      setCreateOpen(false);
      resetCreateForm();

      if (created?.id) {
        handleTermsTemplateChange(created.id);
      }
    } catch {
      toast.error("Failed to create template");
    }
  };

  const openEditContent = (template) => {
    setEditingTemplate(template);
    setEditContent(termsToText(template.content_html));
    setChangeNote("");
    setPreviewMode(false);
  };

  const handleSaveContent = async () => {
    if (!editingTemplate) return;
    if (!editContent.trim()) {
      toast.error("Content can't be empty");
      return;
    }
    try {
      const updated = await updateContent({
        id: editingTemplate.id,
        content_html: textToTermsHtml(editContent),
        change_note: changeNote || undefined,
      }).unwrap();

      toast.success(`Saved as v${(editingTemplate.current_version || 1) + 1}`);

      if (updated?.current_version) {
        setValues((prev) => prev.Overview?.terms_template_id === editingTemplate.id ? ({
          ...prev,
          Overview: {
            ...(prev.Overview || {}),
            terms_version: String(updated.current_version),
          },
        }) : prev);
      }

      setEditingTemplate(null);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================

  const renderOverviewSection = () => {
    return (
      <Grid cols={2}>
        <Field label="Title" full htmlFor="ps-title">
          <TextInput
            id="ps-title"
            value={overview.title || ""}
            onChange={(e) => handleFieldChange("Overview", "title", e.target.value)}
            placeholder="e.g. Payment schedule — interiors"
          />
        </Field>

        <Field label="Total contract value" required hint="Excluding GST and variations." htmlFor="ps-cv">
          <Affix pre="₹">
            <TextInput
              id="ps-cv"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={overview.total_contract_value || ""}
              onChange={(e) => handleFieldChange("Overview", "total_contract_value", e.target.value)}
              placeholder="e.g. 2500000"
            />
          </Affix>
        </Field>

        <Field label="GST rate" optional hint="Leave blank if not yet applicable." htmlFor="ps-gst">
          <Affix post="%">
            <TextInput
              id="ps-gst"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={overview.gst_rate || ""}
              onChange={(e) => handleFieldChange("Overview", "gst_rate", e.target.value)}
              placeholder="e.g. 18"
            />
          </Affix>
        </Field>

        <Field
          label="Terms & conditions"
          optional
          full
          htmlFor="ps-terms"
          hint={
            !isTermsLoading && termsTemplates.length === 0
              ? "No terms templates yet — create one with “New template”."
              : overview.terms_template_id && overview.terms_version
                ? `Locked to version ${overview.terms_version} — later edits to the template won't change this schedule.`
                : "Attach a terms template. Its current version is stored with the schedule."
          }
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <SelectInput
                id="ps-terms"
                value={overview.terms_template_id || ""}
                onChange={(e) => handleTermsTemplateChange(e.target.value)}
                disabled={isTermsLoading}
                placeholder={isTermsLoading ? "Loading terms templates…" : "Select terms template"}
              >
                {termsTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.is_default ? " (default)" : ""}
                    {` — v${template.current_version}`}
                  </option>
                ))}
              </SelectInput>
            </div>
            {selectedTermsTemplate && (
              <Button variant="secondary" icon={Pencil} onClick={() => openEditContent(selectedTermsTemplate)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" icon={Plus} onClick={() => setCreateOpen(true)}>
              New template
            </Button>
          </div>
        </Field>
      </Grid>
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
              amount: "",
            },
          ],
        };
      });
    };

    const loadStandardMilestones = () => {
      const cv = Number(values.Overview?.total_contract_value) || 0;

      setValues((prev) => ({
        ...prev,
        milestones: STANDARD_MILESTONE_TEMPLATE.map((milestone) => ({
          id: crypto.randomUUID(),
          ...milestone,
          amount: String(calcAmountFromPct(cv, milestone.percentage)),
        })),
      }));
    };

    const updateMilestone = (index, field, value) => {
      setValues((prev) => {
        const list = [...(prev.milestones || [])];
        const current = { ...list[index] };
        const cv = Number(prev.Overview?.total_contract_value) || 0;

        if (field === "percentage") {
          current.percentage = value;
          if (value !== "" && !isNaN(Number(value))) {
            current.amount = String(calcAmountFromPct(cv, value));
          } else {
            current.amount = "";
          }
        } else if (field === "amount") {
          current.amount = value;
          if (value !== "" && !isNaN(Number(value)) && cv > 0) {
            current.percentage = String(calcPctFromAmount(cv, value));
          } else if (value === "") {
            current.percentage = "";
          }
        } else {
          current[field] = value;
        }

        list[index] = current;
        return { ...prev, milestones: list };
      });
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
        if (newIndex < 0 || newIndex >= list.length) return prev;
        [list[index], list[newIndex]] = [list[newIndex], list[index]];
        return { ...prev, milestones: list };
      });
    };

    const percentageIsValid = Math.abs(totalPercentage - 100) < 0.01;

    return (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="secondary" size="sm" icon={Plus} onClick={addMilestone}>
            Add milestone
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Wand2}
            onClick={loadStandardMilestones}
            disabled={milestones.length > 0}
            title={
              milestones.length > 0
                ? "Clear existing milestones first to load the template"
                : "Load the standard 7-phase milestone template"
            }
          >
            Load standard 7 phases
          </Button>
          <span style={{ marginLeft: "auto" }} className={`inos-pill ${percentageIsValid ? "inos-pill--ok" : "inos-pill--warn"}`}>
            <span className="inos-pill__dot" aria-hidden />
            <span className="tabular">{totalPercentage}% of 100%</span>
          </span>
        </div>

        {milestones.length === 0 ? (
          <div className="cf-block">
            <EmptyState
              icon={Wand2}
              title="No milestones yet"
              text="Start from the standard 7-phase template (booking to handover), or add milestones one at a time."
              action={
                <Button variant="soft" icon={Wand2} onClick={loadStandardMilestones}>
                  Load standard milestones
                </Button>
              }
            />
          </div>
        ) : (
          milestones.map((milestone, index) => {
            const pct = Number(milestone.percentage) || 0;
            const amount =
              milestone.amount !== "" && milestone.amount !== undefined
                ? Number(milestone.amount)
                : calcAmountFromPct(contractValue, pct);

            return (
              <div key={milestone.id} className="cf-block">
                <div className="cf-ms-row">
                  <span className="inos-form-section__step" aria-hidden>
                    {index + 1}
                  </span>
                  <Field label="Code" required>
                    <TextInput
                      value={milestone.milestone_code}
                      onChange={(e) => updateMilestone(index, "milestone_code", e.target.value)}
                      placeholder="M1"
                      invalid={!milestone.milestone_code}
                    />
                  </Field>
                  <Field label="Milestone" required>
                    <TextInput
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, "title", e.target.value)}
                      placeholder="e.g. Booking & mobilisation"
                      invalid={!milestone.title}
                    />
                  </Field>
                  <Field label="Share" required>
                    <Affix post="%">
                      <TextInput
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        value={milestone.percentage}
                        onChange={(e) => updateMilestone(index, "percentage", e.target.value)}
                        placeholder="0"
                        style={{ textAlign: "right" }}
                        invalid={milestone.percentage === ""}
                      />
                    </Affix>
                  </Field>
                  <Field label="Amount">
                    <Affix pre="₹">
                      <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={
                          milestone.amount !== undefined && milestone.amount !== ""
                            ? milestone.amount
                            : amount || ""
                        }
                        onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                        placeholder={contractValue > 0 ? "0.00" : "Set contract value"}
                        disabled={contractValue <= 0}
                        style={{ textAlign: "right" }}
                      />
                    </Affix>
                  </Field>
                  <div className="cf-ms-actions">
                    <IconAction icon={ArrowUp} label="Move up" disabled={index === 0} onClick={() => moveMilestone(index, "up")} />
                    <IconAction
                      icon={ArrowDown}
                      label="Move down"
                      disabled={index === milestones.length - 1}
                      onClick={() => moveMilestone(index, "down")}
                    />
                    <RemoveRow label="Remove milestone" onClick={() => removeMilestone(index)} />
                  </div>
                </div>
                <Grid cols={2}>
                  <Field label="What it covers" optional>
                    <TextArea
                      rows={2}
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      placeholder="e.g. Design sign-off, site mobilisation"
                    />
                  </Field>
                  <Field label="Release trigger" optional>
                    <TextArea
                      rows={2}
                      value={milestone.release_trigger}
                      onChange={(e) => updateMilestone(index, "release_trigger", e.target.value)}
                      placeholder="e.g. Due on signing, before site start"
                    />
                  </Field>
                </Grid>
              </div>
            );
          })
        )}
        {milestones.length > 0 && (
          <div>
            <Button variant="ghost" size="sm" icon={Plus} onClick={addMilestone} className="cf-add-row">
              Add milestone
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION ROUTER
  // ============================================================

  const renderSection = (section) => {
    if (section.type === "overview") return renderOverviewSection();
    if (section.type === "milestones") return renderMilestonesSection();
    return null;
  };

  // ============================================================
  // SUBMIT (create or update)
  // ============================================================

  const handleSubmit = async () => {
    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!milestones.length) {
      return toast.error("Add at least one milestone.");
    }

    if (overview.terms_template_id && !overview.terms_version) {
      return toast.error("Unable to determine the selected terms version.");
    }

    const incomplete = milestones.filter(
      (m) => !m.milestone_code || !m.title || m.percentage === "",
    );

    if (incomplete.length > 0) {
      return toast.error(
        `${incomplete.length} milestone${
          incomplete.length > 1 ? "s are" : " is"
        } missing a code, title or share. Fill these in or remove the row before saving.`,
      );
    }

    const codes = milestones.map((m) => m.milestone_code.trim().toUpperCase());
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

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return toast.error(
        `Milestone shares must add up to 100% (currently ${totalPercentage}%).`,
      );
    }

    const payload = {
      projectId,
      title: overview.title || "Payment Schedule",
      totalContractValue: contractValue,
      gstRate: toNumberOrUndefined(overview.gst_rate),
      gstAmount,
      totalPayable,
      termsTemplateId: overview.terms_template_id || undefined,
      termsVersion: toNumberOrUndefined(overview.terms_version),
      milestones: milestones.map(({ id, ...milestone }, index) => {
        const pct = Number(milestone.percentage) || 0;
        const amount =
          milestone.amount !== "" && milestone.amount !== undefined
            ? round2(Number(milestone.amount))
            : calcAmountFromPct(contractValue, pct);

        return {
          // If your backend PATCH diffs milestones by id, add: id: existingId
          milestoneNumber: index + 1,
          milestoneCode: milestone.milestone_code.trim(),
          title: milestone.title,
          description: milestone.description || undefined,
          releaseTrigger: milestone.release_trigger || undefined,
          percentage: pct,
          amount,
          sortOrder: index + 1,
        };
      }),
    };

    try {
      const result = isEdit
        ? await updatePaymentSchedule({ id: scheduleId, ...payload }).unwrap()
        : await createPaymentSchedule(payload).unwrap();

      toast.success(
        isEdit
          ? "Payment Schedule updated successfully."
          : "Payment Schedule created successfully.",
      );
      localStorage.removeItem(draftKey);
      navigate(`/payment-schedules/${result?.id ?? scheduleId}`);
    } catch (error) {
      console.error("Payment Schedule save failed:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} Payment Schedule.`,
      );
    }
  };

  // ============================================================
  // LOADING STATE (edit mode)
  // ============================================================

  if (isEdit && isLoadingExisting) {
    return (
      <Page width="form">
        <LoadingBlock label="Loading payment schedule…" />
      </Page>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <PaymentSectionForm
        title={isEdit ? "Edit payment schedule" : "New payment schedule"}
        subtitle="Set the contract value and GST, then split payments into milestones that add up to 100%."
        crumbs={[
          { label: "Ledger", to: "/ledger" },
          { label: "Payment schedules", to: "/ledger/payment-schedule/all" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        onCancel={() => navigate(-1)}
        submitLabel={isEdit ? "Update schedule" : "Save schedule"}
        sections={PAYMENT_SCHEDULE_SECTIONS.map((section) => ({
          ...section,
          label: section.type === "overview" ? "Contract & terms" : section.type === "milestones" ? "Payment milestones" : section.title,
          description:
            section.type === "overview"
              ? "Contract value, GST and the terms that go with this schedule."
              : section.type === "milestones"
                ? "Enter the share (%) or the amount — the other is calculated from the contract value."
                : undefined,
        }))}
        aside={
          <>
            <TotalsCard
              title="Summary"
              rows={[
                { label: "Contract value", value: inr(contractValue) },
                { label: `GST${gstRate ? ` (${gstRate}%)` : ""}`, value: inr(gstAmount) },
                { label: "Milestones", value: milestones.length },
                { label: "Shares allocated", value: `${totalPercentage}%` },
              ]}
              totalLabel="Total payable"
              total={inr(totalPayable)}
            />
            {milestones.length > 0 && Math.abs(totalPercentage - 100) > 0.01 && (
              <Callout tone="warn" title="Shares must add up to 100%">
                {totalPercentage < 100
                  ? `${round2(100 - totalPercentage)}% still to allocate.`
                  : `Over by ${round2(totalPercentage - 100)}%.`}
              </Callout>
            )}
          </>
        }
        values={values}
        onFieldChange={handleFieldChange}
        projects={projects}
        projectId={projectId}
        onProjectChange={setProjectId}
        disableProject={isEdit}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        renderSection={renderSection}
      />

      {/* CREATE TERMS TEMPLATE MODAL */}
      <CreateTermsTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        onCreate={handleCreateTemplate}
        isCreating={isCreatingTemplate}
        resetForm={resetCreateForm}
      />

      {/* EDIT TERMS TEMPLATE MODAL */}
      <EditTermsTemplateDialog
        template={editingTemplate}
        editContent={editContent}
        setEditContent={setEditContent}
        changeNote={changeNote}
        setChangeNote={setChangeNote}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        onSave={handleSaveContent}
        isSaving={isSavingContent}
        onClose={() => setEditingTemplate(null)}
      />
    </>
  );
}

/* ============================================================ */
/* CREATE TEMPLATE DIALOG                                      */
/* ============================================================ */

function CreateTermsTemplateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onCreate,
  isCreating,
  resetForm,
}) {
  const [previewMode, setPreviewMode] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
    setPreviewMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New terms template</DialogTitle>
          <DialogDescription>
            This becomes v1. You can edit the wording later — each edit creates
            a new version rather than overwriting this one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="inos-label">
              Template name
            </label>
            <input
              className="inos-input" style={{ marginTop: 6 }}
              placeholder="e.g. Standard Payment Schedule Terms"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Scope */}
          <div>
            <label className="inos-label">
              Scope
            </label>
            <select
              className="inos-select" style={{ marginTop: 6 }}
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({ ...f, scope: e.target.value }))
              }
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="inos-label">
                Terms content
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="inos-btn inos-btn--ghost inos-btn--sm"
              >
                {previewMode ? <Code size={14} /> : <Eye size={14} />}
                {previewMode ? "Edit" : "Preview"}
              </button>
            </div>

            {previewMode ? (
              <div className="cf-block" style={{ minHeight: 160, overflowY: "auto" }}>
                {form.content_html.trim() ? (
                  <TermsPreview
                    htmlContent={textToTermsHtml(form.content_html)}
                    maxPreview={10}
                  />
                ) : (
                  <p className="inos-hint">
                    Enter content to see preview…
                  </p>
                )}
              </div>
            ) : (
              <textarea
                className="inos-textarea" style={{ minHeight: 160 }}
                placeholder={`All quantities are approximate and subject to site verification.
Rates include labour, material, tools, and equipment unless otherwise specified.
Any variation in scope shall be treated as extra work.`}
                value={form.content_html}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    content_html: e.target.value,
                  }))
                }
              />
            )}
            <p className="inos-hint" style={{ display: "block", marginTop: 4 }}>
              Write one term per line.
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className="inos-btn inos-btn--ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="inos-btn inos-btn--primary"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Creating…
              </span>
            ) : (
              "Create template"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================ */
/* EDIT TEMPLATE DIALOG                                        */
/* ============================================================ */

function EditTermsTemplateDialog({
  template,
  editContent,
  setEditContent,
  changeNote,
  setChangeNote,
  previewMode,
  setPreviewMode,
  onSave,
  isSaving,
  onClose,
}) {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit "{template.name}"</DialogTitle>
          <DialogDescription>
            Saving creates v{(template.current_version || 1) + 1}. Documents
            that already snapshotted an earlier version are unaffected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="inos-label">
              Content
            </label>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="inos-btn inos-btn--ghost inos-btn--sm"
            >
              {previewMode ? <Code size={14} /> : <Eye size={14} />}
              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>

          {previewMode ? (
            <div className="cf-block" style={{ minHeight: 240, overflowY: "auto" }}>
              <TermsFullDisplay htmlContent={textToTermsHtml(editContent)} />
            </div>
          ) : (
            <textarea
              className="inos-textarea" style={{ minHeight: 240 }}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          )}

          <div>
            <label className="inos-label">
              Change note (optional)
            </label>
            <input
              className="inos-input" style={{ marginTop: 6 }}
              placeholder="e.g. Updated payment terms clause"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <p className="inos-hint" style={{ display: "block", marginTop: 4 }}>
              Describe what changed for version history
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="inos-btn inos-btn--ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inos-btn inos-btn--primary"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Saving…
              </span>
            ) : (
              "Save as new version"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
