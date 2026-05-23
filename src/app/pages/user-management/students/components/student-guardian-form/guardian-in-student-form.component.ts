import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  Gender,
  GuardianRelationship,
  UserType,
  dropdownArrayFromEnum,
  enumArrayFromEnum,
} from '@shared/enums';
import { guardianForm } from '../../types';
import {
  FullNameValidators,
  OptionalFullNameValidators,
} from '@shared/utils/full-name.validator';
import { setupMutualFullNameValidators } from '@shared/utils/mutual-full-name.util';
import { Subscription } from 'rxjs';
import {
  NationalIdValidatorLengthType,
  NationalIdValidatorService,
} from '@pages/user-management/validators/national-id.validator';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  nationalIdMax10Validator,
  nationalIdMax18Validator,
} from '@validators/nationalID';
@Component({
  selector: 'app-guardian-in-student-form',
  templateUrl: './guardian-in-student-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesButtonModule,
    TranslocoDirective,
  ],
})
export class GuardianInStudentFormComponent implements OnInit, OnDestroy {
  @Input() form: guardianForm;
  @Output() removeClicked = new EventEmitter();
  private readonly nationalIdValidatorService = inject(
    NationalIdValidatorService,
  );
  private readonly translocoService = inject(TranslocoService);
  private readonly rbac = inject(RoleBaseAccessControlService);

  private readonly nationIdExistForTypeMsg = signal<string>('');

  private readonly hasNationalIdPermission =
    this.rbac.hasNationalIdPermission();

  private readonly subscription = new Subscription();
  // Signals to reflect which name is currently required (UI binding)
  private enFullNameRequired = signal(true);
  private arFullNameRequired = signal(true);
  private destroyNameValidators: (() => void) | null = null;
  // The utility directly updates the signals for required full names

  ngOnInit() {
    this.initializeDynamicValidators();
  }

  private initializeDynamicValidators() {
    if (!this.form) return;
    // National ID validators
    this.form.controls.nationalId.setAsyncValidators(
      this.nationalIdValidatorService.createValidator(
        UserType.GUARDIAN,
        this.nationIdExistForTypeMsg,
        undefined,
        this.hasNationalIdPermission
          ? NationalIdValidatorLengthType.OTHER
          : NationalIdValidatorLengthType.SAUDI,
      ),
    );
    this.form.controls.nationalId.setValidators([
      Validators.required,
      this.hasNationalIdPermission
        ? nationalIdMax18Validator
        : nationalIdMax10Validator,
    ]);
    this.form.controls.nationalId.updateValueAndValidity();

    // Mutual full name validators
    const { destroy } = setupMutualFullNameValidators(
      this.form.controls.enFullName,
      this.form.controls.arFullName,
      this.enFullNameRequired,
      this.arFullNameRequired,
    );
    this.destroyNameValidators = destroy;
  }

  removeGuardian() {
    this.removeClicked.emit();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.destroyNameValidators) this.destroyNameValidators();
  }

  newGuardianFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translocoService.translate('global.national_id.label'),
        placeholder: this.translocoService.translate(
          'global.enter_national_id.placeholder',
        ),
        type: 'input',
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
        maxLength: 10,
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
        label: this.translocoService.translate('global.relationship.label'),
        placeholder: this.translocoService.translate(
          'global.select_the_relation.dropdown',
        ),
        type: 'searchable-select',
        selectValues: dropdownArrayFromEnum(GuardianRelationship), // Add the values for the select options here
        formControlName: 'relationship',
        required: true,
        isEnumTranslate: true,
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
}
