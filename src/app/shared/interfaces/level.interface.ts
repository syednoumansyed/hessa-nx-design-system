import { ClassDTO } from './class.interface';
import { ICreatedBy, IUpdatedBy } from './created-by.interface';

export interface ILevelPayload {
  levelIds: number[];
}

export interface ILevel {
  id: number;
  schoolLevelId: number;
  schoolId: number;
  name: string;
  tenantId: number;
  hasAccess: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: ICreatedBy;
  updatedBy?: number | null | IUpdatedBy;
  classes?: ClassDTO[];
  level?: {
    id: number;
    name: string;
  };
  levelId: number;
}
