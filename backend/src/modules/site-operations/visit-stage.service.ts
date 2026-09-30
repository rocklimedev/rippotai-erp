import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import {
  CreateVisitStageDto,
  UpdateVisitStageDto,
} from './dto/visit-stage.dto';

@Injectable()
export class VisitStageService {
  constructor(
    @InjectModel(ArchitectVisitStage)
    private readonly model: typeof ArchitectVisitStage,
  ) {}

  findAll(includeInactive = false) {
    return this.model.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [['visit_no', 'ASC']],
    });
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id);
    if (!row) throw new NotFoundException('Visit stage not found');
    return row;
  }

  async create(dto: CreateVisitStageDto) {
    if (await this.model.findOne({ where: { visit_no: dto.visit_no } })) {
      throw new ConflictException(`Visit no. ${dto.visit_no} already exists`);
    }
    return this.model.create(dto as any);
  }

  async update(id: string, dto: UpdateVisitStageDto) {
    const row = await this.findOne(id);
    return row.update(dto as any);
  }

  /** Soft-disable instead of delete so historical visits keep their stage */
  async deactivate(id: string) {
    const row = await this.findOne(id);
    await row.update({ is_active: false });
    return { message: 'Visit stage deactivated' };
  }
}
