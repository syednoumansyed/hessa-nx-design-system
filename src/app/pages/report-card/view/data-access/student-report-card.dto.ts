import { Gender } from '@shared/enums';

export interface ReportCardNameDTO {
  id: number;
  arName: string | null;
  enName: string | null;
}

export interface ReportCardStudentDTO {
  id: number;
  dateOfBirth: string;
  pioneerId: string | null;
  registrationDate: string;
  userId: number;
  arFullName: string | null;
  enFullName: string | null;
  phoneNumber: string;
  nationalId: string;
  countryCode: string;
  gender: Gender | string;
  profileColor?: string;
  nationality?: ReportCardNameDTO | null;
  passportNumber: string | null;
}

export interface ReportCardAcademicYearDTO {
  id: number;
  name: string;
}

export interface ReportCardSemesterDTO {
  id: number;
  name: string;
}

export interface ReportCardClassDTO extends ReportCardNameDTO {}

export interface ReportCardLevelDTO extends ReportCardNameDTO {}

export interface ReportCardDTO {
  id: number;
  title: string;
  semesterId: number | null;
  academicYearId: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReportCardStudentRecordDTO {
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

export interface ReportCardLastEntryDTO {
  id: number;
  createdAt: string;
  studentId: number;
  updatedAt: string | null;
}

export interface StudentReportCardResponseDTO {
  student: ReportCardStudentDTO;
  academicYear: ReportCardAcademicYearDTO;
  semester: ReportCardSemesterDTO[];
  class: ReportCardClassDTO;
  level: ReportCardLevelDTO;
  reportCard: ReportCardDTO;
  reportCardStudent: ReportCardStudentRecordDTO;
  lastEntry: ReportCardLastEntryDTO[] | null;
}
