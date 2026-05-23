import { Component, Input, computed, signal, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { PeriodDurationFormComponent } from '../period-duration-form/period-duration-form.component';
import { DaySelectionStatus, PeriodDurationType } from '@shared/enums';
import { TimePeriodUtils } from '@pages/time-periods/utils/time-period.utils';
import { TimePeriodService } from '@pages/time-periods/data-access/time-periods.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { Subject } from 'rxjs';
import { format, parse } from 'date-fns';
import {
  durationForm,
  IDaySelection,
  IPeriodDurationPayload,
  ITimePeriodPayload,
  ITimePeriodQueryParams,
  ITimePeriodUpdatePayload,
  Period,
  PeriodDetail,
  TimePeriodDetail,
} from '@shared/dto-transformation';

@Component({
  selector: 'app-period-duration-modal',
  templateUrl: './period-duration-modal.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PeriodDurationFormComponent,
  ],
  providers: [SchoolStructureListingService],
})
export class PeriodDurationModalComponent implements OnInit {
  faClose = faClose;
  currentLang: string = '';
  @Input() closeModal: () => void;
  @Input() timePeriodPayload: ITimePeriodQueryParams;
  @Input() onRefresh: Subject<void>;
  @Input() id: number;
  @Input() isEdit: boolean;

  daysOfWeek = signal<IDaySelection[]>([
    {
      value: 0,
      key: 'enum.SUNDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 1,
      key: 'enum.MONDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 2,
      key: 'enum.TUESDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 3,
      key: 'enum.WEDNESDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 4,
      key: 'enum.THURSDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 5,
      key: 'enum.FRIDAY',
      status: DaySelectionStatus.DEFAULT,
    },
    {
      value: 6,
      key: 'enum.SATURDAY',
      status: DaySelectionStatus.DEFAULT,
    },
  ]);

  readonly timePeriodDetail = signal<TimePeriodDetail | undefined>(undefined);

  periodDurationForm = this.fb.group({
    durations: this.fb.array<durationForm>([]),
  });

  get durations(): FormArray<durationForm> {
    return this.periodDurationForm.get('durations') as FormArray<durationForm>;
  }

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private hesTranslationService: HesTranslateService,
    private timePeriodService: TimePeriodService,
    private hesToasterService: HesToasterService,
    private toaster: HesToasterService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  ngOnInit() {
    if (this.isEdit) {
      this.getTimePeriod();
    } else {
      this.addFirstPeriodDuration();
      this.handleDaysValidation(this.timePeriodPayload);
    }
  }

  handleDaysValidation = (params: ITimePeriodQueryParams) => {
    this.timePeriodService.validateDays(params).subscribe({
      next: (res) => {
        res.forEach((day) => {
          this.daysOfWeek.update((d) => {
            return d.map((dow) => {
              if (dow.value === day.dayOfWeek) {
                if (this.isEdit && day.timePeriodId === this.id) {
                  return {
                    ...dow,
                    status: DaySelectionStatus.SELECTED,
                  };
                }
                return {
                  ...dow,
                  status: DaySelectionStatus.DISABLED,
                };
              }
              return dow;
            });
          });
        });
      },
    });
  };

  periodDurationFormConfig = computed<IControl[]>(() => {
    return [];
  });

  handleDaySelection(day: IDaySelection) {
    if (day.status === DaySelectionStatus.DISABLED) {
      return;
    }

    const updatedDays = this.daysOfWeek().map((d) => {
      if (d.value === day.value) {
        return {
          ...d,
          status:
            d.status === DaySelectionStatus.SELECTED
              ? DaySelectionStatus.DEFAULT
              : DaySelectionStatus.SELECTED,
        };
      }
      return d;
    });

    this.daysOfWeek.set(updatedDays);
  }

  getSelectedDays() {
    return this.daysOfWeek().filter(
      (d) => d.status === DaySelectionStatus.SELECTED,
    );
  }

  checkIfDayIsSelected() {
    return this.daysOfWeek().some(
      (d) => d.status === DaySelectionStatus.SELECTED,
    );
  }

  removePeriodDuration(index: number) {
    // Handle non-edit mode case
    if (!this.isEdit) {
      if (this.durations.length > 1) {
        this.handleDurationRemoval(index);
      }
      return;
    }

    // Handle null periods or length mismatch
    if (
      this.timePeriodDetail()?.periods === null ||
      this.durations.length !== this.timePeriodDetail()?.periods.length
    ) {
      this.handleDurationRemoval(index);
      return;
    }

    const periodId = this.timePeriodDetail()?.periods[index].id;
    if (!periodId) {
      return;
    }

    this.timePeriodService.deletePeriodById(+periodId).subscribe({
      next: () => {
        this.handleDurationRemoval(index);
        this.hesToasterService.success(
          '',
          this.hesTranslationService.t(
            'time_period.period_deleted_successfully.txt',
          ),
        );
        this.getTimePeriod();
      },
      error: (errorResp) => {
        this.toaster.showBackendError(errorResp);
      },
    });
  }

