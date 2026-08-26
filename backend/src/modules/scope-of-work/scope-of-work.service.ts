import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { ScopeCategory } from './models/scope-category.model';
import { ProjectSpace } from './models/project-space.model';
import { ProjectScopeCategory } from './models/project-scope-category.model';
import { ScopeItem } from './models/scope-item.model';
import { ScopeOfWork } from './models/scope-of-work.model';

import { CreateScopeCategoryDto } from './dto/create-scope-category.dto';
import { UpdateScopeCategoryDto } from './dto/update-scope-category.dto';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';
import { Client } from '../clients/models/client.model';
import { TeamMember } from '../users/models/team-member.model';
import { CreateProjectSpaceDto } from './dto/create-project-space.dto';
import { UpdateProjectSpaceDto } from './dto/update-project-space.dto';

import { CreateProjectScopeCategoryDto } from './dto/create-project-scope-category.dto';

import { CreateScopeItemDto } from './dto/create-scope-item.dto';
import { UpdateScopeItemDto } from './dto/update-scope-item.dto';

import { CreateScopeOfWorkDto } from './dto/create-scope-of-work.dto';
import { UpdateScopeOfWorkDto } from './dto/update-scope-of-work.dto';

import { CreateCompleteScopeOfWorkDto } from './dto/create-complete-scope-of-work.dto';

@Injectable()
export class ScopeOfWorkService {
  constructor(
    @InjectModel(ScopeCategory)
    private readonly scopeCategoryModel: typeof ScopeCategory,

    @InjectModel(ProjectSpace)
    private readonly projectSpaceModel: typeof ProjectSpace,

    @InjectModel(ProjectScopeCategory)
    private readonly projectScopeCategoryModel: typeof ProjectScopeCategory,

    @InjectModel(ScopeItem)
    private readonly scopeItemModel: typeof ScopeItem,

    @InjectModel(ScopeOfWork)
    private readonly scopeOfWorkModel: typeof ScopeOfWork,

    private readonly sequelize: Sequelize,
  ) {}

  // ============================================================
  // SCOPE CATEGORIES
  // ============================================================

  async createCategory(dto: CreateScopeCategoryDto) {
    return this.scopeCategoryModel.create(dto as any);
  }

  async findAllCategories() {
    return this.scopeCategoryModel.findAll({
      where: {
        isActive: true,
      },
      order: [['sortOrder', 'ASC']],
    });
  }

  async findCategoryById(id: string) {
    const category = await this.scopeCategoryModel.findByPk(id);

    if (!category) {
      throw new NotFoundException('Scope category not found');
    }

    return category;
  }

  async updateCategory(id: string, dto: UpdateScopeCategoryDto) {
    const category = await this.findCategoryById(id);

    await category.update(dto as any);

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.findCategoryById(id);

    await category.destroy();

    return {
      message: 'Scope category deleted successfully',
    };
  }

  // ============================================================
  // PROJECT SPACES
  // ============================================================

  async createProjectSpace(projectId: string, dto: CreateProjectSpaceDto) {
    return this.projectSpaceModel.create({
      ...dto,
      projectId,
    } as any);
  }

  async getProjectSpaces(projectId: string) {
    return this.projectSpaceModel.findAll({
      where: {
        projectId,
        isActive: true,
      },
      order: [['sortOrder', 'ASC']],
    });
  }

  async getProjectSpaceById(id: string) {
    const space = await this.projectSpaceModel.findByPk(id);

    if (!space) {
      throw new NotFoundException('Project space not found');
    }

    return space;
  }

  async updateProjectSpace(id: string, dto: UpdateProjectSpaceDto) {
    const space = await this.getProjectSpaceById(id);

    await space.update(dto as any);

    return space;
  }

  async deleteProjectSpace(id: string) {
    const space = await this.getProjectSpaceById(id);

    await space.destroy();

    return {
      message: 'Project space deleted successfully',
    };
  }

  // ============================================================
  // PROJECT SCOPE CATEGORIES
  // ============================================================

  async addCategoryToProject(
    projectId: string,
    dto: CreateProjectScopeCategoryDto,
  ) {
    return this.projectScopeCategoryModel.create({
      ...dto,
      projectId,
    } as any);
  }

  async getProjectCategories(projectId: string) {
    return this.projectScopeCategoryModel.findAll({
      where: {
        projectId,
        isActive: true,
      },
      include: [
        {
          model: ScopeCategory,
        },
      ],
      order: [['sortOrder', 'ASC']],
    });
  }

  async removeCategoryFromProject(id: string) {
    const record = await this.projectScopeCategoryModel.findByPk(id);

    if (!record) {
      throw new NotFoundException('Project scope category not found');
    }

    await record.destroy();

    return {
      message: 'Scope category removed from project',
    };
  }

