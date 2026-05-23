import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FeedbackType } from '@shared/types';
import {
  faCircleExclamation,
  faCircleXmark,
  faCircleCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { CommonModule } from '@angular/common';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ToastPackage } from 'ngx-toastr';
@Component({
  selector: 'app-hes-alert',
  templateUrl: './hes-alert.component.html',
  standalone: true,
  imports: [HesButtonModule, CommonModule],
})
export class HesAlertComponent {
  faCircleExclamation = faCircleExclamation;
  faCircleXmark = faCircleXmark;
  faCircleCheck = faCircleCheck;
  @Input() type: FeedbackType | 'info';
  @Input() title: string;
  @Input() message: string;
  @Input() buttonTitle: string;
  @Input() showButton = true;
  @Input() isActionDisabled: boolean;
  @Output() actionClick = new EventEmitter<boolean>();

  // empty object that is used in template for hes toast component
  faXmark = undefined;
  toastPackage: ToastPackage = {
    config: {
      closeButton: false,
    } as ToastPackage['config'],
  } as ToastPackage;
  state = {} as any;

  onBtnClick(): void {
    this.actionClick.emit(true);
  }
}
