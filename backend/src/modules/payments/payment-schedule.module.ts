import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentSchedule } from './models/payment-schedule.model';
import { PaymentScheduleMilestone } from './models/payment-schedule-milestone.model';
import { PaymentSchedulesService } from './payment-schedule.service';
import { PaymentSchedulesController } from './payment-schedule.controller';
import { ClientCollectionsController } from './collections/client-collections.controller';
import { ClientCollectionsService } from './collections/client-collections.service';
import { TermsTemplate } from '../metas/models/terms-templates.model';
import { TermsTemplateVersion } from '../metas/models/terms-template-version.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PaymentSchedule,
      PaymentScheduleMilestone,
      TermsTemplate,
      TermsTemplateVersion,
    ]),
  ],
  controllers: [PaymentSchedulesController, ClientCollectionsController],
  providers: [PaymentSchedulesService, ClientCollectionsService],
  exports: [PaymentSchedulesService, SequelizeModule],
})
export class PaymentSchedulesModule {}