  // ============================================================
  // SCOPE ITEMS
  // ============================================================

  /**
   * Create an individual scope item.
   *
   * This method now stores:
   *
   * scopeOfWork = actual scope item text
   *
   * scopeOfWorkId = parent Scope Of Work document
   */
  async createScopeItem(projectId: string, dto: CreateScopeItemDto) {
    if (!dto.scopeOfWork?.trim()) {
      throw new BadRequestException('Scope of work description is required');
    }

    // ----------------------------------------------------------
    // Validate parent Scope Of Work
    // ----------------------------------------------------------

    const scopeOfWork = await this.scopeOfWorkModel.findOne({
      where: {
        id: dto.scopeOfWorkId,
        projectId,
      },
    });

    if (!scopeOfWork) {
      throw new NotFoundException(
        `Scope of work ${dto.scopeOfWorkId} not found for project ${projectId}`,
      );
    }

    // ----------------------------------------------------------
    // Validate Project Space
    // ----------------------------------------------------------

    const projectSpace = await this.projectSpaceModel.findOne({
      where: {
        id: dto.projectSpaceId,
        projectId,
      },
    });

    if (!projectSpace) {
      throw new NotFoundException(
        `Project space ${dto.projectSpaceId} does not belong to project ${projectId}`,
      );
    }

    // ----------------------------------------------------------
    // Validate Category
    // ----------------------------------------------------------

    const category = await this.scopeCategoryModel.findByPk(
      dto.scopeCategoryId,
    );

    if (!category) {
      throw new NotFoundException(
        `Scope category ${dto.scopeCategoryId} not found`,
      );
    }

    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    return this.scopeItemModel.create({
      projectId,

      scopeOfWorkId: scopeOfWork.id,

      scopeOfWork: dto.scopeOfWork.trim(),

      projectSpaceId: dto.projectSpaceId,

      scopeCategoryId: dto.scopeCategoryId,

      isIncluded: dto.isIncluded !== false,

      isExcluded: dto.isExcluded === true,

      notes: dto.notes?.trim() || undefined,

      sortOrder: dto.sortOrder ?? 0,
    } as any);
  }

  // ============================================================
  // GET SCOPE ITEMS
  // ============================================================

  async getScopeItems(projectId: string) {
    return this.scopeItemModel.findAll({
      where: {
        projectId,
      },
      include: [
        {
          model: ScopeOfWork,
          as: 'scopeOfWorkDocument',
        },
        {
          model: ProjectSpace,
        },
        {
          model: ScopeCategory,
        },
      ],
      order: [['sortOrder', 'ASC']],
    });
  }

  // ============================================================
  // GET SCOPE ITEM BY ID
  // ============================================================

  async getScopeItemById(id: string) {
    const item = await this.scopeItemModel.findByPk(id, {
      include: [
        {
          model: ScopeOfWork,
          as: 'scopeOfWorkDocument',
        },
        {
          model: ProjectSpace,
        },
        {
          model: ScopeCategory,
        },
      ],
    });

    if (!item) {
      throw new NotFoundException('Scope item not found');
    }

    return item;
  }

  // ============================================================
  // UPDATE SCOPE ITEM
  // ============================================================

