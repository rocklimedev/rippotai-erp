import { SITE_RESTRICTION_TYPES } from "./brief-sections";

export const REKI_SECTIONS = [
  // ============================================================
  // 01. GENERAL INFORMATION
  // ============================================================
  {
    title: "General Information",
    fields: [
      {
        key: "recce_date",
        label: "Recce Date",
        type: "date",
        required: true,
      },
      {
        key: "site_engineer_id",
        label: "Site Engineer",
        type: "select",
        options: [],
        required: true,
      },
      {
        key: "accompanied_by",
        label: "Accompanied By",
        type: "text",
      },
    ],
  },

  // ============================================================
  // 02. PROPERTY DETAILS
  // ============================================================
  {
    title: "Property Details",
    fields: [
      {
        key: "unit_floor_no",
        label: "Unit / Floor No.",
        type: "text",
      },
      {
        key: "carpet_area_sqft",
        label: "Carpet Area (sq.ft.)",
        type: "number",
      },
      {
        key: "built_up_area_sqft",
        label: "Built-up Area (sq.ft.)",
        type: "number",
      },
      {
        key: "number_of_rooms",
        label: "Number of Rooms",
        type: "number",
      },
      {
        key: "number_of_floors",
        label: "Number of Floors",
        type: "number",
      },
      {
        key: "site_type",
        label: "Site Type",
        type: "select",
        options: [
          { label: "Flat", value: "FLAT" },
          { label: "Floor", value: "FLOOR" },
          { label: "Kothi", value: "KOTHI" },
          { label: "Raw", value: "RAW" },
        ],
      },
    ],
  },

  // ============================================================
  // 03. SITE ACCESS & MATERIAL MOVEMENT
  // ============================================================
  {
    title: "Site Access & Material Movement",
    fields: [
      {
        key: "lift_available",
        label: "Lift Available",
        type: "select",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
      {
        key: "lift_size",
        label: "Lift Size",
        type: "text",
        placeholder: "e.g. 7 ft × 5 ft × 8 ft",
      },
      {
        key: "staircase_width",
        label: "Staircase Width",
        type: "text",
        placeholder: "e.g. 4 ft",
      },
      {
        key: "material_entry_point",
        label: "Material Entry Point",
        type: "textarea",
        rows: 4,
      },
    ],
  },

  // ============================================================
  // 04. SITE UTILITIES
  // ============================================================
  {
    title: "Site Utilities",
    fields: [
      {
        key: "water_connection",
        label: "Water Connection",
        type: "textarea",
        rows: 4,
      },
      {
        key: "power_load_available",
        label: "Power Load Available",
        type: "text",
        placeholder: "e.g. 10 KW",
      },
      {
        key: "drainage_point_location",
        label: "Drainage Point Location",
        type: "textarea",
        rows: 4,
      },
    ],
  },

  // ============================================================
  // 05. SOCIETY / RWA RESTRICTIONS
  // ============================================================
  // ============================================================
  // 05. SITE RULES & RESTRICTIONS
  // ============================================================

  {
    title: "Site Rules & Restrictions",
    type: "restriction-table",
    description:
      "Record society, RWA, access, working-hour and other site-specific restrictions.",
    fields: [
      {
        key: "site_restrictions",
        label: "Site Restrictions",
        type: "restriction-table",
        restrictionOptions: SITE_RESTRICTION_TYPES,
        columns: [
          {
            key: "type",
            label: "Restriction Type",
            type: "select",
          },
          {
            key: "details",
            label: "Details / Notes",
            type: "text",
          },
        ],
        addLabel: "Add Restriction",
      },
    ],
  },

  // ============================================================
  // 06. EXISTING SITE CONDITION
  // ============================================================
  {
    title: "Existing Site Condition",
    fields: [
      {
        key: "existing_condition",
        label: "Existing Site Condition",
        type: "textarea",
        rows: 7,
      },
    ],
  },

  // ============================================================
  // 07. ROOM-WISE MEASUREMENTS
  // ============================================================
  {
    title: "Room-wise Measurements",
    type: "rooms",
    description:
      "Add all rooms and record their dimensions and existing conditions.",
    fields: [
      {
        key: "room_name",
        label: "Room Name",
        type: "text",
        required: true,
      },
      {
        key: "room_type",
        label: "Room Type",
        type: "select",
        options: [
          { label: "Living / Dining", value: "LIVING_DINING" },
          { label: "Master Bedroom", value: "MASTER_BEDROOM" },
          { label: "Bedroom", value: "BEDROOM" },
          { label: "Kitchen", value: "KITCHEN" },
          { label: "Bathroom", value: "BATHROOM" },
          { label: "Balcony", value: "BALCONY" },
          { label: "Other", value: "OTHER" },
        ],
      },
      {
        key: "room_number",
        label: "Room Number",
        type: "number",
      },
      {
        key: "length",
        label: "Length",
        type: "number",
      },
      {
        key: "width",
        label: "Width",
        type: "number",
      },
      {
        key: "height",
        label: "Height",
        type: "number",
      },
      {
        key: "measurement_unit",
        label: "Measurement Unit",
        type: "select",
        options: [
          { label: "Feet", value: "FT" },
          { label: "Meter", value: "M" },
          { label: "Inches", value: "IN" },
          { label: "Centimeter", value: "CM" },
        ],
      },
      {
        key: "existing_flooring",
        label: "Existing Flooring",
        type: "textarea",
        rows: 3,
      },
      {
        key: "existing_ceiling",
        label: "Existing Ceiling",
        type: "textarea",
        rows: 3,
      },
      {
        key: "notes",
        label: "Room Notes",
        type: "textarea",
        rows: 3,
      },
    ],
  },

  // ============================================================
  // 08. ROOM PHOTOS & LAYOUT REFERENCES
  // ============================================================
  {
    title: "Room Photos & Layout References",
    type: "roomPhotos",
    description:
      "Add photographs, layout references and shot information against each room.",
    fields: [
      {
        key: "room_id",
        label: "Room",
        type: "select",
        options: [],
        required: true,
      },
      {
        key: "shot_number",
        label: "Shot Number",
        type: "number",
        required: true,
      },
      {
        key: "standing_position",
        label: "Standing Position",
        type: "text",
      },
      {
        key: "camera_direction",
        label: "Camera Direction",
        type: "text",
      },
      {
        key: "layout_image_url",
        label: "Layout Image URL",
        type: "text",
      },
      {
        key: "photo_url",
        label: "Actual Photo URL",
        type: "text",
      },
      {
        key: "layout_file_name",
        label: "Layout File Name",
        type: "text",
      },
      {
        key: "photo_file_name",
        label: "Photo File Name",
        type: "text",
      },
      {
        key: "notes",
        label: "Photo Notes",
        type: "textarea",
        rows: 4,
      },
    ],
  },
];
