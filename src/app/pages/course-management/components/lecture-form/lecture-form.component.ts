import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DsFormControlGeneratorComponent } from '@shared/components/ds-form-control-generator/ds-form-control-generator.component';
import { DsFormControl } from '@shared/components/ds-form-control-generator/ds-form-control-generator.model';
import { DsModalHeaderConfig, DsModalFooterConfig } from '@ds/modal';

import { LectureDTO } from '@pages/course-management/data-access/course-management.dto';
import { LectureApiService } from '@pages/course-management/data-access/lecture.api.service';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { getDaysOfWeek } from '@pages/course-management/utils/day-of-week.utils';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { format, parse } from 'date-fns';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { getTimeSlots } from '@shared/utils/get-time-slot.util';
import { CourseManagement } from '@pages/course-management/data-access/course-management.interface';

@Component({
  selector: 'app-lecture-form',
  templateUrl: './lecture-form.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    TranslocoDirective,
    DsFormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
    DayOfWeekPipe,
    Time12hrPipe,
  ],
})
export class LectureFormComponent implements OnInit, OnDestroy {
  /** Injected by DsModalWrapperComponent */
  closeModal!: (data?: unknown, role?: string) => void;

  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly lectureApiService = inject(LectureApiService);
  private readonly toasterService = inject(ToastrService);
  private translocoService = inject(TranslocoService);

  currentLang: string = '';
  isFormShow = signal<boolean>(true);

  @Input() set isView(val: boolean) {
    this.isFormShow.set(!val);
  }
  @Input() lecture?: LectureDTO;
  @Input() onRefresh: Subject<void>;
  @Input() course: CourseManagement;
  @Input() deleteLecture: (id: number) => void;

  readonly headerConfig = computed<DsModalHeaderConfig>(() => {
    const showForm = this.isFormShow();
    let title: string;
    if (!showForm) {
      title = this.translate('resource.lecture');
    } else if (!this.lecture?.id) {
      title = this.translate('course_management.add_lecture_class.title');
    } else {
      title = this.translate('course_management.edit_lecture_class.title');
    }
    return {
      title: `${title} ${this.course?.class?.displayName ?? ''}`,
      showCloseButton: true,
    };
  });

  private readonly periods = computed(() => {
    return this.lectureApiService.timePeriods().map((period) => {
      const startTime = parse(period.startTime, 'HH:mm', new Date());
      const endTime = parse(period.endTime, 'HH:mm', new Date());
      const formattedStartTime = format(startTime, 'HH:mm');
      const formattedEndTime = format(endTime, 'HH:mm');
      const time = `${formattedStartTime} - ${formattedEndTime}`;
      const duration =
        Math.abs(endTime.getTime() - startTime.getTime()) / 60000;
      return {
        displayedValue: `${this.translate('enum.PERIOD')} ${period.periodNumber ?? ''}: ${time} (${duration} ${this.translate('global.minutes.txt')})`,
        value: period.id.toString(),
        disabled: !(
          this.lecture?.periodId === period.id ||
          (period.isAvailable && period.durationType === 'PERIOD')
        ),
      };
    });
  });

  faCalendarDays = faCalendarDays;
  faClock = faClock;

  private readonly endTimeSlots = signal<any[]>([]);
  private readonly subscription = new Subscription();

  constructor() {
    this.currentLang = this.translocoService.getActiveLang();
  }

