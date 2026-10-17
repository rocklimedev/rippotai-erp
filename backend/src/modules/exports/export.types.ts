export interface ExportActor {
  id: string;
  name?: string;
  email?: string;
}
export type ExportArgument =
  | { source: 'request' | 'response' | 'actor' }
  | { source: 'literal'; value: unknown };
export interface ExportData {
  kind: string;
  args: ExportArgument[];
  actor: ExportActor;
  permission: string;
  operationId: string;
  retryOf?: string;
  retryGeneration: number;
}
export type ExportResult =
  | { type: 'file'; key: string; filename: string; mime: string; size: number }
  | { type: 'json'; value: unknown };
