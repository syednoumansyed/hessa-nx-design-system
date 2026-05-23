export interface LmsExamDto {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  style: ExamStyle;
  allowedAttempts: number;
  isViewCorrectAnswer: boolean;
  publishingDate: string | null;
  startDate: string;
  dueDate: string;
  duration: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  submissionData: SubmissionData | null;
  examStatus: string;
  timeSpent: number;
}

export interface QuestionAnswer {
  answerText?: string;
  attachments?: any;
  id?: number;
  isCorrect?: boolean;
  questionOptionId: number;
}
export interface QuestionResponseDTO {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  style: ExamStyle;
  allowedAttempts: number;
  isViewCorrectAnswer: boolean;
  publishingDate: string | null;
  startDate: string;
  dueDate: string;
  duration: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  topic: Topic;
  submissionData: SubmissionData;
  questions: QuestionDto[];
}

export interface Topic {
  id: number;
  title: string;
  classId: number;
}

export interface SubmissionData {
  id: number;
  studentId: number;
  examId: number;
  assignmentId: number | null;
  tenantId: number;
  submissionDate: string;
  correctAnswers: any | null;
  status: StudentSubmissionStatus;
  attemptsTaken: number;
  timeSpent: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  submissionStats: {
    totalQuestions: number;
    correctAnswers: number;
  } | null;
}

export interface QuestionDto {
  id: number;
  examId?: number;
  assignmentId: number;
  type: QuestionType;
  text: string;
  modelAnswer: any | null; // todo: specify a more precise type if possible
  isAttachmentAllowed: boolean;
  createdAt?: string;
  updatedAt: string | null;
  createdBy?: number;
  updatedBy?: number | null;
  options?: QuestionOption[];
  attachments: any | null; // todo: specify a more precise type if possible
  answer?: QuestionAnswer;
}

export interface QuestionOption {
  id: number;
  text: string;
  isCorrect: boolean;
  questionId: number;
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
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
}

export interface ExamDetailsGridInterface {
  title?: string;
  value?: string;
  type?: string;
}
