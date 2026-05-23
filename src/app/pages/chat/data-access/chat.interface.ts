import { ConversationType, UserProfileColors } from '@shared/enums';
import { IPaginationParams } from '@shared/interfaces';

export type ChatStudentsParams = {
  classId: number;
  searchText?: string;
  academicYearId?: number;
} & IPaginationParams;

export interface ChatPersonnel {
  id: number;
  userId: number;
  displayName: string;
  profileColor: string;
  chatId: string;
  students: {
    id: number;
    displayName: string;
  }[];
  subjects: {
    id: number;
    displayName: string;
  }[];
  roles: {
    id: number;
    displayName: string;
  }[];
}

export interface ChatGroupMetadata {
  id: string;
  type: string;
  academicYearId: number;
  displayName: string;
  profileColor?: UserProfileColors; // From CometChat group metadata
  level: {
    id: number;
    displayName: string;
  };
  students: {
    id: number;
    displayName: string;
  }[];
}

export interface ChatUserMetadata {
  id: string;
  type: string;
  role: string;
  userId: number;
  userTypeId: number;
  displayName: string;
  profileColor: UserProfileColors;
  imageUrl?: string;
  isAvatar?: boolean;
  snoozeStartTime?: string | null;
  snoozeEndTime?: string | null;
  students: {
    id: number;
    displayName: string | null;
  }[];
  classes: {
    id: number;
    displayName: string | null;
  }[];
  subjects: {
    id: number;
    displayName: string;
  }[];
  roles: {
    id: number;
    displayName: string;
  }[];
}

export interface ChatParticipant {
  id: string;
  displayName: string;
  type: ConversationType;
  classId?: number;
  metadata?: ChatUserMetadata | ChatGroupMetadata;
}

export interface ChatGuardian {
  id: number;
  userId: number;
  chatId: string;
  displayName: string;
  profileColor: UserProfileColors;
  studentRelationship: string;
  guardianRelationship: string;
}

export interface ChatStudent {
  id: number;
  userId: number;
  chatId: string;
  displayName: string;
  imageUrl: string;
  guardians: ChatGuardian[];
}

export interface ChatGroup {
  id: number;
  displayName: string;
  level: {
    id: number;
    displayName: string;
  };
  academicYearId: number;
  chatId: string;
}
