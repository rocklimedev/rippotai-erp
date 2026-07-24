/**
 * Which part(s) of the business a terms template is meant for.
 * GLOBAL templates are eligible everywhere; the others scope a
 * template to a specific document type's picker.
 */

export enum TermsScope {
  GLOBAL = 'GLOBAL',
  PROJECT = 'PROJECT',
  CLIENT = 'CLIENT',
  BOQ = 'BOQ',
  ESTIMATE = 'ESTIMATE',
}
