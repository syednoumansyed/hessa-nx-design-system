import { BaseSchoolStructureItem } from '@layout/layout.component';

export type DsSchoolStructureEntityType =
  | 'school'
  | 'campus'
  | 'company'
  | 'sub-company'
  | 'level'
  | 'class';

export interface DsSchoolStructureItem extends BaseSchoolStructureItem {
  type: DsSchoolStructureEntityType;
  schoolLevelId?: number;
  children: DsSchoolStructureItem[];
}

export interface DsSchoolStructureControlItem extends DsSchoolStructureItem {
  children: DsSchoolStructureControlItem[];
  parent: DsSchoolStructureControlItem | null;
  isExpanded: boolean;
}

export type DsSchoolStructureControlValue = {
  id: number;
  type: DsSchoolStructureEntityType | 'school_level';
  name?: string;
};
