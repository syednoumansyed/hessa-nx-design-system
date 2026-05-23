import { Component, input } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';

export interface SupportTicketSchoolInfo {
  readonly title?: string | null;
  readonly subtitle?: string | null;
}

@Component({
  selector: 'app-support-ticket-school-info',
  standalone: true,
  imports: [DsIconComponent],
  template: `
    <div class="text-emphasis-mid">
      <div class="flex items-center gap-ds-md">
        <app-ds-icon
          [icon]="'school'"
          [cssClass]="'text-surface-pastel-foreground-indigo'"
          size="100%"
        ></app-ds-icon>
        <div>
          @if (school().title) {
            <p class="content-md-mid-emphasis text-emphasis-mid">
              {{ school().title }}
            </p>
          }
          @if (school().subtitle) {
            <p class="heading-h5-high-emphasis text-emphasis-high">
              {{ school().subtitle }}
            </p>
          }
        </div>
      </div>
    </div>
  `,
})
export class SupportTicketSchoolInfoComponent {
  readonly school = input.required<SupportTicketSchoolInfo>();
}
