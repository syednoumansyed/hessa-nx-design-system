import { Component, computed, signal, OnInit, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { IClassPayload } from '@shared/interfaces/class.interface';
import { LevelsService } from '../data-access/levels.service';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { noWhitespaceValidator } from '@utils/custom.validator';
import { Idropdown } from '@shared/interfaces';
import { Class, Level, School } from '@shared/dto-transformation/organization';
import { GlobalClass } from '@shared/dto-transformation';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  templateUrl: './class-form.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ClassFormComponent implements OnInit, DsModalContentComponent {
  currentLang: string = '';
  isEditModal = signal<boolean>(false);

  // Signal inputs from modal service
  readonly classDetail = input<Class | undefined>();
  readonly schoolDetail = input.required<School>();
  readonly levelDetail = input.required<Level>();
  readonly globalClassesList = input<Idropdown[]>([]);

  // Injected by DsModalWrapperComponent
  closeModal!: (data?: unknown, role?: string) => void;

  // Button state signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private levelService: LevelsService,
    private toasterService: HesToasterService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  classForm = this.fb.group({
    companyName: this.nonNullablefb.control('', Validators.required),
    campusName: this.nonNullablefb.control('', Validators.required),
    schoolName: this.nonNullablefb.control('', Validators.required),
    levelName: this.nonNullablefb.control('', Validators.required),
    className: this.nonNullablefb.control('', [
      Validators.required,
      noWhitespaceValidator,
    ]),
  });

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  classForm1Config = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('school_structure.company_name.label'),
        placeholder: this.translate(
          'school_structure.company_name.placeholder',
        ),
        type: 'input',
        formControlName: 'companyName',
        required: false,
        readonly: true,
      },
      {
        label: this.translate('school_structure.campus_name_req.label'),
        placeholder: this.translate('school_structure.campus_name.placeholder'),
        type: 'input',
        formControlName: 'campusName',
        required: false,
        readonly: true,
      },
      {
        label: this.translate('school_structure.school_name_req.label'),
        type: 'input',
        formControlName: 'schoolName',
        required: false,
        readonly: true,
      },
      {
        label: this.translate('global.levels.label'),
        placeholder: this.translate('global.level.placeholder'),
        type: 'input',
        formControlName: 'levelName',
        required: false,
        readonly: true,
      },
      {
        label: this.translate('school_structure.class_name_req.label'),
        placeholder: this.translate('school_structure.class_name.placeholder'),
        type: 'searchable-select',
        formControlName: 'className',
        selectValues: this.globalClassesList(),
        required: true,
      },
    ];
  });

  readonly isFormValid = computed(() => this.classForm.valid);

  ngOnInit() {
    this.isEditModal.set(!!this.classDetail());
    const school = this.schoolDetail();
    const level = this.levelDetail();
    this.classForm.patchValue({
      companyName: school.campus?.company?.displayName,
      campusName: school.campus?.displayName,
      schoolName: school.displayName,
      levelName: level.displayName,
    });
    if (this.isEditModal()) {
      this.setEditValues();
    }

    // Set initial button state and subscribe to form status changes
    this.primaryButtonDisabled.set(this.classForm.invalid);
    this.classForm.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.classForm.invalid);
    });
  }

  /**
   * Sets the form control values for the edit class modal.
   */
  setEditValues() {
    this.classForm.patchValue({
      className: this.classDetail()?.value,
    });
  }

  /**
   * Makes the class payload for adding or editing class.
   * @returns IClassPayload
   */
  getRestPayload() {
    const classObj = this.getClassForPayload();
    return {
      schoolId: this.schoolDetail().id,
      levelId: this.levelDetail().id,
      arName: classObj.arName,
      enName: classObj.enName,
    };
  }

  getClassForPayload(): GlobalClass {
    const formValues = this.classForm.getRawValue();
    const className = formValues.className;
    return this.globalClassesList().find(
      (cls) => cls.value === className,
    ) as GlobalClass;
  }
  /**
   * Handles the add class functionality.
   */
  onSaveClass() {
    this.primaryButtonLoading.set(true);
    const payload: IClassPayload = this.getRestPayload();
    let apiCall;
    if (this.isEditModal()) {
      apiCall = this.levelService.editClass(payload, this.classDetail()?.id!);
    } else {
      apiCall = this.levelService.addClass(payload);
    }
    apiCall.subscribe({
      next: () => {
        this.closeModal(true, 'confirm');
        this.toasterService.success(
          this.translate(
            this.isEditModal()
              ? 'global.update_class_successfully.txt'
              : 'global.add_class_successfully.txt',
          ),
        );
      },
      error: (errResp) => {
        this.toasterService.showBackendError(errResp);
        this.primaryButtonLoading.set(false);
      },
    });
  }

  /**
   * Called by DsModalWrapperComponent when primary button is clicked.
   */
  onPrimaryClick() {
    if (this.classForm.valid) {
      this.onSaveClass();
    }
  }
}
