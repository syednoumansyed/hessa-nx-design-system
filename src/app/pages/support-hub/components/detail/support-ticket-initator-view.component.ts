import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import {
  SupportTicketStatus,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { IAttachment } from '@shared/interfaces/attachment';
import { HttpErrorResponse } from '@angular/common/http';
import { formatToHestime, parseIsoToEpochMs } from '@shared/utils/date';
import { DurationPipe } from '@shared/pipes/duration.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ScrollDateTrackingDirective } from '@shared/directives/scroll-date-tracking.directive';
import { isRtl } from '@shared/utils/platform';
import { IMAGE_TYPES_PREVIEW_EXTENSTIONS } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import {
  SupportTicketCardConfig,
  SupportTicketCardStudent,
} from '../ticket-card/support-ticket-card.component';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { SupportTicketActionsService } from '@pages/support-hub/services/support-ticket-actions.service';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import {
  SupportTicketDetailActivityStage,
  SupportTicketDetailDocument,
  SupportTicketDetailDocumentsStage,
  SupportTicketDetailResolutionActionEvent,
  SupportTicketDetailResolutionCommentStage,
  SupportTicketDetailResolutionStatusStage,
  SupportTicketDetailStatusActivityStage,
  SupportTicketDetailGalleryStage,
  SupportTicketDetailStage,
  SupportTicketDetailStageDirection,
  SupportTicketDetailSummaryStage,
} from './support-ticket-detail-stage.model';
import { computeDateSeparatorIndices } from './support-ticket-detail-stage.utils';
import { SupportTicketDetailStageHostComponent } from './support-ticket-detail-stage-host.component';
import { LayoutService } from '@layout/layout.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SupportJourneyStudent } from '@pages/support-hub/data-access/journey/support-journey-student.model';
import { ObjId } from '@shared/interfaces/common.interface';
import { SupportJourneyHeaderComponent } from '../journey/support-journey-header.component';
import { SupportTicketDetailLayoutComponent } from './support-ticket-detail-layout.component';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faArrowTurnDown, faHeadset } from '@fortawesome/pro-regular-svg-icons';
import { faRotate } from '@fortawesome/pro-regular-svg-icons';
import { faArrowTurnUp } from '@fortawesome/pro-solid-svg-icons';
import { filter, finalize, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth.service';
import { createSupportTicketFeedbackModal } from '../ticket-feedback-modal/support-ticket-feedback.modal';
import { TicketFeedbackType } from '@shared/enums';
import { FeedbackService } from '@shared/services/feedback.service';
import { SupportTicketFeedback } from '../ticket-feedback-modal/data-access/support-ticket-feedback.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { createSupportTicketRatingLabel } from '../../utils/support-ticket-rating.util';
import { SupportJourneyStudentSelectionModalComponent } from '../journey/support-journey-student-selection-modal.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsModalService } from '@ds/modal';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { findAllSchools } from '@shared/utils/school-structure';

interface ResolutionFeedbackState {
  readonly title: string;
  readonly message: string | null;
  readonly timestampLabel: string;
  readonly rating: number | null;
  readonly ratingLabel: string | null;
}

export interface SupportTicketInitatorViewProfile {
  readonly id: ObjId;
  readonly type: UserType;
}
interface BadgeStyleModel {
  readonly backgroundClass: string;
  readonly textClass: string;
}

@Component({
  selector: 'app-support-ticket-initator-view',
  standalone: true,
  imports: [
    CommonModule,
    SupportTicketDetailStageHostComponent,
    DsButtonComponent,
    SupportJourneyHeaderComponent,
    SupportTicketDetailLayoutComponent,
    DurationPipe,
    DsTranslatePipe,
    ScrollDateTrackingDirective,
  ],
  providers: [TimeAgoPipe],
  templateUrl: './support-ticket-initator-view.component.html',
})
export class SupportTicketInitatorViewComponent {
  readonly ticketId = input<string | null>(null);
  readonly summary = input<SupportTicketCardConfig | null>(null);
  readonly back = output<void>();
  readonly viewProfile = output<SupportTicketInitatorViewProfile>();

  private readonly isRtlLayout = isRtl();
  private readonly timeAgoPipe = inject(TimeAgoPipe);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly ticketActionsService = inject(SupportTicketActionsService);
  private readonly layoutService = inject(LayoutService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly auth = inject(AuthService);
  private readonly modalService = inject(DsModalService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hesTranslate = inject(HesTranslateService);
  private readonly getSupportTicketRatingLabel =
    createSupportTicketRatingLabel();
  private readonly openSupportTicketFeedbackModal =
    createSupportTicketFeedbackModal();
  private readonly escalateActivityIcon = faArrowTurnUp;
  private readonly deEscalateActivityIcon = faArrowTurnDown;

  private readonly detailState = signal<SupportHubTicketDetail | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly resolutionFeedbackState =
    signal<ResolutionFeedbackState | null>(null);
  private readonly detailReloadToken = signal(0);
  private readonly resolvingTicketState = signal(false);
  private currentFeedbackTicketId: number | null = null;
  private previousShowResolutionActions = false;

  protected readonly layoutRef =
    viewChild<SupportTicketDetailLayoutComponent>('detailLayout');
  protected readonly isMobile = this.layoutService.isMobile;
  protected readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  protected readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );
  protected readonly supportIcon: IconDefinition = faHeadset;

  protected readonly isInitiatorTicket = computed(
    () => this.summary()?.isInitiatorTicket ?? false,
  );

  protected readonly initiatorHeaderTitle = computed(() =>
    this.hesTranslate.t('global.support.title'),
  );

  protected readonly initiatorHeaderSubtitle = computed(() => {
    // Hide subtitle when viewing as initiator
    if (this.isInitiatorTicket()) {
      return null;
    }
    const summary = this.summary();
    return (
      summary?.category?.label ?? summary?.subCategory ?? 'Help request details'
    );
  });

  private readonly supportHeaderProfileSignal =
    computed<SupportTicketInitatorViewProfile | null>(() => {
      const detail = this.detail();
      const initiator = detail?.initiator;
      const detailProfileId = initiator?.userTypeId ?? initiator?.id ?? null;
      const detailType = detail?.createdByType ?? initiator?.type ?? null;

      if (detailProfileId && detailType) {
        return {
          id: detailProfileId,
          type: detailType,
        } satisfies SupportTicketInitatorViewProfile;
      }

      const summary = this.summary();
      const requester = summary?.requester;
      if (requester?.id) {
        const userType = this.resolveUserType(
          requester,
          summary?.initiatorDisplayName,
        );

        if (userType) {
          return {
            id: requester.id,
            type: userType,
          } satisfies SupportTicketInitatorViewProfile;
        }
      }

      return null;
    });

  protected readonly schoolInfo = computed<
    SupportTicketCardConfig['school'] | null
  >(() => this.summary()?.school ?? null);

  private readonly hasMultipleSchools = computed(() => {
    const scoped = this.schoolStructureScope.userScopedSchoolStructure();
    return findAllSchools(scoped).length > 1;
  });

  private readonly isInitiatorPersonnel = computed(() => {
    const detail = this.detail();
    const detailType = detail?.initiator?.type ?? detail?.createdByType ?? null;
    if (detailType) {
      return detailType === UserType.PERSONNEL;
    }

    const summary = this.summary();
    const requester = summary?.requester;
    if (!requester) {
      return false;
    }

    const userType = this.resolveUserType(
      requester,
      summary?.initiatorDisplayName,
    );

    return userType === UserType.PERSONNEL;
  });

  protected readonly showSchoolInfo = computed(() => {
    const school = this.schoolInfo();
    const hasSchool = !!(school?.title || school?.subtitle);
    if (!hasSchool) {
      return false;
    }

    if (!this.isInitiatorTicket()) {
      return true;
    }

    return this.isInitiatorPersonnel() && this.hasMultipleSchools();
  });

  protected readonly initiatorStudents = computed<SupportJourneyStudent[]>(
    () => {
      const summary = this.summary();
      if (!summary?.students?.length) {
        return [];
      }

      const scopedStudents = this.studentSelectionScope.studentSelectionScope();

      return summary.students.map((student: SupportTicketCardStudent) => {
        const scoped = scopedStudents.find((item) => item.id === student.id);

        return {
          id: String(student.id),
          fullName: student.displayName,
          levelLabel: scoped?.school?.level?.displayName ?? '',
          classLabel: scoped?.school?.class?.displayName ?? '',
          avatarColor: UserProfileColors.NEUTRAL,
          avatarUrl: scoped?.image ?? null,
          schoolId: scoped?.school?.id ?? null,
        } satisfies SupportJourneyStudent;
      });
    },
  );

  protected onBackRequested(): void {
    this.back.emit();
  }

  protected onViewProfileRequested(): void {
    const profile = this.supportHeaderProfileSignal();
    if (!profile) {
      return;
    }

    this.viewProfile.emit(profile);
  }

  protected onStudentsRequested(): void {
    const students = this.initiatorStudents();
    if (!students.length) {
      return;
    }

    void (async () => {
      const modalRef = await this.modalService.open({
        component: SupportJourneyStudentSelectionModalComponent,
        componentProps: {
          students,
          initialSelectedIds: students.map((student) => student.id),
          readonly: true,
        },
        headerConfig: {
          showCloseButton: true,
        },
        size: 'lg',
        contentClass: 'p-ds-xl',
        cssClass: 'support-journey-student-selection-modal',
        backdropDismiss: this.layoutService.isMobile(),
      });
      await modalRef.onDismiss();
    })();
  }

  protected readonly detail = computed(() => this.detailState());
  protected readonly isLoading = computed(() => this.loadingState());
  protected readonly error = computed(() => this.errorState());
  protected readonly resolutionFeedback = computed(() =>
    this.resolutionFeedbackState(),
  );

  protected readonly detailStages = computed<SupportTicketDetailStage[]>(() => {
    const detail = this.detail();
    const summary = this.summary();

    if (!detail || !summary) {
      return [];
    }

    const stages: SupportTicketDetailStage[] = [];

    const createdTimeLabel = this.createdTimeLabel();
    const timeAgoLabel = this.timeAgoPipe.transform(detail.createdAt) || null;
    const summaryStage: SupportTicketDetailSummaryStage = {
      id: 'summary',
      kind: 'summary',
      direction: 'sender',
      timestamp: detail.createdAt,
      ticketNumber: summary.ticketNumber,
      title: this.subcategoryLabel(),
      description: this.description(),
      createdAt: detail.createdAt,
      createdTimeLabel: this.createdTimeLabel(),
      timeAgoLabel,
      statusBadge: this.statusBadge(),
      categoryBadge: this.categoryBadge(),
      menuItems: null,
      customFields: detail.customFields?.length
        ? detail.customFields.map((field) => ({
            id: field.id,
            label: field.label,
            value: field.value,
          }))
        : undefined,
    };

    stages.push(summaryStage);

    const galleryAttachments = this.imageAttachmentsForGallery();
    if (galleryAttachments.length) {
      stages.push({
        id: 'gallery',
        kind: 'gallery',
        direction: 'sender',
        attachments: galleryAttachments,
        timestampLabel: createdTimeLabel,
        timestamp: detail.createdAt,
        disableBubbleStyling: true,
      });
    }

    const documents: SupportTicketDetailDocument[] =
      this.documentAttachments().map((attachment, index) => ({
        id: attachment.id ? String(attachment.id) : `doc-${index}`,
        label: this.getAttachmentName(attachment),
        createdLabel: createdTimeLabel,
        attachment,
      }));

    if (documents.length) {
      stages.push({
        id: 'documents',
        kind: 'documents',
        direction: 'sender',
        documents,
        timestampLabel: createdTimeLabel,
        timestamp: detail.createdAt,
      });
    }

    let previousDirection: SupportTicketDetailStageDirection | null = null;
    let hasResolvedActivity = false;
    let lastResolvedActivityId: number | null = null;
    let lastResolvedTimestampLabel: string | null = null;
    let lastResolvedCreatedAt: string | null = null;
    const sortedActivities = [...detail.ticketActivity].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const currentUserId = this.auth.user()?.id;
    const shouldFilterActivities =
      !this.auth.isUserPersonnel() && !this.isInitiatorPersonnel();
    const activitiesForTimeline = shouldFilterActivities
      ? sortedActivities.filter((activity) => {
          const actorId = activity.performedById ?? undefined;
          const isCurrentUserActivity =
            currentUserId != null && actorId === currentUserId;

          return (
            activity.status === SupportTicketStatus.RESOLVED ||
            isCurrentUserActivity
          );
        })
      : sortedActivities;

    for (const activity of activitiesForTimeline) {
      if (activity.status === SupportTicketStatus.RESOLVED) {
        hasResolvedActivity = true;
        lastResolvedActivityId = activity.id ?? null;
        lastResolvedCreatedAt = activity.createdAt;
        lastResolvedTimestampLabel =
          formatToHestime(activity.createdAt, this.isRtlLayout) ?? null;
      }

      if (
        activity.status === SupportTicketStatus.RE_OPEN &&
        hasResolvedActivity
      ) {
        stages.push(
          this.createResolutionPromptStage(
            lastResolvedActivityId,
            lastResolvedTimestampLabel,
            lastResolvedCreatedAt,
          ),
        );
      }

      const activityStages = this.toActivityStages(
        detail,
        activity,
        previousDirection,
      );
      if (!activityStages.length) {
        continue;
      }

      for (const stage of activityStages) {
        stages.push(stage);
      }

      previousDirection =
        activityStages[activityStages.length - 1]?.direction ??
        previousDirection;
    }

    const feedback = this.resolutionFeedback();
    if (feedback) {
      if (hasResolvedActivity) {
        stages.push(
          this.createResolutionPromptStage(
            lastResolvedActivityId,
            lastResolvedTimestampLabel,
            lastResolvedCreatedAt,
          ),
        );
      }
      stages.push({
        id: 'resolution-feedback',
        kind: 'resolutionFeedback',
        direction: 'sender',
        timestamp: lastResolvedCreatedAt ?? detail.createdAt,
        disableBubbleStyling: true,
        fullWidth: false,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: false,
        title: feedback.title,
        comment: feedback.message ?? null,
        rating: feedback.rating,
        ratingLabel: feedback.ratingLabel,
        timestampLabel: feedback.timestampLabel,
      });
    }

    return stages;
  });

  protected readonly dateSeparatorIndices = computed(() =>
    computeDateSeparatorIndices(this.detailStages()),
  );

  constructor() {
    effect(
      (onCleanup) => {
        void this.detailReloadToken();
        const ticketId = this.ticketId();

        if (!ticketId) {
          this.resetState();
          return;
        }

        const numericId = Number(ticketId);
        if (!Number.isFinite(numericId)) {
          this.handleLoadFailure('Unable to load ticket details.');
          return;
        }

        this.loadingState.set(true);
        this.errorState.set(null);
        this.detailState.set(null);
        this.resolutionFeedbackState.set(null);

        const subscription = this.supportHubTicketsService
          .getTicketDetailAsInitiator(numericId)
          .subscribe({
            next: (detail) => {
              this.detailState.set(detail);
              this.loadingState.set(false);
              this.loadResolutionFeedback(detail);
            },
            error: (error: unknown) => {
              this.detailState.set(null);
              this.errorState.set(this.resolveErrorMessage(error));
              this.loadingState.set(false);
              this.resolutionFeedbackState.set(null);
            },
          });

        onCleanup(() => subscription.unsubscribe());
      },
      { allowSignalWrites: true },
    );

    effect((onCleanup) => {
      const ticketId = this.ticketId();
      if (!ticketId) {
        return;
      }

      const trimmedTicketId = ticketId.trim();
      if (!trimmedTicketId) {
        return;
      }

      const numericId = Number(trimmedTicketId);
      if (!Number.isFinite(numericId)) {
        return;
      }

      const subscription = this.ticketActionsService.ticketUpdated$
        .pipe(filter((resolvedId) => resolvedId === numericId))
        .subscribe(() => {
          this.detailReloadToken.update((value) => value + 1);
        });

      onCleanup(() => subscription.unsubscribe());
    });

    // Scroll to bottom when resolution actions become visible
    effect(() => {
      const showResolutionActions = this.showResolutionActions();
      const layout = this.layoutRef();

      // Only scroll when resolution actions just became visible
      if (showResolutionActions && !this.previousShowResolutionActions) {
        this.previousShowResolutionActions = true;
        // Delay to ensure buttons are rendered
        setTimeout(() => {
          layout?.scrollToEnd();
        }, 100);
      } else if (!showResolutionActions) {
        this.previousShowResolutionActions = false;
      }
    });
  }

  private resetState(): void {
    this.detailState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
    this.resolutionFeedbackState.set(null);
  }

  private handleLoadFailure(message: string): void {
    this.detailState.set(null);
    this.loadingState.set(false);
    this.errorState.set(message);
    this.resolutionFeedbackState.set(null);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.message ??
        error.message ??
        'Unable to load ticket details.'
      );
    }

    return 'Unable to load ticket details.';
  }

  private readonly statusBadgeToneStyles: Record<string, BadgeStyleModel> = {
    open: {
      backgroundClass: 'bg-surface-pastel-background-blue',
      textClass: 'text-surface-pastel-foreground-blue',
    },
    reopened: {
      backgroundClass: 'bg-surface-pastel-background-indigoRich',
      textClass: 'text-surface-pastel-foreground-indigo',
    },
    escalated: {
      backgroundClass: 'bg-surface-pastel-background-red',
      textClass: 'text-surface-pastel-foreground-red',
    },
    resolved: {
      backgroundClass: 'bg-surface-pastel-background-emeraldRich',
      textClass: 'text-surface-pastel-foreground-green',
    },
  };

  private readonly categoryBadgeToneStyles: Record<string, BadgeStyleModel> = {
    success: {
      backgroundClass: 'bg-surface-pastel-background-green',
      textClass: 'text-surface-pastel-foreground-green',
    },
    info: {
      backgroundClass: 'bg-surface-pastel-background-blue',
      textClass: 'text-surface-pastel-foreground-blue',
    },
    warning: {
      backgroundClass: 'bg-surface-pastel-background-orange',
      textClass: 'text-surface-pastel-foreground-orange',
    },
    danger: {
      backgroundClass: 'bg-surface-pastel-background-red',
      textClass: 'text-surface-pastel-foreground-red',
    },
    brand: {
      backgroundClass: 'bg-surface-brand-surface-light',
      textClass: 'text-surface-pastel-foreground-brand',
    },
  };

  protected readonly statusBadge = computed(() => {
    const summary = this.summary();
    if (!summary) {
      return null;
    }

    const tone = summary.status.tone;
    const toneStyles = tone ? this.statusBadgeToneStyles[tone] : undefined;
    const isReopened = tone === 'reopened';

    return {
      label: summary.status.label,
      backgroundClass:
        toneStyles?.backgroundClass ?? 'bg-surface-pastel-background-blue',
      textClass: toneStyles?.textClass ?? 'text-surface-pastel-foreground-blue',
      ...(isReopened
        ? {
            icon: faRotate,
            iconColorClass:
              toneStyles?.textClass ?? 'text-surface-pastel-foreground-indigo',
          }
        : {}),
    };
  });

  protected readonly categoryBadge = computed(() => {
    const summary = this.summary();
    if (!summary?.category) {
      return null;
    }

    const tone = summary.category.tone;
    const toneStyles = tone ? this.categoryBadgeToneStyles[tone] : undefined;

    return {
      label: summary.category.label,
      backgroundClass:
        toneStyles?.backgroundClass ?? 'bg-surface-pastel-background-green',
      textClass:
        toneStyles?.textClass ?? 'text-surface-pastel-foreground-green',
      ...(summary.category.icon
        ? {
            icon: summary.category.icon,
            iconColorClass:
              summary.category.iconColorClass ??
              toneStyles?.textClass ??
              'text-surface-pastel-foreground-green',
          }
        : {}),
    };
  });

  protected readonly description = computed(() => {
    const detail = this.detail();
    if (detail?.description) {
      return detail.description;
    }

    return this.summary()?.description ?? '';
  });

  protected readonly subcategoryLabel = computed(
    () => this.summary()?.subCategory ?? '',
  );

  protected readonly toEpoch = parseIsoToEpochMs;

  protected readonly createdTimeLabel = computed(() => {
    const detail = this.detail();
    if (!detail) {
      return null;
    }
    return formatToHestime(detail.createdAt, this.isRtlLayout);
  });

  protected readonly attachments = computed(() => {
    return this.detail()?.attachments ?? [];
  });

  protected readonly imageAttachments = computed(() =>
    this.attachments().filter((attachment) =>
      this.isImageAttachment(attachment),
    ),
  );

  protected readonly documentAttachments = computed(() =>
    this.attachments().filter(
      (attachment) => !this.isImageAttachment(attachment),
    ),
  );

  protected readonly imageAttachmentsForGallery = computed<
    DsAttachmentControlValue[]
  >(() =>
    this.imageAttachments().map((attachment) =>
      this.toDsAttachment(attachment),
    ),
  );

  protected readonly resolutionActivity = computed(() => {
    const detail = this.detail();
    if (!detail?.ticketActivity?.length) {
      return null;
    }

    const resolvedActivities = detail.ticketActivity.filter(
      (activity) => activity.status === SupportTicketStatus.RESOLVED,
    );

    if (resolvedActivities.length === 0) {
      return null;
    }

    return resolvedActivities[resolvedActivities.length - 1];
  });

  protected readonly resolutionAcknowledgementTime = computed(() => {
    const activity = this.resolutionActivity();
    if (!activity) {
      return null;
    }

    return formatToHestime(activity.createdAt, this.isRtlLayout);
  });

  protected readonly resolutionCommentVm = computed(() => {
    const activity = this.resolutionActivity();
    if (!activity) {
      return null;
    }

    const name = activity.performedBy?.displayName ?? '';
    const roleFromMetadata = activity.notifiedPersonnel
      .map((person) => person.displayName)
      .filter((displayName): displayName is string => !!displayName)
      .join(', ');
    const description = activity.description ?? '';
    const time = formatToHestime(activity.createdAt, this.isRtlLayout);

    const fallbackRole = this.detail()?.rolesDisplayName ?? '';

    return {
      name,
      role: roleFromMetadata || fallbackRole,
      description,
      time,
    };
  });

  protected readonly showResolutionActions = computed(() => {
    const detail = this.detail();
    return (
      detail?.status === SupportTicketStatus.RESOLVED &&
      !detail?.resolvedByInitiator &&
      !this.error()
    );
  });

  protected readonly isResolvingTicket = computed(() =>
    this.resolvingTicketState(),
  );

  protected onResolvedClicked(): void {
    this.handleResolutionAction('resolved');
  }

  protected onNotResolvedClicked(): void {
    this.handleResolutionAction('notResolved');
  }

  protected onResolutionStageAction(
    event: SupportTicketDetailResolutionActionEvent,
  ): void {
    if (event.action === 'resolved') {
      this.onResolvedClicked();
      return;
    }

    this.onNotResolvedClicked();
  }

  private loadResolutionFeedback(detail: SupportHubTicketDetail | null): void {
    if (!detail) {
      this.currentFeedbackTicketId = null;
      this.resolutionFeedbackState.set(null);
      return;
    }

    const isResolvedTicket = detail.resolvedByInitiator;

    if (!isResolvedTicket) {
      this.currentFeedbackTicketId = null;
      this.resolutionFeedbackState.set(null);
      return;
    }

    this.currentFeedbackTicketId = detail.id;
    this.resolutionFeedbackState.set(
      this.buildResolutionFeedbackState(detail, null),
    );

    this.supportHubTicketsService
      .getTicketFeedback(detail.id)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (feedback) => {
          if (this.currentFeedbackTicketId !== detail.id) {
            return;
          }

          if (!feedback) {
            this.currentFeedbackTicketId = null;
            return;
          }

          this.resolutionFeedbackState.set(
            this.buildResolutionFeedbackState(detail, feedback),
          );
          this.currentFeedbackTicketId = null;
        },
        error: () => {
          if (this.currentFeedbackTicketId !== detail.id) {
            return;
          }

          // Ignore failures; base state already rendered.
          this.currentFeedbackTicketId = null;
        },
      });
  }

  private buildResolutionFeedbackState(
    detail: SupportHubTicketDetail,
    feedback: SupportTicketFeedback | null,
  ): ResolutionFeedbackState {
    const resolvedActivity = this.getLatestResolvedActivity(detail);
    const timestampSource =
      feedback?.createdAt ?? resolvedActivity?.createdAt ?? detail.createdAt;
    const timestampLabel =
      formatToHestime(timestampSource, this.isRtlLayout) ??
      this.getCurrentTimeLabel();

    const rawComment = feedback?.comment?.trim() ?? '';
    const ratingValue = feedback?.rating ?? null;
    const normalizedRating =
      ratingValue && ratingValue > 0 ? Math.min(ratingValue, 5) : null;

    return {
      title: this.hesTranslate.translate('support.status.resolved_tag'),
      message: rawComment.length ? rawComment : null,
      timestampLabel,
      rating: normalizedRating,
      ratingLabel: this.getSupportTicketRatingLabel(normalizedRating),
    };
  }

  private getLatestResolvedActivity(
    detail: SupportHubTicketDetail,
  ): SupportHubTicketDetail['ticketActivity'][number] | null {
    if (!detail?.ticketActivity?.length) {
      return null;
    }

    let latest: SupportHubTicketDetail['ticketActivity'][number] | null = null;

    for (const activity of detail.ticketActivity) {
      if (activity.status !== SupportTicketStatus.RESOLVED) {
        continue;
      }

      if (!latest) {
        latest = activity;
        continue;
      }

      const activityTime = new Date(activity.createdAt).getTime();
      const latestTime = new Date(latest.createdAt).getTime();

      if (activityTime > latestTime) {
        latest = activity;
      }
    }

    return latest;
  }

  private createResolutionPromptStage(
    resolvedActivityId: number | null,
    timestampLabel: string | null,
    createdAt: string | null,
  ): SupportTicketDetailActivityStage {
    const promptBody =
      this.hesTranslate.translate('support.resolution.verify_question') ??
      'Is your request really resolved?';

    return {
      id: resolvedActivityId
        ? `activity-${resolvedActivityId}-resolution-prompt`
        : 'resolution-prompt',
      kind: 'activity',
      direction: 'receiver',
      actorName: '',
      actorRole: null,
      body: promptBody,
      timestampLabel: timestampLabel ?? undefined,
      timestamp: createdAt ?? undefined,
      showSupportAvatar: true,
      tone: undefined,
    };
  }

  private toActivityStages(
    detail: SupportHubTicketDetail,
    activity: SupportHubTicketDetail['ticketActivity'][number],
    previousDirection: SupportTicketDetailStageDirection | null,
  ): SupportTicketDetailStage[] {
    const actorId = activity.performedById ?? null;
    const initiatorId = detail.createdBy ?? detail.initiator?.id ?? null;
    const currentUserId = this.auth.user()?.id ?? null;
    const isCurrentUserActivity =
      currentUserId !== null && actorId === currentUserId;
    const direction: SupportTicketDetailStageDirection =
      isCurrentUserActivity ||
      (actorId && initiatorId && actorId === initiatorId)
        ? 'sender'
        : 'receiver';

    const timestampLabel = formatToHestime(
      activity.createdAt,
      this.isRtlLayout,
    );

    if (activity.status === SupportTicketStatus.RE_OPEN) {
      const reopenedTitle =
        this.hesTranslate.translate('support.status.ticket_reopened') ??
        this.hesTranslate.translate('support.ticket.status.reopened') ??
        'Ticket Re-opened';
      const message = activity.description?.trim() || null;
      const reopenedStage: SupportTicketDetailStatusActivityStage = {
        id: `activity-${activity.id}-reopened`,
        kind: 'statusActivity',
        direction,
        activityType: 'reopened',
        disableBubbleStyling: true,
        fullWidth: false,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: direction === 'receiver',
        backgroundClass: 'bg-surface-pastel-background-indigoRich',
        borderClass: 'border-stroke-black-08',
        title: reopenedTitle,
        titleClass:
          'heading-h5-high-emphasis text-surface-pastel-foreground-indigo',
        message,
        timestamp: activity.createdAt,
        timestampLabel,
        receiptStatus: isCurrentUserActivity ? 'delivered' : undefined,
      };

      return [reopenedStage];
    }

    if (
      activity.status === SupportTicketStatus.ESCALATED ||
      activity.status === SupportTicketStatus.DE_ESCALATE
    ) {
      if (!this.isInitiatorPersonnel()) {
        return [];
      }

      const isEscalated = activity.status === SupportTicketStatus.ESCALATED;
      const title = isEscalated
        ? (this.hesTranslate.translate('support.log.ticket_escalated') ??
          'Ticket escalated')
        : (this.hesTranslate.translate('support.log.ticket_de_escalated') ??
          'Ticket de-escalated');
      const subtitle = isEscalated
        ? (this.hesTranslate.translate('support.ticket.status.escalated') ??
          'Escalated')
        : (this.hesTranslate.translate('support.ticket.status.de_escalated') ??
          'De-escalated');

      const statusStage: SupportTicketDetailStatusActivityStage = {
        id: `activity-${activity.id}-${isEscalated ? 'escalated' : 'deescalated'}`,
        kind: 'statusActivity',
        direction,
        activityType: isEscalated ? 'escalated' : 'deEscalated',
        disableBubbleStyling: true,
        fullWidth: true,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: false,
        icon: isEscalated
          ? this.escalateActivityIcon
          : this.deEscalateActivityIcon,
        iconColorClass: isEscalated ? 'text-icon-error' : 'text-icon-mid',
        backgroundClass: isEscalated
          ? 'bg-surface-danger-subtle'
          : 'bg-surface-secondary',
        borderClass: isEscalated
          ? 'border-stroke-black-04'
          : 'border-stroke-black-08',
        title,
        subtitle,
        message: activity.description?.trim() || null,
        timestamp: activity.createdAt,
        timestampLabel,
        receiptStatus: isCurrentUserActivity ? 'delivered' : undefined,
      };

      return [statusStage];
    }

    const attachments =
      activity.attachments?.filter((item): item is IAttachment => !!item) ?? [];

    const imageAttachments = attachments
      .filter((attachment) => this.isImageAttachment(attachment))
      .map((attachment) => this.toDsAttachment(attachment));

    const documentAttachments: SupportTicketDetailDocument[] = attachments
      .filter((attachment) => !this.isImageAttachment(attachment))
      .map((attachment, index) => ({
        id: attachment.id
          ? String(attachment.id)
          : `activity-${activity.id}-doc-${index}`,
        label: this.getAttachmentName(attachment),
        createdLabel: timestampLabel,
        attachment,
      }));

    const supportShouldShowAvatar =
      direction === 'receiver' ? previousDirection !== 'receiver' : undefined;

    let supportAvatarConsumed = false;
    const resolveSupportAvatar = (): boolean | undefined => {
      if (direction !== 'receiver') {
        return undefined;
      }

      if (supportAvatarConsumed) {
        return false;
      }

      supportAvatarConsumed = true;
      return supportShouldShowAvatar ?? false;
    };

    const stages: SupportTicketDetailStage[] = [];
    const body = activity.description ?? '';
    const hasBodyContent = body.trim().length > 0;
    const isResolved = activity.status === SupportTicketStatus.RESOLVED;

    // For resolved activities, push resolution status FIRST (above the message)
    if (isResolved) {
      const resolutionMessage = this.hesTranslate.translate(
        'support.ticket.status.resolved',
      );
      const resolutionStage: SupportTicketDetailResolutionStatusStage = {
        id: `activity-${activity.id}-resolution-status`,
        kind: 'resolutionStatus',
        direction,
        disableBubbleStyling: true,
        fullWidth: false,
        showSupportAvatar: resolveSupportAvatar(),
        reserveSupportAvatarSpace: direction === 'receiver',
        acknowledgementTime: timestampLabel,
        message: resolutionMessage,
      };

      stages.push(resolutionStage);
    }

    // For resolved activities, use resolutionComment to show name/role
    if (isResolved) {
      const resolverName =
        activity.performedBy?.displayName ?? activity.user?.displayName ?? '';
      const resolverRole =
        activity.user?.role || detail.rolesDisplayName || null;

      if (hasBodyContent || resolverName) {
        const commentStage: SupportTicketDetailResolutionCommentStage = {
          id: `activity-${activity.id}-comment`,
          kind: 'resolutionComment',
          direction,
          name: resolverName,
          role: resolverRole,
          description: body,
          timestampLabel,
          timestamp: timestampLabel ?? undefined,
          showSupportAvatar: resolveSupportAvatar(),
          tone: isCurrentUserActivity ? 'self' : undefined,
        };

        stages.push(commentStage);
      }
    } else if (hasBodyContent) {
      const commentStage: SupportTicketDetailActivityStage = {
        id: `activity-${activity.id}-comment`,
        kind: 'activity',
        direction,
        actorName: '',
        actorRole: null,
        body,
        timestampLabel,
        timestamp: activity.createdAt,
        showSupportAvatar: resolveSupportAvatar(),
        tone: isCurrentUserActivity ? 'self' : undefined,
      };

      stages.push(commentStage);
    }

    if (imageAttachments.length) {
      const galleryStage: SupportTicketDetailGalleryStage = {
        id: `activity-${activity.id}-gallery`,
        kind: 'gallery',
        direction,
        attachments: imageAttachments,
        timestampLabel,
        timestamp: activity.createdAt,
        showSupportAvatar: resolveSupportAvatar(),
        disableBubbleStyling: true,
      };

      stages.push(galleryStage);
    }

    if (documentAttachments.length) {
      const documentsStage: SupportTicketDetailDocumentsStage = {
        id: `activity-${activity.id}-documents`,
        kind: 'documents',
        direction,
        documents: documentAttachments,
        timestampLabel,
        timestamp: activity.createdAt,
        showSupportAvatar: resolveSupportAvatar(),
        tone: isCurrentUserActivity ? 'self' : undefined,
      };

      stages.push(documentsStage);
    }

    if (activity.status === SupportTicketStatus.RESOLVED) {
      const resolutionMessage = this.hesTranslate.translate(
        'support.ticket.status.resolved',
      );
      const resolutionStage: SupportTicketDetailResolutionStatusStage = {
        id: `activity-${activity.id}-resolution-status`,
        kind: 'resolutionStatus',
        direction,
        timestamp: activity.createdAt,
        acknowledgementTime: timestampLabel,
        message: resolutionMessage,
      };

      stages.push(resolutionStage);
    }

    if (!stages.length && direction === 'receiver') {
      // ensure avatar spacing is preserved even if activity is empty
      const fallbackStage: SupportTicketDetailActivityStage = {
        id: `activity-${activity.id}-comment`,
        kind: 'activity',
        direction,
        actorName: '',
        actorRole: null,
        body: '',
        timestampLabel,
        timestamp: activity.createdAt,
        showSupportAvatar: resolveSupportAvatar() ?? false,
        tone: isCurrentUserActivity ? 'self' : undefined,
      };

      stages.push(fallbackStage);
    }

    return stages;
  }

  private resolveUserType(
    requester: SupportTicketCardConfig['requester'],
    fallbackRole: string | undefined,
  ): UserType | null {
    if (!requester) {
      return null;
    }

    if (requester.userType) {
      return requester.userType;
    }

    const role = (requester.role ?? fallbackRole ?? '').trim().toLowerCase();
    switch (role) {
      case 'student':
        return UserType.STUDENT;
      case 'guardian':
        return UserType.GUARDIAN;
      case 'teacher':
      case 'personnel':
      case 'staff':
      case 'principal':
      case 'counselor':
      case 'administrator':
        return UserType.PERSONNEL;
      default:
        return null;
    }
  }

  private handleResolutionAction(action: 'resolved' | 'notResolved'): void {
    const ticketId = this.ticketId();
    if (!ticketId) return;

    if (action === 'notResolved') {
      this.openSupportTicketFeedbackModal({
        ticketId: Number(ticketId),
        feedbackType: TicketFeedbackType.ISSUE,
        isInitiatorTicket: this.summary()?.isInitiatorTicket ?? false,
      });
      return;
    }

    // Show confirmation dialog for resolved action
    this.feedbackService.openFeedbackModal(
      {
        modalTitle: this.hesTranslate.t('support.resolution.question'),
        primaryBtnStr: this.hesTranslate.t('support.resolution.confirm_btn'),
        secondaryBtnStr: this.hesTranslate.t('support.resolution.back_btn'),
        type: 'question',
      },
      () => {
        this.resolveTicketAndOpenFeedback(Number(ticketId));
      },
    );
  }

  private resolveTicketAndOpenFeedback(ticketId: number): void {
    this.resolvingTicketState.set(true);

    this.supportHubTicketsService
      .resolveTicketAsInitiator(ticketId)
      .pipe(
        finalize(() => {
          this.resolvingTicketState.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.ticketActionsService.refreshTicketById(
            ticketId,
            this.summary()?.isInitiatorTicket ?? true,
          );
          this.openSupportTicketFeedbackModal({
            ticketId,
            feedbackType: TicketFeedbackType.RATING,
            isInitiatorTicket: this.summary()?.isInitiatorTicket ?? true,
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to resolve ticket:', error);
        },
      });
  }

  private getCurrentTimeLabel(): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  }

  protected getAttachmentName(attachment: IAttachment): string {
    if (!attachment) {
      return '';
    }

    let rawName = '';
    if (attachment.key) {
      const segments = attachment.key.split('/');
      if (segments.length) {
        rawName = segments[segments.length - 1];
      }
    }

    if (!rawName) {
      rawName = attachment.url;
    }

    // Extract clean filename: split on first hyphen, preserve extension
    const firstHyphenIndex = rawName.indexOf('-');
    if (firstHyphenIndex > 0) {
      const baseName = rawName.substring(0, firstHyphenIndex);
      const ext = attachment.extension || rawName.split('.').pop();
      return ext ? `${baseName}.${ext}` : baseName;
    }

    return rawName;
  }

  private isImageAttachment(attachment: IAttachment): boolean {
    if (!attachment?.extension) {
      return false;
    }

    return IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(
      attachment.extension.toLowerCase(),
    );
  }

  private toDsAttachment(attachment: IAttachment): DsAttachmentControlValue {
    return {
      extension: attachment.extension,
      key: attachment.key,
      url: attachment.url,
      id: attachment.id,
      isLink: attachment.isLink,
      viewStatus: attachment.viewStatus,
      name: this.getAttachmentName(attachment),
    };
  }
}
