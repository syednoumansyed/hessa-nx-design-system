import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';
import {
  VirtualClassroomRepeatOptions,
  VirtualClassroomServiceProviders,
} from './vcr.enum';

export interface VirtualClassroom {
  id: number;
  subjectId: number;
  classId: number;
  serviceProvider: VirtualClassroomServiceProviders;
  meetingLink: string;
  repeatOption: VirtualClassroomRepeatOptions;
  createdAt: string;
  updatedAt: string | null;
  hasUpcomingSession: boolean;
  hasPastSession: boolean;
  nextVirtualClassroomLectureId: number;
  subject: DisplayIdentifiable;
  class: DisplayIdentifiable;
  level: DisplayIdentifiable;
  personnel: DisplayIdentifiable;
  lectures: VirtualClassroomLecture[];
}

export interface VirtualClassroomLecture {
  id: number;
  date: string;
  endTime: string;
  dayOfWeek: number;
  lectureId: number;
  startTime: string;
  periodNumber: number;
}

export interface VirtualClassroomResponse {
  data: VirtualClassroom[];
  totalItems: number;
}
