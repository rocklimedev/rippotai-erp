import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { User } from './models/user.model';
import { UserSignature } from './models/user-signature.model';

// Services
import { UsersService } from './users.service';
import { UserSignaturesService } from './user-signature.service';

// Controllers
import { UsersController } from './users.controller';
import { UserSignatureController } from './user-signature.controller';

// Modules
import { CdnModule } from '../cdn/cdn.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserSignature]),
    CdnModule,

    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [UsersController, UserSignatureController],
  providers: [UsersService, UserSignaturesService],
  exports: [UsersService],
})
export class UsersModule {}
