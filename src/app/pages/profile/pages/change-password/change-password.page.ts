import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { faCheckCircle, faCircle } from '@fortawesome/pro-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';

import { DsInputComponent } from '@ds/input/input.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { AuthService } from '@auth/auth.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { UserType } from '@shared/enums';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    DsInputComponent,
    DsButtonComponent,
    DsIconComponent,
    AnimatedIconComponent,
  ],
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentService = inject(StudentsService);
  private readonly toaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);

  readonly faCheckCircle = faCheckCircle;
  readonly faCircle = faCircle;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;

  readonly currentStep = signal<'form' | 'success'>('form');
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly showCurrentPassword = signal(false);

  // Whether the logged-in user is a student (needs current password)
  readonly isStudent = signal(false);
  // The student whose password is being changed
  readonly studentId = signal<string>('');
  readonly nationalId = signal<string>('');
  // Whether guardian is changing a student's password
  readonly isGuardianFlow = signal(false);

  passwordForm: FormGroup;

  get animatedIconSize(): string {
    return window.innerWidth <= 768 ? '250px' : '350px';
  }

  readonly passwordEyeIcon = computed(() =>
    this.showPassword() ? this.faEyeSlash : this.faEye,
  );
  readonly confirmPasswordEyeIcon = computed(() =>
    this.showConfirmPassword() ? this.faEyeSlash : this.faEye,
  );
  readonly currentPasswordEyeIcon = computed(() =>
    this.showCurrentPassword() ? this.faEyeSlash : this.faEye,
  );

  readonly passwordValue = computed(
    () => this.passwordForm?.get('password')?.value || '',
  );
  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);
  readonly hasSpecialChar = computed(() =>
    /[^a-zA-Z0-9]/.test(this.passwordValue()),
  );

  readonly minLengthIcon = computed(() =>
    this.hasMinLength() ? this.faCheckCircle : this.faCircle,
  );
  readonly specialCharIcon = computed(() =>
    this.hasSpecialChar() ? this.faCheckCircle : this.faCircle,
  );

  constructor() {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/[^a-zA-Z0-9]/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    const user = this.auth.user();
    this.isStudent.set(user?.type === UserType.STUDENT);

    // Check if this is a guardian changing a student's password
    const routeStudentId =
      this.route.snapshot.paramMap.get('studentId') ??
      this.route.snapshot.parent?.paramMap.get('studentId');

    if (routeStudentId) {
      // Guardian flow: changing a student's password
      this.isGuardianFlow.set(true);
      this.studentId.set(routeStudentId);
      this.removeCurrentPasswordValidator();
      this.loadStudentNationalId(routeStudentId);
    } else {
      // Student's own flow
      this.studentId.set(String(user?.userTypeId ?? ''));
      this.nationalId.set(user?.nationalId ?? '');
    }

    // If not a student, remove current password requirement
    if (user?.type !== UserType.STUDENT) {
      this.removeCurrentPasswordValidator();
    }

    // Subscribe to password value changes to trigger recomputation
    this.passwordForm
      .get('password')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadStudentNationalId(studentId: string): void {
    this.studentService
      .getStudent(studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student) => {
          this.nationalId.set(student?.nationalId ?? '');
        },
        error: () => {
          this.toaster.error(
            this.transloco.translate('global.error.title'),
            this.transloco.translate('global.generic_error.txt'),
          );
        },
      });
  }

  private removeCurrentPasswordValidator(): void {
    const ctrl = this.passwordForm.get('currentPassword');
    if (ctrl) {
      ctrl.setValidators(null);
      ctrl.updateValueAndValidity();
    }
  }

  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  getPasswordError(): string {
    const ctrl = this.passwordForm.get('password');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required'))
      return this.transloco.translate('global.enter_password.placeholder');
    if (ctrl.hasError('minlength'))
      return this.transloco.translate('global.error_password.txt');
    return '';
  }

  getConfirmPasswordError(): string {
    const ctrl = this.passwordForm.get('confirmPassword');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required'))
      return this.transloco.translate('global.confirm_new_password.label');
    if (ctrl.hasError('passwordMismatch'))
      return this.transloco.translate('global.passwords_not_match.txt');
    return '';
  }

  getCurrentPasswordError(): string {
    const ctrl = this.passwordForm.get('currentPassword');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required'))
      return this.transloco.translate('user_management.current_password.label');
    return '';
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const payload: { password: string; oldPassword?: string } = {
      password: this.passwordForm.get('password')?.value,
    };

    // Students need to send their old password
    if (this.isStudent() && !this.isGuardianFlow()) {
      payload.oldPassword = this.passwordForm.get('currentPassword')?.value;
    }

    this.studentService
      .changePassword(this.studentId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStep.set('success');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toaster.showBackendError(err);
        },
      });
  }

  goBack(): void {
    if (this.isGuardianFlow()) {
      void this.router.navigate(['/profile', 'student', this.studentId()]);
    } else {
      void this.router.navigate(['/profile']);
    }
  }

  done(): void {
    this.goBack();
  }
}
