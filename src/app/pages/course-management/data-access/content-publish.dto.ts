export interface ContentPublishDTO {
  selected: {
    exam?: ContentExamDTO;
    attachment?: ContentAttachmentDTO;
    assignment?: ContentAssignmentDTO;
    classes: ClassInfoDTO[] | null;
    students: StudentInfoDTO[] | null;
  };
  available: {
    classes: ClassInfoDTO[];
    students: StudentInfoDTO[];
  };
}

export interface ContentAssignmentDTO {
  id: number;
  targetId: number;
  targetType: string;
  publishFor: string | null;
  title: string;
  key: string;
  createdAt: string;
  createdBy: number;
  tenantId: number;
}

export interface ContentAttachmentDTO {
  id: number;
  targetId: number;
  targetType: string;
  publishFor: string | null;
  title: string;
  key: string;
  createdAt: string;
  createdBy: number;
  tenantId: number;
}

export interface ContentExamDTO {
  id: number;
  publishFor: string | null; // or `any` if the type varies
  description: string;
  isViewCorrectAnswer: boolean;
  title: string;
  dueDate: string; // if storing as string, or `Date` if you parse
  topicId: number;
  allowedAttempts: number;
  duration: number;
  style: string;
}

export interface ClassInfoDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface StudentInfoDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}

export interface PublishPayload {
  publish: boolean;
  publishFor: string;
  studentIds?: number[];
  classIds?: number[];
}
