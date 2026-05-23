import { Component, computed, inject, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import {
  IPageItem,
  PagesListComponent,
} from '@shared/components/pages-list/pages-list.component';
import { provideIcons } from '@ng-icons/core';
import {
  saxUserBulk,
  saxUserMinusBulk,
  saxUserTickBulk,
} from '@ng-icons/iconsax/bulk';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { FeatureFlagService } from '@core/feature-flag.service';
import { IMenuRoutes } from '@layout/menu-routes.interface';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  standalone: true,
  imports: [IonContent, PagesListComponent],
  viewProviders: [
    provideIcons({ saxUserBulk, saxUserMinusBulk, saxUserTickBulk }),
  ],
})
export class AttendancePage implements OnInit {
  private readonly auth = inject(AuthService);

  listings = attendancePageMenuItems();
  constructor() {}

  ngOnInit() {}
}

export function attendancePageMenuItems() {
  const auth = inject(AuthService);
  const studentsScope = inject(StudentSelectionScopeService);
  const featureFlags = inject(FeatureFlagService);

  return computed<Array<IMenuRoutes>>(() => {
    const user = auth.user();
    const isMonthlyViewEnabled = featureFlags.isRedesignEnabled(
      'attendanceMonthlyView',
    );
    return [
      ...[
        !(
          user?.type === UserType.GUARDIAN &&
          !studentsScope.studentSelectionScope().length
        ) && {
          iconName: 'saxUserBulk',
          titleI18nKey: 'attendance.view_attendance.title',
          path: isMonthlyViewEnabled
            ? '/attendance/monthly-detail'
            : '/attendance/view',
          permissions: [RESOURCE_PERMISSION.attendance.DETAIL],
        },
      ],
      {
        iconName: 'saxUserTickBulk',
        titleI18nKey: 'attendance.mark_attendance.title',
        path: '/attendance/list',
        permissions: [
          RESOURCE_PERMISSION.attendance.CREATE,
          RESOURCE_PERMISSION.attendance.UPDATE,
        ],
      },
      {
        iconName: 'saxUserMinusBulk',
        titleI18nKey: 'attendance.confirm_absence.title',
        path: '/attendance/confirm-absence',
        permissions: [RESOURCE_PERMISSION.attendance.CONFIRM_ABSENCE],
      },
    ].filter(Boolean) as IPageItem[];
  });
}
