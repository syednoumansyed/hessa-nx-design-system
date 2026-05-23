import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { studentForm } from '@pages/user-management/students/types';
import {
  NationalIdValidatorLengthType,
  NationalIdValidatorService,
} from '@pages/user-management/validators/national-id.validator';
import {
  StudentRelationship,
  UserType,
  dropdownArrayFromEnum,
  enumArrayFromEnum,
  Gender,
} from '@shared/enums';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { skip, Subscription } from 'rxjs';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { Validators } from '@angular/forms';
import { setupMutualFullNameValidators } from '@shared/utils/mutual-full-name.util';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  nationalIdMax10Validator,
  nationalIdMax18Validator,
  SaudiNationalityId,
} from '@validators/nationalID';

@Component({
  selector: 'app-student-in-guardian-form',
  templateUrl: './student-in-guardian-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HesButtonModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
  ],
  providers: [SchoolStructureListingService],
})
export class StudentInGuardianFormComponent implements OnInit {
  @Input() form: studentForm;
  @Output() removedClick = new EventEmitter();
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly translocoService = inject(TranslocoService);
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly nationalIdValidatorService = inject(
    NationalIdValidatorService,
  );
  private readonly nationIdExistForTypeMsg = signal<string>('');
  private readonly isLevelRequired = signal<boolean>(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hasNationalIdPermission =
    this.rbac.hasNationalIdPermission();
  private readonly nationalIdErrorMsg = signal<string>('');
  private readonly subscription = new Subscription();
  // Mutual full name required signals
  private enFullNameRequired = signal(true);
  private arFullNameRequired = signal(true);
  private destroyNameValidators: (() => void) | null = null;

  constructor(
    private schoolStructureScopeService: SchoolStructureScopeService,
    private schoolStructureListingService: SchoolStructureListingService,
  ) {
    this.nationalitiesApiService
      .populateNationalitiesList()
      .pipe(takeUntilDestroyed())
      .subscribe();
    toObservable(this.schoolStructureScopeService.selectedSchoolStructureItem)
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(() => {
        this.schoolStructureListingService.reset();
        this.form.reset({
          company:
            this.schoolStructureListingService.selectedCompany()?.id ?? null,
          campus:
            this.schoolStructureListingService.selectedCampus()?.id ?? null,
          schoolId:
            this.schoolStructureListingService.selectedSchool()?.id ?? null,
        });
      });
  }

  ngOnInit() {
    // this.form.controls.nationalId.setAsyncValidators(
    //   this.nationalIdValidatorService.createValidator(
    //     UserType.STUDENT,
    //     this.nationIdExistForTypeMsg,
    //   ),
    // );
    this.form.controls.nationalId.updateValueAndValidity();
    this.handleLevelRequirementBasedOnSchool();

    // reset nationalityId
    this.form.controls.nationalityId.setValue(null);
    // Disable nationalId by default
    this.form.controls.nationalId.disable({ emitEvent: false });

    // Handle nationalId changes
    this.handleNationalIdChange();

    // Initialize mutual full name validators (assumes form already has controls)
    const { destroy } = setupMutualFullNameValidators(
      this.form.controls.enFullName,
      this.form.controls.arFullName,
      this.enFullNameRequired,
      this.arFullNameRequired,
    );
    this.destroyNameValidators = destroy;
  }
  ngOnDestroy() {
    if (this.destroyNameValidators) this.destroyNameValidators();
    this.subscription.unsubscribe();
  }
  removeStudent() {
    this.removedClick.emit();
  }
  newStudentFormConfig = computed<IControl[]>(() => {
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
            'global.id_linked.txt',
          ),
        },
        helperText: this.nationIdExistForTypeMsg(),
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
        label: this.translocoService.translate('global.phone_number.label'),
        placeholder: this.translocoService.translate(
          'global.phone_number.placeholder',
        ),
        type: 'input',
        formControlName: 'phoneNumber',
        required: false,
        inputType: 'tel',
        maxLength: 10,
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
      {
        label: this.translocoService.translate(
          'global.pioneers_student_id.title',
        ),
        type: 'input',
        formControlName: 'pioneerStudentId',
        required: false,
      },
      {
        label: this.translocoService.translate('global.passport_number.label'),
        placeholder: this.translocoService.translate(
          'global.enter_passport_number.placeholder',
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
        required: true,
      },
      {
        label: this.translocoService.translate(
          'global.registration_date.label',
        ),
        placeholder: this.translocoService.translate(
          'global.registration_date.placeholder',
        ),
        type: 'date',
        formControlName: 'registrationDate',
        required: true,
      },
      {
        label: this.translocoService.translate('global.company.label'),
        placeholder: this.translocoService.translate(
          'global.select_company.dropdown',
        ),
        formControlName: 'company',
        type: 'searchable-select',
        required: false,
        SchoolStructureListingType: 'company',
      },
      {
        label: this.translocoService.translate('global.campus.label'),
        placeholder: this.translocoService.translate(
          'global.select_campus.dropdown',
        ),
        formControlName: 'campus',
        type: 'searchable-select',
        required: false,
        SchoolStructureListingType: 'campus',
      },
      {
        label: this.translocoService.translate('global.school.label'),
        placeholder: this.translocoService.translate(
          'global.school.placeholder',
        ),
        formControlName: 'schoolId',
        type: 'searchable-select',
        required: false,
        SchoolStructureListingType: 'school',
      },
      {
        label: this.translocoService.translate('global.level.label'),
        placeholder: this.translocoService.translate(
          'global.level.placeholder',
        ),
        formControlName: 'levelId',
        type: 'searchable-select',
        required: this.isLevelRequired(),
        SchoolStructureListingType: 'level',
      },
      {
        label: this.translocoService.translate('global.class.label'),
        placeholder: this.translocoService.translate(
          'global.class.placeholder',
        ),
        type: 'searchable-select',
        formControlName: 'classId',
        required: false,
        SchoolStructureListingType: 'class',
      },
      {
        label: this.translocoService.translate('global.relationship.label'),
        placeholder: this.translocoService.translate(
          'global.select_the_relation.dropdown',
        ),
        type: 'searchable-select',
        selectValues: dropdownArrayFromEnum(StudentRelationship), // Add the values for the select options here
        formControlName: 'relationship',
        required: true,
        isEnumTranslate: true,
      },
    ];
  });

  private handleNationalIdChange() {
    const nationalIdCtrl = this.form.controls.nationalId;
    const nationalityCtrl = this.form.controls.nationalityId;

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

        const updateId = undefined;

        const asyncValidators = isSaudi
          ? [
              this.nationalIdValidatorService.createValidator(
                UserType.STUDENT,
                this.nationIdExistForTypeMsg,
                updateId,
                NationalIdValidatorLengthType.SAUDI,
              ),
            ]
          : this.hasNationalIdPermission
            ? [
                this.nationalIdValidatorService.createValidator(
                  UserType.STUDENT,
                  this.nationIdExistForTypeMsg,
                  updateId,
                  NationalIdValidatorLengthType.OTHER,
                ),
              ]
            : [
                this.nationalIdValidatorService.createValidator(
                  UserType.STUDENT,
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

  private handleLevelRequirementBasedOnSchool() {
    this.form.controls.schoolId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((schoolId) => {
        const levelControl = this.form.controls.levelId;
        if (schoolId) {
          levelControl.setValidators(Validators.required);
          this.isLevelRequired.set(true);
        } else {
          this.isLevelRequired.set(false);
          levelControl.removeValidators(Validators.required);
        }
        levelControl.updateValueAndValidity();
      });
  }
}
