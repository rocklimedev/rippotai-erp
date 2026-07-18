import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from './models/lead.model';
import { LeadNote } from './models/lead-note.model';
import { LeadActivity } from './models/lead-activity.model';

@Module({
  imports: [SequelizeModule.forFeature([Lead, LeadNote, LeadActivity])],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
