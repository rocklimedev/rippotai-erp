import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Client } from './models/client.model';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import slugify from 'slugify';
import { ActivityLogForClientService } from '../engagement/services/activity-log-client.service';
import { NotificationForClientService } from '../engagement/services/notification-client.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,

    private readonly activityLogService: ActivityLogForClientService,
    private readonly notificationService: NotificationForClientService,
  ) {}

  async create(dto: CreateClientDto, user?: any): Promise<Client> {
    const slug =
      dto.slug?.trim() || slugify(dto.name, { lower: true, strict: true });

    const existing = await this.clientModel.findOne({
      where: { slug },
      paranoid: false,
    });

    if (existing) {
      throw new ConflictException(`Client with slug "${slug}" already exists`);
    }

    const client = await this.clientModel.create({ ...dto, slug } as any);

    // === Activity Log + Notification ===
    await this.activityLogService.logClientCreated(client, user);
    await this.notificationService.notifyClientCreated(client, user?.id);

    return client;
  }

  findAll(filters: { includeDeleted?: boolean } = {}) {
    return this.clientModel.findAll({
      paranoid: !filters.includeDeleted,
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string, includeDeleted = false): Promise<Client> {
    const client = await this.clientModel.findByPk(id, {
      paranoid: !includeDeleted,
    });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  /**
   * Lightweight existence check
   */
  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const count = await this.clientModel.count({ where: { id } });
    return count > 0;
  }

  async update(id: string, dto: UpdateClientDto, user?: any): Promise<Client> {
    const client = await this.findOne(id);
    await client.update({ ...dto });

    // === Activity Log + Notification ===
    await this.activityLogService.logClientUpdated(client, user);
    await this.notificationService.notifyClientUpdated(client, user?.id);

    return client;
  }

  async remove(id: string, user?: any): Promise<void> {
    const client = await this.findOne(id);
    const clientName = client.name;

    await client.destroy(); // soft delete

    // === Activity Log + Notification ===
    await this.activityLogService.logClientDeleted(clientName, id, user);
    await this.notificationService.notifyClientDeleted(clientName, user?.id);
  }

  async restore(id: string, user?: any): Promise<Client> {
    const client = await this.findOne(id, true);
    await client.restore();

    // === Activity Log + Notification ===
    await this.activityLogService.logClientRestored(client, user);
    await this.notificationService.notifyClientRestored(client, user?.id);

    return client;
  }
}
