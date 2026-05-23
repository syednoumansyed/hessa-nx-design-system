import { FullNameLocalizedEntity } from '@shared/dto-transformation/shared/localized-entity.interface';

export enum DelegateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface DelegateStudent {
  id: number;
  studentId: number;
  displayName: string;
  arFullName: string;
  enFullName: string;
  levelId: number;
  arLevelName: string;
  enLevelName: string;
  levelName: string;
  classId: number;
  arClassName: string;
  enClassName: string;
  className: string;
}

export interface Delegate extends FullNameLocalizedEntity {
  id: number;
  nationalId: string;
  key: string | null;
  url: string | null;
  expiryDate: string;
  status: DelegateStatus;
  students: DelegateStudent[];
  qrCode: string | null;
  guardianId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDelegatePayload {
  enFullName: string;
  arFullName: string;
  nationalId: string;
  expiryDate: number;
  key: string;
  studentIds: number[];
}

export interface UpdateDelegatePayload {
  id: number;
  enFullName?: string;
  arFullName?: string;
  nationalId?: string;
  expiryDate?: number;
  key?: string;
  studentIds?: number[];
}

export interface ToggleDelegateStatusPayload {
  status: DelegateStatus;
}

export interface FileUploadResponse {
  imageUrl: string;
  key: string;
}
