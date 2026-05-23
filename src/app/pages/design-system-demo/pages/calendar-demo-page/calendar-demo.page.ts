import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CalendarDemoComponent } from '../../calendar-demo/calendar-demo.component';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-calendar-demo-page',
  standalone: true,
  imports: [IonContent, CalendarDemoComponent, DemoPageWrapperComponent],
  template: `
    <ion-content>
      <div class="p-4 md:p-6">
        <app-demo-page-wrapper title="Calendar">
          <app-calendar-demo />
        </app-demo-page-wrapper>
      </div>
    </ion-content>
  `,
})
export class CalendarDemoPage {}
