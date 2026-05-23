import { NotificationDestination } from '@shared/enums';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  /** Design-system icon name (or whatever your icon component expects) */
  icon?: string;
  /** Auto-hide in ms (default 5000) */
  duration?: number;
  createdAt: number;
  /** Navigation destination when notification is clicked */
  destination?: NotificationDestination;
  /** Metadata for deep linking */
  metadata?: Record<string, any>;
}

export enum NotificationResource {
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
