import {
  ReportCardColumnTypeEnum,
  ReportCardHorizontalFunctionEnum,
} from '@pages/report-card/configuration/data-access/report-card-configuration.enum';
import { NameLocalizedIdentifiableDTO } from '@shared/dto-transformation';
import { IAction } from '@ui-kit/hes-action-sheet/model';

export interface ReportCardCourseDTO {
  class: NameLocalizedIdentifiableDTO;
  course: ReportCourseDTO;
  subject: NameLocalizedIdentifiableDTO;
  academicYear: { id: number; name: string };
  semester: Array<{ id: number; name: string }>;
  reportCard: ReportCardDTO;
  level: NameLocalizedIdentifiableDTO;
  school: NameLocalizedIdentifiableDTO;
  lastEntry:
    | {
        createdAt: string;
        id: number;
        studentId: number;
        updatedAt: string;
      }[]
    | null;
}

export interface ReportCourseDTO {
  id: number;
  status: string;
  personnelId: number;
}

export interface ReportCardDTO {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  semesterId: number | null;
}

export interface IReportCardCourseTableItem {
  subject: string;
  level: string;
  classInfo: string;
  isActionAllowed: boolean;
  subjectId: number;
  levelId: number;
  classId: number;
  reportCardId: number;
  reportCardTitle: string;
}

export interface IReportCardColumn {
  id: number;
  reportCardColumnSubjectId: number;
  title: string;
  reportCardId: number;
  columnType: ReportCardColumnTypeEnum;
  functionType: ReportCardHorizontalFunctionEnum | null;
  maxMarks?: number | null;
  maxEntries?: number | null;
  minEntries?: number | null;
  sumAggregate?: boolean | null;
  scaleTo?: number | null;
  subjects?: number[] | null;
  selectedColumns?: number[] | null;
  status: string | null;
}

export interface IEntriesList {
  id: number;
  title: string;
  isActive: boolean;
  isMarksSaved: boolean;
}

export interface IStudentMarksList {
  studentId: number;
  fullName: string;
  marks: number | null;
  maxMarks: number;
  isEditing: boolean;
}

export interface ITeacherColumnParams {
  classId: number;
  subjectId: number;
  reportCardId: number;
}

export interface ICreateColumnSubjectEntry {
  title: string;
  reportCardColumnSubjectId: number;
  reportCardColumnId: number;
}

export interface ColumnSubjectEntryDTO {
  id: number;
  isMarksSaved: boolean;
  reportCardColumnSubjectId: number;
  title: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  tenantId: number;
}

export interface StudentMarksDTO {
  studentId: number;
  arFullName: string;
  enFullName: string;
  marks: number | null;
}

export interface ColumnSubjectEntryByIdResponseDTO
  extends ColumnSubjectEntryDTO {
  studentsMarks: StudentMarksDTO[];
}

export interface IStudentMarksParam {
  studentId: number;
  marks: number;
}
