import { QuestionOption } from '@pages/course-management/components/question-wrapper/data-access/question-form.service';
import { QuestionDto } from '@pages/course-management/data-access/lms-exam.dto';

export interface ExamData {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  style: string;
  allowedAttempts: number;
  isViewCorrectAnswer: boolean;
  publishingDate: string | null;
  startDate: string;
  dueDate: string;
  duration: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  topic: Topic;
  questions: QuestionDto[] | null;
}

export interface Topic {
  id: number;
  courseId: number;
  classId: number;
  semesterId: number;
  tenantId: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  attachments: Attachment[] | null;
  modelAnswer: string | null;
  assignmentId: number | null;
  isAttachmentAllowed: boolean;
  questionOptions: QuestionOption[] | null;
}

export interface Attachment {
  id: number;
  key: string;
  title: string | null;
  url: string;
  extension: string;
}

export interface AddExamPayloadDTO {
  topicId: number;
  title: string;
  description?: string;
  examStyle: string;
  allowedAttempts?: number;
  isViewCorrectAnswer?: boolean;
  startDate?: number;
  dueDate: number;
  duration?: number;
}
