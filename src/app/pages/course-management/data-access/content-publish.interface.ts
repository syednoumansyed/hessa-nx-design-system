export interface ContentPublish {
  selected: {
    exam: ContentExam | null;
    attachment: ContentAttachment | null;
    assignment: ContentAssignment | null;
    classes: ClassInfo[];
    students: StudentInfo[];
  };
  available: {
    classes: ClassInfo[];
    students: StudentInfo[];
  };
}

export interface ContentAssignment {
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

export interface ContentAttachment {
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

export interface ContentExam {
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

export interface ClassInfo {
  id: number;
  displayName: string;
}

export interface StudentInfo {
  id: number;
  displayName: string;
}
