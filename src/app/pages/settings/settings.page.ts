import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { IconCardComponent } from '@shared/components/icon-card/icon-card.component';
import { RbacSomeDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    IonContent,
    TranslocoDirective,
    IconCardComponent,
    RbacSomeDirective,
  ],
})
export class SettingsPage {
  private readonly router = inject(Router);
  listings = settingsPageMenuItems();

  navigate(path: string) {
    void this.router.navigate([path]);
  }

  getIconSrc(iconName?: string): string | undefined {
    if (!iconName) return undefined;
    return `assets/icons/${iconName}.svg`;
  }
}

export function settingsPageMenuItems(): Array<IMenuRoutes> {
  return [
    {
      iconName: 'academic',
      titleI18nKey: 'academic_enrollment.academic_years_semesters.title',
      path: '/academic-year',
      permissions: getAcademicYearSettingPermission(),
    },
    {
      iconName: 'user-group',
      titleI18nKey: 'roles_permissions.roles_and_permissions.title',
      path: '/settings/roles',
      permissions: getRoleAndPermissionSettingPermission(),
    },
    {
      iconName: 'configure-escalation',
      titleI18nKey:
        'support_ticket.configure_escalation_levels_by_ticket_types.title',
      path: '/settings/configure-escalation',
      permissions: getEscalationSettingPermission(),
    },
    {
      iconName: 'time-period',
      titleI18nKey: 'time_period.time_periods.title',
      path: '/settings/time-periods',
      permissions: getTimePeriodsPermission(),
    },
    {
      iconName: 'attendance',
      titleI18nKey: 'attendance.attendance_settings.title',
      path: '/settings/attendance-setting',
      permissions: getAttendanceSettingPermission(),
    },
    {
      iconName: 'category-settings',
      titleI18nKey: 'support_tickets.category_settings.title',
      path: '/settings/ticket-type',
      permissions: getTicketTypeSettingPermission(),
    },
  ];
}

function getAcademicYearSettingPermission() {
  const {
    academicYearCreate,
    academicYearDetailView,
    academicYearDelete,
    academicYearUpdate,
  } = RESOURCE_PERMISSION.academicYear;
  return [
    academicYearCreate,
    academicYearDetailView,
    academicYearDelete,
    academicYearUpdate,
  ];
}

function getRoleAndPermissionSettingPermission() {
  const { viewRoleDetail, createRole, updateRole, deleteRole } =
    RESOURCE_PERMISSION.rolesAndPermission;
  return [viewRoleDetail, createRole, updateRole, deleteRole];
}

function getEscalationSettingPermission() {
  return [RESOURCE_PERMISSION.supportTicket.viewEscalationList];
}

function getAttendanceSettingPermission() {
  return [RESOURCE_PERMISSION.attendance.VIEW_GLOBAL_END_TIME];
}

function getTimePeriodsPermission() {
  return [RESOURCE_PERMISSION.TIME_PERIODS.READ.VIEW_TIME_PERIODS_LIST];
}

function getTicketTypeSettingPermission() {
  return [RESOURCE_PERMISSION.supportTicket.viewCategoryDetails];
}

export function settingPermissions() {
  return [
    ...getRoleAndPermissionSettingPermission(),
    ...getAcademicYearSettingPermission(),
    ...getEscalationSettingPermission(),
    ...getAttendanceSettingPermission(),
    ...getTicketTypeSettingPermission(),
  ];
}
