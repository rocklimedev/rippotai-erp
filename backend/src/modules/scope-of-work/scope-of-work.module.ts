import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ScopeCategory } from './models/scope-category.model';
import { ProjectSpace } from './models/project-space.model';
import { ProjectScopeCategory } from './models/project-scope-category.model';
import { ScopeItem } from './models/scope-item.model';
import { ScopeOfWork } from './models/scope-of-work.model';
import { ScopeOfWorkController } from './scope-of-work.controller';
import { ScopeOfWorkService } from './scope-of-work.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ScopeCategory,
      ProjectSpace,
      ProjectScopeCategory,
      ScopeItem,
      ScopeOfWork,
    ]),
  ],

  controllers: [ScopeOfWorkController],

  providers: [ScopeOfWorkService],

  exports: [ScopeOfWorkService, SequelizeModule],
})
export class ScopeOfWorkModule {}
