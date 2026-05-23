import { Component, inject, OnInit } from '@angular/core';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { IonContent, IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.page.html',
  standalone: true,
  imports: [IonContent, IonImg, TranslocoDirective],
})
export class UnauthorizedPage implements OnInit {
  private readonly layoutUiControlService = inject(LayoutUiControlService);

  ngOnInit() {
    this.layoutUiControlService.hideBreadcrumb();
  }
}
