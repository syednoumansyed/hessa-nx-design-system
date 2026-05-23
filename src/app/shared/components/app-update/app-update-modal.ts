import { inject } from '@angular/core';
import { DsModalService } from '@ds/modal';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AppUpdateComponent } from '@shared/components/app-update/app-update.component';

export function createAppUpdateModal() {
  const modalService = inject(DsModalService);
  const t = inject(HesTranslateService);

  return async function () {
    await modalService.open({
      component: AppUpdateComponent,
      headerConfig: {
        title: t.translate('global.new_update.label'),
        showCloseButton: false,
      },
      footerConfig: {
        primaryButton: {
          text: t.translate('global.update_now.btn'),
        },
        secondaryButton: {
          text: t.translate('global.cancel.btn'),
        },
      },
      size: 'sm',
      backdropDismiss: false,
    });
  };
}
