import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { AuthService } from '@auth/auth.service';
import { ILoginPayload } from '@auth/model';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  getNationalIdErrorMessage,
  nationalIdMax18Validator,
} from '@validators/nationalID';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login-old-students',
  templateUrl: './login-students.page.html',
  standalone: true,
  imports: [
    CommonModule,
    HesButtonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
})
export class LoginStudentsPage implements OnInit, OnDestroy {
  faWhatsapp = faWhatsapp;

  private authService = inject(AuthService);
  private readonly toaster = inject(HesToasterService);
  private readonly translocoService = inject(TranslocoService);
  fb = inject(NonNullableFormBuilder);
  private nationalIdValidators = [
    Validators.required,
    nationalIdMax18Validator,
  ];
  public nationalIdErr = signal<string | null>('');
  private destroy$ = new Subject<void>();

  // login-old states
  userId = signal<number | null>(null);
  loginErr = signal(false);

  // student login-old form controls
  studentForm = this.fb.group({
    nationalId: ['', this.nationalIdValidators],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.checkForNationalIdError();
  }

  private checkForNationalIdError() {
    this.studentForm
      .get('nationalId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getNationalIdErrorMessage();
      });
  }

  private getNationalIdErrorMessage() {
    this.nationalIdErr.set(
      getNationalIdErrorMessage(
        this.studentForm.controls['nationalId'],
        this.translocoService,
      ),
    );
  }

  login() {
    let payload: ILoginPayload;
    if (this.studentForm.valid) {
      payload = {
        type: 'nationalId',
        channel: 'sms',
        nationalId: this.studentForm.value.nationalId,
        password: this.studentForm.value.password,
      };
      this.authService.studentLogin(payload).subscribe({
        next: (_res) => {
          this.loginErr.set(false);
        },
        error: (err) => {
          if (err.error.messageRef) {
            this.toaster.showBackendError(err);
          } else {
            this.loginErr.set(true);
          }
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
