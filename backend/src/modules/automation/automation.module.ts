import { Module } from '@nestjs/common';
import { NotificationsModule } from '../engagement/notifications.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEngineService } from './automation-engine.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationEngineService],
  exports: [AutomationEngineService],
})
export class AutomationModule {}
