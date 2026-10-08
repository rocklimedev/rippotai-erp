import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BusinessProposal } from './business-proposal.model';
import { BusinessProposalsController } from './business-proposals.controller';
@Module({
  imports: [SequelizeModule.forFeature([BusinessProposal])],
  controllers: [BusinessProposalsController],
})
export class BusinessProposalsModule {}
