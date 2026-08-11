import { Injectable } from '@nestjs/common';

export interface EventTypeDescriptor {
  type: string;
  /** Payload versions this engine deployment has seen/declared for this type. */
  knownVersions: number[];
  description?: string;
}

/**
 * Optional catalog of event types the host application has declared. Not
 * required for the engine to function (trigger matching works purely off
 * event.type/version), but useful for discoverability / future admin UI
 * (spec §16 — never silently reinterpret an old payload with a new schema).
 */
@Injectable()
export class EventRegistry {
  private readonly types = new Map<string, EventTypeDescriptor>();

  declare(descriptor: EventTypeDescriptor): void {
    this.types.set(descriptor.type, descriptor);
  }

  get(type: string): EventTypeDescriptor | undefined {
    return this.types.get(type);
  }

  list(): EventTypeDescriptor[] {
    return Array.from(this.types.values());
  }

  isKnownVersion(type: string, version: number): boolean {
    const descriptor = this.types.get(type);
    if (!descriptor) return true; // undeclared types are permitted; validation is structural only
    return descriptor.knownVersions.includes(version);
  }
}
