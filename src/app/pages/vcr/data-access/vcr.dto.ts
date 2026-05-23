import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import {
  VirtualClassroomFilterBy,
  VirtualClassroomRepeatOptions,
  VirtualClassroomServiceProviders,
} from './vcr.enum';
import { NameLocalizedIdentifiableDTO } from '@shared/dto-transformation/common/common.dto';
import { FullNameLocalizedIdentifiable } from '@shared/dto-transformation';

export interface VirtualClassroomDTO {
  id: number;
  subjectId: number;
  classId: number;
  serviceProvider: VirtualClassroomServiceProviders;
  meetingLink: string;
  repeatOption: VirtualClassroomRepeatOptions;
  createdAt: string;
  updatedAt: string | null;
  createdBy: User;
  updatedBy: User | null;
  hasUpcomingSession: boolean;
  hasPastSession: boolean;
  nextVirtualClassroomLectureId: number;
  subject: NameLocalizedIdentifiableDTO;
  class: NameLocalizedIdentifiableDTO;
  level: NameLocalizedIdentifiableDTO;
  personnel: FullNameLocalizedIdentifiable;
  lectures: VirtualClassroomLectureDTO[];
}

export interface User {
  id: number;
  fullName: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Class {
  id: number;
  name: string;
}

export interface Level {
  id: number;
  name: string;
}

interface VirtualClassroomLectureDTO {
  id: number;
  date: string;
  endTime: string;
  dayOfWeek: number;
  lectureId: number;
  startTime: string;
  periodNumber: number;
}

export type VirtualClassroomListResponseDTO = IPaginatedResponse<
  VirtualClassroomDTO[]
>;

export type VirtualClassroomsResponseDTO =
  IPaginatedResponse<VirtualClassroomDTO>;
export type VirtualClassroomRequestPayload = {
  academicYearId: number;
  schoolId: number;
  personnelId?: number;
  subjectId?: number;
  classId?: number;
  levelId?: number;
  date?: number;
  startDate?: number;
  endDate?: number;
  order?: string;
  sortByColumn?: string;
  filterBy?: VirtualClassroomFilterBy;
  pageNumber: number;
  itemsPerPage: number;
};

export interface VirtualClassroomPayloadDTO {
  subjectId: number;
  levelId: number;
  academicYearId: number;
  classId: number;
  serviceProvider: VirtualClassroomServiceProviders;
  meetingLink: string;
  repeatOption: VirtualClassroomRepeatOptions;
  lectureIds: number[];
}
export interface VirtualClassroomResponseDTO {
  data: VirtualClassroomDTO[];
  totalItems: number;
}
