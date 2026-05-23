import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  IPageItem,
  PagesListComponent,
} from '@shared/components/pages-list/pages-list.component';
import { provideIcons } from '@ng-icons/core';
import { saxBook1Bulk, saxBookBulk } from '@ng-icons/iconsax/bulk';
import { IMenuRoutes } from '@layout/menu-routes.interface';

@Component({
  selector: 'app-course-management-home',
  templateUrl: './course-management-home.page.html',
  standalone: true,
  imports: [IonContent, PagesListComponent],
  viewProviders: [provideIcons({ saxBook1Bulk, saxBookBulk })],
})
export class CourseManagementHomePage {
  listings = courseManagementPageMenuItems();
}

export function courseManagementPageMenuItems(): Array<IMenuRoutes> {
  return [
    {
      iconName: 'saxBook1Bulk',
      titleI18nKey: 'content_management.manage_courses.title',
      path: '/course-management/courses',
      permissions: [RESOURCE_PERMISSION.course.courseListView],
    },
    {
      iconName: 'saxBookBulk',
      titleI18nKey: 'content_management.manage_content.title',
      path: '/course-management/content/courses',
      permissions: [
        RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
      ],
    },
  ];
}
