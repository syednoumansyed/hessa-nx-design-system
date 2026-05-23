import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Inject,
  OnInit,
  Optional,
  signal,
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
import { ActivatedRoute, Router } from '@angular/router';
import { TuiDay } from '@taiga-ui/cdk';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';
import { AcademicYearUtils } from '@pages/academic-year/utils/academic-year.utils';
import { AcademicYearStateService } from '@pages/academic-year/data-access/academic-year-state.service';
import { parseISO, startOfDay } from 'date-fns';
import { formatDateToUnix } from '@shared/utils/date';

@Component({
  selector: 'app-manage-semester',
  templateUrl: './manage-semester.component.html',
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
export class ManageSemesterComponent implements OnInit {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly router = inject(Router);

  academicYear = this.academicYearStateService.academicYear;
  semesterListData = this.academicYearStateService.semesterListData;

  isMobile = isMobile();
  academicYearId: number | null = null;
  semesterId = signal<string | null>(null);
  title: string = '';
  isEditMode = computed(() => !!this.semesterId());
  semesterToEdit = signal<SemesterDTO | null>(null);

  ngOnInit(): void {
    this.academicYearId =
      this.context?.data?.academicYearId ||
      +(this.route.snapshot.paramMap.get('academicYearId') || 0) ||
      null;

    this.semesterId.set(
      this.context?.data?.semesterId ||
        +(this.route.snapshot.paramMap.get('semesterId') || 0) ||
        null,
    );

    if (this.isEditMode()) {
      this.setSemesterToEdit();
    } else {
      const semesterCount = this.semesterListData().length + 1;
      this.title = this.hesTranslateService.t(
        'academic_year.add_semester_duration.title',
        {
          semester_number: semesterCount,
          sup: AcademicYearUtils.getOrdinalSuffix(semesterCount),
        },
      );
    }
  }

  constructor(
    @Optional()
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any> | null,
  ) {}

  dateRangeForm = this.formBuilder.group({
    dateRange: this.formBuilder.control<{ from: Date; to: Date } | null>(
      null,
      Validators.required,
    ),
  });

  dateRangeControl = computed<IControl>(() => {
    const academicYear = this.academicYear();
    const semesterListData = this.semesterListData();
    let minDate: TuiDay;
    let maxDate: TuiDay;

    if (academicYear) {
      const academicStartDate = new Date(academicYear.startDate);
      const academicEndDate = new Date(academicYear.endDate);

      const adjustedAcademicEndDate = new Date(academicEndDate);
      adjustedAcademicEndDate.setDate(adjustedAcademicEndDate.getDate());

      if (semesterListData && semesterListData.length > 0) {
        const sortedSemesters = [...semesterListData].sort(
          (a, b) => (a.semesterNumber ?? 0) - (b.semesterNumber ?? 0),
        );

        if (this.isEditMode()) {
          const currentId = this.semesterId();
          const idx = sortedSemesters.findIndex((s) => s.id === currentId);

          // Helper to strip time zone shifts (local Y/M/D)
          const toLocalDateOnly = (iso: string) => {
            const d = parseISO(iso);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
          };

          // Min: day after previous semester end, or academic year start
          if (idx > 0) {
            const prevEndLocal = toLocalDateOnly(
              sortedSemesters[idx - 1].endDate,
            );
            const nextDayAfterPrev = new Date(prevEndLocal);
            nextDayAfterPrev.setDate(nextDayAfterPrev.getDate() + 1);
            minDate = TuiDay.fromLocalNativeDate(nextDayAfterPrev);
          } else {
            minDate = TuiDay.fromLocalNativeDate(academicStartDate);
          }

          // Max: day before next semester start, or adjusted academic year end
          if (idx > -1 && idx < sortedSemesters.length - 1) {
            const nextStartLocal = toLocalDateOnly(
              sortedSemesters[idx + 1].startDate,
            );
            const dayBeforeNext = new Date(nextStartLocal);
            dayBeforeNext.setDate(dayBeforeNext.getDate() - 1);
            maxDate = TuiDay.fromLocalNativeDate(dayBeforeNext);
          } else {
            maxDate = TuiDay.fromLocalNativeDate(adjustedAcademicEndDate);
          }
        } else {
          // Create mode: allow starting the next semester right after the last one
          const lastSemester = sortedSemesters[sortedSemesters.length - 1];
          const lastSemesterEndLocal = new Date(
            new Date(parseISO(lastSemester.endDate)).getFullYear(),
            new Date(parseISO(lastSemester.endDate)).getMonth(),
            new Date(parseISO(lastSemester.endDate)).getDate(),
          );
          const nextDayAfterLastSemester = new Date(lastSemesterEndLocal);
          nextDayAfterLastSemester.setDate(
            nextDayAfterLastSemester.getDate() + 1,
          );

          minDate = TuiDay.fromLocalNativeDate(nextDayAfterLastSemester);
          maxDate = TuiDay.fromLocalNativeDate(adjustedAcademicEndDate);
        }
      } else {
        // No semesters added yet
        minDate = TuiDay.fromLocalNativeDate(academicStartDate);
        maxDate = TuiDay.fromLocalNativeDate(adjustedAcademicEndDate);
      }
    } else {
      minDate = TuiDay.currentLocal();
      maxDate = TuiDay.currentLocal().append({ day: 1 });
    }

    return {
      type: 'date-range',
      formControlName: 'dateRange',
      placeholder: this.hesTranslateService.t(
        'academic_calendar.from_to_placeholder.txt',
      ),
      required: true,
      label: this.hesTranslateService.t(
        'content_management.select_duration.placeholder',
      ),
      datePickerConfig: {
        min: minDate,
        max: maxDate,
      },
    };
  });

  onClose() {
    if (this.context) {
      this.context.completeWith(false);
    }
  }

  onSave() {
    if (!this.academicYearId) {
      return;
    }

    const dateRange = this.dateRangeForm.value.dateRange;
    const payload = {
      academicYearId: this.academicYearId,
      startDate: formatDateToUnix(dateRange?.from!.toISOString()!),
      endDate: formatDateToUnix(dateRange?.to!.toISOString()!),
    };

    if (this.isEditMode()) {
      const semesterId = this.semesterId();
      if (semesterId === null) {
        return;
      }
      this.academicYearStateService.updateSemester(
        semesterId,
        payload,
        this.context,
        this.router,
      );
    } else {
      this.academicYearStateService.addSemester(
        payload,
        this.context,
        this.router,
      );
    }
  }

  setSemesterToEdit() {
    const semester = this.semesterListData().find(
      (s: SemesterDTO) => s.id === this.semesterId(),
    );

    this.semesterToEdit.set(semester ?? null);

    if (!semester) {
      return;
    }

    const startDate = parseISO(semester.startDate);
    const endDate = parseISO(semester.endDate);

    const fromDate = startOfDay(startDate);
    const toDate = startOfDay(endDate);

    this.dateRangeForm.setValue({
      dateRange: {
        from: fromDate,
        to: toDate,
      },
    });

    this.title = this.hesTranslateService.t(
      'academic_year.edit_semester_duration.title',
      {
        semester_number: this.semesterToEdit()?.name ?? 0,
        sup: AcademicYearUtils.getOrdinalSuffix(
          this.semesterToEdit()?.name ?? 0,
        ),
      },
    );
  }
}
