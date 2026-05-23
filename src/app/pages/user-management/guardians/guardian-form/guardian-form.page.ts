import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import {
  Gender,
  StudentRelationship,
  UserType,
  dropdownArrayFromEnum,
  enumArrayFromEnum,
} from '@shared/enums';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateToUnixMidnight } from '@utils/date';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { guardianRelationshipForm, studentForm } from '../../students/types';
import { markInvalidFormControlsAsDirty } from '@utils/forms';
import { faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import {
  GuardianRequest,
  GuardianService,
} from '@pages/user-management/guardians/guardians.service';
import {
  nationalIdMax10Validator,
  nationalIdMax18Validator,
} from '@validators/nationalID';
import {
  NationalIdValidatorLengthType,
  NationalIdValidatorService,
} from '@pages/user-management/validators/national-id.validator';
import { StudentInGuardianFormComponent } from '../components/guardian-student-form/student-in-guardian-form.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { Subscription, startWith } from 'rxjs';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CanFormComponentDeactivate } from '../../../../shared/guards/form-can-deactivate.guard';
import {
  FullNameValidators,
  OptionalFullNameValidators,
} from '@shared/utils/full-name.validator';
import { setupMutualFullNameValidators } from '@shared/utils/mutual-full-name.util';
import { cleanObject } from '@shared/utils/clean-object.util';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Component({
  selector: 'app-add-guardian',
  templateUrl: './guardian-form.page.html',
  standalone: true,
  imports: [
    IonContent,
    HesButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    StudentInGuardianFormComponent,
  ],
  providers: [SchoolStructureListingService],
})
export class GurdianFormPage
  implements OnInit, AfterContentChecked, CanFormComponentDeactivate, OnDestroy
{
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  /**
   * Indicates whether the page is in edit mode or not.
   */
  isEditPage = signal(false);
  /**
   * The ID of the guardian fetched from route params.
   */
  @Input() id: string | null = null;

  private readonly nationalIdValidatorService = inject(
    NationalIdValidatorService,
  );
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly toastr = inject(HesToasterService);
  private location = inject(Location);
  private readonly nationIdExistForTypeMsg = signal<string>('');
  private readonly hasNationalIdPermission =
    this.rbac.hasNationalIdPermission();
  private isFormChangeForEdit = false;
  nationalIdValidators = [
    Validators.required,
    this.hasNationalIdPermission
      ? nationalIdMax18Validator
      : nationalIdMax10Validator,
  ];
  // Start with optional validators; mutual util will toggle required dynamically
  fullNameValidators = OptionalFullNameValidators;
  private enFullNameRequired = signal(true);
  private arFullNameRequired = signal(true);
  private destroyNameValidators: (() => void) | null = null;
  // initialize form here to use typed forms
  guardianForm = this.fb.group({
    nationalId: this.nonNullablefb.control<number | null>(
      null,
      this.nationalIdValidators,
      [
        this.nationalIdValidatorService.createValidator(
          UserType.GUARDIAN,
          this.nationIdExistForTypeMsg,
          undefined,
          this.hasNationalIdPermission
            ? NationalIdValidatorLengthType.OTHER
            : NationalIdValidatorLengthType.SAUDI,
        ),
      ],
    ),
    arFullName: this.nonNullablefb.control('', this.fullNameValidators),
    enFullName: this.nonNullablefb.control('', this.fullNameValidators),
    phoneNumber: this.nonNullablefb.control('', Validators.required),
    gender: this.nonNullablefb.control<Gender>(
      Gender.MALE,
      Validators.required,
    ),
    relationships: this.nonNullablefb.array(
      [
        this.fb.group({
          id: this.fb.control<number | null>(null, Validators.required),
          relationship: this.fb.control<StudentRelationship | null>(
            null,
            Validators.required,
          ),
        }),
      ],
      [Validators.required, Validators.minLength(1)],
    ),
    students: this.fb.array<studentForm>([]),
  });

  initSelection = signal<any[]>([]);

  relationshipsFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translocoService.translate('global.select_student.label'),
        placeholder: this.translocoService.translate(
          'global.select_student.label',
        ),
        type: 'searchable-select',
        selectValues: this.guardianService.studentsDropdown(),
        initSelectValues: this.initSelection(),
        formControlName: 'id',
        required: true,
        onValueChange: this.onStudentChange,
        searchableSelectObject: {
          pagination: this.guardianService.studentsPagination(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.guardianService.getActiveOrPausedStudents(
              {
                pageNumber:
                  this.guardianService.studentsPagination()?.pageNumber! + 1,
              },
              true,
              ev,
            );
          },
          onSearchChanged: (value: string) => {
            if (value) this.guardianService.updateStudentsListSearchText(value);
            else this.guardianService.updateStudentsListSearchText(undefined);
            this.guardianService.getActiveOrPausedStudents();
          },
        },
      },
      {
        label: this.translocoService.translate('global.relationship.label'),
        placeholder: this.translocoService.translate(
          'global.select_the_relation.dropdown',
        ),
        type: 'searchable-select',
        isEnumTranslate: true,
        selectValues: dropdownArrayFromEnum(StudentRelationship),
        formControlName: 'relationship',
        required: true,
      },
    ];
  });

  guardianDetailsFormConfig = computed<IControl[]>(() => {
    return [
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
          pattern: this.translocoService.translate(
            this.hasNationalIdPermission
              ? 'global.national_id_max_length_18_error.txt'
              : 'global.national_id_length_error.txt',
          ),
          existForSameType: this.translocoService.translate(
            'global.national_id_linked_to_another_guardian.txt',
          ),
        },
        helperText: this.nationIdExistForTypeMsg(),
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
          RESOURCE_PERMISSION.guardians.updateGuardainsProfile,
        ),
        maxLength: 9,
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
          displayedValue: this.translocoService.translate(
            ('enum.' + e) as string,
          ),
          value: e,
        })) as ISelectValue[],
        required: true,
      },
    ];
  });

  selectedSchoolStructureItem =
    this.schoolScopeService.selectedSchoolStructureItem;

  private readonly subscription = new Subscription();
  private isComeFromProfile = false;
  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private guardianService: GuardianService,
    private schoolScopeService: SchoolStructureScopeService,
    private router: Router,
    private translocoService: TranslocoService,
    private feedbackService: FeedbackService,
    private cdref: ChangeDetectorRef,
    private academicYearsScopeService: AcademicYearsScopeService,
    private route: ActivatedRoute,
    private schoolStructureListingService: SchoolStructureListingService,
  ) {}

  /**
   * Initializes the component and its dependencies.
   * - Retrieves the guardian ID from the route parameters.
   * - Determines if the page is in edit mode based on the presence of a guardian ID.
   * - Fetches translations programmatically.
   * - Sets up the guardian details form configuration.
   * - Updates national ID validators if in edit mode.
   * - Retrieves guardian details if in edit mode.
   * - Adds relationship and guardians controls if not in edit mode.
   * - Sets up school control dependencies.
   */
  ngOnInit() {
    this.isComeFromProfile =
      this.router.getCurrentNavigation()?.extras.state?.['origin'] ===
      'profile';
    this.isEditPage.set(!!this.id);
    this.guardianService.getActiveOrPausedStudents();
    // Mutual full name requirement setup
    const { destroy } = setupMutualFullNameValidators(
      this.guardianForm.controls.enFullName,
      this.guardianForm.controls.arFullName,
      this.enFullNameRequired,
      this.arFullNameRequired,
    );
    this.destroyNameValidators = destroy;
    if (this.isEditPage()) {
      this.getGuardianDetails();
    }
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  /**
   * Updates the validators for the national ID control in the student form.
   * It sets an async validator to check if the national ID is unique among other students and passes the current student id to exclude from the check.
   *
   * @returns void
   */
  private updatenationalIdValidators(nationalId: string) {
    this.guardianForm.controls.nationalId.setAsyncValidators([
      this.nationalIdValidatorService.createValidator(
        UserType.GUARDIAN,
        this.nationIdExistForTypeMsg,
        nationalId,
      ),
    ]);
    this.guardianForm.controls.nationalId.updateValueAndValidity();
  }

  /**
   * Retrieves the details of a guardian from the guardian service and updates the guardian form with the retrieved data.
   */
  private getGuardianDetails() {
    this.guardianService.getGuardian(+this.id!).subscribe((guardian) => {
      this.removeRelationship(0);
      this.guardianForm.patchValue({
        nationalId: +guardian.nationalId,
        arFullName: guardian.arFullName,
        enFullName: guardian.enFullName,
        phoneNumber: guardian.phoneNumber,
        gender: guardian.gender as Gender,
      });
      guardian.students?.map((stu, index) => {
        this.addRelationship();
        let data = {
          id: stu.id,
          relationship: stu.studentRelationship,
        };
        this.relationshipsControls.controls
          .at(index)
          ?.setValue(data, { emitEvent: false });
      });
      this.initSelection.set(
        guardian?.students?.map((student) => {
          return {
            value: student.id,
            displayedValue: student.displayName,
          };
        }) ?? [],
      );
      this.updatenationalIdValidators(guardian.nationalId);
      markInvalidFormControlsAsDirty(this.guardianForm);
      this.subscription.add(
        this.guardianForm.valueChanges.subscribe(() => {
          this.isFormChangeForEdit = true;
        }),
      );
    });
  }

  /**
   * Sets up the control dependencies for the school form controls.
   * Disables certain controls initially and enables them based on the selected values.
   */
  private setupSchoolControlDependencies(studentForm: studentForm) {
    this.subscription.add(
      studentForm.controls.schoolId.valueChanges
        .pipe(startWith(studentForm.controls.schoolId.value))
        .subscribe((id) => {
          if (id) {
            studentForm.controls.levelId.setValue(null);
            studentForm.controls.levelId.enable({ emitEvent: false });
          } else {
            studentForm.controls.levelId.disable({ emitEvent: false });
            studentForm.controls.classId.disable({ emitEvent: false });
          }
        }),
    );
    this.subscription.add(
      studentForm.controls.levelId.valueChanges
        .pipe(startWith(studentForm.controls.levelId.value))
        .subscribe((id) => {
          if (id) {
            studentForm.controls.classId.setValue(null);
            studentForm.controls.classId.enable({ emitEvent: false });
          } else {
            studentForm.controls.classId.disable({ emitEvent: false });
          }
        }),
    );
  }

  /**
   * Populates the guardian payload based on the values from the guardian form.
   * @returns The populated guardian payload.
   */
  private populateGuardianPayload() {
    const formVal = this.guardianForm.getRawValue();
    const guardianPayload: GuardianRequest = {
      nationalId: formVal.nationalId?.toString() ?? '',
      arFullName: formVal.arFullName,
      enFullName: formVal.enFullName,
      countryCode: '+966',
      phoneNumber: formVal.phoneNumber ?? '',
      gender: formVal.gender,
      studentIdsAndRelationships:
        formVal.relationships
          ?.filter((rs) => rs.id && rs.relationship)
          ?.map((relationship) => {
            return {
              id: relationship.id!,
              studentRelationship: relationship.relationship!,
            };
          }) ?? [],
      students:
        formVal.students?.map((student) => {
          let data: any = {
            arFullName: student.arFullName,
            enFullName: student.enFullName,
            nationalId: student.nationalId?.toString(),
            studentRelationship: student.relationship!,
            countryCode: student.phoneNumber ? '+966' : null,
            phoneNumber: student.phoneNumber || null,
            gender: student.gender,
            nationalityId: student.nationalityId,
            registrationDate: formatDateToUnixMidnight(
              (student.registrationDate as Date).toISOString(),
            ),
            ...(student.schoolId && { schoolId: student.schoolId }),
            ...(student.levelId && { levelId: student.levelId }),
            ...(student.classId && {
              classId: student.classId,
              academicYearId:
                this.academicYearsScopeService.selectedAcademicYear()?.id,
            }),
          };

          if (student.passportNumber) {
            data.passportNumber = student.passportNumber;
          }
          if (student.passportExpiryDate) {
            data.passportExpiryDate = formatDateToUnixMidnight(
              (student.passportExpiryDate as Date).toISOString(),
            );
          }
          if (student.dateOfBirth) {
            data.dateOfBirth = formatDateToUnixMidnight(
              (student.dateOfBirth as Date).toISOString(),
            );
          }
          if (student.pioneerStudentId) {
            data.pioneerId = student.pioneerStudentId;
          }
          return data;
        }) || [],
    };
    return guardianPayload;
  }

  async checkSelectedAcadmicYear() {
    if (this.hasDuplicateStudents(this.relationshipsControls)) {
      const errorMsg = this.translocoService.translate(
        'user_management.duplicate_students_error.txt',
      );
      this.toastr.error(errorMsg);
      return;
    }

    if (
      !this.academicYearsScopeService.isCurrentSelectedAcademicYearActive() &&
      this.guardianForm.value.students?.length &&
      this.guardianForm.value.students?.length > 0
    ) {
      await this.feedbackService.openFeedbackModal(
        {
          type: 'warning',
          modalTitle: this.translocoService.translate('global.wrong_msg.title'),
          modalMessage: this.translocoService.translate(
            'user_management.add_student_to_previous_year.txt',
          ),
          primaryBtnStr: this.translocoService.translate(
            'user_management.proceed.btn',
          ),
          secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
        },
        () => (this.isEditPage() ? this.updateGuardian() : this.addGuardian()),
        () => {},
      );
    } else {
      this.isEditPage() ? this.updateGuardian() : this.addGuardian();
    }
  }

  /**
   * Adds a new guardian to the system.
   */
  addGuardian() {
    const studentPayload: GuardianRequest = this.populateGuardianPayload();
    this.guardianService.createGuardian(studentPayload).subscribe({
      next: async () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'user_management.guardian_added_successfully.txt',
          ),
        );
        await this.onAddGuardianSuccess();
      },
      error: async ({ error }) => {
        this.toastr.error(
          '',
          error.message ||
            this.translocoService.translate(
              'user_management.wrong_add_guardian.txt',
            ),
        );
      },
    });
  }

  /**
   * Updates a guardian's information.
   */
  updateGuardian() {
    if (this.id && this.isEditPage()) {
      const guardianPayload: GuardianRequest | any =
        this.populateGuardianPayload();
      this.guardianService.updateGuardian(this.id, guardianPayload).subscribe({
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
        error: ({ error }) => {
          this.toastr.showBackendError(error);
        },
      });
    }
  }

  /* feedback modal methods */
  async onAddGuardianSuccess() {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'success',
        modalTitle: this.translocoService.translate(
          'user_management.guardian_added_successfully.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'user_management.add_other_guardian.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.back_to_home.btn',
        ),
      },
      () => this.addAnotherGuardian(),
      () => {
        this.guardianForm.markAsPristine();
        this.goBackToParent(true);
      },
      false,
    );
  }

  /* Form Methods */
  /**
   * Returns the relationships form array control of the studentForm.
   *
   * @returns {FormArray<guardianRelationshipForm> | null} The relationships form array control.
   */
  get relationshipsControls(): FormArray<guardianRelationshipForm> {
    /* Because the returned control is of the type AbstractControl,
      you need to provide an explicit type to access the method syntax
      for the form array instance. */
    return this.guardianForm.get(
      'relationships',
    ) as FormArray<guardianRelationshipForm>;
  }

  /**
   * Adds a new relationship control to the form.
   */
  addRelationship() {
    this.relationshipsControls?.push(
      this.fb.group({
        id: this.fb.control<number | null>(null, Validators.required),
        relationship: this.fb.control<StudentRelationship | null>(
          null,
          Validators.required,
        ),
      }),
    );
  }

  /**
   * Removes a relationship at the specified index.
   *
   * @param index - The index of the relationship to remove.
   */
  removeRelationship(index: number) {
    this.relationshipsControls?.removeAt(index);
  }

  private setRelationShipsControlsValidators() {
    this.guardianForm.controls.relationships.setValidators([
      Validators.required,
      Validators.minLength(1),
    ]);
    this.guardianForm.controls.relationships.updateValueAndValidity();
    const relationshipFormGroups = this.relationshipsControls?.controls;
    relationshipFormGroups.forEach((control) => {
      control.controls.relationship.setValidators(Validators.required);
      control.controls.relationship.updateValueAndValidity();
      control.controls.id.setValidators(Validators.required);
      control.controls.id.updateValueAndValidity();
    });
  }

  private removeRelationshipsControlsValidators() {
    this.guardianForm.controls.relationships.clearValidators();
    this.guardianForm.controls.relationships.updateValueAndValidity();
    const relationshipFormGroups = this.relationshipsControls?.controls;
    relationshipFormGroups.forEach((control) => {
      control.controls.relationship.clearValidators();
      control.controls.relationship.updateValueAndValidity();
      control.controls.id.clearValidators();
      control.controls.id.updateValueAndValidity();
    });
  }

  /**
   * Returns the FormArray instance for the guardians control in the studentForm.
   *
   * @returns {FormArray<studentForm> | null} The FormArray instance for the guardians control.
   */
  get students(): FormArray<studentForm> | null {
    /* Because the returned control is of the type AbstractControl,
      you need to provide an explicit type to access the method syntax
      for the form array instance. */
    return this.guardianForm.get('students') as FormArray<studentForm>;
  }

  /**
   * Adds a new student to the list of students.
   * This function creates a new form group for the guardian
   *
   * If the list of guardians is empty before adding the new guardian, this function subscribes to the valueChanges event of the guardians form array.
   * If the guardians form array is valid, it removes the validators from the relationship controls.
   * If the students form array is not valid, it sets the validators for the relationship controls.
   */
  addStudent() {
    let studentForm = this.fb.group({
      nationalityId: this.nonNullablefb.control<number | null>(1, [
        Validators.required,
      ]),
      nationalId: this.nonNullablefb.control<number | null>(null, {
        validators: [Validators.required, nationalIdMax10Validator],
        asyncValidators: [
          this.nationalIdValidatorService.createValidator(
            UserType.STUDENT,
            this.nationIdExistForTypeMsg,
          ),
        ],
      }),
      arFullName: this.nonNullablefb.control('', this.fullNameValidators),
      enFullName: this.nonNullablefb.control('', this.fullNameValidators),
      phoneNumber: this.nonNullablefb.control(''),
      gender: this.nonNullablefb.control<Gender>(
        Gender.MALE,
        Validators.required,
      ),
      pioneerStudentId: this.fb.control<string | null>(null),
      passportNumber: this.fb.control<string | null>(null),
      passportExpiryDate: this.fb.control<Date | string | null>(null),
      dateOfBirth: this.fb.control<Date | string | null>(
        null,
        Validators.required,
      ),
      registrationDate: this.fb.control<Date | string | null>(
        null,
        Validators.required,
      ),
      company: this.fb.control<number | null>(
        this.schoolStructureListingService.selectedCompany()?.id ?? null,
      ),
      campus: this.fb.control<number | null>(
        this.schoolStructureListingService.selectedCampus()?.id ?? null,
      ),
      schoolId: this.fb.control<number | null>(
        this.schoolStructureListingService.selectedSchool()?.id ?? null,
      ),
      levelId: this.fb.control<number | null>(null),
      classId: this.fb.control<number | null>(null),
      relationship: this.fb.control<StudentRelationship | null>(
        null,
        Validators.required,
      ),
    });
    this.setupSchoolControlDependencies(studentForm);
    this.students?.push(studentForm);
    if (this.students?.length === 1) {
      this.subscription.add(
        this.students?.statusChanges.subscribe((status) => {
          if (status === 'VALID') {
            this.removeRelationshipsControlsValidators();
          } else {
            this.setRelationShipsControlsValidators();
          }
        }),
      );
    }
  }

  /**
   * Removes a student from the list of students.
   * @param index - The index of the student to remove.
   */
  removeStudent(index: number) {
    this.students?.removeAt(index);
    if (this.students?.length === 0) {
      this.setRelationShipsControlsValidators();
    }
  }

  /**
   * Handles the change event of the students selection.
   * If the selected value is -1, it resets the control and adds a new students.
   *
   * @param event - The change event object containing the selected value.
   * @param control - The form control to be reset.
   */
  onStudentChange = (event: number, control: FormControl) => {
    if (event === -1) {
      control.reset();
      this.nationalitiesApiService.getNationalitiesList().subscribe();
      this.addStudent();
    }
  };

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
   * Clears the guardian form and closes the modal.
   */
  addAnotherGuardian() {
    this.guardianForm.reset();
  }

  isUnsavedChanges() {
    if (this.isEditPage()) {
      return this.isFormChangeForEdit;
    }
    return this.guardianForm.dirty;
  }

  onCancelClick() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.destroyNameValidators) this.destroyNameValidators();
  }

  hasDuplicateStudents(control: AbstractControl): boolean {
    const relationships = control.value;
    if (!relationships || relationships.length <= 1) {
      return false;
    }

    // Use a Set to track unique IDs and check for duplicates
    const uniqueIds = new Set<number>();
    return relationships.some((rel: { id: number | null }) => {
      const id = rel.id;
      if (id != null) {
        if (uniqueIds.has(id)) {
          return true; // Duplicate found
        }
        uniqueIds.add(id);
      }
      return false;
    });
  }
}
