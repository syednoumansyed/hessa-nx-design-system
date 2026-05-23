import { Component, computed, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { provideIcons } from '@ng-icons/core';
import {
  saxMessageQuestionBulk,
  saxNoteTextBulk,
  saxTicketBulk,
} from '@ng-icons/iconsax/bulk';
import {
  IPageItem,
  PagesListComponent,
} from '@shared/components/pages-list/pages-list.component';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';

@Component({
  selector: 'app-settings',
  templateUrl: './help-center.page.html',
  standalone: true,
  imports: [IonContent, PagesListComponent],
  viewProviders: [
    provideIcons({ saxMessageQuestionBulk, saxNoteTextBulk, saxTicketBulk }),
  ],
})
export class HelpCenterPage {
  listings = helpCenterPageMenuItems()();
}

export function helpCenterPageMenuItems() {
  const schoolStructureScopeService = inject(SchoolStructureScopeService);
  return computed(() => {
    const isSchoolStructureEmpty =
      schoolStructureScopeService.isSchoolStructureEmpty();
    return [
      {
        iconName: 'saxMessageQuestionBulk',
        titleI18nKey: 'user_manual.faq.title',
        path: '/help-center/faqs',
      },
      {
        iconName: 'saxNoteTextBulk',
        titleI18nKey: 'global.user_manual.title',
        path: '/help-center/user-manual',
      },
    ];
  });
}
