import { IPaginatedResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';
import { STUDENT_REPORT_CARD_STATUS } from './report-card-list.enum';

export interface ReportCardList {
  level: DisplayIdentifiable;
  class: DisplayIdentifiable;
  semester: Array<{ id: ObjId; name: string }>;
  academicYear: { id: ObjId; name: string };
  coursesClasses: Array<{ id: ObjId; classId: number; courseId: number }>;
  school: DisplayIdentifiable;
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

export interface StudentReportCard {
  student: {
    id: ObjId;
    displayName: string;
    userId: ObjId;
    nationalId: string;
    displayPhoneNumber: string;
  };
  academicYear: {
    id: ObjId;
    name: string;
  };
  semester: {
    id: ObjId;
    name: string;
  };
  class: DisplayIdentifiable;
  level: DisplayIdentifiable;
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

export interface ReportCardColumn {
  id: ObjId;
  title: string;
  entries: Entries[] | null;
  maxMarks: number;
  maxEntries: number;
  minEntries: number;
  status: 'MARKED' | 'NEW' | 'UPDATED';
  displayStatus: string;
}

export interface Entries {
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

export interface StudentReportCardPreview {
  id: ObjId;
  displayName: string;
  columns: ReportCardColumn[];
}

export type ReportCardListResponse = IPaginatedResponse<ReportCardList[]>;

export type StudentReportCardResponse = IPaginatedResponse<StudentReportCard[]>;

export type StudentReportCardPreviewResponse = StudentReportCardPreview[];
