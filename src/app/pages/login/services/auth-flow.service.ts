import { computed, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, map, Subject } from 'rxjs';
import {
  MascotContext,
  MascotService,
  MascotSituation,
} from '@pages/login/services/mascot.service';
import { UserType } from '@shared/enums';
import { UserProfile } from '@auth/model';
import { TranslocoService } from '@jsverse/transloco';

export enum AuthStep {
  LANGUAGE_SELECTION = 'language_selection',
  ROLE_SELECTION = 'role_selection',
  METHOD_SELECTION = 'method_selection',
  MOBILE_ENTRY = 'mobile_entry',
  OTP_ENTRY = 'otp_entry',
  PASSWORD_ENTRY = 'password_entry',
  ACCOUNT_SELECTION = 'account_selection',
  NAME_VERIFICATION = 'name_verification',
  PASSWORD_SETUP = 'password_setup',
  SUCCESS = 'success',
}

export enum FlowType {
  OTP_LOGIN = 'otp',
  PASSWORD_LOGIN = 'password',
  FORGOT_PASSWORD = 'forgot',
  ONBOARDING = 'setup',
  GUARDIAN_FLOW = 'guardian',
}

export type FlowEvent =
  | { type: 'LANGUAGE_STEP' }
  | { type: 'LANGUAGE_PICKED'; name: string }
  | { type: 'ROLE_STEP' }
  | { type: 'METHOD_STEP' }
  | { type: 'MOBILE_STEP' }
  | { type: 'OTP_INIT'; phone: string }
  | { type: 'OTP_ERROR'; reason?: 'wrong' | 'expired' }
  | { type: 'OTP_SUCCESS' }
  | { type: 'PASSWORD_STEP' }
  | { type: 'PASSWORD_ERROR' }
  | { type: 'SETUP_PASSWORD_STEP' }
  | { type: 'ACCOUNT_STEP' }
  | { type: 'NAME_VERIFY_STEP' }
  | { type: 'CONTACT_ADMIN_STEP' }
  | { type: 'LOGIN_SUCCESS' }
  | {
      type: 'CUSTOM';
      message?: string;
      situation?: MascotSituation;
      imagePath?: string;
      animate?: boolean;
      context?: MascotContext;
    };

