import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
  StudentGuardianRequest,
  StudentRequest,
  StudentsService,
} from '../students.service';
import {
  Gender,
  GuardianRelationship,
  UserType,
  dropdownArrayFromEnum,
  enumArrayFromEnum,
} from '@shared/enums';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateToUnixMidnight } from '@utils/date';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { guardianForm, relationshipForm } from '../types';
import { markInvalidFormControlsAsDirty } from '@utils/forms';
import { faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import {
  nationalIdMax10Validator,
  nationalIdMax18Validator,
  SaudiNationalityId,
} from '@validators/nationalID';
import {
  NationalIdValidatorLengthType,
  NationalIdValidatorService,
} from '@pages/user-management/validators/national-id.validator';
import { GuardianInStudentFormComponent } from '../components/student-guardian-form/guardian-in-student-form.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { faUserTieHair } from '@fortawesome/pro-duotone-svg-icons';
import { Subscription, skip, startWith } from 'rxjs';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CanFormComponentDeactivate } from '@shared/guards/form-can-deactivate.guard';
import {
  FullNameValidators,
  OptionalFullNameValidators,
} from '@shared/utils/full-name.validator';
import { setupMutualFullNameValidators } from '@shared/utils/mutual-full-name.util';
import { cleanObject } from '@shared/utils/clean-object.util';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { TuiDay } from '@taiga-ui/cdk';
import { Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-add-student',
  templateUrl: './student-form.page.html',
  standalone: true,
  providers: [SchoolStructureListingService],
  imports: [
    IonContent,
    HesButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    GuardianInStudentFormComponent,
  ],
})
export class StudentFormPage
  implements OnInit, OnDestroy, CanFormComponentDeactivate
{
  @ViewChild('customselectOption') public templateref: TemplateRef<any>;
  private readonly nationalIdValidatorService = inject(
    NationalIdValidatorService,
  );
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly toastr = inject(HesToasterService);
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly nationIdExistForTypeMsg = signal<string>('');
  private readonly nationalIdErrorMsg = signal<string>('');
  private readonly hasNationalIdPermission =
    this.rbac.hasNationalIdPermission();
  private studentDetail: Student;
  private isFormChangeForEdit = false;
  private isComeFromProfile = false;
  private isLevelRequired = signal(false);
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  faUserTieHair = faUserTieHair;
  /**
   * Indicates whether the page is in edit mode or not.
   */
  isEditPage = signal(false);
  /**
   * The ID of the student fetched from route params.
   */
  @Input() id: string | null = null;
  // We keep the original array for required usage elsewhere, but here we start with optional validators
  fullNameValidators = OptionalFullNameValidators;
  // Signals to reflect which name is currently required (for UI config binding)
  private enFullNameRequired = signal(true);
  private arFullNameRequired = signal(true);
  private destroyNameValidators: (() => void) | null = null;
  initSelection = signal<any[]>([]);
  // initialize form here to use typed forms
  studentForm = this.fb.group({
    nationalityId: this.fb.control<number | null>(null, [Validators.required]),
    nationalId: this.nonNullablefb.control<number | null>(null, {
      validators: [Validators.required, nationalIdMax10Validator],
      asyncValidators: [
        this.nationalIdValidatorService.createValidator(
          UserType.STUDENT,
          this.nationIdExistForTypeMsg,
        ),
      ],
    }),

    enFullName: this.nonNullablefb.control<string>('', this.fullNameValidators),
    arFullName: this.nonNullablefb.control<string>('', this.fullNameValidators),
    phoneNumber: this.nonNullablefb.control(''),
    gender: this.nonNullablefb.control<Gender>(
      Gender.MALE,
      Validators.required,
    ),
    pioneerStudentId: [''],
    passportNumber: [''],
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
    relationships: this.nonNullablefb.array(
      [
        this.fb.group({
          id: this.fb.control<number | null>(null, Validators.required),
          relationship: this.fb.control<GuardianRelationship | null>(
            null,
            Validators.required,
          ),
        }),
      ],
      [Validators.required, Validators.minLength(1)],
    ),
    guardians: this.fb.array<guardianForm>([]),
  });

  relationshipsFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translocoService.translate('global.select_guardian.label'),
        placeholder: this.translocoService.translate(
          'global.select_guardian.label',
        ),
        type: 'searchable-select',
        selectValues: this.studentService.guardiansDropdownList(),
        formControlName: 'id',
        required: true,
        onValueChange: this.onGuardianChange,
        initSelectValues: this.initSelection(),
        searchableSelectObject: {
          pagination: this.studentService.guardiansPagination(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.studentService.getGuardiansList(
              {
                pageNumber:
                  this.studentService.guardiansPagination()?.pageNumber! + 1,
              },
              true,
              ev,
            );
          },
          onSearchChanged: (value: string) => {
            if (value) this.studentService.updateGuardiansListSearchText(value);
            else this.studentService.updateGuardiansListSearchText(undefined);
            this.studentService.getGuardiansList();
          },
          selectOptionTemplate: this.templateref,
        },
      },
      {
        label: this.translocoService.translate('global.relationship.label'),
        placeholder: this.translocoService.translate(
          'global.select_the_relation.dropdown',
        ),
        type: 'searchable-select',
        isEnumTranslate: true,
        selectValues: dropdownArrayFromEnum(GuardianRelationship),
        formControlName: 'relationship',
        required: true,
      },
    ];
  });

  studentDetailsFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translocoService.translate('global.nationality.label'),
        placeholder: this.translocoService.translate(
          'global.select_nationality.dropdown',
        ),
        type: 'searchable-select',
        selectValues: this.nationalitiesApiService.nationalitiesList(), // Add the values for the select options here
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
        readonly: !this.rbac.hasPermission(
          RESOURCE_PERMISSION.student.editStudentProfile,
        ),
        maxLength: 9,
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
      {
        label: this.translocoService.translate(
          'global.pioneers_student_id.label',
        ),
        placeholder: this.translocoService.translate(
          'global.pioneers_student_id.placeholder',
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
        datePickerConfig: {
          max: TuiDay.currentLocal(),
        },
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
        datePickerConfig: {
          max: TuiDay.currentLocal(),
        },
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
    ];
  });

  selectedSchoolStructureItem =
    this.schoolStructureScopeService.selectedSchoolStructureItem();

  private readonly subscription = new Subscription();
  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private studentService: StudentsService,
    private router: Router,
    private translocoService: TranslocoService,
    private feedbackService: FeedbackService,
    private schoolStructureScopeService: SchoolStructureScopeService,
    private academicYearsScopeService: AcademicYearsScopeService,
    private route: ActivatedRoute,
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
        this.studentForm.reset({
          company:
            this.schoolStructureListingService.selectedCompany()?.id ?? null,
          campus:
            this.schoolStructureListingService.selectedCampus()?.id ?? null,
          schoolId:
            this.schoolStructureListingService.selectedSchool()?.id ?? null,
        });
      });

    // Setup mutual full name validators & reactive required flags in constructor (injection context active)
    const { destroy } = setupMutualFullNameValidators(
      this.studentForm.controls.enFullName,
      this.studentForm.controls.arFullName,
      this.enFullNameRequired,
      this.arFullNameRequired,
    );
    this.destroyNameValidators = destroy;
  }

  /**
   * Initializes the component and its dependencies.
   * - Retrieves the student ID from the route parameters.
   * - Determines if the page is in edit mode based on the presence of a student ID.
   * - Fetches translations programmatically.
   * - Sets up the student details form configuration.
   * - Updates national ID validators if in edit mode.
   * - Retrieves student details if in edit mode.
   * - Adds relationship and guardians controls if not in edit mode.
   * - Sets up school control dependencies.
   */
  ngOnInit() {
    this.isComeFromProfile =
      this.router.getCurrentNavigation()?.extras.state?.['origin'] ===
      'profile';
    this.isEditPage.set(!!this.id);
    this.studentService.getGuardiansList();

    // Disable nationalId by default
    this.studentForm.controls.nationalId.disable({ emitEvent: false });

    // Handle nationalId changes
    this.handleNationalIdChange();

    if (this.isEditPage()) {
      this.studentService.getStudent(+this.id!).subscribe((student) => {
        this.studentDetail = student;
        this.initSelection.set(
          student.guardians?.map((g) => {
            return {
              value: g.id,
              displayedValue: g.displayName,
            };
          }),
        );
        this.isLevelRequired.set(!!student.school?.id);
        this.patchStudentForm(student);
        this.updateNationalIdValidators();
        this.subscription.add(
          this.studentForm.valueChanges.subscribe(() => {
            this.isFormChangeForEdit = true;
          }),
        );

        if (this.studentDetail?.nationalId) {
          this.studentForm.controls.nationalId.setValue(
            Number(this.studentDetail.nationalId),
          );
        }

        // Disable nationalId if no permission after patching the form
        if (
          !this.hasNationalIdPermission &&
          student.nationalityId !== SaudiNationalityId
        ) {
          this.studentForm.controls.nationalId.disable({ emitEvent: false });
        }
      });
    }
    this.setupSchoolControlDependencies();
    this.handleLevelRequirementBasedOnSchool();
  }

  private handleNationalIdChange() {
    const nationalIdCtrl = this.studentForm.controls.nationalId;
    const nationalityCtrl = this.studentForm.controls.nationalityId;

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
          ? this.studentDetail?.nationalId
          : undefined;

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

  /**
   * Retrieves the details of a student from the student service and updates the student form with the retrieved data.
   */
  private patchStudentForm(student: Student) {
    // Resolve the school structure in case direct student is not active class

    const { company, campus, school, level, class: studentClass } = student;
    const companyId = company?.id;
    const campusId = campus?.id;
    const schoolId = school?.id;
    const levelId = level?.id;
    const classId = studentClass?.id;

    this.studentForm.patchValue({
      nationalId: +student.nationalId,
      nationalityId: student.nationalityId,
      arFullName: student.arFullName,
      enFullName: student.enFullName,
      ...(student.phoneNumber && { phoneNumber: student.phoneNumber }),
      gender: student.gender as Gender,
      pioneerStudentId: student.pioneerId,
      passportNumber: student.passportNumber,
      passportExpiryDate: student.passportExpiryDate
        ? new Date(student.passportExpiryDate)
        : null,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      registrationDate: student.registrationDate
        ? new Date(student.registrationDate)
        : null,
      company: companyId,
      campus: campusId,
      schoolId: schoolId,
      levelId: levelId,
    });
    student.guardians?.map((guardian, index) => {
      if (index !== 0) {
        this.addRelationship();
      }
      let data = {
        id: guardian.id,
        relationship: guardian.guardianRelationship,
      };
      this.relationshipsControls.controls
        .at(index)
        ?.setValue(data, { emitEvent: false });
    });
    markInvalidFormControlsAsDirty(this.studentForm);
    if (companyId) {
      this.schoolStructureListingService.updateSelectedCompany(companyId);
    }
    if (campusId) {
      this.schoolStructureListingService.updateSelectedCampus(campusId);
    }
    if (schoolId) {
      this.schoolStructureListingService.updateSelectedSchool(schoolId);
    }
    if (levelId) {
      this.schoolStructureListingService.updateSelectedLevel(levelId);
    }
    // TODO: Need to remove setTimeout there is issue with updateSelectedClass.
    setTimeout(() => {
      if (classId) {
        this.schoolStructureListingService.updateSelectedClass(classId);
      }
    }, 1000);
  }

  /**
   * Sets up the control dependencies for the school form controls.
   * Disables certain controls initially and enables them based on the selected values.
   */
  private setupSchoolControlDependencies() {
    this.subscription.add(
      this.studentForm.controls.schoolId.valueChanges
        .pipe(startWith(this.studentForm.controls.schoolId.value))
        .subscribe((id) => {
          this.isLevelRequired.set(!!id);
          if (id) {
            this.studentForm.controls.levelId.setValue(null);
            if (!this.isEditPage() || this.studentDetail.class)
              this.studentForm.controls.classId.setValue(null);
            this.studentForm.controls.levelId.enable({ emitEvent: false });
          } else {
            this.studentForm.controls.levelId.disable({ emitEvent: false });
            this.studentForm.controls.classId.disable({ emitEvent: false });
          }
        }),
    );
    this.subscription.add(
      this.studentForm.controls.levelId.valueChanges
        .pipe(startWith(this.studentForm.controls.levelId.value))
        .subscribe((id) => {
          if (id) {
            if (!this.isEditPage() || this.studentDetail.class)
              this.studentForm.controls.classId.setValue(null);
            this.studentForm.controls.classId.enable({ emitEvent: false });
          } else {
            this.studentForm.controls.classId.disable({ emitEvent: false });
          }
        }),
    );
  }

  /**
   * Populates the student payload based on the values from the student form.
   * @returns The populated student payload.
   */
  private populateStudentPayload() {
    const formVal = this.studentForm.getRawValue();
    const studentPayload: StudentRequest = {
      nationalId: formVal.nationalId?.toString() ?? '',
      nationalityId: formVal.nationalityId!,

      enFullName: formVal.enFullName,
      arFullName: formVal.arFullName,
      ...(formVal.phoneNumber && { countryCode: '+966' }),
      ...(formVal.phoneNumber && { phoneNumber: formVal.phoneNumber }),

      ...(formVal.pioneerStudentId && {
        pioneerId: formVal.pioneerStudentId,
      }),
      gender: formVal.gender,

      ...(formVal.passportNumber && {
        passportNumber: formVal.passportNumber,
      }),
      ...(formVal.passportExpiryDate && {
        passportExpiryDate: formatDateToUnixMidnight(
          (formVal.passportExpiryDate as Date).toISOString(),
        ),
      }),

      dateOfBirth: formatDateToUnixMidnight(
        (formVal.dateOfBirth! as Date).toISOString(),
      ),
      registrationDate: formatDateToUnixMidnight(
        (formVal.registrationDate! as Date).toISOString(),
      ),
      ...(formVal.schoolId && { schoolId: formVal.schoolId }),
      ...(formVal.levelId && { levelId: formVal.levelId }),
      ...(formVal.classId && {
        classId: formVal.classId,
        academicYearId:
          this.academicYearsScopeService.selectedAcademicYear()?.id!,
      }),

      guardianIdsAndRelationships:
        formVal.relationships
          ?.filter((rs) => rs.id && rs.relationship)
          ?.map((relationship) => {
            return {
              id: relationship.id!,
              guardianRelationship: relationship.relationship!,
            };
          }) ?? [],

      guardians:
        formVal.guardians?.map((guardian) => ({
          arFullName: guardian.arFullName,
          enFullName: guardian.enFullName,
          nationalId: guardian.nationalId,
          guardianRelationship: guardian.relationship!,
          countryCode: '+966',
          phoneNumber: guardian.phoneNumber,
          gender: guardian.gender,
        })) || [],
    };
    return studentPayload;
  }

  async checkSelectedAcadmicYear() {
    if (!this.academicYearsScopeService.isCurrentSelectedAcademicYearActive()) {
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
        () => (this.isEditPage() ? this.updateStudent() : this.addStudent()),
        () => {},
      );
    } else {
      this.isEditPage() ? this.updateStudent() : this.addStudent();
    }
  }

  /**
   * Adds a new student to the system.
   */
  async addStudent() {
    const studentPayload: StudentRequest = this.populateStudentPayload();

    this.studentService.createStudent(studentPayload).subscribe({
      next: async () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'user_management.student_added_successfully.txt',
          ),
        );
        await this.onAddStudentSuccess();
      },
      error: async () => {
        this.toastr.error(
          '',
          this.translocoService.translate(
            'user_management.wrong_add_student.txt',
          ),
        );
      },
    });
  }

  /**
   * Updates a student's information.
   */
  updateStudent() {
    if (this.id && this.isEditPage()) {
      const studentPayload: StudentRequest = this.populateStudentPayload();
      this.studentService.updateStudent(this.id, studentPayload).subscribe({
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
          this.toastr.showBackendError(error);
        },
      });
    }
  }

  /* feedback modal methods */
  async onAddStudentSuccess() {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'success',
        modalTitle: this.translocoService.translate(
          'global.student_added_successfully.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'user_management.add_other_student.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.back_to_home.btn',
        ),
      },
      () => this.addAnotherStudent(),
      () => {
        this.studentForm.markAsPristine();
        this.goBackToParent(true);
      },
      false,
    );
  }

  /* Form Methods */

  /**
   * Returns the relationships form array control of the studentForm.
   *
   * @returns {FormArray<relationshipForm> | null} The relationships form array control.
   */
  get relationshipsControls(): FormArray<relationshipForm> {
    /* Because the returned control is of the type AbstractControl,
      you need to provide an explicit type to access the method syntax
      for the form array instance. */
    return this.studentForm.get('relationships') as FormArray<relationshipForm>;
  }

  /**
   * Adds a new relationship control to the form.
   */
  addRelationship() {
    this.relationshipsControls?.push(
      this.fb.group({
        id: this.fb.control<number | null>(null, Validators.required),
        relationship: this.fb.control<GuardianRelationship | null>(
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
    this.studentForm.controls.relationships.setValidators([
      Validators.required,
      Validators.minLength(1),
    ]);
    this.studentForm.controls.relationships.updateValueAndValidity();
    const relationshipFormGroups = this.relationshipsControls?.controls;
    relationshipFormGroups.forEach((control) => {
      control.controls.relationship.setValidators(Validators.required);
      control.controls.relationship.updateValueAndValidity();
      control.controls.id.setValidators(Validators.required);
      control.controls.id.updateValueAndValidity();
    });
  }

  private removeRelationshipsControlsValidators() {
    this.studentForm.controls.relationships.clearValidators();
    this.studentForm.controls.relationships.updateValueAndValidity();
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
   * @returns {FormArray<guardianForm> | null} The FormArray instance for the guardians control.
   */
  get guardians(): FormArray<guardianForm> | null {
    /* Because the returned control is of the type AbstractControl,
      you need to provide an explicit type to access the method syntax
      for the form array instance. */
    return this.studentForm.get('guardians') as FormArray<guardianForm>;
  }

  /**
   * Adds a new guardian to the list of guardians.
   * This function creates a new form group for the guardian
   *
   * If the list of guardians is empty before adding the new guardian, this function subscribes to the valueChanges event of the guardians form array.
   * If the guardians form array is valid, it removes the validators from the relationship controls.
   * If the guardians form array is not valid, it sets the validators for the relationship controls.
   */
  addGuardian() {
    const newGuardain = this.fb.group({
      arFullName: this.nonNullablefb.control('', this.fullNameValidators),
      enFullName: this.nonNullablefb.control('', this.fullNameValidators),
      nationalId: this.nonNullablefb.control('', [
        Validators.required,
        nationalIdMax18Validator,
      ]),
      relationship: this.fb.control<GuardianRelationship | null>(
        null,
        Validators.required,
      ),
      phoneNumber: this.nonNullablefb.control('', Validators.required),
      gender: this.nonNullablefb.control<Gender>(
        Gender.MALE,
        Validators.required,
      ),
    });

    this.guardians?.push(newGuardain);
    if (this.guardians?.length === 1) {
      this.subscription.add(
        this.guardians?.statusChanges.subscribe((status) => {
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
   * Removes a guardian from the list of guardians.
   * @param index - The index of the guardian to remove.
   */
  removeGuardian(index: number) {
    this.guardians?.removeAt(index);
    if (this.guardians?.length === 0) {
      this.setRelationShipsControlsValidators();
    }
  }

  /**
   * Handles the change event of the guardian selection.
   * If the selected value is -1, it resets the control and adds a new guardian.
   *
   * @param event - The change event object containing the selected value.
   * @param control - The form control to be reset.
   */
  onGuardianChange = (event: number, control: FormControl) => {
    if (event === -1) {
      control.reset();
      this.addGuardian();
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
   * Clears the student form and closes the modal.
   */
  addAnotherStudent() {
    this.studentForm.reset();
  }
  private updateNationalIdValidators() {
    this.studentForm.controls.nationalId.setAsyncValidators([
      this.nationalIdValidatorService.createValidator(
        UserType.STUDENT,
        this.nationIdExistForTypeMsg,
        this.studentDetail?.nationalId,
      ),
    ]);
    this.studentForm.controls.nationalId.updateValueAndValidity();
  }

  isUnsavedChanges() {
    if (this.isEditPage()) {
      return this.isFormChangeForEdit;
    }
    return this.studentForm.dirty;
  }

  onCancelClick() {
    this.goBackToParent();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.destroyNameValidators) this.destroyNameValidators();
  }

  private handleLevelRequirementBasedOnSchool() {
    this.subscription.add(
      this.studentForm.controls.schoolId.valueChanges.subscribe((schoolId) => {
        const levelControl = this.studentForm.controls.levelId;
        if (schoolId) {
          levelControl.setValidators(Validators.required);
          this.isLevelRequired.set(true);
        } else {
          this.isLevelRequired.set(false);
          levelControl.removeValidators(Validators.required);
        }
        levelControl.updateValueAndValidity();
      }),
    );
  }
}
