import {
  Language,
  TopicProgressStatus,
  TopicTodoFilter,
  TopicWorkItemType,
} from '@shared/enums';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

export interface StudentCourseDTO {
  id: number;
  subject: {
    id: number;
    arName: string;
    enName: string;
  };
  attachments: AttachmentDTO[];
  imageUrl: string;
  weeksCount: number;
  currentWeekNumber: number; // {{ 2/12 }} topics
  missedCount: number;
  todoCount: number;
  courseProgressPercentage: number;
  courseProgressStatus: TopicProgressStatus;
}

export interface AttachmentDTO {
  id: number;
  key: string;
  language: Language;
  url: string;
}

export type StudentCourseResponseDTO = IResponse<StudentCourseDTO[]>;

export interface StudentCoursesListParams {
  studentId?: number;
  academicYearId?: number;
  schoolId?: number;
  semesterId?: ObjId;
  filterBy?: TopicTodoFilter;
}

export interface StudentCourseTodoDTO {
  id: number;
  type: TopicWorkItemType;
  title: string;
  dueDate: string;
  imageUrl: string;
  attachments: AttachmentDTO[];
  topic: CourseTodoTopicDTO;
  subject: {
    id: number;
    arName: string;
    enName: string;
  };
  courseId: number;
  workItemType: TopicWorkItemType;
  dueString: string;
  dueColor: 'red' | 'orange' | 'gray';
  isMissed: boolean;
}

export interface CourseTodoTopicDTO {
  id: number;
  title: string;
  weekId: number | null;
  courseId: number;
  description: string;
}

export type StudentCourseTodoResponseDTO = IResponse<{
  todos: StudentCourseTodoDTO[];
}>;
