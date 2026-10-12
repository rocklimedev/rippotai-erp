import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from '../projects/models/projects.model';
import { BudgetGuide } from './models/budget-guide.model';
import { BudgetGuideController } from './budget-guide.controller';
import { BudgetGuideService } from './budget-guide.service';

@Module({
  imports: [SequelizeModule.forFeature([BudgetGuide, Project])],
  controllers: [BudgetGuideController],
  providers: [BudgetGuideService],
  exports: [BudgetGuideService],
})
export class BudgetGuideModule {}
