// modules/apps/apps.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { App } from './models/app.model';
import { CreateAppDto, UpdateAppDto } from './dto/app.dto';
@Injectable()
export class AppsService {
  constructor(
    @InjectModel(App)
    private readonly appRepository: typeof App,
  ) {}

  async create(createAppDto: CreateAppDto): Promise<App> {
    const exists = await this.appRepository.findByPk(createAppDto.code);

    if (exists) {
      throw new ConflictException('App already exists');
    }

    return this.appRepository.create(createAppDto as any);
  }

  async findAll(): Promise<App[]> {
    return this.appRepository.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(code: string): Promise<App> {
    const app = await this.appRepository.findByPk(code);

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  async update(code: string, updateAppDto: UpdateAppDto): Promise<App> {
    const app = await this.findOne(code);

    await app.update(updateAppDto);

    return app;
  }

  async remove(code: string): Promise<void> {
    const app = await this.findOne(code);

    await app.destroy();
  }
}
