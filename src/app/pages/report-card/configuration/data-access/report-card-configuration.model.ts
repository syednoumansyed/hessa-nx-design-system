import {
  IPaginatedResponse,
  IPaginationParams,
  IResponse,
} from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardColumnTypeEnum,
  ReportCardHorizontalFunctionEnum,
} from './report-card-configuration.enum';
import { STUDENT_REPORT_CARD_STATUS } from '@pages/report-card/processing/data-access/report-card-list.enum';
import { NameLocalizedIdentifiableDTO } from '@shared/dto-transformation';

export interface ReportCardDetailDTO {
  id: ObjId;
  title: string;
  academicYearId: number;
  startDate: string;
  endDate: string;
  levels: Array<NameLocalizedIdentifiableDTO>;
  semesters: Array<{ id: number; name: string }> | null;
  academicYear: { id: number; name: string };
  school: NameLocalizedIdentifiableDTO;
  columns: ReportCardColumnDetailDTO[] | null;
  existingColumns: ReportCardExistingColumnDTO[] | null;
  sortedColumns: SortedColumnDTO[];
}

export interface SortedColumnDTO {
  id: number;
  title: string;
  scaleTo?: number | null;
  maxMarks?: number | null;
  sequence: number;
  subjects?: ReportCardSubjectDTO[];
  columnType?: string;
  maxEntries?: number | null;
  minEntries?: number | null;
  functionType?: string | null;
  sumAggregate?: boolean;
  selectedColumns?: Array<{ id: ObjId; title: string }> | null;
  isExistingColumn: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  scaleMaxMarks?: number;
  reportCardColumnId?: number;
  isCalculatePercentage: boolean;
  isCalculateGpa: boolean;
  isHide?: boolean;
}

export type ReportCardDetailDTOResponse = IResponse<ReportCardDetailDTO>;
export interface ManageReportCardListDTO {
  id: ObjId;
  title: string;
  levels: Array<NameLocalizedIdentifiableDTO>;
  semesters: Array<{ id: ObjId; name: string }>;
  academicYears: Array<{ id: ObjId; name: string }>;
  schools: Array<NameLocalizedIdentifiableDTO>;
  startDate: string;
  endDate: string;
  semesterId: ObjId | null;
  academicYearId: ObjId;
}

export type ManageReportCardListDTOResponse = IPaginatedResponse<
  ManageReportCardListDTO[]
>;
export interface SchoolSctructureEntityDTO {
  entityId: number;
  type: 'school';
  name?: string;
  parentId?: string | null;
}

export type CourseListParams = {
  levelId?: ObjId;
  academicYearId?: ObjId;
  schoolId?: ObjId;
  semesterId: ObjId;
  personnelId?: ObjId;
};

export type ReportCardListParams = {
  levelIds?: ObjId[];
  semesterid?: ObjId;
  academicYearId: ObjId;
  schoolId?: ObjId;
  status?: STUDENT_REPORT_CARD_STATUS;
} & IPaginationParams;

export interface ReportCardFormPayload {
  title: string;
  schoolId: number;
  levelIds: ObjId[];
  academicYearId: ObjId;
  semesterId: ObjId | null;
  startDate: string | Date;
  endDate: string | Date;
}

export interface ReportCardFormColumnPayload {
  title: string;
  reportCardId: ObjId;
  columnType: ReportCardColumnTypeEnum;
  functionType:
    | ReportCardCalculatedFunctionEnum
    | ReportCardHorizontalFunctionEnum;
  subjectIds: ObjId[];
  maxMarks: number;
  maxEntries: number;
}

export type ReportCardSubjectParams = {
  academicYearId: ObjId;
  levelIds: ObjId[];
  schoolId: ObjId;
};

export interface ReportCardSubjectDTO {
  id: number;
  arName: string;
  enName: string;
  levels: Array<NameLocalizedIdentifiableDTO>;
  maxMarks?: number | null;
}

export type ReportCardSubjectDTOResponse = IResponse<ReportCardSubjectDTO[]>;
// #region Column models

export interface SubjectWithMaxMarks {
  id: ObjId;
  maxMarks?: number | null;
}

export interface ReportCardColumnFormPayloadBase {
  title: string;
  reportCardId?: ObjId;
  subjectIds: SubjectWithMaxMarks[];
  subjects?: SubjectWithMaxMarks[]; // API response uses subjects
  columnType: ReportCardColumnTypeEnum;
}
export interface ReportCardCalculatedFormPayload extends ReportCardColumnFormPayloadBase {
  functionType: ReportCardCalculatedFunctionEnum;
  maxMarks: number | null;
  maxEntries: number | null;
  minEntries: number | null;
}

export interface ReportCardHorizontalFormPayload extends ReportCardColumnFormPayloadBase {
  functionType: ReportCardHorizontalFunctionEnum;
  aggregate?: boolean | null;
  sumAggregate?: boolean | null;
  selectedColumns?: ObjId[];
  scaleTo?: number | null;
  existingSelectedColumnIds?: ObjId[] | null;
  isCalculatePercentage: boolean;
  isCalculateGpa: boolean;
}

export interface ReportCardSignalEntryFormPayload extends ReportCardColumnFormPayloadBase {
  maxMarks?: number | null;
}
export type ReportCardColumnFormPayload =
  | ReportCardCalculatedFormPayload
  | ReportCardHorizontalFormPayload
  | ReportCardSignalEntryFormPayload;

export interface ReportCardColumnDetailDTO {
  id: number;
  title: string;
  scaleTo: number | null;
  maxMarks: number;
  subjects: ReportCardSubjectDTO[];
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

export interface ReportCardExistingColumnDTO {
  id: number;
  title: string;
  scaleMaxMarks: number | null;
  reportCardColumnId: number;
  reportCardId?: ObjId;
  createdAt: string;
}

export type ReportCardExistingColumnPayloadDTO =
  | {
      title: string;
      scaleMaxMarks: number | null;
      reportCardId?: ObjId;
      reportCardColumnId: number;
      existingSelectedColumnIds?: number;
    }
  | {
      title: string;
      scaleMaxMarks: number | null;
      reportCardId?: ObjId;
      reportCardColumnId?: number;
      existingSelectedColumnIds: number;
    };

export interface ExistingColumnDTO {
  reportCard: {
    id: number;
    title: string;
  };
  reportCardColumn: {
    id: number;
    title: string;
    columnType: ReportCardColumnTypeEnum;
    functionType:
      | ReportCardCalculatedFunctionEnum
      | ReportCardHorizontalFunctionEnum;
    maxMarks: number;
    maxEntries: number;
    minEntries: number | null;
    sumAggregate: boolean;
    scaleTo: number | null;
  };
}

export type ExistingColumnDTOResponse = IResponse<ExistingColumnDTO>;

export interface ColumnWithSequence {
  columnId: number;
  sequence: number;
  isExisting: boolean;
}

export interface IUpdateColumnSequenceParam {
  reportCardId: ObjId;
  columnsWithSequences: ColumnWithSequence[];
}
// #endregion
