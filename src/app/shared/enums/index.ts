import { Idropdown } from '../interfaces';

export function enumArrayFromEnum<T extends Record<string, U>, U>(
  enumObject: T,
): U[] {
  return Object.keys(enumObject).map((key) => enumObject[key]);
}

export function dropdownArrayFromEnum<
  T extends Record<string, U>,
  U extends string | number,
>(enumObject: T): Idropdown[] {
  return Object.keys(enumObject).map((key) => ({
    value: enumObject[key] as U,
    displayedValue: key,
  }));
}
/**
 * Convert an enum into chip-selector options with translated display values.
 * Uses the `enum.<VALUE>` translation key convention.
 *
 * @param enumObject  The TypeScript enum to convert
 * @param translateFn A function that translates a key, e.g. `translocoService.enumT`
 */
export function translatedChipOptions<
  T extends Record<string, U>,
  U extends string | number,
>(
  enumObject: T,
  translateFn: (key: string) => string,
): { value: string | number; displayedValue: string }[] {
  return Object.keys(enumObject).map((key) => ({
    value: enumObject[key] as U,
    displayedValue: translateFn(enumObject[key] as string),
  }));
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum GuardianRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  PATERNAL_AUNT = 'PATERNAL_AUNT',
  PATERNAL_UNCLE = 'PATERNAL_UNCLE',
  MATERNAL_AUNT = 'MATERNAL_AUNT',
  MATERNAL_UNCLE = 'MATERNAL_UNCLE',
  OTHER = 'OTHER',
}

export enum StudentRelationship {
  SON = 'SON',
  DAUGHTER = 'DAUGHTER',
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
  GRANDSON = 'GRANDSON',
  GRANDDAUGHTER = 'GRANDDAUGHTER',
  PATERNAL_NEPHEW = 'PATERNAL_NEPHEW',
  PATERNAL_NIECE = 'PATERNAL_NIECE',
  MATERNAL_NEPHEW = 'MATERNAL_NEPHEW',
  MATERNAL_NIECE = 'MATERNAL_NIECE',
  OTHER = 'OTHER',
}

export enum UserType {
  STUDENT = 'STUDENT',
  GUARDIAN = 'GUARDIAN',
  PERSONNEL = 'PERSONNEL',
}
export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
}
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

export enum GenderEnum {
  BOYS = 'BOYS',
  GIRLS = 'GIRLS',
  COMMON = 'COMMON',
}

export enum EducationalPathEnum {
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
  ACADEMY = 'ACADEMY',
}

export enum DomainEnum {
  COGNITIVE = 'COGNITIVE',
  PSYCHOMOTOR = 'PSYCHOMOTOR',
  EFFECTIVE = 'EFFECTIVE',
}

export enum ChatTypeEnum {
  DM = 'DM',
  GROUP = 'GROUP',
  BRODCAST = 'BRODCAST',
}

export enum MessageType {
  TEXT = 'text',
  AUDIO = 'audio',
  VIDEO = 'video',
  IMAGE = 'image',
  FILE = 'file',
  GROUP_MEMBER = 'groupMember',
}

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum ConversationType {
  USER = 'user',
  GROUP = 'group',
}

export enum BroadcastChatBetween {
  ALL_STUDENTS = 'ALL_STUDENTS',
  ALL_GUARDIANS = 'ALL_GUARDIANS',
  ALL_STUDENTS_AND_GUARDIANS = 'ALL_STUDENTS_AND_GUARDIANS',
}

export enum DefaultRoles {
  SUPER_ADMIN = 'المشرف العام', // Super Admin
  STUDENT = 'طالب', // Student
  GUARDIAN = 'ولي الامر', // Guardian
  TEACHER = 'معلم', // Teacher
  GUARD = 'حارس', // Guard
}

export enum EnDefaultRoles {
  SUPER_ADMIN = 'Super Admin',
  STUDENT = 'Student',
  GUARDIAN = 'Guardian',
  TEACHER = 'Teacher',
  GUARD = 'Guard',
}

export enum PickupRequestStatus {
  ALL = 'ALL',
  REQUESTED = 'REQUESTED',
  IN_PROCESS = 'IN_PROCESS',
  PICKED = 'PICKED',
  DENIED = 'DENIED',
  LEFT_SCHOOL = 'LEFT_SCHOOL',
  NOT_PICKED = 'NOT_PICKED',
  PROCESSED = 'PROCESSED', // Virtual status combining LEFT_SCHOOL and PICKED for UI tabs
}

export enum PeriodDurationType {
  PERIOD = 'PERIOD',
  BREAK = 'BREAK',
}

export enum PickupRequestTableStatus {
  REQUESTED = 'REQUESTED',
  IN_PROCESS = 'IN_PROCESS',
  PICKED = 'PICKED',
  DENIED = 'DENIED',
  LEFT_SCHOOL = 'LEFT_SCHOOL',
}

export enum PickupRequestBy {
  GUARDIAN = 'GUARDIAN',
  DELEGATE = 'DELEGATE',
}

export enum PickupPersonnelType {
  GUARD = 'GUARD',
  ADMIN = 'ADMIN',
  ADMIN_GUARD = 'ADMIN_GUARD', // User with both admin and guard permissions
}

export enum DaySelectionStatus {
  DEFAULT = 'default',
  SELECTED = 'selected',
  DISABLED = 'disabled',
}

export enum TopicProgressStatus {
  AT_RISK = 'AT_RISK', // < 60%
  NEEDS_SUPPORT = 'NEEDS_SUPPORT', // < 79% && >= 60%
  CATCHING_UP = 'CATCHING_UP', // < 95% && >= 80%
  ON_TRACK = 'ON_TRACK', // = < 100% && >= 95%
  EXCEEDING_EXPECTATIONS = 'EXCEEDING_EXPECTATIONS', // >= 100%
}

