import { AssessmentStudentSubmissionStatus } from '@shared/enums';
import { ObjId } from '@shared/interfaces/common.interface';

export enum WorkItemType {
  VIDEO = 'VIDEO',
  EXAM = 'EXAM',
  ATTACHMENT = 'ATTACHMENT',
  ASSIGNMENT = 'ASSIGNMENT',
  QUIZ = 'QUIZ',
}

export interface WorkItemConfig {
  id: ObjId;
  title: string;
  status: AssessmentStudentSubmissionStatus | null;
  type: WorkItemType;
  hasIndicator: boolean;
  dueDate?: string;
  url?: string;
  extension?: string;
  isLink?: boolean;
  isGrayed?: boolean;
  topicId: ObjId;
}
