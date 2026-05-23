export interface EscalationTypeDetailsDTO {
  supportType: SupportTypeDTO;
  escalations: EscalationLevelDTO[];
}

export interface SupportTypeDTO {
  id: number;
  arName: string;
  enName: string;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface EscalationLevelDTO {
  id: number;
  schoolId: number;
  supportTypeId: number;
  days: string;
  tenantId: number;
  levelNumber: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  personnels: EscalationPersonnelDTO[];
}

export interface EscalationPersonnelDTO {
  id: number;
  user: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
}
