import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, Platform } from '@ionic/angular/standalone';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { AppUpdateService } from '@core/app-update.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-app-update',
  templateUrl: './app-update.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HessaBtnDirective,
    IonButton,
    TranslocoDirective,
  ],
})
export class AppUpdatePage implements OnInit {
  appUpdateService = inject(AppUpdateService);
  constructor(private platform: Platform) {}

  ngOnInit() {
    this.platform.backButton.subscribeWithPriority(
      9999,
      (processNextHandler) => {
        // Do nothing, this is an effective way to block the back button
      },
    );
  }

  updateApp() {
    this.appUpdateService.openUpdatePage();
  }
}
