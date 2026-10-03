// Automation — rule builder (create / edit): trigger → conditions → actions, with a live test.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, TestTube2, Zap } from "lucide-react";
import { Page, PageHeader, Button, Field, TextInput, SelectInput, TextArea, ChoiceGroup, EmptyState, Card } from "@/components/inos";
import { DocSection, DocLayout, Grid, RemoveRow, AddRow, Callout } from "@/components/forms/commerce-form-ui";
import {
  useGetAutomationCatalogQuery,
  useGetAutomationRuleQuery,
  useCreateAutomationRuleMutation,
  useUpdateAutomationRuleMutation,
  useTestAutomationDraftMutation,
} from "@/api/automation/automation.api";
import { autoCrumbs, RuleStatus } from "./_automation-ui";

const OP_LABEL = {
  equals: "is",
  not_equals: "is not",
  greater_than: "greater than",
  less_than: "less than",
  contains: "contains",
  in: "is one of",
};

const NOUN = { PAYMENT: "overdue milestones", PROJECT: "projects", QC: "failed inspections", TASK: "overdue tasks", RFI: "open RFIs" };

const EMPTY = { name: "", description: "", triggerType: "", params: {}, conditions: [], actions: [] };
const newAction = (type = "NOTIFY") => ({ type, recipient: "project_manager", title: "", message: "", priority: type === "ESCALATE" ? "HIGH" : "high", dueInDays: 2 });

