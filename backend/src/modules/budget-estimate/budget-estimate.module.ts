import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BudgetEstimateController } from './budget-estimate.controller';
import { BudgetEstimateService } from './budget-estimate.service';

import { BudgetEstimate } from './models/budget-estimate.model';
import { BudgetEstimateCategory } from './models/budget-estimate-category.model';
import { BudgetEstimateItem } from './models/budget-estimate-item.model';
import { BudgetEstimateMiscellaneous } from './models/budget-estimate-miscellaneous.model';
import { BudgetEstimateVersion } from './models/budget-estimate-version.model';
import { Boq } from '../boqs/models/boq.model';
import { BoqItem } from '../boqs/models/boq-item.model';
import { BoqTemplate } from '../boqs/models/boq-template.model';
import { LibraryItem } from '../boqs/models/library-item.model';
import { LibraryCategory } from '../boqs/models/library-category.model';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

import { Unit } from '@/modules/metas/models/unit.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      // Budget Estimate
      BudgetEstimate,
      BudgetEstimateCategory,
      BudgetEstimateItem,
      BudgetEstimateMiscellaneous,
      BudgetEstimateVersion,

      // BOQ
      Boq,
      BoqItem,
      BoqTemplate,

      // Library
      LibraryItem,
      LibraryCategory,

      // Project / User
      Project,
      User,

      // Meta
      Unit,
      TermsTemplate,
    ]),
  ],

  controllers: [BudgetEstimateController],

  providers: [BudgetEstimateService],

  exports: [BudgetEstimateService],
})
export class BudgetEstimateModule {}
