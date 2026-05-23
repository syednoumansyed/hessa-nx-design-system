import { IPaginatedResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { JournalStatus } from '@pages/journal/data-access/journal.enum';

export interface JournalDTO {
  id: ObjId | null;
  type: JournalType;
  journalDate: string;
  journalEndDate: string;
  publishDate: string | null;
  status: string;
  acknowledgementComment: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  semesterId: number | null;
  semesterName: string | null;
  classId: number;
  classEnName: string;
  classArName: string;
  levelId: number;
  levelEnName: string;
  levelArName: string;
  roleId: number;
  roleEnName: string;
  roleArName: string;
  guardianId: number | null;
  studentId: number;
  arFullName: string;
  enFullName: string;
  userId: number;
  nationalId: string;
  phoneNumber: string | null;
  countryCode: string | null;
  gender: string;
  dateOfBirth: string;
  pioneerId: string;
  registrationDate: string;
  viewedByGuardian: boolean | null;
  arabicTeacherEnFullName: string | null;
  arabicTeacherArFullName: string | null;
  englishTeacherArFullName: string | null;
  englishTeacherEnFullName: string | null;
  scienceTeacherEnFullName: string | null;
  scienceTeacherArFullName: string | null;
  healthAndCareTeacherEnFullName: string | null;
  healthAndCareTeacherArFullName: string | null;
  islamicTeacherEnFullName: string | null;
  islamicTeacherArFullName: string | null;
  arabicTeacherNote: string | null;
  scienceTeacherNote: string | null;
  englishTeacherNote: string | null;
  healthAndCareTeacherNote: string | null;
  islamicTeacherNote: string | null;
  taskDone: string | null;
  meal?: string[];
  lunch?: string[];
  snack?: string[];
  skillClubs?: string[];
  guardianArFullName: string | null;
  guardianEnFullName: string | null;
  needGuardianAttention: boolean;
  healthAndCare: string | null;
}

export type JournalsResponseDTO = IPaginatedResponse<JournalDTO[]>;

export interface FetchJournalsParams {
  page: number;
  pageSize: number;
  date: string;
  levelId: number;
  classId: number;
  studentId: number;
  status: string;
  type: JournalType;
}

export interface JournalPayload {
  studentId: number;
  semesterId: number;
  type: JournalType;
  status: JournalStatus;
  [key: string]: number | string | string[];
}

export type JournalType = 'WEEKLY' | 'DAILY';
