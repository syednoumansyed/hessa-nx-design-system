import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { AttendanceService } from '@pages/attendance/data-access/attendance.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { openMarkedLeaveReasonModal } from '../marked-leave-reason-dialog/marked-leave-reason-dialog';
import { DsModalService } from '@ds/modal/modal.service';
import { isSameDay } from 'date-fns';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';

type ICustomCellParams = ICellRendererParams & {};

@Component({
  selector: 'app-attendance-status-cell',
  templateUrl: './student-attendance-status-cell.component.html',
  standalone: true,
  imports: [CommonModule, DsTooltipDirective],
})
export class StudentAttendanceStatusCellComponent implements ICellRendererAngularComp {
  AttendanceStatus = AttendanceStatus;

  private readonly attendanceService = inject(AttendanceService);
  private readonly modalService = inject(DsModalService);
  private readonly translocoService = inject(TranslocoService);

  statusOptions = signal<any[]>([
    {
      value: AttendanceStatus.PRESENT,
      displayedValue: this.translate('enum.' + AttendanceStatus.PRESENT),
    },
    {
      value: AttendanceStatus.ABSENT,
      displayedValue: this.translate('enum.' + AttendanceStatus.ABSENT),
    },
    {
      value: AttendanceStatus.ON_LEAVE,
      displayedValue: this.translate('enum.' + AttendanceStatus.ON_LEAVE),
    },
    {
      value: AttendanceStatus.EXCUSED,
      displayedValue: this.translate('enum.' + AttendanceStatus.EXCUSED),
    },
    {
      value: AttendanceStatus.LATE_ARRIVAL,
      displayedValue: this.translate('enum.' + AttendanceStatus.LATE_ARRIVAL),
    },
  ]);

  isMarkingAllowed = signal<boolean>(false);
  isAttendanceMissing = signal<boolean>(false);
  params = signal<ICustomCellParams | undefined>(undefined);
  statusValue = signal<AttendanceStatus | null>(null);
  studentId = signal<number | null>(null);

  agInit(params: ICustomCellParams): void {
    this.params.set(params);
    this.statusValue.set(params.value);
    this.studentId.set(params.data.id);
    const date = params.data?.date;
    // Use the row date if available, otherwise fall back to the selected date from the service
    const rowDataDate = date
      ? new Date(date)
      : new Date(this.attendanceService.selectedDate());
    const isToday = isSameDay(rowDataDate, new Date());
    this.isMarkingAllowed.set(
      this.attendanceService.isMarkAttendanceAllowed() && isToday,
    );
    // If attendance is null on a past date, mark as missing
    this.isAttendanceMissing.set(params.value == null && !isToday);
  }
  refresh(_params: ICustomCellParams): boolean {
    return false;
  }

  onClick(value: AttendanceStatus) {
    if (value === AttendanceStatus.ON_LEAVE) {
      openMarkedLeaveReasonModal({
        reason: this.params()?.data?.reason ?? null,
        modalService: this.modalService,
        t: (key) => this.translate(key),
        onSubmit: (reason) => {
          this.statusValue.set(value);
          this.attendanceService.updateStudentAttendance(
            this.studentId()!,
            value,
            reason,
          );
          this.refreshRowData();
        },
      });
    } else {
      this.attendanceService.updateStudentAttendance(this.studentId()!, value);
      this.statusValue.set(value);
      this.refreshRowData();
    }
  }

  private refreshRowData(): void {
    const p = this.params();
    if (!p?.node) return;
    const updated = this.attendanceService
      .studentAttendanceList()
      .find((s) => s.id === this.studentId());
    if (updated) {
      p.node.setData(updated);
    }
  }
  private translate(key: string) {
    return this.translocoService.translate(key);
  }

  getDisabledStatusMap(): { [key: string]: boolean } {
    // If attendance is missing on a past date, disable all statuses
    if (this.isAttendanceMissing()) {
      return {
        [AttendanceStatus.PRESENT]: true,
        [AttendanceStatus.ABSENT]: true,
        [AttendanceStatus.ON_LEAVE]: true,
        [AttendanceStatus.EXCUSED]: true,
        [AttendanceStatus.LATE_ARRIVAL]: true,
      };
    }
    // If marking is allowed (before end time), all buttons are enabled
    if (this.isMarkingAllowed()) {
      return {};
    }
    const params = this.params();
    const date = params?.data?.date;
    const rowDataDate = date ? new Date(date) : new Date();
    const isToday = isSameDay(rowDataDate, new Date());
    const currentStatus = this.statusValue();

    if (currentStatus === AttendanceStatus.PRESENT) {
      return {
        [AttendanceStatus.ABSENT]: true,
        ...(isToday ? {} : { [AttendanceStatus.EXCUSED]: true }),
        [AttendanceStatus.LATE_ARRIVAL]: true,
        [AttendanceStatus.ON_LEAVE]: true,
      };
    }

    // 2.1 Locking "Present" After End Time
    // After end time, the Present status is always locked (disabled), regardless of current status
    // For today: allow changing between non-Present statuses, but Present is always disabled
    if (isToday) {
      return {
        [AttendanceStatus.PRESENT]: true,
      };
    }

    // For past dates: Only allow Absent -> Leave (With Reason)
    if (!isToday && currentStatus === AttendanceStatus.ABSENT) {
      return {
        [AttendanceStatus.PRESENT]: true,
        [AttendanceStatus.EXCUSED]: true,
        [AttendanceStatus.LATE_ARRIVAL]: true,
      };
    }

    // For past dates and non-Absent, disable all (no edit allowed)
    if (!isToday) {
      return {
        [AttendanceStatus.PRESENT]: true,
        [AttendanceStatus.ABSENT]: true,
        [AttendanceStatus.ON_LEAVE]: true,
        [AttendanceStatus.EXCUSED]: true,
        [AttendanceStatus.LATE_ARRIVAL]: true,
      };
    }

    // Default: only disable PRESENT
    return {
      [AttendanceStatus.PRESENT]: true,
    };
  }

  /**
   * Returns the tooltip text for a given status button.
   * - For Present, after end time: "You can’t update present status" - Except, From present to excused is allowed for today
   * - For other statuses, when only Absent->Leave is allowed: "You can just update past dates from absent to leave"
   * - Otherwise, returns empty string
   */
  getTooltipText(itemValue: AttendanceStatus): string {
    const params = this.params();
    const date = params?.data?.date;
    const rowDataDate = date ? new Date(date) : new Date();
    const isToday = isSameDay(rowDataDate, new Date());
    const currentStatus = this.statusValue();
    const disabledMap = this.getDisabledStatusMap();

    // If button is not disabled, no tooltip
    if (!disabledMap[itemValue]) return '';

    // 1. If Present is disabled (after end time or for past dates)
    if (currentStatus === AttendanceStatus.PRESENT && isToday) {
      return this.translocoService.translate(
        'attendance.tooltip.cannot_update_present_status',
      );
    }

    // 2. For past dates, only Absent->Leave is allowed
    if (!isToday && currentStatus === AttendanceStatus.ABSENT) {
      return this.translocoService.translate(
        'attendance.tooltip.absent_to_leave_only_past_dates',
      );
    }

    // Default: no tooltip
    return '';
  }
}
