import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  Inject,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { Subscription } from 'rxjs';
import { getTimeSlots } from '@shared/utils/get-time-slot.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { AttendanceEndTimeService } from '../../attendance-end-time.service';
import { formatDate } from 'date-fns';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { ObjId } from '@shared/interfaces/common.interface';
import { ISchoolEndTimePayload } from '@pages/settings/data-access/attendance-end-time.dto';
import { StructureDepth } from '@shared/utils/school-structure';

@Component({
  selector: 'app-extend-time-form',
  templateUrl: './extend-time-form.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ExtendTimeFormComponent implements OnDestroy {
  // #region Private Properties
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly toaster = inject(HesToasterService);
  private readonly translocoService = inject(TranslocoService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly attendanceEndTimeService = inject(AttendanceEndTimeService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly subscription = new Subscription();
  // #endregion

  // #region Public Properties
  currentLang: string = '';
  readonly loading = signal<boolean>(false);
  readonly faClose = faClose;

  readonly form = this.nonNullablefb.group({
    schoolId: this.nonNullablefb.control<ObjId | null>(
      null,
      Validators.required,
    ),
    endTime: this.nonNullablefb.control('', Validators.required),
    dateRange: this.nonNullablefb.control<{ from: Date; to: Date }>(
      { from: new Date(), to: new Date() },
      Validators.required,
    ),
  });

  readonly formConfig = computed<IControl[]>(() => [
    {
      label: this.hesTranslateService.t(
        'school_structure.school_name_req.label',
      ),
      placeholder: this.hesTranslateService.t(
        'school_structure.school_name_req.label',
      ),
      formControlName: 'schoolId',
      type: 'searchable-select',
      selectValues:
        this.schoolStructureScopeService.getSelectedScopedEntitiesOrAll(
          StructureDepth.SCHOOL,
        ),
      required: true,
    },
    {
      label: this.hesTranslateService.t('attendance.end_time.title'),
      placeholder: this.hesTranslateService.t(
        'time_period.end_time.placeholder',
      ),
      type: 'searchable-select',
      formControlName: 'endTime',
      selectValues: getTimeSlots(this.translocoService.getActiveLang()),
      required: true,
    },
    {
      label: this.hesTranslateService.t('global.select_date.placeholder'),
      placeholder: this.hesTranslateService.t(
        'deactivation_paused_user.date_range.dropdown',
      ),
      formControlName: 'dateRange',
      type: 'date-range',
      required: true,
    },
  ]);
  // #endregion

  // #region Public Methods
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any>,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
    toObservable(this.schoolStructureScopeService.selectedSchoolId).subscribe(
      (res) => {
        if (res) {
          this.form.controls.schoolId.setValue(res);
        }
      },
    );
  }

  onSave(): void {
    this.onCreateExtendedEndTime();
  }

  closeModal(): void {
    this.context.$implicit.complete();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  // #endregion

  // #region Private Methods
  private onCreateExtendedEndTime(): void {
    this.loading.set(true);
    const payload = this.makeExtendedEndTimePayload();
    this.attendanceEndTimeService.createExtendedEndTime(payload).subscribe({
      next: () => {
        this.toaster.success(
          this.hesTranslateService.t(
            'attendance.end_time_successfully_added.txt',
          ),
        );
        this.closeModal();
      },
      error: (err) => {
        this.toaster.showBackendError(err);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private makeExtendedEndTimePayload(): ISchoolEndTimePayload {
    const formValues = this.form.getRawValue();
    return {
      schoolId: formValues.schoolId!,
      startDateTime: formatDate(formValues.dateRange.from, 'yyyy-MM-dd'),
      endDateTime: formatDate(formValues.dateRange.to, 'yyyy-MM-dd'),
      endTime: formValues.endTime,
    };
  }
  // #endregion
}
