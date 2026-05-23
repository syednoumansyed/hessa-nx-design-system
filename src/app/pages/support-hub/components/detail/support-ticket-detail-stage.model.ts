import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import type { DsIcon } from '@ds/icon/icon.component';
import { UserProfileColors } from '@shared/enums';
import { IAttachment } from '@shared/interfaces/attachment';
import { PopupItem } from '@ds/popup/types/popup.interface';

export type SupportTicketDetailStageDirection = 'sender' | 'receiver';

export type SupportTicketDetailStageKind =
  | 'summary'
  | 'activity'
  | 'gallery'
  | 'documents'
  | 'resolutionStatus'
  | 'resolutionComment'
  | 'resolutionFeedback'
  | 'statusActivity';

export interface SupportTicketDetailStageBase {
  readonly id: string;
  readonly kind: SupportTicketDetailStageKind;
  readonly direction: SupportTicketDetailStageDirection;
  readonly timestamp?: string | null;
  readonly showSupportAvatar?: boolean;
  readonly disableBubbleStyling?: boolean;
  readonly reserveSupportAvatarSpace?: boolean;
  readonly preserveCornerRadius?: boolean;
  readonly fullWidth?: boolean;
  readonly avatar?: SupportTicketDetailStageAvatar | null;
  readonly menuItems?: readonly PopupItem[] | null;
  readonly tone?: 'default' | 'self';
}

export interface SupportTicketDetailStageAvatar {
  readonly fullName: string;
  readonly avatarUrl?: string | null;
  readonly avatarColor?: UserProfileColors | null;
  readonly icon?: DsIcon | null;
  readonly iconCssClass?: string | null;
}

export interface SupportTicketDetailBadge {
  readonly label: string;
  readonly backgroundClass: string;
  readonly textClass: string;
  readonly icon?: DsIcon;
  readonly iconColorClass?: string;
}

export interface SupportTicketDetailDocument {
  readonly id: string;
  readonly label: string;
  readonly attachment: IAttachment;
}

export interface SupportTicketDetailSummaryCustomField {
  readonly id: number;
  readonly label: string;
  readonly value: string;
}

export interface SupportTicketDetailSummaryStage extends SupportTicketDetailStageBase {
  readonly kind: 'summary';
  readonly ticketNumber?: string | null;
  readonly title: string;
  readonly description: string;
  readonly createdAt?: string | null;
  readonly createdTimeLabel?: string | null;
  readonly timeAgoLabel?: string | null;
  readonly statusBadge: SupportTicketDetailBadge | null;
  readonly categoryBadge: SupportTicketDetailBadge | null;
  readonly students?: readonly SupportTicketDetailSummaryStudent[];
  readonly assigneesLabel?: string | null;
  readonly assignees?: readonly SupportTicketDetailSummaryAssignee[];
  readonly escalation?: SupportTicketDetailSummaryEscalation | null;
  readonly customFields?: readonly SupportTicketDetailSummaryCustomField[];
}

export interface SupportTicketDetailActivityStage extends SupportTicketDetailStageBase {
  readonly kind: 'activity';
  readonly actorName: string;
  readonly actorRole?: string | null;
  readonly body: string;
  readonly timestampLabel?: string | null;
}

export interface SupportTicketDetailStatusActivityStage extends SupportTicketDetailStageBase {
  readonly kind: 'statusActivity';
  readonly activityType:
    | 'escalated'
    | 'deEscalated'
    | 'resolved'
    | 'reopened'
    | 'reassigned';
  readonly title: string;
  readonly titleClass?: string | null;
  readonly subtitle?: string | null;
  readonly subtitleClass?: string | null;
  readonly subtitleMeta?: string | null;
  readonly message?: string | null;
  readonly recipients?: readonly SupportTicketDetailActivityRecipient[];
  readonly personnelGroups?: readonly SupportTicketDetailActivityPersonnelGroup[];
  readonly timestampLabel?: string | null;
  readonly icon?: DsIcon;
  readonly iconColorClass?: string | null;
  readonly backgroundClass: string;
  readonly borderClass?: string | null;
  readonly receiptStatus?: 'delivered' | 'viewed';
}

export interface SupportTicketDetailActivityPersonnelGroup {
  readonly label: string;
  readonly personnels: readonly SupportTicketDetailActivityRecipient[];
}

export interface SupportTicketDetailGalleryStage extends SupportTicketDetailStageBase {
  readonly kind: 'gallery';
  readonly attachments: DsAttachmentControlValue[];
  readonly timestampLabel?: string | null;
}

export interface SupportTicketDetailDocumentsStage extends SupportTicketDetailStageBase {
  readonly kind: 'documents';
  readonly documents: readonly SupportTicketDetailDocument[];
  readonly timestampLabel?: string | null;
}

export interface SupportTicketDetailResolutionStatusStage extends SupportTicketDetailStageBase {
  readonly kind: 'resolutionStatus';
  readonly acknowledgementTime?: string | null;
  readonly message?: string | null;
}

export interface SupportTicketDetailResolutionCommentStage extends SupportTicketDetailStageBase {
  readonly kind: 'resolutionComment';
  readonly name: string;
  readonly role: string | null;
  readonly description: string;
  readonly timestampLabel?: string | null;
}

export interface SupportTicketDetailResolutionFeedbackStage extends SupportTicketDetailStageBase {
  readonly kind: 'resolutionFeedback';
  readonly title: string;
  readonly comment?: string | null;
  readonly timestampLabel: string;
  readonly rating?: number | null;
  readonly ratingLabel?: string | null;
}

export interface SupportTicketDetailActivityRecipient {
  readonly id: string;
  readonly name: string;
  readonly role?: string | null;
}

export interface SupportTicketDetailSummaryStudent {
  readonly id: string;
  readonly fullName: string;
  readonly avatarUrl?: string | null;
  readonly avatarColor?: UserProfileColors;
  readonly levelLabel?: string | null;
  readonly classLabel?: string | null;
}

export interface SupportTicketDetailSummaryAssignee {
  readonly id: string;
  readonly name: string;
  readonly role?: string | null;
  readonly avatarColor?: UserProfileColors;
}

export interface SupportTicketDetailSummaryEscalation {
  readonly label: string;
}

export type SupportTicketDetailStage =
  | SupportTicketDetailSummaryStage
  | SupportTicketDetailActivityStage
  | SupportTicketDetailGalleryStage
  | SupportTicketDetailDocumentsStage
  | SupportTicketDetailResolutionStatusStage
  | SupportTicketDetailResolutionCommentStage
  | SupportTicketDetailResolutionFeedbackStage
  | SupportTicketDetailStatusActivityStage;

export interface SupportTicketDetailDocumentSelectedEvent {
  readonly stageId: string;
  readonly attachment: IAttachment;
}

export interface SupportTicketDetailResolutionActionEvent {
  readonly stageId: string;
  readonly action: 'resolved' | 'notResolved';
}

export interface SupportTicketDetailStageMenuSelectionEvent {
  readonly stageId: string;
  readonly item: PopupItem;
}
