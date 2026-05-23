import { CommonModule, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsImageGalleryComponent } from '@ds/attachment/ds-image-gallery.component';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { getDsAttachmentIcon } from '@ds/attachment/ds-attachment-icon.util';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import {
  SupportTicketDetailActivityStage,
  SupportTicketDetailDocument,
  SupportTicketDetailDocumentsStage,
  SupportTicketDetailGalleryStage,
  SupportTicketDetailResolutionActionEvent,
  SupportTicketDetailResolutionFeedbackStage,
  SupportTicketDetailStage,
  SupportTicketDetailStageMenuSelectionEvent,
  SupportTicketDetailStatusActivityStage,
  SupportTicketDetailSummaryStage,
} from './support-ticket-detail-stage.model';
import { IAttachment } from '@shared/interfaces/attachment';
import { HesFileService } from '@shared/services/hes-file.service';
import {
  faCircleInfo,
  faCircleXmark,
  faFile,
  faHeadset,
  faEllipsisVertical,
  faStar as faStarRegular,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleCheck,
  faArrowTurnUp,
  faStar as faStarSolid,
} from '@fortawesome/pro-solid-svg-icons';
import { UserProfileColors } from '@shared/enums';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'app-support-ticket-detail-stage-host',
  standalone: true,
  templateUrl: './support-ticket-detail-stage-host.component.html',
  imports: [
    CommonModule,
    NgClass,
    DsIconComponent,
    DsImageGalleryComponent,
    AvatarComponent,
    DsResponsiveMenuComponent,
    DsTranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportTicketDetailStageHostComponent {
  private readonly fileService = inject(HesFileService);

  readonly stage = input.required<SupportTicketDetailStage>();
  readonly getAttachmentName = input<(attachment: IAttachment) => string>();

  readonly resolutionAction =
    output<SupportTicketDetailResolutionActionEvent>();
  readonly menuOpened = output<string>();
  readonly menuItemSelected =
    output<SupportTicketDetailStageMenuSelectionEvent>();
  readonly escalationInfoRequested = output<void>();

  protected readonly supportAvatarIcon = faHeadset;
  protected readonly resolvedIcon = faCircleCheck;
  protected readonly notResolvedIcon = faCircleXmark;
  protected readonly fileIcon = faFile;
  protected readonly menuIcon = faEllipsisVertical;
  protected readonly starIconSolid = faStarSolid;
  protected readonly starIconRegular = faStarRegular;
  protected readonly defaultAvatarColor = UserProfileColors.NEUTRAL;
  protected readonly escalationLeadingIcon = faArrowTurnUp;
  protected readonly escalationTrailingIcon = faCircleInfo;
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;

  protected getDocumentIcon(attachment: IAttachment): string {
    return getDsAttachmentIcon(this.toDsAttachment(attachment)).icon;
  }

  protected getDocumentIconColorClass(attachment: IAttachment): string {
    return getDsAttachmentIcon(this.toDsAttachment(attachment)).colorClass;
  }

  private toDsAttachment(attachment: IAttachment): DsAttachmentControlValue {
    return {
      key: attachment.key,
      url: attachment.url,
      extension: attachment.extension,
      id: attachment.id,
      isLink: attachment.isLink,
      viewStatus: attachment.viewStatus,
    };
  }

  protected readonly stageMenu = computed(() => {
    const stage = this.stage();
    const items = stage.menuItems ?? [];
    const visibleItems = items.filter((item) => item.visible !== false);

    if (visibleItems.length === 0) {
      return null;
    }

    return {
      items: visibleItems,
      ariaLabel: 'Stage actions',
      backgroundClass: 'bg-surface-action',
      iconColorClass: 'text-icon-high',
    } as const;
  });

  protected readonly shouldReserveSupportAvatarSpace = computed(() => {
    const stage = this.stage();
    if (stage.kind === 'statusActivity') {
      return stage.reserveSupportAvatarSpace ?? false;
    }
    if (stage.direction !== 'receiver') {
      return false;
    }
    return stage.reserveSupportAvatarSpace ?? true;
  });

  protected readonly shouldShowSupportAvatar = computed(() => {
    const stage = this.stage();
    if (stage.kind === 'statusActivity') {
      return stage.showSupportAvatar ?? false;
    }
    if (stage.direction !== 'receiver') {
      return false;
    }
    return stage.showSupportAvatar ?? true;
  });

  protected readonly receiverAvatar = computed(() => {
    const stage = this.stage();
    if (stage.direction !== 'receiver') {
      return null;
    }

    return stage.avatar ?? null;
  });

  protected readonly containerClasses = computed(() => {
    const stage = this.stage();
    if (stage.direction === 'sender') {
      return [
        'ltr:items-end',
        'rtl:items-start',
        'ltr:self-end',
        'rtl:self-start',
      ];
    }

    return [
      'ltr:items-start',
      'rtl:items-end',
      'ltr:self-start',
      'rtl:self-end',
    ];
  });

  protected readonly messageRowClasses = computed(() => {
    if (this.stage().direction === 'sender') {
      return ['ltr:justify-end', 'rtl:justify-start'];
    }

    return ['ltr:justify-start', 'rtl:justify-end'];
  });

  protected readonly timestampClasses = computed(() => {
    if (this.stage().direction === 'sender') {
      return [
        'ltr:self-end',
        'rtl:self-start',
        'ltr:text-right',
        'rtl:text-left',
      ];
    }

    return [
      'ltr:self-start',
      'rtl:self-end',
      'ltr:text-left',
      'rtl:text-right',
    ];
  });

  protected readonly bubbleClasses = computed(() => {
    const stage = this.stage();
    const disableStyling = stage.disableBubbleStyling ?? false;
    const tone = stage.tone ?? 'default';

    const base = [
      'relative',
      'flex',
      'flex-col',
      'gap-ds-sm',
      'w-full',
      'shadow-none',
    ];

    if (!stage.fullWidth) {
      base.push('max-w-[min(100%,_420px)]');
    }

    if (!disableStyling) {
      const receiverCornerClasses = [
        'ltr:rounded-bl-none',
        'rtl:rounded-br-none',
      ];
      const senderCornerClasses = [
        'ltr:rounded-br-none',
        'rtl:rounded-bl-none',
      ];

      base.push(
        'rounded-ds-xl',
        'border-[4px]',
        ...(stage.direction === 'receiver'
          ? receiverCornerClasses
          : senderCornerClasses),
        'px-ds-xl',
        'py-ds-md',
      );

      if (tone === 'self') {
        base.push('border-stroke-black-08', 'bg-surface-brand-subtle');
      } else {
        base.push('border-stroke-black-08', 'bg-surface-primary');
      }

      if (!stage.preserveCornerRadius) {
        base.push(
          ...(stage.direction === 'receiver'
            ? receiverCornerClasses
            : senderCornerClasses),
        );
      }
    } else {
      base.push('bg-transparent');
    }

    if (stage.kind === 'resolutionFeedback') {
      base.push('items-start');
    }

    return base;
  });

  protected readonly summaryStage =
    computed<SupportTicketDetailSummaryStage | null>(() => {
      const stage = this.stage();
      return stage.kind === 'summary' ? stage : null;
    });

  protected readonly galleryStage =
    computed<SupportTicketDetailGalleryStage | null>(() => {
      const stage = this.stage();
      return stage.kind === 'gallery' ? stage : null;
    });

  protected readonly activityStage =
    computed<SupportTicketDetailActivityStage | null>(() => {
      const stage = this.stage();
      return stage.kind === 'activity' ? stage : null;
    });

  protected readonly documentsStage =
    computed<SupportTicketDetailDocumentsStage | null>(() => {
      const stage = this.stage();
      return stage.kind === 'documents' ? stage : null;
    });

  protected readonly resolutionStatusStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'resolutionStatus' ? stage : null;
  });

  protected readonly resolutionCommentStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'resolutionComment' ? stage : null;
  });

  protected readonly resolutionFeedbackStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'resolutionFeedback' ? stage : null;
  });

  protected readonly statusActivityStage =
    computed<SupportTicketDetailStatusActivityStage | null>(() => {
      const stage = this.stage();
      return stage.kind === 'statusActivity' ? stage : null;
    });

  protected onDocumentClicked(
    stage: SupportTicketDetailDocumentsStage,
    document: SupportTicketDetailDocument,
  ): void {
    const attachment = document.attachment;
    if (!attachment?.url) {
      return;
    }

    const getNameFn = this.getAttachmentName();
    const fileName = getNameFn ? getNameFn(attachment) : document.label;

    void this.fileService.downloadFile({
      url: attachment.url,
      fileName,
      extension: attachment.extension,
    });
  }

  protected onResolutionAction(action: 'resolved' | 'notResolved'): void {
    this.resolutionAction.emit({ stageId: this.stage().id, action });
  }

  protected onStageMenuOpened(): void {
    this.menuOpened.emit(this.stage().id);
  }

  protected onStageMenuItemSelected(item: PopupItem): void {
    this.menuItemSelected.emit({ stageId: this.stage().id, item });
  }

  protected onEscalationInfoClicked(): void {
    this.escalationInfoRequested.emit();
  }

  protected statusActivityContainerClasses(
    stage: SupportTicketDetailStatusActivityStage,
  ): string[] {
    const base = ['flex', 'w-full', 'flex-col', 'gap-ds-sm'];
    const receiverCorner = ['ltr:rounded-bl-none', 'rtl:rounded-br-none'];
    const senderCorner = ['ltr:rounded-br-none', 'rtl:rounded-bl-none'];

    if (stage.disableBubbleStyling) {
      base.push('rounded-ds-xl', 'border-4', 'px-ds-lg', 'py-ds-md');
      if (stage.backgroundClass) {
        base.push(stage.backgroundClass);
      }
      base.push(stage.borderClass ?? 'border-stroke-black-08');
      base.push(
        ...(stage.direction === 'receiver' ? receiverCorner : senderCorner),
      );
    } else if (stage.backgroundClass) {
      base.push(stage.backgroundClass);
    }

    return base;
  }

  protected resolutionStatusContainerClasses(): string[] {
    const stage = this.stage();
    const base = [
      'flex',
      'w-full',
      'flex-col',
      'gap-ds-sm',
      'rounded-ds-xl',
      'border-4',
      'px-ds-lg',
      'py-ds-md',
      'bg-surface-success-subtle',
      'border-stroke-black-04',
    ];

    const senderCorner = ['ltr:rounded-br-none', 'rtl:rounded-bl-none'];
    const receiverCorner = ['ltr:rounded-bl-none', 'rtl:rounded-br-none'];

    base.push(
      ...(stage.direction === 'sender' ? senderCorner : receiverCorner),
    );

    return base;
  }

  protected resolutionFeedbackContainerClasses(
    stage: SupportTicketDetailResolutionFeedbackStage,
  ): string[] {
    const base = [
      'flex',
      'w-full',
      'flex-col',
      'gap-ds-sm',
      'rounded-ds-xl',
      'border-4',
      'px-ds-lg',
      'py-ds-md',
      'bg-surface-success-subtle',
      'border-stroke-black-04',
    ];

    const senderCorner = ['ltr:rounded-br-none', 'rtl:rounded-bl-none'];
    const receiverCorner = ['ltr:rounded-bl-none', 'rtl:rounded-br-none'];

    base.push(
      ...(stage.direction === 'sender' ? senderCorner : receiverCorner),
    );

    return base;
  }
}
