import {
  IPaginatedResponse,
  IPaginationParams,
  IResponse,
} from '@shared/interfaces';
import { NotificationDestination } from '@shared/enums';

export enum NotificationSettingsResource {
  ACADEMIC_YEAR = 'resource.academic.year',
  ANNOUNCEMENT = 'resource.announcement',
  ATTENDANCE = 'resource.attendance',
  CAMPUS = 'resource.campus',
  CHAT = 'resource.chat',
  CLASS = 'resource.class',
  COMPANY = 'resource.company',
  COURSE = 'resource.course',
  COURSE_CONTENTS = 'resource.course_contents',
  GLOBAL = 'resource.global',
  GRADES = 'resource.grades',
  GUARDIAN = 'resource.guardian',
  HELP_CENTER = 'resource.help.center',
  HOLIDAY = 'resource.holiday',
  JOURNAL = 'resource.journal',
  LECTURE = 'resource.lecture',
  LEVEL = 'resource.level',
  LOGIN = 'resource.login',
  PERSONNEL = 'resource.personnel',
  PICKUP_REQUEST = 'resource.pickup.request',
  REPORT = 'resource.report',
  ROLE_PERMISSION = 'resource.role.permission',
  SCHOOL = 'resource.school',
  SEMESTER = 'resource.semester',
  STUDENT = 'resource.student',
  TICKET = 'resource.ticket',
  TIME_PERIOD = 'resource.time.period',
  VCR = 'resource.vcr',
}

export interface NotificationLocalizedContent {
  en?: string | null;
  ar?: string | null;
}

export interface NotificationDTO {
  id: number;
  entityId?: number | string | null;
  resource?: NotificationSettingsResource | null;
  title: NotificationLocalizedContent | null;
  body: NotificationLocalizedContent | null;
  destination?: NotificationDestination | null;
  metadata?: Record<string, unknown> | null;
  isRead?: boolean | null;
  createdAt?: string | null;
}

export type NotificationQueryDTO = IPaginationParams & {
  isRead?: boolean;
};

export type NotificationListResponseDTO = IPaginatedResponse<NotificationDTO[]>;

export interface NotificationCounterDTO {
  count: number;
}

export type NotificationCounterResponseDTO = IResponse<NotificationCounterDTO>;

export interface NotificationSettingDTO {
  resourceId: number;
  resourceName: NotificationSettingsResource;
  enabled: boolean;
  snoozeStartTime: string | null;
  snoozeEndTime: string | null;
}

export type NotificationSettingsResponseDTO = IResponse<
  NotificationSettingDTO[]
>;

export type NotificationSettingResponseDTO = IResponse<NotificationSettingDTO>;

export interface NotificationSettingUpdateDTO {
  resourceId: number;
  enabled: boolean;
  snoozeStartTime: string | null;
  snoozeEndTime: string | null;
}
