import { AssessmentStudentSubmissionStatus } from '@shared/enums';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

// --- Submission Data Interface ---
export interface CourseDetailSubmissionDataDTO {
  id?: number;
  status: AssessmentStudentSubmissionStatus;
  studentId?: number;
  assignmentId?: number;
  examId?: number;
  attemptsTaken?: number;
  timeSpent?: string | null;
  submissionDate?: string;
}

// --- Todo Interfaces ---
export interface CourseDetailTodoAttachment {
  id: number;
  key: string;
  title: string;
  isLink: boolean;
  language: string;
  url: string;
  extension: string;
}

export interface CourseDetailTodoTopic {
  id: number;
  title: string;
  weekId: number;
  courseId: number;
  description: string;
}

export interface CourseDetailTodoSubject {
  id: number;
  name: string;
}

export interface CourseDetailTodoItem {
  id: number;
  type?: 'QUESTION' | 'WORKSHEET'; // For assignments
  style?: 'QUESTION_BY_QUESTION' | 'CLASSIC'; // For exams
  title: string;
  dueDate: string;
  topicId: number;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  attachments: CourseDetailTodoAttachment[];
  topic: CourseDetailTodoTopic;
  subject: CourseDetailTodoSubject;
  workItemType: 'ASSIGNMENT' | 'EXAM';
  courseId: number;
  submissionData?: CourseDetailSubmissionDataDTO;
}

export interface CourseDetailTodoData {
  todos: CourseDetailTodoItem[];
}

export type CourseDetailTodoResponseDto = IResponse<CourseDetailTodoData>;

// --- Course Detail for Student ---

interface CourseDetailPersonnelDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}

interface CourseDetailCourseDTO {
  id: number;
  status: string;
  creditHour: string;
  personnelId: number;
  coPersonnelId: number | null;
}

interface CourseDetailSubjectDTO {
  id: number;
  arName: string;
  enName: string;
}

interface CourseDetailLevelDTO {
  id: number;
  arName: string;
  enName: string;
}

interface CourseDetailClassDTO {
  id: number;
  arName: string;
  enName: string;
}

interface CourseDetailAttachmentDTO {
  id: number;
  key: string;
  title: string;
  isLink: boolean;
  language: string;
  url: string;
  extension: string;
}

interface CourseDetailCurrentWeekDTO {
  id: number;
  endDate: string;
  startDate: string;
  semesterId: number;
  weekNumber: number;
  academicYearId: number;
}

export interface CourseDetailTopicSummaryDTO {
  id: number;
  title: string;
  weekId: number;
  courseId: number;
  description: string;
  videosCount: number;
  attachmentsCount: number;
  viewedAttachmentsCount: number;
  viewedVideosCount: number;
  pendingAttachmentsCount: number;
  pendingVideosCount: number;
  assignmentsCount: number;
  missedExamsCount: number;
  missedAssignmentsCount: number;
  viewedAssignmentCount: number;
  pendingAssignmentsCount: number;
  viewedExamCount: number;
  examsCount: number;
  pendingExamsCount: number;
}

interface CourseDetailWeekDTO {
  id: number;
  academicYearId: number;
  semesterId: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
}

// --- Assignment Interface ---
export interface CourseDetailAssignmentDTO {
  id: number;
  type: 'QUESTION' | 'WORKSHEET';
  title: string;
  dueDate: string;
  topicId: number;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  submissionData?: CourseDetailSubmissionDataDTO;
  displayStatus?: 'NEW' | 'DISPLAYED';
}

// --- Exam Interface ---
export interface CourseDetailExamDTO {
  id: number;
  style: 'QUESTION_BY_QUESTION' | 'CLASSIC';
  title: string;
  dueDate: string;
  topicId: number;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  displayStatus?: 'NEW' | 'DISPLAYED';
  submissionData?: CourseDetailSubmissionDataDTO;
}

// --- Video Interface ---
export interface CourseDetailVideoDTO {
  id: number;
  key: string;
  title: string;
  isLink: boolean;
  topicId: number;
  language: string | null;
  url: string;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  displayStatus?: 'NEW' | 'DISPLAYED';
}

// --- Enhanced Attachment Interface (with additional properties) ---
export interface CourseDetailTopicAttachmentDTO {
  id: number;
  key: string;
  title: string;
  isLink: boolean;
  topicId: number;
  language: string | null;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  url: string;
  extension: string;
  displayStatus?: 'NEW' | 'DISPLAYED';
}

// Union type for all course content types
export type CourseContentItemDTO =
  | CourseDetailAssignmentDTO
  | CourseDetailExamDTO
  | CourseDetailVideoDTO
  | CourseDetailTopicAttachmentDTO;

export interface CourseDetailForStudentDTO {
  id: number;
  personnel: CourseDetailPersonnelDTO;
  course: CourseDetailCourseDTO;
  subject: CourseDetailSubjectDTO;
  level: CourseDetailLevelDTO;
  classes: CourseDetailClassDTO[];
  attachments: CourseDetailAttachmentDTO[];
  assignments: CourseDetailAssignmentDTO[];
  exams: CourseDetailExamDTO[];
  videos: CourseDetailVideoDTO[];
  otherAttachments: CourseDetailTopicAttachmentDTO[];
  currentWeek: CourseDetailCurrentWeekDTO;
  currentWeekNumber: number;
  topicsCount: number;
  weeksCount: number;
  videosCount: number;
  attachmentsCount: number;
  assignmentsCount: number;
  examsCount: number;
  viewedVideoCount: number;
  viewedAttachmentCount: number;
  viewedAssignmentCount: number;
  viewedExamCount: number;
  missedCount: number;
  todoCount: number;
  weeksCompletionPercentage: number;
  courseProgressPercentage: number;
  courseProgressStatus: string;
  videoProgressPercentage: number;
  attachmentProgressPercentage: number;
  assignmentProgressPercentage: number;
  examProgressPercentage: number;
  topics: CourseDetailTopicSummaryDTO[];
  weeks: CourseDetailWeekDTO[];
}

export type StudentCourseDetailDTO = IResponse<CourseDetailForStudentDTO[]>;

export type FetchCourseDetailParams = {
  subjectId?: ObjId;
  courseId?: ObjId;
  topicId?: ObjId;
  weekId?: ObjId;
  academicYearId?: ObjId;
  semesterId?: ObjId;
  schoolId?: ObjId;
  levelId?: ObjId;
  classId?: ObjId;
  personnelId?: ObjId;
  studentId?: ObjId;
  includeData?: string;
};
