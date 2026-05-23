import {
  Component,
  Input,
  computed,
  signal,
  OnInit,
  inject,
  effect,
  input,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { CampusService } from '@pages/school-structure/pages/campus/campus.service';
import { Idropdown, IPagination } from '@shared/interfaces';
import {
  EducationalPathEnum,
  enumArrayFromEnum,
  GenderEnum,
} from '@shared/enums';
import { ISchoolPayload } from '@shared/interfaces/school.interface';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { noWhitespaceValidator } from '@utils/custom.validator';
import { map, switchMap } from 'rxjs';
import {
  ApiParam,
  PersonnelService,
} from '@pages/user-management/personnels/personnel.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { School } from '@shared/dto-transformation';

interface PreDefinedData {
  id: number;
  companyName: string;
  campusName: string;
}

@Component({
  selector: 'app-add-edit-school-dialog',
  templateUrl: './add-edit-school-dialog.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AddEditSchoolDialogComponent implements OnInit {
  faClose = faClose;
  currentLang: string;

  @Input() closeModal: () => void;
  @Input() refreshCampusDetail: () => void;
  schoolDetails = input<School | null>(null); // if null => add mode, else edit mode
  @Input() preDefinedData: PreDefinedData;

  private personnelService = inject(PersonnelService);
  private toaster = inject(HesToasterService);
  private fb = inject(FormBuilder);
  private nonNullablefb = inject(NonNullableFormBuilder);
  private translocoService = inject(TranslocoService);
  private campusService = inject(CampusService);

  private readonly personnelList = signal<IPagination | undefined>(undefined);
  private readonly params = signal<Partial<ApiParam>>({
    pageNumber: 1,
    itemsPerPage: 10,
  });
  private stagesDropdown = signal<Idropdown[]>([]);
  isEditModal = signal<boolean>(false);
  logo = computed(() => {
    return this.schoolDetails()?.displayLogo;
  });
  private readonly personnelOptions = signal<Idropdown[]>([]);
  loading = signal<boolean>(false);
  constructor() {
    this.currentLang = this.translocoService.getActiveLang();
    effect(() => {
      if (this.isEditModal())
        this.schoolForm.patchValue({
          examController: this.schoolDetails()?.examController,
          principal: this.schoolDetails()?.principal,
        });
    });
  }

  schoolForm = this.fb.group({
    companyName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    campusName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    arName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    enName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    stage: this.nonNullablefb.control<number | null>(null, Validators.required),
    gender: this.nonNullablefb.control([] as string[], Validators.required),
    educationalPath: this.nonNullablefb.control<EducationalPathEnum | null>(
      null,
      Validators.required,
    ),
    examController: this.nonNullablefb.control<number | null>(null),
    principal: this.nonNullablefb.control<number | null>(null),
    logo: this.nonNullablefb.control<IAttachmentControlValue[]>([]),
  });

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  getStages() {
    this.campusService.getStages().subscribe({
      next: (stages) => {
        const dropdownOptions = stages.map((stage) => ({
          value: stage.id,
          displayedValue: stage.displayName,
        }));
        this.stagesDropdown.set(dropdownOptions);
      },
      error: (err) => {
        this.toaster.showBackendError(err);
      },
    });
  }

  schoolFormConfig = computed<IControl[]>(() => [
    {
      type: 'file',
      formControlName: 'logo',
      acceptFileTypes: ['IMAGES'],
      required: !this.logo(),
      maxSizeInMB: 10,
      label: this.logo()
        ? ''
        : this.translate('school_structure.school_logo.label'),
    },
    {
      label: this.translate('school_structure.company_name.label'),
      type: 'input',
      formControlName: 'companyName',
      required: true,
      readonly: true,
    },
    {
      label: this.translate('school_structure.campus_name_req.label'),
      type: 'input',
      formControlName: 'campusName',
      required: true,
      readonly: true,
    },
    {
      label: this.translate('School_structure.school_name_en.label'),
      type: 'input',
      formControlName: 'enName',
      required: true,
    },
    {
      label: this.translate('School_structure.school_name_ar.label'),
      type: 'input',
      formControlName: 'arName',
      required: true,
    },
    {
      label: this.translate('school_structure.stage_req.label'),
      placeholder: this.translate('school_structure.select_stage.dropdown'),
      type: 'searchable-select',
      formControlName: 'stage',
      selectValues: this.stagesDropdown(),
      required: true,
    },
    {
      label: this.translate('school_structure.principal.label'),
      placeholder: this.translate('school_structure.select_principal.dropdown'),
      type: 'searchable-select',
      formControlName: 'principal',
      selectValues: this.personnelOptions(),
      required: false,
      searchableSelectObject: {
        pagination: this.personnelList(),
        searchable: true,
        onloadMore: (ev: InfiniteScrollCustomEvent) => {
          this.params.update((params) => ({
            ...params,
            pageNumber: +params.pageNumber! + 1,
          }));
          this.fetchPersonnel({
            loadMore: true,
            event: ev,
            params: {
              ...this.params(),
              campusId: this.preDefinedData.id!.toString(),
            },
          });
        },
        showChips: true,
        showClearBtn: false,
        onSearchChanged: (value: string) => {
          this.params.update(({ ...restParams }) => ({
            ...restParams,
            ...(value && { searchText: value }),
            pageNumber: 1,
          }));
          this.fetchPersonnel({
            params: {
              ...this.params(),
              campusId: this.preDefinedData.id!.toString(),
            },
          });
        },
      },
    },
    {
      label: this.translate('school_structure.exam_controller.label'),
      placeholder: this.translate(
        'school_structure.select_exam_controller.dropdown',
      ),
      type: 'searchable-select',
      formControlName: 'examController',
      selectValues: this.personnelOptions(),
      required: false,
      searchableSelectObject: {
        pagination: this.personnelList(),
        searchable: true,
        onloadMore: (ev: InfiniteScrollCustomEvent) => {
          this.params.update((params) => ({
            ...params,
            pageNumber: +params.pageNumber! + 1,
          }));
          this.fetchPersonnel({
            loadMore: true,
            event: ev,
            params: {
              ...this.params(),
              campusId: this.preDefinedData.id!.toString(),
            },
          });
        },
        showChips: true,
        showClearBtn: false,
        onSearchChanged: (value: string) => {
          this.params.update(({ ...restParams }) => ({
            ...restParams,
            ...(value && { searchText: value }),
            pageNumber: 1,
          }));
          this.fetchPersonnel({
            params: {
              ...this.params(),
              campusId: this.preDefinedData.id!.toString(),
            },
          });
        },
      },
    },
    {
      label: this.translocoService.translate('global.gender.title'),
      type: 'checkbox',
      formControlName: 'gender',
      selectValues: [
        {
          displayedValue: this.translocoService.translate('enum.BOYS'),
          value: GenderEnum.BOYS,
        },
        {
          displayedValue: this.translocoService.translate('enum.GIRLS'),
          value: GenderEnum.GIRLS,
        },
      ],
      required: true,
    },
    {
      label: this.translate('school_structure.educational_path_req.label'),
      type: 'radio',
      formControlName: 'educationalPath',
      selectValues: enumArrayFromEnum(EducationalPathEnum).map((e) => ({
        displayedValue: this.translocoService.translate(
          ('enum.' + e) as string,
        ),
        value: e,
      })) as ISelectValue[],
      required: true,
    },
  ]);

  ngOnInit() {
    this.isEditModal.set(!!this.schoolDetails());
    this.fetchPersonnel({
      params: {
        ...this.params(),
        campusId: this.preDefinedData.id!.toString(),
      },
    });
    this.getStages();

    // always patch the pre-defined data
    this.schoolForm.patchValue({
      companyName: this.preDefinedData.companyName,
      campusName: this.preDefinedData.campusName,
    });

    if (this.isEditModal()) {
      this.setEditValues();
    }
  }

  fetchPersonnel(args: {
    params: ApiParam;
    loadMore?: boolean;
    event?: InfiniteScrollCustomEvent;
  }) {
    const { loadMore = false, event, params } = args;
    this.personnelService.fetchPersonnels(params).subscribe({
      next: (res) => {
        if (loadMore) {
          const nextList: any = res.data.map((personnel) => ({
            value: personnel.id,
            displayedValue: personnel.displayName,
          }));
          this.personnelOptions.update((list) => {
            return list.concat(nextList);
          });
          event?.target.complete();
        } else {
          this.personnelOptions.set(
            res.data.map((personnel) => ({
              value: personnel.id,
              displayedValue: personnel.displayName,
            })),
          );
        }
      },
      error: (err) => {
        this.toaster.showBackendError(err, {
          ignoreErrorCodes: [404],
        });
      },
    });
  }

  setEditValues() {
    if (!this.schoolDetails()) return;
    const {
      arName,
      enName,
      stage,
      educationalPath,
      gender,
      examController,
      principal,
    } = this.schoolDetails() ?? {};
    // Patch relevant fields
    this.schoolForm.patchValue({
      arName,
      enName,
      stage: stage?.id,
      educationalPath,
      gender: this.setGenderForEdit(gender),
      examController,
      principal: principal,
    });
  }

  // Convert a single gender string into the array for the form
  setGenderForEdit(gender: GenderEnum | undefined): string[] {
    if (gender === GenderEnum.COMMON) {
      return [GenderEnum.BOYS, GenderEnum.GIRLS];
    }
    if (gender === GenderEnum.BOYS) {
      return [GenderEnum.BOYS];
    }
    if (gender === GenderEnum.GIRLS) {
      return [GenderEnum.GIRLS];
    }
    return [];
  }

  // Determine final gender enum from the array
  identifyGender(genderArray: string[]) {
    if (genderArray.length === 2) return GenderEnum.COMMON;
    if (genderArray.includes(GenderEnum.BOYS)) {
      return GenderEnum.BOYS;
    }
    if (genderArray.includes(GenderEnum.GIRLS)) {
      return GenderEnum.GIRLS;
    }
    return GenderEnum.COMMON;
  }
  // Build school payload ignoring the logo
  makeSchoolPayload(): Omit<ISchoolPayload, 'key'> {
    const formValues = this.schoolForm.getRawValue();
    return {
      arName: formValues.arName,
      enName: formValues.enName,
      campusId: this.preDefinedData.id,
      gender: this.identifyGender(formValues.gender),
      educationalPath: formValues.educationalPath!,
      stageId: Number(formValues.stage),
      ...(formValues.examController && {
        examController: formValues.examController,
      }),
      ...(formValues.principal && { principal: formValues.principal }),
    };
  }

  onAddSchool() {
    this.loading.set(true);
    this.campusService
      .uploadSchoolLogo(this.schoolForm.value.logo ?? [])
      .pipe(
        switchMap((attachments) => {
          const payload = this.makeSchoolPayload();
          return this.campusService.createSchool({
            ...payload,
            key: this.getAttachmentPayload(attachments),
          });
        }),
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.closeModal();
          this.refreshCampusDetail();
          this.toaster.success(
            this.translate(
              'school_structure.school_added_successfully_msg.txt',
            ),
          );
        },
        error: (err) => {
          this.loading.set(false);
          this.toaster.showBackendError(err);
        },
      });
  }

  getAttachmentPayload(attachments: IAttachmentControlUploadedValue[]): string {
    return attachments.length > 0
      ? attachments[0].key
      : this.schoolDetails()?.attachments[0]?.key || '';
  }

  onEditSchool() {
    this.loading.set(true);
    this.campusService
      .uploadSchoolLogo(this.schoolForm.value.logo ?? [])
      .pipe(
        switchMap((attachments) => {
          const payload = this.makeSchoolPayload();
          return this.campusService.updateSchool(this.schoolDetails()!.id, {
            ...payload,
            key: this.getAttachmentPayload(attachments),
          });
        }),
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.closeModal();
          this.refreshCampusDetail();
          this.toaster.success(
            this.translate('school_structure.school_updated_successfully.txt'),
          );
        },
        error: (err) => {
          this.loading.set(false);
          this.toaster.showBackendError(err);
        },
      });
  }

  get isLogoValid() {
    return this.schoolForm.controls.logo.value.length > 0 || !!this.logo();
  }
}
