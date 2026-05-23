import { UserProfileColors } from '@shared/enums';

export interface SupportHubTicketPersonnel {
  id: number;
  userId: number;
  displayName: string;
  roles: string;
  profileColor: UserProfileColors;
}
