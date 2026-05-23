import { Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

/**
 * Skeleton component that matches the student cards layout
 * in the tabs demo.
 */
@Component({
  selector: 'app-tabs-content-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  template: `
    <!-- Title skeleton -->
    <ion-skeleton-text
      animated="true"
      class="mb-4 h-7 w-40 rounded"
    ></ion-skeleton-text>

    <!-- Student cards skeleton -->
    <div class="flex flex-col gap-3">
      @for (i of [1, 2, 3, 4, 5]; track i) {
        <div
          class="bg-cool-black-02 rounded-ds-md border border-stroke-cool-black-04 p-ds-md"
        >
          <!-- Name -->
          <ion-skeleton-text
            animated="true"
            class="mb-2 h-5 w-48 rounded"
          ></ion-skeleton-text>
          <!-- ID & Gender -->
          <ion-skeleton-text
            animated="true"
            class="mb-1 h-4 w-36 rounded"
          ></ion-skeleton-text>
          <!-- National ID -->
          <ion-skeleton-text
            animated="true"
            class="h-3 w-44 rounded"
          ></ion-skeleton-text>
        </div>
      }
    </div>
  `,
})
export class TabsContentSkeletonComponent {}
