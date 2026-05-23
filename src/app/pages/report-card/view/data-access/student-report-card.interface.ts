import { Gender, UserProfileColors } from '@shared/enums';

export interface ReportCardLocalizedEntity {
  id: number;
  displayName: string;
}

export interface ReportCardAcademicYear {
  id: number;
  name: string;
}

export interface ReportCardSemester {
  id: number;
  name: string;
}

export interface ReportCardInfo {
  id: number;
  title: string;
  semesterId: number | null;
  academicYearId: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReportCardStudentRecord {
  id: number;
  reportCardId: number;
  status: string;
  publishDate: string | null;
  key: string | null;
  createdAt: string;
  updatedAt: string;
  url?: string | null;
  extension?: string | null;
}

export interface ReportCardStudentInfo {
  id: number;
  dateOfBirth: string;
  pioneerId: string | null;
  registrationDate: string;
  userId: number;
  displayFullName: string;
  phoneNumber: string;
  nationalId: string;
  countryCode: string;
  gender: Gender | string;
  profileColor?: string;
  nationality: ReportCardLocalizedEntity | null;
  passportNumber: string | null;
}

export interface StudentReportCardEntry {
  student: ReportCardStudentInfo;
  academicYear: ReportCardAcademicYear;
  semester: ReportCardSemester[];
  class: ReportCardLocalizedEntity;
  level: ReportCardLocalizedEntity;
  reportCard: ReportCardInfo;
  reportCardStudent: ReportCardStudentRecord;
  lastEntryAt: string | null;
}

export type StudentReportCardEntries = StudentReportCardEntry[];
