import { BadRequestException, NotFoundException } from '@nestjs/common';

export class GateNotFoundException extends NotFoundException {
  constructor(gateCode: string) {
    super(`No gate definition found for code "${gateCode}".`);
  }
}

export class GateNotReadyException extends BadRequestException {
  constructor(gateCode: string, failedConditions: string[]) {
    super({
      message: `Gate "${gateCode}" cannot be cleared — one or more conditions are unmet.`,
      failedConditions,
    });
  }
}

export class GateLockedException extends BadRequestException {
  constructor(gateCode: string, previousGateCode: string) {
    super(
      `Gate "${gateCode}" is locked. Gate "${previousGateCode}" has not been cleared yet — gates clear strictly in sequence.`,
    );
  }
}

export class GateAlreadyClearedException extends BadRequestException {
  constructor(gateCode: string) {
    super(
      `Gate "${gateCode}" is already cleared. Use the reopen endpoint if you need to revise it.`,
    );
  }
}

export class ProjectNotFoundException extends NotFoundException {
  constructor(projectId: string) {
    super(`No project found with id "${projectId}".`);
  }
}
