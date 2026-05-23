import { DaySelectionStatus, PeriodDurationType } from '@shared/enums';
import {
  DisplayIdentifiable,
  IIdentifiable,
} from '../../interfaces/identifiable.interface';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

export interface ITimePeriodQueryParams {
  schoolId: number;
  academicYearId?: number;
  levelId?: number;
  classId?: number;
}

export interface TimePeriod {
  id: number;
  schoolLevelId: number;
  isDeletable: boolean;
  academicYear: IIdentifiable;
  level: DisplayIdentifiable;
  class: DisplayIdentifiable;
  days: {
    id: number;
    dayOfWeek: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  durationNumber: string;
  endTime: string;
  startTime: string;
  periodDurationType: PeriodDurationType;
}

export interface ITimePeriodListItem {
  id: number;
  academicYearName: string;
  academicYearId: number;
  className: string;
  classId: number;
  levelName: string;
  levelId: number;
  isDeletable: boolean;
  createdAt: string;
}

export interface ITimePeriodPayload {
  schoolId: number;
  academicYearId: number;
  levelId: number;
  classId: number;
  daysOfWeek: number[];
  periodDurations: IPeriodDurationPayload[];
}

export interface IPeriodDurationPayload {
  id?: number;
  startTime: string;
  endTime: string;
  durationType: PeriodDurationType;
}

export interface TimePeriodDetail {
  id: number;
  schoolLevelId: number;
  company: DisplayIdentifiable;
  campus: DisplayIdentifiable;
  school: DisplayIdentifiable;
  level: DisplayIdentifiable;
  class: DisplayIdentifiable;
  days: {
    id: number;
    dayOfWeek: number;
  }[];
  academicYear: IIdentifiable;
  createdAt: string;
  updatedAt: string;
  periods: PeriodDetail[];
}

export interface PeriodDetail {
  id: number;
  endTime: string;
  duration: number;
  tenantId: number;
  startTime: string;
  durationType: PeriodDurationType;
  periodNumber: number;
  timePeriodId: number;
}

export interface ITimePeriodUpdatePayload {
  updatePeriod?: {
    id: number;
    startTime: string;
    endTime: string;
    durationType: PeriodDurationType;
  };
  periodDurations?: IPeriodDurationPayload[];
  daysOfWeek?: number[];
}
export interface IValidateDaysOfWeek {
  id: number;
  dayOfWeek: number;
  timePeriodId: number;
}

export type durationForm = FormGroup<{
  durationNumber: FormControl<string>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
  periodDurationType: FormControl<PeriodDurationType>;
}>;

export type durationsForm = FormArray<durationForm>;

export type IDaySelection = {
  value: number;
  key: string;
  status: DaySelectionStatus;
};
