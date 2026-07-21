import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { User } from '../../users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';

@Injectable()
export class UserSearchService {
  private readonly logger = new Logger(UserSearchService.name);

  private readonly INDEX = 'users';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /**
   * Convert User model into Elasticsearch document
   */
  private toDocument(user: User) {
    return {
      id: user.id,

      name: user.name,
      email: user.email,
      phone: user.phone,
      job_title: user.job_title,

      role: user.role?.name ?? '',

      is_active: user.is_active,

      last_login_at: user.last_login_at,

      created_by: user.creator?.name ?? '',

      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  /**
   * Index one user
   */
  async indexUser(id: string) {
    const user = await this.userModel.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    if (!user) {
      return;
    }

    await this.searchService.index(this.INDEX, user.id, this.toDocument(user));

    this.logger.log(`Indexed User ${user.id}`);
  }

  /**
   * Update user index
   */
  async updateUser(id: string) {
    return this.indexUser(id);
  }

  /**
   * Remove user from Elasticsearch
   */
  async removeUser(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed User ${id}`);
  }

  /**
   * Search users
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'name^6',
          'email^5',
          'phone^4',
          'job_title^4',
          'role^3',
          'created_by',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all users
   */
  async reindexAll() {
    const users = await this.userModel.findAll({
      include: [
        {
          model: Role,
          as: 'role',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    for (const user of users) {
      await this.searchService.index(
        this.INDEX,
        user.id,
        this.toDocument(user),
      );
    }

    this.logger.log(`Indexed ${users.length} users`);
  }
}
