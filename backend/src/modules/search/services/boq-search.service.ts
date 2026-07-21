import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '@/modules/search/search.service';
import { Boq } from '../../boqs/models/boq.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { BoqCategory } from '../../boqs/models/boq-category.model';

@Injectable()
export class BoqSearchService {
  private readonly logger = new Logger(BoqSearchService.name);

  private readonly INDEX = 'boqs';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
  ) {}

  /**
   * Convert model to Elasticsearch document
   */
  private toDocument(boq: Boq) {
    return {
      id: boq.id,
      project_id: boq.project_id,
      title: boq.title,
      boq_number: boq.boq_number,
      status: boq.status,
      version: boq.version,

      client_name: boq.client_name,
      location: boq.location,
      prepared_by: boq.prepared_by,

      total_value: boq.total_value,
      misc_pct: boq.misc_pct,

      design_amount: boq.design_amount,
      execution_amount: boq.execution_amount,
      supervisor_amount: boq.supervisor_amount,
      additional_total: boq.additional_total,

      locked: boq.locked,

      project: boq.project?.name ?? '',

      created_by: boq.creator?.name ?? '',

      approved_by: boq.approver?.name ?? '',

      created_at: boq.created_at,
      updated_at: boq.updated_at,
    };
  }

  /**
   * Index one BOQ
   */
  async indexBoq(boqId: string) {
    const boq = await this.boqModel.findByPk(boqId, {
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: User,
          as: 'approver',
        },
        {
          model: BoqCategory,
          as: 'categories',
        },
      ],
    });

    if (!boq) {
      return;
    }

    await this.searchService.index(this.INDEX, boq.id, this.toDocument(boq));

    this.logger.log(`Indexed BOQ ${boq.id}`);
  }

  /**
   * Update index
   */
  async updateBoq(boqId: string) {
    return this.indexBoq(boqId);
  }

  /**
   * Delete from index
   */
  async removeBoq(boqId: string) {
    await this.searchService.delete(this.INDEX, boqId);

    this.logger.log(`Removed BOQ ${boqId}`);
  }

  /**
   * Search BOQs
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'title^5',
          'boq_number^4',
          'client_name^3',
          'location^2',
          'prepared_by',
          'project',
          'status',
        ],
      },
    });
  }

  /**
   * Reindex every BOQ
   */
  async reindexAll() {
    const boqs = await this.boqModel.findAll({
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: User,
          as: 'approver',
        },
      ],
    });

    for (const boq of boqs) {
      await this.searchService.index(this.INDEX, boq.id, this.toDocument(boq));
    }

    this.logger.log(`Indexed ${boqs.length} BOQs`);
  }
}
