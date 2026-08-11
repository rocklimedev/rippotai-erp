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
import { ClientsModule } from './modules/clients/clients.module';
import { BoqModule } from './modules/boqs/boq.module';
import { CdnModule } from './modules/cdn/cdn.module';
import { DocumentsModule } from './modules/documents/document.module';
import { DrawingsModule } from './modules/documents/drawing.module';
import { BriefModule } from './modules/brief/brief.module';
import { SiteRecceModule } from './modules/reki/reki.module';
import { TasksModule } from './modules/tasks/task.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DashboardsModule } from './modules/dashboard/dashboard.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SearchModule } from './modules/search/search.module';
import { TermsModule } from './modules/metas/terms.module';
import { AppsModule } from './modules/rbac/app.module';
import { ProcessModule } from './modules/process/process.module';
import { SiteInventoryItemsModule } from './modules/inventory/site-inventory-items.module';
import { SiteInventoryTransactionsModule } from './modules/inventory/site-inventory-transactions.module';
import { MaterialRateSheetsModule } from './modules/materials/material-rate-sheets.module';
import { MaterialRequirementsModule } from './modules/materials/material-requirements.module';
import { DeliveryChallansModule } from './modules/purchase-orders/delivery-challans.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { PurchaseOrderItemsModule } from './modules/purchase-orders/purchase-order-items.module';
import { EstimatesModule } from './modules/quotations/estimates.module';
import { ContractorLineupModule } from './modules/vendors/contractor-lineup.module';
import { SampleBoardsModule } from './modules/vendors/sample-boards.module';
import { VendorSiteMeasurementsModule } from './modules/vendors/vendor-site-measurements.module';
import { VendorTenderResponsesModule } from './modules/vendors/vendor-tender-responses.module';
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
    BriefModule,
    QuotationsModule,
    ClientsModule,
    BoqModule,
    CdnModule,
    DocumentsModule,
    DrawingsModule,
    BriefModule,
    SiteRecceModule,
    SearchModule,
    ProcessModule,
    SiteInventoryItemsModule,
    SiteInventoryTransactionsModule,
    MaterialRateSheetsModule,
    MaterialRequirementsModule,
    DeliveryChallansModule,
    PurchaseOrdersModule,
    PurchaseOrderItemsModule,
    EstimatesModule,
    ContractorLineupModule,
    SampleBoardsModule,
    VendorSiteMeasurementsModule,
    VendorTenderResponsesModule,
    AppsModule,
    TermsModule,
    TasksModule,
    CalendarModule,
    DashboardsModule,
    LeadsModule,
  ],
})
export class AppModule {}
