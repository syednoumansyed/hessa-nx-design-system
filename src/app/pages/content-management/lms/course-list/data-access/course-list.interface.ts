import {
  Language,
  TopicProgressStatus,
  TopicWorkItemType,
} from '@shared/enums';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface StudentCourse {
  id: number;
  subject: DisplayIdentifiable;
  attachments: Attachment[];
  imageUrl: string;
  weeksCount: number;
  currentWeekNumber: number;
  missedCount: number;
  todoCount: number;
  courseProgressPercentage: number;
  courseProgressStatus: TopicProgressStatus;
}

export interface Attachment {
  id: number;
  key: string;
  language: Language;
  url: string;
}

export interface StudentCourseTodo {
  id: number;
  type: TopicWorkItemType;
  title: string;
  dueDate: string;
  imageUrl: string;
  attachments: Attachment[];
  topic: CourseTodoTopic;
  subject: DisplayIdentifiable;
  courseId: number;
  workItemType: TopicWorkItemType;
  dueString: string;
  dueColor: 'red' | 'orange' | 'gray';
  isMissed: boolean;
}

export interface CourseTodoTopic {
  id: number;
  title: string;
  weekId: number | null;
  courseId: number;
  description: string;
}
