import { IPaginatedResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardColumnTypeEnum,
  ReportCardHorizontalFunctionEnum,
} from './report-card-configuration.enum';
import { SubjectWithMaxMarks } from './report-card-configuration.model';

export interface ReportCardSubject extends SubjectWithMaxMarks {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
  levelDisplayNames: string;
  levelIds: number[];
}

export interface ManageReportCardList {
  id: ObjId;
  title: string;
  levels: Array<DisplayIdentifiable>;
  semesters: Array<{ id: ObjId; name: string }>;
  academicYears: Array<{ id: ObjId; name: string }>;
  schools: Array<DisplayIdentifiable>;
  startDate: string;
  endDate: string;
  semesterId: ObjId | null;
  academicYearId: ObjId;
}
export interface ReportCardDetail {
  id: ObjId;
  title: string;
  academicYearId: number;
  startDate: string;
  endDate: string;
  levels: DisplayIdentifiable[];
  semesters: Array<{ id: number; name: string }>;
  academicYear: { id: number; name: string };
  schoolId: number;
  displaySchool: string;
  columns: ReportCardColumnDetail[];
  existingColumns: ReportCardExistingColumn[];
  sortedColumns: SortedColumn[];
  semester: { id: number; name: string } | null;
  semesterId: number | null;
}

export interface ReportCardExistingColumn {
  id: number;
  title: string;
  scaleMaxMarks: number | null;
  reportCardColumnId: number;
  reportCardId?: ObjId;
  createdAt: string;
}

export interface ReportCardColumnDetail {
  id: number;
  title: string;
  scaleTo: number | null;
  maxMarks: number;
  subjects: ReportCardSubject[];
  aggregate: boolean;
  columnType: ReportCardColumnTypeEnum;
  maxEntries: number;
  minEntries: number;
  functionType:
    | ReportCardCalculatedFunctionEnum
    | ReportCardHorizontalFunctionEnum;
  sumAggregate: boolean;
  selectedColumns: Array<{ id: ObjId; title: string }> | null;
  isHide?: boolean;
}

export type ManageReportCardListResponse = IPaginatedResponse<
  ManageReportCardList[]
>;

export type ReportCardSubjectResponse = ReportCardSubject[];

export interface SortedColumn {
  id: number;
  title: string;
  scaleTo?: number | null;
  maxMarks?: number | null;
  sequence: number;
  subjects?: ReportCardSubject[];
  columnType?: string;
  maxEntries?: number | null;
  minEntries?: number | null;
  functionType?: string | null;
  sumAggregate?: boolean;
  selectedColumns: Array<{ id: ObjId; title: string }>;
  isExistingColumn: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  scaleMaxMarks?: number;
  reportCardColumnId?: number;
  isCalculatePercentage: boolean;
  isCalculateGpa: boolean;
  isHide?: boolean;
}
