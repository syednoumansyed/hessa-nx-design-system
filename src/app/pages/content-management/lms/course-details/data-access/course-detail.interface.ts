import { AssessmentStudentSubmissionStatus } from '@shared/enums';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface CourseDetailForStudent {
  id: number;
  personnel: DisplayIdentifiable;
  course: {
    status: string;
  };
  subject: DisplayIdentifiable;
  level: DisplayIdentifiable;
  classesDisplayName: string;
  attachments: CourseDetailAttachment[];
  assignments: CourseDetailAssignment[];
  exams: CourseDetailExam[];
  videos: CourseDetailVideo[];
  otherAttachments: CourseDetailTopicAttachment[];
  currentWeek: CourseDetailCurrentWeek;
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
  topics: CourseDetailTopicSummary[];
  weeks: CourseDetailWeek[];
}

interface CourseDetailAttachment {
  id: number;
  key: string;
  title: string;
  isLink: boolean;
  language: string;
  url: string;
  extension: string;
}

export interface CourseDetailAssignment {
  id: number;
  type: 'QUESTION' | 'WORKSHEET';
  title: string;
  dueDate: string;
  topicId: number;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  submissionData?: CourseDetailSubmissionData;
  displayStatus?: 'NEW' | 'DISPLAYED';
}

export interface CourseDetailSubmissionData {
  id?: number;
  status: AssessmentStudentSubmissionStatus;
  studentId?: number;
  assignmentId?: number;
  examId?: number;
  attemptsTaken?: number;
  timeSpent?: string | null;
  submissionDate?: string;
}

// --- Exam Interface ---
export interface CourseDetailExam {
  id: number;
  style: 'QUESTION_BY_QUESTION' | 'CLASSIC';
  title: string;
  dueDate: string;
  topicId: number;
  publishFor: 'STUDENT' | 'TOPIC';
  publishingDate: string;
  viewStatus: 'NEW' | 'VIEWED';
  displayStatus?: 'NEW' | 'DISPLAYED';
  submissionData?: CourseDetailSubmissionData;
}

// --- Video Interface ---
export interface CourseDetailVideo {
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
export interface CourseDetailTopicAttachment {
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

interface CourseDetailCurrentWeek {
  id: number;
  endDate: string;
  startDate: string;
  semesterId: number;
  weekNumber: number;
  academicYearId: number;
}

export interface CourseDetailTopicSummary {
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

interface CourseDetailWeek {
  id: number;
  academicYearId: number;
  semesterId: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
}

// Union type for all course content types
export type CourseContentItem =
  | CourseDetailAssignment
  | CourseDetailExam
  | CourseDetailVideo
  | CourseDetailTopicAttachment;
