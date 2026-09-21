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
  InventoryTransaction,
  MaterialMaster,
} from './models';

import { MaterialRequirementService } from './services/material-requirement.service';
import { SampleBoardService } from './services/sample-board.service';
import { MaterialRateSheetService } from './services/material-rate-sheet.service';
import { MaterialEstimateService } from './services/material-estimate.service';
import { MaterialQuotationService } from './services/material-quotation.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { DeliveryChallanService } from './services/delivery-challan.service';
import { InventoryService } from './services/inventory.service';
import { MaterialMasterService } from './services/material-master.service';

import { MaterialRequirementController } from './controllers/material-requirement.controller';
import { SampleBoardController } from './controllers/sample-board.controller';
import { MaterialRateSheetController } from './controllers/material-rate-sheet.controller';
import { MaterialEstimateController } from './controllers/material-estimate.controller';
import { MaterialQuotationController } from './controllers/material-quotation.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { DeliveryChallanController } from './controllers/delivery-challan.controller';
import { MaterialMasterController } from './controllers/material-master.controller';
import { Vendor } from '../vendors/models/vendors.model';
import { Unit } from '../metas/models/unit.model';
import { MaterialVendor } from './models/material-vendor.model';
import { WorkOrdersController } from './controllers/work-orders.controller';
import { WorkOrdersService } from './services/work-orders.service';

import { WorkOrder } from './models/work-order.model';
import { WorkOrderItem } from './models/work-order-item.model';
import { WorkOrderPaymentStage } from './models/work-order-payment-stage.model';
import { WorkOrderTerm } from './models/work-order-term.model';
import { Project } from '../projects/models/projects.model';
import { TermsTemplate } from '../metas/models/terms-templates.model';
import { Quotation } from '../quotations/models/quotations.model';

/**
 * Material & Procurement module — Sequelize (MySQL) edition.
 *
 * Covers the full lifecycle described by the spec:
 *  1. Material requirements captured from the design team.
 *  2. Sourcing & sample boards / rate sheets, each with approval status.
 *  3. Material estimate → approval → quotation.
 *  4. Purchase orders issued against approved quotations, with
 *     line-item ordered-vs-delivered tracking.
 *  5. Staged deliveries: delivery challans logged against a PO and
 *     tagged to the site stage that needs them.
 *  6. Site inventory register: live stock with inward / outward /
 *     adjustment / damage transactions, reconciled against POs.
 *  7. Material Master: centralized catalogue of materials with
 *     vendor, category, specification, unit and HSN information.
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

      // Material Master
      MaterialMaster,
      Vendor,
      Unit,
      Project,
      MaterialVendor,
      // Inventory
      InventoryTransaction,
      WorkOrder,
      WorkOrderItem,
      WorkOrderPaymentStage,
      WorkOrderTerm,
      Quotation,
      TermsTemplate,
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
    WorkOrdersController,

    // Material Master
    MaterialMasterController,
  ],

  providers: [
    MaterialRequirementService,
    SampleBoardService,
    MaterialRateSheetService,
    MaterialEstimateService,
    WorkOrdersService,
    MaterialQuotationService,
    DeliveryChallanService,
    PurchaseOrderService,
    InventoryService,

    // Material Master
    MaterialMasterService,
  ],

  exports: [
    MaterialRequirementService,
    SampleBoardService,
    MaterialRateSheetService,
    MaterialEstimateService,
    DeliveryChallanService,
    MaterialQuotationService,
    WorkOrdersService,
    InventoryService,
    PurchaseOrderService,

    // Material Master
    MaterialMasterService,
  ],
})
export class MaterialProcurementModule {}
