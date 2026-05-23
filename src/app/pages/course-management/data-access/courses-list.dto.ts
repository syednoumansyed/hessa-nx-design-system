import { ResourceStatus } from '@shared/enums';
import { IAttachment } from '@shared/interfaces/attachment';

export interface CoursesSubjectsQueryParam {
  subjectId: number;
  academicYearId: number;
  semesterId: number | string;
  schoolId: number;
  coPersonnelId: number;
  personnelId: number;
  studentId: number;
}

export interface CourseSubjectListItemDTO {
  id: number;
  createdBy: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  updatedBy: null;
  courseClass: {
    id: number;
    classId: number;
    courseId: number;
  };
  course: {
    id: number;
    status: ResourceStatus;
    personnelId: number;
    coPersonnelId: number;
  };
  personnel: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  coPersonnel: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  subject: {
    id: number;
    arName: string;
    enName: string;
  };
  attachments: Array<
    IAttachment & {
      id: number;
      language: string;
      title: string;
    }
  >;
  classes: Array<{
    id: number;
    arName: string;
    enName: string;
  }>;
  level: {
    id: number;
    arName: string;
    enName: string;
  };
  school: {
    id: number;
    arName: string;
    enName: string;
  };
  campus: {
    id: number;
    arName: string;
    enName: string;
  };
  company: {
    id: number;
    arName: string;
    enName: string;
  };
  topicsCount: number;
  videosCount: number;
  attachmentsCount: number;
  assignmentsCount: number;
  examsCount: number;
  viewedVideoCount?: number;
  viewedAttachmentCount?: number;
  viewedExamCount?: number;
  viewedAssignmentCount?: number;
}

export interface PeriodDTO {
  createdAt: string;
  createdBy: number;
  durationType: string;
  endTime: string;
  id: number;
  periodNumber: number;
  startTime: string;
  tenantId: number;
  timePeriodId: number;
  isAvailable: boolean;
  updatedAt: string | null;
  updatedBy: number | null;
}
