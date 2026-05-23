import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesListComponent } from '@shared/components/pages-list/pages-list.component';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Component({
  templateUrl: './report-card-landing.page.html',
  standalone: true,
  imports: [CommonModule, PagesListComponent],
})
export class ReportCardLandingPage {
  private readonly rbacService = inject(RoleBaseAccessControlService);

  listings = computed(() => {
    const isSuperAdmin = this.rbacService.isSuperAdmin();
    return gradePageMenuItems().filter(
      (item) => !(item.isHideFromSuperAdmin && isSuperAdmin),
    );
  });
}

export function gradePageMenuItems(): Array<IMenuRoutes> {
  return [
    {
      iconName: 'grade-scale',
      titleI18nKey: 'grade_management.manage_grade_scale.title',
      path: 'grade-scale',
      permissions: getGradeScalePermission(),
    },
    {
      iconName: 'manage-report-card',
      titleI18nKey: 'global.manage_report_card.title',
      path: 'manage-report-card',
      permissions: getManageReportCardPermission(),
    },
    {
      iconName: 'report-cards',
      titleI18nKey: 'global.report_cards.tilte',
      path: 'process-report-cards',
      permissions: getReportCardsPermission(),
    },
    {
      iconName: 'report-entries',
      titleI18nKey: 'grade_management.report_card_entries.title',
      path: 'list-courses',
      permissions: getTeacherReportCardPermission(),
      isHideFromSuperAdmin: true,
    },
  ];
}

function getGradeScalePermission() {
  return [RESOURCE_PERMISSION.GRADE_MANAGEMENT.GRADE_SCALE.READ];
}

function getManageReportCardPermission() {
  return [
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.CONFIGURATION.MANAGE_REPORT_CARDS,
  ];
}

function getReportCardsPermission() {
  return [RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.LIST_CARDS];
}

function getTeacherReportCardPermission() {
  return [
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.TEACHER_MARKS.CREATE_MARK,
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.TEACHER_MARKS.UPDATE_MARKS,
  ];
}

export function gradeManagementPermissions() {
  return [
    ...getGradeScalePermission(),
    ...getManageReportCardPermission(),
    ...getReportCardsPermission(),
  ];
}
