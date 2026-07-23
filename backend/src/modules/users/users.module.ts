import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SearchModule } from '../search/search.module'; // <-- ADD THIS

// Models
import { User } from './models/user.model';
import { UserSignature } from './models/user-signature.model';

// Services
import { UsersService } from './users.service';
import { UserSignaturesService } from './user-signature.service';
import { UserSearchService } from '../search/services/user-search.service';

// Controllers
import { UsersController } from './users.controller';
import { UserSignatureController } from './user-signature.controller';
import { CdnModule } from '../cdn/cdn.module';

@Module({
  imports: [SequelizeModule.forFeature([User, UserSignature]), CdnModule],
  controllers: [UsersController, UserSignatureController],
  providers: [UsersService, UserSignaturesService],
  exports: [UsersService],
})
export class UsersModule {}
