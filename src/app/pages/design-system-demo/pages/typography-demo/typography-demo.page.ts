import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-typography-demo',
  standalone: true,
  imports: [IonContent, DemoPageWrapperComponent],
  templateUrl: './typography-demo.page.html',
})
export class TypographyDemoPage {}
