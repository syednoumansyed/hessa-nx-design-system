import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { PersonnelRequest, PersonnelService } from '../personnel.service';
import { enumArrayFromEnum, Gender, UserType } from '@shared/enums';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateToUnix, formatDateToUnixMidnight } from '@utils/date';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { markInvalidFormControlsAsDirty } from '@utils/forms';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import {
  nationalIdMax10Validator,
  nationalIdMax18Validator,
  SaudiNationalityId,
} from '@validators/nationalID';
import { mapToSelectValue } from '@shared/utils/map-to-select';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import {
  NationalIdValidatorLengthType,
  NationalIdValidatorService,
} from '@pages/user-management/validators/national-id.validator';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ToastrService } from 'ngx-toastr';
import { HesSchoolStructureControlComponent } from '@ui-kit/hes-school-structure-control/hes-school-structure-control.component';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { mapAssociationToFormControlValue } from '../utils/map-association-to-form-control-value.util';
import { StructureDepth } from '@shared/utils/school-structure';
import { of, switchMap } from 'rxjs';
import { getSchoolStructureControlValueToRest } from '@shared/utils/get-school-structure-control-value-to-rest.util';

import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CanFormComponentDeactivate } from '@shared/guards/form-can-deactivate.guard';
import { Subscription } from 'rxjs';
import {
  FullNameValidators,
  OptionalFullNameValidators,
} from '@shared/utils/full-name.validator';
import { setupMutualFullNameValidators } from '@shared/utils/mutual-full-name.util';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { FaIconComponentsProps } from '@shared/types';
import { faCircleInfo, faTrashCan } from '@fortawesome/pro-light-svg-icons';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { Personnel } from '@shared/dto-transformation';

