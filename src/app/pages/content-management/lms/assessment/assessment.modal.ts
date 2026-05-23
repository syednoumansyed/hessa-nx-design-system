import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

import { QuestionNavigatorComponent } from './components/question-navigator/question-navigator.component';
import { DsObjId } from '@ds/common.types';

interface AssessmentModalProps {
  assignmentId?: DsObjId | null;
  examId?: DsObjId | null;
}
export function createAssessmentModal() {
  const modalCtrl = inject(ModalController);
  return async function (
    value: AssessmentModalProps & { onClose?: () => void },
  ) {
    // Removed debug log for production
    const modal = await modalCtrl.create({
      component: QuestionNavigatorComponent,
      componentProps: {
        assignmentId: value.assignmentId,
        examId: value.examId,
        onClose: () => {
          modal.dismiss();
          value.onClose?.();
        },
      },
      cssClass: 'full-modal bg-brand-35',
    });
    await modal.present();
  };
}
