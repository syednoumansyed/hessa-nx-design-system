import {
  Component,
  computed,
  signal,
  OnInit,
  inject,
  input,
  WritableSignal,
} from '@angular/core';
import { isMobile } from '@shared/utils/platform';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { ToastrService } from 'ngx-toastr';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { enumArrayFromEnum, ResourceStatus } from '@shared/enums';
import { formatToHesDate } from '@shared/utils/date';
import { Subject, Subscription, startWith } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { decimalRangeValidator } from '@validators/decimalValidator';
import { AcademicYearApiService } from '@pages/academic-year/data-access/academic-year-api.service';

@Component({
  selector: 'app-add-edit-course-dialog',
  templateUrl: './add-edit-course-dialog.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [SchoolStructureListingService],
})
export class AddEditCourseDialogComponent
  implements OnInit, DsModalContentComponent
{
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  currentLang: string = '';
  closeModal?: (data?: unknown, role?: string) => void;
  courseId = input<number>();
  isView = input<boolean>(false);
  onRefresh = input<Subject<void>>();
  readonly primaryButtonDisabled: WritableSignal<boolean> = signal(true);
  isArabic = computed(() => this.currentLang === 'ar');
  isMobileDevice = signal(isMobile());
  isEditModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  private academicYearDropdown = signal<Idropdown[]>([]);
  private subjectDropdown = signal<Idropdown[]>([]);
  private teacherDropdown = signal<Idropdown[]>([]);
  private coTeacherDropdown = signal<Idropdown[]>([]);
  private statusDropdown = signal<Idropdown[]>(
    enumArrayFromEnum(ResourceStatus).map((status) => ({
      value: status as string | number, // cast status to string | number
      displayedValue: this.translocoService.translate(
        `enum.${status as string}`,
      ), // cast status to string
    })),
  );

  selectedSchoolStructureItem =
    this.schoolScopeService.selectedSchoolStructureItem;

  private readonly subscription = new Subscription();

  courseForm = this.fb.group({
    company: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedCompany()?.id ?? null,
      Validators.required,
    ),
    campus: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedCampus()?.id ?? null,
      Validators.required,
    ),
    school: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedSchool()?.id ?? null,
      Validators.required,
    ),
    level: this.fb.control<number | null>(null, Validators.required),
    class: this.fb.control<number[]>([], Validators.required),
    academicYear: this.nonNullablefb.control(-1, Validators.required),
    subject: this.nonNullablefb.control('', Validators.required),
    creditHour: this.fb.control(null, [
      Validators.required,
      decimalRangeValidator(0.5, 50, 2),
    ]),
    teacher: this.fb.control<number | null>(null, Validators.required),
    coTeacher: this.fb.control<number | null>(null),
    status: this.nonNullablefb.control('', Validators.required),
  });

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private courseService: CourseManagementService,
    private academicYearApiService: AcademicYearApiService,
    private schoolService: SchoolService,
    private toastr: ToastrService,
    private schoolScopeService: SchoolStructureScopeService,
    private academicYearScope: AcademicYearsScopeService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  ngOnInit() {
    this.isEditModal.set(this.courseId() ? true : false);
    this.getAcademicYears();
    this.getAllSubjects();
    if (this.schoolStructureListingService.selectedSchool()?.id) {
      this.getSchoolTeachers(
        this.schoolStructureListingService.selectedSchool()?.id!,
      );
    }

    if (this.isEditModal() || this.isView()) {
      this.setValuesForEdit();
    }
    if (this.isView()) {
      this.courseForm.disable();
    }
    if (!this.isView()) this.setupSchoolStructureControlDependencies();

    // Track form validity for primary button state
    this.courseForm.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.courseForm.invalid);
    });
  }

  onPrimaryClick() {
    if (this.isEditModal()) {
      this.onEditCourse();
    } else {
      this.onAddCourse();
    }
  }

  onSecondaryClick() {
    this.closeModal?.();
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  getAcademicYears() {
    return this.academicYearApiService.getAllAcademicYears(false).subscribe({
      next: (data: any) => {
        const dropdownOptions = data.data.map((ay: any) => ({
          value: ay.id,
          displayedValue: `${ay.name} (${formatToHesDate(ay.startDate)} - ${formatToHesDate(ay.endDate)})`,
        }));
        this.academicYearDropdown.set(dropdownOptions);
        const defAcademicYear =
          this.academicYearScope.selectedAcademicYear()?.id;
        if (defAcademicYear) {
          this.courseForm.get('academicYear')?.setValue(+defAcademicYear);
        }
      },
    });
  }

  getAllSubjects() {
    return this.courseService.getAllSubjects().subscribe({
      next: (data) => {
        this.subjectDropdown.set(data);
      },
    });
  }

  getSchoolTeachers(schoolId: number) {
    return this.schoolService.getAllSchoolTeachers(schoolId).subscribe({
      next: (data) => {
        const dropdownOptions = data.sort((a: any, b: any) =>
          a.displayedValue.localeCompare(b.displayedValue),
        );
        this.teacherDropdown.set(dropdownOptions);
        this.coTeacherDropdown.set(dropdownOptions);

        // If editing, remove the teacher from the co-teacher dropdown
        if (this.isEditModal()) {
          const teacherId = this.courseForm.get('teacher')?.value;
          this.coTeacherDropdown.set(
            dropdownOptions.filter((item: any) => item.value !== teacherId),
          );
        }
      },
    });
  }

  private setupSchoolStructureControlDependencies() {
    this.subscription.add(
      this.courseForm.controls.company.valueChanges.pipe().subscribe((id) => {
        if (id) {
          this.courseForm.controls.campus.setValue(null);
          this.courseForm.controls.school.setValue(null);
          this.courseForm.controls.level.setValue(null);
          this.courseForm.controls.class.setValue([]);
          this.courseForm.controls.teacher.setValue(null);
          this.courseForm.controls.coTeacher.setValue(null);
          this.courseForm.controls.creditHour.setValue(null);
          this.courseForm.controls.campus.enable({ emitEvent: false });
        } else {
          this.courseForm.controls.campus.disable({ emitEvent: false });
          this.courseForm.controls.school.disable({ emitEvent: false });
          this.courseForm.controls.level.disable({ emitEvent: false });
          this.courseForm.controls.class.disable({ emitEvent: false });
          this.courseForm.controls.teacher.disable({ emitEvent: false });
          this.courseForm.controls.coTeacher.disable({ emitEvent: false });
          this.courseForm.controls.creditHour.disable({ emitEvent: false });
        }
      }),
    );
    this.subscription.add(
      this.courseForm.controls.campus.valueChanges.pipe().subscribe((id) => {
        if (id) {
          this.courseForm.controls.school.setValue(null);
          this.courseForm.controls.level.setValue(null);
          this.courseForm.controls.class.setValue([]);
          this.courseForm.controls.teacher.setValue(null);
          this.courseForm.controls.coTeacher.setValue(null);
          this.courseForm.controls.school.enable({ emitEvent: false });
        } else {
          this.courseForm.controls.school.disable({ emitEvent: false });
          this.courseForm.controls.level.disable({ emitEvent: false });
          this.courseForm.controls.class.disable({ emitEvent: false });
          this.courseForm.controls.teacher.disable({ emitEvent: false });
          this.courseForm.controls.coTeacher.disable({ emitEvent: false });
        }
      }),
    );
    this.subscription.add(
      this.courseForm.controls.school.valueChanges.pipe().subscribe((id) => {
        if (id) {
          this.courseForm.controls.level.setValue(null);
          this.courseForm.controls.class.setValue([]);
          this.courseForm.controls.teacher.setValue(null);
          this.courseForm.controls.coTeacher.setValue(null);
          this.courseForm.controls.level.enable({ emitEvent: false });
          this.courseForm.controls.teacher.enable({ emitEvent: false });
          this.courseForm.controls.coTeacher.enable({ emitEvent: false });
          this.getSchoolTeachers(+id);
        } else {
          this.courseForm.controls.level.disable({ emitEvent: false });
          this.courseForm.controls.class.disable({ emitEvent: false });
          this.courseForm.controls.teacher.disable({ emitEvent: false });
          this.courseForm.controls.coTeacher.disable({ emitEvent: false });
        }
      }),
    );
    this.subscription.add(
      this.courseForm.controls.level.valueChanges
        .pipe(startWith(this.courseForm.controls.level.value))
        .subscribe((id) => {
          if (id) {
            this.courseForm.controls.class.setValue([]);
            this.courseForm.controls.class.enable({ emitEvent: false });
          } else {
            this.courseForm.controls.class.disable({ emitEvent: false });
          }
        }),
    );
  }

  onTeacherChange = (value: number) => {
    const dropdownValues = this.teacherDropdown();
    this.coTeacherDropdown.set(
      dropdownValues.filter((item) => item.value !== value),
    );
  };

  setValuesForEdit() {
    this.courseService.getCourseById(this.courseId()!).subscribe({
      next: (data) => {
        data = data.data;
        this.schoolStructureListingService.updateSelectedCompany(
          data.company.id,
        );
        this.schoolStructureListingService.updateSelectedCampus(data.campus.id);
        this.schoolStructureListingService.updateSelectedSchool(data.school.id);
        this.schoolStructureListingService.updateSelectedLevel(data.level.id);
        this.courseForm.setValue({
          company: data.company.id,
          campus: data.campus.id,
          school: data.school.id,
          level: data.level.id,
          class: data.classes.map((c: any) => c.id),
          academicYear: data.academicYear.id,
          subject: data.subject.id,
          teacher: data.personnel.id,
          creditHour: data.creditHour,
          coTeacher: data.coPersonnel.id,
          status: data.status,
        });
      },
    });
  }

  courseFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('global.company.title'),
        placeholder: this.translate('global.select_company.dropdown'),
        type: 'searchable-select',
        formControlName: 'company',
        required: true,
        SchoolStructureListingType: 'company',
      },
      {
        label: this.translate('global.campus.title'),
        placeholder: this.translate('global.select_campus.dropdown'),
        type: 'searchable-select',
        formControlName: 'campus',
        required: true,
        SchoolStructureListingType: 'campus',
      },
      {
        label: this.translate('global.school.title'),
        placeholder: this.translate('global.select_school.dropdown'),
        type: 'searchable-select',
        formControlName: 'school',
        required: true,
        SchoolStructureListingType: 'school',
      },
      {
        label: this.translate('global.level.title'),
        placeholder: this.translate('global.select_level.dropdown'),
        type: 'searchable-select',
        formControlName: 'level',
        required: true,
        SchoolStructureListingType: 'level',
      },
      {
        label: this.translate('resource.class'),
        placeholder: this.translate(
          'course_management.select_classes.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'class',
        required: true,
        isMultiple: true,
        SchoolStructureListingType: 'class',
      },
      {
        label: this.translate('global.academic_year.title'),
        placeholder: this.translate('global.select_academic_year.txt'),
        type: 'searchable-select',
        formControlName: 'academicYear',
        selectValues: this.academicYearDropdown(),
        required: true,
      },
      {
        label: this.translate('course_management.subject_req.label'),
        placeholder: this.translate(
          'course_management.select_subject.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'subject',
        selectValues: this.subjectDropdown(),
        required: true,
      },
      {
        label: this.translate('grade_management.credit_hours.dropdown'),
        placeholder: this.translate('grade_management.credit_hours.dropdown'),
        type: 'input',
        formControlName: 'creditHour',
        required: true,
        inputType: 'text',
        errorMessage: {
          outOfRange: this.translate('global.validation.range', {
            label: this.translate('grade_management.credit_hours.dropdown'),
            min: 0.5,
            max: 50,
          }),
          decimalFormat: this.translate('global.validation.decimal_format', {
            label: this.translate('grade_management.credit_hours.dropdown'),
          }),
        },
      },
      {
        label: this.translate('course_management.teacher.title'),
        placeholder: this.translate(
          'course_management.select_teacher.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'teacher',
        selectValues: this.teacherDropdown(),
        onValueChange: this.onTeacherChange,
        required: true,
      },
      {
        label: this.translate('course_management.co_teacher_req.label'),
        placeholder: this.translate(
          'course_management.select_co_teacher.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'coTeacher',
        selectValues: this.coTeacherDropdown(),
        required: false,
      },
      {
        label: this.translate('global.status.title'),
        placeholder: this.translate('course_management.select_status.dropdown'),
        type: 'searchable-select',
        formControlName: 'status',
        selectValues: this.statusDropdown(),
        required: true,
      },
    ];
  });

  makeCoursePayload() {
    const formValues = this.courseForm.getRawValue();
    const payload = {
      academicYearId: formValues.academicYear,
      subjectId: formValues.subject,
      personnelId: formValues.teacher,
      coPersonnelId: formValues.coTeacher ? formValues.coTeacher : undefined,
      creditHour: formValues.creditHour,
      status: formValues.status,
      classIds: formValues.class,
    };
    return payload;
  }

  onAddCourse() {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    const payload = this.makeCoursePayload();
    return this.courseService.addCourse(payload).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'course_management.course_add_successfully.txt',
          ),
        );
        this.closeModal?.();
        this.onRefresh()?.next();
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 400) {
          this.toastr.error('', this.translate(err.error.messageRef));
        } else {
          this.toastr.error(
            this.translocoService.translate('global.delete_wrong_msg.txt'),
            this.translocoService.translate('global.wrong_msg.title'),
          );
        }
      },
    });
  }

  onEditCourse() {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    const payload = this.makeCoursePayload();
    return this.courseService.editCourse(this.courseId()!, payload).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'course_management.course_edit_successfully.txt',
          ),
        );
        this.closeModal?.();
        this.onRefresh()?.next();
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 400) {
          this.toastr.error('', this.translate(err.error.messageRef));
        } else {
          this.toastr.error(
            this.translocoService.translate('global.delete_wrong_msg.txt'),
            this.translocoService.translate('global.wrong_msg.title'),
          );
        }
      },
    });
  }
}
