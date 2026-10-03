import { Module } from '@nestjs/common';
import { NotificationsModule } from '../engagement/notifications.module';
import { CdnModule } from '../cdn/cdn.module';
import { ClientPortalController, PublicClientController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';

@Module({
  imports: [NotificationsModule, CdnModule],
  controllers: [ClientPortalController, PublicClientController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
