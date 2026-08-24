import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ProjectBriefsController } from './brief.controller';
import { ProjectBriefsService } from './brief.service';

import { ProjectBrief } from './models/project-brief.model';
import { ProjectBriefDocument } from './models/project-brief-document.model';
import { ProjectBriefWorkType } from './models/project-brief-work-type.model';
import { ProjectBriefService } from './models/project-brief-service.model';
import { ProjectBriefProcurementCategory } from './models/project-brief-procurement-category.model';
import { ProjectBriefSpaceRequirement } from './models/project-brief-space-requirement.model';
import { ProjectBriefStyleDirection } from './models/project-brief-style-direction.model';
import { ProjectBriefReference } from './models/project-bref-reference.model';
import { ProjectBriefPhase } from './models/project-bref-phase.model';
import { ProjectBriefOccupant } from './models/project-brief-occupant.model';
import { ProjectBriefAttachment } from './models/project-brief-attachment.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProjectBrief,
      ProjectBriefDocument,
      ProjectBriefWorkType,
      ProjectBriefService,
      ProjectBriefProcurementCategory,
      ProjectBriefSpaceRequirement,
      ProjectBriefStyleDirection,
      ProjectBriefReference,
      ProjectBriefPhase,
      ProjectBriefOccupant,
      ProjectBriefAttachment,
    ]),
  ],

  controllers: [ProjectBriefsController],

  providers: [ProjectBriefsService],

  exports: [ProjectBriefsService],
})
export class ProjectBriefsModule {}
