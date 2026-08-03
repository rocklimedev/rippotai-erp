import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';

import { BrandService } from './services/brand.service';
import { InventoryRequestService } from './services/inventory-request.service';
import { InventoryDispatchService } from './services/inventory-dispatch.service';
import { ProjectMaterialService } from './services/project-material.service';

import { CreateInventoryRequestDto } from './dto/create-inventory-request.dto';
import { UpdateInventoryRequestDto } from './dto/update-inventory-request.dto';

import { CreateInventoryDispatchDto } from './dto/create-inventory-dispatch.dto';
import { UpdateInventoryDispatchDto } from './dto/update-inventory-dispatch.dto';

import { CreateInventoryMasterDto } from './dto/create-inventory-master.dto';
import { UpdateInventoryMasterDto } from './dto/update-inventory-master.dto';

import { CreateProjectMaterialDto } from './dto/create-material.dto';
import { UpdateProjectMaterialDto } from './dto/update-material';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,

    private readonly brandService: BrandService,
    private readonly requestService: InventoryRequestService,
    private readonly dispatchService: InventoryDispatchService,
    private readonly projectMaterialService: ProjectMaterialService,
  ) {}

  // ====================== INVENTORY REQUESTS ======================

  @Post('requests')
  createRequest(@Body() dto: CreateInventoryRequestDto) {
    return this.requestService.createRequest(dto);
  }

  @Get('requests')
  findAllRequests() {
    return this.requestService.findAllRequests();
  }

  @Get('requests/pending')
  getPendingRequests() {
    return this.requestService.getPendingRequests();
  }

  @Get('requests/:id')
  findRequest(@Param('id') id: string) {
    return this.requestService.findRequestById(id);
  }

  @Put('requests/:id')
  updateRequest(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryRequestDto,
  ) {
    return this.requestService.updateRequest(id, dto);
  }

  @Delete('requests/:id')
  deleteRequest(@Param('id') id: string) {
    return this.requestService.deleteRequest(id);
  }

  @Get('project/:projectId/requests')
  getRequestsByProject(@Param('projectId') projectId: string) {
    return this.requestService.getRequestsByProject(projectId);
  }

  // ====================== INVENTORY DISPATCHES ======================

  @Post('dispatches')
  createDispatch(@Body() dto: CreateInventoryDispatchDto) {
    return this.dispatchService.createDispatch(dto);
  }

  @Get('dispatches')
  findAllDispatches() {
    return this.dispatchService.findAllDispatches();
  }

  @Get('dispatches/:id')
  findDispatch(@Param('id') id: string) {
    return this.dispatchService.findDispatchById(id);
  }

  @Put('dispatches/:id')
  updateDispatch(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDispatchDto,
  ) {
    return this.dispatchService.updateDispatch(id, dto);
  }

  @Delete('dispatches/:id')
  deleteDispatch(@Param('id') id: string) {
    return this.dispatchService.deleteDispatch(id);
  }

  // ====================== INVENTORY MASTER ======================

  @Post('master')
  createMaster(@Body() dto: CreateInventoryMasterDto) {
    return this.inventoryService.createMaster(dto);
  }

  @Get('master')
  findAllMaster() {
    return this.inventoryService.findAllMaster();
  }

  @Get('master/search/:query')
  searchInventory(@Param('query') query: string) {
    return this.inventoryService.searchInventory(query);
  }

  @Get('master/:id')
  findMaster(@Param('id') id: string) {
    return this.inventoryService.findMasterById(id);
  }

  @Put('master/:id')
  updateMaster(@Param('id') id: string, @Body() dto: UpdateInventoryMasterDto) {
    return this.inventoryService.updateMaster(id, dto);
  }

  @Delete('master/:id')
  deleteMaster(@Param('id') id: string) {
    return this.inventoryService.deleteMaster(id);
  }

  // ====================== PROJECT MATERIALS ======================

  @Post('projects/materials')
  createProjectMaterial(@Body() dto: CreateProjectMaterialDto) {
    return this.projectMaterialService.createProjectMaterial(dto);
  }

  @Get('materials')
  findAllProjectMaterials() {
    return this.projectMaterialService.findAllProjectMaterials();
  }

  @Get('materials/pending')
  getPendingMaterials() {
    return this.projectMaterialService.getPendingMaterials();
  }

  @Get('materials/:id')
  findProjectMaterial(@Param('id') id: string) {
    return this.projectMaterialService.findProjectMaterialById(id);
  }

  @Put('projects/materials/:id')
  updateProjectMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateProjectMaterialDto,
  ) {
    return this.projectMaterialService.updateProjectMaterial(id, dto);
  }

  @Delete('projects/materials/:id')
  deleteProjectMaterial(@Param('id') id: string) {
    return this.projectMaterialService.deleteProjectMaterial(id);
  }

  @Get('projects/:projectId/materials')
  findProjectMaterialsByProject(@Param('projectId') projectId: string) {
    return this.projectMaterialService.findProjectMaterialsByProject(projectId);
  }

  @Get('projects/:projectId/materials/summary')
  getProjectMaterialSummary(@Param('projectId') projectId: string) {
    return this.projectMaterialService.getProjectMaterialSummary(projectId);
  }

  @Get('projects/:projectId/materials/status')
  getProjectMaterialStatus(@Param('projectId') projectId: string) {
    return this.projectMaterialService.getProjectMaterialStatus(projectId);
  }

  @Get('projects/:projectId/materials/consumption')
  getMaterialConsumption(@Param('projectId') projectId: string) {
    return this.projectMaterialService.getMaterialConsumption(projectId);
  }

  @Get('projects/:projectId/materials/value')
  getProjectInventoryValue(@Param('projectId') projectId: string) {
    return this.projectMaterialService.getProjectInventoryValue(projectId);
  }

  @Get('projects/:projectId/materials/pending')
  getProjectPendingMaterials(@Param('projectId') projectId: string) {
    return this.projectMaterialService.getPendingMaterials(projectId);
  }

  // ====================== DASHBOARD ======================

  @Get('dashboard')
  getInventoryDashboard() {
    return this.inventoryService.getInventoryDashboard();
  }

  @Get('projects/:projectId/dashboard')
  getProjectInventoryDashboard(@Param('projectId') projectId: string) {
    return this.inventoryService.getProjectInventoryDashboard(projectId);
  }

  // ====================== BRANDS ======================

  @Post('brands')
  createBrand(@Body() body: { name: string }) {
    return this.brandService.createBrand(body.name);
  }

  @Get('brands')
  findAllBrands() {
    return this.brandService.findAllBrands();
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.brandService.deleteBrand(id);
  }
}
