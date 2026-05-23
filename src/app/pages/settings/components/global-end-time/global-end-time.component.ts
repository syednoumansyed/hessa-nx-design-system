import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { getTimeSlots } from '@shared/utils/get-time-slot.util';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AttendanceEndTimeService } from '@pages/settings/attendance-end-time.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { IonButton } from '@ionic/angular/standalone';
import { ObjId } from '@shared/interfaces/common.interface';
import { GlobalEndTimeResponseDTO } from '@pages/settings/data-access/attendance-end-time.dto';
import { HttpErrorResponse } from '@angular/common/http';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-global-end-time',
  templateUrl: './global-end-time.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoDirective,
    HesButtonModule,
    FormControlGeneratorComponent,
    IonButton,
    HesTimePipe,
    RbacDirective,
  ],
})
export class GlobalEndTimeComponent implements OnInit {
  // #region Injectable Services
  private readonly translocoService = inject(TranslocoService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly toaster = inject(HesToasterService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly attendanceEndTimeService = inject(AttendanceEndTimeService);
  // #endregion

  // #region Public properties
  readonly loading = signal<boolean>(false);
  readonly mode = signal<'create' | 'view' | 'edit'>('create');
  readonly updateGlobalEndtimePermissionId =
    RESOURCE_PERMISSION.attendance.UPDATE_GLOBAL_END_TIME;
  readonly timeExtensionForm = this.fb.group({
    endTime: this.fb.control<string>('', Validators.required),
  });

  readonly timeExtensionConfig = computed<IControl[]>(() => [
    {
      label: this.hesTranslateService.t('time_period.end_time.placeholder'),
      placeholder: this.hesTranslateService.t(
        'time_period.end_time.placeholder',
      ),
      type: 'searchable-select',
      formControlName: 'endTime',
      selectValues: getTimeSlots(this.translocoService.getActiveLang()),
      required: true,
    },
  ]);
  // #endregion

  // #region Public Methods
  ngOnInit(): void {
    this.fetchGlobalEndTime();
  }

  onCancel(): void {
    this.mode.set('view');
  }

  onSave(): void {
    this.mode() === 'create'
      ? this.createGlobalEndTime()
      : this.updateGlobalEndTime();
  }

  onEdit(): void {
    this.mode.set('edit');
  }

  get endTime(): string {
    return this.timeExtensionForm.value.endTime || '';
  }
  // #endregion

  // #region Private properties
  private id: ObjId | null = null;
  // #endregion

  // #region Private Methods
  private fetchGlobalEndTime(): void {
    this.loading.set(true);
    this.attendanceEndTimeService.fetchGlobalEndTime().subscribe({
      next: (response: GlobalEndTimeResponseDTO) => {
        this.id = response.data?.id || null;
        const endTime = response.data?.endTime || '';
        if (endTime) {
          this.timeExtensionForm.get('endTime')?.setValue(endTime);
          this.mode.set('view');
        } else {
          this.mode.set('create');
        }
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private createGlobalEndTime(): void {
    this.loading.set(true);
    this.attendanceEndTimeService.createGlobalEndTime(this.endTime).subscribe({
      next: () => {
        this.fetchGlobalEndTime();
        this.toaster.success(
          this.hesTranslateService.t(
            'attendance.end_time_successfully_added.txt',
          ),
        );
      },
      error: (err: any) => {
        this.toaster.showBackendError(err);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private updateGlobalEndTime(): void {
    if (!this.id) return;
    this.loading.set(true);
    this.attendanceEndTimeService
      .updateGlobalEndTime(this.id, this.endTime)
      .subscribe({
        next: () => {
          this.fetchGlobalEndTime();
          this.toaster.success(
            this.hesTranslateService.t(
              'attendance.end_time_successfully_updated.txt',
            ),
          );
        },
        error: (err: any) => {
          this.toaster.showBackendError(err);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }
  // #endregion
}
