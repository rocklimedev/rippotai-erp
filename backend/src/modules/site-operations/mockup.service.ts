import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Mockup } from './models/mockup.model';
import { ProposeMockupDto, ReviewMockupDto } from './dto/mockup.dto';
import { MockupStatus } from '../../common/enums/site-operations.enums';

@Injectable()
export class MockupService {
  constructor(@InjectModel(Mockup) private mockupModel: typeof Mockup) {}

  async propose(dto: ProposeMockupDto): Promise<Mockup> {
    return this.mockupModel.create({
      projectId: dto.projectId,
      stepId: dto.stepId ?? null,
      name: dto.name,
      finishType: dto.finishType ?? null,
      location: dto.location ?? null,
      description: dto.description ?? null,
      referenceImageUrls: dto.referenceImageUrls ?? null,
      proposedBy: dto.proposedBy,
      proposedAt: dto.proposedAt ? new Date(dto.proposedAt) : new Date(),
      status: MockupStatus.PROPOSED,
    } as any);
  }

  /** Moves a mockup through review to APPROVED or REJECTED. APPROVED clears it for volume rollout. */
  async review(id: number, dto: ReviewMockupDto): Promise<Mockup> {
    const mockup = await this.getOrThrow(id);
    if (
      mockup.status === MockupStatus.APPROVED ||
      mockup.status === MockupStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Mockup is already ${mockup.status} and cannot be re-reviewed`,
      );
    }

    await mockup.update({
      status: dto.status,
      reviewedBy: dto.reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: dto.reviewNotes ?? null,
      clearedForRollout: dto.status === MockupStatus.APPROVED,
    } as any);
    return mockup;
  }

  async getOrThrow(id: number): Promise<Mockup> {
    const mockup = await this.mockupModel.findByPk(id);
    if (!mockup) throw new NotFoundException(`Mockup ${id} not found`);
    return mockup;
  }

  async listForProject(
    projectId: number,
    status?: MockupStatus,
  ): Promise<Mockup[]> {
    const where: any = { projectId };
    if (status) where.status = status;
    return this.mockupModel.findAll({ where, order: [['proposedAt', 'DESC']] });
  }
}
