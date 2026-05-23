import { UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { attendancePageMenuItems } from '@pages/attendance/attendance.page';
import { computed, inject, signal, Signal } from '@angular/core';
import { IMenuRoutes } from '../layout/menu-routes.interface';
import { announcementsPageMenuItems } from '@pages/announcements/announcements-home.component';
import { courseManagementPageMenuItems } from '@pages/course-management/course-management-home.page';
import { AuthService } from '@auth/auth.service';
import {
  gradeManagementPermissions,
  gradePageMenuItems,
} from '@pages/report-card/report-card-landing.page';
import { ISideMenuItem } from './components/side-nav/side-nav.component';
import { isDevEnvironment } from '@shared/utils/env.util';
import { createSupportTicketAccess } from '@shared/utils/support-ticket-access';
const isAllowForDevEnv = isDevEnvironment();

export function mainMenuRoutes(): Signal<ISideMenuItem[]> {
  const attendancePageRoutes = attendancePageMenuItems();
  const auth = inject(AuthService);
  const supportTicketAccess = createSupportTicketAccess();

  return computed(
    () =>
      [
        {
          path: 'home',
          titleI18nKey: 'global.home.title',
          iconName: 'feed',
          placement: 'upper',
          isPublic: true,
        },
        {
          path: 'lms',
          titleI18nKey: 'global.courses.title',
          iconName: 'course',
          permissions: [
            RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS,
          ],
          isHide: false,
          UserTypes: [UserType.STUDENT, UserType.GUARDIAN],
          placement: 'upper',
          backgroundImage: 'assets/images/bg-coral.svg',
        },

        {
          path: 'user-management',
          titleI18nKey: 'global.user_management.title',
          iconName: 'user-management',
          permissions: [
            RESOURCE_PERMISSION.student.viewStudentsList,
            RESOURCE_PERMISSION.personnel.viewPersonnelList,
            RESOURCE_PERMISSION.guardians.viewGuardiansList,
          ],
          UserTypes: [UserType.PERSONNEL],
          placement: 'upper',
          backgroundImage: 'assets/images/bg-brand.svg',
        },
        {
          path: 'school-structure',
          titleI18nKey: 'global.school_structure.title',
          iconName: 'school-structure',
          permissions: [RESOURCE_PERMISSION.company.viewCompanyList],
          placement: 'upper',
          backgroundImage: 'assets/images/bg-cyan.svg',
          isShowNavIcon: true,
          clickable: true,
        },
        {
          path: 'course-management',
          titleI18nKey: 'global.courses.title',
          iconName: 'course',
          permissions: [
            RESOURCE_PERMISSION.course.courseListView,
            RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
          ],
          subRoutes: courseManagementPageMenuItems(),
          placement: 'upper',
          backgroundImage: 'assets/images/bg-coral.svg',
        },
        {
          path: 'announcements',
          titleI18nKey: 'global.announcements.title',
          iconName: 'announcement',
          iconClass: 'text-[2.25rem]',
          permissions: [RESOURCE_PERMISSION.announcement.announcementListView],
          subRoutes: announcementsPageMenuItems(),
          placement: 'upper',
        },
        {
          path: 'chat',
          titleI18nKey: 'global.chats.title',
          iconName: 'chat',
          permissions: [RESOURCE_PERMISSION.chat.chatListView],
          placement: 'upper',
          backgroundImage: 'assets/images/bg-brand.svg',
          isHideFromSuperAdmin: true,
        },
        {
          path: 'attendance',
          titleI18nKey: 'global.attendance.title',
          iconName: 'attendance',
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
          backgroundImage: 'assets/images/bg-blue.svg',
        },
        {
          path: 'support-hub',
          titleI18nKey: 'global.support_ticket.title',
          iconName: 'support',
          permissions: supportTicketAccess.managePermissions,
          isHide: false,
          notificationUnreadCountFn: (notification: any) =>
            notification?.tickets?.assigneeUnreadCounts,
          placement: 'upper',
          backgroundImage: 'assets/images/bg-indigo.svg',
        },
        {
          path: 'reports',
          titleI18nKey: 'global.reports.title',
          iconName: 'report',
          permissions: [...Object.values(RESOURCE_PERMISSION.REPORTS.READ)],
          isHide: false,
          placement: 'upper',
          backgroundImage: 'assets/images/bg-indigo.svg',
        },
        {
          path: 'vcr',
          titleI18nKey: 'global.virtual_classrooms_vcr.title',
          iconName: 'VCR',
          isHide: false,
          placement: 'upper',
          permissions: [...Object.values(RESOURCE_PERMISSION.VCR.READ)],
          backgroundImage: 'assets/images/bg-gray-rich.svg',
        },
        {
          path: auth.isUserPersonnel()
            ? 'pickup/personnel-history'
            : 'pickup/guardian-history',
          titleI18nKey: 'dismissal.pickup_history.title',
          iconName: 'pickup',
          isHide: false,
          placement: 'upper',
          permissions: [
            RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_GUARDIAN,
            RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_PERSONNEL,
          ],
          isHideFromSuperAdmin: true,
          backgroundImage: 'assets/images/bg-green.svg',
        },
        {
          path: 'pickup/personnel-request',
          titleI18nKey: 'global.pickup.title',
          iconName: 'pickup',
          isHide: false,
          placement: 'upper',
          permissions: [
            RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST,
            RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
          ],
          isHideFromSuperAdmin: false,
          backgroundImage: 'assets/images/bg-green.svg',
        },
        {
          path: auth.isUserPersonnel() ? 'journal' : 'journal/user-journal',
          titleI18nKey: 'journals.journals.title',
          iconName: 'journal',
          isHide: false,
          placement: 'upper',
          permissions: [...Object.values(RESOURCE_PERMISSION.JOURNAL.READ)],
          backgroundImage: 'assets/images/bg-orange.svg',
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
          backgroundImage: 'assets/images/bg-yellow.svg',
        },
        {
          path: 'learning-outcomes',
          titleI18nKey: 'resource.learning_outcome',
          iconName: 'learning-outcome',
          permissions: [RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_UNITS],
          isHide: !isAllowForDevEnv,
          placement: 'upper' as const,
          backgroundImage: 'assets/images/bg-coral.svg',
        },
        {
          path: 'help-center',
          titleI18nKey: 'global.help_center.title',
          iconName: 'support',
          placement: 'upper',
          isPublic: true,
        },
        ...(isAllowForDevEnv
          ? [
              {
                path: 'design-system-demo',
                titleI18nKey: 'Components Demo',
                iconName: 'feed',
                placement: 'upper' as const,
              },
            ]
          : []),
      ].filter((route) => route.isHide !== true) as ISideMenuItem[],
  );
}

export const mobileRoutes: IMenuRoutes[] = [
  {
    path: 'home',
    titleI18nKey: 'global.home.title',
    iconName: 'feed',
    placement: 'upper' as const,
    isPublic: true,
  },
  {
    path: 'chat',
    titleI18nKey: 'global.chats.title',
    iconName: 'chat',
    permissions: [RESOURCE_PERMISSION.chat.chatListView],
    placement: 'upper' as const,
    isHideFromSuperAdmin: true,
  },
  {
    path: 'course-management',
    titleI18nKey: 'global.courses.title',
    iconName: 'course',
    permissions: [
      RESOURCE_PERMISSION.course.courseListView,
      RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
    ],
    subRoutes: courseManagementPageMenuItems(),
    placement: 'upper',
  },
  // TODO: remove this once the redesign is completed
  // {
  //   path: 'my-courses',
  //   titleI18nKey: 'global.courses.title',
  //   iconName: 'course',
  //   permissions: [
  //     RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS,
  //   ],
  //   isHide: false,
  //   UserTypes: [UserType.STUDENT, UserType.GUARDIAN],
  //   placement: 'upper' as const,
  // },
  {
    path: 'lms/courses',
    titleI18nKey: 'global.courses.title',
    iconName: 'course',
    permissions: [
      RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS,
    ],
    isHide: false,
    UserTypes: [UserType.STUDENT, UserType.GUARDIAN],
    placement: 'upper' as const,
  },
  {
    path: 'pickup',
    titleI18nKey: 'global.pickup.title',
    iconName: 'pickup',
    placement: 'upper' as const,
    permissions: [RESOURCE_PERMISSION.DISMISSAL.CREATE.CREATE_DISMISSAL],
    isHideFromSuperAdmin: true,
  },
  {
    path: 'pickup/personnel-request',
    titleI18nKey: 'global.pickup.title',
    iconName: 'pickup',
    placement: 'upper' as const,
    permissions: [
      RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST,
      RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
    ],
  },
  {
    path: 'menu',
    titleI18nKey: 'global.see_all.txt',
    iconName: 'see-more',
    isHide: false,
    placement: 'upper' as const,
    isPublic: true,
  },
];
