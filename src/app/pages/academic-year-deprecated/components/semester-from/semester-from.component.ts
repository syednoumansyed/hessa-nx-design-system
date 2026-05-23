import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { IonLabel, IonIcon } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AcademicYearApiService } from '@pages/academic-year-deprecated/data-access/academic-year.api-service';
import { formatDateToUnix } from '@shared/utils/date';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';

@Component({
  selector: 'app-semester-from',
  templateUrl: './semester-from.component.html',
  standalone: true,
  imports: [
    IonLabel,
    IonIcon,
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
    RbacDirective,
    HesDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterFromComponent implements OnInit {
  faCalendarDays = faCalendarDays;
  semesterId = signal<number | null>(null);
  isView = signal(false);
  academicId = signal<number | null>(null);
  onRefresh: Subject<void>;
  deleteSemester: (id: number) => void;
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly fb = inject(FormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly academicYearApiService = inject(AcademicYearApiService);
  private readonly toasterService = inject(ToastrService);
  readonly semesterDeletePermission =
    RESOURCE_PERMISSION.semester.semesterDelete;
  readonly semesterUpdatePermission =
    RESOURCE_PERMISSION.semester.semesterUpdate;
  readonly faClose = faClose;
  readonly form = this.nonNullablefb.group({
    academicName: this.nonNullablefb.control('', Validators.required),
    name: this.nonNullablefb.control(''),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    endDate: this.fb.control<Date | null>(null, Validators.required),
  });

  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('academic_enrolment.academic_year_req.label'),
        type: 'input',
        formControlName: 'academicName',
        required: true,
        readonly: true,
      },
      {
        label: this.translate('global.start_date.title'),
        type: 'date',
        formControlName: 'startDate',
        required: true,
      },
      {
        label: this.translate('global.end_date.title'),
        type: 'date',
        formControlName: 'endDate',
        required: true,
      },
    ];
  });
  viewformConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('academic_enrolment.academic_year_req.label'),
        type: 'input',
        formControlName: 'academicName',
        required: true,
        readonly: true,
      },
      {
        label: this.translate('academic_enrolment.semester_name_req.label'),
        type: 'input',
        placeholder: this.translate(
          'academic_enrolment.semester_name.placeholder',
        ),
        formControlName: 'name',
        required: true,
        readonly: true,
      },
    ];
  });

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any>,
  ) {}

  ngOnInit() {
    this.academicId.set(this.context.data?.academicId ?? null);
    this.semesterId.set(this.context.data?.semesterId ?? null);
    this.isView.set(this.context.data?.isView ?? false);
    this.deleteSemester = this.context.data?.deleteSemester ?? null;
    this.onRefresh = this.context.data?.onRefresh ?? null;
    if (this.academicId())
      this.academicYearApiService
        .fetchAcademicYearById(this.academicId()!)
        .subscribe((resp) => {
          this.form.patchValue({
            academicName: resp.name,
          });
        });
    this.fetchSemester();
  }
  onEdit() {
    this.isView.set(false);
  }

  fetchSemester() {
    if (this.semesterId()) {
      this.academicYearApiService
        .fetchSemesterById(this.semesterId()!)
        .subscribe((resp) => {
          this.form.patchValue({
            name: resp.name,
            startDate: resp.startDate ? new Date(resp.startDate) : null,
            endDate: resp.endDate ? new Date(resp.endDate) : null,
          });
        });
    }
  }
  onSave() {
    let apiCallService = this.academicYearApiService.addSemester({
      ...this.getPayload(),
      academicYearId: this.academicId()!,
    });
    if (this.semesterId()) {
      apiCallService = this.academicYearApiService.updateSemester(
        this.semesterId()!,
        this.getPayload(),
      );
    }

    apiCallService.subscribe({
      next: () => {
        this.toasterService.success(
          '',
          this.translate(
            this.semesterId() ? 'api.semester.updated' : 'api.semesters.found',
          ),
        );

        this.onRefresh.next();
        this.closeModal();
      },
      error: (errorResp) => {
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

  getPayload() {
    const { startDate, endDate } = this.form.getRawValue();
    return {
      startDate: formatDateToUnix(startDate!.toISOString()),
      endDate: formatDateToUnix(endDate!.toISOString()),
    };
  }

  onDeleteClick() {
    if (this.semesterId) this.deleteSemester(this.semesterId()!);
    this.closeModal();
  }

  closeModal() {
    this.context.$implicit.complete();
  }
}
