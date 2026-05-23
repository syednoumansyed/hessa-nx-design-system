import { Component, inject } from '@angular/core';
import { AppUpdateService } from '@core/app-update.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-app-update',
  templateUrl: './app-update.component.html',
  imports: [TranslocoDirective],
  standalone: true,
})
export class AppUpdateComponent implements DsModalContentComponent {
  private readonly appUpdateService = inject(AppUpdateService);
  closeModal: (data?: unknown, role?: string) => void;

  onPrimaryClick(): void {
    this.appUpdateService.openUpdatePage();
  }

  onSecondaryClick(): void {
    this.closeModal?.();
  }
}
