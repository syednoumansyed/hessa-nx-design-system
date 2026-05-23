import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  HostListener,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from './services/auth-flow.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MascotComponent } from './components/mascot/mascot.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { TranslocoService } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { isMobile } from '@utils/platform';
import { LoginDataService } from '@pages/login/services/login-data.service';

interface ProgressStep {
  authStep: AuthStep;
  label: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-login-shell',
  standalone: true,
  imports: [RouterOutlet, MascotComponent, DsButtonComponent, NgClass],
  templateUrl: './login-shell.page.html',
})
export class LoginShellComponent implements OnInit, OnDestroy {
  private authFlowService = inject(AuthFlowService);
  private router = inject(Router);
  private loginData = inject(LoginDataService);
  private translocoService = inject(TranslocoService);
  canGoBack = signal(false);
  canContinue = signal(false);
  showFooter = signal(false);
  showHeader = signal(false);
  progressPercentage = signal(0);
  progressSteps = signal<ProgressStep[]>([]);
  showMascot = this.authFlowService.showMascot;
  isSkipButtonVisible = this.authFlowService.skipButton;
  isMobile = isMobile();
  showButtonLoading = this.loginData.showButtonLoading.asReadonly();
  continueLabel = signal('');
  previousLabel = signal('');
  skipLabel = signal('');

  private destroy$ = new Subject<void>();
  private routeHistory: string[] = [];

  constructor() {}

  ngOnInit(): void {
    // Mirror the continue button state from the flow service into the shell UI.
    this.authFlowService.canContinue$.subscribe((v) => {
      this.canContinue.set(v);
    });

    this.translocoService
      .selectTranslate('login.continue.btn')
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.continueLabel.set(val));

