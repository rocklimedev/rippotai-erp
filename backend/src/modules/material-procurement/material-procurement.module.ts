import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import {
  MaterialRequirement,
  SampleBoard,
  MaterialRateSheet,
  MaterialEstimate,
  MaterialQuotation,
  PurchaseOrder,
  PurchaseOrderItem,
  DeliveryChallan,
  DeliveryChallanItem,
  SiteInventory,
  InventoryTransaction,
} from './models';

import { MaterialRequirementService } from './services/material-requirement.service';
import { SampleBoardService } from './services/sample-board.service';
import { MaterialRateSheetService } from './services/material-rate-sheet.service';
import { MaterialEstimateService } from './services/material-estimate.service';
import { MaterialQuotationService } from './services/material-quotation.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { DeliveryChallanService } from './services/delivery-challan.service';
import { SiteInventoryService } from './services/site-inventory.service';

import { MaterialRequirementController } from './controllers/material-requirement.controller';
import { SampleBoardController } from './controllers/sample-board.controller';
import { MaterialRateSheetController } from './controllers/material-rate-sheet.controller';
import { MaterialEstimateController } from './controllers/material-estimate.controller';
import { MaterialQuotationController } from './controllers/material-quotation.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { DeliveryChallanController } from './controllers/delivery-challan.controller';
import { SiteInventoryController } from './controllers/site-inventory.controller';

/**
 * Material & Procurement module — Sequelize (MySQL) edition.
 *
 * Covers the full lifecycle described by the spec:
 *  1. Material requirements captured from the design team.
 *  2. Sourcing & sample boards / rate sheets, each with approval status.
 *  3. Material estimate → approval → quotation (identical rule to trades).
 *  4. Purchase orders issued against approved quotations, with
 *     line-item ordered-vs-delivered tracking.
 *  5. Staged deliveries: delivery challans logged against a PO and
 *     tagged to the site stage that needs them.
 *  6. Site inventory register: live stock with inward / outward /
 *     adjustment / damage transactions, reconciled against POs.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      MaterialRequirement,
      SampleBoard,
      MaterialRateSheet,
      MaterialEstimate,
      MaterialQuotation,
      PurchaseOrder,
      PurchaseOrderItem,
      DeliveryChallan,
      DeliveryChallanItem,
      SiteInventory,
      InventoryTransaction,
    ]),
  ],
  controllers: [
    MaterialRequirementController,
    SampleBoardController,
    MaterialRateSheetController,
    MaterialEstimateController,
    MaterialQuotationController,
    PurchaseOrderController,
    DeliveryChallanController,
    SiteInventoryController,
  ],
  providers: [
    MaterialRequirementService,
    SampleBoardService,
    MaterialRateSheetService,
    MaterialEstimateService,
    MaterialQuotationService,
    PurchaseOrderService,
    DeliveryChallanService,
    SiteInventoryService,
  ],
  exports: [
    MaterialRequirementService,
    SampleBoardService,
    MaterialRateSheetService,
    MaterialEstimateService,
    MaterialQuotationService,
    PurchaseOrderService,
    DeliveryChallanService,
    SiteInventoryService,
  ],
})
export class MaterialProcurementModule {}
