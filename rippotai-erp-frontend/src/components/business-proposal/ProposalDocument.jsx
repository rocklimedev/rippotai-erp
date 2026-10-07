// Business Proposal — one client-ready PDF that pulls the saved scope, plan, budget and payment
// schedule of a project together. Built on the shared print kit and the same section builders the
// individual documents use, so the proposal always matches them.
import React, { forwardRef, useMemo } from "react";
import {
  PrintDocument,
  KV,
  kvHas,
  SignOff,
  has,
  fmtDate,
  money,
} from "@/components/print-document";
import { buildSowSections } from "@/pages/scope-of-work/ScopeOfWorkView";
import {
  buildPoaSections,
  normalizePoaPhases,
} from "@/pages/plan-of-action/PlanOfActionView";
import { buildEstimateSections } from "@/pages/budget-estimate/BudgetEstimatesView";
import { buildScheduleSections } from "@/components/payments/PaymentScheduleView";

const pick = (sections, map) =>
  sections
    .filter((s) => s && map[s.title] !== undefined && map[s.title] !== null)
    .map((s) => ({ ...s, title: map[s.title] }));

/** docs: { project, scope, plan, budget, schedule, nextSteps, preparedBy } — any may be missing. */
export function buildProposalSections({
  project = {},
  scope,
  plan,
  budget,
  schedule,
  nextSteps,
}) {
  const client = project.client || {};
  const sections = [];

  const about = [
    {
      label: "Client",
      value: client.name,
      strong: true,
      sub: [
        client.contact_person !== client.name && client.contact_person,
        client.phone,
        client.email,
      ]
        .filter(has)
        .join(" · "),
    },
    { label: "Project", value: project.name },
    { label: "Site", value: project.site_location },
    { label: "Project type", value: project.project_type?.name },
    {
      label: "Target completion",
      value: fmtDate(project.expected_completion_date),
    },
    { label: "About the project", value: project.description, wide: true },
  ];
  if (kvHas(about))
    sections.push({
      title: "The project",
      blocks: [<KV key="kv" items={about} />],
    });

  if (scope)
    sections.push(
      ...pick(
        buildSowSections({ ...scope, project: scope.project || project }),
        {
          "Scope summary": "Scope summary",
          "Scope by trade": "Scope of work",
          "Not included": "Not included",
        },
      ),
    );
  if (plan)
    sections.push(
      ...pick(buildPoaSections(plan, normalizePoaPhases(plan)), {
        "How the execution runs": "How the execution runs",
        Phases: "Phases",
      }),
    );
  if (budget)
    sections.push(
      ...pick(buildEstimateSections(budget, ""), {
        Summary: "Budget estimate",
        "Commercial summary": "Commercial summary",
      }),
    );
  if (schedule)
    sections.push(
      ...pick(
        buildScheduleSections({
          ...schedule,
          project: schedule.project || project,
        }),
        {
          Summary: "Payment schedule",
          Milestones: "Payment milestones",
          Terms: "Terms",
        },
      ),
    );

  const steps = (nextSteps?.steps || []).filter((s) => has(s.title));
  const needs = (nextSteps?.checklist || [])
    .filter((c) => has(c.label))
    .map((c) => c.label);
  if (steps.length || needs.length)
    sections.push({
      title: "Next steps",
      rows: steps.length
        ? {
            cols: ["Step", "What happens"],
            template: "34% 1fr",
            items: steps.map((s, i) => ({
              key: s.id || i,
              cells: [`${i + 1}. ${s.title}`, s.detail || ""],
            })),
          }
        : null,
      blocks: needs.length
        ? [
            <div key="needs">
              <span className="pd-label">What we need from you to start</span>
              <ul className="pd-terms">
                {needs.map((n, i) => (
                  <li key={i}>
                    <span className="pd-terms__n">–</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>,
          ]
        : [],
    });

  sections.push({
    title: "Acceptance",
    blocks: [
      <SignOff
        key="sign"
        note="Signing this proposal confirms the scope, plan, budget and payment schedule above as the basis for the agreement."
        left={{ name: "Rippotai Architecture", role: "Authorised signatory" }}
        right={{ name: client.name || "Client", role: "Client · Date" }}
      />,
    ],
  });
  return sections;
}

const ProposalDocument = forwardRef(function ProposalDocument(props, ref) {
  const { project = {}, schedule, budget } = props;
  const sections = useMemo(() => buildProposalSections(props), [props]);
  const client = project.client || {};
  const date = fmtDate(props.generatedAt || new Date());
  const total =
    Number(schedule?.totalPayable) || Number(budget?.total_amount) || 0;
  return (
    <PrintDocument
      ref={ref}
      docType="Business Proposal"
      title={project.name || "Project"}
      subtitle="Scope, plan, budget and payments — in one place."
      coverDetails={[
        { label: "Prepared for", value: client.name, sub: client.phone },
        { label: "Project", value: project.name },
        { label: "Site", value: project.site_location },
        {
          label: "Proposal value",
          value: total ? money(total) : "",
          sub: total ? "Including GST" : "",
        },
        { label: "Date", value: date },
        {
          label: "Prepared by",
          value: props.preparedBy || "Rippotai Architecture",
        },
      ]}
      preparedFor={client.name || project.name}
      date={date}
      sections={sections}
    />
  );
});

export default ProposalDocument;
