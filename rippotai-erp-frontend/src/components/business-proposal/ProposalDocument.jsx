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
import welcomeImage from "@/assets/proposal/welcome.png";
import coverImage from "@/assets/proposal/cover.jpg";
import mark from "@/assets/rippotai_mark.png";
import "./proposal-template.css";
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
  const presentation = {
    "The project": ["02 PROJECT DETAILS", "Project Snapshot.", "The fixed facts we are designing and sequencing around."],
    "How the execution runs": ["04 OUR PLAN", "Our Plan.", "The approach and programme for your project."],
    "Phases": ["PROPOSED TIMELINES", "From Planning To Handover.", "Your saved programme, phase by phase."],
    "Scope summary": ["05 SCOPE OF WORK", "Services Confirmed In Your Brief.", "A summary of what sits inside this proposal."],
    "Scope of work": ["SCOPE OF WORK", "The Scope, In Detail.", "Work organised by trade."],
    "Not included": ["SCOPE OF WORK", "Not In This Scope.", "Items to be handled separately."],
    "Budget estimate": ["BUDGET ESTIMATE", "Your Project Investment.", "The current estimate and its breakdown."],
    "Commercial summary": ["OUR FEES", "One Fee. Open Books Underneath It.", "The saved commercial breakdown for your project."],
    "Payment schedule": ["HOW YOU PAY", "Your Payment Plan.", "The agreed basis for your payment schedule."],
    "Payment milestones": ["HOW YOU PAY", "Pay By Stage.", "Payments linked to the milestones below."],
    "Terms": ["OUR FEES", "Good To Know.", "The terms that accompany your payment schedule."],
    "Next steps": ["NEXT STEPS", "From Review To Mobilization.", "Simple decisions, in the right order."],
    "Acceptance": ["ACCEPTANCE", "Ready For The Next Step.", "Confirm the proposal below."],
  };
  const order = ["The project", "How the execution runs", "Phases", "Scope summary", "Scope of work", "Not included", "Budget estimate", "Commercial summary", "Payment schedule", "Payment milestones", "Terms", "Next steps", "Acceptance"];
  const arranged = sections.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title)).map((section) => {
    const [label, heading, intro] = presentation[section.title];
    return { ...section, newPage: true, title: label, intro: undefined, rows: undefined, blocks: [
      <div className="bp-editorial-heading" key="heading"><h2>{heading}</h2><p>{intro}</p></div>,
      ...(section.rows ? [{ table: section.rows }] : []), ...(section.blocks || []),
    ] };
  });
  const commercialIndex = arranged.findIndex((s) => s.title === "BUDGET ESTIMATE" || s.title === "OUR FEES" || s.title === "HOW YOU PAY");
  if (commercialIndex >= 0) arranged.splice(commercialIndex, 0, {
    newPage: true,
    blocks: [<div className="bp-divider" key="divider"><h2>The Proposal</h2><span /></div>],
  });
  arranged.unshift({
    title: "01 WELCOME NOTE", newPage: true,
    blocks: [
      <div key="welcome-title" className="bp-editorial-heading bp-welcome"><h2>A considered vision<br />for your space.</h2></div>,
      <img key="welcome-art" className="bp-welcome-art" src={welcomeImage} alt="Architectural illustration of a living space" />,
      <div key="welcome" className="bp-welcome-card"><p>Thank you{client.name ? `, ${client.name},` : ""} for trusting Rippotai. This proposal brings together the scope, programme, budget and payment schedule for {project.name || "your project"}.</p><div><strong>Rippotai</strong><small>ARCHITECTURE · INTERIORS · TURNKEY</small></div></div>,
    ],
  });
  const projectIndex = arranged.findIndex((section) => section.title === "02 PROJECT DETAILS");
  arranged.splice(projectIndex >= 0 ? projectIndex + 1 : 1, 0, {
    title: "03 HOW WE WORK", newPage: true,
    blocks: [
      <div className="bp-editorial-heading" key="heading"><h2>Clear gates. Clean approvals.</h2><p>A clear path from the first brief to handover.</p></div>,
      <div className="bp-principles" key="principles">{["One Point Of Contact", "Nothing Hidden In BOQ", "Sign-off Before Spend", "Stage-wise Progress"].map((label, i) => <div key={label}><span>{String(i + 1).padStart(2, "0")}</span>{label}</div>)}</div>,
      <div key="gates"><span className="pd-label">PROCESS GATES</span><div className="bp-gates">{["Brief", "Concept", "BOQ Freeze", "GFC Drawings", "Execution", "Handover"].map((label, i) => <div key={label}><span>{i + 1}</span>{label}</div>)}</div><p className="bp-caption">YOU SIGN OFF AT EVERY GATE</p></div>,
    ],
  });
  return arranged;
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
      className="bp-template"
      pageHeight={373.333}
      numbered={false}
      cover={<section className="pd-page bp-cover">
        <img className="bp-cover-art" src={coverImage} alt="Rippotai architectural staircase" />
        <div className="bp-cover-panel"><h1>BUSINESS<br />PROPOSAL</h1><span className="bp-gold-rule" /><h2>{project.name || "Your Project"}</h2><p>{project.site_location}<br />{client.name}</p><small>{date}</small></div>
      </section>}
      closing={<section className="pd-page bp-closing"><img src={mark} alt="Rippotai" /><div className="bp-wordmark">RIPPŌTAI</div><h2>Let’s bring your vision home.</h2><span className="bp-gold-rule" /><p>ARCHITECTURE · INTERIORS · TURNKEY</p></section>}
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
