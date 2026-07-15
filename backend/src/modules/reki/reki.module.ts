import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SiteReki } from './models/site-reki.model';
import { SiteRekiAttachment } from './models/site-attachment.model';
import { RekiController } from './reki.controller';
import { RekiService } from './reki.service';

@Module({
  imports: [SequelizeModule.forFeature([SiteReki, SiteRekiAttachment])],
  controllers: [RekiController],
  providers: [RekiService],
  exports: [RekiService],
})
export class RekiModule {}
