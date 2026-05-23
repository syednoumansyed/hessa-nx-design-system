import { ResourceStatus } from '@shared/enums';
import { IAttachment } from '@shared/interfaces/attachment';
import {
  AssignmentStatus,
  StudentSubmissionStatus,
} from './lms/lms-assignment.dto';
import { AssignmentType } from './cms/cms-assignment.dto';
import {
  ExamStyle,
  SubmissionData,
} from '@pages/course-management/data-access/lms-exam.dto';

export interface CourseTopicDTO {
  id: number;
  courseId: number;
  classId: number;
  semesterId: number;
  tenantId: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  viewedAssignmentCount?: number;
  viewedAttachmentCount?: number;
  viewedExamCount: number;
  viewedVideoCount: number;
  weekId: number;
  week: {
    endDate: string;
    id: number;
    isCurrentWeek: boolean;
    startDate: string;
    weekNumber: number;
  };
  attachments: Array<IAttachment & { name: string }>;
  classes: [
    {
      name: string;
      roomNumber: string;
      schoolLevelId: number;
    },
  ];
  semesters: [
    {
      name: string;
      endDate: string;
      startDate: string;
      academicYearId: number;
    },
  ];
  courses: [
    {
      status: ResourceStatus;
      subjectId: number;
      personnelId: number;
      coPersonnelId: number;
      academicYearId: number;
    },
  ];
  exams: Array<{
    id: number;
    title: string;
    submissionPercentage: number;
    allowedAttempts: number;
    description: string;
    dueDate: string;
    duration: number;
    isViewCorrectAnswer: boolean;
    publishingDate: string;
    startDate: string;
    style: ExamStyle;
    submissionData: SubmissionData | null;
    topicId: number;
    submissionStatus: string;
  }>;
  assignments: Array<{
    description: string;
    dueDate: string;
    id: number;
    isViewCorrectAnswer: boolean;
    publishingDate: string;
    status: AssignmentStatus;
    submissionPercentage: number;
    title: string;
    topicId: number;
    type: AssignmentType;
    submissionData?: {
      id: number;
      status: StudentSubmissionStatus;
      tenantId: number;
      studentId: number;
      assignmentId: number;
    };
  }>;
}

export interface CourseTopicsQueryParamsDTO {
  pageNumber?: number;
  itemsPerPage?: number;
  courseId: number;
  semesterId?: number;
  academicYearId: number;
  studentId?: number;
}

export interface CourseTopicPayload {
  title: string;
  semesterId: number;
  description: string;
  courseId: number;
  attachments?: Array<{ path: string; name: string; isLink?: boolean }>;
  weekId: number;
}
