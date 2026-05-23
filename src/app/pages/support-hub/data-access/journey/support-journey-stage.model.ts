import { DsIcon } from '@ds/icon/icon.component';

export type SupportJourneyDirection = 'sender' | 'receiver';
export type SupportJourneyStageKind =
  | 'intro'
  | 'categoryPrompt'
  | 'categorySelection'
  | 'subcategoryPrompt'
  | 'subcategorySelection'
  | 'attachmentsPrompt'
  | 'summary';
export type SupportJourneyStageStatus = 'pending' | 'completed' | 'error';
export interface SupportJourneyStageBase {
  readonly id: string;
  readonly kind: SupportJourneyStageKind;
  readonly direction: SupportJourneyDirection;
  readonly timestamp?: string;
  readonly status?: SupportJourneyStageStatus;
}

export interface SupportJourneyIntroStage extends SupportJourneyStageBase {
  readonly kind: 'intro';
  readonly title: string;
  readonly subtitle?: string;
}

export interface SupportJourneyPromptStage extends SupportJourneyStageBase {
  readonly kind: 'categoryPrompt' | 'subcategoryPrompt';
  readonly body: string;
  readonly allowPrivateRequest?: boolean;
}

export interface SupportJourneySelectionOption {
  readonly id: number;
  readonly label: string;
  readonly description?: string;
  readonly icon: DsIcon | null;
  readonly allowPrivateRequest: boolean;
}

export interface SupportJourneySelectionStage extends SupportJourneyStageBase {
  readonly kind: 'categorySelection' | 'subcategorySelection';
  readonly label: string;
  readonly icon?: DsIcon | null;
  readonly iconCssClass?: string | null;
  readonly editable?: boolean;
  readonly options?: readonly SupportJourneySelectionOption[];
  readonly selectedOptionId?: string | null;
  readonly allowPrivateRequest?: boolean;
}

export interface SupportJourneyAttachmentsPromptStage extends SupportJourneyStageBase {
  readonly kind: 'attachmentsPrompt';
  readonly title: string;
  readonly description?: string;
}

export interface SupportJourneySummaryStage extends SupportJourneyStageBase {
  readonly kind: 'summary';
  readonly heading: string;
  readonly body: string;
}

export type SupportJourneyStage =
  | SupportJourneyIntroStage
  | SupportJourneyPromptStage
  | SupportJourneySelectionStage
  | SupportJourneyAttachmentsPromptStage
  | SupportJourneySummaryStage;

export interface SupportJourneySelectionChangeEvent {
  readonly stage: SupportJourneySelectionStage;
  readonly option: SupportJourneySelectionOption;
}
