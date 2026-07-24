import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { TermsTemplate } from './models/terms-templates.model';
import { TermsTemplateVersion } from './models/terms-template-version.model';
import { CreateTermsTemplateDto } from './dto/create-terms-template.dto';
import {
  UpdateTermsTemplateDto,
  UpdateTermsTemplateContentDto,
} from './dto/update-terms-template.dto';
import { TermsScope } from '@/common/enums/terms.enums';

export interface TermsSnapshot {
  terms_template_id: string;
  terms_template_version: number;
  content_html: string;
}

@Injectable()
export class TermsService {
  constructor(
    @InjectModel(TermsTemplate)
    private readonly templateModel: typeof TermsTemplate,
    @InjectModel(TermsTemplateVersion)
    private readonly versionModel: typeof TermsTemplateVersion,
    private readonly sequelize: Sequelize,
  ) {}

  async findAll(scope?: TermsScope) {
    return this.templateModel.findAll({
      where: scope ? { scope, is_active: true } : { is_active: true },
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('Terms template not found');
    return template;
  }

  async create(dto: CreateTermsTemplateDto, actorId?: string) {
    return this.sequelize.transaction(async (t: Transaction) => {
      const template = await this.templateModel.create(
        {
          name: dto.name,
          scope: dto.scope,
          content_html: dto.content_html,
          is_default: dto.is_default ?? false,
          current_version: 1,
          created_by: actorId ?? null,
        } as TermsTemplate,
        { transaction: t },
      );

      await this.versionModel.create(
        {
          terms_template_id: template.id,
          version: 1,
          content_html: dto.content_html,
          created_by: actorId ?? null,
        } as TermsTemplateVersion,
        { transaction: t },
      );

      return template;
    });
  }

  async update(id: string, dto: UpdateTermsTemplateDto) {
    const template = await this.findOne(id);
    await template.update(dto);
    return template;
  }

  /**
   * Editing the wording appends a new immutable version instead of
   * mutating the current one, so documents that already snapshotted an
   * earlier version keep rendering their original terms unchanged.
   */
  async updateContent(
    id: string,
    dto: UpdateTermsTemplateContentDto,
    actorId?: string,
  ) {
    const template = await this.findOne(id);

    return this.sequelize.transaction(async (t: Transaction) => {
      const nextVersion = template.current_version + 1;

      await this.versionModel.create(
        {
          terms_template_id: template.id,
          version: nextVersion,
          content_html: dto.content_html,
          change_note: dto.change_note ?? null,
          created_by: actorId ?? null,
        } as TermsTemplateVersion,
        { transaction: t },
      );

      await template.update(
        {
          content_html: dto.content_html,
          current_version: nextVersion,
          updated_by: actorId ?? null,
        },
        { transaction: t },
      );

      return template;
    });
  }

  async getVersions(id: string) {
    await this.findOne(id);
    return this.versionModel.findAll({
      where: { terms_template_id: id },
      order: [['version', 'DESC']],
    });
  }

  async remove(id: string) {
    const template = await this.findOne(id);
    await template.destroy();
    return { id, deleted: true };
  }

  /**
   * Resolves a template (optionally pinned to a specific version) into
   * the content a consuming document should snapshot. Consumers (Boq,
   * Invoice, ...) copy the returned content_html into their own
   * snapshot column plus the template id/version reference themselves —
   * this service never writes to another module's tables, which is
   * what keeps TermsModule free of a circular dependency on BoqModule.
   */
  async resolveSnapshot(
    templateId: string,
    version?: number,
  ): Promise<TermsSnapshot> {
    const template = await this.findOne(templateId);

    if (version === undefined || version === template.current_version) {
      return {
        terms_template_id: template.id,
        terms_template_version: template.current_version,
        content_html: template.content_html,
      };
    }

    const versionRow = await this.versionModel.findOne({
      where: { terms_template_id: templateId, version },
    });
    if (!versionRow) {
      throw new BadRequestException(
        `Version ${version} not found for this terms template`,
      );
    }

    return {
      terms_template_id: template.id,
      terms_template_version: versionRow.version,
      content_html: versionRow.content_html,
    };
  }
}
