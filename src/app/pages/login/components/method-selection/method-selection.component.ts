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
import {
  DsActionListConfig,
  DsActionListItemConfig,
  DsActionListItemSupportingTextConfig,
} from '@ds/action-list';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MethodOption {
  id: string;
  flowType: FlowType;
  title: string;
  supportingText: string;
  available: boolean;
}

@Component({
  selector: 'app-method-selection',
  standalone: true,
  imports: [CommonModule, DsActionListComponent],
  templateUrl: './method-selection.component.html',
})
export class MethodSelectionComponent implements OnInit, OnDestroy {
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);

  selectedMethod = signal<FlowType | null>(null);
  methods = signal<MethodOption[]>([]);
  protected readonly faCircleCheck = faCircleCheck;
  private destroy$ = new Subject<void>();

  // Build config with correct item shape
  config = computed<DsActionListConfig>(() => {
    const selectedMethod = this.selectedMethod();
    const methods = this.methods();

    return {
      onItemAction: (item: DsActionListItemConfig) => {
        if (item.id && selectedMethod !== (item.id as FlowType)) {
          const method = methods.find((m) => m.flowType === item.id);
          if (method && method.available) {
            this.selectMethod(method);
          }
        }
      },
      items: methods.map<DsActionListItemConfig>((method) => {
        const supportingTextConfig: DsActionListItemSupportingTextConfig = {
          // Adjust keys according to actual library type definition
          text: method.supportingText,
        };
        return {
          id: method.flowType,
          title: method.title,
          supportingText: supportingTextConfig,
          showActiveBorder: selectedMethod === method.flowType,
          bgColor: 'surface-primary',
          showActiveBg: selectedMethod === method.flowType,
          endIconConfig: {
            disableRtlRotate: true,
            showArrow: true,
            icon: this.faCircleCheck,
            size: 'xl',
            cssClass:
              method.flowType === selectedMethod
                ? 'text-black-0'
                : 'text-neutral-cool-200',
          },
        };
      }),
    };
  });

  ngOnInit(): void {
    this.initializeMethods();
    this.authFlowService.dispatch({ type: 'METHOD_STEP' });
    this.authFlowService.setCurrentStep(AuthStep.METHOD_SELECTION);
    this.authFlowService.setCanContinue(false);

    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleContinue());

    const currentState = this.authFlowService.getCurrentState();
    if (currentState.flowType) {
      this.selectedMethod.set(currentState.flowType);
    }
    this.authFlowService.setCanContinue(this.selectedMethod() !== null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMethods(): void {
    const userType = this.authFlowService.getCurrentState().userType;

    this.methods.set(
      userType === UserType.STUDENT
        ? [
            {
              id: 'mobile-otp',
              flowType: FlowType.OTP_LOGIN,
              title: this.translocoService.translate(
                'login.use_guardian_number.title',
              ),
              supportingText: this.translocoService.translate(
                'login.use_mobile_otp.txt',
              ),
              available: true,
            },
            {
              id: 'password',
              flowType: FlowType.PASSWORD_LOGIN,
              title: this.translocoService.translate(
                'login.with_password.title',
              ),
              supportingText: this.translocoService.translate(
                'login.using_national_id.txt',
              ),
              available: true,
            },
            {
              id: 'setup-account',
              flowType: FlowType.ONBOARDING,
              title: this.translocoService.translate(
                'login.setup_my_account.title',
              ),
              supportingText: this.translocoService.translate(
                'login.first_time_setup_my_account.txt',
              ),
              available: true,
            },
          ]
        : [
            {
              id: 'mobile-otp-guardian',
              flowType: FlowType.OTP_LOGIN,
              title: this.translocoService.translate('login.wanna_login.txt'),
              supportingText: this.translocoService.translate(
                'login.use_mobile_otp.txt',
              ),
              available: true,
            },
            {
              id: 'setup-account-guardian',
              flowType: FlowType.ONBOARDING,
              title: this.translocoService.translate(
                'login.setup_for_kids.txt',
              ),
              supportingText: this.translocoService.translate(
                'login.via_mobile_OTP.txt',
              ),
              available: true,
            },
          ],
    );

    if (userType === UserType.PERSONNEL) {
      this.methods.update((list) =>
        list.map((m) =>
          m.id === 'mobile-otp' ? { ...m, available: false } : m,
        ),
      );
    }
  }

  private selectMethod(selectedMethodOption: MethodOption): void {
    if (!selectedMethodOption.available) return;
    this.selectedMethod.set(selectedMethodOption.flowType);
    this.authFlowService.setFlowType(selectedMethodOption.flowType);
    this.authFlowService.setCanContinue(true);
    let context = MascotContext.METHOD_SELECTION_OTP;
    if (selectedMethodOption.flowType !== FlowType.OTP_LOGIN)
      context =
        selectedMethodOption.flowType === FlowType.PASSWORD_LOGIN
          ? MascotContext.PASSWORD_ENTRY
          : MascotContext.METHOD_SELECTION_SETUP;
    this.authFlowService.dispatch({
      type: 'CUSTOM',
      message: this.translocoService.translate('login.choose_login_type.title'),
      situation: MascotSituation.SUCCESS,
      context,
    });
  }

  private handleContinue(): void {
    const selectedMethod = this.selectedMethod();
    if (!selectedMethod) return;

    this.authFlowService.dispatch({
      type: 'CUSTOM',
      message: 'Setting up your login method...',
      situation: MascotSituation.WAITING,
      context: MascotContext.METHOD_SELECTION,
    });

    switch (selectedMethod) {
      case FlowType.OTP_LOGIN:
      case FlowType.ONBOARDING:
        this.authFlowService.setCurrentStep(AuthStep.MOBILE_ENTRY);
        this.router.navigate(['/login/mobile-entry']);
        break;
      case FlowType.PASSWORD_LOGIN:
        this.authFlowService.setCurrentStep(AuthStep.PASSWORD_ENTRY);
        this.router.navigate(['/login/password-entry']);
        break;
      default:
        // Prevent navigation if an unexpected method slips through the UI state.
        this.authFlowService.setCanContinue(false);
        this.authFlowService.dispatch({
          type: 'CUSTOM',
          message: 'The selected login method is not available right now.',
          situation: MascotSituation.WARNING,
          context: MascotContext.METHOD_SELECTION,
        });
    }
  }
}
