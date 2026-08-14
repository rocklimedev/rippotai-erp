export enum PlanOfActionStatus {
  DRAFT = 'DRAFT', // being assembled, not yet client-facing
  PUBLISHED = 'PUBLISHED', // signed off / handed to client as the PDF
  ARCHIVED = 'ARCHIVED', // superseded by a newer version
}
