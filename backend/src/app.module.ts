import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from './config/database.config';
import { RolesModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ActivityLogsModule } from './modules/engagement/activity-logs.module';
import { NotificationsModule } from './modules/engagement/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UnitsModule } from './modules/metas/units.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<SequelizeModuleOptions>('database'),
    }),

    // ---- One module per table in the schema ----
    AuthModule,
    RolesModule,
    ActivityLogsModule,
    ReportsModule,
    UsersModule,
    UnitsModule,
    NotificationsModule,
    SettingsModule,
    ProjectsModule,
    VendorsModule,
    QuotationsModule,
  ],
})
export class AppModule {}
