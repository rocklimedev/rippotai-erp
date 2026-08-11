/**
 * DI tokens for the extension-point interfaces. A host application binds
 * its own implementations to these tokens via Nest's `useClass`/`useValue`
 * provider syntax when importing AutomationModule. See
 * docs/automation-engine/13-integration-contracts.md for examples.
 */
export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');
export const DOMAIN_EVENT_CONSUMER = Symbol('DOMAIN_EVENT_CONSUMER');
export const AUTOMATION_AUTHORIZATION = Symbol('AUTOMATION_AUTHORIZATION');
export const AUTOMATION_CREDENTIAL_PROVIDER = Symbol(
  'AUTOMATION_CREDENTIAL_PROVIDER',
);
export const AUTOMATION_AUDIT_SINK = Symbol('AUTOMATION_AUDIT_SINK');
export const AUTOMATION_CONTEXT_PROVIDERS = Symbol(
  'AUTOMATION_CONTEXT_PROVIDERS',
);
export const AUTOMATION_APPROVAL_PROVIDER = Symbol(
  'AUTOMATION_APPROVAL_PROVIDER',
);
