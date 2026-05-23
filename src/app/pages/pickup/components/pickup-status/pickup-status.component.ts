import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { PickupRequestStatus } from '@shared/enums';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

@Component({
  selector: 'app-pickup-status',
  standalone: true,
  templateUrl: './pickup-status.component.html',
  imports: [TranslocoDirective, CommonModule, EnumLangPipe],
})
export class PickupStatusComponent {
  _attendanceStatus = AttendanceStatus;
  @Input() requestStatus: PickupRequestStatus | null;
  @Input() attendanceStatus: AttendanceStatus | null;
  @Input() isTodaysDateSelected: boolean = true;
  pickupRequestStatus = PickupRequestStatus;
  translocoService = inject(TranslocoService);

  getStatus() {
    if (
      this.attendanceStatus === AttendanceStatus.ABSENT ||
      this.attendanceStatus === AttendanceStatus.ON_LEAVE
    ) {
      return this.attendanceStatus;
    }
    if (this.requestStatus === null && !this.isTodaysDateSelected) {
      return PickupRequestStatus.NOT_PICKED;
    }
    return this.requestStatus !== null
      ? this.requestStatus
      : PickupRequestStatus.NOT_PICKED;
  }
}
