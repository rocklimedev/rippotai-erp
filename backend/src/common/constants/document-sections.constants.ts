/**
 * Mirrors the BRIEF_SECTIONS / REKI_SECTIONS arrays used by the frontend
 * (SectionForm) so the backend validates and renders exactly the same
 * section titles + field keys the client sends.
 *
 * IMPORTANT: keep this in lockstep with the frontend definitions. If a
 * section title or field key changes on the client, update it here too —
 * the `sections` JSON blob is keyed by these exact strings.
 */

export type DocumentFieldType = 'text' | 'textarea' | 'date';

export interface DocumentFieldDef {
  key: string;
  label: string;
  type?: DocumentFieldType;
}

export interface DocumentSectionDef {
  title: string;
  fields: DocumentFieldDef[];
}

export const BRIEF_DOC_PREFIX = 'BR';
export const REKI_DOC_PREFIX = 'SR';

export const BRIEF_SECTIONS: DocumentSectionDef[] = [
  {
    title: 'Project & Client Information',
    fields: [
      { key: 'client_name', label: 'Client Name' },
      { key: 'contact', label: 'Primary Contact' },
      { key: 'site_address', label: 'Site Address', type: 'textarea' },
    ],
  },
  {
    title: 'Project Purpose',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'textarea' },
      { key: 'style', label: 'Design style / mood' },
    ],
  },
  {
    title: 'Users and Occupancy',
    fields: [
      { key: 'adults', label: 'Adults' },
      { key: 'kids', label: 'Children' },
      { key: 'lifestyle', label: 'Lifestyle notes', type: 'textarea' },
    ],
  },
  {
    title: 'Space Requirements',
    fields: [
      { key: 'rooms', label: 'Room list (one per line)', type: 'textarea' },
    ],
  },
  {
    title: 'Design Preferences',
    fields: [
      { key: 'palette', label: 'Colour palette' },
      { key: 'materials', label: 'Preferred materials' },
      {
        key: 'inspirations',
        label: 'Inspiration references',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Functional Requirements',
    fields: [
      { key: 'storage', label: 'Storage / utility needs', type: 'textarea' },
      { key: 'tech', label: 'Technology / smart home' },
    ],
  },
  {
    title: 'Budget and Timeline',
    fields: [
      { key: 'budget', label: 'Budget range' },
      { key: 'start_by', label: 'Preferred start', type: 'date' },
      { key: 'complete_by', label: 'Target completion', type: 'date' },
    ],
  },
  {
    title: 'Project Constraints',
    fields: [
      {
        key: 'constraints',
        label: 'Constraints / restrictions',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Sustainability and Maintenance',
    fields: [
      {
        key: 'sustainability',
        label: 'Sustainability preferences',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Priority and Confirmation',
    fields: [
      {
        key: 'priorities',
        label: 'Priorities (essential / preferred / optional)',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Sign-off',
    fields: [
      {
        key: 'architect_summary',
        label: 'Architect summary',
        type: 'textarea',
      },
      { key: 'open_questions', label: 'Open questions', type: 'textarea' },
      { key: 'client_comments', label: 'Client comments', type: 'textarea' },
    ],
  },
];

export const REKI_SECTIONS: DocumentSectionDef[] = [
  {
    title: 'Survey Information',
    fields: [
      { key: 'surveyor', label: 'Surveyor' },
      { key: 'survey_date', label: 'Survey date', type: 'date' },
      { key: 'weather', label: 'Weather / conditions' },
    ],
  },
  {
    title: 'Site and Access',
    fields: [
      {
        key: 'access_notes',
        label: 'Access / lift / stairs',
        type: 'textarea',
      },
      { key: 'parking', label: 'Parking' },
    ],
  },
  {
    title: 'Room-by-Room Survey',
    fields: [
      {
        key: 'rooms_measured',
        label: 'Rooms measured (L×W×H per line)',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Doors and Windows',
    fields: [{ key: 'openings', label: 'Openings notes', type: 'textarea' }],
  },
  {
    title: 'Electrical Survey',
    fields: [
      { key: 'electrical', label: 'Electrical points / DBs', type: 'textarea' },
    ],
  },
  {
    title: 'Plumbing and Sanitary',
    fields: [
      { key: 'plumbing', label: 'Plumbing lines / fixtures', type: 'textarea' },
    ],
  },
  {
    title: 'HVAC and Ventilation',
    fields: [{ key: 'hvac', label: 'HVAC / ducts', type: 'textarea' }],
  },
  {
    title: 'Existing Construction',
    fields: [
      {
        key: 'structure',
        label: 'Existing structure / condition',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Light and Environment',
    fields: [
      { key: 'light', label: 'Natural light / noise / air', type: 'textarea' },
    ],
  },
  {
    title: 'Safety and Restrictions',
    fields: [
      {
        key: 'safety',
        label: 'Society / municipal restrictions',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Survey Completion',
    fields: [
      { key: 'observations', label: 'Major observations', type: 'textarea' },
      { key: 'missing', label: 'Missing info / follow-ups', type: 'textarea' },
      { key: 'submitted_by', label: 'Submitted by' },
    ],
  },
];
