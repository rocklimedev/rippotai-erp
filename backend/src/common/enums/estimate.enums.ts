export enum EstimateSourcePath {
  RATES_ONLY = 'rates_only',
  VENDOR_QUOTE = 'vendor_quote',
}

export enum EstimateCategory {
  TRADE = 'trade',
  MATERIAL = 'material',
}

export enum EstimateStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
}

// Alias instead of creating another enum
export { EstimateSourcePath as TenderResponsePath };

export enum TenderResponseStatus {
  RECEIVED = 'received',
  REWORKED = 'reworked',
  ESTIMATE_CREATED = 'estimate_created',
  REJECTED = 'rejected',
}

export enum ContractorLineupStatus {
  ASSIGNED = 'assigned',
  MOBILISED = 'mobilised',
  COMPLETED = 'completed',
  RELEASED = 'released',
}
