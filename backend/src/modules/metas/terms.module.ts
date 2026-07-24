import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TermsTemplate } from './models/terms-templates.model';
import { TermsTemplateVersion } from './models/terms-template-version.model';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';

@Module({
  imports: [SequelizeModule.forFeature([TermsTemplate, TermsTemplateVersion])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService, SequelizeModule],
})
export class TermsModule {}
