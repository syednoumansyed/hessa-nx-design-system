import { Component, input, Input } from '@angular/core';
import { DsCalendarSummaryConfig } from './calender.interface';
import { DsIconComponent } from '../icon/icon.component';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'ds-calendar-summary',
  standalone: true,
  template: `
    @if (summaryConfig()?.length) {
      <div
        class="container mb-5 flex max-w-full overflow-hidden rounded-3xl border-2 border-stroke-mid bg-white"
      >
        @for (config of summaryConfig(); track config; let i = $index) {
          <div
            class="container-item flex w-[50%] gap-ds-md overflow-hidden p-ds-lg"
            [ngClass]="{ 'border-e-2 border-stroke-mid': i === 0 }"
            data-summary-item
          >
            <div
              class="large-item content-lg-high-emphasis flex items-start gap-ds-sm {{
                config.cssClass
              }}"
            >
              <app-ds-icon [icon]="config.icon"></app-ds-icon>
              <div class="flex flex-col gap-1">
                <div class="content-lg-high-emphasis" data-summary-count>
                  {{ config.count }}
                </div>
                <div
                  class="single-line-caption-low-emphasis text-content-mid"
                  data-summary-label
                >
                  {{ config.label }}
                </div>
              </div>
            </div>
            <div class="flex flex-col justify-between gap-ds-sm">
              @for (child of config.children; track child) {
                <div
                  class="flex items-center gap-1 md:gap-2"
                  data-summary-child
                  role="listitem"
                >
                  <app-ds-icon [icon]="child.icon" size="20px"></app-ds-icon>
                  <div class="flex items-center gap-ds-xs text-content-mid">
                    <div
                      class="single-line-xs-high-emphasis"
                      data-summary-child-count
                    >
                      {{ child.count }}
                    </div>
                    <div
                      class="single-line-caption-mid-emphasis text-content-mid"
                      data-summary-child-label
                    >
                      {{ child.label }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  imports: [DsIconComponent, NgClass],
})
export class CalendarSummaryComponent {
  summaryConfig = input<DsCalendarSummaryConfig[]>();
}
