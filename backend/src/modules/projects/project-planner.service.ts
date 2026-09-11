// src/modules/project-planner/project-planner.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';

import {
  PlannerItemStatus,
  ProjectPhaseModule,
  ProjectPlannerType,
  ProcurementItemType,
} from '@/common/enums/project-planner.enum';

import {
  CreatePlannerItemDto,
  CreateProcurementItemDto,
  CreateProjectLocationDto,
  CreateProjectPlannerDto,
  UpdatePlannerItemDto,
  UpdatePlannerItemLocationDto,
  UpdateProcurementItemDto,
  UpdateProjectLocationDto,
  UpdateProjectPlannerDto,
} from './dto';

// Existing models
import { Project } from '@/modules/projects/models/projects.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { User } from '@/modules/users/models/user.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';

// Project Planner models
import { ProjectPhase } from './models/project-phase.model';
import { ProjectPlanner } from './models/project_planners.model';
import { ProjectPlannerItem } from './models/project_planner_items.model';
import { ProjectLocation } from './models/project_locations.model';
import { ProjectPlannerItemLocation } from './models/project_planner_item_locations.model';
import { ProjectProcurementItem } from './models/project_procurement_items.model';
import { PlannerTaskTemplate } from './models/planner-task-template.model';

@Injectable()
export class ProjectPlannerService {
  constructor(
    private readonly sequelize: Sequelize,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(ProjectPlanner)
    private readonly plannerModel: typeof ProjectPlanner,

    @InjectModel(ProjectPlannerItem)
    private readonly plannerItemModel: typeof ProjectPlannerItem,

    @InjectModel(ProjectPhase)
    private readonly phaseModel: typeof ProjectPhase,

    @InjectModel(PlannerTaskTemplate)
    private readonly plannerTaskTemplateModel: typeof PlannerTaskTemplate,

    @InjectModel(ProjectLocation)
    private readonly locationModel: typeof ProjectLocation,

    @InjectModel(ProjectPlannerItemLocation)
    private readonly itemLocationModel: typeof ProjectPlannerItemLocation,

    @InjectModel(ProjectProcurementItem)
    private readonly procurementItemModel: typeof ProjectProcurementItem,

    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,
  ) {}

  // ============================================================
  // PROJECT PLANNERS
  // ============================================================

