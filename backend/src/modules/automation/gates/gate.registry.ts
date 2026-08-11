import { Injectable, Logger } from '@nestjs/common';
import { GateDefinition } from './gate.types';
import { NotFoundError, ValidationError } from '../errors/automation.errors';

/**
 * Optional catalog of reusable, named gate definitions (e.g. a
 * "project-execution-gate" a host app wants to reference from several
 * workflows without re-declaring its checks each time). Purely in-memory
 * and populated at bootstrap — spec §20 says not to introduce a new
 * persistence entity for gates when they can be represented inline inside a
 * workflow definition, so most gates are simply authored inline on a GATE
 * step (`step.gate`) and never touch this registry at all. This registry
 * only exists for the (optional) shared-gate case.
 */
@Injectable()
export class GateRegistry {
  private readonly logger = new Logger(GateRegistry.name);
  private readonly gates = new Map<string, GateDefinition>();

  register(gate: GateDefinition): void {
    if (this.gates.has(gate.id)) {
      throw new ValidationError(`Gate "${gate.id}" is already registered`);
    }
    this.gates.set(gate.id, gate);
    this.logger.log(`Registered gate definition: ${gate.id}`);
  }

  registerOrReplace(gate: GateDefinition): void {
    this.gates.set(gate.id, gate);
  }

  resolve(id: string): GateDefinition {
    const gate = this.gates.get(id);
    if (!gate) throw new NotFoundError(`No gate registered with id "${id}"`);
    return gate;
  }

  has(id: string): boolean {
    return this.gates.has(id);
  }

  list(): GateDefinition[] {
    return Array.from(this.gates.values());
  }
}
