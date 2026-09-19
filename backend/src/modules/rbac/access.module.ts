import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_GUARD } from '@nestjs/core';
import { AccessService } from './access.service';
import { AccessRuleModel } from './models/access-rule.model';
import { AccessController } from './access.controller';
import { BackendAccessGuard } from './backend-access.guard';
import { ProjectScopeService } from './project-scope.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([AccessRuleModel])],
  controllers: [AccessController],
  providers: [AccessService, ProjectScopeService, { provide: APP_GUARD, useClass: BackendAccessGuard }],
  exports: [AccessService],
})
export class AccessModule {}