export interface AuthFlowState {
  currentStep: AuthStep;
  flowType: FlowType | null;
  userType: UserType | null;
  selectedLanguage: string | null;
  mobileNumber: string | null;
  nationalId: string | null;
  selectedAccount: any | null;
  completedSteps: AuthStep[];
  data: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthFlowService {
  private flowStateSubject = new BehaviorSubject<AuthFlowState>({
    currentStep: AuthStep.LANGUAGE_SELECTION,
    flowType: null,
    userType: null,
    selectedLanguage: null,
    mobileNumber: null,
    nationalId: null,
    selectedAccount: null,
    completedSteps: [],
    data: {},
  });

  private mascot = inject(MascotService);
  private transloco = inject(TranslocoService);

  private readonly _skipButton = signal(false);
  skipButton = computed(() => this._skipButton());

  // Public observables
  public flowState$ = this.flowStateSubject.asObservable();
  public currentStep$ = this.flowStateSubject
    .asObservable()
    .pipe(map((state) => state.currentStep));
  public flowType$ = this.flowStateSubject
    .asObservable()
    .pipe(map((state) => state.flowType));
  public userType$ = this.flowStateSubject
    .asObservable()
    .pipe(map((state) => state.userType));

  private _canContinue = new BehaviorSubject<boolean>(false);
  canContinue$ = this._canContinue.asObservable();

  private readonly _selectedAccount = signal<UserProfile | null>(null);
  public selectedAccount = this._selectedAccount.asReadonly();
  public selectedAccountAsPayload = computed(() => {
    // Remove displayName property from payload
    const account = this._selectedAccount();
    if (account) {
      const { displayName, ...payload } = account;
      return payload;
    }
    return null;
  });

  givenName = signal<string | null>(null);

  private continueSubject = new Subject<void>();
  continue$ = this.continueSubject.asObservable();

  private skipSubject = new Subject<void>();
  skipStep$ = this.skipSubject.asObservable();

  showMascot = signal(true);

  triggerContinue(): void {
    this.continueSubject.next();
  }

  triggerSkipStep() {
    this.skipSubject.next();
  }

  setMascotVisibility(visible: boolean) {
    this.showMascot.set(visible);
  }

  setSkipButtonVisibility(visible: boolean) {
    this._skipButton.set(visible);
  }

  setCanContinue(v: boolean) {
    this._canContinue.next(v);
  }
  resetMascot() {
    this.mascot.reset();
  }

  constructor() {}

  // Helper to generate mascot image path
  private mascotImagePath(
    context: MascotContext,
    situation: MascotSituation,
  ): string {
    return `assets/mascot/${context}-${situation}.svg`;
  }

  dispatch(e: FlowEvent) {
    switch (e.type) {
      case 'LANGUAGE_STEP':
        // scenario exists in mascotConfigurations
        return this.mascot.updateMascotByScenario('language_selection');

      case 'LANGUAGE_PICKED':
        // micro-feedback; do not pass imagePath/animate
        this.setCanContinue(true);
        return this.mascot.updateMascot({
          context: MascotContext.LANGUAGE_SELECTION,
          situation: MascotSituation.SUCCESS,
          message: this.transloco.translate('global.choose_language.txt'),
        });

      case 'ROLE_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('role_selection');

      case 'METHOD_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('method_selection');

      case 'MOBILE_STEP':
        return this.mascot.updateMascot({
          context: MascotContext.MOBILE_ENTRY,
          situation: MascotSituation.INSTRUCTION,
          message:
            this.getCurrentState().userType === UserType.STUDENT
              ? this.transloco.translate(
                  'login.enter_mobile_number_title.title',
                )
              : this.transloco.translate('login.enter_your_mobile.title'),
        });
      case 'OTP_INIT':
        // scenario exists and supports {{number}} param
        return this.mascot.updateMascotByScenario('otp_entry', undefined, {
          number: e.phone,
        });

      case 'OTP_ERROR':
        if (e.reason === 'wrong') {
          return this.mascot.updateMascot({
            context: MascotContext.OTP_ERROR,
            situation: MascotSituation.ERROR,
            message: this.transloco.translate('login.enter_correct_otp.title'),
          });
        }
        // scenario exists
        return this.mascot.updateMascotByScenario('otp_error');

      case 'OTP_SUCCESS':
        // success within the OTP entry route
        return this.mascot.updateMascot({
          context: MascotContext.OTP_ENTRY,
          situation: MascotSituation.SUCCESS,
          message: '',
        });

      case 'PASSWORD_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('password_entry');

      case 'PASSWORD_ERROR':
        // scenario exists
        return this.mascot.updateMascotByScenario('password_error');

      case 'SETUP_PASSWORD_STEP':
        return this.mascot.updateMascot({
          context: MascotContext.SETUP_PASSWORD,
          situation: MascotSituation.INSTRUCTION,
          message: this.transloco.translate('login.add_password.title', {
            national_id: this.getCurrentState().nationalId,
          }),
        });

      case 'ACCOUNT_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('account_selection');

      case 'NAME_VERIFY_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('name_verification');

      case 'CONTACT_ADMIN_STEP':
        // scenario exists
        return this.mascot.updateMascotByScenario('contact_admin');

      case 'LOGIN_SUCCESS':
        // scenario exists
        return this.mascot.updateMascotByScenario('login_success');

      case 'CUSTOM':
        // freeform override; ONLY use fields that exist in MascotConfig
        return this.mascot.updateMascot({
          context: e.context,
          situation: e.situation ?? MascotSituation.DEFAULT,
          message: e.message ?? '',
        });
    }
  }

  /**
   * Get current flow state
   */
  getCurrentState(): AuthFlowState {
    return this.flowStateSubject.value;
  }

  /**
   * Update flow state
   */
  updateState(updates: Partial<AuthFlowState>): void {
    const currentState = this.flowStateSubject.value;
    const newState: AuthFlowState = {
      ...currentState,
      ...updates,
    };
    this.flowStateSubject.next(newState);
  }

  /**
   * Set current step and mark previous as completed
   */
  setCurrentStep(step: AuthStep): void {
    const currentState = this.getCurrentState();
    const completedSteps = [...currentState.completedSteps];

    // Add current step to completed if not already there
    if (
      currentState.currentStep &&
      !completedSteps.includes(currentState.currentStep)
    ) {
      completedSteps.push(currentState.currentStep);
    }

    this.updateState({
      currentStep: step,
      completedSteps,
    });
  }

  /**
   * Set flow type based on user selection
   */
  setFlowType(flowType: FlowType): void {
    this.updateState({ flowType });
  }

  /**
   * Set user type (student, guardian, personnel)
   */
  setUserType(userType: UserType): void {
    this.updateState({ userType });
    this.mascot.setUserType(userType);
  }

  /**
   * Set selected language
   */
  setLanguage(language: string): void {
    this.updateState({ selectedLanguage: language });
  }

  /**
   * Set mobile number
   */
  setMobileNumber(mobileNumber: string): void {
    this.updateState({ mobileNumber });
  }

  /**
   * Set national ID
   */
  setNationalId(nationalId: string): void {
    this.updateState({ nationalId });
  }

  /**
   * Set selected account
   */
  public setSelectedAccount(account: any): void {
    this._selectedAccount.set(account);
    this.updateState({ selectedAccount: account });
  }

  /**
   * Store arbitrary data in flow state
   */
  setData(key: string, value: any): void {
    const currentState = this.getCurrentState();
    const newData = { ...currentState.data, [key]: value };
    this.updateState({ data: newData });
  }

  /**
   * Get data from flow state
   */
  getData(key: string): any {
    return this.getCurrentState().data[key];
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(step: AuthStep): boolean {
    return this.getCurrentState().completedSteps.includes(step);
  }

  /**
   * Get next step based on current flow and step
   */
  getNextStep(): AuthStep | null {
    const state = this.getCurrentState();
    const { currentStep, flowType, userType } = state;

    switch (currentStep) {
      case AuthStep.LANGUAGE_SELECTION:
        return AuthStep.ROLE_SELECTION;

      case AuthStep.ROLE_SELECTION:
        // For guardian, they might have additional flows
        if (userType === UserType.GUARDIAN) {
          return AuthStep.METHOD_SELECTION;
        }
        return AuthStep.METHOD_SELECTION;

      case AuthStep.METHOD_SELECTION:
        if (
          flowType === FlowType.OTP_LOGIN ||
          flowType === FlowType.ONBOARDING ||
          flowType === FlowType.FORGOT_PASSWORD
        ) {
          return AuthStep.MOBILE_ENTRY;
        } else if (flowType === FlowType.PASSWORD_LOGIN) {
          return AuthStep.PASSWORD_ENTRY;
        }
        return null;

      case AuthStep.MOBILE_ENTRY:
        return AuthStep.OTP_ENTRY;

      case AuthStep.OTP_ENTRY:
        return AuthStep.ACCOUNT_SELECTION;

      case AuthStep.PASSWORD_ENTRY:
        return AuthStep.NAME_VERIFICATION;

      case AuthStep.ACCOUNT_SELECTION:
        if (
          flowType === FlowType.ONBOARDING ||
          flowType === FlowType.FORGOT_PASSWORD
        ) {
          return AuthStep.PASSWORD_SETUP;
        }
        return AuthStep.NAME_VERIFICATION;

      case AuthStep.NAME_VERIFICATION:
        return AuthStep.SUCCESS;

      case AuthStep.PASSWORD_SETUP:
        return AuthStep.SUCCESS;

      default:
        return null;
    }
  }

  /**
   * Get previous step
   */
  getPreviousStep(): AuthStep | null {
    const completedSteps = this.getCurrentState().completedSteps;
    return completedSteps.length > 0
      ? completedSteps[completedSteps.length - 1]
      : null;
  }

  /**
   * Navigate to next step
   */
  goToNextStep(): AuthStep | null {
    const nextStep = this.getNextStep();
    if (nextStep) {
      this.setCurrentStep(nextStep);
    }
    return nextStep;
  }

  /**
   * Navigate to previous step
   */
  goToPreviousStep(): AuthStep | null {
    const previousStep = this.getPreviousStep();
    if (previousStep) {
      // Remove the previous step from completedSteps since we're navigating back to it
      // (it's no longer "completed" — it becomes the active step again)
      const currentState = this.getCurrentState();
      const completedSteps = currentState.completedSteps.filter(
        (step) => step !== previousStep,
      );

      this.updateState({
        currentStep: previousStep,
        completedSteps,
      });
    }
    return previousStep;
  }

  /**
   * Reset flow state to initial values
   */
  resetFlow(): void {
    this._skipButton.set(false);
    this.flowStateSubject.next({
      currentStep: AuthStep.LANGUAGE_SELECTION,
      flowType: null,
      userType: null,
      selectedLanguage: null,
      mobileNumber: null,
      nationalId: null,
      selectedAccount: null,
      completedSteps: [],
      data: {},
    });
  }

  /**
   * Validate if current step can be completed with current data
   */
  canCompleteCurrentStep(): boolean {
    const state = this.getCurrentState();

    switch (state.currentStep) {
      case AuthStep.LANGUAGE_SELECTION:
        return !!state.selectedLanguage;

      case AuthStep.ROLE_SELECTION:
        return !!state.userType;

      case AuthStep.METHOD_SELECTION:
        return !!state.flowType;

      case AuthStep.MOBILE_ENTRY:
        return !!state.mobileNumber && state.mobileNumber.length >= 10;

      case AuthStep.OTP_ENTRY:
        return !!state.data['otp'] && state.data['otp'].length === 4;

      case AuthStep.PASSWORD_ENTRY:
        return !!state.nationalId && !!state.data['password'];

      case AuthStep.ACCOUNT_SELECTION:
        return !!state.selectedAccount;

      case AuthStep.NAME_VERIFICATION:
        return !!state.data['firstName'];

      case AuthStep.PASSWORD_SETUP:
        return (
          !!state.data['newPassword'] && state.data['newPassword'].length >= 8
        );

      default:
        return true;
    }
  }

  /**
   * Get flow completion percentage
   */
  getCompletionPercentage(): number {
    const totalSteps = this.getTotalStepsForFlow();
    const completedSteps = this.getCurrentState().completedSteps.length + 1; // +1 for current step
    return Math.min((completedSteps / totalSteps) * 100, 100);
  }

  /**
   * Get total steps for current flow type
   */
  private getTotalStepsForFlow(): number {
    const flowType = this.getCurrentState().flowType;

    switch (flowType) {
      case FlowType.OTP_LOGIN:
        return 6; // language, role, method, mobile, otp, account
      case FlowType.PASSWORD_LOGIN:
        return 4; // language, role, method, password
      case FlowType.ONBOARDING:
        return 7; // language, role, method, mobile, otp, account, setup
      case FlowType.GUARDIAN_FLOW:
        return 6; // Similar to OTP but might have variations
      default:
        return 4;
    }
  }
}
