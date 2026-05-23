import { Component, input, OnInit } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-re-attempt',
  templateUrl: './re-attempt.component.html',
  imports: [DsIconComponent, DsButtonComponent, TranslocoDirective],
})
export class ReAttemptComponent {
  title = input<string>('');
  description = input<string>('');
  btnText = input<string>('Start');
  reAttempt = input<() => void>(() => {});
  onClose = input<() => void>(() => {});

  xMarks = faCircleXmark;

  onReAttemptClicked() {
    this.reAttempt()();
  }

  closeModal() {
    this.onClose()();
  }
}
