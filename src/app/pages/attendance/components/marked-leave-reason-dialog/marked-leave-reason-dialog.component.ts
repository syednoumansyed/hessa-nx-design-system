import { Component, input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonTextarea } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-mark-leave-dialog',
  template: `
    <ng-container *transloco="let t">
      <div class="hes-card p-3 lg:p-6">
        <ion-textarea
          [formControl]="reasonControl"
          [placeholder]="t('attendance.reason.title')"
          class="hes-textarea"
        ></ion-textarea>
      </div>
    </ng-container>
  `,
  standalone: true,
  imports: [IonTextarea, TranslocoDirective, ReactiveFormsModule],
})
export class MarkedLeaveReasonDialogComponent
  implements OnInit, DsModalContentComponent
{
  reasonControl = new FormControl<string>('', {});

  readonly reason = input<string | null>(null);

  closeModal?: (data?: unknown, role?: string) => void;

  ngOnInit() {
    const r = this.reason();
    if (r) {
      this.reasonControl.setValue(r);
    }
  }

  onPrimaryClick(): void {
    this.closeModal?.(this.reasonControl.value ?? '', 'confirm');
  }
}
