// Lead temperature (Hot / Warm / Cold) and service (Design / Build) options.

export const TEMPERATURES = [
  { value: 'Hot', label: 'Hot' },
  { value: 'Warm', label: 'Warm' },
  { value: 'Cold', label: 'Cold' },
];

export const SERVICES = [
  { value: 'DESIGN', label: 'Design' },
  { value: 'BUILD', label: 'Build' },
];

export const serviceLabel = (v) => (v === 'BUILD' ? 'Build' : 'Design');
