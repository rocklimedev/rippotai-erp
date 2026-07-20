import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Client } from './models/client.model';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { NotificationClientService } from '../engagement/services/notification-client.service';
@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    private readonly notificationClientService: NotificationClientService,
  ) {}

  async create(
    dto: CreateClientDto,
    recipientUserIds: string[] = [],
  ): Promise<Client> {
    const existing = await this.clientModel.findOne({
      where: { slug: dto.slug },
      paranoid: false,
    });
    if (existing) {
      throw new ConflictException(
        `Client with slug "${dto.slug}" already exists`,
      );
    }

    const client = await this.clientModel.create({ ...dto } as any);

    await this.notificationClientService.notifyClientCreated(client, {
      recipientUserIds,
    });

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

  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const count = await this.clientModel.count({ where: { id } });
    return count > 0;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    recipientUserIds: string[] = [],
  ): Promise<Client> {
    const client = await this.findOne(id);
    await client.update({ ...dto });

    await this.notificationClientService.notifyClientUpdated(client, {
      recipientUserIds,
    });

    return client;
  }

  async remove(id: string, recipientUserIds: string[] = []): Promise<void> {
    const client = await this.findOne(id);
    await client.destroy();

    await this.notificationClientService.notifyClientDeleted(client, {
      recipientUserIds,
    });
  }

  async restore(id: string, recipientUserIds: string[] = []): Promise<Client> {
    const client = await this.findOne(id, true);
    await client.restore();

    await this.notificationClientService.notifyClientRestored(client, {
      recipientUserIds,
    });

    return client;
  }
}
