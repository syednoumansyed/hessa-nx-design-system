import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Inject,
  OnInit,
  Optional,
  signal,
  DestroyRef,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
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
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig } from '@ds/select/select.interface';
import { AcademicYearStateService } from '@pages/academic-year/data-access/academic-year-state.service';
import { DsInputComponent } from '@ds/input/input.component';
import { faAdd } from '@fortawesome/pro-regular-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HolidayDTO,
  HolidayPayloadDTO,
} from '@pages/academic-year/data-access/academic-year.dto';
import { parseISO, startOfDay } from 'date-fns';
import { formatDateToUnix, formatToHesDate } from '@shared/utils/date';
import { TuiDay } from '@taiga-ui/cdk';

@Component({
  selector: 'app-manage-holidays',
  templateUrl: './manage-holidays.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    DsSelectComponent,
    DsInputComponent,
  ],
  viewProviders: [
    provideIcons({
      saxCloseCircleBold,
    }),
  ],
})
export class ManageHolidaysComponent implements OnInit {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  holidaysListData = this.academicYearStateService.holidaysListData;
  academicYear = this.academicYearStateService.academicYear;

  academicYearId: number | null = null;
  isMobile = isMobile();
  showOthersInput = signal<boolean>(false);
  currentLang = computed(() => this.translocoService.getActiveLang());
  holidayId = signal<string | null>(null);
  isEditMode = computed(() => !!this.holidayId());
  holidayToEdit = signal<HolidayDTO | null>(null);
  schoolStartDateText = computed(() => {
    const academicYear = this.academicYear();
    const startDate = academicYear ? academicYear.startDate : undefined;
    if (!startDate) return '';
    return this.hesTranslateService.t('academic_year.school_start_date', {
      academic_start_date: formatToHesDate(startDate),
    });
  });
  holidayOptions = computed(() => {
    const globalHolidays = this.academicYearStateService.globalHolidays();

    if (!globalHolidays || globalHolidays.length === 0) {
      return [];
    }

    const othersOption = {
      id: 0,
      display: this.hesTranslateService.t('academic_year.add_others.txt'),
      icon: faAdd,
    };

    const mappedHolidays = globalHolidays.map((holiday) => ({
      id: holiday.id,
      display: this.currentLang() === 'ar' ? holiday.arName : holiday.enName,
    }));

    return [...mappedHolidays, othersOption];
  });

  ngOnInit() {
    this.academicYearId =
      this.context?.data?.academicYearId ||
      +(this.route.snapshot.paramMap.get('academicYearId') || 0) ||
      null;

    this.holidayId.set(
      this.context?.data?.holidayId ||
        +(this.route.snapshot.paramMap.get('holidayId') || 0) ||
        null,
    );

    this.globalHolidayCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.onGlobalHolidayChange(value);
      });

    if (this.isEditMode()) {
      this.setHolidayToEdit();
    }
  }

  setHolidayToEdit() {
    const holidayId = this.holidayId();
    if (!holidayId) {
      this.holidayToEdit.set(null);

      return;
    }

    const holiday = this.holidaysListData().find(
      (h) => h.id.toString() === holidayId.toString(),
    );

    if (holiday) {
      this.holidayToEdit.set(holiday);

      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate || holiday.startDate);

      const fromDate = startOfDay(startDate);
      const toDate = startOfDay(endDate);

      this.addHolidayForm.patchValue({
        holidayDates: {
          from: fromDate,
          to: toDate,
        },
        globalHoliday: holiday.globalHolidayId || 0,
        holidayNameEn: holiday.enName || '',
        holidayNameAr: holiday.arName || '',
      });
      this.showOthersInput.set(
        holiday.globalHolidayId === null || holiday.globalHolidayId === 0,
      );
    }
  }

  constructor(
    @Optional()
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any> | null,
  ) {}

  selectConfig: DsSelectConfig = {
    label: this.hesTranslateService.t('academic_year.select_holiday_name'),
    placeholder: this.hesTranslateService.t(
      'academic_year.select_holidays.placeholder',
    ),
    options: this.holidayOptions(),
    showSearch: true,
  };

  get globalHolidayCtrl() {
    return this.addHolidayForm.get('globalHoliday') as FormControl<number>;
  }

  get holidayNameEnCtrl() {
    return this.addHolidayForm.get('holidayNameEn') as FormControl;
  }

  get holidayNameArCtrl() {
    return this.addHolidayForm.get('holidayNameAr') as FormControl;
  }

  addHolidayForm = this.formBuilder.group({
    holidayDates: [
      null as { from: Date; to: Date } | null,
      { validators: [Validators.required] },
    ],
    globalHoliday: [
      null as number | null,
      { validators: [Validators.required] },
    ],
    holidayNameEn: [''],
    holidayNameAr: [''],
  });

  holidayDatesControl: IControl = {
    type: 'date-range',
    formControlName: 'holidayDates',
    placeholder: 'e.g 23/09/2025',
    required: true,
    label: this.hesTranslateService.t('academic_year.add_dates.title'),
    helperText: this.schoolStartDateText(),
    datePickerConfig: {
      min: this.academicYear()
        ? TuiDay.fromLocalNativeDate(new Date(this.academicYear()!.startDate))
        : undefined,
      max: this.academicYear()
        ? TuiDay.fromLocalNativeDate(new Date(this.academicYear()!.endDate))
        : undefined,
    },
  };

  onClose() {
    if (this.context) {
      this.context.completeWith(false);
    }
  }

  onGlobalHolidayChange(value: number | null) {
    if (value === 0) {
      this.showOthersInput.set(true);
      this.holidayNameEnCtrl.setValidators([Validators.required]);
      this.holidayNameEnCtrl.updateValueAndValidity();
      this.holidayNameArCtrl.setValidators([Validators.required]);
      this.holidayNameArCtrl.updateValueAndValidity();
    } else {
      this.showOthersInput.set(false);
      this.holidayNameEnCtrl.clearValidators();
      this.holidayNameEnCtrl.updateValueAndValidity();
      this.holidayNameEnCtrl.setValue('');
      this.holidayNameArCtrl.clearValidators();
      this.holidayNameArCtrl.updateValueAndValidity();
      this.holidayNameArCtrl.setValue('');
    }
  }

  onSave() {
    const holidayDates = this.addHolidayForm.value.holidayDates;

    if (!holidayDates) {
      return;
    }

    const startDate = holidayDates.from;
    const endDate = holidayDates.to;
    const globalHolidayId = this.addHolidayForm.value.globalHoliday;

    const payload: HolidayPayloadDTO = {
      startDate: formatDateToUnix(startDate.toISOString()),
      academicYearId: Number(this.academicYearId),
      ...(startDate.toDateString() !== endDate.toDateString()
        ? { endDate: formatDateToUnix(endDate.toISOString()) }
        : {}),
      ...(!this.showOthersInput() && typeof globalHolidayId === 'number'
        ? { globalHolidayId }
        : {}),
      ...(this.showOthersInput()
        ? {
            arName: this.holidayNameArCtrl.value,
            enName: this.holidayNameEnCtrl.value,
          }
        : {}),
    };

    if (!this.isEditMode()) {
      this.academicYearStateService.addHoliday(
        payload,
        this.context,
        this.router,
      );
    } else {
      const holidayId = this.holidayToEdit()?.id;
      if (holidayId) {
        this.academicYearStateService.updateHoliday(
          holidayId,
          payload,
          this.context,
          this.router,
        );
      }
    }
  }
}
