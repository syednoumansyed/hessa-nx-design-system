import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { faUser, faCircle } from '@fortawesome/pro-solid-svg-icons';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { AuthService } from '@auth/auth.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import {
  confirmPasswordValidator,
  getConfirmPasswordErrorMessage,
  getPasswordErrorMessage,
  passwordValidator,
} from '@validators/password';
import {
  getNationalIdErrorMessage,
  nationalIdMax18Validator,
} from '@validators/nationalID';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HttpErrorResponse } from '@angular/common/http';
import { ForgetPasswordService } from '../forget-password/forget-password.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-setup-student',
  templateUrl: './setup-student.page.html',
  standalone: true,
  imports: [
    HesButtonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    TitleCasePipe,
  ],
  providers: [],
})
export class SetupStudentPage implements OnInit {
  faUser = faUser;
  faCircle = faCircle;

  private authService = inject(AuthService);
  private forgotPasswordService = inject(ForgetPasswordService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  fb = inject(NonNullableFormBuilder);
  private readonly toastr = inject(HesToasterService);

  // login-old states
  userId = signal<number | null>(null);
  nationalIdErr = signal<string | null>(null);
  passwordErr = signal<string | null>(null);
  confirmPasswordErr = signal<string | null>(null);

  form = this.fb.group({
    nationalId: ['', [Validators.required, nationalIdMax18Validator]],
    password: ['', [Validators.required, passwordValidator]],
    confirmPassword: [
      '',
      [
        Validators.required,
        confirmPasswordValidator({
          passwordControl: () => this.form?.get('password'),
        }),
      ],
    ],
  });

  ngOnInit(): void {
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.getPasswordErrorMessage();
    });
    this.form.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.getConfirmErrorMessage();
    });
    this.form.get('nationalId')?.valueChanges.subscribe(() => {
      this.nationalIdErr.set(
        getNationalIdErrorMessage(
          this.form.get('nationalId') as FormControl,
          this.translocoService,
        ),
      );
    });
  }

  setup() {
    let payload: { nationalId: string; password: string; studentId: number } = {
      password: this.form.controls.password.value,
      nationalId: this.form.controls.nationalId.value,
      studentId: this.authService.user()?.userTypeId!,
    };
    this.forgotPasswordService.setupPassword(payload).subscribe({
      next: (data) => {
        if (data.success) {
          this.toastr.success(
            this.translocoService.translate('global.successful.title'),
            this.translocoService.translate(
              'login.created_account_successfully.txt',
            ),
          );
          this.router.navigate(['/login']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.showBackendError(err);
      },
    });
  }

  getPasswordErrorMessage() {
    this.passwordErr.set(
      getPasswordErrorMessage(
        this.form.get('password') as FormControl,
        this.translocoService,
      ),
    );
  }
  getConfirmErrorMessage() {
    this.confirmPasswordErr.set(
      getConfirmPasswordErrorMessage(
        this.form.get('confirmPassword') as FormControl,
        this.translocoService,
      ),
    );
  }
  getNationalIdErrorMessage() {
    this.nationalIdErr.set(
      getNationalIdErrorMessage(
        this.form.get('nationalId') as FormControl,
        this.translocoService,
      ),
    );
  }
}