export enum TopicTodoFilter {
  CRITICAL = 'CRITICAL',
  THIS_WEEK = 'THIS_WEEK',
  UPCOMING = 'UPCOMING',
  MISSED = 'MISSED',
}

export enum TopicWorkItemType {
  EXAM = 'EXAM',
  VIDEO = 'VIDEO',
  WORKSHEET = 'WORKSHEET',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  QUESTION = 'QUESTION',
}

export enum CourseContentDataType {
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  ATTACHMENT = 'ATTACHMENT',
  VIDEO = 'VIDEO',
  TOPIC = 'TOPIC',
  WEEK = 'WEEK',
}

export enum CoursesTab {
  COURSES = 'COURSES',
  TODO = 'TODO',
}

export enum UserProfileColors {
  BRAND = 'brand',
  EMERALD = 'emerald',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  NEUTRAL = 'neutral',
  CORAL = 'coral',
  TEAL = 'teal',
  PURPLE = 'purple',
  INDIGO = 'indigo',
}

export enum AccessLevel {
  INTERNAL = 'INTERNAL',
  PUBLIC = 'PUBLIC',
}

export enum SupportTicketStatus {
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  REVIEW = 'REVIEW',
  DE_ESCALATE = 'DE_ESCALATE',
  RE_OPEN = 'RE_OPEN',
  RE_ASSIGN = 'RE_ASSIGN',
}

export enum AssessmentStudentSubmissionStatus {
  NEW = 'NEW',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
}

export enum AttendanceStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
}

export enum StudentAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
}

export enum AnnouncementType {
  SMS = 'sms',
  NOTIFICATION = 'notification',
  POST = 'post',
}

export enum TargetTypes {
  COMPANIES = 'company',
  CAMPUSES = 'campus',
  SCHOOLS = 'school',
  LEVELS = 'level',
  CLASSES = 'class',
}

export enum JournalType {
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
}

export enum NotificationDestination {
  COURSE_CONTENT_LIST_STUDENT = 'COURSE_CONTENT_LIST_STUDENT',
  COURSE_CONTENT_EXAM_DETAILS_STUDENT = 'COURSE_CONTENT_EXAM_DETAILS_STUDENT',
  COURSE_CONTENT_EXAM_DETAILS_GUARDIAN = 'COURSE_CONTENT_EXAM_DETAILS_GUARDIAN',
  ATTENDANCE_VIEW_STUDENT = 'ATTENDANCE_VIEW_STUDENT',
  ATTENDANCE_VIEW_GUARDIAN = 'ATTENDANCE_VIEW_GUARDIAN',
  VCR_LIST_STUDENT = 'VCR_LIST_STUDENT',
  VCR_LIST_PERSONNEL = 'VCR_LIST_PERSONNEL',
  ANNOUNCEMENT_USER_FEED_STUDENT = 'ANNOUNCEMENT_USER_FEED_STUDENT',
  ANNOUNCEMENT_USER_FEED_GUARDIAN = 'ANNOUNCEMENT_USER_FEED_GUARDIAN',
  ANNOUNCEMENT_USER_FEED_PERSONNEL = 'ANNOUNCEMENT_USER_FEED_PERSONNEL',
  SUPPORT_TICKET_INITIATOR_DETAILS_GUARDIAN = 'SUPPORT_TICKET_INITIATOR_DETAILS_GUARDIAN',
  SUPPORT_TICKET_INITIATOR_DETAILS_STUDENT = 'SUPPORT_TICKET_INITIATOR_DETAILS_STUDENT',
  SUPPORT_TICKET_INITIATOR_DETAILS_PERSONNEL = 'SUPPORT_TICKET_INITIATOR_DETAILS_PERSONNEL',
  SUPPORT_TICKET_ASSIGNEE_DETAILS_PERSONNEL = 'SUPPORT_TICKET_ASSIGNEE_DETAILS_PERSONNEL',
  POST_ANNOUNCEMENT_CREATED = 'POST_ANNOUNCEMENT_CREATED',
  PUSH_ANNOUNCEMENT_CREATED = 'PUSH_ANNOUNCEMENT_CREATED',
  GRADE_MANAGEMENT_VIEW_STUDENT = 'GRADE_MANAGEMENT_VIEW_STUDENT',
  GRADE_MANAGEMENT_VIEW_GUARDIAN = 'GRADE_MANAGEMENT_VIEW_GUARDIAN',
  GRADE_MANAGEMENT_ENTRIES_PERSONNEL = 'GRADE_MANAGEMENT_ENTRIES_PERSONNEL',
  CHATS_DETAILS_GUARDIAN = 'CHATS_DETAILS_GUARDIAN',
  CHATS_DETAILS_PERSONNEL = 'CHATS_DETAILS_PERSONNEL',
  CHATS_DETAILS_STUDENT = 'CHATS_DETAILS_STUDENT',
  JOURNAL_DETAILS_GUARDIAN = 'JOURNAL_DETAILS_GUARDIAN',
  PICKUP_LIST_GUARDIAN = 'PICKUP_LIST_GUARDIAN',
  PICKUP_LIST_PERSONNEL = 'PICKUP_LIST_PERSONNEL',
  REPORTS_HISTORY_PERSONNEL = 'REPORTS_HISTORY_PERSONNEL',
}

export enum TicketFeedbackType {
  RATING = 'RATING',
  ISSUE = 'ISSUE',
}