export default function AutomationRuleBuilder() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { data: catalog } = useGetAutomationCatalogQuery();
  const { data: existing, isLoading: loadingRule, isError: ruleError } = useGetAutomationRuleQuery(id, { skip: !isEdit });
  const [create, { isLoading: creating }] = useCreateAutomationRuleMutation();
  const [update, { isLoading: updating }] = useUpdateAutomationRuleMutation();
  const [testDraft, { isLoading: testing }] = useTestAutomationDraftMutation();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [test, setTest] = useState(null);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || "",
        description: existing.description || "",
        triggerType: existing.triggerType,
        params: existing.params || {},
        conditions: (existing.conditions || []).map((c, i) => ({ ...c, _k: i })),
        actions: (existing.actions || []).map((a, i) => ({ ...newAction(a.type), ...a, _k: i })),
      });
    }
  }, [existing]);

  useEffect(() => {
    if (!isEdit && catalog?.triggers?.length && !form.triggerType) {
      setForm((f) => ({ ...f, triggerType: catalog.triggers[0].type, actions: [{ ...newAction(), _k: 0 }] }));
    }
  }, [catalog, isEdit, form.triggerType]);

  const trigger = useMemo(() => catalog?.triggers?.find((t) => t.type === form.triggerType), [catalog, form.triggerType]);
  const recipients = catalog?.recipients || [];
  const fieldsByKey = Object.fromEntries((trigger?.fields || []).map((f) => [f.key, f]));
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setTest(null);
  };
  const setItem = (list, idx, patch) => set({ [list]: form[list].map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
  const removeItem = (list, idx) => set({ [list]: form[list].filter((_, i) => i !== idx) });

  const payload = (status) => ({
    name: form.name.trim(),
    description: form.description.trim(),
    phase: trigger?.phase,
    triggerType: form.triggerType,
    params: form.params,
    conditions: form.conditions.map(({ _k, ...c }) => c),
    actions: form.actions.map(({ _k, ...a }) => {
      const out = { type: a.type, recipient: a.recipient };
      if (a.title?.trim()) out.title = a.title.trim();
      if (a.message?.trim()) out.message = a.message.trim();
      if (a.type !== "NOTIFY") out.priority = a.priority;
      if (a.type === "TASK") out.dueInDays = Number(a.dueInDays) || 0;
      return out;
    }),
    ...(status ? { status } : {}),
  });

  const validate = (status) => {
    const e = {};
    if (!form.name.trim()) e.name = "Give the rule a name.";
    if (!form.triggerType) e.trigger = "Pick a trigger.";
    if (status === "ACTIVE" && !form.actions.length) e.actions = "Add at least one action before publishing.";
    form.conditions.forEach((c, i) => {
      if (c.value === "" || c.value == null) e[`c${i}`] = "Enter a value";
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async (status) => {
    if (!validate(status)) {
      toast.error("Check the highlighted fields.");
      return;
    }
    try {
      const body = payload(status);
      const res = isEdit ? await update({ id, ...body }).unwrap() : await create(body).unwrap();
      toast.success(status === "ACTIVE" ? "Rule published — it runs on the next check" : "Rule saved");
      nav(isEdit ? "/automation/rules" : `/automation/rules/${res.id}/edit`, { replace: !isEdit });
    } catch (err) {
      toast.error(err?.data?.message || "Couldn't save the rule");
    }
  };

  const runTest = async () => {
    if (!form.triggerType) return;
    try {
      const r = await testDraft(payload()).unwrap();
      setTest(r);
    } catch (err) {
      toast.error(err?.data?.message || "Couldn't test the rule");
    }
  };

  if (isEdit && (loadingRule || ruleError)) {
    return (
      <Page>
        <PageHeader crumbs={autoCrumbs({ label: "Rules", to: "/automation/rules" }, { label: "Edit" })} title="Edit rule" subtitle={loadingRule ? "Loading…" : undefined} />
        {ruleError && (
          <Card>
            <EmptyState icon={Zap} title="Rule not found" action={<Button onClick={() => nav("/automation/rules")}>Back to rules</Button>} />
          </Card>
        )}
      </Page>
    );
  }

  const preview = (
    <DocSection step={5} title="Preview & test" description="How the rule reads, and what it would match today.">
      <Callout tone="brand" icon={Zap}>
        When <strong style={{ display: "inline" }}>{(trigger?.label || "…").toLowerCase()}</strong>
        {form.conditions.length ? (
          <>
            {" "}and{" "}
            {form.conditions.map((c, i) => (
              <span key={i}>
                {i > 0 && " and "}
                <strong style={{ display: "inline" }}>
                  {(fieldsByKey[c.field]?.label || c.field).toLowerCase()} {OP_LABEL[c.operator]} {c.value || "…"}
                </strong>
              </span>
            ))}
          </>
        ) : null}
        , INOS will{" "}
        {form.actions.length
          ? form.actions
              .map((a) => `${a.type === "NOTIFY" ? "notify" : a.type === "TASK" ? "create a task for" : "escalate to"} ${(recipients.find((r) => r.key === a.recipient)?.label || a.recipient).toLowerCase()}`)
              .join(", then ")
          : "do nothing yet"}
        .
      </Callout>
      {errors.actions && <Callout tone="warn">{errors.actions}</Callout>}
      <div>
        <Button variant="secondary" size="sm" icon={TestTube2} loading={testing} onClick={runTest}>
          Test against today's data
        </Button>
      </div>
      {test && (
        <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <div>
            <b>{test.candidates}</b> {NOUN[trigger?.entity] || "records"} found · <b>{test.matched}</b> match the conditions. Nothing was sent.
          </div>
          {(test.preview || []).slice(0, 6).map((p, i) => (
            <div key={i} style={{ color: "var(--text-2)" }}>
              • {p.entity}
              {p.project && p.project !== p.entity ? ` — ${p.project}` : ""}
            </div>
          ))}
          {test.matched > 6 && <div style={{ color: "var(--text-3)" }}>…and {test.matched - 6} more</div>}
        </div>
      )}
    </DocSection>
  );

  return (
    <Page>
      <PageHeader
        crumbs={autoCrumbs({ label: "Rules", to: "/automation/rules" }, { label: isEdit ? existing?.name || "Edit" : "New" })}
        title={isEdit ? "Edit rule" : "New automation rule"}
        subtitle={
          isEdit ? (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {existing?.code} <RuleStatus status={existing?.status} />
            </span>
          ) : (
            "Trigger → conditions → actions. Test it on today's data before publishing."
          )
        }
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav("/automation/rules")}>
            Back to rules
          </Button>
        }
      />

      <form
        className="inos-form"
        onSubmit={(e) => {
          e.preventDefault();
          save("ACTIVE");
        }}
      >
        <DocLayout aside={preview}>
          <DocSection step={1} title="Rule" description="A name your team will recognise in the run log.">
            <Grid cols={1}>
              <Field label="Rule name" required error={errors.name} htmlFor="ar-name">
                <TextInput id="ar-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Payment overdue 15+ days" invalid={!!errors.name} />
              </Field>
              <Field label="Description" optional htmlFor="ar-desc">
                <TextArea id="ar-desc" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What this rule is for" />
              </Field>
            </Grid>
          </DocSection>

          <DocSection step={2} title="Trigger" description="What the engine looks for. Checked every 30 minutes, on “Run now”, and instantly for event triggers.">
            <Grid cols={1}>
              <Field label="When" error={errors.trigger}>
                <ChoiceGroup
                  name="Trigger"
                  value={form.triggerType}
                  onChange={(v) => set({ triggerType: v, params: {}, conditions: [] })}
                  options={(catalog?.triggers || []).map((t) => ({ value: t.type, label: t.label }))}
                />
              </Field>
              {trigger && <p className="inos-hint">{trigger.description}{trigger.eventHook ? " Also fires immediately when the record changes." : ""}</p>}
            </Grid>
            {trigger && (
              <Grid cols={2}>
                {trigger.params.map((p) => (
                  <Field key={p.key} label={`${p.label}${p.unit ? ` (${p.unit})` : ""}`} hint={`Default ${p.default}`}>
                    <TextInput
                      type="number"
                      min={0}
                      value={form.params[p.key] ?? ""}
                      placeholder={String(p.default)}
                      onChange={(e) => set({ params: { ...form.params, [p.key]: e.target.value === "" ? undefined : Number(e.target.value) } })}
                    />
                  </Field>
                ))}
              </Grid>
            )}
          </DocSection>

          <DocSection step={3} title="Conditions" description="Optional. All must be true for the rule to act.">
            <div style={{ display: "grid", gap: 8 }}>
              {form.conditions.map((c, i) => {
                const f = fieldsByKey[c.field];
                return (
                  <div key={c._k ?? i} className="cf-rule-row">
                    <span className="inos-pill inos-pill--brand inos-pill--sm" style={{ justifySelf: "start" }}>
                      {i === 0 ? "If" : "And"}
                    </span>
                    <SelectInput aria-label="Field" value={c.field} onChange={(e) => setItem("conditions", i, { field: e.target.value, value: "" })}>
                      {(trigger?.fields || []).map((x) => (
                        <option key={x.key} value={x.key}>
                          {x.label}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput aria-label="Operator" value={c.operator} onChange={(e) => setItem("conditions", i, { operator: e.target.value })}>
                      {(f?.type === "number" ? ["greater_than", "less_than", "equals", "not_equals"] : f?.type === "enum" ? ["equals", "not_equals", "in"] : ["equals", "not_equals", "contains"]).map((o) => (
                        <option key={o} value={o}>
                          {OP_LABEL[o]}
                        </option>
                      ))}
                    </SelectInput>
                    {f?.type === "enum" && c.operator !== "in" ? (
                      <SelectInput aria-label="Value" value={c.value} onChange={(e) => setItem("conditions", i, { value: e.target.value })} placeholder="Choose…" invalid={!!errors[`c${i}`]}>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o.replace(/_/g, " ").toLowerCase()}
                          </option>
                        ))}
                      </SelectInput>
                    ) : (
                      <TextInput
                        aria-label="Value"
                        type={f?.type === "number" ? "number" : "text"}
                        value={c.value}
                        onChange={(e) => setItem("conditions", i, { value: e.target.value })}
                        placeholder={c.operator === "in" ? (f?.options || []).slice(0, 2).join(",") : f?.type === "number" ? "e.g. 15" : "Value"}
                        invalid={!!errors[`c${i}`]}
                      />
                    )}
                    <RemoveRow label="Remove condition" onClick={() => removeItem("conditions", i)} />
                  </div>
                );
              })}
              {!form.conditions.length && <p className="inos-hint">No conditions — every matching record triggers the actions.</p>}
              {trigger?.fields?.length > 0 && (
                <div>
                  <AddRow
                    onClick={() =>
                      set({
                        conditions: [
                          ...form.conditions,
                          { _k: Date.now(), field: trigger.fields[0].key, operator: trigger.fields[0].type === "number" ? "greater_than" : "equals", value: "" },
                        ],
                      })
                    }
                  >
                    Add condition
                  </AddRow>
                </div>
              )}
            </div>
          </DocSection>

          <DocSection step={4} title="Actions" description="What INOS does for each matching record. Use {{projectName}}, {{title}}, {{daysOverdue}} … in titles and messages.">
            <div style={{ display: "grid", gap: 12 }}>
              {form.actions.map((a, i) => (
                <div key={a._k ?? i} style={{ display: "grid", gap: 8, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                  <div className="cf-rule-row">
                    <span className="inos-pill inos-pill--sm" style={{ justifySelf: "start" }}>
                      {i === 0 ? "Then" : "And"}
                    </span>
                    <SelectInput aria-label="Action" value={a.type} onChange={(e) => setItem("actions", i, { type: e.target.value, priority: e.target.value === "ESCALATE" ? "HIGH" : "high" })}>
                      {(catalog?.actions || []).map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput aria-label="Recipient" value={a.recipient} onChange={(e) => setItem("actions", i, { recipient: e.target.value })}>
                      {recipients.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </SelectInput>
                    {a.type === "NOTIFY" ? (
                      <span className="inos-hint">In-app</span>
                    ) : (
                      <SelectInput aria-label="Priority" value={a.priority} onChange={(e) => setItem("actions", i, { priority: e.target.value })}>
                        {(a.type === "ESCALATE" ? ["LOW", "MEDIUM", "HIGH", "CRITICAL"] : ["low", "medium", "high", "critical"]).map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0) + p.slice(1).toLowerCase()} priority
                          </option>
                        ))}
                      </SelectInput>
                    )}
                    <RemoveRow label="Remove action" onClick={() => removeItem("actions", i)} />
                  </div>
                  <Grid cols={a.type === "TASK" ? 3 : 2}>
                    <Field label={a.type === "TASK" ? "Task title" : "Title"} optional>
                      <TextInput value={a.title || ""} onChange={(e) => setItem("actions", i, { title: e.target.value })} placeholder="Default: rule name + record" />
                    </Field>
                    <Field label="Message" optional>
                      <TextInput value={a.message || ""} onChange={(e) => setItem("actions", i, { message: e.target.value })} placeholder="Default: project — record" />
                    </Field>
                    {a.type === "TASK" && (
                      <Field label="Due in (days)">
                        <TextInput type="number" min={0} value={a.dueInDays ?? 2} onChange={(e) => setItem("actions", i, { dueInDays: e.target.value })} />
                      </Field>
                    )}
                  </Grid>
                </div>
              ))}
              <div>
                <AddRow onClick={() => set({ actions: [...form.actions, { ...newAction(), _k: Date.now() }] })}>Add action</AddRow>
              </div>
            </div>
          </DocSection>
        </DocLayout>

        <div className="inos-form-actions">
          <span className="inos-form-actions__note">
            {form.conditions.length} {form.conditions.length === 1 ? "condition" : "conditions"} · {form.actions.length} {form.actions.length === 1 ? "action" : "actions"}
          </span>
          <div className="inos-form-actions__buttons">
            <Button variant="ghost" onClick={() => nav("/automation/rules")}>
              Cancel
            </Button>
            <Button variant="secondary" icon={Save} loading={creating || updating} onClick={() => save(isEdit ? undefined : "DRAFT")}>
              {isEdit ? "Save changes" : "Save draft"}
            </Button>
            {(!isEdit || existing?.status !== "ACTIVE") && (
              <Button variant="primary" type="submit" icon={Send} loading={creating || updating}>
                Publish rule
              </Button>
            )}
          </div>
        </div>
      </form>
    </Page>
  );
}