  async updateScopeItem(id: string, dto: UpdateScopeItemDto) {
    const item = await this.getScopeItemById(id);

    // ----------------------------------------------------------
    // Validate parent Scope Of Work if changed
    // ----------------------------------------------------------

    if (dto.scopeOfWorkId) {
      const scopeOfWork = await this.scopeOfWorkModel.findOne({
        where: {
          id: dto.scopeOfWorkId,
          projectId: item.projectId,
        },
      });

      if (!scopeOfWork) {
        throw new NotFoundException(
          `Scope of work ${dto.scopeOfWorkId} does not belong to project ${item.projectId}`,
        );
      }
    }

    // ----------------------------------------------------------
    // Validate Project Space if changed
    // ----------------------------------------------------------

    if (dto.projectSpaceId) {
      const projectSpace = await this.projectSpaceModel.findOne({
        where: {
          id: dto.projectSpaceId,
          projectId: item.projectId,
        },
      });

      if (!projectSpace) {
        throw new NotFoundException(
          `Project space ${dto.projectSpaceId} does not belong to project ${item.projectId}`,
        );
      }
    }

    // ----------------------------------------------------------
    // Validate Category if changed
    // ----------------------------------------------------------

    if (dto.scopeCategoryId) {
      const category = await this.scopeCategoryModel.findByPk(
        dto.scopeCategoryId,
      );

      if (!category) {
        throw new NotFoundException(
          `Scope category ${dto.scopeCategoryId} not found`,
        );
      }
    }

    // ----------------------------------------------------------
    // Normalize text
    // ----------------------------------------------------------

    const updateData: any = {
      ...dto,
    };

    if (dto.scopeOfWork !== undefined) {
      if (!dto.scopeOfWork.trim()) {
        throw new BadRequestException(
          'Scope of work description cannot be empty',
        );
      }

      updateData.scopeOfWork = dto.scopeOfWork.trim();
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes?.trim() || null;
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    await item.update(updateData);

    return this.getScopeItemById(id);
  }

  // ============================================================
  // DELETE SCOPE ITEM
  // ============================================================

  async deleteScopeItem(id: string) {
    const item = await this.getScopeItemById(id);

    await item.destroy();

    return {
      message: 'Scope item deleted successfully',
    };
  }

  // ============================================================
  // BASIC SCOPE OF WORK
  // ============================================================

  async createScopeOfWork(projectId: string, dto: CreateScopeOfWorkDto) {
    return this.scopeOfWorkModel.create({
      ...dto,
      projectId,
    } as any);
  }

  // ============================================================
  // CREATE COMPLETE SCOPE OF WORK
  // ============================================================

  async createCompleteScopeOfWork(
    projectId: string,
    dto: CreateCompleteScopeOfWorkDto,
  ) {
    return this.sequelize.transaction(async (transaction) => {
      // ======================================================
      // 1. CREATE PARENT SCOPE OF WORK
      // ======================================================

      const scopeOfWork = await this.scopeOfWorkModel.create(
        {
          projectId,

          scopeSummary: dto.scopeSummary?.trim() || undefined,

          specificExclusions: dto.specificExclusions?.trim() || undefined,

          notes: dto.notes?.trim() || undefined,

          projectMode: dto.projectMode?.trim() || undefined,

          version: dto.version ?? 1,

          status: dto.status?.trim() || 'DRAFT',
        } as any,
        {
          transaction,
        },
      );

      // ======================================================
      // 2. CREATE PROJECT SPACES
      // ======================================================

      /**
       * Frontend sends:
       *
       * {
       *   clientId: "space-1",
       *   name: "Living Room"
       * }
       *
       * Backend creates:
       *
       * {
       *   id: "real-uuid"
       * }
       *
       * Then:
       *
       * spaceIdMap:
       * "space-1" -> "real-uuid"
       */

      const spaceIdMap = new Map<string, string>();

      const createdSpaces: ProjectSpace[] = [];

      for (let index = 0; index < dto.spaces.length; index++) {
        const space = dto.spaces[index];

        if (!space.name?.trim()) {
          throw new BadRequestException(`Space ${index + 1} is missing a name`);
        }

        if (!space.clientId?.trim()) {
          throw new BadRequestException(
            `Space ${index + 1} is missing clientId`,
          );
        }

        const slug =
          space.slug?.trim() ||
          space.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const createdSpace = await this.projectSpaceModel.create(
          {
            projectId,

            name: space.name.trim(),

            slug,

            description: space.description?.trim() || undefined,

            sortOrder: space.sortOrder ?? index + 1,

            isActive: true,
          } as any,
          {
            transaction,
          },
        );

        createdSpaces.push(createdSpace);

        spaceIdMap.set(space.clientId, createdSpace.id);
      }

      // ======================================================
      // 3. CREATE SCOPE ITEMS
      // ======================================================

      const createdItems: ScopeItem[] = [];

      for (let index = 0; index < dto.items.length; index++) {
        const item = dto.items[index];

        // ----------------------------------------------------
        // Validate scope text
        // ----------------------------------------------------

        if (!item.scopeOfWork?.trim()) {
          throw new BadRequestException(
            `Scope item ${index + 1} is missing scopeOfWork`,
          );
        }

        // ----------------------------------------------------
        // Validate category
        // ----------------------------------------------------

        if (!item.scopeCategoryId) {
          throw new BadRequestException(
            `Scope item ${index + 1} is missing scopeCategoryId`,
          );
        }

        const category = await this.scopeCategoryModel.findByPk(
          item.scopeCategoryId,
          {
            transaction,
          },
        );

        if (!category) {
          throw new NotFoundException(
            `Scope category not found: ${item.scopeCategoryId}`,
          );
        }

        // ----------------------------------------------------
        // Resolve project space
        // ----------------------------------------------------

        let projectSpaceId: string | undefined;

        if (item.projectSpaceId) {
          // First assume it is a real UUID
          projectSpaceId = item.projectSpaceId;

          // Then check if it is a frontend clientId
          const mappedId = spaceIdMap.get(item.projectSpaceId);

          if (mappedId) {
            projectSpaceId = mappedId;
          }
        }

        // ----------------------------------------------------
        // If no projectSpaceId was supplied, try clientId
        // ----------------------------------------------------

        if (!projectSpaceId) {
          throw new BadRequestException(
            `Scope item ${index + 1} is missing projectSpaceId`,
          );
        }

        // ----------------------------------------------------
        // Validate project space
        // ----------------------------------------------------

        const projectSpace = await this.projectSpaceModel.findOne({
          where: {
            id: projectSpaceId,
            projectId,
          },
          transaction,
        });

        if (!projectSpace) {
          throw new NotFoundException(
            `Project space ${projectSpaceId} does not belong to project ${projectId}`,
          );
        }

        // ----------------------------------------------------
        // INCLUDED / EXCLUDED
        // ----------------------------------------------------

        const isIncluded = item.isIncluded !== false;

        const isExcluded = item.isExcluded === true;

        // ----------------------------------------------------
        // Prevent contradictory state
        // ----------------------------------------------------

        if (isIncluded && isExcluded) {
          throw new BadRequestException(
            `Scope item ${index + 1} cannot be both included and excluded`,
          );
        }

        // ----------------------------------------------------
        // CREATE ITEM
        // ----------------------------------------------------

        const createdItem = await this.scopeItemModel.create(
          {
            projectId,

            // Parent Scope Of Work
            scopeOfWorkId: scopeOfWork.id,

            // Actual item text
            scopeOfWork: item.scopeOfWork.trim(),

            projectSpaceId,

            scopeCategoryId: item.scopeCategoryId,

            isIncluded,

            isExcluded,

            notes: item.notes?.trim() || undefined,

            sortOrder: item.sortOrder ?? index + 1,
          } as any,
          {
            transaction,
          },
        );

        createdItems.push(createdItem);
      }

      // ======================================================
      // 4. LOAD COMPLETE DOCUMENT
      // ======================================================

      const completeScopeOfWork = await this.scopeOfWorkModel.findByPk(
        scopeOfWork.id,
        {
          include: [
            {
              model: ScopeItem,
              include: [
                {
                  model: ScopeOfWork,
                  as: 'scopeOfWorkDocument',
                },
                {
                  model: ProjectSpace,
                },
                {
                  model: ScopeCategory,
                },
              ],
            },
          ],
          transaction,
        },
      );

      // ======================================================
      // 5. RETURN
      // ======================================================

      return {
        scopeOfWork: completeScopeOfWork,

        spaces: createdSpaces,

        items: createdItems,

        counts: {
          spaces: createdSpaces.length,

          items: createdItems.length,
        },
      };
    });
  }

  // ============================================================
  // GET ALL SCOPE OF WORK
  // ============================================================

  async getAllScopeOfWork() {
    return this.scopeOfWorkModel.findAll({
      include: [
        {
          model: ScopeItem,
          include: [
            {
              model: ProjectSpace,
            },
            {
              model: ScopeCategory,
            },
          ],
        },
      ],
      order: [
        ['version', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  // ============================================================
  // GET SCOPE OF WORK BY ID
  // ============================================================

  async getScopeOfWorkById(id: string) {
    const scope = await this.scopeOfWorkModel.findByPk(id, {
      include: [
        // ========================================================
        // PROJECT
        // ========================================================
        {
          model: Project,
          as: 'project',
          include: [
            // ======================================================
            // CLIENT
            // ======================================================
            {
              model: Client,
              as: 'client',
            },

            // ======================================================
            // PROJECT TEAM MEMBERS
            // ======================================================
            {
              model: TeamMember,
              as: 'team_members',
              include: [
                {
                  model: User,
                  as: 'user',
                },
              ],
            },
          ],
        },

        // ========================================================
        // SCOPE ITEMS
        // ========================================================
        {
          model: ScopeItem,
          include: [
            {
              model: ProjectSpace,
            },
            {
              model: ScopeCategory,
            },
          ],
        },

        // ========================================================
        // PREPARED BY
        // ========================================================
        {
          model: User,
          as: 'preparedByUser',
        },

        // ========================================================
        // REVIEWED BY
        // ========================================================
        {
          model: User,
          as: 'reviewedByUser',
        },

        // ========================================================
        // ACCEPTED BY
        // ========================================================
        {
          model: User,
          as: 'acceptedByUser',
        },
      ],
    });

    if (!scope) {
      throw new NotFoundException('Scope of work not found');
    }

    return scope;
  }

  // ============================================================
  // UPDATE SCOPE OF WORK
  // ============================================================

  async updateScopeOfWork(id: string, dto: UpdateScopeOfWorkDto) {
    const scope = await this.getScopeOfWorkById(id);

    await scope.update(dto as any);

    return this.getScopeOfWorkById(id);
  }

  // ============================================================
  // DELETE SCOPE OF WORK
  // ============================================================

  async deleteScopeOfWork(id: string) {
    const scope = await this.getScopeOfWorkById(id);

    await scope.destroy();

    return {
      message: 'Scope of work deleted successfully',
    };
  }
}
