// Business Proposal — one client-ready document that pulls the saved scope, plan, budget and payment
// schedule of a project together. Built on the shared print kit and the same section builders the
// individual documents use, so the proposal always matches them.
import { forwardRef } from "react";
import ProposalDeck from "./proposal-deck/ProposalDeck";
import { KV, kvHas, SignOff, has, fmtDate } from "@/components/print-document";
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
  // Fixed order of the proposal; every section uses the standard kit heading (numbered).
  const order = [
    "The project",
    "How the execution runs",
    "Phases",
    "Scope summary",
    "Scope of work",
    "Not included",
    "Budget estimate",
    "Commercial summary",
    "Payment schedule",
    "Payment milestones",
    "Terms",
    "Next steps",
    "Acceptance",
  ];
  const titles = {
    "The project": "Project details",
    "How the execution runs": "Our plan",
    Phases: "Timeline, phase by phase",
    "Commercial summary": "Our fees",
  };
  const arranged = sections
    .sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title))
    .map((section) => ({ ...section, title: titles[section.title] || section.title }));

  // How we work — the firm's standard process, printed as plain lists.
  const principles = [
    "One point of contact",
    "Nothing hidden in the BOQ",
    "Sign-off before spend",
    "Stage-wise progress",
  ];
  const gates = ["Brief", "Concept", "BOQ freeze", "GFC drawings", "Execution", "Handover"];
  const projectIndex = arranged.findIndex((section) => section.title === "Project details");
  arranged.splice(projectIndex >= 0 ? projectIndex + 1 : 0, 0, {
    title: "How we work",
    blocks: [
      <div key="principles">
        <span className="pd-label">Our principles</span>
        <ol className="pd-terms">
          {principles.map((label, i) => (
            <li key={label}>
              <span className="pd-terms__n">{i + 1}.</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </div>,
      {
        table: {
          label: "Process gates — you sign off at every gate",
          cols: ["Gate", "Stage"],
          template: "20mm 1fr",
          keepWhole: true,
          items: gates.map((label, i) => ({ key: label, cells: [String(i + 1), label] })),
        },
      },
    ],
  });
  arranged.unshift({
    title: "Welcome",
    blocks: [
      <p key="welcome" className="pd-text">
        Thank you{client.name ? `, ${client.name},` : ""} for trusting Rippotai. This proposal
        brings together the scope, programme, budget and payment schedule for{" "}
        {project.name || "your project"}.
      </p>,
    ],
  });
  return arranged;
}

// The client-facing proposal is the original BUSINESS PROPOSAL TEMPLATE deck (540 × 960 pt pages):
// see proposal-deck/ProposalDeck.jsx. buildProposalSections stays for A4 print-kit consumers.
const ProposalDocument = forwardRef(function ProposalDocument(props, ref) {
  return <ProposalDeck ref={ref} {...props} />;
});

export default ProposalDocument;
