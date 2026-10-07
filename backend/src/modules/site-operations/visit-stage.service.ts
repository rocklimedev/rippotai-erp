import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import {
  CreateVisitStageDto,
  UpdateVisitStageDto,
} from './dto/visit-stage.dto';
import { ARCHITECT_VISIT_STAGES } from './constants/architect-visit-stages.constant';

@Injectable()
export class VisitStageService {
  constructor(
    @InjectModel(ArchitectVisitStage)
    private readonly model: typeof ArchitectVisitStage,
  ) {}

  async findAll(includeInactive = false) {
    const rows = await this.model.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [['visit_no', 'ASC']],
    });
    return rows.flatMap((row) => {
      const standard = ARCHITECT_VISIT_STAGES.find(
        (s) => s.visit_no === row.visit_no && s.visit_no !== 20,
      );
      return standard ? [{ ...row.toJSON(), ...standard }] : [];
    });
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id);
    if (!row) throw new NotFoundException('Visit stage not found');
    const standard = ARCHITECT_VISIT_STAGES.find(
      (s) => s.visit_no === row.visit_no && s.visit_no !== 20,
    );
    if (!standard)
      throw new NotFoundException('Visit stage is unavailable for allocation');
    return { ...row.toJSON(), ...standard };
  }

  async create(dto: CreateVisitStageDto) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
  }

  async update(id: string, dto: UpdateVisitStageDto) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
  }

  /** Soft-disable instead of delete so historical visits keep their stage */
  async deactivate(id: string) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
  }
}
