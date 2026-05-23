import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxCloseCircleOutline,
  saxWarning2Outline,
  saxInfoCircleOutline,
  saxTickCircleOutline,
} from '@ng-icons/iconsax/outline';
import { saxCloseCircleBold } from '@ng-icons/iconsax/bold';
import { NgClass } from '@angular/common';
import { DsFeedbackType } from '@ds/common.types';

@Component({
  selector: 'alert-message',
  standalone: true,
  imports: [NgIcon, NgClass],
  viewProviders: [
    provideIcons({
      saxCloseCircleOutline,
      saxWarning2Outline,
      saxInfoCircleOutline,
      saxTickCircleOutline,
      saxCloseCircleBold,
    }),
  ],
  templateUrl: './alert-message.component.html',
})
export class AlertMessageComponent {
  readonly type = input<DsFeedbackType>('info');
  readonly title = input<string | undefined>();
  readonly message = input<string | null | undefined>('');
  readonly showCloseButton = input<boolean>(true);
  readonly buttonTitle = input<string>('');
  readonly actionClick = output<void>();
  readonly close = output<void>();

  cssClass = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'border-success-stroke bg-success-fill';
      case 'error':
        return 'border-error-stroke bg-error-fill';
      case 'warning':
        return 'border-warning-stroke bg-warning-fill';
      case 'info':
        return 'border-info-stroke bg-info-fill';
      case 'exciting':
        return 'border-feedback-stroke-exciting bg-[#F5F1FF]';
      default:
        return '';
    }
  });
}
