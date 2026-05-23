import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faHandPointer,
  faInputText,
  faSquareCheck,
  faCalendarClock,
  faMessageExclamation,
  faTableLayout,
  faTableList,
  faBuilding,
  faFilter,
  faFileLines,
  faCalendarDay,
  faFont,
  faLayerGroup,
} from '@fortawesome/pro-solid-svg-icons';

interface DemoPageItem {
  icon: IconDefinition;
  title: string;
  path: string;
}

@Component({
  selector: 'app-design-system-demo-hub',
  standalone: true,
  imports: [IonContent, RouterModule, FontAwesomeModule],
  template: `
    <ion-content>
      <div class="p-4 md:p-10">
        <div
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
        >
          @for (item of listings; track item.path) {
            <a
              [routerLink]="item.path"
              class="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-center no-underline transition-colors hover:bg-[#FFFCE7] md:gap-4 md:p-6"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFFCE7] md:h-16 md:w-16"
              >
                <fa-icon
                  [icon]="item.icon"
                  class="text-xl text-primary md:text-3xl"
                ></fa-icon>
              </div>
              <span
                class="text-sm font-medium text-gray-900 md:text-base lg:text-lg"
              >
                {{ item.title }}
              </span>
            </a>
          }
        </div>
      </div>
    </ion-content>
  `,
})
export class DesignSystemDemoHubPage {
  listings: DemoPageItem[] = [
    {
      icon: faHandPointer,
      title: 'Buttons',
      path: '/design-system-demo/buttons',
    },
    {
      icon: faInputText,
      title: 'Form Inputs',
      path: '/design-system-demo/inputs',
    },
    {
      icon: faSquareCheck,
      title: 'Selection Controls',
      path: '/design-system-demo/selections',
    },
    {
      icon: faCalendarClock,
      title: 'Data Entry',
      path: '/design-system-demo/data-entry',
    },
    {
      icon: faMessageExclamation,
      title: 'Feedback & Overlays',
      path: '/design-system-demo/feedback',
    },
    {
      icon: faTableLayout,
      title: 'Navigation & Layout',
      path: '/design-system-demo/navigation',
    },
    {
      icon: faTableList,
      title: 'Data Display',
      path: '/design-system-demo/data-display',
    },
    {
      icon: faBuilding,
      title: 'School Structure',
      path: '/design-system-demo/school-structure',
    },
    {
      icon: faFilter,
      title: 'Filter Panel',
      path: '/design-system-demo/filter-panel',
    },
    {
      icon: faFileLines,
      title: 'Form Renderer',
      path: '/design-system-demo/forms',
    },
    {
      icon: faLayerGroup,
      title: 'Accordion',
      path: '/design-system-demo/accordion',
    },
    {
      icon: faCalendarDay,
      title: 'Calendar',
      path: '/design-system-demo/calendar',
    },
    {
      icon: faFont,
      title: 'Typography',
      path: '/design-system-demo/typography',
    },
  ];
}
