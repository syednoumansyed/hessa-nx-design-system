import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '@pages/login/services/auth-flow.service';
import { MascotService } from '@pages/login/services/mascot.service';
import { UserType } from '@shared/enums';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DsInputComponent } from '@ds/input/input.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AuthService } from '@auth/auth.service';
import { Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';

@Component({
  selector: 'app-name-verification',
  templateUrl: './name-verification.component.html',
  imports: [
    FormsModule,
    DsInputComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
  ],
})
export class NameVerificationComponent implements OnInit, OnDestroy {
  firstName = signal('');
  validationMessage = signal('');
  hasError = signal(false);
  showWarning = signal(false);
  nameCtrl = new FormControl('', [Validators.required]);
  private storedFirstName = signal('');

  officialName = computed(() => {
    const acct = this.authFlowService.selectedAccount();
    const userInfo = this.loginData.loginRes()?.data.userInfo;
    return acct?.displayName ?? userInfo?.displayName ?? 'Not available';
  });

  canConfirm = computed(
    () => this.firstName().trim().length >= 2 && !this.hasError(),
  );
  private destroy$ = new Subject<void>();

  constructor(
    private authFlowService: AuthFlowService,
    private mascotService: MascotService,
    private loginData: LoginDataService,
    private toaster: HesToasterService,
    private auth: AuthService,
    private router: Router,
    private transloco: TranslocoService,
  ) {}

  ngOnInit(): void {
    this.authFlowService.setCanContinue(false);
    this.setupMascot();
    this.authFlowService.setCurrentStep(AuthStep.NAME_VERIFICATION);
    this.loadAccountData();
    this.initNameSync();

    // Set initial continue button state
    this.authFlowService.setCanContinue(this.canConfirm());

    // Listen for continue button clicks
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.confirm();
      });

    // Auto-focus
    setTimeout(() => {
      (document.querySelector('.name-input') as HTMLInputElement)?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initNameSync(): void {
    const preferred = this.authFlowService.givenName();
    const stored = this.authFlowService.getData('firstName');
    const initial = preferred ?? stored ?? '';
    if (initial) {
      this.firstName.set(initial);
      this.nameCtrl.setValue(initial, { emitEvent: false });
    }

    this.nameCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        const v = (val ?? '').toString();
        this.firstName.set(v);
        this.authFlowService.givenName.set(v); // keep service preferred name updated
        this.onFirstNameChange();
      });
  }

  private setupMascot(): void {
    const userType =
      this.authFlowService.getCurrentState().userType || UserType.STUDENT;
    this.mascotService.updateMascotByScenario('name_verification', userType);
  }

  private loadAccountData(): void {
    const selectedAccount = this.authFlowService.selectedAccount();
    if (selectedAccount) {
      this.validateFirstName();
    }
  }

  onFirstNameChange(): void {
    this.hasError.set(false);
    this.validateFirstName();
    this.checkForWarning();
    // Update continue button state
    this.authFlowService.setCanContinue(this.canConfirm());
  }

  private validateFirstName(): void {
    const value = this.firstName().trim();
    if (!value) {
      this.validationMessage.set('');
      this.authFlowService.setCanContinue(false);
      return;
    }

    const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/;
    const isValid =
      value.length >= 2 && value.length <= 50 && nameRegex.test(value);

    if (!isValid) {
      this.hasError.set(true);
      this.authFlowService.setCanContinue(false);
      return;
    }

    this.hasError.set(false);
    this.authFlowService.setCanContinue(this.canConfirm());
    this.authFlowService.setData('firstName', value);
  }

  private checkForWarning(): void {
    const enteredName = this.firstName().trim().toLowerCase();
    const storedName = this.storedFirstName().toLowerCase();
    this.showWarning.set(enteredName !== storedName && enteredName.length > 0);
  }

  confirm(): void {
    if (!this.canConfirm()) {
      this.hasError.set(true);
      return;
    }
    const clean = this.firstName().trim();
    const id =
      this.authFlowService.selectedAccount()?.userId ??
      this.loginData.loginRes()?.data.userInfo.id;
    if (id) {
      // call the backend to update the first name
      this.loginData.setPreferredName(id, clean).subscribe({
        next: (data) => {
          if (data) {
            this.authFlowService.setData('confirmedFirstName', clean);
            this.authFlowService.givenName.set(clean);

            // Navigate based on flow type
            const flowType = this.authFlowService.getCurrentState().flowType;
            const isPasswordSetupRequired =
              this.loginData.loginRes()?.data.userInfo.type ===
                UserType.STUDENT && !this.loginData.isPasswordSetup();
            if (
              (flowType === FlowType.ONBOARDING ||
                flowType === FlowType.FORGOT_PASSWORD ||
                isPasswordSetupRequired) &&
              this.loginData.loginRes()?.data.userInfo.type === UserType.STUDENT
            ) {
              this.authFlowService.setCurrentStep(AuthStep.PASSWORD_SETUP);
              this.router.navigate(['/login/password-setup']);
            } else {
              this.auth.setSession(this.loginData.loginRes()!);
              this.auth.redirect();
            }
          } else {
            this.toaster.error(
              this.transloco.translate('global.wrong_msg.title'),
              'Error',
            );
          }
        },
        error: (err) => {
          this.toaster.showBackendError(err);
        },
      });
    }
  }
}