@Component({
  selector: 'app-add-personnel',
  templateUrl: './personnel-form.page.html',
  standalone: true,
  imports: [
    IonContent,
    HesButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesSchoolStructureControlComponent,
  ],
})
export class PersonnelFormPage
  implements OnInit, CanFormComponentDeactivate, OnDestroy
{
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  /**
   * Indicates whether the page is in edit mode or not.
   */
  isEditPage = signal(false);
  /**
   * The ID of the personnel fetched from route params.
   */
  @Input() id: string | null = null;

  nationalIdValidators = [Validators.required, nationalIdMax10Validator];
  private readonly nationalIdValidatorService = inject(
    NationalIdValidatorService,
  );
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly toastr = inject(ToastrService);
  private personnelDetail: Personnel;
  private readonly nationIdExistForTypeMsg = signal<string>('');
  private readonly toasterService = inject(HesToasterService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  rolesList = signal<Array<ISelectValue>>([]);
  private readonly nationalIdErrorMsg = signal<string>('');
  private readonly hasNationalIdPermission =
    this.rbac.hasNationalIdPermission();
  private isFormChangeForEdit = false;
  associateSchoolControl = new FormControl<SchoolStructureControlValue[]>([]);
  depth = StructureDepth.SCHOOL;
  readonly hasSchoolStructurePermission = this.rbac.hasPermission(
    RESOURCE_PERMISSION.personnel.associateSchoolStructure,
  );
  fullNameValidators = OptionalFullNameValidators; // start optional; mutual validator will toggle required
  private enFullNameRequired = signal(true);
  private arFullNameRequired = signal(true);
  private destroyNameValidators: (() => void) | null = null;
  // initialize form here to use typed forms
  personnelForm = this.fb.group({
    nationalId: this.nonNullablefb.control<number | null>(
      null,
      this.nationalIdValidators,
      [
        this.nationalIdValidatorService.createValidator(
          UserType.PERSONNEL,
          this.nationIdExistForTypeMsg,
        ),
      ],
    ),
    nationalityId: this.nonNullablefb.control<number | null>(null, [
      Validators.required,
    ]),
    roleIds: this.nonNullablefb.control<number[]>([], [Validators.required]),
    arFullName: this.nonNullablefb.control('', this.fullNameValidators),
    enFullName: this.nonNullablefb.control('', this.fullNameValidators),
    phoneNumber: this.nonNullablefb.control('', Validators.required),
    gender: this.nonNullablefb.control<Gender>(
      Gender.MALE,
      Validators.required,
    ),
    email: this.nonNullablefb.control('', [
      Validators.required,
      Validators.email,
    ]),
    employeeId: this.nonNullablefb.control('', Validators.required),
    passportNumber: [''],
    passportExpiryDate: this.fb.control<Date | string | null>(null),
    dateOfBirth: this.fb.control<Date | string | null>(null),
    startDate: this.fb.control<Date | string | null>(null),
  });

  personnelDetailsFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translocoService.translate('global.nationality.label'),
        placeholder: this.translocoService.translate(
          'global.select_nationality.dropdown',
        ),
        type: 'searchable-select',
        selectValues: this.nationalitiesApiService.nationalitiesList(),
        formControlName: 'nationalityId',
        required: true,
      },
      {
        label: this.translocoService.translate('global.national_id.label'),
        placeholder: this.translocoService.translate(
          'global.enter_national_id.placeholder',
        ),
        type: 'input',
        inputType: 'number',
        formControlName: 'nationalId',
        required: true,
        errorMessage: {
          pattern: this.nationalIdErrorMsg(),
          existForSameType: this.translocoService.translate(
            'global.national_id_linked_to_another_personnel.txt',
          ),
        },
        helperText: this.nationIdExistForTypeMsg(),
      },
      {
        label: this.translocoService.translate('global.employee_id.label'),
        placeholder: this.translocoService.translate(
          'global.employee_id.placeholder',
        ),
        type: 'input',
        formControlName: 'employeeId',
        required: true,
      },
      {
        label: this.translocoService.translate('global.phone_number.label'),
        placeholder: this.translocoService.translate(
          'global.phone_number.placeholder',
        ),
        type: 'input',
        formControlName: 'phoneNumber',
        required: true,
        inputType: 'tel',
        readonly: !this.rbac.hasPermission(
          RESOURCE_PERMISSION.personnel.editPersonnelProfile,
        ),
        maxLength: 9,
      },
      {
        label: this.translocoService.translate('global.email.label'),
        placeholder: this.translocoService.translate(
          'global.email.placeholder',
        ),
        type: 'input',
        inputType: 'email',
        formControlName: 'email',
        required: true,
      },
      {
        label: this.translocoService.translate('global.role.title'),
        placeholder: this.translocoService.translate(
          'global.select_role.placeholder',
        ),
        type: 'searchable-select',
        selectValues: this.rolesList(),
        formControlName: 'roleIds',
        required: true,
        isMultiple: true,
      },
      {
        label: this.translocoService.translate(
          'user_management.full_name_en.label',
        ),
        placeholder: this.translocoService.translate(
          'global.full_name.placeholder',
        ),
        type: 'input',
        formControlName: 'enFullName',
        required: this.enFullNameRequired(),
      },
      {
        label: this.translocoService.translate(
          'user_management.full_name_ar.label',
        ),
        placeholder: this.translocoService.translate(
          'global.full_name.placeholder',
        ),
        type: 'input',
        formControlName: 'arFullName',
        required: this.arFullNameRequired(),
      },
      {
        label: this.translocoService.translate('global.gender.label'),
        placeholder: this.translocoService.translate(
          'global.gender.placeholder',
        ),
        type: 'radio',
        formControlName: 'gender',
        selectValues: enumArrayFromEnum(Gender).map((e) => ({
          displayedValue: this.translocoService.translate(e as string),
          value: e,
        })) as ISelectValue[],
        required: true,
      },
    ];
  });

  additionalInformationFormConfig = computed<IControl[]>(() => {
    const controls: IControl[] = [
      {
        label: this.translocoService.translate('global.passport_number.label'),
        placeholder: this.translocoService.translate(
          'global.passport_number.placeholder',
        ),
        type: 'input',
        formControlName: 'passportNumber',
        required: false,
      },
      {
        label: this.translocoService.translate(
          'global.passport_expiry_date.label',
        ),
        placeholder: this.translocoService.translate(
          'global.passport_expiry_date.placeholder',
        ),
        type: 'date',
        formControlName: 'passportExpiryDate',
        required: false,
      },
      {
        label: this.translocoService.translate('global.date_of_birth.label'),
        placeholder: this.translocoService.translate(
          'global.date_of_birth.placeholder',
        ),
        type: 'date',
        formControlName: 'dateOfBirth',
        required: false,
        datePickerConfig: {
          max: TuiDay.currentLocal(),
        },
      },
      {
        label: this.translocoService.translate(
          'global.select_start_date.placeholder',
        ),
        placeholder: this.translocoService.translate(
          'global.select_start_date.placeholder',
        ),
        type: 'date',
        formControlName: 'startDate',
        required: false,
      },
    ];
    return controls;
  });

  private readonly subscription = new Subscription();
  private isComeFromProfile = false;
  readonly infoIcon: FaIconComponentsProps = {
    icon: faCircleInfo,
    size: 'lg',
  };
  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private personnelService: PersonnelService,
    private router: Router,
    private translocoService: TranslocoService,
    private feedbackService: FeedbackService,
    private rolesApiService: RoleApiService,
    private route: ActivatedRoute,
  ) {}

  /**
   * Initializes the component and its dependencies.
   * - Retrieves the personnel ID from the route parameters.
   * - Determines if the page is in edit mode based on the presence of a personnel ID.
   * - Fetches translations programmatically.
   * - Sets up the personnel details form configuration.
   * - Updates national ID validators if in edit mode.
   * - Retrieves personnel details if in edit mode.
   */
  ngOnInit() {
    this.isComeFromProfile =
      this.router.getCurrentNavigation()?.extras.state?.['origin'] ===
      'profile';
    this.isEditPage.set(!!this.id);

    // Disable nationalId by default
    this.personnelForm.controls.nationalId.disable({ emitEvent: false });

    // Handle nationalId changes
    this.handleNationalIdChange();

    if (this.isEditPage()) {
      this.getPersonnelDetails();
    }
    this.rolesApiService.fetchRoles({ itemsPerPage: 100 }).subscribe((resp) => {
      const roles = resp.data.filter((role) => role.assignable);
      this.rolesList.set(mapToSelectValue(roles));
    });
    if (this.id) {
      this.personnelService
        .getAssociatePersonnel(this.id)
        .subscribe((association) => {
          this.associateSchoolControl.setValue(
            mapAssociationToFormControlValue(association),
          );
        });
    }
    this.nationalitiesApiService.populateNationalitiesList().subscribe();

    // Mutual full name requirement setup
    const { destroy } = setupMutualFullNameValidators(
      this.personnelForm.controls.enFullName,
      this.personnelForm.controls.arFullName,
      this.enFullNameRequired,
      this.arFullNameRequired,
    );
    this.destroyNameValidators = destroy;
  }

  private handleNationalIdChange() {
    const nationalIdCtrl = this.personnelForm.controls.nationalId;
    const nationalityCtrl = this.personnelForm.controls.nationalityId;

    this.subscription.add(
      nationalityCtrl.valueChanges.subscribe((nationalityId) => {
        if (nationalityId) {
          nationalIdCtrl.enable({ emitEvent: false });
        } else {
          nationalIdCtrl.disable({ emitEvent: false });
        }

        const isSaudi = nationalityId === SaudiNationalityId;

        const syncValidators = isSaudi
          ? [Validators.required, nationalIdMax10Validator]
          : this.hasNationalIdPermission
            ? [Validators.required, nationalIdMax18Validator]
            : [Validators.required, nationalIdMax10Validator];

        const updateId = this.isEditPage()
          ? this.personnelDetail?.nationalId
          : undefined;

        const asyncValidators = isSaudi
          ? [
              this.nationalIdValidatorService.createValidator(
                UserType.PERSONNEL,
                this.nationIdExistForTypeMsg,
                updateId,
                NationalIdValidatorLengthType.SAUDI,
              ),
            ]
          : this.hasNationalIdPermission
            ? [
                this.nationalIdValidatorService.createValidator(
                  UserType.PERSONNEL,
                  this.nationIdExistForTypeMsg,
                  updateId,
                  NationalIdValidatorLengthType.OTHER,
                ),
              ]
            : [
                this.nationalIdValidatorService.createValidator(
                  UserType.PERSONNEL,
                  this.nationIdExistForTypeMsg,
                  updateId,
                  NationalIdValidatorLengthType.SAUDI,
                ),
              ];

        // Set error message
        this.nationalIdErrorMsg.set(
          this.translocoService.translate(
            isSaudi
              ? 'global.national_id_length_error.txt'
              : this.hasNationalIdPermission
                ? 'global.national_id_max_length_18_error.txt'
                : 'global.national_id_length_error.txt',
          ),
        );

        nationalIdCtrl.setValidators(syncValidators);
        nationalIdCtrl.setAsyncValidators([]);

        nationalIdCtrl.updateValueAndValidity({
          emitEvent: true,
          onlySelf: true,
        });

        nationalIdCtrl.markAsTouched();
        nationalIdCtrl.markAsDirty();

        nationalIdCtrl.setAsyncValidators(asyncValidators);

        setTimeout(() => {
          nationalIdCtrl.updateValueAndValidity({
            emitEvent: true,
            onlySelf: true,
          });
        }, 0);
      }),
    );
  }

  /**
   * Updates the validators for the national ID control in the student form.
   * It sets an async validator to check if the national ID is unique among other students and passes the current student id to exclude from the check.
   *
   * @returns void
   */
  private updatenationalIdValidators(nationalId: string) {
    this.personnelForm.controls.nationalId.setAsyncValidators([
      this.nationalIdValidatorService.createValidator(
        UserType.PERSONNEL,
        this.nationIdExistForTypeMsg,
        nationalId,
      ),
    ]);
    this.personnelForm.controls.nationalId.updateValueAndValidity();
  }
  /**
   * Retrieves the details of a personnel from the personnel service and updates the personnel form with the retrieved data.
   */
  private getPersonnelDetails() {
    this.personnelService.getPersonnel(+this.id!).subscribe((personnel) => {
      if (this.personnelForm) {
        this.personnelForm.patchValue({
          nationalId: +personnel.nationalId,
          nationalityId: personnel.nationalityId,
          email: personnel.email,
          employeeId: personnel.employeeIdentifier,
          arFullName: personnel.arFullName,
          enFullName: personnel.enFullName,
          phoneNumber: personnel.phoneNumber,
          roleIds: personnel.roles.map(({ id }) => id),
          gender: personnel.gender as Gender,
          passportNumber: personnel.passportNumber,
          passportExpiryDate: personnel.passportExpiryDate
            ? new Date(personnel.passportExpiryDate)
            : null,
          dateOfBirth: personnel.dateOfBirth
            ? new Date(personnel.dateOfBirth)
            : null,
          startDate: personnel.startDate ? new Date(personnel.startDate) : null,
        });

        this.updatenationalIdValidators(personnel.nationalId);
        markInvalidFormControlsAsDirty(this.personnelForm);
        this.personnelDetail = personnel;
      }
      this.subscription.add(
        this.personnelForm.valueChanges.subscribe(() => {
          this.isFormChangeForEdit = true;
        }),
      );

      if (personnel.nationalId) {
        this.personnelForm.controls.nationalId.setValue(
          Number(personnel.nationalId),
        );
      }

      // Disable nationalId if no permission after patching the form
      if (
        !this.hasNationalIdPermission &&
        personnel.nationalityId !== SaudiNationalityId
      ) {
        this.personnelForm.controls.nationalId.disable({ emitEvent: false });
      }
    });
  }

  /**
   * Populates the personnel payload based on the values from the personnel form.
   * @returns The populated personnel payload.
   */
  private populatePersonnelPayload() {
    const formVal = this.personnelForm.getRawValue();
    const personnelPayload: PersonnelRequest = {
      nationalId: formVal.nationalId?.toString() ?? '',
      nationalityId: formVal.nationalityId!,
      email: formVal.email,
      employeeId: formVal.employeeId,

      arFullName: formVal.arFullName,
      enFullName: formVal.enFullName,
      countryCode: '+966',
      phoneNumber: formVal.phoneNumber ?? '',

      gender: formVal.gender,
      roleIds: formVal.roleIds,

      ...(formVal.passportNumber && {
        passportNumber: formVal.passportNumber,
      }),
      ...(formVal.passportExpiryDate && {
        passportExpiryDate: formatDateToUnixMidnight(
          (formVal.passportExpiryDate as Date).toISOString(),
        ),
      }),

      ...(formVal.dateOfBirth && {
        dateOfBirth: formatDateToUnixMidnight(
          (formVal.dateOfBirth as Date).toISOString(),
        ),
      }),
      ...(formVal.startDate && {
        startDate: formatDateToUnix((formVal.startDate as Date).toISOString()),
      }),
    };
    return personnelPayload;
  }

  /**
   * Adds a new personnel to the system.
   */
  addPersonnel() {
    let personnelPayload: PersonnelRequest = this.populatePersonnelPayload();
    this.personnelService
      .createPersonnel(personnelPayload)
      .pipe(
        switchMap((resp) => {
          if (this.hasSchoolStructurePermission) {
            return this.personnelService.associatePersonnelWithSchoolsStructure(
              resp.id,
              getSchoolStructureControlValueToRest(
                this.associateSchoolControl.value!,
              ),
            );
          }
          return of(null);
        }),
      )
      .subscribe({
        next: async () => {
          this.toasterService.success(
            '',
            this.translocoService.translate(
              'user_management.personnel_added_successfully.title',
            ),
          );
          await this.onAddPersonnelSuccess();
          this.personnelForm.reset();
          this.associateSchoolControl.reset();
        },
        error: async (error) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  /**
   * Updates a personnel's information.
   */
  updatePersonnel() {
    if (this.id && this.isEditPage()) {
      let personnelPayload: PersonnelRequest = this.populatePersonnelPayload();
      this.personnelService
        .updatePersonnel(this.id, personnelPayload)
        .pipe(
          switchMap(() => {
            if (this.hasSchoolStructurePermission) {
              return this.personnelService.associatePersonnelWithSchoolsStructure(
                this.id!,
                getSchoolStructureControlValueToRest(
                  this.associateSchoolControl.value!,
                ),
              );
            }
            return of(null);
          }),
        )
        .subscribe({
          next: () => {
            this.toastr.success(
              '',
              this.translocoService.translate(
                'user_management.successfully_updating_account.txt',
              ),
            );
            this.isFormChangeForEdit = false;
            this.goBackToParent(true);
          },
          error: (error) => {
            this.toasterService.showBackendError(error);
          },
        });
    }
  }

  /* feedback modal methods */
  async onAddPersonnelSuccess() {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'success',
        modalTitle: this.translocoService.translate(
          'user_management.personnel_added_successfully.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.personnel_added_successfully.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'user_management.add_other_personnel.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.back_to_home.btn',
        ),
      },
      () => this.addAnotherPersonnel(),
      () => {
        this.personnelForm.markAsPristine();
        this.goBackToParent(true);
      },
      false,
    );
  }

  /**
   * Navigates to the home page of the user management section.
   */
  goBackToParent(modified = false) {
    const extras: any = { relativeTo: this.route };
    if (modified) {
      extras.state = { modified: true };
    }
    if (this.isComeFromProfile || !this.isEditPage()) {
      this.router.navigate(['..'], extras);
      return;
    }
    this.router.navigate(['../..'], extras);
  }

  /**
   * Clears the personnel form and closes the modal.
   */
  addAnotherPersonnel() {
    this.personnelForm.reset();
    // location.reload();
  }

  isUnsavedChanges() {
    if (this.isEditPage()) {
      return this.isFormChangeForEdit;
    }
    return this.personnelForm.dirty;
  }

  onCancelClick() {
    this.goBackToParent();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.destroyNameValidators) this.destroyNameValidators();
  }
}
