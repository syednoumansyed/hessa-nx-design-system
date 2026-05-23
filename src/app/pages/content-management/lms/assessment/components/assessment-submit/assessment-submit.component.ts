import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { isMobile } from '@shared/utils/platform';

export interface AssessmentSubmitConfig {
  title: string;
  summary: {
    total: number;
    attempted: number;
    notAttempted: number;
  };
  primaryAction?: {
    text: string;
    action?: () => void;
  };
  secondaryAction?: {
    text: string;
    action?: () => void;
  };
}
@Component({
  selector: 'app-assessment-submit',
  templateUrl: './assessment-submit.component.html',
  standalone: true,
  imports: [TranslocoDirective, DsButtonComponent],
})
export class AssessmentSubmitComponent implements OnInit {
  config = input.required<AssessmentSubmitConfig>();

  title = computed(() => {
    return this.config()?.title;
  });

  summary = computed(() => {
    return this.config()?.summary;
  });

  totalQuestions = computed(() => {
    return this.summary()?.total ?? 0;
  });
  attemptedQuestions = computed(() => {
    return this.summary()?.attempted ?? 0;
  });
  notAttemptedQuestions = computed(() => {
    return this.summary()?.notAttempted ?? 0;
  });

  primaryAction = computed(() => {
    return this.config()?.primaryAction;
  });
  secondaryAction = computed(() => {
    return this.config()?.secondaryAction;
  });
  constructor() {}

  ngOnInit() {}
}

export function createAssessmentSubmitModal() {
  const modal = inject(ModalController);
  const isMobileDevice: boolean = isMobile();
  return async function (config: AssessmentSubmitConfig) {
    const modalRef = await modal.create({
      component: AssessmentSubmitComponent,
      componentProps: {
        config: {
          ...config,
          primaryAction: config.primaryAction
            ? {
                ...config.primaryAction,
                action: () => {
                  config.primaryAction?.action?.();
                  modalRef.dismiss();
                },
              }
            : undefined,
          secondaryAction: config.secondaryAction
            ? {
                ...config.secondaryAction,
                action: () => {
                  config.secondaryAction?.action?.();
                  modalRef.dismiss();
                },
              }
            : undefined,
        },
      },
      ...(!isMobileDevice && { cssClass: 'xl-modal' }),
      ...(isMobileDevice && {
        breakpoints: [0, 0.9],
        initialBreakpoint: 0.9,
      }),

      backdropDismiss: false,
    });
    await modalRef.present();
  };
}
