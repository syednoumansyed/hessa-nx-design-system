import { IResponse } from '@shared/interfaces';

export interface CreateEscalationRequest {
  supportTypeId: number;
  schoolId: number;
  days: string;
  personnelIds: number[];
}

export interface UpdateEscalationRequest {
  personnelIds: number[];
}

export interface EscalationPersonnel {
  personnelId: number;
  displayName: string;
}

export interface EscalationLevel {
  id: number;
  days: string;
  levelNumber: number;
  personnels: EscalationPersonnel[];
}

export interface EscalationTypeDetails {
  supportType: {
    id: number;
    displayName: string;
  };
  escalations: EscalationLevel[];
}
