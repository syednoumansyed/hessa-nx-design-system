import { BaseSchoolStructureItem } from '@layout/layout.component';

export type SchoolStructureEntityType =
  | 'school'
  | 'campus'
  | 'company'
  | 'sub-company'
  | 'level'
  | 'class';
export interface SchoolStructureItem extends BaseSchoolStructureItem {
  type: SchoolStructureEntityType;
  schoolLevelId?: number; // Optional, only present for 'level' type
  children: SchoolStructureItem[];
}
export interface SchoolStructureControlItem extends SchoolStructureItem {
  children: SchoolStructureControlItem[];
  parent: SchoolStructureControlItem | null;
  isExpended: boolean;
}

export type SchoolStructureControlValue = {
  id: number;
  type: SchoolStructureEntityType | 'school_level';
};
