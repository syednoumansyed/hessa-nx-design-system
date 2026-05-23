import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Inject,
  Optional,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { saxCloseCircleBold } from '@ng-icons/iconsax/bold';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { isMobile } from '@shared/utils/platform';
import { TuiDay } from '@taiga-ui/cdk';
import { AcademicYearStateService } from '@pages/academic-year/data-access/academic-year-state.service';
import { addDays } from 'date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateToUnix } from '@shared/utils/date';

@Component({
  selector: 'app-manage-academic-year',
  templateUrl: './manage-academic-year.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
  ],
  viewProviders: [
    provideIcons({
      saxCloseCircleBold,
    }),
  ],
})
export class ManageAcademicYearComponent implements OnInit {
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly academicYear = this.academicYearStateService.academicYear;

  isMobile = isMobile();
  academicYearId = signal<string | null>(null);
  isEditMode = computed(() => !!this.academicYearId());

  private readonly minStartDate = computed(() => {
    const academicYear = this.academicYear();
    if (!academicYear) {
      return undefined;
    }
    if (!academicYear.endDate) {
      return TuiDay.currentLocal();
    }
    const dayAfterEndDate = addDays(new Date(academicYear.endDate), 1);
    return TuiDay.fromLocalNativeDate(dayAfterEndDate);
  });

  constructor(
    @Optional()
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any> | null,
  ) {}

  ngOnInit() {
    this.academicYearId.set(
      this.context?.data?.academicYearId ||
        +(this.route.snapshot.paramMap.get('academicYearId') || 0) ||
        null,
    );

    if (this.isEditMode()) {
      const academicYear = this.academicYear();
      if (academicYear) {
        this.dateRangeForm.patchValue({
          startDate: new Date(academicYear.startDate),
          endDate: new Date(academicYear.endDate),
        });
      }
    }

    this.dateRangeForm.valueChanges.subscribe(({ startDate, endDate }) => {
      // If endDate is before startDate, reset endDate
      if (startDate && endDate && endDate < startDate) {
        this.dateRangeForm.patchValue({ endDate: null }, { emitEvent: false });
      }
      // If user selects endDate first, then picks a startDate after it, reset endDate
      if (startDate && endDate && startDate > endDate) {
        this.dateRangeForm.patchValue({ endDate: null }, { emitEvent: false });
      }
    });
  }

  dateRangeForm = this.formBuilder.group({
    startDate: [null as Date | null, { validators: [Validators.required] }],
    endDate: [null as Date | null, { validators: [Validators.required] }],
  });

  startDateControl = computed<IControl>(() => ({
    type: 'date',
    formControlName: 'startDate',
    placeholder: 'e.g 23/09/2025',
    required: true,
    label: this.hesTranslateService.t('global.start_date.label'),
    datePickerConfig: this.isEditMode()
      ? {}
      : {
          min: this.minStartDate(),
        },
  }));

  endDateControl = computed<IControl>(() => {
    const startDate = this.dateRangeForm.get('startDate')?.value;
    return {
      type: 'date',
      formControlName: 'endDate',
      placeholder: 'e.g 23/09/2025',
      required: true,
      label: this.hesTranslateService.t('global.end_date.title'),
      datePickerConfig: startDate
        ? { min: TuiDay.fromLocalNativeDate(startDate) }
        : {},
    };
  });

  onClose() {
    if (this.context) {
      this.context.completeWith(false);
    }
  }

  onSave() {
    const { startDate, endDate } = this.dateRangeForm.value;
    if (!startDate || !endDate) {
      return;
    }

    const payload = {
      academicYearId: this.academicYearId,
      startDate: formatDateToUnix(startDate.toISOString()),
      endDate: formatDateToUnix(endDate.toISOString()),
    };

    if (this.isEditMode()) {
      const academicYearId = this.academicYearId();
      if (academicYearId) {
        this.academicYearStateService.updateAcademicYear(
          academicYearId,
          payload,
          this.context,
          this.router,
        );
      }
    } else {
      this.academicYearStateService.addAcademicYear(
        payload,
        this.context,
        this.router,
      );
    }
  }
}
