import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class UserSearchService {
  private readonly logger = new Logger(UserSearchService.name);
  private readonly INDEX = 'users';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  private toDocument(user: any): SearchableDocument {
    const roleName = user.role?.name ?? '';
    const title = user.name ?? user.email ?? 'Untitled User';
    const subtitle = [roleName, user.job_title, user.email]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'user',
      id: user.id,
      title,
      subtitle,
      status: user.is_active ? 'active' : 'inactive',
      searchable_text: [
        user.name,
        user.email,
        user.phone,
        user.job_title,
        roleName,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: user.created_at ?? user.createdAt,
      updated_at: user.updated_at ?? user.updatedAt,
      visibility: 'internal',
      is_deleted: !user.is_active,

      email: user.email,
      phone: user.phone,
      job_title: user.job_title,
      role_name: roleName,
      is_active: !!user.is_active,
    };
  }

  async indexOne(id: string): Promise<void> {
    const user = await this.userModel.findByPk(id, {
      include: [{ association: 'role', required: false }],
    });
    if (!user) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      user.id,
      this.toDocument(user),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.userModel.findAll({
      include: [{ association: 'role', required: false }],
    });
    const items = rows.map((u) => ({
      index: this.INDEX,
      id: u.id,
      document: this.toDocument(u),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed users: ${result.indexed}/${result.total}`);
    return result;
  }

  async search(query: string, size = 20) {
    if (!query?.trim()) return [];
    const response = await this.searchService.search(this.INDEX, {
      size,
      query: {
        multi_match: {
          query: query.trim(),
          fields: [
            'title^5',
            'email^4',
            'phone^3',
            'job_title^3',
            'role_name^2',
            'searchable_text',
          ],
          fuzziness: 'AUTO',
        },
      },
    });
    return (response.hits?.hits ?? []).map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...(hit._source as object),
    }));
  }
}
