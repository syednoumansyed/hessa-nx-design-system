import { Component, OnInit } from '@angular/core';
import {
  IPageItem,
  PagesListComponent,
} from '@shared/components/pages-list/pages-list.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { IonContent } from '@ionic/angular/standalone';
import { provideIcons } from '@ng-icons/core';
import { saxBook1Bulk, saxBookBulk } from '@ng-icons/iconsax/bulk';

@Component({
  selector: 'app-announcements-home',
  templateUrl: './announcements-home.component.html',
  standalone: true,
  imports: [IonContent, PagesListComponent],
  providers: [provideIcons({ saxBook1Bulk, saxBookBulk })],
})
export class AnnouncementsHomeComponent implements OnInit {
  listings = announcementsPageMenuItems();
  constructor() {}

  ngOnInit() {}
}

export function announcementsPageMenuItems(): Array<IPageItem> {
  return [
    {
      svg: 'manage-announcements',
      titleI18nKey: 'global.manage_announcements.title',
      path: '/announcements/manage',
      permission: RESOURCE_PERMISSION.announcement.announcementListView,
      iconClass: 'text-5xl !h-9',
    },
    {
      svg: 'announcement-solid',
      titleI18nKey: 'global.view_announcements.title',
      path: '/announcements/user-feed',
      iconClass: '!h-[2.5rem] !w-[2.6rem] text-primary',
    },
  ];
}
