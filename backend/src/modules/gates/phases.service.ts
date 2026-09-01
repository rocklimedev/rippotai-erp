import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GatePhaseDefinition } from './models/gate-phase-definition.model';

@Injectable()
export class PhasesService {
  constructor(
    @InjectModel(GatePhaseDefinition)
    private readonly phaseModel: typeof GatePhaseDefinition,
  ) {}

  async listAll() {
    const phases = await this.phaseModel.findAll({
      order: [['sortOrder', 'ASC']],
    });
    return phases.map((p) => ({
      code: p.code,
      title: p.title,
      sortOrder: p.sortOrder,
      isParallel: p.isParallel,
      leadTeamCode: p.leadTeamCode,
      span: p.span,
      note: p.note,
    }));
  }
}
