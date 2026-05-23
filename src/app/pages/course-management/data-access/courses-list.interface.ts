import { ResourceStatus } from '@shared/enums';
import { IAttachment } from '@shared/interfaces/attachment';

export interface CourseSubjectListItem {
  id: number;
  // createdBy: {
  //   id: number;
  //   displayName: string;
  // };
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
    displayName: string;
  };
  coPersonnel: {
    id: number;
    displayName: string;
  } | null;
  subject: {
    id: number;
    displayName: string;
  };
  attachments: Array<
    IAttachment & {
      id: number;
      language: string;
      title: string;
    }
  >;
  displayClasses: string;
  level: {
    id: number;
    displayName: string;
  };
  topicsCount: number;
  videosCount: number;
  attachmentsCount: number;
  assignmentsCount: number;
  examsCount: number;
  viewedVideoCount: number;
  viewedAttachmentCount: number;
  viewedExamCount: number;
  viewedAssignmentCount: number;
}
