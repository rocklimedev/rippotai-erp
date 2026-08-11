/**
 * These types describe the SHAPE an external action registration takes.
 * The engine does not provide an HTTP endpoint for registering actions —
 * registration happens in-process via ActionRegistry.register() at host
 * application bootstrap (see docs/automation-engine/13-integration-contracts.md).
 * This DTO exists purely for documentation / potential future admin tooling.
 */
export interface ActionTypeDescriptorDto {
  type: string;
  description?: string;
  configSchemaDescription?: string;
}
