import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Client } from './models/client.model';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
  ) {}

  async create(dto: CreateClientDto): Promise<Client> {
    const existing = await this.clientModel.findOne({
      where: { slug: dto.slug },
      paranoid: false, // catch soft-deleted rows too, slug is unique
    });
    if (existing) {
      throw new ConflictException(
        `Client with slug "${dto.slug}" already exists`,
      );
    }
    return this.clientModel.create({ ...dto } as any);
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
   * Lightweight existence check for other services (e.g. ProjectsService)
   * to validate a client_id before attaching it, without throwing.
   */
  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const count = await this.clientModel.count({ where: { id } });
    return count > 0;
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    await client.update({ ...dto });
    return client;
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await client.destroy(); // soft delete (paranoid: true on model)
  }

  async restore(id: string): Promise<Client> {
    const client = await this.findOne(id, true);
    await client.restore();
    return client;
  }
}
