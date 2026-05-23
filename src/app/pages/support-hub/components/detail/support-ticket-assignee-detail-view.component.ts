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
import { Router } from '@angular/router';
import { DsButtonComponent } from '@ds/button/button.component';
import { SupportTicketCardConfig } from '../ticket-card/support-ticket-card.component';
import { type SupportHubDetailHeaderConfig } from '../detail-header/support-hub-detail-header.component';
import {
  SupportTicketStatus,
  TicketFeedbackType,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { SupportTicketDetailStageHostComponent } from './support-ticket-detail-stage-host.component';
import { SupportTicketEscalationLadderModalComponent } from './support-ticket-escalation-ladder-modal.component';
import { DsModalService } from '@ds/modal';
import { SupportTicketDetailLayoutComponent } from './support-ticket-detail-layout.component';
import {
  SupportTicketDetailActivityRecipient,
  SupportTicketDetailActivityStage,
  SupportTicketDetailActivityPersonnelGroup,
  SupportTicketDetailDocument,
  SupportTicketDetailStage,
  SupportTicketDetailStageAvatar,
  SupportTicketDetailStageDirection,
  SupportTicketDetailStatusActivityStage,
  SupportTicketDetailSummaryAssignee,
  SupportTicketDetailSummaryStage,
  SupportTicketDetailSummaryStudent,
} from './support-ticket-detail-stage.model';
import { computeDateSeparatorIndices } from './support-ticket-detail-stage.utils';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { IAttachment } from '@shared/interfaces/attachment';
import type { SupportTicketCardStudent } from '../ticket-card/support-ticket-card.component';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { SupportTicketActionsService } from '@pages/support-hub/services/support-ticket-actions.service';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { formatToHestime, parseIsoToEpochMs } from '@shared/utils/date';
import { ScrollDateTrackingDirective } from '@shared/directives/scroll-date-tracking.directive';
import { DurationPipe } from '@shared/pipes/duration.pipe';
import { isRtl } from '@shared/utils/platform';
import { IMAGE_TYPES_PREVIEW_EXTENSTIONS } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { filter, finalize, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth.service';
import {
  faArrowTurnDown,
  faRotate,
  faUserPlus,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowTurnUp,
  faCircleCheck as faCircleCheckSolid,
  faMask,
} from '@fortawesome/pro-solid-svg-icons';
import { SupportTicketFeedback } from '../ticket-feedback-modal/data-access/support-ticket-feedback.interface';
import { createSupportTicketRatingLabel } from '../../utils/support-ticket-rating.util';
import { createSupportTicketFeedbackModal } from '../ticket-feedback-modal/support-ticket-feedback.modal';
import { FeedbackService } from '@shared/services/feedback.service';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

interface ResolutionFeedbackState {
  readonly title: string;
  readonly message: string | null;
  readonly timestampLabel: string;
  readonly rating: number | null;
  readonly ratingLabel: string | null;
}

@Component({
  selector: 'app-support-ticket-assignee-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    DsButtonComponent,
    SupportTicketDetailStageHostComponent,
    SupportTicketDetailLayoutComponent,
    DurationPipe,
    DsTranslatePipe,
    ScrollDateTrackingDirective,
  ],
  templateUrl: './support-ticket-assignee-detail-view.component.html',
})
export class SupportTicketAssigneeDetailViewComponent {
  readonly ticketId = input<string | null>(null);
  readonly summary = input<SupportTicketCardConfig | null>(null);
  readonly back = output<void>();
  readonly viewProfile = output<void>();

  private readonly router = inject(Router);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly ticketActionsService = inject(SupportTicketActionsService);
  private readonly auth = inject(AuthService);
  private readonly modalService = inject(DsModalService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly translateService = inject(HesTranslateService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isRtlLayout = isRtl();
  private readonly getSupportTicketRatingLabel =
    createSupportTicketRatingLabel();
  private readonly openSupportTicketFeedbackModal =
    createSupportTicketFeedbackModal();

  private readonly detailState = signal<SupportHubTicketDetail | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly detailReloadToken = signal(0);
  private readonly resolutionFeedbackState =
    signal<ResolutionFeedbackState | null>(null);
  private readonly resolvingTicketState = signal(false);

  protected readonly layoutRef =
    viewChild<SupportTicketDetailLayoutComponent>('detailLayout');

  protected readonly detail = computed(() => this.detailState());
  protected readonly isLoading = computed(() => this.loadingState());
  protected readonly error = computed(() => this.errorState());
  protected readonly isResolvingTicket = computed(() =>
    this.resolvingTicketState(),
  );
  private currentFeedbackTicketId: number | null = null;

  private readonly statusToneStyles: Record<
    Exclude<SupportTicketCardConfig['status']['tone'], undefined>,
    { backgroundClass: string; textClass: string }
  > = {
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
  } as const;

  private readonly categoryToneStyles: Record<
    Exclude<
      NonNullable<SupportTicketCardConfig['category']>['tone'],
      undefined
    >,
    { backgroundClass: string; textClass: string }
  > = {
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
  } as const;

  private readonly studentAvatarColors: UserProfileColors[] = [
    UserProfileColors.INDIGO,
    UserProfileColors.TEAL,
    UserProfileColors.BLUE,
    UserProfileColors.PURPLE,
    UserProfileColors.GREEN,
  ];

  private readonly assigneeAvatarColors: UserProfileColors[] = [
    UserProfileColors.CORAL,
    UserProfileColors.GREEN,
    UserProfileColors.INDIGO,
    UserProfileColors.TEAL,
    UserProfileColors.BRAND,
  ];

  private readonly escalateActivityIcon = faArrowTurnUp;
  private readonly deEscalateActivityIcon = faArrowTurnDown;
  private readonly resolvedActivityIcon = faCircleCheckSolid;
  private readonly reassignActivityIcon = faUserPlus;
  protected readonly resolveButtonIcon = faCircleCheckSolid;

  protected readonly toEpoch = parseIsoToEpochMs;

  protected readonly createdTimeLabel = computed(() => {
    const detail = this.detail();
    if (!detail?.createdAt) {
      return null;
    }

    return formatToHestime(detail.createdAt, this.isRtlLayout);
  });

  protected readonly attachments = computed(
    () => this.detail()?.attachments ?? [],
  );

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

  protected readonly resolveButtonVm = computed(() => {
    if (this.error()) {
      return null;
    }
    const menu = this.summary()?.menu;
    if (!menu?.length) {
      return null;
    }

    const resolveItem = menu.find(
      (item) => item?.id === 'resolve-ticket' && item.visible !== false,
    );

    if (!resolveItem?.action) {
      return null;
    }

    const label =
      this.translateService.t(resolveItem.title) ?? resolveItem.title;

    return {
      action: resolveItem.action,
      icon: this.resolveButtonIcon,
      label,
    } as const;
  });

  private readonly isCurrentUserInitiator = computed(() => {
    const detail = this.detail();
    if (!detail?.initiator?.id) {
      return false;
    }

    const currentUser = this.auth.user();
    const currentUserIds = new Set<number>();
    if (currentUser?.id != null) {
      currentUserIds.add(currentUser.id);
    }
    if (currentUser?.userTypeId != null) {
      currentUserIds.add(currentUser.userTypeId);
    }
    return currentUserIds.has(detail.initiator.id);
  });

  protected readonly showResolutionActions = computed(() => {
    const detail = this.detail();
    return (
      !!detail &&
      detail.status === SupportTicketStatus.RESOLVED &&
      !detail.resolvedByInitiator &&
      this.isCurrentUserInitiator() &&
      !this.error()
    );
  });

  protected readonly escalateAction = computed(() => {
    const menu = this.summary()?.menu;
    if (!menu?.length) {
      return null;
    }

    const escalateItem = menu.find(
      (item) => item?.id === 'escalate-ticket' && item.visible !== false,
    );

    return escalateItem?.action ?? null;
  });

  protected readonly imageAttachmentsForGallery = computed<
    DsAttachmentControlValue[]
  >(() =>
    this.imageAttachments().map((attachment) =>
      this.toDsAttachment(attachment),
    ),
  );

  protected readonly detailDocuments = computed<SupportTicketDetailDocument[]>(
    () =>
      this.documentAttachments().map((attachment, index) => ({
        id: attachment.id ? String(attachment.id) : `assignee-doc-${index}`,
        label: this.getAttachmentName(attachment),
        attachment,
      })),
  );

  protected readonly detailStages = computed<SupportTicketDetailStage[]>(() => {
    const summary = this.summary();
    const detail = this.detail();
    const summaryStage = this.summaryStage();
    if (!summaryStage || !detail) {
      return [];
    }

    const stages: SupportTicketDetailStage[] = [summaryStage];
    const isPrivateRequest = summary?.isPrivateRequest === true;
    const createdTimeLabel = this.createdTimeLabel();
    const requesterAvatar = this.buildRequesterAvatar(summary, detail);

    const galleryAttachments = this.imageAttachmentsForGallery();
    const hasInitialGallery = galleryAttachments.length > 0;

    if (hasInitialGallery) {
      stages.push({
        id: 'assignee-gallery',
        kind: 'gallery',
        direction: 'receiver',
        attachments: galleryAttachments,
        timestampLabel: createdTimeLabel,
        timestamp: detail.createdAt,
        disableBubbleStyling: true,
        avatar: undefined,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: true,
      });
    }

    const documents = this.detailDocuments();
    const hasInitialDocuments = documents.length > 0;

    if (hasInitialDocuments) {
      stages.push({
        id: 'assignee-documents',
        kind: 'documents',
        direction: 'receiver',
        documents,
        timestampLabel: createdTimeLabel,
        timestamp: detail.createdAt,
        avatar: undefined,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: true,
      });
    }

    const activityStages = this.buildActivityStages(detail);
    if (activityStages.length) {
      stages.push(...activityStages);
    }
    const resolutionFeedback = this.resolutionFeedbackState();
    if (resolutionFeedback) {
      const currentUserId = this.auth.user()?.id ?? null;
      const isSender =
        detail.status === SupportTicketStatus.RESOLVED &&
        !!detail.isResolved &&
        currentUserId != null &&
        detail.initiator?.id === currentUserId;
      const feedbackDirection = isSender ? 'sender' : 'receiver';
      const resolvedActivity = this.getLatestResolvedActivity(detail);
      stages.push({
        id: 'resolution-feedback',
        kind: 'resolutionFeedback',
        direction: feedbackDirection,
        timestamp: resolvedActivity?.createdAt ?? detail.createdAt,
        disableBubbleStyling: true,
        fullWidth: false,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: feedbackDirection === 'receiver',
        title: resolutionFeedback.title,
        comment: resolutionFeedback.message ?? null,
        rating: resolutionFeedback.rating,
        ratingLabel: resolutionFeedback.ratingLabel,
        timestampLabel: resolutionFeedback.timestampLabel,
      });
    }
    if (requesterAvatar && !hasInitialGallery && !hasInitialDocuments) {
      const receiverStageIndex = stages.reduce<number | null>(
        (acc, stage, index) => {
          if (stage.direction !== 'receiver') {
            return acc;
          }

          return index;
        },
        null,
      );
      if (receiverStageIndex !== null) {
        const receiverStage = stages[receiverStageIndex];
        const shouldInjectAvatar =
          !!requesterAvatar && receiverStage.avatar == null;

        stages[receiverStageIndex] = {
          ...receiverStage,
          ...(shouldInjectAvatar
            ? {
                avatar: requesterAvatar,
                showSupportAvatar: receiverStage.showSupportAvatar ?? true,
              }
            : {}),
          reserveSupportAvatarSpace:
            receiverStage.reserveSupportAvatarSpace ?? true,
        };
      }
    }
    if (!isPrivateRequest) {
      return stages;
    }

    return stages.map((stage) => {
      if (stage.direction !== 'receiver') {
        return stage;
      }

      return {
        ...stage,
        avatar: undefined,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: false,
      };
    });
  });

  protected readonly dateSeparatorIndices = computed(() =>
    computeDateSeparatorIndices(this.detailStages()),
  );

  protected readonly headerConfig =
    computed<SupportHubDetailHeaderConfig | null>(() => {
      const summary = this.summary();
      const detail = this.detail();

      if (!summary) {
        return null;
      }

      const requester = summary.requester;
      if (!requester && !detail?.initiator) {
        return null;
      }

      const privateRequestLabel =
        this.translateService.t('support.request.anonymous.title') ??
        'Private request';
      const isPrivateRequest = summary.isPrivateRequest === true;

      // Prefer detail information over summary when available
      const initiator = detail?.initiator;
      const resolvedName = isPrivateRequest
        ? privateRequestLabel
        : initiator?.displayName?.trim() || (requester?.name ?? '').trim();
      const fallbackTitle =
        resolvedName || (summary.initiatorDisplayName ?? '').trim() || '—';

      const detailRoleName = (initiator?.role?.displayName ?? '').trim();
      let subtitle = detailRoleName || null;

      if (!subtitle) {
        const hasRealInitiator = Boolean(initiator?.id);
        const effectiveType = hasRealInitiator
          ? initiator?.type
          : (detail?.createdByType ?? null);
        const userTypeLabel = this.getUserTypeLabel(effectiveType);
        const trimmedUserTypeLabel = userTypeLabel?.trim();
        subtitle = trimmedUserTypeLabel || null;
      }

      const highlightBadges: string[] = [];
      if (initiator?.type === UserType.STUDENT) {
        const levelName = detail?.schoolStructure.level?.displayName?.trim();
        const className = detail?.schoolStructure.class?.displayName?.trim();

        const badgeString = [levelName, className].filter(Boolean).join(' - ');
        if (badgeString) {
          highlightBadges.push(badgeString);
        }
      }

      const initiatorProfileId = initiator?.userTypeId ?? initiator?.id ?? null;
      const canNavigate =
        !isPrivateRequest &&
        Boolean(initiatorProfileId ?? requester?.id ?? null);

      return {
        fullName: resolvedName || fallbackTitle,
        title: isPrivateRequest ? privateRequestLabel : fallbackTitle,
        subtitle,
        role: subtitle,
        avatarColor: requester?.avatarColor ?? UserProfileColors.NEUTRAL,
        avatarUrl: isPrivateRequest ? null : (requester?.avatarUrl ?? null),
        avatarIcon: isPrivateRequest ? faMask : null,
        avatarIconCssClass: isPrivateRequest ? 'text-icon-high' : null,
        // TODO: we need to show level and class
        badgeText: null,
        highlightBadges,
        canNavigateToProfile: canNavigate,
        showProfileButton: isPrivateRequest ? true : canNavigate,
      } satisfies SupportHubDetailHeaderConfig;
    });

  private getUserTypeLabel(
    userType: UserType | null | undefined,
  ): string | null {
    switch (userType) {
      case UserType.STUDENT:
        return this.translateService.t('global.student.txt') || 'Student';
      case UserType.GUARDIAN:
        return this.translateService.t('enum.GUARDIAN') || 'Guardian';
      case UserType.PERSONNEL:
        return this.translateService.t('global.personnel.txt') || 'Personnel';
      default:
        return null;
    }
  }

  protected readonly schoolInfo = computed<
    SupportTicketCardConfig['school'] | null
  >(() => {
    const summarySchool = this.summary()?.school;
    if (summarySchool && (summarySchool.title || summarySchool.subtitle)) {
      return summarySchool;
    }

    return this.buildSchoolInfo(this.detail());
  });

  protected readonly showSchoolInfo = computed(() => {
    const school = this.schoolInfo();
    if (!school) {
      return false;
    }

    const title = school.title?.trim();
    const subtitle = school.subtitle?.trim();
    return Boolean(title || subtitle);
  });

  protected readonly summaryStage =
    computed<SupportTicketDetailSummaryStage | null>(() => {
      const summary = this.summary();
      const detail = this.detail();
      if (!summary) {
        return null;
      }

      const isPrivateRequest = summary.isPrivateRequest === true;
      const statusBadge = this.buildStatusBadge(summary);
      const categoryBadge = summary.category
        ? this.buildCategoryBadge(summary)
        : null;
      const students = isPrivateRequest
        ? []
        : this.buildStudentSummaries(summary.students, detail);
      const assignees = this.buildAssigneeSummaries(
        summary.assigneesDetail,
        detail,
      );
      const escalationLabel = this.buildCurrentEscalationLevelLabel(detail);
      const escalation = escalationLabel ? { label: escalationLabel } : null;

      return {
        id: 'assignee-summary',
        kind: 'summary',
        direction: 'receiver',
        timestamp: detail?.createdAt ?? undefined,
        ticketNumber: summary.ticketNumber,
        title:
          detail?.supportCategories?.[0]?.displayName ?? summary.subCategory,
        description: detail?.description ?? summary.description,
        createdAt: detail?.createdAt ?? null,
        createdTimeLabel: this.createdTimeLabel(),
        statusBadge,
        categoryBadge,
        students,
        assigneesLabel: assignees.length
          ? this.translateService.t('support_ticket.assignee.label')
          : null,
        assignees,
        escalation,
        preserveCornerRadius: false,
        showSupportAvatar: false,
        reserveSupportAvatarSpace: false,
        menuItems: this.buildStageMenuItems(summary.menu),
        customFields: detail?.customFields?.length
          ? detail.customFields.map((field) => ({
              id: field.id,
              label: field.label,
              value: field.value,
            }))
          : undefined,
      } satisfies SupportTicketDetailSummaryStage;
    });

  private buildCurrentEscalationLevelLabel(
    detail: SupportHubTicketDetail | null,
  ): string | null {
    if (!detail) {
      return null;
    }

    const { currentEscalationLevelNumber, firstEscalationLevelNumber } = detail;

    if (
      currentEscalationLevelNumber === null ||
      currentEscalationLevelNumber === undefined
    ) {
      return null;
    }

    // Default escalation level (first level or level 0)
    if (
      currentEscalationLevelNumber === firstEscalationLevelNumber ||
      currentEscalationLevelNumber === 0
    ) {
      return this.translateService.t(
        'support_ticket.default_escalation_level.title',
      );
    }

    // Other escalation levels
    const levelTitle = this.translateService.t(
      'support_ticket.escalation_level.title',
    );
    return `${levelTitle} ${currentEscalationLevelNumber}`;
  }

  private buildStageMenuItems(
    menu: ReadonlyArray<PopupItem> | null | undefined,
  ): PopupItem[] | null {
    if (!menu?.length) {
      return null;
    }

    return menu.map((item) =>
      item.id === 'view-details' ? { ...item, visible: false } : { ...item },
    );
  }

  protected onBackRequested(): void {
    this.back.emit();
  }

  protected onViewProfileRequested(): void {
    const detail = this.detail();
    const initiator = detail?.initiator;

    const profileId = initiator?.userTypeId ?? initiator?.id ?? null;

    if (!profileId) {
      this.viewProfile.emit();
      return;
    }

    if (!initiator?.type) {
      this.viewProfile.emit();
      return;
    }

    // Navigate based on user type
    switch (initiator.type) {
      case UserType.STUDENT:
        void this.router.navigate(['/user-management/students', profileId]);
        break;
      case UserType.GUARDIAN:
        void this.router.navigate(['/user-management/guardians', profileId]);
        break;
      case UserType.PERSONNEL:
        void this.router.navigate(['/user-management/personnels', profileId]);
        break;
      default:
        this.viewProfile.emit();
    }
  }

  protected onResolveTicketRequested(): void {
    const resolveButton = this.resolveButtonVm();
    if (!resolveButton) {
      return;
    }

    resolveButton.action();
  }

  protected onResolvedClicked(): void {
    this.handleResolutionAction('resolved');
  }

  protected onNotResolvedClicked(): void {
    this.handleResolutionAction('notResolved');
  }

  protected onEscalationInfoRequested(): void {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const action = this.escalateAction();
    void this.modalService.open({
      component: SupportTicketEscalationLadderModalComponent,
      componentProps: {
        ticketDetail: detail,
        escalateAction: action,
      },
      headerConfig: {
        title: this.translateService.t(
          'support_tickets.escalation_ladder.title',
        ),
        showCloseButton: true,
      },
      ...(action
        ? {
            footerConfig: {
              primaryButton: {
                text:
                  this.translateService.t(
                    'support_ticket.escalate_ticket.title',
                  ) ?? 'Escalate',
                variant: 'dangerStroke',
                iconStart: faArrowTurnUp,
              },
              buttonSize: 'lg',
            },
          }
        : {}),
      size: 'lg',
      contentClass: 'p-0',
      backdropDismiss: true,
    });
  }

  private handleResolutionAction(action: 'resolved' | 'notResolved'): void {
    const ticketId = this.ticketId();
    if (!ticketId) {
      return;
    }

    if (action === 'notResolved') {
      this.openSupportTicketFeedbackModal({
        ticketId: Number(ticketId),
        feedbackType: TicketFeedbackType.ISSUE,
        isInitiatorTicket: this.summary()?.isInitiatorTicket ?? false,
      });
      return;
    }

    this.feedbackService.openFeedbackModal(
      {
        modalTitle: this.translateService.t('support.resolution.question'),
        primaryBtnStr: this.translateService.t(
          'support.resolution.confirm_btn',
        ),
        secondaryBtnStr: this.translateService.t('support.resolution.back_btn'),
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
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.resolvingTicketState.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.ticketActionsService.refreshTicketById(
            ticketId,
            this.summary()?.isInitiatorTicket ?? false,
          );
          this.openSupportTicketFeedbackModal({
            ticketId,
            feedbackType: TicketFeedbackType.RATING,
            isInitiatorTicket: this.summary()?.isInitiatorTicket ?? false,
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to resolve ticket:', error);
        },
      });
  }

  constructor() {
    effect(
      (onCleanup) => {
        void this.detailReloadToken();
        const ticketId = this.ticketId();

        if (!ticketId) {
          this.resetState();
          return;
        }

        const trimmedTicketId = ticketId.trim();
        if (!trimmedTicketId) {
          this.resetState();
          return;
        }

        const numericId = Number(trimmedTicketId);
        if (!Number.isFinite(numericId)) {
          this.handleLoadFailure('Unable to load ticket details.');
          return;
        }

        this.loadingState.set(true);
        this.errorState.set(null);
        this.detailState.set(null);
        this.resolutionFeedbackState.set(null);
        this.currentFeedbackTicketId = null;

        const subscription = this.supportHubTicketsService
          .getTicketDetailsAsAssignee(String(numericId))
          .subscribe({
            next: (detail) => {
              this.detailState.set(detail);
              this.loadingState.set(false);
              this.loadResolutionFeedback(detail);
            },
            error: (error: unknown) => {
              this.handleLoadFailure(this.resolveErrorMessage(error));
              this.resolutionFeedbackState.set(null);
              this.currentFeedbackTicketId = null;
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
  }

  private buildStatusBadge(
    summary: SupportTicketCardConfig,
  ): SupportTicketDetailSummaryStage['statusBadge'] {
    const tone = summary.status.tone;
    const toneStyles = tone ? this.statusToneStyles[tone] : undefined;
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
  }

  private buildCategoryBadge(
    summary: SupportTicketCardConfig,
  ): SupportTicketDetailSummaryStage['categoryBadge'] {
    const category = summary.category;
    if (!category) {
      return null;
    }

    const tone = category.tone;
    const toneStyles = tone ? this.categoryToneStyles[tone] : undefined;

    return {
      label: category.label,
      backgroundClass:
        toneStyles?.backgroundClass ?? 'bg-surface-pastel-background-green',
      textClass:
        toneStyles?.textClass ?? 'text-surface-pastel-foreground-green',
      ...(category.icon
        ? {
            icon: category.icon,
            iconColorClass:
              category.iconColorClass ??
              toneStyles?.textClass ??
              'text-surface-pastel-foreground-green',
          }
        : {}),
    };
  }

  private buildStudentSummaries(
    students: ReadonlyArray<SupportTicketCardStudent> | undefined,
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailSummaryStudent[] {
    const scopedStudents = this.studentSelectionScope.studentSelectionScope();

    const baseStudents = students?.length
      ? students.map((student) => ({
          id: student.id,
          fullName: student.displayName,
        }))
      : detail?.initiator
        ? [
            {
              id: detail.initiator.id,
              fullName: detail.initiator.displayName,
            },
          ]
        : [];

    if (!baseStudents.length) {
      return [];
    }

    return baseStudents.map((student, index) => {
      const scoped = scopedStudents.find((item) => item.id === student.id);
      return {
        id: String(student.id),
        fullName: student.fullName,
        avatarUrl: scoped?.image ?? null,
        avatarColor:
          this.studentAvatarColors[index % this.studentAvatarColors.length] ??
          UserProfileColors.NEUTRAL,
        levelLabel: scoped?.school?.level?.displayName ?? null,
        classLabel: scoped?.school?.class?.displayName ?? null,
      } satisfies SupportTicketDetailSummaryStudent;
    });
  }

  private buildAssigneeSummaries(
    summaryAssignees:
      | ReadonlyArray<
          NonNullable<SupportTicketCardConfig['assigneesDetail']>[number]
        >
      | undefined,
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailSummaryAssignee[] {
    const detailAssignees = this.buildDetailLevelAssignees(detail);
    const sourceAssignees =
      detailAssignees.length > 0
        ? detailAssignees
        : (summaryAssignees?.map((assignee) => ({
            id: String(assignee.id),
            name: assignee.name,
            role: assignee.role ?? null,
            avatarColor: assignee.avatarColor ?? null,
          })) ?? []);

    return sourceAssignees.map(
      (assignee, index) =>
        ({
          id: String(assignee.id),
          name: assignee.name,
          role: assignee.role ?? null,
          avatarColor:
            assignee.avatarColor ??
            this.assigneeAvatarColors[
              index % this.assigneeAvatarColors.length
            ] ??
            UserProfileColors.NEUTRAL,
        }) satisfies SupportTicketDetailSummaryAssignee,
    );
  }

  private buildRequesterAvatar(
    summary: SupportTicketCardConfig | null,
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailStageAvatar | null {
    const requester = summary?.requester;
    const isPrivateRequest = summary?.isPrivateRequest === true;
    if (isPrivateRequest) {
      return null;
    }
    const privateRequestLabel =
      this.translateService.t('support.request.anonymous.title') ??
      'Private request';
    const fullName =
      (isPrivateRequest
        ? privateRequestLabel
        : (requester?.name ?? '')
      ).trim() ||
      (isPrivateRequest
        ? privateRequestLabel
        : (summary?.initiatorDisplayName ?? '')
      ).trim() ||
      (isPrivateRequest
        ? privateRequestLabel
        : (detail?.userDisplayName ?? '')
      ).trim() ||
      (isPrivateRequest
        ? privateRequestLabel
        : (detail?.initiator?.displayName ?? '')
      ).trim();

    if (!fullName) {
      return null;
    }

    return {
      fullName,
      avatarUrl: isPrivateRequest ? null : (requester?.avatarUrl ?? null),
      avatarColor: requester?.avatarColor ?? null,
      icon: isPrivateRequest ? faMask : null,
      iconCssClass: isPrivateRequest ? 'text-icon-high' : null,
    } satisfies SupportTicketDetailStageAvatar;
  }

  private buildDetailLevelAssignees(
    detail: SupportHubTicketDetail | null,
  ): Array<{
    id: string | number;
    name: string;
    role?: string | null;
    avatarColor?: UserProfileColors | null;
  }> {
    if (!detail?.ticketEscalations?.length) {
      return [];
    }

    const targetLevel = detail.currentEscalationLevelNumber;
    if (targetLevel === null || targetLevel === undefined) {
      return [];
    }

    const matchingEscalation = detail.ticketEscalations.find(
      (escalation) => escalation.levelNumber === targetLevel,
    );

    const personnels = matchingEscalation?.ticketEscalationPersonnels ?? [];

    return personnels
      .map((personnel) => ({
        id: personnel.userId ?? personnel.id,
        name: personnel.displayName,
        role: (() => {
          const roles = Array.isArray(personnel.roles) ? personnel.roles : [];
          const displayRoles = roles
            .map((role) => role?.displayName?.trim())
            .filter((name): name is string => Boolean(name?.length));
          return displayRoles.length ? displayRoles.join(', ') : null;
        })(),
        avatarColor: null,
      }))
      .filter((personnel) => Boolean(personnel.name));
  }

  private buildSchoolInfo(
    detail: SupportHubTicketDetail | null,
  ): SupportTicketCardConfig['school'] | null {
    const structure = detail?.schoolStructure;
    if (!structure) {
      return null;
    }

    const companyName = structure.company?.displayName?.trim() ?? '';
    const campusName = structure.campus?.displayName?.trim() ?? '';
    const schoolName = structure.school?.displayName?.trim() ?? '';

    const titleParts = [companyName, campusName].filter(
      (name, index, list) => !!name && list.indexOf(name) === index,
    ) as string[];
    const title = titleParts.join(' - ').trim();

    if (!title && !schoolName) {
      return null;
    }

    return {
      title: title || schoolName,
      ...(schoolName && title ? { subtitle: schoolName } : {}),
    };
  }

  private buildActivityStages(
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailStage[] {
    if (!detail?.ticketActivity?.length) {
      return [];
    }

    return detail.ticketActivity.flatMap((activity) =>
      this.mapActivityToStages(activity),
    );
  }

  private determineActivityDirection(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    detail: SupportHubTicketDetail | null,
  ): 'receiver' | 'sender' {
    if (!detail || !activity) {
      return 'receiver';
    }

    return activity.isPerformedByInitiator ? 'receiver' : 'sender';
  }

  private buildAttachmentStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    detail: SupportHubTicketDetail | null,
    prefix: string,
    showAvatarOnAttachments = true,
    directionOverride?: SupportTicketDetailStageDirection,
  ): SupportTicketDetailStage[] {
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const direction =
      directionOverride ?? this.determineActivityDirection(activity, detail);
    const summary = this.summary();
    const requesterAvatar =
      direction === 'receiver'
        ? this.buildRequesterAvatar(summary, detail)
        : null;
    const { galleryAttachments, documentAttachments } =
      this.buildStatusActivityAttachments(activity, prefix);

    const stages: SupportTicketDetailStage[] = [];
    const showAvatar =
      showAvatarOnAttachments && direction === 'receiver' && !!requesterAvatar;
    const reserveAvatarSpace = direction === 'receiver';
    const isSender = direction === 'sender';
    const galleryFullWidth = !isSender;

    if (galleryAttachments.length) {
      stages.push({
        id: `activity-${activity.id}-gallery`,
        kind: 'gallery',
        direction,
        attachments: galleryAttachments,
        disableBubbleStyling: true,
        fullWidth: galleryFullWidth,
        avatar: showAvatar ? requesterAvatar : undefined,
        showSupportAvatar: showAvatar,
        reserveSupportAvatarSpace: reserveAvatarSpace,
        timestamp: activity.createdAt,
        timestampLabel: null,
        tone: isCurrentUser ? 'self' : undefined,
      });
    }

    if (documentAttachments.length) {
      stages.push({
        id: `activity-${activity.id}-documents`,
        kind: 'documents',
        direction,
        documents: documentAttachments,
        fullWidth: isSender ? false : true,
        avatar:
          showAvatar && !galleryAttachments.length
            ? requesterAvatar
            : undefined,
        showSupportAvatar: showAvatar && !galleryAttachments.length,
        reserveSupportAvatarSpace: reserveAvatarSpace,
        timestamp: activity.createdAt,
        timestampLabel: null,
        tone: isCurrentUser ? 'self' : undefined,
      });
    }

    return stages;
  }

  private transformStagesToReceiver(
    stages: SupportTicketDetailStage[],
  ): SupportTicketDetailStage[] {
    return stages.map((stage) => {
      if (stage.kind === 'gallery' || stage.kind === 'documents') {
        return {
          ...stage,
          direction: 'receiver',
          reserveSupportAvatarSpace: true,
          avatar: undefined,
          showSupportAvatar: false,
        };
      }

      return {
        ...stage,
        direction: 'receiver',
        reserveSupportAvatarSpace: true,
        avatar: undefined,
        showSupportAvatar: false,
      };
    });
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
      this.formatActivityTime(timestampSource) ?? this.getCurrentTimeLabel();

    const rawComment = feedback?.comment?.trim() ?? '';
    const ratingValue = feedback?.rating ?? null;
    const normalizedRating =
      ratingValue && ratingValue > 0 ? Math.min(ratingValue, 5) : null;

    return {
      title: this.translateService.translate('support.status.resolved_tag'),
      message: rawComment.length ? rawComment : null,
      timestampLabel,
      rating: normalizedRating,
      ratingLabel: this.getSupportTicketRatingLabel(normalizedRating),
    } satisfies ResolutionFeedbackState;
  }

  private getLatestResolvedActivity(
    detail: SupportHubTicketDetail,
  ): SupportHubTicketDetail['ticketActivity'][number] | null {
    if (!detail.ticketActivity?.length) {
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

  private mapActivityToStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    if (!activity) {
      return [];
    }

    if (activity.status === SupportTicketStatus.ESCALATED) {
      return this.createEscalatedStages(activity);
    }

    if (activity.status === SupportTicketStatus.DE_ESCALATE) {
      return this.createDeEscalatedStages(activity);
    }

    if (activity.status === SupportTicketStatus.RESOLVED) {
      return this.createResolvedStages(activity);
    }

    if (activity.status === SupportTicketStatus.RE_OPEN) {
      return this.createReopenedStages(activity);
    }

    if (activity.status === SupportTicketStatus.RE_ASSIGN) {
      return this.createReassignedStages(activity);
    }

    return [];
  }

  private createReopenedStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    const timestampLabel = this.formatActivityTime(activity.createdAt);
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const direction: SupportTicketDetailStageDirection = isCurrentUser
      ? 'sender'
      : 'receiver';
    const reopenedTitle =
      this.translateService.translate('support.status.ticket_reopened') ??
      this.translateService.translate('support.ticket.status.reopened') ??
      'Ticket Re-opened';

    return [
      {
        id: `activity-${activity.id}`,
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
        message: this.buildActivityMessage(activity),
        timestamp: activity.createdAt,
        timestampLabel,
        receiptStatus: isCurrentUser ? 'delivered' : undefined,
      } satisfies SupportTicketDetailStatusActivityStage,
    ];
  }

  private createEscalatedStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    const detail = this.detail();
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const timestampLabel = this.formatActivityTime(activity.createdAt);
    const direction: SupportTicketDetailStageDirection = isCurrentUser
      ? 'sender'
      : 'receiver';

    const statusStage: SupportTicketDetailStatusActivityStage = {
      id: `activity-${activity.id}`,
      kind: 'statusActivity',
      direction,
      activityType: 'escalated',
      disableBubbleStyling: true,
      fullWidth: true,
      showSupportAvatar: false,
      reserveSupportAvatarSpace: false,
      icon: this.escalateActivityIcon,
      iconColorClass: 'text-icon-error',
      backgroundClass: 'bg-surface-danger-subtle',
      borderClass: 'border-stroke-black-04',
      title: this.translateService.t('support.log.ticket_escalated'),
      subtitle: this.buildActivitySubtitle(
        activity,
        this.translateService.translate('support.ticket.status.escalated') ??
          'Escalated',
      ),
      message: this.buildActivityMessage(activity),
      recipients: this.buildActivityRecipients(activity),
      timestamp: activity.createdAt,
      timestampLabel,
      receiptStatus: isCurrentUser ? 'delivered' : undefined,
    } satisfies SupportTicketDetailStatusActivityStage;

    const attachmentStages = this.buildAttachmentStages(
      activity,
      detail,
      `escalated-${activity.id}`,
      false,
      direction,
    );

    return [statusStage, ...attachmentStages];
  }

  private createDeEscalatedStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    const detail = this.detail();
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const timestampLabel = this.formatActivityTime(activity.createdAt);
    const direction: SupportTicketDetailStageDirection = isCurrentUser
      ? 'sender'
      : 'receiver';

    const statusStage: SupportTicketDetailStatusActivityStage = {
      id: `activity-${activity.id}`,
      kind: 'statusActivity',
      direction,
      activityType: 'deEscalated',
      disableBubbleStyling: true,
      fullWidth: true,
      showSupportAvatar: false,
      reserveSupportAvatarSpace: false,
      icon: this.deEscalateActivityIcon,
      iconColorClass: 'text-icon-mid',
      backgroundClass: 'bg-surface-secondary',
      borderClass: 'border-stroke-black-08',
      title:
        this.translateService.translate('support.log.ticket_de_escalated') ??
        'Ticket de-escalated',
      subtitle: this.buildActivitySubtitle(
        activity,
        this.translateService.translate('support.ticket.status.de_escalated') ??
          'De-escalated',
      ),
      message: this.buildActivityMessage(activity),
      recipients: this.buildActivityRecipients(activity),
      timestamp: activity.createdAt,
      timestampLabel,
      receiptStatus: isCurrentUser ? 'delivered' : undefined,
    } satisfies SupportTicketDetailStatusActivityStage;

    const attachmentStages = this.buildAttachmentStages(
      activity,
      detail,
      `deescalated-${activity.id}`,
      false,
      direction,
    );

    return [statusStage, ...attachmentStages];
  }

  private createReassignedStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    const detail = this.detail();
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const direction: SupportTicketDetailStageDirection = isCurrentUser
      ? 'sender'
      : 'receiver';
    const timestampLabel = this.formatActivityTime(activity.createdAt);
    const performerName = this.resolveActivityActorName(activity);
    const subtitle = performerName
      ? this.buildReassignSubtitle(performerName)
      : null;
    const subtitleMeta = this.buildReassignSubtitleMeta(
      activity,
      performerName,
    );
    const personnelGroups = this.buildReassignPersonnelGroups(activity);
    const title =
      this.translateService.t('support.action.reassign') ??
      'Ticket re-assigned';

    const statusStage: SupportTicketDetailStatusActivityStage = {
      id: `activity-${activity.id}`,
      kind: 'statusActivity',
      direction,
      activityType: 'reassigned',
      disableBubbleStyling: true,
      fullWidth: true,
      showSupportAvatar: false,
      reserveSupportAvatarSpace: false,
      icon: this.reassignActivityIcon,
      iconColorClass: 'text-surface-pastel-foreground-blue',
      backgroundClass: 'bg-surface-pastel-background-blue-rich',
      borderClass: 'border-stroke-black-04',
      title,
      titleClass: 'heading-h5-high-emphasis text-emphasis-high',
      subtitle,
      subtitleClass: 'content-xs-mid-emphasis text-emphasis-mid',
      subtitleMeta,
      personnelGroups,
      timestamp: activity.createdAt,
      timestampLabel,
      tone: isCurrentUser ? 'self' : undefined,
      receiptStatus: isCurrentUser ? 'delivered' : undefined,
    } satisfies SupportTicketDetailStatusActivityStage;

    const attachmentStages = this.buildAttachmentStages(
      activity,
      detail,
      `reassign-${activity.id}`,
      false,
      direction,
    );

    return [statusStage, ...attachmentStages];
  }

  private buildReassignSubtitleMeta(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    performerName: string | null,
  ): string | null {
    const performerRole = this.normalizeRole(activity.user?.role);
    if (!performerRole) {
      return null;
    }

    if (performerName) {
      const youLabel =
        this.translateService.translate('global.you.txt') ?? 'You';
      if (
        performerName.trim().toLowerCase() === youLabel.trim().toLowerCase()
      ) {
        return null;
      }
      const normalizedPerformerName = performerName.trim().toLowerCase();
      if (
        normalizedPerformerName.length &&
        normalizedPerformerName === performerRole.toLowerCase()
      ) {
        return null;
      }
    }

    return performerRole;
  }

  private buildReassignPersonnelGroups(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): readonly SupportTicketDetailActivityPersonnelGroup[] {
    const removedLabel =
      this.translateService.t('support_ticket.reassign.removed_label') ??
      'Removed';
    const assignedLabel =
      this.translateService.t('support_ticket.reassign.assigned_label') ??
      'Assigned';

    const groups: SupportTicketDetailActivityPersonnelGroup[] = [];
    const removed = this.mapPersonnelToRecipients(activity.removedPersonnels);
    if (removed.length) {
      groups.push({ label: removedLabel, personnels: removed });
    }

    const assigned = this.mapPersonnelToRecipients(activity.addedPersonnels);
    if (assigned.length) {
      groups.push({ label: assignedLabel, personnels: assigned });
    }

    return groups;
  }

  private mapPersonnelToRecipients(
    personnels: SupportHubTicketDetail['ticketActivity'][number]['addedPersonnels'],
  ): SupportTicketDetailActivityRecipient[] {
    if (!personnels?.length) {
      return [];
    }

    return personnels
      .filter((personnel) => personnel?.displayName?.trim())
      .map(
        (personnel, index) =>
          ({
            id: `${personnel.id ?? index}`,
            name: personnel.displayName.trim(),
            role: this.normalizeRole(personnel.role),
          }) satisfies SupportTicketDetailActivityRecipient,
      );
  }

  private resolveActivityActorName(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): string | null {
    const currentUserId = this.auth.user()?.id;
    if (currentUserId && activity.performedById === currentUserId) {
      return 'You';
    }

    const performerName = activity.performedBy?.displayName?.trim();
    if (performerName) {
      return performerName;
    }

    const fallbackName = activity.user?.displayName?.trim();
    if (fallbackName) {
      return fallbackName;
    }

    const supportLabel = this.translateService.translate(
      'global.support.title',
    );
    const trimmedSupportLabel = supportLabel?.trim() ?? '';
    return trimmedSupportLabel.length ? trimmedSupportLabel : null;
  }

  private buildReassignSubtitle(actorName: string): string {
    const byLabel =
      this.translateService.t('support_ticket.reassign.by_label') ?? 'By';
    return `${byLabel} ${actorName}`;
  }

  private normalizeRole(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private createResolvedStages(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): SupportTicketDetailStage[] {
    const detail = this.detail();
    const summary = this.summary();
    const isCurrentUser = this.isActivityFromCurrentUser(activity);
    const timestampLabel = this.formatActivityTime(activity.createdAt);
    const baseAttachmentStages = this.buildAttachmentStages(
      activity,
      detail,
      `resolved-${activity.id}`,
      false,
    );
    const resolvedDirection: SupportTicketDetailStageDirection = isCurrentUser
      ? 'sender'
      : 'receiver';
    const resolvedAvatar = this.buildResolvedStageAvatar(
      activity,
      resolvedDirection,
      summary,
      detail,
    );
    const attachmentStages = !isCurrentUser
      ? this.transformStagesToReceiver(baseAttachmentStages)
      : baseAttachmentStages;

    const messageBody = this.buildActivityMessage(activity);
    if (messageBody) {
      const messageStage = this.createResolvedCommentStage(
        activity,
        messageBody,
        resolvedDirection,
        isCurrentUser,
        resolvedAvatar,
        timestampLabel,
        false,
        false,
      );
      attachmentStages.push(messageStage);
    }

    attachmentStages.push(
      this.createResolvedStage(activity, {
        isCurrentUser,
        timestampLabel,
        direction: resolvedDirection,
        avatar: resolvedAvatar,
      }),
    );
    return attachmentStages;
  }

  private buildResolvedStageAvatar(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    direction: SupportTicketDetailStageDirection,
    summary: SupportTicketCardConfig | null,
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailStageAvatar | null {
    const performerAvatar = this.resolveActivityPerformerAvatar(
      activity,
      summary,
      detail,
    );
    if (performerAvatar) {
      return performerAvatar;
    }

    if (direction !== 'receiver') {
      return null;
    }

    const fallbackName =
      activity.performedBy?.displayName?.trim() ||
      this.buildResolvedActorName(activity)?.trim() ||
      '';

    if (!fallbackName) {
      return null;
    }

    const performerId =
      activity.performedById ?? activity.performedBy?.id ?? null;

    return {
      fullName: fallbackName,
      avatarUrl: null,
      avatarColor: this.resolveActivityPerformerAvatarColor(performerId),
    } satisfies SupportTicketDetailStageAvatar;
  }

  private createResolvedCommentStage(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    body: string,
    direction: SupportTicketDetailStageDirection,
    isCurrentUser: boolean,
    avatar: SupportTicketDetailStageAvatar | null,
    timestampLabel: string | null,
    showAvatar: boolean,
    showActorName = true,
  ): SupportTicketDetailActivityStage {
    const shouldShowAvatar = showAvatar && direction === 'receiver' && !!avatar;

    return {
      id: `activity-${activity.id}-message`,
      kind: 'activity',
      direction,
      actorName: showActorName ? this.buildResolvedActorName(activity) : '',
      actorRole: null,
      body,
      timestampLabel,
      timestamp: activity.createdAt,
      avatar: shouldShowAvatar ? avatar : undefined,
      showSupportAvatar: shouldShowAvatar,
      reserveSupportAvatarSpace: direction === 'receiver',
      tone: isCurrentUser ? 'self' : undefined,
    } satisfies SupportTicketDetailActivityStage;
  }

  private resolveActivityPerformerAvatar(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    summary: SupportTicketCardConfig | null,
    detail: SupportHubTicketDetail | null,
  ): SupportTicketDetailStageAvatar | null {
    const performerId =
      activity.performedById ?? activity.performedBy?.id ?? null;
    const detailMatch = this.findPersonnelById(detail, performerId);
    const summaryMatch = this.findSummaryAssigneeById(summary, performerId);

    const performerName =
      activity.performedBy?.displayName?.trim() ??
      detailMatch?.displayName?.trim() ??
      summaryMatch?.name?.trim() ??
      '';

    if (!performerName) {
      return null;
    }

    const avatarColor =
      summaryMatch?.avatarColor ??
      this.resolveActivityPerformerAvatarColor(performerId);

    return {
      fullName: performerName,
      avatarUrl: null,
      avatarColor,
    } satisfies SupportTicketDetailStageAvatar;
  }

  private findPersonnelById(
    detail: SupportHubTicketDetail | null,
    performerId: number | null,
  ): { id: number; userId: number; displayName: string } | null {
    if (!detail?.ticketEscalations?.length || performerId === null) {
      return null;
    }

    for (const escalation of detail.ticketEscalations) {
      const match = escalation.ticketEscalationPersonnels.find(
        (personnel) =>
          personnel.userId === performerId || personnel.id === performerId,
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  private findSummaryAssigneeById(
    summary: SupportTicketCardConfig | null,
    performerId: number | null,
  ): Readonly<{
    id: number | string;
    name: string;
    role?: string | null;
    avatarColor?: UserProfileColors;
  }> | null {
    if (!summary?.assigneesDetail?.length || performerId === null) {
      return null;
    }

    const targetId = String(performerId);
    return (
      summary.assigneesDetail.find(
        (assignee) => String(assignee.id) === targetId,
      ) ?? null
    );
  }

  private resolveActivityPerformerAvatarColor(
    performerId: number | null,
  ): UserProfileColors {
    if (performerId === null || performerId === undefined) {
      return UserProfileColors.NEUTRAL;
    }

    const colors = this.assigneeAvatarColors;
    if (!colors.length) {
      return UserProfileColors.NEUTRAL;
    }

    const index = Math.abs(performerId) % colors.length;
    return colors[index] ?? UserProfileColors.NEUTRAL;
  }

  private createResolvedStage(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    options: {
      isCurrentUser: boolean;
      timestampLabel: string | null;
      direction: 'receiver' | 'sender';
      avatar: SupportTicketDetailStageAvatar | null;
    },
  ): SupportTicketDetailStatusActivityStage {
    const recipients: SupportTicketDetailActivityRecipient[] = [];
    const showAvatar = options.direction === 'receiver' && !!options.avatar;

    const backgroundClass = options.isCurrentUser
      ? 'bg-surface-brand-subtle'
      : 'bg-surface-base';
    const disableBubbleStyling = false;
    const fullWidth = false;

    return {
      id: `activity-${activity.id}`,
      kind: 'statusActivity',
      direction: options.direction,
      activityType: 'resolved',
      disableBubbleStyling,
      fullWidth,
      avatar: showAvatar ? options.avatar : undefined,
      showSupportAvatar: showAvatar,
      reserveSupportAvatarSpace: options.direction === 'receiver',
      icon: this.resolvedActivityIcon,
      iconColorClass: 'text-feedback-success',
      backgroundClass,
      borderClass: 'border-stroke-black-04',
      titleClass: 'content-md-default text-emphasis-high',
      title: this.buildResolvedTitle(activity),
      message: null,
      recipients,
      timestamp: activity.createdAt,
      timestampLabel: options.timestampLabel,
      tone: options.isCurrentUser ? 'self' : undefined,
      receiptStatus: options.isCurrentUser ? 'delivered' : undefined,
    } satisfies SupportTicketDetailStatusActivityStage;
  }

  private buildResolvedActorName(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): string {
    return (
      this.resolveActivityActorName(activity) ??
      this.translateService.translate('global.support.title')
    );
  }

  private buildStatusActivityAttachments(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    prefix: string,
  ): {
    galleryAttachments: DsAttachmentControlValue[];
    documentAttachments: SupportTicketDetailDocument[];
  } {
    const galleryAttachments: DsAttachmentControlValue[] = [];
    const documentAttachments: SupportTicketDetailDocument[] = [];

    const attachments = activity.attachments ?? [];
    attachments.forEach((rawAttachment, index) => {
      if (!rawAttachment) {
        return;
      }

      const attachment = rawAttachment as IAttachment;

      if (this.isImageAttachment(attachment)) {
        galleryAttachments.push(this.toDsAttachment(attachment));
        return;
      }

      documentAttachments.push({
        id:
          attachment.id !== undefined && attachment.id !== null
            ? `${prefix}-doc-${attachment.id}`
            : `${prefix}-doc-${index}`,
        label: this.getAttachmentName(attachment),
        attachment,
      });
    });

    return { galleryAttachments, documentAttachments };
  }

  private buildActivitySubtitle(
    activity: SupportHubTicketDetail['ticketActivity'][number],
    action: string,
  ): string | null {
    const currentUserId = this.auth.user()?.id;
    if (currentUserId && activity.performedById === currentUserId) {
      const youLabel =
        this.translateService.translate('global.you.txt') ?? 'You';
      return this.translateService.translate(
        'support.ticket.activity.generic',
        {
          action,
          name: youLabel,
        },
      );
    }

    const actorName = activity.performedBy?.displayName?.trim();
    if (actorName) {
      return this.translateService.translate(
        'support.ticket.activity.generic',
        {
          action,
          name: actorName,
        },
      );
    }

    return null;
  }

  private buildResolvedTitle(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): string {
    const currentUserId = this.auth.user()?.id;
    if (currentUserId && activity.performedById === currentUserId) {
      return this.translateService.translate(
        'support.ticket.status.resolved.you',
      );
    }

    const resolvedTitle = this.translateService.translate(
      'support.ticket.status.resolved',
    );
    const actorName = activity.performedBy?.displayName?.trim();
    if (actorName) {
      return this.translateService.translate(
        'support.ticket.status.resolved.by',
        {
          name: actorName,
        },
      );
    }

    return resolvedTitle;
  }

  private buildActivityMessage(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): string | null {
    const message = activity.description?.trim();
    return message ? message : null;
  }

  private buildActivityRecipients(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): ReadonlyArray<SupportTicketDetailActivityRecipient> {
    const recipients: SupportTicketDetailActivityRecipient[] = [];

    for (const personnel of activity.notifiedPersonnel) {
      if (!personnel?.displayName) {
        continue;
      }

      recipients.push({
        id: `${activity.id}-${personnel.id}`,
        name: personnel.displayName,
        role: null,
      });
    }

    return recipients;
  }

  private formatActivityTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return formatToHestime(value, this.isRtlLayout);
  }

  private isActivityFromCurrentUser(
    activity: SupportHubTicketDetail['ticketActivity'][number],
  ): boolean {
    const currentUserId = this.auth.user()?.id;
    if (!currentUserId) {
      return false;
    }

    return activity.performedById === currentUserId;
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

  private getCurrentTimeLabel(): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
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

  private resetState(): void {
    this.detailState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
    this.resolutionFeedbackState.set(null);
    this.currentFeedbackTicketId = null;
  }

  private handleLoadFailure(message: string): void {
    this.detailState.set(null);
    this.loadingState.set(false);
    this.errorState.set(message);
    this.resolutionFeedbackState.set(null);
    this.currentFeedbackTicketId = null;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        (error.error?.message as string | undefined) ??
        error.message ??
        'Unable to load ticket details.'
      );
    }

    return 'Unable to load ticket details.';
  }
}
