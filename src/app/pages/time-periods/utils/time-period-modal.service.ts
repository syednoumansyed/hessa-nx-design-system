import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { ToastrService } from 'ngx-toastr';

import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { openAddTimePeriodModal } from '../modals/add-time-period.modal';
import { openAddEditPeriodDurationModal } from '../modals/add-edit-period-duration.modal';
import { ITimePeriodQueryParams } from '@shared/dto-transformation/time-period/time-period.interface';
import { openViewTimePeriodModal } from '../modals/view-time-period.modal';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TimePeriodService } from '../data-access/time-periods.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { isMobile } from '@utils/platform';

@Injectable({
  providedIn: 'root',
})
export class TimePeriodModalService {
  private readonly modalCtrl = inject(ModalController);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private toaster = inject(HesToasterService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly hesTranslationService = inject(HesTranslateService);
  private readonly timePeriodService = inject(TimePeriodService);
  private readonly onSuccessTimePeriodSource$ = new Subject<void>();
  readonly onSuccessTimePeriod$ =
    this.onSuccessTimePeriodSource$.asObservable();
  private mobile = isMobile();

  closeModal = () => this.modalCtrl.dismiss();

  onViewTimePeriod = (id: number) => {
    openViewTimePeriodModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      id,
      mobile: this.mobile,
    });
  };

  onAddTimePeriod = () => {
    openAddTimePeriodModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      mobile: this.mobile,
    });
  };

  onAddPeriodDuration = (timePeriodPayload: ITimePeriodQueryParams) => {
    openAddEditPeriodDurationModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      timePeriodPayload,
      onRefresh: this.onSuccessTimePeriodSource$,
      mobile: this.mobile,
    });
  };

  onEditPeriodDuration = (id: number) => {
    openAddEditPeriodDurationModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      id,
      onRefresh: this.onSuccessTimePeriodSource$,
      isEdit: true,
      mobile: this.mobile,
    });
  };

  onDeleteTimePeriod(id: number) {
    this.genericModalSerivce.show(
      () => {
        this.timePeriodService.deleteTimePeriodWithRelationsById(id).subscribe({
          next: (_resp) => {
            this.toaster.success(
              this.hesTranslationService.t(
                'time_period.time_period_deleted_successfully.txt',
              ),
            );
            this.onSuccessTimePeriodSource$.next();
          },
          error: (_errorResp) => {
            this.toaster.showBackendError(_errorResp);
          },
        });
      },
      {
        modalTitle: this.hesTranslationService.t(
          'time_period.delete_time_period.txt',
        ),
        modalMessage: '',
        primaryBtnStr: this.hesTranslationService.t('global.delete.btn'),
      },
    );
  }
}
