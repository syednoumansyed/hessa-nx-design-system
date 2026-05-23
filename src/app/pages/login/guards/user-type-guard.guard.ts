import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import {
  AuthFlowService,
  AuthStep,
} from '@pages/login/services/auth-flow.service';

@Injectable({
  providedIn: 'root',
})
export class FlowStepGuard implements CanActivate {
  constructor(
    private authFlowService: AuthFlowService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const requiredStep = route.data['requiredStep'];
    const allowedFlows = route.data['allowedFlows'];
    const currentState = this.authFlowService.getCurrentState();

    // Special handling for the new flow: language-selection -> welcome -> role-selection

    // Welcome screen access: should have language selected
    if (state.url.includes('welcome')) {
      if (!currentState.selectedLanguage) {
        this.router.navigate(['/login/language-selection']);
        return false;
      }
      return true;
    }

    // Role selection access: should have completed language step (via welcome)
    if (state.url.includes('role-selection')) {
      // Check if language step is completed OR if we have selected language
      const hasLanguage = !!currentState.selectedLanguage;
      const languageCompleted = this.authFlowService.isStepCompleted(
        AuthStep.LANGUAGE_SELECTION,
      );

      if (!hasLanguage && !languageCompleted) {
        this.router.navigate(['/login/language-selection']);
        return false;
      }
      return true;
    }

    // Check if required previous step is completed
    if (requiredStep) {
      const requiredSteps = Array.isArray(requiredStep)
        ? requiredStep
        : [requiredStep];

      // Ensure at least one of the prerequisite steps was completed before accessing this route.
      const hasRequiredStep = requiredSteps.some((step) => {
        const authStep = this.getAuthStep(step);
        const isCompleted = this.authFlowService.isStepCompleted(authStep);
        return isCompleted;
      });

      if (!hasRequiredStep) {
        this.redirectToFirstIncompleteStep();
        return false;
      }
    }

    // Check if current flow type is allowed for this route
    if (allowedFlows && allowedFlows.length > 0) {
      if (
        !currentState.flowType ||
        !allowedFlows.includes(currentState.flowType)
      ) {
        // Redirect to method selection if the user is trying to access a flow they did not choose.
        this.redirectToMethodSelection();
        return false;
      }
    }

    return true;
  }

  /**
   * Convert route step string to AuthStep enum
   */
  private getAuthStep(stepString: string): AuthStep {
    const stepMap: { [key: string]: AuthStep } = {
      'language-selection': AuthStep.LANGUAGE_SELECTION,
      welcome: AuthStep.LANGUAGE_SELECTION, // Welcome is part of language flow
      'role-selection': AuthStep.ROLE_SELECTION,
      'method-selection': AuthStep.METHOD_SELECTION,
      'mobile-entry': AuthStep.MOBILE_ENTRY,
      'otp-entry': AuthStep.OTP_ENTRY,
      'password-entry': AuthStep.PASSWORD_ENTRY,
      'account-selection': AuthStep.ACCOUNT_SELECTION,
      'name-verification': AuthStep.NAME_VERIFICATION,
      'password-setup': AuthStep.PASSWORD_SETUP,
    };

    return stepMap[stepString] || AuthStep.LANGUAGE_SELECTION;
  }

  /**
   * Redirect to the first incomplete step in the flow
   */
  private redirectToFirstIncompleteStep(): void {
    const currentState = this.authFlowService.getCurrentState();

    // Define step order with the new flow
    const stepOrder = [
      { step: AuthStep.LANGUAGE_SELECTION, route: '/login/language-selection' },
      { step: AuthStep.ROLE_SELECTION, route: '/login/role-selection' },
      { step: AuthStep.METHOD_SELECTION, route: '/login/method-selection' },
    ];

    // Find first incomplete step
    for (const { step, route } of stepOrder) {
      if (!this.authFlowService.isStepCompleted(step)) {
        this.router.navigate([route]);
        return;
      }
    }

    // Default fallback
    this.router.navigate(['/login/language-selection']);
  }

  /**
   * Redirect to method selection when flow type validation fails
   */
  private redirectToMethodSelection(): void {
    this.router.navigate(['/login/method-selection']);
  }
}

@Injectable({
  providedIn: 'root',
})
export class UserTypeGuard implements CanActivate {
  constructor(
    private authFlowService: AuthFlowService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const requiredUserType = route.data['requiredUserType'];
    const currentState = this.authFlowService.getCurrentState();

    if (requiredUserType && currentState.userType !== requiredUserType) {
      // Send the user back to role selection so they can pick an allowed profile.
      this.router.navigate(['/login/role-selection']);
      return false;
    }

    return true;
  }
}