  async createPlanner(projectId: string, payload: CreateProjectPlannerDto) {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existing = await this.plannerModel.findOne({
      where: {
        project_id: projectId,
        type: payload.type,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `${payload.type} planner already exists for this project`,
      );
    }

    return this.plannerModel.create({
      project_id: projectId,

      type: payload.type,

      name: payload.name ?? this.getDefaultPlannerName(payload.type),

      description: payload.description ?? null,

      planned_start_date: payload.planned_start_date ?? null,

      planned_end_date: payload.planned_end_date ?? null,

      created_by: payload.created_by ?? null,
    });
  }

  // ============================================================
  // INITIALIZE STANDARD PROJECT PLANNERS
  // ============================================================

  async initializeProjectPlanners(projectId: string, userId?: string) {
    return this.sequelize.transaction(async (transaction) => {
      const project = await this.projectModel.findByPk(projectId, {
        transaction,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const plannerTypes: ProjectPlannerType[] = [
        ProjectPlannerType.CONSULTANCY,
        ProjectPlannerType.PMC,
        ProjectPlannerType.VENDOR_PROCUREMENT,
      ];

      const planners: ProjectPlanner[] = [];

      for (const type of plannerTypes) {
        const [planner] = await this.plannerModel.findOrCreate({
          where: {
            project_id: projectId,
            type,
          },

          defaults: {
            project_id: projectId,

            type,

            name: this.getDefaultPlannerName(type),

            created_by: userId ?? null,
          },

          transaction,
        });

        planners.push(planner);
      }

      return planners;
    });
  }

  // ============================================================
  // GET PROJECT PLANNERS
  // ============================================================

  async getProjectPlanners(projectId: string) {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.plannerModel.findAll({
      where: {
        project_id: projectId,
      },

      order: [['created_at', 'ASC']],
    });
  }

  // ============================================================
  // GET SINGLE PLANNER
  // ============================================================

  async getPlannerById(plannerId: string, transaction?: Transaction) {
    const planner = await this.plannerModel.findByPk(plannerId, {
      transaction,

      include: [
        {
          model: Project,
        },

        // Consultancy / PMC items
        {
          model: ProjectPlannerItem,
          as: 'items',

          separate: true,

          include: [
            {
              model: ProjectPhase,
              as: 'phase',
            },

            {
              model: DocumentType,
              as: 'document_type',
            },

            {
              model: User,
              as: 'assignee',
            },

            {
              model: ProjectPlannerItemLocation,

              as: 'locations',

              include: [
                {
                  model: ProjectLocation,
                  as: 'location',
                },

                {
                  model: User,
                  as: 'assignee',
                },
              ],
            },
          ],

          order: [['sort_order', 'ASC']],
        },

        // Vendor & Procurement items
        {
          model: ProjectProcurementItem,

          as: 'procurement_items',

          separate: true,

          include: [
            {
              model: Vendor,
            },
          ],

          order: [
            ['item_type', 'ASC'],
            ['sort_order', 'ASC'],
          ],
        },
      ],
    });

    if (!planner) {
      throw new NotFoundException('Project planner not found');
    }

    return planner;
  }

  // ============================================================
  // UPDATE PLANNER
  // ============================================================

  async updatePlanner(plannerId: string, payload: UpdateProjectPlannerDto) {
    const planner = await this.getPlannerOrFail(plannerId);

    await planner.update(payload);

    return this.getPlannerById(plannerId);
  }

  // ============================================================
  // DELETE PLANNER
  // ============================================================

  async deletePlanner(plannerId: string) {
    const planner = await this.getPlannerOrFail(plannerId);

    await planner.destroy();

    return {
      success: true,
      message: 'Project planner deleted successfully',
    };
  }

  // ============================================================
  // CREATE PLANNER ITEM
  // CONSULTANCY + PMC
  // ============================================================

  async createPlannerItem(plannerId: string, payload: CreatePlannerItemDto) {
    return this.sequelize.transaction(async (transaction) => {
      const planner = await this.getPlannerOrFail(plannerId, transaction);

      this.ensureTaskPlanner(planner);

      const phase = await this.validatePlannerPhase(
        planner,
        payload.phase_id,
        transaction,
      );

      if (payload.document_type_id) {
        await this.validateDocumentType(payload.document_type_id, transaction);
      }

      const item = await this.plannerItemModel.create(
        {
          planner_id: planner.id,

          phase_id: phase.id,

          work_name: payload.work_name ?? null,

          details: payload.details ?? null,

          document_type_id: payload.document_type_id ?? null,

          planned_start_date: payload.planned_start_date ?? null,

          planned_end_date: payload.planned_end_date ?? null,

          assigned_to: payload.assigned_to ?? null,

          remarks: payload.remarks ?? null,

          sort_order: payload.sort_order ?? 0,

          status: PlannerItemStatus.NOT_STARTED,

          progress_pct: 0,

          created_by: payload.created_by ?? null,
        },
        {
          transaction,
        },
      );

      if (payload.location_ids?.length) {
        await this.attachLocationsInternal(
          item,
          payload.location_ids,
          transaction,
        );
      }

      return this.getPlannerItemById(item.id, transaction);
    });
  }

  // ============================================================
  // GET PLANNER ITEMS
  // ============================================================

  async getPlannerItems(plannerId: string, phaseId?: string) {
    const planner = await this.getPlannerOrFail(plannerId);

    this.ensureTaskPlanner(planner);

    const where: {
      planner_id: string;
      phase_id?: string;
    } = {
      planner_id: plannerId,
    };

    if (phaseId) {
      where.phase_id = phaseId;
    }

    return this.plannerItemModel.findAll({
      where,

      include: [
        {
          model: ProjectPhase,
          as: 'phase',
        },

        {
          model: DocumentType,
          as: 'document_type',
        },

        {
          model: User,
          as: 'assignee',
        },

        {
          model: ProjectPlannerItemLocation,

          as: 'locations',

          include: [
            {
              model: ProjectLocation,
              as: 'location',
            },
          ],
        },
      ],

      order: [
        [
          {
            model: ProjectPhase,
            as: 'phase',
          },
          'sort_order',
          'ASC',
        ],

        ['sort_order', 'ASC'],
      ],
    });
  }

  // ============================================================
  // GET SINGLE PLANNER ITEM
  // ============================================================

  async getPlannerItemById(itemId: string, transaction?: Transaction) {
    const item = await this.plannerItemModel.findByPk(itemId, {
      transaction,

      include: [
        {
          model: ProjectPhase,
          as: 'phase',
        },

        {
          model: DocumentType,
          as: 'document_type',
        },

        {
          model: User,
          as: 'assignee',
        },

        {
          model: ProjectPlannerItemLocation,

          as: 'locations',

          include: [
            {
              model: ProjectLocation,
              as: 'location',
            },

            {
              model: User,
              as: 'assignee',
            },
          ],
        },
      ],
    });

    if (!item) {
      throw new NotFoundException('Planner item not found');
    }

    return item;
  }

  // ============================================================
  // UPDATE PLANNER ITEM
  // ============================================================

  async updatePlannerItem(itemId: string, payload: UpdatePlannerItemDto) {
    return this.sequelize.transaction(async (transaction) => {
      const item = await this.plannerItemModel.findByPk(itemId, {
        transaction,

        include: [
          {
            model: ProjectPlanner,

            as: 'planner',
          },
        ],
      });

      if (!item) {
        throw new NotFoundException('Planner item not found');
      }

      if (!item.planner) {
        throw new NotFoundException('Planner not found for planner item');
      }

      if (payload.phase_id) {
        await this.validatePlannerPhase(
          item.planner,
          payload.phase_id,
          transaction,
        );
      }

      if (payload.document_type_id) {
        await this.validateDocumentType(payload.document_type_id, transaction);
      }

      // ================================================
      // Automatic progress → status
      // ================================================

      if (payload.progress_pct === 100 && !payload.status) {
        payload.status = PlannerItemStatus.COMPLETED;
      }

      if (
        payload.progress_pct !== undefined &&
        payload.progress_pct > 0 &&
        payload.progress_pct < 100 &&
        !payload.status
      ) {
        payload.status = PlannerItemStatus.IN_PROGRESS;
      }

      if (payload.progress_pct === 0 && !payload.status) {
        payload.status = PlannerItemStatus.NOT_STARTED;
      }

      await item.update(payload, {
        transaction,
      });

      return this.getPlannerItemById(itemId, transaction);
    });
  }

  // ============================================================
  // DELETE PLANNER ITEM
  // ============================================================

  async deletePlannerItem(itemId: string) {
    const item = await this.plannerItemModel.findByPk(itemId);

    if (!item) {
      throw new NotFoundException('Planner item not found');
    }

    await item.destroy();

    return {
      success: true,
      message: 'Planner item deleted successfully',
    };
  }

  // ============================================================
  // PROJECT LOCATIONS
  // ============================================================

  async createLocation(projectId: string, payload: CreateProjectLocationDto) {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (payload.parent_id) {
      const parent = await this.locationModel.findByPk(payload.parent_id);

      if (!parent) {
        throw new NotFoundException('Parent location not found');
      }

      if (parent.project_id !== projectId) {
        throw new BadRequestException(
          'Parent location belongs to another project',
        );
      }
    }

    return this.locationModel.create({
      project_id: projectId,

      parent_id: payload.parent_id ?? null,

      type: payload.type,

      name: payload.name,

      code: payload.code ?? null,

      sort_order: payload.sort_order ?? 0,
    });
  }

  // ============================================================
  // GET PROJECT LOCATIONS TREE
  // ============================================================

  async getProjectLocations(projectId: string) {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const locations = await this.locationModel.findAll({
      where: {
        project_id: projectId,
      },

      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return this.buildLocationTree(locations);
  }

  // ============================================================
  // UPDATE LOCATION
  // ============================================================

  async updateLocation(locationId: string, payload: UpdateProjectLocationDto) {
    const location = await this.locationModel.findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Project location not found');
    }

    if (payload.parent_id) {
      if (payload.parent_id === location.id) {
        throw new BadRequestException('Location cannot be its own parent');
      }

      const parent = await this.locationModel.findByPk(payload.parent_id);

      if (!parent) {
        throw new NotFoundException('Parent location not found');
      }

      if (parent.project_id !== location.project_id) {
        throw new BadRequestException(
          'Parent location belongs to another project',
        );
      }

      await this.ensureNoLocationCycle(location.id, parent.id);
    }

    await location.update(payload);

    return location.reload();
  }

  // ============================================================
  // ATTACH PLANNER ITEM TO LOCATIONS
  // ============================================================

  async attachLocations(itemId: string, locationIds: string[]) {
    return this.sequelize.transaction(async (transaction) => {
      const item = await this.plannerItemModel.findByPk(itemId, {
        include: [
          {
            model: ProjectPlanner,

            as: 'planner',
          },
        ],

        transaction,
      });

      if (!item) {
        throw new NotFoundException('Planner item not found');
      }

      await this.attachLocationsInternal(item, locationIds, transaction);

      return this.getPlannerItemById(itemId, transaction);
    });
  }

  // ============================================================
  // INTERNAL ATTACH LOCATIONS
  // ============================================================

  private async attachLocationsInternal(
    item: ProjectPlannerItem,
    locationIds: string[],
    transaction: Transaction,
  ) {
    if (!locationIds.length) {
      return;
    }

    const uniqueLocationIds = [...new Set(locationIds)];

    const locations = await this.locationModel.findAll({
      where: {
        id: {
          [Op.in]: uniqueLocationIds,
        },
      },

      transaction,
    });

    if (locations.length !== uniqueLocationIds.length) {
      throw new BadRequestException(
        'One or more project locations are invalid',
      );
    }

    const planner =
      item.planner ??
      (await this.plannerModel.findByPk(item.planner_id, {
        transaction,
      }));

    if (!planner) {
      throw new NotFoundException('Planner not found');
    }

    const invalidLocation = locations.find(
      (location) => location.project_id !== planner.project_id,
    );

    if (invalidLocation) {
      throw new BadRequestException(
        'Planner item cannot be linked to a location from another project',
      );
    }

    for (const location of locations) {
      await this.itemLocationModel.findOrCreate({
        where: {
          planner_item_id: item.id,

          location_id: location.id,
        },

        defaults: {
          planner_item_id: item.id,

          location_id: location.id,

          status: PlannerItemStatus.NOT_STARTED,

          progress_pct: 0,
        },

        transaction,
      });
    }
  }

  // ============================================================
  // REMOVE LOCATION FROM ITEM
  // ============================================================

  async removeLocationFromItem(itemId: string, locationId: string) {
    return this.sequelize.transaction(async (transaction) => {
      const relation = await this.itemLocationModel.findOne({
        where: {
          planner_item_id: itemId,

          location_id: locationId,
        },

        transaction,
      });

      if (!relation) {
        throw new NotFoundException('Planner item location not found');
      }

      await relation.destroy({
        transaction,
      });

      await this.recalculatePlannerItemProgress(itemId, transaction);

      return {
        success: true,

        message: 'Location removed from planner item successfully',
      };
    });
  }

  // ============================================================
  // UPDATE LOCATION / FLOOR PROGRESS
  // ============================================================

  async updateItemLocation(
    itemLocationId: string,
    payload: UpdatePlannerItemLocationDto,
  ) {
    return this.sequelize.transaction(async (transaction) => {
      const relation = await this.itemLocationModel.findByPk(itemLocationId, {
        transaction,
      });

      if (!relation) {
        throw new NotFoundException('Planner item location not found');
      }

      // ================================================
      // Automatic progress → status
      // ================================================

      if (payload.progress_pct === 100 && !payload.status) {
        payload.status = PlannerItemStatus.COMPLETED;
      }

      if (
        payload.progress_pct !== undefined &&
        payload.progress_pct > 0 &&
        payload.progress_pct < 100 &&
        !payload.status
      ) {
        payload.status = PlannerItemStatus.IN_PROGRESS;
      }

      if (payload.progress_pct === 0 && !payload.status) {
        payload.status = PlannerItemStatus.NOT_STARTED;
      }

      await relation.update(payload, {
        transaction,
      });

      await this.recalculatePlannerItemProgress(
        relation.planner_item_id,
        transaction,
      );

      return relation.reload({
        transaction,

        include: [
          {
            model: ProjectLocation,

            as: 'location',
          },

          {
            model: User,
            as: 'assignee',
          },
        ],
      });
    });
  }

  // ============================================================
  // RECALCULATE WORK PROGRESS
  // ============================================================

  async recalculatePlannerItemProgress(
    itemId: string,
    transaction?: Transaction,
  ) {
    const plannerItem = await this.plannerItemModel.findByPk(itemId, {
      transaction,
    });

    if (!plannerItem) {
      throw new NotFoundException('Planner item not found');
    }

    const locationItems = await this.itemLocationModel.findAll({
      where: {
        planner_item_id: itemId,
      },

      transaction,
    });

    /**
     * No location breakdown means progress remains
     * directly controlled by the parent planner item.
     */
    if (!locationItems.length) {
      return plannerItem;
    }

    const applicableItems = locationItems.filter(
      (item) => item.status !== PlannerItemStatus.NOT_APPLICABLE,
    );

    // All locations marked N/A
    if (!applicableItems.length) {
      await plannerItem.update(
        {
          progress_pct: 0,

          status: PlannerItemStatus.NOT_APPLICABLE,
        },
        {
          transaction,
        },
      );

      return plannerItem;
    }

    const totalProgress = applicableItems.reduce(
      (total, locationItem) => total + Number(locationItem.progress_pct || 0),
      0,
    );

    const progress = totalProgress / applicableItems.length;

    const roundedProgress = Math.round(progress * 100) / 100;

    let status = PlannerItemStatus.NOT_STARTED;

    if (roundedProgress >= 100) {
      status = PlannerItemStatus.COMPLETED;
    } else if (roundedProgress > 0) {
      status = PlannerItemStatus.IN_PROGRESS;
    }

    await plannerItem.update(
      {
        progress_pct: roundedProgress,

        status,
      },
      {
        transaction,
      },
    );

    return plannerItem;
  }

  // ============================================================
  // PROCUREMENT
  // ============================================================

  async createProcurementItem(
    plannerId: string,
    payload: CreateProcurementItemDto,
  ) {
    const planner = await this.getPlannerOrFail(plannerId);

    this.ensureProcurementPlanner(planner);

    if (payload.vendor_id) {
      const vendor = await Vendor.findByPk(payload.vendor_id);

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    return this.procurementItemModel.create({
      planner_id: planner.id,

      item_type: payload.item_type,

      category_name: payload.category_name,

      vendor_id: payload.vendor_id ?? null,

      vendor_name: payload.vendor_name ?? null,

      estimate_finalised_at: payload.estimate_finalised_at ?? null,

      quotation_finalised_at: payload.quotation_finalised_at ?? null,

      planned_start_date: payload.planned_start_date ?? null,

      planned_end_date: payload.planned_end_date ?? null,

      purchase_date: payload.purchase_date ?? null,

      received_at_site_date: payload.received_at_site_date ?? null,

      status: payload.status ?? PlannerItemStatus.NOT_STARTED,

      remarks: payload.remarks ?? null,

      sort_order: payload.sort_order ?? 0,

      created_by: payload.created_by ?? null,
    });
  }

  // ============================================================
  // GET PROCUREMENT ITEMS
  // ============================================================

  async getProcurementItems(plannerId: string, itemType?: ProcurementItemType) {
    const planner = await this.getPlannerOrFail(plannerId);

    this.ensureProcurementPlanner(planner);

    const where: {
      planner_id: string;
      item_type?: ProcurementItemType;
    } = {
      planner_id: plannerId,
    };

    if (itemType) {
      where.item_type = itemType;
    }

    return this.procurementItemModel.findAll({
      where,

      include: [
        {
          model: Vendor,
        },
      ],

      order: [
        ['item_type', 'ASC'],
        ['sort_order', 'ASC'],
      ],
    });
  }

  // ============================================================
  // UPDATE PROCUREMENT ITEM
  // ============================================================

  async updateProcurementItem(
    itemId: string,
    payload: UpdateProcurementItemDto,
  ) {
    const item = await this.procurementItemModel.findByPk(itemId);

    if (!item) {
      throw new NotFoundException('Procurement item not found');
    }

    if (payload.vendor_id) {
      const vendor = await Vendor.findByPk(payload.vendor_id);

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    await item.update(payload);

    return item.reload({
      include: [
        {
          model: Vendor,
        },
      ],
    });
  }

  // ============================================================
  // DELETE PROCUREMENT ITEM
  // ============================================================

  async deleteProcurementItem(itemId: string) {
    const item = await this.procurementItemModel.findByPk(itemId);

    if (!item) {
      throw new NotFoundException('Procurement item not found');
    }

    await item.destroy();

    return {
      success: true,

      message: 'Procurement item deleted successfully',
    };
  }

  // ============================================================
  // PROJECT PLANNER OVERVIEW
  // ============================================================

  async getProjectPlannerOverview(projectId: string) {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const planners = await this.plannerModel.findAll({
      where: {
        project_id: projectId,
      },

      include: [
        {
          model: ProjectPlannerItem,

          as: 'items',

          include: [
            {
              model: ProjectPhase,

              as: 'phase',
            },

            {
              model: DocumentType,

              as: 'document_type',
            },

            {
              model: ProjectPlannerItemLocation,

              as: 'locations',

              include: [
                {
                  model: ProjectLocation,

                  as: 'location',
                },
              ],
            },
          ],
        },

        {
          model: ProjectProcurementItem,

          as: 'procurement_items',

          include: [
            {
              model: Vendor,
            },
          ],
        },
      ],

      order: [['created_at', 'ASC']],
    });

    const locations = await this.locationModel.findAll({
      where: {
        project_id: projectId,
      },

      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,

        current_phase: project.current_phase,

        progress_pct: project.progress_pct,

        timeline_status: project.timeline_status,
      },

      planners,

      locations: this.buildLocationTree(locations),
    };
  }

  // ============================================================
  // GENERATE PLANNER FROM TEMPLATE
  // ============================================================

  async generatePlannerFromTemplate(plannerId: string, userId?: string) {
    return this.sequelize.transaction(async (transaction) => {
      // ========================================================
      // 1. Planner
      // ========================================================

      const planner = await this.getPlannerOrFail(plannerId, transaction);

      this.ensureTaskPlanner(planner);

      // ========================================================
      // 2. Determine module
      // ========================================================

      const module = this.getPhaseModuleForPlanner(planner.type);

      if (!module) {
        throw new BadRequestException(
          `No phase module configured for planner type ${planner.type}`,
        );
      }

      // ========================================================
      // 3. Get template rows
      // ========================================================

      const templates = await this.plannerTaskTemplateModel.findAll({
        where: {
          is_active: true,
        },

        include: [
          {
            model: ProjectPhase,

            as: 'phase',

            where: {
              module,
            },

            required: true,
          },
        ],

        order: [
          [
            {
              model: ProjectPhase,

              as: 'phase',
            },

            'sort_order',
            'ASC',
          ],

          ['sort_order', 'ASC'],
        ],

        transaction,
      });

      if (!templates.length) {
        throw new BadRequestException(
          `No active planner task templates found for ${planner.type}`,
        );
      }

      // ========================================================
      // 4. Project locations
      // ========================================================

      const projectLocations = await this.locationModel.findAll({
        where: {
          project_id: planner.project_id,
        },

        order: [['sort_order', 'ASC']],

        transaction,
      });

      // ========================================================
      // 5. Existing items
      // ========================================================

      const existingItems = await this.plannerItemModel.findAll({
        where: {
          planner_id: planner.id,
        },

        transaction,
      });

      const existingKeys = new Set(
        existingItems.map((item) =>
          this.buildPlannerTemplateKey({
            phase_id: item.phase_id,

            work_name: item.work_name,

            details: item.details,

            document_type_id: item.document_type_id,
          }),
        ),
      );

      // ========================================================
      // 6. Generate items
      // ========================================================

      const createdItems: ProjectPlannerItem[] = [];

      for (const template of templates) {
        const templateKey = this.buildPlannerTemplateKey({
          phase_id: template.phase_id,

          work_name: template.work_name,

          details: template.details,

          document_type_id: template.document_type_id,
        });

        // Prevent duplicate generation
        if (existingKeys.has(templateKey)) {
          continue;
        }

        const item = await this.plannerItemModel.create(
          {
            planner_id: planner.id,

            phase_id: template.phase_id,

            work_name: template.work_name,

            details: template.details ?? null,

            document_type_id: template.document_type_id ?? null,

            status: PlannerItemStatus.NOT_STARTED,

            progress_pct: 0,

            remarks: template.default_remarks ?? null,

            sort_order: template.sort_order,

            created_by: userId ?? null,
          },

          {
            transaction,
          },
        );

        createdItems.push(item);

        existingKeys.add(templateKey);

        // ======================================================
        // 7. Auto attach project locations
        // ======================================================

        if (template.applies_to_locations && projectLocations.length) {
          await this.itemLocationModel.bulkCreate(
            projectLocations.map((location) => ({
              planner_item_id: item.id,

              location_id: location.id,

              status: PlannerItemStatus.NOT_STARTED,

              progress_pct: 0,
            })),

            {
              transaction,

              ignoreDuplicates: true,
            },
          );
        }
      }

      // ========================================================
      // 8. Return complete generated planner
      // ========================================================

      const generatedPlanner = await this.getPlannerById(
        planner.id,
        transaction,
      );

      return {
        success: true,

        message: 'Planner generated from template successfully',

        planner_id: planner.id,

        planner_type: planner.type,

        total_templates: templates.length,

        created_items: createdItems.length,

        skipped_items: templates.length - createdItems.length,

        planner: generatedPlanner,
      };
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async getPlannerOrFail(plannerId: string, transaction?: Transaction) {
    const planner = await this.plannerModel.findByPk(plannerId, {
      transaction,
    });

    if (!planner) {
      throw new NotFoundException('Project planner not found');
    }

    return planner;
  }

  // ============================================================
  // VALIDATE PLANNER PHASE
  // ============================================================

  private async validatePlannerPhase(
    planner: ProjectPlanner,
    phaseId: string,
    transaction?: Transaction,
  ) {
    const phase = await this.phaseModel.findByPk(phaseId, {
      transaction,
    });

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    const expectedModule = this.getPhaseModuleForPlanner(planner.type);

    if (!expectedModule) {
      throw new BadRequestException(
        `${planner.type} planner does not support project phases`,
      );
    }

    if (phase.module !== expectedModule) {
      throw new BadRequestException(
        `Phase ${phase.phase_code} belongs to ${phase.module}, but planner type is ${planner.type}`,
      );
    }

    return phase;
  }

  // ============================================================
  // VALIDATE DOCUMENT TYPE
  // ============================================================

  private async validateDocumentType(
    documentTypeId: string,
    transaction?: Transaction,
  ) {
    const documentType = await this.documentTypeModel.findByPk(documentTypeId, {
      transaction,
    });

    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }

    return documentType;
  }

  // ============================================================
  // MAP PLANNER TYPE → PHASE MODULE
  // ============================================================

  private getPhaseModuleForPlanner(
    type: ProjectPlannerType,
  ): ProjectPhaseModule | null {
    switch (type) {
      case ProjectPlannerType.CONSULTANCY:
        return ProjectPhaseModule.CONSULTANCY;

      case ProjectPlannerType.PMC:
        return ProjectPhaseModule.PMC;

      default:
        return null;
    }
  }

  // ============================================================
  // ENSURE CONSULTANCY / PMC PLANNER
  // ============================================================

  private ensureTaskPlanner(planner: ProjectPlanner) {
    if (planner.type === ProjectPlannerType.VENDOR_PROCUREMENT) {
      throw new BadRequestException(
        'Vendor & Procurement planner cannot contain Consultancy/PMC planner items',
      );
    }
  }

  // ============================================================
  // ENSURE PROCUREMENT PLANNER
  // ============================================================

  private ensureProcurementPlanner(planner: ProjectPlanner) {
    if (planner.type !== ProjectPlannerType.VENDOR_PROCUREMENT) {
      throw new BadRequestException(
        'Procurement items can only be added to Vendor & Procurement planner',
      );
    }
  }

  // ============================================================
  // DEFAULT PLANNER NAME
  // ============================================================

  private getDefaultPlannerName(type: ProjectPlannerType) {
    switch (type) {
      case ProjectPlannerType.CONSULTANCY:
        return 'Consultancy';

      case ProjectPlannerType.PMC:
        return 'PMC';

      case ProjectPlannerType.VENDOR_PROCUREMENT:
        return 'Vendor & Procurement';

      default:
        return 'Project Planner';
    }
  }

  // ============================================================
  // TEMPLATE UNIQUE KEY
  // ============================================================

  private buildPlannerTemplateKey(data: {
    phase_id: string;

    work_name?: string | null;

    details?: string | null;

    document_type_id?: string | null;
  }) {
    return [
      data.phase_id,

      this.normalizeTemplateValue(data.work_name),

      this.normalizeTemplateValue(data.details),

      data.document_type_id ?? '',
    ].join('|');
  }

  private normalizeTemplateValue(value?: string | null) {
    return value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
  }

  // ============================================================
  // BUILD LOCATION TREE
  // ============================================================

  private buildLocationTree(locations: ProjectLocation[]) {
    const map = new Map<string, any>();

    const roots: any[] = [];

    for (const location of locations) {
      map.set(location.id, {
        ...location.toJSON(),

        children: [],
      });
    }

    for (const location of locations) {
      const node = map.get(location.id);

      if (location.parent_id && map.has(location.parent_id)) {
        map.get(location.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  // ============================================================
  // PREVENT LOCATION TREE CYCLES
  // ============================================================

  private async ensureNoLocationCycle(
    locationId: string,
    proposedParentId: string,
  ) {
    let currentParentId: string | null = proposedParentId;

    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === locationId) {
        throw new BadRequestException(
          'Location hierarchy cannot contain a cycle',
        );
      }

      if (visited.has(currentParentId)) {
        throw new BadRequestException('Invalid location hierarchy detected');
      }

      visited.add(currentParentId);

      const parent = await this.locationModel.findByPk(currentParentId, {
        attributes: ['id', 'parent_id'],
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parent_id;
    }
  }
}
