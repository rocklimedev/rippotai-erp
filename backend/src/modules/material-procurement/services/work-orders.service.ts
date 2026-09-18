import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { WorkOrder } from '../models/work-order.model';

import {
  WorkOrderItem,
  WorkOrderItemCreationAttributes,
} from '../models/work-order-item.model';

import {
  WorkOrderPaymentStage,
  WorkOrderPaymentStageCreationAttributes,
} from '../models/work-order-payment-stage.model';

import {
  WorkOrderTerm,
  WorkOrderTermCreationAttributes,
} from '../models/work-order-term.model';

import { Vendor } from '@/modules/vendors/models/vendors.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Unit } from '@/modules/metas/models/unit.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';

import {
  WorkOrderItemType,
  WorkOrderPaymentStageStatus,
  WorkOrderStatus,
} from '@/common/enums/work-order.enums';

import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder)
    private readonly workOrderModel: typeof WorkOrder,

    @InjectModel(WorkOrderItem)
    private readonly workOrderItemModel: typeof WorkOrderItem,

    @InjectModel(WorkOrderPaymentStage)
    private readonly paymentStageModel: typeof WorkOrderPaymentStage,

    @InjectModel(WorkOrderTerm)
    private readonly termModel: typeof WorkOrderTerm,

    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(Unit)
    private readonly unitModel: typeof Unit,

    @InjectModel(TermsTemplate)
    private readonly termsTemplateModel: typeof TermsTemplate,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateWorkOrderDto, userId?: string) {
    // ------------------------------------------------------------
    // VALIDATE VENDOR + PROJECT
    // ------------------------------------------------------------

    const [vendor, project] = await Promise.all([
      this.vendorModel.findByPk(dto.vendor_id),
      this.projectModel.findByPk(dto.project_id),
    ]);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!dto.items?.length) {
      throw new BadRequestException('At least one work order item is required');
    }

    // ------------------------------------------------------------
    // VALIDATE UNITS
    // ------------------------------------------------------------

    const unitIds = [
      ...new Set(dto.items.map((item) => item.unit_id).filter(Boolean)),
    ];

    if (!unitIds.length) {
      throw new BadRequestException(
        'Unit is required for every work order item',
      );
    }

    const units = await this.unitModel.findAll({
      where: {
        id: {
          [Op.in]: unitIds,
        },
        is_active: true,
      },
    });

    const existingUnitIds = new Set(units.map((unit) => unit.id));

    for (const unitId of unitIds) {
      if (!existingUnitIds.has(unitId)) {
        throw new NotFoundException(`Unit not found or inactive: ${unitId}`);
      }
    }

    // ------------------------------------------------------------
    // VALIDATE TERMS TEMPLATE
    // ------------------------------------------------------------

    if (dto.terms_template_id) {
      const template = await this.termsTemplateModel.findByPk(
        dto.terms_template_id,
      );

      if (!template) {
        throw new NotFoundException('Terms template not found');
      }

      if (!template.is_active) {
        throw new BadRequestException('Selected terms template is inactive');
      }
    }

    const woId = await this.generateWoId();

    // ------------------------------------------------------------
    // ITEMS
    // ------------------------------------------------------------

    const items: WorkOrderItemCreationAttributes[] = dto.items.map(
      (item, index) => {
        const quantity = Number(item.quantity ?? 0);
        const rate = Number(item.rate ?? 0);

        return {
          work_order_id: '',
          sort_order: item.sort_order ?? index + 1,
          item_type: item.item_type ?? WorkOrderItemType.SERVICE,
          description: item.description,
          quantity,
          unit_id: item.unit_id,
          rate,
          amount: this.calculateItemAmount(quantity, rate),
          remarks: item.remarks ?? null,
        };
      },
    );

    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

    // ------------------------------------------------------------
    // COMMERCIAL CALCULATION
    // ------------------------------------------------------------

    const discount = Number(dto.discount ?? 0);

    const taxableAmount = Math.max(subtotal - discount, 0);

    const gstPercentage = Number(dto.gst_percentage ?? 0);

    const gstAmount = taxableAmount * (gstPercentage / 100);

    const cartage = Number(dto.cartage ?? 0);

    const totalAmount = taxableAmount + gstAmount + cartage;

    // ------------------------------------------------------------
    // WORK ORDER
    // ------------------------------------------------------------

    const workOrder = await this.workOrderModel.create({
      wo_id: woId,

      project_id: project.id,
      vendor_id: vendor.id,

      work_order_date: dto.work_order_date,
      target_completion_date: dto.target_completion_date ?? null,

      status: WorkOrderStatus.DRAFT,

      // ----------------------------------------------------------
      // VENDOR SNAPSHOT
      // ----------------------------------------------------------

      contractor_name: vendor.name,
      contractor_company_name: vendor.company_name,
      contractor_position: vendor.position,
      contractor_phone: vendor.contact_number,
      contractor_email: null,
      contractor_address: vendor.address,
      contractor_gstin: null,
      contractor_pan: null,

      // ----------------------------------------------------------
      // PROJECT / SITE SNAPSHOT
      // ----------------------------------------------------------

      agency: dto.agency ?? null,
      project_name: project.name,

      site_address: dto.site_address ?? project.site_location,

      site_contact_person: dto.site_contact_person ?? null,

      site_lead: dto.site_lead ?? null,
      site_phone: dto.site_phone ?? null,
      site_email: dto.site_email ?? null,
      site_gstin: dto.site_gstin ?? null,
      working_hours: dto.working_hours ?? null,

      // ----------------------------------------------------------
      // COMMERCIAL
      // ----------------------------------------------------------

      subtotal,
      discount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      cartage,
      total_amount: totalAmount,

      payment_terms: dto.payment_terms ?? null,

      created_by: userId ?? null,
      updated_by: userId ?? null,
    } as any);

    // ------------------------------------------------------------
    // CREATE ITEMS
    // ------------------------------------------------------------

    const itemRows: WorkOrderItemCreationAttributes[] = items.map((item) => ({
      ...item,
      work_order_id: workOrder.id,
    }));

    await this.workOrderItemModel.bulkCreate(itemRows);

    // ------------------------------------------------------------
    // PAYMENT STAGES
    // ------------------------------------------------------------

    if (dto.payment_stages?.length) {
      const paymentStages: WorkOrderPaymentStageCreationAttributes[] =
        dto.payment_stages.map((stage, index) => ({
          work_order_id: workOrder.id,

          sort_order: stage.sort_order ?? index + 1,

          stage_name: stage.stage_name,

          due_date: stage.due_date ? new Date(stage.due_date) : null,

          amount: Number(stage.amount),

          paid_amount: 0,

          status: WorkOrderPaymentStageStatus.PENDING,

          remarks: stage.remarks ?? null,
        }));

      await this.paymentStageModel.bulkCreate(paymentStages);
    }

    // ------------------------------------------------------------
    // TERMS & CONDITIONS
    // ------------------------------------------------------------

    if (dto.terms_template_id) {
      const template = await this.termsTemplateModel.findByPk(
        dto.terms_template_id,
      );

      if (!template) {
        throw new NotFoundException('Terms template not found');
      }

      const terms = this.buildTermsFromTemplate(workOrder.id, template);

      if (terms.length) {
        await this.termModel.bulkCreate(terms);
      }
    }

    // ------------------------------------------------------------
    // MANUAL TERMS
    // ------------------------------------------------------------

    if (dto.terms?.length) {
      const terms: WorkOrderTermCreationAttributes[] = dto.terms.map(
        (term, index) => ({
          work_order_id: workOrder.id,

          terms_template_id: dto.terms_template_id ?? null,

          sort_order: term.sort_order ?? index + 1,

          description: term.description,

          is_mandatory: term.is_mandatory ?? true,
        }),
      );

      await this.termModel.bulkCreate(terms);
    }

    return this.findOne(workOrder.id);
  }

  // ============================================================
  // LIST
  // ============================================================

  async findAll(filters?: {
    project_id?: string;
    vendor_id?: string;
    status?: WorkOrderStatus;
  }) {
    const where: Record<string, any> = {};

    if (filters?.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters?.vendor_id) {
      where.vendor_id = filters.vendor_id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.workOrderModel.findAll({
      where,

      include: [
        {
          model: Vendor,
          as: 'vendor',
        },
        {
          model: Project,
          as: 'project',
        },
        {
          model: WorkOrderItem,
          as: 'items',
          include: [
            {
              model: Unit,
              as: 'unit',
            },
          ],
        },
        {
          model: WorkOrderPaymentStage,
          as: 'payment_stages',
        },
        {
          model: WorkOrderTerm,
          as: 'terms',
          include: [
            {
              model: TermsTemplate,
              as: 'terms_template',
            },
          ],
        },
      ],

      order: [['created_at', 'DESC']],
    });
  }

  // ============================================================
  // GET ONE
  // ============================================================

  async findOne(id: string) {
    const workOrder = await this.workOrderModel.findByPk(id, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
        },
        {
          model: Project,
          as: 'project',
        },
        {
          model: WorkOrderItem,
          as: 'items',
          separate: true,
          include: [
            {
              model: Unit,
              as: 'unit',
            },
          ],
          order: [['sort_order', 'ASC']],
        },
        {
          model: WorkOrderPaymentStage,
          as: 'payment_stages',
          separate: true,
          order: [['sort_order', 'ASC']],
        },
        {
          model: WorkOrderTerm,
          as: 'terms',
          separate: true,
          include: [
            {
              model: TermsTemplate,
              as: 'terms_template',
            },
          ],
          order: [['sort_order', 'ASC']],
        },
      ],
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateWorkOrderDto, userId?: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    // ------------------------------------------------------------
    // ITEMS CAN ONLY BE CHANGED IN DRAFT
    // ------------------------------------------------------------

    if (workOrder.status !== WorkOrderStatus.DRAFT && dto.items) {
      throw new BadRequestException(
        'Items can only be changed while the work order is in DRAFT status',
      );
    }

    // ------------------------------------------------------------
    // VALIDATE UNITS IF ITEMS ARE BEING UPDATED
    // ------------------------------------------------------------

    if (dto.items) {
      if (!dto.items.length) {
        throw new BadRequestException(
          'At least one work order item is required',
        );
      }

      const unitIds = [
        ...new Set(dto.items.map((item) => item.unit_id).filter(Boolean)),
      ];

      if (!unitIds.length) {
        throw new BadRequestException(
          'Unit is required for every work order item',
        );
      }

      const units = await this.unitModel.findAll({
        where: {
          id: {
            [Op.in]: unitIds,
          },
          is_active: true,
        },
      });

      const existingUnitIds = new Set(units.map((unit) => unit.id));

      for (const unitId of unitIds) {
        if (!existingUnitIds.has(unitId)) {
          throw new NotFoundException(`Unit not found or inactive: ${unitId}`);
        }
      }

      // ----------------------------------------------------------
      // DELETE OLD ITEMS
      // ----------------------------------------------------------

      await this.workOrderItemModel.destroy({
        where: {
          work_order_id: id,
        },
      });

      // ----------------------------------------------------------
      // CREATE NEW ITEMS
      // ----------------------------------------------------------

      const items: WorkOrderItemCreationAttributes[] = dto.items.map(
        (item, index) => {
          const quantity = Number(item.quantity ?? 0);

          const rate = Number(item.rate ?? 0);

          return {
            work_order_id: id,

            sort_order: item.sort_order ?? index + 1,

            item_type: item.item_type ?? WorkOrderItemType.SERVICE,

            description: item.description,

            quantity,

            unit_id: item.unit_id,

            rate,

            amount: this.calculateItemAmount(quantity, rate),

            remarks: item.remarks ?? null,
          };
        },
      );

      await this.workOrderItemModel.bulkCreate(items);

      // ----------------------------------------------------------
      // RECALCULATE COMMERCIALS
      // ----------------------------------------------------------

      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      const discount = Number(dto.discount ?? workOrder.discount ?? 0);

      const gstPercentage = Number(
        dto.gst_percentage ?? workOrder.gst_percentage ?? 0,
      );

      const taxableAmount = Math.max(subtotal - discount, 0);

      const gstAmount = taxableAmount * (gstPercentage / 100);

      const cartage = Number(dto.cartage ?? workOrder.cartage ?? 0);

      const totalAmount = taxableAmount + gstAmount + cartage;

      await workOrder.update({
        ...dto,
        subtotal,
        discount,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount,
        cartage,
        total_amount: totalAmount,
        updated_by: userId ?? null,
      } as any);
    } else {
      // ----------------------------------------------------------
      // UPDATE WITHOUT ITEM CHANGES
      // ----------------------------------------------------------

      await workOrder.update({
        ...dto,
        updated_by: userId ?? null,
      } as any);
    }

    return this.findOne(id);
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(id: string, status: WorkOrderStatus, userId?: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    await workOrder.update({
      status,
      updated_by: userId ?? null,
    });

    return this.findOne(id);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft work orders can be deleted');
    }

    await this.workOrderModel.destroy({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Work order deleted successfully',
    };
  }

  // ============================================================
  // BUILD TERMS FROM TEMPLATE
  // ============================================================

  private buildTermsFromTemplate(
    workOrderId: string,
    template: TermsTemplate,
  ): WorkOrderTermCreationAttributes[] {
    /**
     * content_html is the complete template content.
     *
     * Store it as one Work Order term snapshot.
     *
     * If your templates later become structured into individual
     * term rows, this helper can be changed to create one row
     * per term.
     */
    return [
      {
        work_order_id: workOrderId,

        terms_template_id: template.id,

        sort_order: 1,

        description: template.content_html,

        is_mandatory: true,
      },
    ];
  }

  // ============================================================
  // CALCULATE ITEM AMOUNT
  // ============================================================

  private calculateItemAmount(quantity: number, rate: number): number {
    return Number(quantity) * Number(rate);
  }

  // ============================================================
  // GENERATE WORK ORDER ID
  // ============================================================

  private async generateWoId(): Promise<string> {
    const year = new Date().getFullYear();

    const prefix = `WO-${year}-`;

    const latest = await this.workOrderModel.findOne({
      where: {
        wo_id: {
          [Op.like]: `${prefix}%`,
        },
      },

      order: [['created_at', 'DESC']],
    });

    let sequence = 1;

    if (latest?.wo_id) {
      const lastNumber = Number(latest.wo_id.replace(prefix, ''));

      if (!Number.isNaN(lastNumber)) {
        sequence = lastNumber + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }
}