  form = this.nonNullablefb.group({
    courseName: this.nonNullablefb.control(''),
    dayOfWeek: this.nonNullablefb.control(0, Validators.required),
    teacher: this.nonNullablefb.control('', Validators.required),
    period: this.nonNullablefb.control('', Validators.required),
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  readonly footerConfig = computed<DsModalFooterConfig | undefined>(() => {
    const showForm = this.isFormShow();
    if (showForm) {
      const formInvalid = this.formStatus() === 'INVALID';
      const periodUnchanged =
        !!this.lecture &&
        this.lecture?.periodId?.toString() === this.formValue()?.period;
      return {
        primaryButton: {
          text: this.translate('global.save.btn'),
          variant: 'primary',
          disabled: formInvalid || periodUnchanged,
        },
        secondaryButton: {
          text: this.translate('global.cancel.btn'),
          variant: 'secondary',
        },
      };
    } else {
      return {
        primaryButton: {
          text: this.translate('global.edit.btn'),
          variant: 'primary',
        },
        secondaryButton: {
          text: this.translate('global.delete.btn'),
          variant: 'dangerStroke',
        },
      };
    }
  });

  formConfig = computed<DsFormControl[]>(() => {
    return [
      {
        label: this.translate('course_management.teacher.title'),
        type: 'input',
        formControlName: 'teacher',
        required: false,
        disabled: true,
        placeholder: this.translate('course_management.teacher.title'),
      },
      {
        label: this.translate('course_management.day_of_the_week_req.label'),
        type: 'searchable-select',
        formControlName: 'dayOfWeek',
        selectValues: getDaysOfWeek(
          this.translocoService.getActiveLang(),
        ) as any,
        required: true,
        placeholder: this.translate(
          'course_management.select_start_time.dropdown',
        ),
      },
      {
        label: this.translate('course_management.select_period.label'),
        type: 'searchable-select',
        formControlName: 'period',
        isMultiple: false,
        selectValues: this.periods(),
        required: true,
        placeholder: this.translate('course_management.select_period.label'),
      },
    ];
  });

  viewformConfig = computed<DsFormControl[]>(() => {
    return [
      {
        label: this.translate('course_management.course_name.label'),
        type: 'input',
        formControlName: 'courseName',
        required: false,
        readonly: true,
      },
    ];
  });

  ngOnInit() {
    this.form.controls.teacher.setValue(this.course.personnel.displayName!);
    if (this.lecture) {
      this.form.patchValue({
        courseName: this.course.subject.displayName,
        dayOfWeek: this.lecture.dayOfWeek,
        period: this.lecture.periodId.toString(),
      });
      this.resetEndTimeSlot();
    }

    this.form.controls.dayOfWeek.valueChanges.subscribe(() => {
      this.fetchPeriods();
    });
    this.fetchPeriods();
  }

  fetchPeriods() {
    this.lectureApiService
      .fetchPeriods({
        schoolId: this.course.school.id,
        levelId: this.course.level.id,
        academicYearId: this.course.academicYear.id!,
        dayOfWeek: this.form.controls.dayOfWeek.value,
        courseId: this.course.id,
        classId: this.course.class.id,
      })
      .subscribe();
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  getPeriodInfo(id: number): { title: string; text: string } {
    const period = this.lectureApiService
      .timePeriods()
      .find((period) => period.id === id);
    if (!period) {
      return { title: '', text: '' };
    }
    const startTime = parse(period.startTime, 'HH:mm', new Date());
    const endTime = parse(period.endTime, 'HH:mm', new Date());
    const duration = Math.abs(endTime.getTime() - startTime.getTime()) / 60000;
    const formattedStartTime = format(startTime, 'HH:mm');
    const formattedEndTime = format(endTime, 'HH:mm');
    return {
      title:
        period.durationType === 'PERIOD'
          ? `${this.translate('enum.PERIOD')} ${period.periodNumber}`
          : this.translate('enum.BREAK'),
      text: `${formattedStartTime} - ${formattedEndTime} (${duration} ${this.translate('global.minutes.txt')})`,
    };
  }

  onPrimaryClick(): void {
    if (this.isFormShow()) {
      this.onSave();
    } else {
      this.onEdit();
    }
  }

  onSecondaryClick(): void {
    if (this.isFormShow()) {
      this.closeModal();
    } else {
      this.onDelete();
    }
  }

  onEdit() {
    this.isView = false;
  }

  onDelete() {
    if (this.lecture?.id) this.deleteLecture(this.lecture.id);
    this.closeModal();
  }

  onSave() {
    let apiCallService = this.lectureApiService.addLecture({
      ...this.getRestMap(),
    });
    if (this.lecture?.id) {
      apiCallService = this.lectureApiService.updateLecture(
        this.lecture.id,
        this.getRestMap(),
      );
    }

    apiCallService.subscribe({
      next: () => {
        this.onRefresh.next();
        this.closeModal();
        if (this.lecture?.id) {
          this.toasterService.success(
            this.translocoService.translate(
              'course_management.lecture_edit_successfully.txt',
            ),
          );
        } else {
          this.toasterService.success(
            this.translocoService.translate(
              'course_management.lecture_add_successfully.txt',
            ),
          );
        }
      },
      error: (errorResp: HttpErrorResponse) => {
        if (errorResp?.error?.message) {
          this.toasterService.error('', errorResp.error.message);
        } else {
          this.toasterService.error(
            this.translocoService.translate('global.delete_wrong_msg.txt'),
            this.translocoService.translate('global.wrong_msg.title'),
          );
        }
      },
    });
  }

  getRestMap() {
    const { dayOfWeek, period } = this.form.getRawValue();
    return {
      dayOfWeek: +dayOfWeek,
      courseId: this.course.id,
      periodId: +period,
      classId: this.course.class.id as number,
    };
  }

  getRestTime(time: string): string {
    const parsedTime = parse(time, 'hh:mm a', new Date());
    return format(parsedTime, 'HH:mm');
  }

  private resetEndTimeSlot() {
    const startTime = this.form.get('startTime')?.value;
    if (startTime) {
      this.endTimeSlots.set(
        getTimeSlots(this.translocoService.getActiveLang(), startTime),
      );
    } else {
      this.endTimeSlots.set(
        getTimeSlots(this.translocoService.getActiveLang()),
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
