import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SiteMockup } from './models/site-mockup.model';
import { CreateSiteMockupDto } from './dto/create-site-mockup.dto';
import { UpdateSiteMockupDto } from './dto/update-site-mockup.dto';

@Injectable()
export class SiteMockupsService {
  constructor(
    @InjectModel(SiteMockup)
    private readonly mockupModel: typeof SiteMockup,
  ) {}

  async create(dto: CreateSiteMockupDto): Promise<SiteMockup> {
    return this.mockupModel.create({
      ...dto,
      reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : null,
    });
  }

  async findAll(projectId?: string): Promise<SiteMockup[]> {
    return this.mockupModel.findAll({
      where: projectId ? { projectId } : undefined,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<SiteMockup> {
    const mockup = await this.mockupModel.findByPk(id);

    if (!mockup) {
      throw new NotFoundException(`Site mockup ${id} not found`);
    }

    return mockup;
  }

  async update(id: string, dto: UpdateSiteMockupDto): Promise<SiteMockup> {
    const mockup = await this.findOne(id);

    return mockup.update({
      ...dto,
      reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : null,
    });
  }

  async remove(id: string): Promise<void> {
    const mockup = await this.findOne(id);
    await mockup.destroy();
  }
}
