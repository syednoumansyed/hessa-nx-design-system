import { DaySelectionStatus, PeriodDurationType } from '@shared/enums';
import { IIdentifiable } from '../../interfaces/identifiable.interface';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { NameLocalizedEntityDTO } from '../shared/localized-entity.interface';

export interface TimePeriodDTO {
  id: number;
  tenantId: number;
  schoolLevelId: number;
  isDeletable: boolean;
  academicYear: IIdentifiable;
  level: NameLocalizedEntityDTO;
  class: NameLocalizedEntityDTO;
  days: {
    id: number;
    dayOfWeek: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PeriodDTO {
  durationNumber: string;
  endTime: string;
  startTime: string;
  periodDurationType: PeriodDurationType;
}

export interface TimePeriodDetailDTO {
  id: number;
  tenantId: number;
  schoolLevelId: number;
  company: NameLocalizedEntityDTO;
  campus: NameLocalizedEntityDTO;
  school: NameLocalizedEntityDTO;
  level: NameLocalizedEntityDTO;
  class: NameLocalizedEntityDTO;
  days: {
    id: number;
    dayOfWeek: number;
  }[];
  academicYear: IIdentifiable;
  createdAt: string;
  updatedAt: string;
  periods: PeriodDetailDTO[];
}

export interface PeriodDetailDTO {
  id: number;
  endTime: string;
  duration: number;
  tenantId: number;
  startTime: string;
  durationType: PeriodDurationType;
  periodNumber: number;
  timePeriodId: number;
}

export interface ValidateDaysOfWeekDTO {
  id: number;
  dayOfWeek: number;
  timePeriodId: number;
}
