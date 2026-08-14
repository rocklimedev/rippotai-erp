// Overview uses SectionForm's built-in simple-field renderer (nested
// under values["Overview"], same pattern as BriefForm's sections).
// Phases / Team / Terms are custom renderers wired up in
// PlanOfActionForm.jsx, same pattern as SiteRekiForm's floors/layouts.
export const POA_SECTIONS = [
  {
    title: "Overview",
    fields: [
      { key: "title", label: "Plan Title", type: "text" },
      {
        key: "execution_description",
        label: "Execution Description",
        type: "textarea",
        rows: 5,
      },
      {
        key: "total_duration_min_days",
        label: "Min Duration (days)",
        type: "number",
      },
      {
        key: "total_duration_max_days",
        label: "Max Duration (days)",
        type: "number",
      },
      {
        key: "total_duration_label",
        label: 'Duration Label (e.g. "4-5 months")',
        type: "text",
      },
    ],
  },
  { title: "Phases", type: "phases" },
  { title: "Team", type: "team" },
  { title: "Terms & Conditions", type: "terms" },
];
