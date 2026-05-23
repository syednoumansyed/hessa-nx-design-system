import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { IClassAttendance } from '@pages/attendance/data-access/attendance.interface';
import { ClassAttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { TranslocoDirective } from '@jsverse/transloco';
import { AttendanceService } from '@pages/attendance/data-access/attendance.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { DsButtonComponent } from '@ds/button/button.component';
import { isSameDay } from 'date-fns';

type DsButtonSize = 'sm' | 'md' | 'lg';

type AttendanceActionParams = ICellRendererParams & {
  onNavigate: (data: IClassAttendance) => void;
  size?: DsButtonSize;
};

@Component({
  selector: 'app-attendance-actions-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButtonComponent, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      @if (status() === ClassAttendanceStatus.PENDING) {
        <ds-button
          [size]="buttonSize()"
          variant="primary"
          [disabled]="!isMarkAttendanceAllowed()"
          (click)="onActionClick($event)"
        >
          {{ t('attendance.mark_attendance.title') }}
        </ds-button>
      } @else if (canEdit()) {
        <ds-button
          [size]="buttonSize()"
          variant="primary"
          (click)="onActionClick($event)"
        >
          {{ t('global.edit.btn') }}
        </ds-button>
      } @else if (canView()) {
        <ds-button
          [size]="buttonSize()"
          variant="primary"
          (click)="onActionClick($event)"
        >
          {{ t('global.view.btn') }}
        </ds-button>
      }
    </ng-container>
  `,
})
export class AttendanceActionsCellComponent implements ICellRendererAngularComp {
  readonly ClassAttendanceStatus = ClassAttendanceStatus;

  private readonly attendanceService = inject(AttendanceService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  private readonly params = signal<AttendanceActionParams | undefined>(
    undefined,
  );

  readonly buttonSize = computed<DsButtonSize>(
    () => this.params()?.size ?? 'sm',
  );

  readonly rowData = computed(
    () => this.params()?.data as IClassAttendance | undefined,
  );

  readonly status = computed(() => this.rowData()?.status);

  readonly isMarkAttendanceAllowed = computed(() => {
    const date = this.rowData()?.date;
    const rowDate = date ? new Date(date) : new Date();
    return (
      this.attendanceService.isMarkAttendanceAllowed() &&
      isSameDay(rowDate, new Date())
    );
  });

  readonly canEdit = computed(() =>
    this.rbacService.hasPermission(RESOURCE_PERMISSION.attendance.UPDATE),
  );

  readonly canView = computed(
    () =>
      !this.canEdit() &&
      !this.attendanceService.isMarkAttendanceAllowed() &&
      this.rbacService.hasPermission(RESOURCE_PERMISSION.attendance.LIST),
  );

  agInit(params: AttendanceActionParams): void {
    this.params.set(params);
  }

  refresh(params: AttendanceActionParams): boolean {
    this.params.set(params);
    return true;
  }

  onActionClick(event: Event): void {
    event.stopPropagation();
    const data = this.rowData();
    if (data) {
      this.params()?.onNavigate(data);
    }
  }
}
