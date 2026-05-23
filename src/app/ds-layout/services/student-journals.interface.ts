import { JournalType, UserProfileColors } from '@shared/enums';

export interface JournalCardData {
  id: number | null;
  displayName: string;
  avatar: string | null;
  studentId: number;
  updatedAt?: string | null;
  createdAt?: string | null;
  journalDate?: string;
  type: JournalType;
  viewed: boolean | null;
  viewedByGuardian: boolean | null;
  profileColor?: UserProfileColors;
}
