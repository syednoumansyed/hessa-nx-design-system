import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { IonLabel } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { FeedbackType } from '@shared/types';
import {
  faCircleExclamation,
  faCircleXmark,
  faCircleCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { faXmark } from '@fortawesome/pro-light-svg-icons';
import { CommonModule } from '@angular/common';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { Toast } from 'ngx-toastr';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';
@Component({
  selector: 'app-hes-toastr',
  templateUrl: './hes-alert.component.html',
  standalone: true,
  imports: [IonLabel, HesButtonModule, TranslocoDirective, CommonModule],
  animations: [
    trigger('flyInOut', [
      state(
        'inactive',
        style({
          opacity: 0,
        }),
      ),
      transition(
        'inactive => active',
        animate(
          '400ms ease-out',
          keyframes([
            style({
              transform: 'translate3d(100%, 0, 0) skewX(-30deg)',
              opacity: 0,
            }),
            style({
              transform: 'skewX(20deg)',
              opacity: 1,
            }),
            style({
              transform: 'skewX(-5deg)',
              opacity: 1,
            }),
            style({
              transform: 'none',
              opacity: 1,
            }),
          ]),
        ),
      ),
      transition(
        'active => removed',
        animate(
          '400ms ease-out',
          keyframes([
            style({
              opacity: 1,
            }),
            style({
              transform: 'translate3d(100%, 0, 0) skewX(30deg)',
              opacity: 0,
            }),
          ]),
        ),
      ),
    ]),
  ],
})
export class HesToastrComponent extends Toast implements OnInit {
  faCircleExclamation = faCircleExclamation;
  faCircleXmark = faCircleXmark;
  faCircleCheck = faCircleCheck;
  faXmark = faXmark;
  @Input() type: FeedbackType | 'info';
  @Input() buttonTitle: string;
  @Input() showButton = true;
  @Input() isActionDisabled: boolean;
  @Output() actionClick = new EventEmitter<boolean>();

  onBtnClick(): void {
    this.actionClick.emit(true);
  }

  ngOnInit(): void {
    switch (this.toastPackage.toastType) {
      case 'toast-success':
        this.type = 'success';
        break;
      case 'toast-error':
        this.type = 'error';
        break;
      case 'toast-warning':
        this.type = 'warning';
        break;
      case 'toast-info':
        this.type = 'info';
        break;

      default:
        this.type = 'info';
        break;
    }
  }
}
