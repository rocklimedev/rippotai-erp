import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Setting } from './models/settings.model';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting)
    private readonly settingModel: typeof Setting,
  ) {}

  async create(dto: CreateSettingDto): Promise<Setting> {
    try {
      return await this.settingModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`Setting "${dto.key}" already exists`);
      }
      throw err;
    }
  }

  findAll(): Promise<Setting[]> {
    return this.settingModel.findAll({ order: [['key', 'ASC']] });
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingModel.findOne({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async update(key: string, dto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(key);
    await setting.update({ ...dto });
    return setting;
  }

  /** Create-or-update in a single call, useful for app bootstrapping/seeding. */
  async upsert(
    key: string,
    value: Record<string, any>,
    updated_by?: string,
  ): Promise<Setting> {
    const [setting] = await this.settingModel.upsert(
      { key, value, updated_by } as any,
      { returning: true },
    );
    return setting;
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await setting.destroy();
  }
}
