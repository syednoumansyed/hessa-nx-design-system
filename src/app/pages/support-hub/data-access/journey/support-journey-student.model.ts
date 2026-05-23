import { UserProfileColors } from '@shared/enums';

export interface SupportJourneyStudent {
  readonly id: string;
  readonly fullName: string;
  readonly levelLabel: string;
  readonly classLabel: string;
  readonly avatarColor: UserProfileColors;
  readonly avatarUrl?: string | null;
  readonly schoolId?: number | null;
}
