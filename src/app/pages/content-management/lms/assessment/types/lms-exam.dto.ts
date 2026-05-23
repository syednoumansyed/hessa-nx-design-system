// Updated DTOs based on actual API responses

import { IResponse } from '@shared/interfaces';

export type ExamDetailResponseDto = IResponse<ExamDataDto>;

export interface ExamDataDto {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  style: ExamStyle;
  allowedAttempts: number;
  publishingDate: string;
  publishFor: string;
  startDate: string;
  dueDate: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  topic: TopicDto;
  submissionData: SubmissionDataDto;
  questions?: QuestionDto[];
}

export interface AssignmentResponseDto {
  success: boolean;
  data: AssignmentDataDto;
  message: string;
}

export interface AssignmentDataDto {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  isViewCorrectAnswer: boolean;
  dueDate: string;
  publishingDate: string;
  publishFor: string;
  status: string;
  type: AssignmentType;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  topic: TopicDto;
  submissionData: SubmissionDataDto;
  worksheet: WorksheetDto;
  attachments: AttachmentDto[] | null;
  questions: QuestionDto[];
}

export interface TopicDto {
  id: number;
  title: string;
}

export interface SubmissionDataDto {
  id?: number;
  studentId: number;
  examId: number | null;
  assignmentId: number | null;
  tenantId: number;
  submissionDate: string | null;
  correctAnswers: any | null;
  status: StudentSubmissionStatus;
  attemptsTaken: number;
  timeSpent: number | null;
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
  updatedBy?: number;
  submissionStats: SubmissionStatsDto | null;
}

export interface SubmissionStatsDto {
  totalQuestions: number;
  correctAnswers: number | null;
  inCorrectAnswers?: number | null;
}

export interface WorksheetDto {
  attachments: AttachmentDto[] | null;
}

export interface QuestionDto {
  id: number;
  examId: number | null;
  assignmentId: number | null;
  tenantId: number;
  type: QuestionType;
  text: string;
  modelAnswer: string | null;
  isAttachmentAllowed: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  options: QuestionOptionDto[] | null;
  attachments: AttachmentDto[] | null;
  answer: QuestionAnswerDto | null;
}

export interface QuestionOptionDto {
  id: number;
  text: string;
  questionId: number;
}

export interface QuestionAnswerDto {
  id?: number;
  answerText?: string;
  attachments?: any;
  isCorrect?: boolean;
  questionOptionId?: number;
}

export interface AttachmentDto {
  id: number;
  key: string;
  title: string;
  isLink?: boolean;
  targetId?: number;
  targetType?: string;
  url: string;
  extension: string;
}

export enum ExamStyle {
  CLASSIC = 'CLASSIC',
  OFFLINE = 'OFFLINE',
  QUESTION_BY_QUESTION = 'QUESTION_BY_QUESTION',
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
  NEW = 'NEW',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
}
