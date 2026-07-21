import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Lead } from '../../leads/models/lead.model';
import { LeadNote } from '../../leads/models/lead-note.model';
import { LeadActivity } from '../../leads/models/lead-activity.model';

@Injectable()
export class LeadSearchService {
  private readonly logger = new Logger(LeadSearchService.name);

  private readonly INDEX = 'leads';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Lead)
    private readonly leadModel: typeof Lead,
  ) {}

  /**
   * Convert Lead model into Elasticsearch document
   */
  private toDocument(lead: Lead) {
    return {
      id: lead.id,

      name: lead.name,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,

      type: lead.type,
      stage: lead.stage,

      location: lead.location,
      size: lead.size,
      budget: lead.budget,
      timeline: lead.timeline,

      source: lead.source,
      owner: lead.owner,

      days: lead.days,
      stage_entered_at: lead.stageEnteredAt,

      tag: lead.tag,
      color: lead.color,

      follow_up: lead.followUp,

      proposal_amount: lead.proposalAmount,
      proposal_timeline: lead.proposalTimeline,
      proposal_remarks: lead.proposalRemarks,

      doc_brief: lead.docBrief,
      doc_proposal: lead.docProposal,
      doc_contract: lead.docContract,

      notes_count: lead.notes?.length ?? 0,
      activity_count: lead.activity?.length ?? 0,

      created_at: lead.createdAt,
      updated_at: lead.updatedAt,
    };
  }

  /**
   * Index one Lead
   */
  async indexLead(id: string) {
    const lead = await this.leadModel.findByPk(id, {
      include: [
        {
          model: LeadNote,
        },
        {
          model: LeadActivity,
        },
      ],
    });

    if (!lead) {
      return;
    }

    await this.searchService.index(this.INDEX, lead.id, this.toDocument(lead));

    this.logger.log(`Indexed Lead ${lead.id}`);
  }

  /**
   * Update Elasticsearch document
   */
  async updateLead(id: string) {
    return this.indexLead(id);
  }

  /**
   * Remove Lead from Elasticsearch
   */
  async removeLead(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Lead ${id}`);
  }

  /**
   * Search Leads
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'name^5',
          'phone^5',
          'whatsapp^5',
          'email^4',
          'location^3',
          'owner^3',
          'source^2',
          'budget^2',
          'timeline',
          'proposal_remarks',
          'stage',
          'type',
          'tag',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all Leads
   */
  async reindexAll() {
    const leads = await this.leadModel.findAll({
      include: [
        {
          model: LeadNote,
        },
        {
          model: LeadActivity,
        },
      ],
    });

    for (const lead of leads) {
      await this.searchService.index(
        this.INDEX,
        lead.id,
        this.toDocument(lead),
      );
    }

    this.logger.log(`Indexed ${leads.length} leads`);
  }
}
