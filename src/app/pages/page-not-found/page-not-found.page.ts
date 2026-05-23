import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.page.html',
  standalone: true,
  imports: [IonImg, IonContent, TranslocoDirective],
})
export class PageNotFoundPage implements OnInit {
  private readonly layoutUiControlService = inject(LayoutUiControlService);

  constructor() {}

  ngOnInit() {
    this.layoutUiControlService.hideBreadcrumb();
  }
}
