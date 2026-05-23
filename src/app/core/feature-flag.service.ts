import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly authService = inject(AuthService);

  // Returns true if the redesign flag is enabled for the current logged-in user
  isRedesignEnabled(flag: keyof RedesignFlags): boolean {
    const userType = this.authService.user()?.type;
    const feature = REDESIGN_FLAGS[flag];
    if (feature && typeof feature === 'object' && userType) {
      return !!feature[userType];
    }
    return false;
  }
}

interface RedesignFlags {
  attendanceMonthlyView: Record<UserType, boolean>;
}

const REDESIGN_FLAGS: RedesignFlags = {
  attendanceMonthlyView: {
    [UserType.GUARDIAN]: true,
    [UserType.STUDENT]: true,
    [UserType.PERSONNEL]: false,
  },
};
