import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MaterialProcurementModule } from '../material-procurement/material-procurement.module';
import { Project } from '../projects/models/projects.model';
import { Vendor } from '../vendors/models/vendors.model';
import { VendorRateComparison } from '../material-procurement/models/vendor-rate-comparison.model';
import { MaterialMaster } from '../material-procurement/models/material-master.model';
import { PurchaseOrder } from '../material-procurement/models/purchase-order.model';
import { WorkOrder } from '../material-procurement/models/work-order.model';
import { Unit } from '../metas/models/unit.model';
import { ProcurementQuotation } from './models/procurement-quotation.model';
import { ProcurementQuotationItem } from './models/procurement-quotation-item.model';
import { ProcurementQuotationVersion } from './models/procurement-quotation-version.model';
import { ProcurementQuotationsController } from './procurement-quotations.controller';
import { ProcurementQuotationsService } from './procurement-quotations.service';

/**
 * Procurement Quotation: Vendor Comparison Sheet → finalised vendor →
 * Quotation (versioned, one live per project + vendor) → Raise PO / WO.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      ProcurementQuotation,
      ProcurementQuotationItem,
      ProcurementQuotationVersion,
      Project,
      Vendor,
      VendorRateComparison,
      MaterialMaster,
      PurchaseOrder,
      WorkOrder,
      Unit,
    ]),
    MaterialProcurementModule,
  ],
  controllers: [ProcurementQuotationsController],
  providers: [ProcurementQuotationsService],
  exports: [ProcurementQuotationsService],
})
export class ProcurementQuotationsModule {}
