import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SampleBoard } from '../models/sample-board.model';
import { CreateSampleBoardDto } from '../dto/create-sample-board.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';
import { ApprovalStatus } from '../../../common/enums/approval-status.enum';

@Injectable()
export class SampleBoardService {
  constructor(
    @InjectModel(SampleBoard)
    private readonly model: typeof SampleBoard,
  ) {}

  create(dto: CreateSampleBoardDto) {
    return this.model.create({
      ...dto,
      approvalStatus: ApprovalStatus.PENDING,
    } as any);
  }

  findAllForRequirement(materialRequirementId: string) {
    return this.model.findAll({
      where: { materialRequirementId },
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const board = await this.model.findByPk(id);
    if (!board) throw new NotFoundException(`Sample board ${id} not found`);
    return board;
  }

  async approve(id: string, dto: ApproveDto) {
    const board = await this.findOne(id);
    return board.update({
      approvalStatus: ApprovalStatus.APPROVED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
    });
  }

  async reject(id: string, dto: RejectDto) {
    const board = await this.findOne(id);
    return board.update({
      approvalStatus: ApprovalStatus.REJECTED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
      notes: dto.reason ?? board.notes,
    });
  }

  async remove(id: string) {
    const board = await this.findOne(id);
    await board.destroy();
    return { id, deleted: true };
  }
}
