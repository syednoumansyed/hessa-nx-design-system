import { IAttachment } from '@shared/interfaces/attachment';

export interface StudentAssignmentDTO {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  isViewCorrectAnswer: boolean;
  dueDate: string;
  publishingDate: string;
  status: AssignmentStatus;
  type: AssignmentType;
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
  updatedBy?: number;
  topic: {
    id: number;
    courseId: number;
    classId: number;
    semesterId: number;
    tenantId: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt?: string;
    createdBy: number;
    updatedBy?: number;
  };
  attachments?: Array<IAttachment>;
  submissionData: StudentSubmissionDTO;
  worksheet: {
    attachments?: Array<IAttachment>;
  };
}

export interface StudentSubmissionDTO {
  id: number;
  studentId: number;
  examId: number | null;
  assignmentId: number | null;
  tenantId: number;
  submissionDate: Date | null;
  correctAnswers: string | null;
  status?: StudentSubmissionStatus;
  attemptsTaken: number;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
  submissionStats?: any;
}

export interface StudentAssignmentQuestionsDTO extends StudentAssignmentDTO {
  questions: Array<QuestionDTO>;
}

export interface QuestionDTO {
  id: number;
  examId?: number | null;
  assignmentId?: number | null;
  text: string;
  type: QuestionType;
  modelAnswer?: string;
  isAttachmentAllowed: boolean;
  attachments?: IAttachment[];
  options?: QuestionOptionDTO[];
  createdBy?: number | null | { id: number; fullName: string };
  updatedBy?: number | null | { id: number; fullName: string };
  createdAt?: Date;
  updatedAt?: Date | null;
  answer: {
    answerText: string;
    attachments: IAttachment[];
    id: number;
    questionOptionId: number;
  };
}

export interface QuestionOptionDTO {
  id: number;
  text: string;
  isCorrect?: boolean | null;
  questionId: number;
  createdBy?: number | null | { id: number; fullName: string };
  updatedBy?: number | null | { id: number; fullName: string };
  createdAt?: Date;
  updatedAt?: Date | null;
}

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = ' PUBLISHED',
}

export enum AssignmentType {
  QUESTION = 'QUESTION',
  WORKSHEET = 'WORKSHEET',
}

export enum QuestionType {
  MCQ = 'MCQ',
  ESSAY = 'ESSAY',
  TRUE_OR_FALSE = 'TRUE_OR_FALSE',
}

export enum StudentSubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
}

export interface AnswerPayload {
  questionId: number;
  questionOptionId?: number;
  answerText?: string;
  attachments?: string[];
}
