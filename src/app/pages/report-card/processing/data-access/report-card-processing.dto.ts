import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { STUDENT_REPORT_CARD_STATUS } from './report-card-list.enum';
import { NameLocalizedIdentifiableDTO } from '@shared/dto-transformation';
export interface ReportCardListDTO {
  level: NameLocalizedIdentifiableDTO;
  class: NameLocalizedIdentifiableDTO;
  semester: Array<{ id: ObjId; name: string }>;
  academicYear: { id: ObjId; name: string };
  coursesClasses: Array<{ id: ObjId; classId: number; courseId: number }>;
  school: NameLocalizedIdentifiableDTO;
  reportCard: {
    id: ObjId;
    title: string;
    semesterId: number;
    academicYearId: number;
    startDate: string;
    endDate: string;
    inDraft: number;
    updatedAt: string;
  };
}

export interface StudentReportCardDTO {
  student: {
    id: ObjId;
    arFullName: string;
    enFullName: string;
    dateOfBirth: string;
    pioneerId: null;
    registrationDate: string;
    userId: ObjId;
    phoneNumber: string;
    nationalId: string;
    countryCode: string;
    gender: string;
  };
  academicYear: {
    id: ObjId;
    name: string;
  };
  semester: {
    id: ObjId;
    name: string;
  };
  class: NameLocalizedIdentifiableDTO;
  level: NameLocalizedIdentifiableDTO;
  reportCard: {
    id: ObjId;
    title: string;
    reportCardStudentId: string;
    status: string;
    publishDate: string;
    key: string;
    createdAt: string;
    updatedAt: string;
  };
  reportCardStudent: {
    status: STUDENT_REPORT_CARD_STATUS;
    key: string | null;
    url: string | null;
  } | null;
  lastEntry:
    | {
        createdAt: string;
        id: number;
        studentId: number;
        updatedAt: string;
      }[]
    | null;
}

export interface StudentReportCardPreviewDTO {
  id: ObjId;
  arName: string;
  enName: string;
  columns: ColumnDTO[] | null;
}

export interface ColumnDTO {
  id: ObjId;
  title: string;
  entries: EntriesDTO[] | null;
  maxMarks: number;
  maxEntries: number;
  minEntries: number;
  status: 'MARKED' | 'NEW' | 'UPDATED';
}

export interface EntriesDTO {
  id: ObjId;
  title: string;
  subjectId: ObjId;
  marks:
    | {
        id: ObjId;
        marks: number;
      }[]
    | null;
}

export type ReportCardListDTOResponse = IPaginatedResponse<ReportCardListDTO[]>;

export type StudentReportCardDTOResponse = IPaginatedResponse<
  StudentReportCardDTO[]
>;

export type StudentReportCardPreviewDTOResponse = IResponse<
  StudentReportCardPreviewDTO[]
>;

export type StudentsReportCardParams = {
  levelId?: ObjId;
  semesterid?: ObjId;
  academicYearId?: ObjId;
  schoolId?: ObjId;
  paginate?: boolean;
};

export type PublishReportCardParams = {
  publish: boolean;
  academicYearId: ObjId;
  classId: ObjId;
  reportCardId: ObjId;
  studentIds: ObjId[];
};