  private handleDurationRemoval(index: number) {
    this.durations.removeAt(index);

    if (this.durations.length === 0) {
      return;
    }

    const previousDuration = this.durations.at(index - 1);
    if (!previousDuration) {
      return;
    }

    // Enable period duration type
    this.enableControl(previousDuration, 'periodDurationType');
    // // Enable end time
    this.enableControl(previousDuration, 'endTime');
    // Enable start time only if it's the last remaining duration
    if (this.durations.length === 1) {
      this.enableControl(previousDuration, 'startTime');
    }
  }

  addPeriodDuration() {
    if (this.durations.length === 0) {
      this.addFirstPeriodDuration();
      return;
    }
    const lastDuration = this.durations.at(this.durations.length - 1);
    if (lastDuration && lastDuration.valid) {
      const lastEndTime = lastDuration.controls.endTime.value;
      this.durations.push(
        this.fb.group({
          periodDurationType: this.nonNullablefb.control<PeriodDurationType>(
            PeriodDurationType.PERIOD,
            Validators.required,
          ),
          durationNumber: this.nonNullablefb.control(''),
          startTime: this.nonNullablefb.control<string>(
            { value: lastEndTime || '', disabled: true },
            Validators.required,
          ),
          endTime: this.nonNullablefb.control<string>('', Validators.required),
        }),
      );

      TimePeriodUtils.setPeriodDurationNumbers(this.durations);

      // disable just the previous duration
      this.disableControl(lastDuration, 'periodDurationType');
      this.disableControl(lastDuration, 'startTime');
      this.disableControl(lastDuration, 'endTime');
    }
  }

  onAddTimePeriod() {
    if (this.periodDurationForm.valid) {
      const periodDurations = this.periodDurationForm
        .getRawValue()
        .durations.map((d: Period) => {
          return {
            startTime: d.startTime,
            endTime: d.endTime,
            durationType: d.periodDurationType,
          };
        });
      const finalPayload: ITimePeriodPayload = {
        ...(this.timePeriodPayload as ITimePeriodPayload),
        daysOfWeek: this.getSelectedDays().map((d) => d.value),
        periodDurations,
      };
      this.timePeriodService.postTimePeriod(finalPayload).subscribe({
        next: () => {
          this.closeModal();
          this.onRefresh.next();
          this.hesToasterService.success(
            '',
            this.hesTranslationService.t(
              'time_period.time_period_created_successfully.txt',
            ),
          );
        },
        error: (errorResp) => {
          this.toaster.showBackendError(errorResp);
        },
      });
    }
  }

  onUpdatePeriodDuration() {
    const allPeriods: Period[] = this.durations.getRawValue();
    const dbPeriods: PeriodDetail[] = this.timePeriodDetail()?.periods || [];

    const newlyAddedPeriods: IPeriodDurationPayload[] =
      this.getNewlyAddedPeriods(allPeriods, dbPeriods);
    const updatedLastEntry = this.getUpdatedLastDbEntry(allPeriods, dbPeriods);

    const updateTimePeriodPayload = this.buildUpdatePayload(
      newlyAddedPeriods,
      updatedLastEntry,
    );

    // check if days selection have been changed
    const selectedDays = this.getSelectedDays().map((d) => d.value);
    const dbDays = this.timePeriodDetail()?.days.flatMap((d) => d.dayOfWeek);
    const isDaysChanged: boolean =
      !dbDays ||
      selectedDays.length !== dbDays.length ||
      !selectedDays.every((day: number) => dbDays.includes(day)) ||
      !dbDays.every((day: number) => selectedDays.includes(day));

    if (this.isPayloadEmpty(updateTimePeriodPayload) && !isDaysChanged) {
      this.hesToasterService.error(
        '',
        this.hesTranslationService.t(
          'time_period.change_period_duration_or_add_new_to_update.txt',
        ),
      );
      return;
    }

    if (isDaysChanged) {
      updateTimePeriodPayload.daysOfWeek = selectedDays;
    }

    this.updateTimePeriod(updateTimePeriodPayload);
  }

  private getNewlyAddedPeriods(
    allPeriods: Period[],
    dbPeriods: PeriodDetail[],
  ) {
    return allPeriods.slice(dbPeriods.length).map((period) => ({
      startTime: period.startTime,
      endTime: period.endTime,
      durationType: period.periodDurationType,
    }));
  }

