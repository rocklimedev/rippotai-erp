export const BRIEF_SECTIONS = [
  {
    title: "Project & Client Information",
    fields: [
      { key: "client_name", label: "Client Name" },
      { key: "contact", label: "Primary Contact" },
      { key: "site_address", label: "Site Address", type: "textarea" },
    ],
  },
  {
    title: "Project Purpose",
    fields: [
      { key: "purpose", label: "Purpose", type: "textarea", rows: 4 },
      { key: "style", label: "Design style / mood" },
    ],
  },
  {
    title: "Users and Occupancy",
    fields: [
      { key: "adults", label: "Adults" },
      { key: "kids", label: "Children" },
      { key: "lifestyle", label: "Lifestyle notes", type: "textarea" },
    ],
  },
  {
    title: "Space Requirements",
    fields: [
      {
        key: "rooms",
        label: "Room list (one per line)",
        type: "textarea",
        rows: 5,
      },
    ],
  },
  {
    title: "Design Preferences",
    fields: [
      { key: "palette", label: "Colour palette" },
      { key: "materials", label: "Preferred materials" },
      {
        key: "inspirations",
        label: "Inspiration references",
        type: "textarea",
      },
    ],
  },
  {
    title: "Functional Requirements",
    fields: [
      { key: "storage", label: "Storage / utility needs", type: "textarea" },
      { key: "tech", label: "Technology / smart home" },
    ],
  },
  {
    title: "Budget and Timeline",
    fields: [
      { key: "budget", label: "Budget range" },
      { key: "start_by", label: "Preferred start", type: "date" },
      { key: "complete_by", label: "Target completion", type: "date" },
    ],
  },
  {
    title: "Project Constraints",
    fields: [
      {
        key: "constraints",
        label: "Constraints / restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Sustainability and Maintenance",
    fields: [
      {
        key: "sustainability",
        label: "Sustainability preferences",
        type: "textarea",
      },
    ],
  },
  {
    title: "Priority and Confirmation",
    fields: [
      {
        key: "priorities",
        label: "Priorities (essential / preferred / optional)",
        type: "textarea",
        rows: 4,
      },
    ],
  },
  {
    title: "Sign-off",
    fields: [
      {
        key: "architect_summary",
        label: "Architect summary",
        type: "textarea",
      },
      { key: "open_questions", label: "Open questions", type: "textarea" },
      { key: "client_comments", label: "Client comments", type: "textarea" },
    ],
  },
];
