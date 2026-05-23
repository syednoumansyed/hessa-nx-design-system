import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from '@shared/services/feedback.service';
import { PersonnelService } from '../personnel.service';
import { Subject } from 'rxjs';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Injectable({
  providedIn: 'root',
})
export class PersonnelStatusService {
  private readonly feedbackService = inject(FeedbackService);
  private readonly personnelService = inject(PersonnelService);
  private readonly translocoService = inject(TranslocoService);
  private readonly actionCompleteSource = new Subject<void>();
  private readonly toastr = inject(HesToasterService);
  public readonly actionComplete$ = this.actionCompleteSource.asObservable();

  public onActivatePersonnel(id: string) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'global.activate_account.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.activate_account_alert.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'global.yes_activate.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => this.activatePersonnel(id),
    );
  }

  public onDeactivatePersonnel = async (id: string) => {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'global.deactivate_account.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.deactivate_account_alert.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'global.yes_deactivate.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => this.deactivatePersonnel(id),
    );
  };

  private activatePersonnel(id: string) {
    this.personnelService.activatePersonnel(id).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate('global.successfully_activated.txt'),
        );
        this.actionCompleteSource.next();
      },
      error: (error) => {
        this.toastr.showBackendError(error);
        this.deactivatePersonnel(id);
      },
    });
  }

  private deactivatePersonnel(id: string) {
    this.personnelService.deactivatePersonnel(id).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'global.successfully_deactivated.txt',
          ),
        );
        this.actionCompleteSource.next();
      },
      error: (err) => {
        this.toastr.showBackendError(err);
        this.deactivatePersonnel(id);
      },
    });
  }
}