  private getUpdatedLastDbEntry(
    allPeriods: Period[],
    dbPeriods: PeriodDetail[],
  ) {
    const lastDbEntry = dbPeriods[dbPeriods.length - 1];
    const lastEntryInForm = allPeriods[dbPeriods.length - 1];

    if (!lastDbEntry || !lastEntryInForm) {
      return null;
    }

    const formattedDbStart = format(
      parse(lastDbEntry.startTime, 'HH:mm:ss', new Date()),
      'HH:mm',
    );
    const formattedDbEnd = format(
      parse(lastDbEntry.endTime, 'HH:mm:ss', new Date()),
      'HH:mm',
    );

    const isUpdated =
      formattedDbStart !== lastEntryInForm.startTime ||
      formattedDbEnd !== lastEntryInForm.endTime ||
      lastDbEntry.durationType !== lastEntryInForm.periodDurationType;

    if (isUpdated) {
      return {
        id: lastDbEntry.id,
        startTime: lastEntryInForm.startTime,
        endTime: lastEntryInForm.endTime,
        durationType: lastEntryInForm.periodDurationType,
      };
    }

    return null;
  }

  private buildUpdatePayload(
    newPeriods: IPeriodDurationPayload[],
    updatedLastEntry: IPeriodDurationPayload | null,
  ) {
    const payload: ITimePeriodUpdatePayload = {};

    if (updatedLastEntry) {
      payload.updatePeriod = {
        id: updatedLastEntry.id as number,
        startTime: updatedLastEntry.startTime,
        endTime: updatedLastEntry.endTime,
        durationType: updatedLastEntry.durationType,
      };
    }

    if (newPeriods.length) {
      payload.periodDurations = newPeriods;
    }

    return payload;
  }

  private isPayloadEmpty(payload: ITimePeriodUpdatePayload) {
    return Object.keys(payload).length === 0;
  }

  private updateTimePeriod(payload: ITimePeriodUpdatePayload) {
    this.timePeriodService.updateTimePeriodById(this.id, payload).subscribe({
      next: () => {
        this.closeModal();
        this.onRefresh.next();
        this.hesToasterService.success(
          '',
          this.hesTranslationService.t(
            'time_period.time_period_updated_successfully.txt',
          ),
        );
        this.getTimePeriod();
      },
      error: (errorResp) => {
        this.toaster.showBackendError(errorResp);
      },
    });
  }

  private getTimePeriod() {
    this.timePeriodService
      .getTimePeriodById(this.id)
      .subscribe((res: TimePeriodDetail) => {
        this.timePeriodDetail.set(res);
        this.handleDaysValidation({
          schoolId: res.school.id,
          academicYearId: res.academicYear.id,
          classId: res.class?.id,
          levelId: res.level.id,
        });
        if (res.periods && res.periods.length) {
          this.patchTimePeriodDetails();
        }
      });
  }

  private patchTimePeriodDetails() {
    const timePeriodDetails: TimePeriodDetail =
      this.timePeriodDetail() as TimePeriodDetail;

    if (!timePeriodDetails) {
      return; // Early return if timePeriodDetails is null or undefined
    }

    this.durations.clear();

    timePeriodDetails.periods.forEach((pd: PeriodDetail, index: number) => {
      const group = this.fb.group({
        periodDurationType: this.nonNullablefb.control<PeriodDurationType>(
          pd.durationType,
          Validators.required,
        ),
        durationNumber: this.nonNullablefb.control<string>(
          pd.periodNumber ? pd.periodNumber.toString() : '',
        ),
        startTime: this.nonNullablefb.control<string>(
          format(parse(pd.startTime, 'HH:mm:ss', new Date()), 'HH:mm') || '',
          Validators.required,
        ),
        endTime: this.nonNullablefb.control<string>(
          format(parse(pd.endTime, 'HH:mm:ss', new Date()), 'HH:mm') || '',
          Validators.required,
        ),
      });

      this.durations.push(group);

      if (timePeriodDetails.periods.length > 1) {
        if (index === timePeriodDetails.periods.length - 1) {
          this.disableControl(group, 'startTime');
        } else {
          this.disableControl(group, 'periodDurationType');
          this.disableControl(group, 'startTime');
          this.disableControl(group, 'endTime');
        }
      }
    });
  }

  private addFirstPeriodDuration() {
    this.durations.push(
      this.fb.group({
        periodDurationType: this.nonNullablefb.control<PeriodDurationType>(
          PeriodDurationType.PERIOD,
          Validators.required,
        ),
        durationNumber: this.nonNullablefb.control('1'),
        startTime: this.nonNullablefb.control<string>('', Validators.required),
        endTime: this.nonNullablefb.control<string>('', Validators.required),
      }),
    );
  }

  private enableControl(duration: durationForm, controlName: string) {
    duration.get(controlName)?.enable({ onlySelf: true, emitEvent: false });
  }

  private disableControl(duration: durationForm, controlName: string) {
    duration.get(controlName)?.disable({ onlySelf: true, emitEvent: false });
  }
}
