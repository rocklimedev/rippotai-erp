// common/enums/project-planner.enum.ts

export enum ProjectPlannerType {
  CONSULTANCY = 'CONSULTANCY',
  VENDOR_PROCUREMENT = 'VENDOR_PROCUREMENT',
  PMC = 'PMC',
}

export enum ProjectPhaseModule {
  CONSULTANCY = 'CONSULTANCY',
  PMC = 'PMC',
  DOCUMENTS = 'DOCUMENTS',
}

export enum PlannerItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum PlannerLocationType {
  FLOOR = 'FLOOR',
  ROOM = 'ROOM',
  ZONE = 'ZONE',
  AREA = 'AREA',
}

export enum ProcurementItemType {
  MATERIAL = 'MATERIAL',
  LABOUR = 'LABOUR',
}
