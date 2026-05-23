import { UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { attendancePageMenuItems } from '@pages/attendance/attendance.page';
import { computed, inject, Signal } from '@angular/core';
import { IMenuRoutes } from './menu-routes.interface';
import { announcementsPageMenuItems } from '@pages/announcements/announcements-home.component';
import { courseManagementPageMenuItems } from '@pages/course-management/course-management-home.page';
import {
  settingPermissions,
  settingsPageMenuItems,
} from '@pages/settings/settings.page';
import { AuthService } from '@auth/auth.service';
import {
  gradeManagementPermissions,
  gradePageMenuItems,
} from '@pages/report-card/report-card-landing.page';

export function mainMenuRoutes(): Signal<IMenuRoutes[]> {
  const attendancePageRoutes = attendancePageMenuItems();
  const auth = inject(AuthService);

  return computed(() => [
    {
      path: 'home',
      titleI18nKey: 'global.home.title',
      iconName: 'saxHome2Outline',
      placement: 'upper',
      isPublic: true,
    },
    // {
    //   // my courses route for students and guardians
    //   path: 'my-courses',
    //   titleI18nKey: 'global.my_courses.title',
    //   iconName: 'saxBook1Outline',
    //   // TODO: update permission ids and hide for admins
    //   permissions: [
    //     RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS,
    //   ],
    //   isHide: false,
    //   UserTypes: [UserType.STUDENT, UserType.GUARDIAN],
    //   placement: 'upper',
    // },
    // {
    //   path: 'design-system-demo',
    //   titleI18nKey: 'Redesign Demo',
    //   iconName: 'saxHome2Outline',
    //   placement: 'upper',
    // },
    {
      // my courses route for students and guardians
      path: 'lms',
      titleI18nKey: 'global.courses.title',
      iconName: 'saxBook1Outline',
      // TODO: update permission ids and hide for admins
      permissions: [
        RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS,
      ],
      isHide: false,
      UserTypes: [UserType.STUDENT, UserType.GUARDIAN],
      placement: 'upper',
    },
    {
      path: 'user-management',
      titleI18nKey: 'global.user_management.title',
      iconName: 'saxUserSearchOutline',
      permissions: [
        RESOURCE_PERMISSION.student.viewStudentsList,
        RESOURCE_PERMISSION.personnel.viewPersonnelList,
        RESOURCE_PERMISSION.guardians.viewGuardiansList,
      ],
      UserTypes: [UserType.PERSONNEL],
      placement: 'upper',
    },
    {
      path: 'school-structure',
      titleI18nKey: 'global.school_structure.title',
      iconName: 'saxBuildings2Outline',
      permissions: [RESOURCE_PERMISSION.company.viewCompanyList],
      placement: 'upper',
    },
    {
      path: 'course-management',
      titleI18nKey: 'global.course_management.title',
      iconName: 'saxBook1Outline',
      permissions: [
        RESOURCE_PERMISSION.course.courseListView,
        RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
      ],
      subRoutes: courseManagementPageMenuItems(),
      placement: 'upper',
    },
    {
      path: 'announcements',
      titleI18nKey: 'global.announcements.title',
      iconName: 'announcements',
      iconClass: 'text-[2.25rem]',
      permissions: [RESOURCE_PERMISSION.announcement.announcementListView],
      subRoutes: announcementsPageMenuItems(),
      placement: 'upper',
    },
    {
      path: 'chat',
      titleI18nKey: 'global.chats.title',
      iconName: 'saxMessages3Outline',
      permissions: [RESOURCE_PERMISSION.chat.chatListView],
      placement: 'upper',
      isHideFromSuperAdmin: true,
    },
    {
      path: 'attendance',
      titleI18nKey: 'global.attendance.title',
      iconName: 'saxUserOctagonOutline',
      isHide: false,
      permissions: [
        RESOURCE_PERMISSION.attendance.LIST,
        RESOURCE_PERMISSION.attendance.DETAIL,
        RESOURCE_PERMISSION.attendance.CREATE,
        RESOURCE_PERMISSION.attendance.UPDATE,
        RESOURCE_PERMISSION.attendance.CONFIRM_ABSENCE,
      ],
      subRoutes: attendancePageRoutes(),
      placement: 'upper',
    },
    {
      path: 'support-tickets',
      titleI18nKey: 'global.support_ticket.title',
      iconName: 'saxTicketOutline',
      permissions: [RESOURCE_PERMISSION.supportTicket.viewMyAssignedTickets],
      isHide: true,
      notificationUnreadCountFn: (notification) =>
        notification?.tickets?.assigneeUnreadCounts,
      placement: 'upper',
    },
    {
      path: 'reports',
      titleI18nKey: 'global.reports.title',
      iconName: 'saxDocumentCopyOutline',
      permissions: [...Object.values(RESOURCE_PERMISSION.REPORTS.READ)],
      isHide: true,
      placement: 'upper',
    },
    {
      path: 'vcr',
      titleI18nKey: 'global.virtual_classrooms_vcr.title',
      iconName: 'open-book',
      isHide: true,
      placement: 'upper',
      permissions: [...Object.values(RESOURCE_PERMISSION.VCR.READ)],
    },
    {
      path: 'pickup/guardian-history',
      titleI18nKey: 'dismissal.pickup_history.title',
      iconName: 'saxRefreshOutline',
      isHide: true,
      placement: 'upper',
      permissions: [
        RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_GUARDIAN,
      ],
      isHideFromSuperAdmin: true,
    },
    {
      path: 'pickup/personnel-request',
      titleI18nKey: 'global.pickup_requests.title',
      iconName: 'saxCarOutline',
      isHide: true,
      placement: 'upper',
      permissions: [
        RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST,
        RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
      ],
      isHideFromSuperAdmin: true,
    },
    {
      path: 'pickup/personnel-history',
      titleI18nKey: 'dismissal.pickup_history.title',
      iconName: 'saxRefreshOutline',
      isHide: true,
      placement: 'upper',
      permissions: [
        RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_PERSONNEL,
      ],
    },
    {
      path: auth.isUserPersonnel() ? 'journal' : 'journal/user-journal',
      titleI18nKey: 'journals.journals.title',
      iconName: 'journals',
      isHide: true,
      placement: 'upper',
      permissions: [...Object.values(RESOURCE_PERMISSION.JOURNAL.READ)],
    },
    {
      path: auth.isUserPersonnel() ? 'grade-management' : 'report-card',
      titleI18nKey: auth.isUserPersonnel()
        ? 'grade_management.title'
        : 'global.report_card.title',
      iconName: 'grade-management',
      placement: 'upper',
      permissions: auth.isUserPersonnel()
        ? gradeManagementPermissions()
        : [RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW],
      subRoutes: auth.isUserPersonnel() ? gradePageMenuItems() : [],
    },
    {
      path: 'support-hub',
      titleI18nKey: 'global.help_center.title',
      iconName: 'saxInfoCircleOutline',
      placement: 'lower',
      isPublic: true,
      notificationUnreadCountFn: (notification) =>
        notification?.tickets.initiatorUnreadCounts,
    },
    {
      path: 'settings',
      titleI18nKey: 'global.settings.title',
      iconName: 'saxSetting2Outline',
      placement: 'lower',
      permissions: settingPermissions(),
      subRoutes: settingsPageMenuItems(),
    },
  ]);
}
