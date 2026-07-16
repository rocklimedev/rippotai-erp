export const REKI_SECTIONS = [
  {
    title: "General Information",
    fields: [
      {
        key: "recce_date",
        label: "Recce Date",
        type: "date",
      },
      {
        key: "time_of_visit",
        label: "Time of Visit",
        type: "time",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          "draft",
          "scheduled",
          "in_progress",
          "completed",
          "approved",
          "cancelled",
        ],
      },
      {
        key: "remarks",
        label: "General Remarks",
        type: "textarea",
      },
    ],
  },

  {
    title: "Site Access Details",
    fields: [
      {
        key: "site_accessibility",
        label: "Site Accessibility",
        type: "select",
        options: ["Easy", "Moderate", "Difficult"],
      },
      {
        key: "road_width_near_site",
        label: "Road Width Near Site",
      },
      {
        key: "vehicle_entry_available",
        label: "Vehicle Entry Available",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "loading_unloading_space",
        label: "Loading / Unloading Space",
        type: "select",
        options: ["Yes", "No", "Limited"],
      },
      {
        key: "lift_available",
        label: "Lift Available",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "service_lift_available",
        label: "Service Lift Available",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "staircase_width",
        label: "Staircase Width",
      },
      {
        key: "floor_level",
        label: "Floor Level",
      },
      {
        key: "parking_availability",
        label: "Parking Availability",
        type: "select",
        options: ["Yes", "No", "Limited"],
      },
      {
        key: "access_restrictions",
        label: "Access Restrictions",
        type: "textarea",
      },
    ],
  },

  {
    title: "Site Condition",
    fields: [
      {
        key: "current_site_status",
        label: "Current Site Status",
        type: "select",
        options: [
          "Empty Site",
          "Under Construction",
          "Renovation Site",
          "Occupied Site",
          "Partially Occupied",
          "Demolition Required",
        ],
      },
      {
        key: "existing_flooring_condition",
        label: "Existing Flooring",
      },
      {
        key: "existing_wall_condition",
        label: "Existing Wall Condition",
      },
      {
        key: "existing_ceiling_condition",
        label: "Existing Ceiling Condition",
      },
      {
        key: "existing_doors_windows_condition",
        label: "Doors & Windows Condition",
      },
      {
        key: "leakage_dampness_observed",
        label: "Leakage / Dampness",
        type: "textarea",
      },
      {
        key: "cracks_observed",
        label: "Cracks Observed",
        type: "textarea",
      },
    ],
  },

  {
    title: "Electrical Survey",
    fields: [
      {
        key: "existing_points_available",
        label: "Existing Electrical Points",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "main_db_location",
        label: "Main DB Location",
      },
      {
        key: "meter_location",
        label: "Meter Location",
      },
      {
        key: "power_supply_status",
        label: "Power Supply Status",
        type: "select",
        options: [
          "Available",
          "Not Available",
          "Temporary Connection Required",
        ],
      },
    ],
  },

  {
    title: "Plumbing Survey",
    fields: [
      {
        key: "water_supply_available",
        label: "Water Supply",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "drainage_line_available",
        label: "Drainage Line",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "existing_plumbing_condition",
        label: "Existing Plumbing",
        type: "select",
        options: ["Good", "Average", "Poor", "Needs Replacement"],
      },
      {
        key: "kitchen_plumbing_checked",
        label: "Kitchen Plumbing Checked",
        type: "select",
        options: ["Yes", "No", "Not Applicable"],
      },
      {
        key: "bathroom_plumbing_checked",
        label: "Bathroom Plumbing Checked",
        type: "select",
        options: ["Yes", "No", "Not Applicable"],
      },
    ],
  },

  {
    title: "Floor & Room Survey",
    type: "floors",
  },

  {
    title: "Layout Drawings",
    type: "layoutAttachments",
  },

  {
    title: "Additional Documents",
    type: "documents",
  },
];
