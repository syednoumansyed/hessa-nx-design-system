import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  faCircleInfo,
  faMessageLines,
} from '@fortawesome/pro-regular-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FaIconComponentsProps } from '@shared/types';
import { DsModalComponent } from '@ds/modal';

import {
  AttendanceStatus,
  ConfirmationStatus,
  StatusHistoryItemDTO,
} from '@pages/attendance/data-access/attendance.dto';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';

import { DsChipComponent } from '@ds/chip/chip.component';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

@Component({
  selector: 'app-attendance-history-dialog',
  templateUrl: './attendance-history-dialog.component.html',
  standalone: true,
  imports: [
    DsModalComponent,
    TranslocoDirective,
    HesIconComponent,
    DsTooltipDirective,
    DsChipComponent,
    HesTimePipe,
    HesDatePipe,
    EnumLangPipe,
  ],
})
export class AttendanceHistoryDialogComponent implements OnInit {
  private translocoService = inject(TranslocoService);

  readonly faCircleInfo: FaIconComponentsProps = {
    icon: faCircleInfo,
    size: 'sm',
  };

  // For dsTooltipIcon which expects IconDefinition
  readonly tooltipIcon: IconDefinition = faMessageLines;

  currentLang: string = '';

  @Input() closeModal: () => void;
  @Input() statusHistory: StatusHistoryItemDTO[] = [];

  history = signal<StatusHistoryItemDTO[]>([]);

  // Expose enums to template
  readonly AttendanceStatus = AttendanceStatus;
  readonly ConfirmationStatus = ConfirmationStatus;

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
    // Use the statusHistory passed from the listing API response
    // Reverse the order to show oldest first (API returns newest first)
    this.history.set([...(this.statusHistory || [])].reverse());
  }

  onClose() {
    this.closeModal();
  }

  getStatusChipClasses(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-success-50 text-success-700 border-transparent';
      case AttendanceStatus.ABSENT:
        return 'bg-error-50 text-error-700 border-transparent';
      case AttendanceStatus.EXCUSED:
        return 'bg-info-50 text-info-700 border-transparent';
      case AttendanceStatus.ON_LEAVE:
        return 'bg-indigo-50 text-indigo-700 border-transparent';
      case AttendanceStatus.LATE_ARRIVAL:
        return 'bg-warning-50 text-warning-700 border-transparent';
      default:
        return 'border-transparent';
    }
  }
}
