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
      ...new Set(
        dto.items
          .map((item) => item.unit_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (unitIds.length !== dto.items.length) {
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

    let termsTemplate: TermsTemplate | null = null;

    if (dto.terms_template_id) {
      termsTemplate = await this.termsTemplateModel.findByPk(
        dto.terms_template_id,
      );

      if (!termsTemplate) {
        throw new NotFoundException('Terms template not found');
      }

      if (!termsTemplate.is_active) {
        throw new BadRequestException('Selected terms template is inactive');
      }
    }

    // ------------------------------------------------------------
    // GENERATE WORK ORDER NUMBER
    // ------------------------------------------------------------

    const woId = await this.generateWoId();

    // ------------------------------------------------------------
    // ITEMS
    // ------------------------------------------------------------

    const items: WorkOrderItemCreationAttributes[] = dto.items.map(
      (item, index) => {
        const quantity = Number(item.quantity ?? 0);
        const rate = Number(item.rate ?? 0);

        if (quantity <= 0) {
          throw new BadRequestException(
            `Quantity must be greater than 0 for item ${index + 1}`,
          );
        }

        if (rate < 0) {
          throw new BadRequestException(
            `Rate cannot be negative for item ${index + 1}`,
          );
        }

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

    if (discount < 0) {
      throw new BadRequestException('Discount cannot be negative');
    }

    const taxableAmount = Math.max(subtotal - discount, 0);

    const gstPercentage = Number(dto.gst_percentage ?? 0);

    if (gstPercentage < 0 || gstPercentage > 100) {
      throw new BadRequestException('GST percentage must be between 0 and 100');
    }

    const gstAmount = taxableAmount * (gstPercentage / 100);

    const cartage = Number(dto.cartage ?? 0);

    if (cartage < 0) {
      throw new BadRequestException('Cartage cannot be negative');
    }

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
    // TERMS & CONDITIONS FROM TEMPLATE
    // ------------------------------------------------------------

    if (termsTemplate) {
      const terms = this.buildTermsFromTemplate(workOrder.id, termsTemplate);

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
    // DO NOT EDIT CLOSED / CANCELLED WORK ORDERS
    // ------------------------------------------------------------

    if (
      workOrder.status === WorkOrderStatus.CLOSED ||
      workOrder.status === WorkOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Work order cannot be edited while status is ${workOrder.status}`,
      );
    }

    // ------------------------------------------------------------
    // ITEMS
    // ------------------------------------------------------------

    let subtotal = Number(workOrder.subtotal);
    let discount = Number(workOrder.discount);
    let gstPercentage = Number(workOrder.gst_percentage);
    let gstAmount = Number(workOrder.gst_amount);
    let cartage = Number(workOrder.cartage);
    let totalAmount = Number(workOrder.total_amount);

    if (dto.items !== undefined) {
      // ----------------------------------------------------------
      // ITEMS ONLY IN DRAFT
      // ----------------------------------------------------------

      if (workOrder.status !== WorkOrderStatus.DRAFT) {
        throw new BadRequestException(
          'Items can only be changed while the work order is in DRAFT status',
        );
      }

      if (!dto.items.length) {
        throw new BadRequestException(
          'At least one work order item is required',
        );
      }

      // ----------------------------------------------------------
      // VALIDATE UNITS
      // ----------------------------------------------------------

      const unitIds = [
        ...new Set(
          dto.items
            .map((item) => item.unit_id)
            .filter((unitId): unitId is string => Boolean(unitId)),
        ),
      ];

      if (unitIds.length !== dto.items.length) {
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

          if (quantity <= 0) {
            throw new BadRequestException(
              `Quantity must be greater than 0 for item ${index + 1}`,
            );
          }

          if (rate < 0) {
            throw new BadRequestException(
              `Rate cannot be negative for item ${index + 1}`,
            );
          }

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

      subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    }

    // ------------------------------------------------------------
    // COMMERCIAL VALUES
    // ------------------------------------------------------------

    if (dto.discount !== undefined) {
      discount = Number(dto.discount);

      if (discount < 0) {
        throw new BadRequestException('Discount cannot be negative');
      }
    }

    if (dto.gst_percentage !== undefined) {
      gstPercentage = Number(dto.gst_percentage);

      if (gstPercentage < 0 || gstPercentage > 100) {
        throw new BadRequestException(
          'GST percentage must be between 0 and 100',
        );
      }
    }

    if (dto.cartage !== undefined) {
      cartage = Number(dto.cartage);

      if (cartage < 0) {
        throw new BadRequestException('Cartage cannot be negative');
      }
    }

    const taxableAmount = Math.max(subtotal - discount, 0);

    gstAmount = taxableAmount * (gstPercentage / 100);

    totalAmount = taxableAmount + gstAmount + cartage;

    // ------------------------------------------------------------
    // UPDATE ONLY WORK ORDER FIELDS
    // ------------------------------------------------------------

    const workOrderData: Record<string, any> = {};

    const dtoData = dto as any;

    const allowedFields = [
      'work_order_date',
      'target_completion_date',
      'agency',
      'site_address',
      'site_contact_person',
      'site_lead',
      'site_phone',
      'site_email',
      'site_gstin',
      'working_hours',
      'payment_terms',
    ];

    for (const field of allowedFields) {
      if (dtoData[field] !== undefined) {
        workOrderData[field] = dtoData[field];
      }
    }

    // ------------------------------------------------------------
    // OPTIONAL VENDOR / PROJECT CHANGE
    // ------------------------------------------------------------

    if (dtoData.vendor_id !== undefined) {
      const vendor = await this.vendorModel.findByPk(dtoData.vendor_id);

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      workOrderData.vendor_id = vendor.id;

      // Refresh snapshot
      workOrderData.contractor_name = vendor.name;

      workOrderData.contractor_company_name = vendor.company_name;

      workOrderData.contractor_position = vendor.position;

      workOrderData.contractor_phone = vendor.contact_number;

      workOrderData.contractor_address = vendor.address;
    }

    if (dtoData.project_id !== undefined) {
      const project = await this.projectModel.findByPk(dtoData.project_id);

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      workOrderData.project_id = project.id;

      workOrderData.project_name = project.name;

      if (dtoData.site_address === undefined) {
        workOrderData.site_address = project.site_location;
      }
    }

    // ------------------------------------------------------------
    // TERMS TEMPLATE CHANGE
    // ------------------------------------------------------------

    if (dtoData.terms_template_id !== undefined) {
      if (dtoData.terms_template_id) {
        const template = await this.termsTemplateModel.findByPk(
          dtoData.terms_template_id,
        );

        if (!template) {
          throw new NotFoundException('Terms template not found');
        }

        if (!template.is_active) {
          throw new BadRequestException('Selected terms template is inactive');
        }

        workOrderData.payment_terms = template.content_html;
      } else {
        workOrderData.payment_terms = null;
      }
    }

    // ------------------------------------------------------------
    // COMMERCIAL FIELDS
    // ------------------------------------------------------------

    workOrderData.subtotal = subtotal;

    workOrderData.discount = discount;

    workOrderData.gst_percentage = gstPercentage;

    workOrderData.gst_amount = gstAmount;

    workOrderData.cartage = cartage;

    workOrderData.total_amount = totalAmount;

    workOrderData.updated_by = userId ?? null;

    await workOrder.update(workOrderData);

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

    this.validateStatusTransition(workOrder.status, status);

    await workOrder.update({
      status,
      updated_by: userId ?? null,
    });

    return this.findOne(id);
  }

  // ============================================================
  // APPROVE
  // ============================================================

  async approve(id: string, userId?: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Only work orders in PENDING_APPROVAL can be approved. Current status: ${workOrder.status}`,
      );
    }

    await workOrder.update({
      status: WorkOrderStatus.APPROVED,
      updated_by: userId ?? null,
    });

    return this.findOne(id);
  }

  // ============================================================
  // REJECT
  // ============================================================

  async reject(id: string, reason?: string, userId?: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Only work orders in PENDING_APPROVAL can be rejected. Current status: ${workOrder.status}`,
      );
    }

    /*
     * There is currently no REJECTED status
     * in WorkOrderStatus.
     *
     * Therefore rejection returns the work order
     * to DRAFT so it can be corrected and submitted
     * again.
     *
     * If you add REJECTED to the enum later,
     * change this to WorkOrderStatus.REJECTED.
     */

    await workOrder.update({
      status: WorkOrderStatus.DRAFT,
      updated_by: userId ?? null,
    });

    return {
      ...(await this.findOne(id)).toJSON(),
      rejection_reason: reason ?? null,
    };
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const workOrder = await this.workOrderModel.findByPk(id);

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (
      workOrder.status === WorkOrderStatus.ISSUED ||
      workOrder.status === WorkOrderStatus.ACKNOWLEDGED ||
      workOrder.status === WorkOrderStatus.IN_PROGRESS ||
      workOrder.status === WorkOrderStatus.COMPLETED ||
      workOrder.status === WorkOrderStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Work order cannot be deleted while status is ${workOrder.status}`,
      );
    }

    // Delete children first in case DB foreign keys
    // do not have ON DELETE CASCADE configured.

    await this.workOrderItemModel.destroy({
      where: {
        work_order_id: id,
      },
    });

    await this.paymentStageModel.destroy({
      where: {
        work_order_id: id,
      },
    });

    await this.termModel.destroy({
      where: {
        work_order_id: id,
      },
    });

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
  // STATUS TRANSITIONS
  // ============================================================

  private validateStatusTransition(
    currentStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus,
  ) {
    if (currentStatus === nextStatus) {
      throw new BadRequestException(
        `Work order is already in ${currentStatus} status`,
      );
    }

    const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      [WorkOrderStatus.DRAFT]: [
        WorkOrderStatus.PENDING_APPROVAL,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.PENDING_APPROVAL]: [
        WorkOrderStatus.APPROVED,
        WorkOrderStatus.DRAFT,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.APPROVED]: [
        WorkOrderStatus.ISSUED,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.ISSUED]: [
        WorkOrderStatus.ACKNOWLEDGED,
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.ACKNOWLEDGED]: [
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.IN_PROGRESS]: [
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.CANCELLED,
      ],

      [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.CLOSED],

      [WorkOrderStatus.CANCELLED]: [],

      [WorkOrderStatus.CLOSED]: [],
    };

    const allowed = transitions[currentStatus] ?? [];

    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid work order status transition: ${currentStatus} → ${nextStatus}`,
      );
    }
  }

  // ============================================================
  // BUILD TERMS FROM TEMPLATE
  // ============================================================

  private buildTermsFromTemplate(
    workOrderId: string,
    template: TermsTemplate,
  ): WorkOrderTermCreationAttributes[] {
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
    return Number((Number(quantity) * Number(rate)).toFixed(2));
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
