import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsIconComponent } from '@ds/icon/icon.component';
import { getIconDefinitionByName } from '@ds/icon-chooser/icon-chooser.util';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SupportTicketStatus, TicketFeedbackType } from '@shared/enums';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { SupportTicketActionsService } from '@pages/support-hub/services/support-ticket-actions.service';
import { formatToHestime } from '@shared/utils/date';
import { isRtl } from '@shared/utils/platform';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '@ds/modal/modal.component';

interface ResolutionComment {
  userName: string;
  userRole: string;
  description: string;
  time: string;
}

/**
 * Ticket Feedback Component
 *
 * This component handles two types of feedback for support tickets:
 *
 * 1. RATING Feedback (default):
 *    - Shown when a ticket is resolved
 *    - User provides 1-5 star rating
 *    - Optional comment field
 *    - Success message: "Feedback sent!"
 *
 * 2. ISSUE Feedback:
 *    - Shown when user wants to reopen a ticket
 *    - Shows assignee's resolution message (placeholder)
 *    - Required feedback text area
 *    - Success message: "Request re-opened"
 */
@Component({
  selector: 'app-support-ticket-feedback',
  templateUrl: './support-ticket-feedback.component.html',
  standalone: true,
  imports: [
    IonImg,
    CommonModule,
    DsIconComponent,
    TranslocoDirective,
    DsTextareaComponent,
    ReactiveFormsModule,
  ],
})
export class SupportTicketFeedbackComponent implements DsModalContentComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly toasterService = inject(HesToasterService);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly ticketActionsService = inject(SupportTicketActionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly t = inject(HesTranslateService);

  // #region Modal Control (injected by modal wrapper)
  closeModal!: (data?: unknown, role?: string) => void;
  // #endregion

  // Signal inputs
  readonly ticketId = input<number>();
  readonly feedbackType = input<TicketFeedbackType>(TicketFeedbackType.RATING);
  readonly isInitiatorTicket = input<boolean>(false);

  // State signals (will be populated from ticket details)
  readonly supportType = signal<string>('');
  readonly supportCategory = signal<string>('');
  readonly supportTypeIcon = signal<string>('');
  readonly supportCategoryIcon = signal<string>('');
  readonly resolutionComment = signal<ResolutionComment | null>(null);
  private readonly schoolId = signal<number | null>(null);

  // Computed icon definitions
  readonly supportTypeIconDef = computed(() =>
    getIconDefinitionByName(this.supportTypeIcon()),
  );
  readonly supportCategoryIconDef = computed(() =>
    getIconDefinitionByName(this.supportCategoryIcon()),
  );

  private readonly isRtlLayout = isRtl();

  // Computed feedback mode
  readonly isRatingFeedback = computed(
    () => this.feedbackType() === TicketFeedbackType.RATING,
  );
  readonly isIssueFeedback = computed(
    () => this.feedbackType() === TicketFeedbackType.ISSUE,
  );

  // Form
  readonly form = this.fb.group({
    feedback: this.fb.control(''),
  });

  // Reactive form value signal
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  isLoading = signal(false);
  showSuccessScreen = signal(false);

  // Rating state
  readonly rating = signal(0);
  readonly hoverRating = signal(0);
  readonly stars = [1, 2, 3, 4, 5] as const;

  // Rating text keys for translation
  private readonly ratingTextKeys = [
    'support.rating.very_poor',
    'support.rating.could_be_better',
    'support.rating.okay',
    'support.rating.good',
    'support.rating.excellent',
  ] as const;
  private readonly imageBasePath = 'assets/illustrations';

  // Computed values
  readonly displayedRating = computed(() =>
    this.hoverRating() > 0 ? this.hoverRating() : this.rating(),
  );

  // #region Button State Signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(false);
  readonly primaryButtonLoading = signal(false);
  // #endregion

  // #region Dynamic Header/Footer Config (watched by modal wrapper)
  readonly headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    // Success screen has no header
    if (this.showSuccessScreen()) {
      return undefined;
    }

    if (this.isRatingFeedback()) {
      // Rating view: just close button, no title
      return {
        showCloseButton: true,
      };
    } else {
      // Issue view: title, subtitle, and close button
      return {
        title: this.t.t('support.feedback.title'),
        subtitle: this.t.t('support.feedback.description'),
        showCloseButton: true,
      };
    }
  });

  readonly footerConfig = computed<DsModalFooterConfig | undefined>(() => {
    // Success screen
    if (this.showSuccessScreen()) {
      return {
        primaryButton: { text: this.t.t('support.back_to_main.btn') },
        buttonSize: 'lg',
      };
    }

    if (this.isRatingFeedback()) {
      // Rating view
      if (this.rating() > 0) {
        // Rating selected - show submit button
        return {
          primaryButton: { text: this.t.t('support.rating.submit_btn') },
          buttonSize: 'lg',
        };
      } else {
        // No rating - show skip button
        return {
          secondaryButton: { text: this.t.t('login.skip.btn') },
          buttonSize: 'lg',
        };
      }
    } else {
      // Issue view - show reopen button
      return {
        primaryButton: { text: this.t.t('support.feedback.reopen_btn') },
        buttonSize: 'lg',
      };
    }
  });
  // #endregion

  constructor() {
    this.initializeTicketDetailEffect();
    this.setupButtonStateEffect();
  }

  private setupButtonStateEffect(): void {
    // Update button disabled state based on current view and form state
    effect(
      () => {
        if (this.showSuccessScreen()) {
          this.primaryButtonDisabled.set(false);
          this.primaryButtonLoading.set(false);
          return;
        }

        if (this.isRatingFeedback()) {
          // Rating view: primary button disabled if loading
          this.primaryButtonDisabled.set(this.isLoading());
        } else {
          // Issue view: disabled until feedback text provided or loading
          this.primaryButtonDisabled.set(!this.canSubmit() || this.isLoading());
        }

        this.primaryButtonLoading.set(this.isLoading());
      },
      { allowSignalWrites: true },
    );
  }

  readonly currentMascotPath = computed(() => {
    const rating = this.displayedRating();
    return rating > 0
      ? `${this.imageBasePath}/camel-rate-${rating}.svg`
      : `${this.imageBasePath}/camel-rate-default.svg`;
  });

  readonly ratingText = computed(() => {
    const rating = this.displayedRating();
    return rating > 0 ? this.t.t(this.ratingTextKeys[rating - 1]) : '';
  });

  // Computed for form validation
  readonly canSubmit = computed(() => {
    if (this.isRatingFeedback()) {
      return this.rating() > 0;
    }
    // For issue feedback, require feedback text (reactive to form changes)
    const feedbackValue = this.formValue()?.feedback;
    return feedbackValue !== undefined && feedbackValue.trim().length > 0;
  });

  // Success screen messages
  readonly successTitle = computed(() => {
    return this.isRatingFeedback()
      ? this.t.t('support.feedback.success_title')
      : this.t.t('support.status.reopened_title');
  });

  readonly successMessage = computed(() => {
    return this.isRatingFeedback()
      ? this.t.t('support.feedback.closed_success_msg')
      : this.t.t('support.feedback.forwarded_msg');
  });

  // #region Modal Event Handlers (called by modal wrapper)
  onPrimaryClick(): void {
    if (this.showSuccessScreen()) {
      // Back to support button
      this.ticketActionsService.requestNavigateToList();
      this.closeModal(undefined, 'close');
      return;
    }

    // Submit action (both rating and issue views)
    this.onSubmit();
  }

  onSecondaryClick(): void {
    // Skip button (rating view with no rating selected)
    this.closeModal(undefined, 'close');
  }
  // #endregion

  onSubmit(): void {
    // Validate based on feedback type
    if (this.isRatingFeedback() && !this.rating()) {
      this.toasterService.error(
        this.t.t('support.feedback.error.select_rating'),
      );
      return;
    }

    if (this.isIssueFeedback()) {
      const feedback = this.form.value.feedback?.trim();
      if (!feedback) {
        this.toasterService.error(
          this.t.t('support.feedback.error.provide_feedback'),
        );
        return;
      }
    }

    const ticketId = this.ticketId();
    if (!ticketId) {
      this.toasterService.error(
        this.t.t('support.feedback.error.ticket_required'),
      );
      return;
    }

    this.isLoading.set(true);

    if (this.isRatingFeedback()) {
      this.submitRatingFeedback(ticketId);
    } else {
      this.submitIssueFeedback(ticketId);
    }
  }

  private submitRatingFeedback(ticketId: number): void {
    const payload = {
      ticketId,
      rating: this.rating(),
      comment: this.form.value.feedback || '',
    };

    this.supportHubTicketsService
      .submitTicketResolvedFeedback(payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.showSuccessScreen.set(true);
          void this.ticketActionsService.refreshTicketById(
            ticketId,
            this.isInitiatorTicket(),
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  private submitIssueFeedback(ticketId: number): void {
    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasterService.error(
        this.t.t('support.feedback.error.school_required'),
      );
      this.isLoading.set(false);
      return;
    }

    const payload = {
      description: this.form.value.feedback || '',
      schoolId,
    };

    this.supportHubTicketsService
      .reopenTicketAsInitiator(ticketId, payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.showSuccessScreen.set(true);
          void this.ticketActionsService.refreshTicketById(
            ticketId,
            this.isInitiatorTicket(),
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  setRating(value: number): void {
    this.rating.set(value);
    this.clearHover();
  }

  setHover(value: number): void {
    this.hoverRating.set(value);
  }

  clearHover(): void {
    this.hoverRating.set(0);
  }

  // Private methods
  private initializeTicketDetailEffect(): void {
    effect(() => {
      const ticketId = this.ticketId();

      if (ticketId === undefined) return;

      this.supportHubTicketsService
        .getTicketDetailAsInitiator(ticketId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((response) => {
          this.populateFromTicketDetail(response);
        });
    });
  }

  private populateFromTicketDetail(detail: SupportHubTicketDetail): void {
    this.schoolId.set(detail.schoolId);

    // Populate support type and category
    const supportTypeData = detail.supportTypes?.[0];
    const supportCategoryData = detail.supportCategories?.[0];
    this.supportType.set(supportTypeData?.displayName ?? '');
    this.supportCategory.set(supportCategoryData?.displayName ?? '');
    this.supportTypeIcon.set(supportTypeData?.icon ?? '');
    this.supportCategoryIcon.set(supportCategoryData?.icon ?? '');

    // Find the latest RESOLVED activity
    const resolvedActivities = detail.ticketActivity.filter(
      (activity) => activity.status === SupportTicketStatus.RESOLVED,
    );

    if (resolvedActivities.length > 0) {
      // Get the latest one (last in array, or sort by createdAt)
      const latestResolved = resolvedActivities.reduce((latest, current) => {
        return new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest;
      });

      this.resolutionComment.set({
        userName: latestResolved.user.displayName,
        userRole: latestResolved.user.role,
        description: latestResolved.description,
        time: formatToHestime(latestResolved.createdAt, this.isRtlLayout) ?? '',
      });
    }
  }
}
