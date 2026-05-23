import { Component, input } from '@angular/core';

export interface ProfileSubjectItem {
  name: string;
  icon?: string;
}

@Component({
  selector: 'app-profile-subject-list',
  standalone: true,
  template: `
    <div class="flex flex-col gap-ds-md">
      @for (subject of subjects(); track subject.name) {
        <div class="flex items-center gap-ds-md rounded-ds-md p-ds-md">
          <img
            [src]="subject.icon || 'assets/icons/subject-default.svg'"
            alt=""
            class="size-6 shrink-0"
          />
          <span class="content-md-mid-emphasis text-emphasis-high">
            {{ subject.name }}
          </span>
        </div>
      }
    </div>
  `,
})
export class ProfileSubjectListComponent {
  readonly subjects = input<ProfileSubjectItem[]>([]);

  closeModal?: (data?: unknown, role?: string) => void;
}
