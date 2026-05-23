import { Component, computed } from '@angular/core';
import { Toast, ToastPackage, ToastrService } from 'ngx-toastr';
import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxCloseCircleOutline,
  saxInfoCircleOutline,
  saxTickCircleOutline,
  saxWarning2Outline,
} from '@ng-icons/iconsax/outline';
import { saxCloseCircleBold } from '@ng-icons/iconsax/bold';

@Component({
  selector: '[ds-toast-component]',
  templateUrl: './ds-toast.component.html',
  styles: [],
  animations: [
    trigger('flyInOut', [
      state('inactive', style({ opacity: 0, transform: 'translateX(40px)' })),
      state('active', style({ opacity: 1, transform: 'translateX(0)' })),
      state('removed', style({ opacity: 0, transform: 'translateX(40px)' })),

      transition(
        'inactive => active',
        animate(
          '{{ easeTime }}ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateX(40px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(6px)', offset: 0.7 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 }),
          ]),
        ),
        { params: { easeTime: 180 } }, // default if not provided
      ),

      transition(
        'active => removed',
        animate(
          '{{ easeTime }}ms ease-in',
          keyframes([
            style({ opacity: 1, transform: 'translateX(0)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(24px)', offset: 0.7 }),
            style({ opacity: 0, transform: 'translateX(40px)', offset: 1.0 }),
          ]),
        ),
        { params: { easeTime: 180 } }, // same default
      ),
    ]),
  ],
  viewProviders: [
    provideIcons({
      saxCloseCircleOutline,
      saxWarning2Outline,
      saxInfoCircleOutline,
      saxTickCircleOutline,
      saxCloseCircleBold,
    }),
  ],
  preserveWhitespaces: false,
  imports: [NgIcon],
})
export class DsToastComponent extends Toast {
  constructor(
    protected override toastrService: ToastrService,
    public override toastPackage: ToastPackage,
  ) {
    super(toastrService, toastPackage);
  }

  // Convert to signals
  toastType = computed(() => this.toastPackage?.toastType || 'info');
  hasTitle = computed(() => !!this.title);
  hasMessage = computed(() => !!this.message);
  showIcon = computed(() => this.options.payload?.showIcon !== false);
}