    this.translocoService
      .selectTranslate('global.previous.btn')
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.previousLabel.set(val));

    this.translocoService
      .selectTranslate('login.skip.btn')
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.skipLabel.set(val));

    this.initializeProgress();
    this.listenToRouteChanges();
    this.listenToFlowProgress();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize progress steps based on flow type
   */
  private initializeProgress(): void {
    // Default steps - will be updated based on flow type
    this.progressSteps.set([
      {
        authStep: AuthStep.LANGUAGE_SELECTION,
        label: 'Language',
        completed: false,
        active: false,
      },
      {
        authStep: AuthStep.ROLE_SELECTION,
        label: 'Role',
        completed: false,
        active: false,
      },
      {
        authStep: AuthStep.METHOD_SELECTION,
        label: 'Method',
        completed: false,
        active: false,
      },
      {
        authStep: AuthStep.SUCCESS,
        label: 'Complete',
        completed: false,
        active: false,
      },
    ]);
  }

  /**
   * Listen to route changes to update the back button and progress
   */
  private listenToRouteChanges(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        const isSkipAllowed = this.router.url === '/login/password-setup';
        this.authFlowService.setSkipButtonVisibility(isSkipAllowed);
        // ✅ prevent duplicates in routeHistory
        if (this.routeHistory[this.routeHistory.length - 1] !== url) {
          this.routeHistory.push(url);
        }

        this.updateNavigationState(url);
      });
  }

  /**
   * Listen to auth flow progress updates
   */
  private listenToFlowProgress(): void {
    this.authFlowService.currentStep$
      .pipe(takeUntil(this.destroy$))
      .subscribe((step: AuthStep) => {
        this.updateProgress(step);
      });

    this.authFlowService.flowType$
      .pipe(takeUntil(this.destroy$))
      .subscribe((flowType: FlowType | null) => {
        if (flowType) {
          this.updateProgressStepsForFlow(flowType);
        }
      });
  }

  /**
   * Update navigation state based on current route
   */

  private updateNavigationState(currentUrl: string): void {
    const isFirstScreen = currentUrl.includes('language-selection');
    const hasHistory = this.routeHistory.length > 1;
    const canGo = hasHistory && !isFirstScreen;

    this.canGoBack.set(canGo);
    this.showFooter.set(this.shouldShowFooter(currentUrl));
    this.showHeader.set(this.shouldShowHeader(currentUrl));

    // NEW: control mascot visibility per route on every nav
    this.authFlowService.setMascotVisibility(this.shouldShowMascot(currentUrl));
  }

  private shouldShowMascot(url: string): boolean {
    // Hide mascot only on these routes (adjust as needed)
    const hideOn: string[] = [
      '/login/help',
      '/login/welcome',
      '/login/no-access/paused',
      '/login/no-access/inactive',
      '/login/success',
    ];
    return !hideOn.some((route) => url.includes(route));
  }

  private shouldShowFooter(url: string): boolean {
    // Show footer on language-selection only when user navigated back (language already selected)
    if (url.includes('/login/language-selection')) {
      return !!this.authFlowService.getCurrentState().selectedLanguage;
    }

    const exceptionRoutes = [
      '/login/no-access/paused',
      '/login/no-access/inactive',
      '/login/help',
      '/login/contact',
      '/login/success',
    ];
    return !exceptionRoutes.some((route) => url.includes(route));
  }

  private shouldShowHeader(url: string): boolean {
    // Exception routes where footer should be hidden
    const exceptionRoutes = [
      '/login/language-selection',
      '/login/no-access/paused',
      '/login/no-access/inactive',
    ];
    const shouldShow = !exceptionRoutes.some((route) => url.includes(route));
    return shouldShow;
  }

  /**
   * Update progress steps based on flow type
   */
  private updateProgressStepsForFlow(flowType: FlowType): void {
    switch (flowType) {
      case FlowType.OTP_LOGIN:
        this.progressSteps.set([
          {
            authStep: AuthStep.LANGUAGE_SELECTION,
            label: 'Language',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.ROLE_SELECTION,
            label: 'Role',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.METHOD_SELECTION,
            label: 'Method',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.MOBILE_ENTRY,
            label: 'Mobile',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.OTP_ENTRY,
            label: 'OTP',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.ACCOUNT_SELECTION,
            label: 'Account',
            completed: false,
            active: false,
          },
        ]);
        break;

      case FlowType.PASSWORD_LOGIN:
        this.progressSteps.set([
          {
            authStep: AuthStep.LANGUAGE_SELECTION,
            label: 'Language',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.ROLE_SELECTION,
            label: 'Role',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.METHOD_SELECTION,
            label: 'Method',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.PASSWORD_ENTRY,
            label: 'Password',
            completed: false,
            active: false,
          },
        ]);
        break;

      case FlowType.ONBOARDING:
        this.progressSteps.set([
          {
            authStep: AuthStep.LANGUAGE_SELECTION,
            label: 'Language',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.ROLE_SELECTION,
            label: 'Role',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.METHOD_SELECTION,
            label: 'Method',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.MOBILE_ENTRY,
            label: 'Mobile',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.OTP_ENTRY,
            label: 'OTP',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.ACCOUNT_SELECTION,
            label: 'Account',
            completed: false,
            active: false,
          },
          {
            authStep: AuthStep.PASSWORD_SETUP,
            label: 'Setup',
            completed: false,
            active: false,
          },
        ]);
        break;

      default:
        this.initializeProgress();
    }

    // Recalculate progress after updating steps
    const currentStep = this.authFlowService.getCurrentState().currentStep;
    if (
      this.authFlowService.getCurrentState().currentStep === AuthStep.SUCCESS
    ) {
      this.progressPercentage.set(100);
    } else {
      this.updateProgress(currentStep);
    }
  }

  /**
   * Update progress based on current step
   */
  private updateProgress(currentStep: AuthStep): void {
    const steps = this.progressSteps();
    const stepIndex = steps.findIndex((s) => s.authStep === currentStep);

    if (stepIndex !== -1) {
      const updated = steps.map((s, idx) => ({
        ...s,
        completed: idx < stepIndex,
        active: idx === stepIndex,
      }));

      this.progressSteps.set(updated);
      const percentage = Math.round(((stepIndex + 1) / steps.length) * 100);
      this.progressPercentage.set(percentage);
    } else {
      // Fallback to auth flow service calculation
      const percentage = this.authFlowService.getCompletionPercentage();
      this.progressPercentage.set(percentage);
    }
  }

  /**
   * Handle back button click
   */
  goBack(): void {
    if (this.canGoBack() && this.routeHistory.length > 1) {
      const currentRoute = this.routeHistory[this.routeHistory.length - 1];
      this.routeHistory.pop();
      let previousRoute = this.routeHistory[this.routeHistory.length - 1];

      // When going back from role-selection and welcome was skipped (auto-skip flow),
      // redirect to welcome instead of language-selection, keeping language-selection
      // in history so the user can go back further to change their language
      if (
        currentRoute.includes('role-selection') &&
        previousRoute.includes('language-selection') &&
        this.authFlowService.getCurrentState().selectedLanguage
      ) {
        previousRoute = '/login/welcome';
        this.routeHistory.push(previousRoute);
      }

      // Navigate back and also update flow state
      this.router.navigateByUrl(previousRoute, { replaceUrl: true });
      // Update flow state to go back one step
      this.authFlowService.goToPreviousStep();
    }
  }

  /**
   * Handle keyboard Enter key press to trigger continue button
   */
  @HostListener('document:keydown.enter', ['$event'])
  onEnterKeyPress(event: KeyboardEvent): void {
    // Only trigger if continue button is enabled and footer is visible
    if (this.canContinue() && this.showFooter()) {
      // Prevent default form submission behavior
      event.preventDefault();

      // Check if the active element is an input field that might need Enter for its own purpose
      const activeElement = document.activeElement as HTMLElement;
      const isTextarea = activeElement?.tagName.toLowerCase() === 'textarea';
      const isSelect = activeElement?.tagName.toLowerCase() === 'select';

      // Don't interfere with textarea or select elements
      if (isTextarea || isSelect) {
        return;
      }

      // Trigger continue action
      this.continue();
    }
  }

  continue(): void {
    if (this.canContinue()) {
      this.authFlowService.triggerContinue();
    } else {
      // This guard protects against accidental clicks while async steps are running.
    }
  }

  updateMascotVisibility(show: boolean): void {
    this.showMascot.set(show);
  }

  skipStep() {
    this.authFlowService.triggerSkipStep();
  }
}

// Export alias expected by lazy route config
export { LoginShellComponent as LoginPage };
