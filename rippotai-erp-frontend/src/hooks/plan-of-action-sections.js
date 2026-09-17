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
    ],
  },

  { title: "Phases", type: "phases" },
  { title: "Team", type: "team" },
  { title: "Terms & Conditions", type: "terms" },
];
