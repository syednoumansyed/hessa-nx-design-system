import { isDevEnvironment } from '@shared/utils/env.util';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ModalController } from '@ionic/angular/standalone';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import { CompanyService } from '@pages/school-structure/pages/company/company.service';
import { Idropdown, IResponse } from '@shared/interfaces';
import { SchoolStructureService } from '@pages/school-structure/school-structure.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { noWhitespaceValidator } from '@utils/custom.validator';
import {
  Company,
  CreateCompanyPayload,
} from '@shared/dto-transformation/organization';
import { switchMap } from 'rxjs';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

@Component({
  selector: 'app-add-company',
  templateUrl: './add-company.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
    HesButtonModule,
  ],
})
export class AddCompanyComponent implements OnInit {
  faClose = faClose;
  currentLang: string = '';

  private parentCompanies = signal<Idropdown[]>([]);

  isEditModal = signal<boolean>(false);

  companyDetails = input<Company | null>(null);

  @Input() isSubCompany: boolean = false;

  @Input() parentCompany: Company | null = null;

  loading = signal(false);
  private toastr = inject(HesToasterService);

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private companyService: CompanyService,
    private schoolStructure: SchoolStructureService,
    private modalCtrl: ModalController,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }
  logo = computed(() => {
    return this.companyDetails()?.displayLogo;
  });

  companyForm = this.fb.group({
    enName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    arName: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
    parentId: '',
    logo: this.nonNullablefb.control<IAttachmentControlValue[]>([]),
  });

  companyFormConfig = computed<IControl[]>(() => {
    return [
      {
        type: 'file',
        formControlName: 'logo',
        required: !this.logo(),
        maxSizeInMB: 10,
        acceptFileTypes: ['IMAGES'],
        label: this.logo()
          ? ''
          : this.translocoService.translate(
              'school_structure.company_logo.label',
            ),
      },
      {
        label: this.translocoService.translate(
          'school_structure.company_name_en.label',
        ),
        placeholder: this.translocoService.translate(
          'school_structure.company_name.placeholder',
        ),
        type: 'input',
        formControlName: 'enName',
        required: true,
        errorMessage: {
          uniqueNameError: this.translocoService.translate(
            'global.company_already_exists.txt',
          ),
        },
      },
      {
        label: this.translocoService.translate(
          'school_structure.company_name_ar.label',
        ),
        placeholder: this.translocoService.translate(
          'school_structure.company_name.placeholder',
        ),
        type: 'input',
        formControlName: 'arName',
        required: true,
        errorMessage: {
          uniqueNameError: this.translocoService.translate(
            'global.company_already_exists.txt',
          ),
        },
      },
      {
        label: this.translocoService.translate(
          'school_structure.parent_company.label',
        ),
        placeholder: this.translocoService.translate(
          'school_structure.select_parent_company.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'parentId',
        selectValues: this.parentCompanies().filter(
          (company) =>
            company.displayedValue !==
            (this.companyDetails()?.displayName || ''),
        ),
        required: false,
      },
    ];
  });

  ngOnInit() {
    this.isEditModal.set(!!this.companyDetails());
    if (!this.isSubCompany) {
      this.companyService.getParentCompanies().subscribe({
        next: (res) => {
          const newArr = res.map((company: Company) => {
            return { value: company.id, displayedValue: company.displayName };
          });
          this.parentCompanies.set(newArr);
        },
        error: (_err) => {
          this.toastr.showGlobalWrongMessage();
        },
      });
    }
    if (this.isEditModal()) {
      this.companyForm.patchValue({
        arName: this.companyDetails()?.arName ?? '',
        enName: this.companyDetails()?.enName ?? '',
      });
      if (this.companyDetails()?.parentId) {
        this.companyForm.patchValue({
          parentId: this.companyDetails()?.parentId?.toString(),
        });
      }
    }
    if (this.isSubCompany) {
      this.parentCompanies.set([
        {
          value: this.parentCompany?.id.toString()!,
          displayedValue: this.parentCompany?.displayName!,
        },
      ]);
      this.companyForm.patchValue({
        parentId: this.parentCompany?.id.toString(),
      });
      this.companyForm.get('parentId')?.disable();
    }
  }

  populateCompanyPayload() {
    const formValues = this.companyForm.getRawValue();
    const payload = {} as CreateCompanyPayload;
    payload['enName'] = formValues.enName;
    payload['arName'] = formValues.arName;

    // TODO: Remove 'key' when FE task for image upload is completed (task assigned, not yet started)
    if (isDevEnvironment()) {
      payload['key'] = 'tempKey'; // Temporary key as backend requires it for image upload (development only)
    }
    if (formValues.parentId) payload['parentId'] = +formValues.parentId;
    return payload;
  }

  getAttachmentPayload(attachments: IAttachmentControlUploadedValue[]): string {
    return attachments.length > 0
      ? attachments[0].key
      : this.companyDetails()?.attachments[0]?.key || '';
  }

  onAddCompany() {
    this.loading.set(true);
    return this.companyService
      .uploadCompanyLogo(this.companyForm.value.logo ?? [])
      .pipe(
        switchMap((attachments) => {
          const payload: CreateCompanyPayload = this.populateCompanyPayload();
          return this.schoolStructure.createCompany({
            ...payload,
            key: this.getAttachmentPayload(attachments),
          });
        }),
      )
      .subscribe({
        next: (_res) => {
          this.loading.set(false);
          this.modalCtrl.dismiss(null, 'confirm');

          this.toastr.success(
            this.translocoService.translate(
              this.isSubCompany
                ? 'global.sub_company_added_successfully.txt'
                : 'global.company_added_successfuly.txt',
            ),
          );
        },
        error: (err) => {
          this.loading.set(false);
          if (err.error.messageRef === 'api.error.company.already.exists') {
            this.companyForm.get('name')?.setErrors({ uniqueNameError: true });
          } else {
            this.toastr.showBackendError(err);
          }
        },
      });
  }

  onEditCompany() {
    this.loading.set(true);
    return this.companyService
      .uploadCompanyLogo(this.companyForm.value.logo ?? [])
      .pipe(
        switchMap((attachments) => {
          const payload: CreateCompanyPayload = this.populateCompanyPayload();
          return this.schoolStructure.updateCompany(
            this.companyDetails()!.id.toString(),
            { ...payload, key: this.getAttachmentPayload(attachments) },
          );
        }),
      )
      .subscribe({
        next: (_res) => {
          this.loading.set(false);
          this.modalCtrl.dismiss(null, 'confirm');
          this.toastr.success(
            this.translocoService.translate(
              this.isSubCompany
                ? 'global.update_sub_company_successfully.txt'
                : 'global.update_company_successfully.txt',
            ),
          );
        },
        error: (err) => {
          if (err.status === 422) {
            this.companyForm.get('name')?.setErrors({ uniqueNameError: true });
          } else {
            this.toastr.showBackendError(err);
          }
        },
      });
  }

  closeModal() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
  get isLogoValid() {
    return this.companyForm.controls.logo.value.length > 0 || !!this.logo();
  }
}
