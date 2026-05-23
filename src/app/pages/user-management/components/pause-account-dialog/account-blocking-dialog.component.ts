import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  Inject,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faTriangleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { StudentsService } from '../../students/students.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { formatDateToUnix } from '@shared/utils/date';
import { ObjId } from '@shared/interfaces/common.interface';
import { Observable } from 'rxjs';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TuiDay } from '@taiga-ui/cdk';
import { endOfDay, getUnixTime, isToday, startOfDay } from 'date-fns';

@Component({
  selector: 'app-account-blocking-dialog',
  templateUrl: './account-blocking-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AccountBlockingDialogComponent implements OnInit {
  //#region Injectables
  private readonly studentsService = inject(StudentsService);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly toastr = inject(HesToasterService);
  //#endregion

  //#region Public Properties
  studentId = signal<ObjId>('');
  studentName = signal<string>('');
  isPause = signal<boolean>(false);
  onAccountStateSuccess: () => void;
  faTriangleExclamation = faTriangleExclamation;

  readonly form = this.nonNullablefb.group({
    dateRange: this.nonNullablefb.control<{ from: Date; to: Date }>(
      { from: new Date(), to: new Date() },
      Validators.required,
    ),
    reason: this.nonNullablefb.control('', Validators.required),
  });

  readonly formConfig = computed<IControl[]>(() => {
    const duration: IControl = {
      label: this.translate('deactivation_paused_user.pause_duration.label'),
      placeholder: this.translate(
        'deactivation_paused_user.date_range.dropdown',
      ),
      formControlName: 'dateRange',
      type: 'date-range',
      datePickerConfig: {
        min: TuiDay.currentLocal(),
      },
      required: true,
    };

    const reason: IControl = {
      label: this.translate('deactivation_paused_user.reason.label'),
      placeholder: this.translate(
        'deactivation_paused_user.reason.placeholder',
      ),
      formControlName: 'reason',
      type: 'textarea',
      required: true,
    };

    const controls = [];
    if (this.isPause()) {
      controls.push(duration);
    }
    controls.push(reason);
    return controls;
  });
  //#endregion

  /** Bulk mode — skips individual API call, returns payload to parent */
  isBulk = signal<boolean>(false);

  //#region public Methods
  ngOnInit() {
    const { studentId, studentName, isPause, onAccountStateSuccess, isBulk } =
      this.context?.data ?? {};
    this.studentId.set(studentId);
    this.studentName.set(studentName);
    this.isPause.set(isPause);
    this.isBulk.set(!!isBulk);
    this.onAccountStateSuccess = onAccountStateSuccess;
  }

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any>,
  ) {}

  closeModal() {
    this.context.completeWith(false);
  }

  onConfirm() {
    // In bulk mode, return the payload without calling the individual API
    if (this.isBulk()) {
      const payload = this.makePauseStudentPayload();
      this.context.completeWith(payload);
      return;
    }

    let obs: Observable<unknown>;
    const { reason, ...rest } = this.makePauseStudentPayload();
    if (this.isPause())
      obs = this.studentsService.pauseStudent(this.studentId(), {
        reason,
        ...rest,
      });
    else obs = this.studentsService.deactivateStudent(this.studentId(), reason);
    obs.subscribe({
      next: () => {
        this.context.completeWith(true);
        this.onAccountStateSuccess?.();
      },
      error: (errResp) => {
        this.toastr.showBackendError(errResp);
      },
    });
  }
  //#endregion

  //#region Private Methods
  private translate(key: string, params: object = {}): string {
    return this.hesTranslateService.t(key, params);
  }

  private makePauseStudentPayload() {
    const formValues = this.form.getRawValue();
    const endTime = getUnixTime(endOfDay(formValues.dateRange.to));

    return {
      status: 'PAUSED',
      startTime: this.getStartTime(),
      endTime,
      reason: formValues.reason,
    };
  }

  private getStartTime(): number {
    const {
      dateRange: { from },
    } = this.form.getRawValue();

    let startTime: number;
    if (isToday(from)) {
      startTime = getUnixTime(new Date());
    } else {
      startTime = getUnixTime(startOfDay(from));
    }
    return startTime;
  }
  //#endregion
}
