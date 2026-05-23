import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { TranslocoService } from '@jsverse/transloco';
import { EscalationLevelDialogComponent } from './components/escalation-level-dialog/escalation-level-dialog.component';
import { ConfigureEscalationService } from './data-access/configure-escalation.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  EscalationLevel,
  EscalationTypeDetails,
} from './data-access/configure-escalation.interface';
import { DsModalService } from '@ds/modal/modal.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigureEscalationDialogService {
  private readonly modalService = inject(DsModalService);
  private readonly onSuccessEscalationLevelSource$ = new Subject<void>();
  readonly onSuccessEscalationLevel$ =
    this.onSuccessEscalationLevelSource$.asObservable();
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly translocoService = inject(TranslocoService);
  private toastr = inject(HesToasterService);

  configureEscalationService = inject(ConfigureEscalationService);

  async showEscalationLevelDialog(
    escalation?: EscalationTypeDetails,
    updateData?: EscalationLevel,
    isEdit = false,
  ) {
    await this.modalService.open({
      component: EscalationLevelDialogComponent,
      componentProps: {
        escalation,
        onRefresh: this.onSuccessEscalationLevelSource$,
        updateData,
        isEdit,
      },
      size: 'lg',
      scrollableContent: true,
    });
  }

  deleteEscalationLevelDialog(
    escalationId: number,
    schoolId: number,
    supportId: number,
  ) {
    this.genericModalSerivce.show(
      () => {
        this.onDeleteEscalationLevel(escalationId, schoolId, supportId);
      },
      {
        modalTitle: this.translate(
          'support_ticket.delete_escalation_level.txt',
        ),
        modalMessage: '',
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
      },
    );
  }

  private onDeleteEscalationLevel(
    escalationId: number,
    schoolId: number,
    supportId: number,
  ) {
    this.configureEscalationService
      .deleteEscalationLevel(escalationId, schoolId, supportId)
      .subscribe({
        next: (resp) => {
          this.onSuccessEscalationLevelSource$.next();
          this.toastr.success(
            this.translate(
              'support_ticket.escalation_level_successfully_deleted.txt',
            ),
          );
        },
        error: (errorResp) => {
          if (errorResp.error.message) {
            this.toastr.error(errorResp.error.message);
          } else {
            this.toastr.error(
              this.translocoService.translate('global.delete_wrong_msg.txt'),
              this.translocoService.translate('global.wrong_msg.title'),
            );
          }
        },
      });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
