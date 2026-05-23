import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PeriodDurationType, dropdownArrayFromEnum } from '@shared/enums';
import { Subscription } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { getTimeSlots, timeDiffInMins } from '@shared/utils/get-time-slot.util';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { faMinusCircle } from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { TimePeriodUtils } from '@pages/time-periods/utils/time-period.utils';
import {
  durationForm,
  durationsForm,
} from '@shared/dto-transformation/time-period/time-period.interface';

@Component({
  selector: 'app-period-duration-form',
  templateUrl: './period-duration-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesButtonModule,
    TranslocoDirective,
    HesIconComponent,
  ],
})
export class PeriodDurationFormComponent implements OnInit, OnDestroy {
  isMobile = isMobile();

  @Input() durations: durationsForm;
  @Input() durationForm: durationForm;
  @Input() showRemoveButton: boolean;
  @Input() isEdit: boolean;

  @Output() removeClicked = new EventEmitter();
  private readonly endTimeSlots = signal<ISelectValue[]>([]);
  private readonly subscription = new Subscription();
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly translocoService = inject(TranslocoService);

  readonly removeIcon: FaIconComponentsProps = {
    icon: faMinusCircle,
    size: 'xl',
  };

  periodDurationFormConfig = computed<IControl[]>(() => {
    return [
      {
        type: 'searchable-select',
        selectValues: dropdownArrayFromEnum(PeriodDurationType),
        formControlName: 'periodDurationType',
        required: true,
        isEnumTranslate: true,
      },
      {
        type: 'input',
        formControlName: 'durationNumber',
        required: false,
        readonly: true,
      },
      {
        type: 'searchable-select',
        formControlName: 'startTime',
        selectValues: getTimeSlots(
          this.translocoService.getActiveLang(),
          undefined,
          timeDiffInMins,
        ),
        required: true,
        placeholder: this.hesTranslateService.t(
          'time_period.start_time.placeholder',
        ),
        searchableSelectObject: {
          showClockIcon: true,
        },
      },
      {
        type: 'searchable-select',
        formControlName: 'endTime',
        selectValues: this.endTimeSlots(),
        required: true,
        placeholder: this.hesTranslateService.t(
          'time_period.end_time.placeholder',
        ),
        searchableSelectObject: {
          showClockIcon: true,
        },
      },
    ];
  });

  ngOnInit() {
    this.subscription.add(
      this.durationForm.controls.startTime.valueChanges.subscribe(() => {
        this.durationForm.controls.endTime.setValue('');
        this.resetEndTimeSlot();
      }),
    );
    this.subscription.add(
      this.durationForm.controls.periodDurationType.valueChanges.subscribe(
        () => {
          this.handlePeriodDurationTypeChange();
        },
      ),
    );
    if (this.durationForm.controls.startTime.value) {
      this.resetEndTimeSlot();
    }
  }

  removePeriodDuration() {
    this.removeClicked.emit();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private handlePeriodDurationTypeChange() {
    TimePeriodUtils.setPeriodDurationNumbers(this.durations);
  }

  private resetEndTimeSlot() {
    const startTime = this.durationForm.get('startTime')?.value;
    if (startTime) {
      this.endTimeSlots.set(
        getTimeSlots(
          this.translocoService.getActiveLang(),
          startTime,
          timeDiffInMins,
        ),
      );
    } else {
      this.endTimeSlots.set(
        getTimeSlots(
          this.translocoService.getActiveLang(),
          undefined,
          timeDiffInMins,
        ),
      );
    }
  }
}
