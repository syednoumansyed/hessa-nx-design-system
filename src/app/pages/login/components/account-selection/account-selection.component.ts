import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '@pages/login/services/auth-flow.service';
import {
  MascotContext,
  MascotSituation,
} from '@pages/login/services/mascot.service';
import { UserType } from '@shared/enums';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import {
  DsActionListConfig,
  DsActionListItemSupportingTextConfig,
} from '@ds/action-list';
import { faUser } from '@fortawesome/pro-regular-svg-icons';
import { AuthService } from '@auth/auth.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { UserProfile } from '../../../../auth/model';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-account-selection',
  standalone: true,
  imports: [DsActionListComponent, TranslocoPipe],
  templateUrl: './account-selection.component.html',
})
export class AccountSelectionComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);
  private readonly loginDataService = inject(LoginDataService);
  private readonly authService = inject(AuthService);
  private readonly toaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);

  private destroy$ = new Subject<void>();
  protected readonly faCheck = faCircleCheck;
  protected readonly faUser = faUser;

  selectedRole = computed(() => {
    const userType = this.authFlowService.getCurrentState().userType;
    if (userType) {
      return this.getUserTypeLabel(userType);
    }
    return '';
  });

  // Get users from loginDataService, filtered by current userType rules
  filteredUsers = computed(() => {
    const allUsers = this.loginDataService.users();
    const currentUserType = this.authFlowService.getCurrentState().userType;
    const currentFlowType = this.authFlowService.getCurrentState().flowType;

    // Account setup (onboarding) should only show student profiles
    if (currentFlowType === FlowType.ONBOARDING) {
      return allUsers.filter((u) => u.type === UserType.STUDENT);
    }

    if (currentUserType === UserType.GUARDIAN) {
      // Guardian can see Guardian and Student
      return allUsers.filter(
        (u) => u.type === UserType.GUARDIAN || u.type === UserType.STUDENT,
      );
    }
    // Others can only see their own type
    return allUsers.filter((u) => u.type === currentUserType);
  });

  isSelectedRoleNotAvailable = computed(
    () => this.filteredUsers().length === 0,
  );

  users = computed(() => {
    const filteredUsers = this.filteredUsers();
    if (filteredUsers.length === 0) {
      return this.loginDataService.users();
    }
    return filteredUsers;
  });

  config = computed<DsActionListConfig>(() => {
    const users = this.users();
    const selectedAccount = this.authFlowService.selectedAccount();
    if (users.length === 0) {
      return {
        items: [],
      };
    }

    return {
      onItemAction: (item) => {
        if (item.id) {
          // Convert id to string first, then parse the combined userId-type identifier
          const idStr = String(item.id);
          const [userIdStr, userType] = idStr.split('-');
          const userId = Number(userIdStr);
          const user = users.find(
            (u) => u.userId === userId && u.type === userType,
          );
          if (user) {
            // Check if the selected user is different by comparing both userId and type
            const isAlreadySelected =
              selectedAccount?.userId === user.userId &&
              selectedAccount?.type === user.type;
            if (!isAlreadySelected) {
              this.selectAccount(user);
            }
          }
        }
      },

      items: users.map((user) => {
        const supportingTextConfig: DsActionListItemSupportingTextConfig = {
          // Adjust keys according to actual library type definition
          text: this.transloco.translate('enum.' + user.type),
        };
        return {
          title: user.displayName ?? '',
          subtitle: this.getUserTypeLabel(user.type),
          id: `${user.userId}-${user.type}`, // Create unique identifier combining userId and type
          supportingText: supportingTextConfig,
          showActiveBorder:
            selectedAccount?.userId === user.userId &&
            selectedAccount?.type === user.type,
          showActiveBg:
            selectedAccount?.userId === user.userId &&
            selectedAccount?.type === user.type,
          bgColor: 'surface-primary',
          startIconConfig: {
            icon: this.faUser,
            size: 'xl',
            bgColor: this.getIconBgColor(user.type),
            iconColor: 'white',
          },
          endIconConfig: {
            showArrow: true,
            icon: this.faCheck,
            disableRtlRotate: true,
            size: 'xl',
            cssClass:
              selectedAccount?.userId === user.userId &&
              selectedAccount?.type === user.type
                ? 'text-black-0'
                : 'text-neutral-cool-200',
          },
          customContent: {
            initials: this.getInitials(user.displayName),
            role: this.getUserTypeLabel(user.type),
          },
        };
      }),
    };
  });

  ngOnInit(): void {
    this.setupMascot();
    this.authFlowService.setCurrentStep(AuthStep.ACCOUNT_SELECTION);
    // Listen for continue button clicks
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleContinue();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMascot(): void {
    this.authFlowService.dispatch({ type: 'ACCOUNT_STEP' });
  }

  private selectAccount(user: UserProfile): void {
    if (user.status !== 'ACTIVE') {
      this.router.navigate(['/login/no-access', user?.status?.toLowerCase()]);
      return;
    }
    this.authFlowService.dispatch({
      type: 'CUSTOM',
      message: this.transloco.translate(
        'login.select_account_to_proceed.title',
      ),
      situation: MascotSituation.SUCCESS,
      context: MascotContext.ACCOUNT_SELECTION,
    });
    this.authFlowService.setCanContinue(false);
    this.loginDataService.showButtonLoading.set(true);
    this.authFlowService.setSelectedAccount(user);
    this.loginDataService.user.set(user);
    // Immediately verify OTP once a profile is chosen so the server knows which
    // account we intend to access before moving forward in the flow.
    this.authService
      .verifyOtp(
        {
          channel: this.loginDataService.otpChannel(),
          phoneNumber: this.loginDataService.mobileNumber() ?? '',
          code: this.loginDataService.otp() ?? '',
          selectedProfile:
            this.authFlowService.selectedAccountAsPayload() ?? null,
        },
        this.loginDataService.tempAuthHeaders()!,
      )
      ?.subscribe({
        next: (res) => {
          // Persist the verification response to keep the rest of the flow in sync.
          if (res.success) {
            this.loginDataService.loginRes.set(res);
            this.loginDataService
              .loadAccountDetails()
              ?.pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.loginDataService.showButtonLoading.set(false);
                  this.authFlowService.setCanContinue(true);
                },
                error: (err) => {
                  this.loginDataService.showButtonLoading.set(false);
                  this.toaster.showBackendError(err);
                },
              });
          } else {
            this.loginDataService.showButtonLoading.set(false);
            this.toaster.error(
              this.transloco.translate('global.wrong_msg.title'),
            );
          }
        },
        error: (err) => {
          this.loginDataService.showButtonLoading.set(false);
          this.toaster.showBackendError(err);
        },
      });
  }

  private handleContinue(): void {
    const selectedAccount = this.authFlowService.selectedAccount();
    if (!selectedAccount) return;
    if (this.loginDataService.isNameSetupRequired()) {
      this.authFlowService.setCurrentStep(AuthStep.NAME_VERIFICATION);
      this.router.navigate(['/login/name-verification']);
    } else {
      if (this.loginDataService.isPasswordSetupRequired()) {
        this.authFlowService.setCurrentStep(AuthStep.PASSWORD_SETUP);
        this.router.navigate(['/login/password-setup']);
      } else {
        this.authService.setSession(this.loginDataService.loginRes()!);
        this.authService.redirect();
      }
    }
  }

  private getUserTypeLabel(type: UserType): string {
    switch (type) {
      case UserType.STUDENT:
        return this.transloco.translate('global.student.txt');
      case UserType.GUARDIAN:
        return this.transloco.translate('global.linked_guardians.placeholder');
      case UserType.PERSONNEL:
        return this.transloco.translate('global.personnel.txt');
      default:
        return 'User';
    }
  }

  private getIconBgColor(type: UserType): string {
    switch (type) {
      case UserType.STUDENT:
        return 'bg-blue-500';
      case UserType.GUARDIAN:
        return 'bg-green-500';
      case UserType.PERSONNEL:
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
