import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';

import { ProjectMaterial } from '../models/project-materials.model';
import { InventoryRequest } from '../models/inventory-request.model';
import { CreateProjectMaterialDto } from '../dto/create-material.dto';
import { UpdateProjectMaterialDto } from '../dto/update-material';

@Injectable()
export class ProjectMaterialService {
  constructor(
    @InjectModel(ProjectMaterial)
    private projectMaterialModel: typeof ProjectMaterial,

    @InjectModel(InventoryRequest)
    private requestModel: typeof InventoryRequest,
  ) {}

  async createProjectMaterial(dto: CreateProjectMaterialDto) {
    const itemName = dto.item_name?.trim();

    const existing = await this.projectMaterialModel.findOne({
      where: {
        project_id: dto.project_id,
        item_name: itemName,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Material "${itemName}" already exists for this project`,
      );
    }

    return this.projectMaterialModel.create({
      id: uuid(),
      item_name: itemName,
      project_id: dto.project_id,
      inventory_master_id: dto.inventory_master_id ?? null,
      item_code: dto.item_code?.trim() || null,
      description: dto.description?.trim() || null,
      specification: dto.specification?.trim() || null,
      unit_id: dto.unit_id ?? null,
      brand_id: dto.brand_id ?? null,
      quantity_estimated: dto.quantity_estimated ?? 0,
      quantity_required: dto.quantity_required ?? 0,
      quantity_received: dto.quantity_received ?? 0,
      quantity_used: dto.quantity_used ?? 0,
      rate: dto.rate ?? null,
      gst_percent: dto.gst_percent ?? 18,
      status: dto.status ?? 'planned',
      remarks: dto.remarks?.trim() || null,
      category: dto.category?.trim() || null,
    });
  }

  async updateProjectMaterial(id: string, dto: UpdateProjectMaterialDto) {
    const material = await this.findProjectMaterialById(id);

    if (dto.item_name) {
      const itemName = dto.item_name.trim();

      const existing = await this.projectMaterialModel.findOne({
        where: {
          project_id: material.project_id,
          item_name: itemName,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Material "${itemName}" already exists for this project`,
        );
      }
    }

    return material.update({
      ...(dto.item_name && { item_name: dto.item_name.trim() }),
      ...(dto.inventory_master_id !== undefined && {
        inventory_master_id: dto.inventory_master_id,
      }),
      ...(dto.item_code !== undefined && {
        item_code: dto.item_code?.trim() ?? null,
      }),
      ...(dto.description !== undefined && {
        description: dto.description?.trim() ?? null,
      }),
      ...(dto.specification !== undefined && {
        specification: dto.specification?.trim() ?? null,
      }),
      ...(dto.unit_id !== undefined && { unit_id: dto.unit_id }),
      ...(dto.brand_id !== undefined && { brand_id: dto.brand_id }),
      ...(dto.quantity_estimated !== undefined && {
        quantity_estimated: dto.quantity_estimated,
      }),
      ...(dto.quantity_required !== undefined && {
        quantity_required: dto.quantity_required,
      }),
      ...(dto.quantity_received !== undefined && {
        quantity_received: dto.quantity_received,
      }),
      ...(dto.quantity_used !== undefined && {
        quantity_used: dto.quantity_used,
      }),
      ...(dto.rate !== undefined && { rate: dto.rate }),
      ...(dto.gst_percent !== undefined && { gst_percent: dto.gst_percent }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.remarks !== undefined && {
        remarks: dto.remarks?.trim() ?? null,
      }),
      ...(dto.category !== undefined && {
        category: dto.category?.trim() ?? null,
      }),
    });
  }

  async deleteProjectMaterial(id: string) {
    const material = await this.findProjectMaterialById(id);

    const usedInRequests = await this.requestModel.count({
      where: { project_material_id: id },
    });

    if (usedInRequests > 0) {
      throw new BadRequestException(
        'Cannot delete material: It is referenced by inventory requests',
      );
    }

    await material.destroy();
    return { message: 'Project material deleted successfully' };
  }

  async findAllProjectMaterials() {
    return this.projectMaterialModel.findAll({
      include: ['project', 'inventoryMaster', 'unit', 'brand'],
    });
  }

  async findProjectMaterialsByProject(projectId: string) {
    return this.projectMaterialModel.findAll({
      where: { project_id: projectId },
      include: ['project', 'inventoryMaster', 'unit', 'brand'],
      order: [['item_name', 'ASC']],
    });
  }

  async findProjectMaterialById(id: string) {
    const material = await this.projectMaterialModel.findByPk(id, {
      include: ['project', 'inventoryMaster', 'unit', 'brand'],
    });

    if (!material) throw new NotFoundException('Project material not found');
    return material;
  }

  async getProjectMaterialSummary(projectId: string) {
    const materials = await this.projectMaterialModel.findAll({
      where: { project_id: projectId },
    });

    return {
      totalMaterials: materials.length,
      estimatedQty: materials.reduce(
        (sum, m) => sum + Number(m.quantity_estimated || 0),
        0,
      ),
      requiredQty: materials.reduce(
        (sum, m) => sum + Number(m.quantity_required || 0),
        0,
      ),
      receivedQty: materials.reduce(
        (sum, m) => sum + Number(m.quantity_received || 0),
        0,
      ),
      usedQty: materials.reduce(
        (sum, m) => sum + Number(m.quantity_used || 0),
        0,
      ),
    };
  }

  async getProjectInventoryValue(projectId: string) {
    const materials = await this.projectMaterialModel.findAll({
      where: { project_id: projectId },
    });

    const totalValue = materials.reduce((sum, item) => {
      return sum + Number(item.quantity_required || 0) * Number(item.rate || 0);
    }, 0);

    return { projectId, totalValue };
  }

  async getProjectMaterialStatus(projectId: string) {
    const materials = await this.projectMaterialModel.findAll({
      where: { project_id: projectId },
    });

    return {
      planned: materials.filter((m) => m.status === 'planned').length,
      ordered: materials.filter((m) => m.status === 'ordered').length,
      received: materials.filter((m) => m.status === 'received').length,
      inUse: materials.filter((m) => m.status === 'in_use').length,
      closed: materials.filter((m) => m.status === 'closed').length,
    };
  }

  async getPendingMaterials(projectId?: string) {
    const where: any = {
      status: { [Op.in]: ['planned', 'ordered'] },
    };

    if (projectId) {
      where.project_id = projectId;
    }

    return this.projectMaterialModel.findAll({
      where,
      include: ['project', 'inventoryMaster', 'unit', 'brand'],
    });
  }

  async getMaterialConsumption(projectId: string) {
    const materials = await this.projectMaterialModel.findAll({
      where: { project_id: projectId },
      include: ['inventoryMaster'],
    });

    return materials.map((m) => ({
      id: m.id,
      itemName: m.item_name,
      estimated: m.quantity_estimated,
      required: m.quantity_required,
      received: m.quantity_received,
      used: m.quantity_used,
      balance: Number(m.quantity_received || 0) - Number(m.quantity_used || 0),
    }));
  }

  async countByProject(projectId: string) {
    return this.projectMaterialModel.count({
      where: { project_id: projectId },
    });
  }

  async countTotal() {
    return this.projectMaterialModel.count();
  }
}
