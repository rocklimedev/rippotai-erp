/**
 * Shortlist type: Vendor vs Material
 * Matches the two sheets in the Excel template.
 */
export enum ShortlistType {
  VENDOR = 'VENDOR',
  MATERIAL = 'MATERIAL',
}

/**
 * Working type as shown in Excel (Contractor / Individual / Freelancer)
 * Maps to VendorBusinessType in the main Vendor model when linking.
 */
export enum WorkingType {
  CONTRACTOR = 'Contractor',
  INDIVIDUAL = 'Individual',
  FREELANCER = 'Freelancer',
}

/**
 * Fixed trades from the Excel template.
 * These become the rows in the shortlist.
 */
export enum Trade {
  PLUMBER = 'Plumber',
  ELECTRICIAN = 'Electrician',
  AC = 'AC',
  POP = 'POP',
  FLOORING = 'Flooring',
  CARPENTER = 'Carpentar', // keep spelling as in Excel
  MS = 'MS',
  SOLAR = 'Solar',
  GLASS = 'Glass',
  PAINT = 'Paint',
  CIVIL = 'Civil',
  FACADE = 'Facade',
}

/**
 * Status of a shortlist entry (optional workflow)
 */
export enum ShortlistEntryStatus {
  DRAFT = 'DRAFT',
  SHORTLISTED = 'SHORTLISTED',
  QUOTED = 'QUOTED',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
}
