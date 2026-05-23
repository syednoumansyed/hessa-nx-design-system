import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { isMobile } from '@utils/platform';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { StudentsService } from '@pages/user-management/students/students.service';
import { passwordMatchValidator } from '@pages/user-management/validators/password-match.validator';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { UserType } from '@shared/enums';
import { AuthService } from '@auth/auth.service';
import { HesSubscription } from '@utils/hes-subscription.util';

@Component({
  selector: 'app-user-change-password',
  templateUrl: './user-change-password.component.html',
  standalone: true,
  imports: [
    HesButtonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    HessaInputComponent,
  ],
})
export class UserChangePasswordComponent implements OnInit, OnDestroy {
  isMobile = isMobile();
  private readonly subscription = new HesSubscription();
  errorText = signal(undefined);
  passwordFormGroup = this.fb.group(
    {
      currentPassword: this.nonNullablefb.control('', Validators.required),
      password: this.nonNullablefb.control('', [
        Validators.minLength(8),
        Validators.pattern(/[^a-zA-Z0-9]/), // At least one symbol
      ]),
      confirmPassword: this.nonNullablefb.control(''),
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') },
  );

  phoneNumberControl = new FormControl('', [Validators.required]);

  @Input() userType: UserType;
  @Input() studentId: string | null;
  @Input() nationalId: string;
  @Input() onDismiss: () => void;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentsService,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private toastr: HesToasterService,
    public role: RoleBaseAccessControlService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    if (this.auth.user()?.type !== UserType.STUDENT) {
      this.removeCurrentPasswordValidation();
    }
    this.subscription.add =
      this.passwordFormGroup.controls.confirmPassword.statusChanges.subscribe(
        (status) => {
          if (status === 'INVALID') {
            this.errorText.set(
              this.translocoService.translate('global.passwords_not_match.txt'),
            );
          } else {
            this.errorText.set(undefined);
          }
        },
      );
  }

  removeCurrentPasswordValidation() {
    const currentPasswordControl =
      this.passwordFormGroup.get('currentPassword');
    if (currentPasswordControl) {
      currentPasswordControl.setValidators(null); // Remove all validators
      currentPasswordControl.updateValueAndValidity();
    }
  }

  cancel() {
    this.onDismiss();
  }

  changePassword() {
    if (this.passwordFormGroup.valid) {
      const payload = {
        password: this.passwordFormGroup.value.password ?? '',
        oldPassword: this.passwordFormGroup.value.currentPassword,
      };
      if (this.auth.user()?.type !== UserType.STUDENT)
        delete payload.oldPassword;
      this.studentService
        .changePassword(this.studentId ?? '', payload)
        .subscribe({
          next: () => {
            this.toastr.success(
              this.translocoService.translate('global.successful.title'),
              this.translocoService.translate(
                'global.password_successfully_updated.txt',
              ),
            );
            this.onDismiss();
          },
          error: (err) => {
            this.toastr.showBackendError(err);
          },
        });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  protected readonly focus = focus;
  protected readonly UserType = UserType;
}
