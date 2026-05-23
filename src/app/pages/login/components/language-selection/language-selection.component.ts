import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthFlowService, AuthStep } from '../../services/auth-flow.service';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DsActionListConfig, DsActionListItemConfig } from '@ds/action-list';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LanguageStore } from '@shared/language-store';

@Component({
  selector: 'app-language-selection',
  standalone: true,
  imports: [CommonModule, DsActionListComponent, TranslocoDirective],
  templateUrl: './language-selection.component.html',
})
export class LanguageSelectionComponent implements OnInit, OnDestroy {
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);

  selectedLanguage = signal<string | null>(null);
  protected readonly faCheck = faCircleCheck;
  config = computed<DsActionListConfig>(() => {
    const lang = this.selectedLanguage();
    return {
      onItemAction: (item) => {
        if (item.id) {
          this.selectedLanguage.set(item.id.toString());
          this.proceedToWelcome(item.id.toString());
        }
      },
      showCloseButton: false,
      items: [
        {
          title: 'English',
          id: 'en',
          showActiveBorder: lang === 'en',
          showActiveBg: lang === 'en',
          bgColor: 'surface-primary',
          endIconConfig: {
            showArrow: true,
            icon: this.faCheck,
            size: 'xl',
            disableRtlRotate: true,
            cssClass: lang === 'en' ? 'text-black-0' : 'text-neutral-cool-200',
          },
        },
        {
          title: 'العربية',
          id: 'ar',
          showActiveBorder: lang === 'ar',
          showActiveBg: lang === 'ar',
          bgColor: 'surface-primary',
          endIconConfig: {
            showArrow: true,
            icon: this.faCheck,
            disableRtlRotate: true,
            size: 'xl',
            cssClass: lang === 'ar' ? 'text-black-0' : 'text-neutral-cool-200',
          },
        },
      ],
    };
  });

  private destroy$ = new Subject<void>();
  private flow = inject(AuthFlowService);

  constructor() {}

  ngOnInit() {
    // Check if language is already stored in localStorage
    const storedLang = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
    const flowState = this.flow.getCurrentState();

    if (storedLang === 'en' || storedLang === 'ar') {
      // Only auto-skip on fresh page load (when language is not yet in flow state).
      // If the user navigated back, selectedLanguage is already set — show the screen.
      if (!flowState.selectedLanguage) {
        this.updateLanguage(storedLang);
        this.flow.setCurrentStep(AuthStep.ROLE_SELECTION);
        this.router.navigate(['/login/role-selection'], { replaceUrl: true });
        return;
      }
      // User navigated back — pre-select their language but let them interact
      this.selectedLanguage.set(storedLang);
    }

    this.flow.dispatch({ type: 'LANGUAGE_STEP' });
    // Listen for continue button clicks
    this.flow.continue$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.handleContinue();
    });

    const lang = this.selectedLanguage();
    if (lang) {
      this.flow.dispatch({ type: 'LANGUAGE_PICKED', name: lang });
      this.flow.setCanContinue(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleContinue(): void {
    const selectedLang = this.selectedLanguage();
    if (selectedLang) {
      this.proceedToWelcome(selectedLang);
    } else {
      // Guard against accidental clicks when no option is selected.
      this.flow.setCanContinue(false);
    }
  }

  updateLanguage(language: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, language);
    LanguageStore.setLang(language as 'en' | 'ar');
    this.translocoService.setActiveLang(language);
    this.flow.dispatch({ type: 'LANGUAGE_PICKED', name: language });
    // Store the active language inside the flow state so guards can reference it later.
    this.flow.setLanguage(language); // Store in flow state
    this.selectedLanguage.set(language);
    this.flow.setCanContinue(true);
  }

  private proceedToWelcome(language: string): void {
    this.updateLanguage(language);
    // Navigate to welcome screen (the intro screen after language selection)
    this.router.navigate(['/login/welcome']).catch(() => {
      // Fail silently; guard routes will redirect the user back to language
      // selection if navigation cannot be completed for any reason.
      this.flow.setCanContinue(false);
    });
  }
}
