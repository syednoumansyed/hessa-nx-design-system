import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import {
  DelegateStudent,
  DelegateStudentStatus,
} from '@pages/pickup/data-access/delegate-scan.interface';

@Component({
  selector: 'app-delegate-student-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    AvatarComponent,
    DsCheckboxComponent,
  ],
  templateUrl: './delegate-student-card.component.html',
})
export class DelegateStudentCardComponent {
  student = input.required<DelegateStudent>();

  selectionChange = output<boolean>();

  readonly isDisabled = computed(() => {
    const status = this.student().status;
    return status !== 'allowed';
  });

  readonly statusLabel = computed(() => {
    const status = this.student().status;
    switch (status) {
      case 'allowed':
        return 'general.allowed_for_pickup.txt';
      case 'already_requested':
        return 'general.already_requested.txt';
      case 'absent':
        return 'enum.ABSENT';
      case 'on_leave':
        return 'enum.ON_LEAVE';
      case 'in_process':
        return 'enum.IN_PROCESS';
      case 'left_school':
        return 'enum.LEFT_SCHOOL';
      case 'picked':
        return 'enum.PICKED';
      default:
        return 'dismissal.pickup_status_denied.title';
    }
  });

  readonly statusClass = computed(() => {
    const status = this.student().status;
    switch (status) {
      case 'allowed':
        return 'text-content-success';
      case 'already_requested':
        return 'text-content-warning';
      case 'in_process':
        return 'text-content-warning';
      case 'absent':
      case 'on_leave':
        return 'text-content-error';
      case 'left_school':
      case 'picked':
        return 'text-emphasis-mid';
      default:
        return 'text-emphasis-low';
    }
  });

  readonly cardClass = computed(() => {
    const status = this.student().status;
    const disabledStatuses: DelegateStudentStatus[] = [
      'absent',
      'on_leave',
      'in_process',
      'left_school',
      'picked',
      'already_requested',
      'not_allowed',
    ];

    if (disabledStatuses.includes(status)) {
      return 'bg-surface-secondary border-stroke-black-04 opacity-50';
    }

    // All cards have gray background - yellow is only on checkbox
    return 'bg-surface-secondary border-stroke-black-04';
  });

  onCheckboxChange(checked: boolean): void {
    if (!this.isDisabled()) {
      this.selectionChange.emit(checked);
    }
  }
}
