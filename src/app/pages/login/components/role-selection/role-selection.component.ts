import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '../../services/auth-flow.service';
import { MascotContext, MascotSituation } from '../../services/mascot.service';
import { UserType } from '@shared/enums';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { DsActionListConfig } from '@ds/action-list';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeManagerService } from '@shared/services/theme-manager.service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, DsActionListComponent],
  templateUrl: './role-selection.component.html',
})
export class RoleSelectionComponent implements OnInit, OnDestroy {
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly authFlow = inject(AuthFlowService);
  private readonly themeManager = inject(ThemeManagerService);

  selectedRole = signal<UserType | null>(null);
  protected readonly faCircleCheck = faCircleCheck;
  private destroy$ = new Subject<void>();

  config = computed<DsActionListConfig>(() => {
    const selectedRole = this.selectedRole();
    return {
      onItemAction: (item) => {
        if (item.id && selectedRole !== item.id) {
          this.selectRole(item.id as UserType);
        }
      },
      items: [
        {
          title: this.translocoService.translate('login.as_student.txt'),
          bgColor: 'surface-primary',
          id: UserType.STUDENT,
          showActiveBorder: selectedRole === UserType.STUDENT,
          showActiveBg: selectedRole === UserType.STUDENT,
          endIconConfig: {
            disableRtlRotate: true,
            showArrow: true,
            icon: this.faCircleCheck,
            cssClass:
              selectedRole === UserType.STUDENT
                ? 'text-black-0'
                : 'text-neutral-cool-200',
            size: 'xl',
          },
        },
        {
          title: this.translocoService.translate('login.as_guardian.txt'),
          subtitle: 'Manage and monitor students',
          bgColor: 'surface-primary',
          id: UserType.GUARDIAN,
          showActiveBorder: selectedRole === UserType.GUARDIAN,
          showActiveBg: selectedRole === UserType.GUARDIAN,
          endIconConfig: {
            showArrow: true,
            disableRtlRotate: true,
            icon: this.faCircleCheck,
            cssClass:
              selectedRole === UserType.GUARDIAN
                ? 'text-black-0'
                : 'text-neutral-cool-200',
            size: 'xl',
          },
        },
        {
          title: this.translocoService.translate('login.as_personnel.txt'),
          subtitle: 'Access teaching tools',
          bgColor: 'surface-primary',
          id: UserType.PERSONNEL,
          showActiveBorder: selectedRole === UserType.PERSONNEL,
          showActiveBg: selectedRole === UserType.PERSONNEL,
          endIconConfig: {
            showArrow: true,
            icon: this.faCircleCheck,
            disableRtlRotate: true,
            cssClass:
              selectedRole === UserType.PERSONNEL
                ? 'text-black-0'
                : 'text-neutral-cool-200',
            size: 'xl',
          },
        },
      ],
    };
  });

  ngOnInit(): void {
    this.authFlow.dispatch({ type: 'ROLE_STEP' });
    this.authFlow.setCurrentStep(AuthStep.ROLE_SELECTION);
    this.authFlow.setCanContinue(false);

    // Listen for continue button clicks
    this.authFlow.continue$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.handleContinue();
    });

    const state = this.authFlow.getCurrentState();
    if (state.userType) this.selectRole(state.userType);
    this.authFlow.setCanContinue(this.selectedRole() !== null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private selectRole(roleType: UserType): void {
    this.selectedRole.set(roleType);
    this.authFlow.setUserType(roleType);
    // Enable continue button when role is selected
    this.authFlow.setCanContinue(true);
    // Update mascot to show success
    this.authFlow.dispatch({
      type: 'CUSTOM',
      message: this.translocoService.translate('login.choose_role.txt'),
      situation: MascotSituation.SUCCESS,
      context: MascotContext.ROLE_SELECTION,
    });
  }

  private handleContinue(): void {
    const selectedRole = this.selectedRole();
    if (selectedRole) {
      if (
        selectedRole === UserType.STUDENT ||
        selectedRole === UserType.GUARDIAN
      ) {
        this.themeManager.setStudent();
        // Mark current step as completed and navigate
        this.authFlow.setCurrentStep(AuthStep.METHOD_SELECTION);
        this.router.navigate(['/login/method-selection']);
      } else {
        this.themeManager.setStudent();
        this.authFlow.setFlowType(FlowType.OTP_LOGIN);
        this.authFlow.setCurrentStep(AuthStep.MOBILE_ENTRY);
        this.router.navigate(['/login/mobile-entry']);
      }
    }
  }
}
