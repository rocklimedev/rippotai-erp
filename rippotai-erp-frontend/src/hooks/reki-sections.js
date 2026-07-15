export const REKI_SECTIONS = [
  {
    title: "Survey Information",
    fields: [
      { key: "surveyor", label: "Surveyor" },
      { key: "survey_date", label: "Survey date", type: "date" },
      { key: "weather", label: "Weather / conditions" },
    ],
  },
  {
    title: "Site and Access",
    fields: [
      {
        key: "access_notes",
        label: "Access / lift / stairs",
        type: "textarea",
      },
      { key: "parking", label: "Parking" },
    ],
  },
  {
    title: "Room-by-Room Survey",
    fields: [
      {
        key: "rooms_measured",
        label: "Rooms measured (L×W×H per line)",
        type: "textarea",
        rows: 6,
      },
    ],
  },
  {
    title: "Doors and Windows",
    fields: [{ key: "openings", label: "Openings notes", type: "textarea" }],
  },
  {
    title: "Electrical Survey",
    fields: [
      {
        key: "electrical",
        label: "Electrical points / DBs",
        type: "textarea",
      },
    ],
  },
  {
    title: "Plumbing and Sanitary",
    fields: [
      {
        key: "plumbing",
        label: "Plumbing lines / fixtures",
        type: "textarea",
      },
    ],
  },
  {
    title: "HVAC and Ventilation",
    fields: [{ key: "hvac", label: "HVAC / ducts", type: "textarea" }],
  },
  {
    title: "Existing Construction",
    fields: [
      {
        key: "structure",
        label: "Existing structure / condition",
        type: "textarea",
      },
    ],
  },
  {
    title: "Light and Environment",
    fields: [
      {
        key: "light",
        label: "Natural light / noise / air",
        type: "textarea",
      },
    ],
  },
  {
    title: "Safety and Restrictions",
    fields: [
      {
        key: "safety",
        label: "Society / municipal restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Survey Completion",
    fields: [
      { key: "observations", label: "Major observations", type: "textarea" },
      {
        key: "missing",
        label: "Missing info / follow-ups",
        type: "textarea",
      },
      { key: "submitted_by", label: "Submitted by" },
    ],
  },
];
