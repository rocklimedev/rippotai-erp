export interface PublishEventDto {
  id: string;
  type: string;
  version: number;
  source: string;
  timestamp: string;
  tenantId?: string;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  payload: Record<string, unknown>;
}
