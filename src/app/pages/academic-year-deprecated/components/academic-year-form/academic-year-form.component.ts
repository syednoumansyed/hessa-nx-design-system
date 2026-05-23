import {
  Component,
  Inject,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { IonLabel, IonIcon } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AcademicYearApiService } from '@pages/academic-year-deprecated/data-access/academic-year.api-service';
import { CreateAcademicYearPayloadDTO } from '@pages/academic-year-deprecated/data-access/academic-year.dto';
import { Subject } from 'rxjs';
import { formatDateToUnix } from '@shared/utils/date';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TuiDialogContext, TuiRootModule } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
@Component({
  selector: 'app-academic-year-form',
  templateUrl: './academic-year-form.component.html',
  standalone: true,
  imports: [
    IonLabel,
    IonIcon,
    TranslocoDirective,
    HesButtonModule,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    RbacDirective,
    HesDatePipe,
    TuiRootModule,
  ],
})
export class AcademicYearFormComponent implements OnInit {
  faCalendarDays = faCalendarDays;
  isFormShow = signal<boolean>(true);
  academicId = signal<number | null>(null);
  onRefresh: Subject<void>;
  deleteAcademic: () => void;
  private readonly academicApiService = inject(AcademicYearApiService);
  private readonly fb = inject(FormBuilder);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private transloco = inject(TranslocoService);
  private readonly toasterService = inject(HesToasterService);
  readonly faClose = faClose;
  readonly deleteAcademicPermission =
    RESOURCE_PERMISSION.academicYear.academicYearDelete;
  readonly updateAcaemicPermission =
    RESOURCE_PERMISSION.academicYear.academicYearUpdate;

  form = this.nonNullablefb.group({
    name: this.nonNullablefb.control(''),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    endDate: this.fb.control<Date | null>(null, Validators.required),
  });

  formConfig = computed<IControl[]>(() => {
    return [
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
        formControlName: 'name',
        required: false,
        readonly: true,
      },
    ];
  });

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any>,
  ) {}

  ngOnInit() {
    this.academicId.set(this.context.data?.academicId ?? null);
    this.isFormShow.set(!this.context.data?.isView);
    this.deleteAcademic = this.context.data?.deleteAcademic ?? null;
    this.onRefresh = this.context.data?.onRefresh ?? null;
    if (this.academicId()) {
      this.fetchAcademicYear();
    }
  }

  fetchAcademicYear() {
    this.academicApiService
      .fetchAcademicYearById(this.academicId()!)
      .subscribe((resp) => {
        const { startDate, endDate } = resp;
        this.form.patchValue({
          name: resp.name,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        });
      });
  }
  translate(key: string, params: object = {}): string {
    return this.transloco.translate(key, params);
  }
  onEdit() {
    this.isFormShow.set(true);
  }
  onSave() {
    let saveApiCall = this.academicApiService.addAcademicYear(
      this.getRestMap(),
    );
    if (this.academicId()) {
      saveApiCall = this.academicApiService.updateAcademicYear(
        this.academicId()!,
        this.getRestMap(),
      );
    }
    saveApiCall.subscribe({
      next: (resp) => {
        if (this.academicId()) {
          this.toasterService.success(
            '',
            this.translate('api.academic.year.created'),
          );
          this.onRefresh.next();
        } else {
          this.toasterService.success(
            '',
            this.translate('api.academic.years.found'),
          );
        }
        this.closeModal();
      },
      error: (errResp) => {
        this.toasterService.showBackendError(errResp);
      },
    });
  }

  getRestMap(): CreateAcademicYearPayloadDTO {
    const { startDate, endDate } = this.form.getRawValue();
    return {
      startDate: formatDateToUnix(startDate!.toISOString()),
      endDate: formatDateToUnix(endDate!.toISOString()),
    };
  }
  onDelete() {
    this.deleteAcademic();
    this.closeModal();
  }
  closeModal() {
    this.context.$implicit.complete();
  }
}
