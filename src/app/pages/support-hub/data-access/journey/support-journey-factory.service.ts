import { Injectable } from '@angular/core';
import {
  SupportJourneyAttachmentsPromptStage,
  SupportJourneyDirection,
  SupportJourneyIntroStage,
  SupportJourneyPromptStage,
  SupportJourneySelectionOption,
  SupportJourneySelectionStage,
  SupportJourneyStage,
  SupportJourneyStageKind,
  SupportJourneyStageStatus,
  SupportJourneySummaryStage,
} from './support-journey-stage.model';
import { DsIcon } from '@ds/icon/icon.component';

@Injectable({ providedIn: 'root' })
export class SupportJourneyFactoryService {
  createIntroStage(config: {
    id: string;
    direction: SupportJourneyDirection;
    title: string;
    subtitle?: string;
    timestamp?: string;
    status?: SupportJourneyStageStatus;
  }): SupportJourneyIntroStage {
    return {
      kind: 'intro',
      ...config,
    };
  }

  createPromptStage(config: {
    id: string;
    kind: Extract<
      SupportJourneyStageKind,
      'categoryPrompt' | 'subcategoryPrompt'
    >;
    direction: SupportJourneyDirection;
    body: string;
    allowPrivateRequest?: boolean;
    timestamp?: string;
    status?: SupportJourneyStageStatus;
  }): SupportJourneyPromptStage {
    return {
      ...config,
    };
  }

  createSelectionStage(config: {
    id: string;
    kind: Extract<
      SupportJourneyStageKind,
      'categorySelection' | 'subcategorySelection'
    >;
    direction: SupportJourneyDirection;
    label: string;
    icon?: DsIcon | null;
    iconCssClass?: string | null;
    editable?: boolean;
    timestamp?: string;
    status?: SupportJourneyStageStatus;
    options?: ReadonlyArray<SupportJourneySelectionOption>;
    selectedOptionId?: string | null;
    allowPrivateRequest?: boolean;
  }): SupportJourneySelectionStage {
    return {
      ...config,
    };
  }

  createAttachmentsPromptStage(config: {
    id: string;
    direction: SupportJourneyDirection;
    title: string;
    description?: string;
    timestamp?: string;
    status?: SupportJourneyStageStatus;
  }): SupportJourneyAttachmentsPromptStage {
    return {
      kind: 'attachmentsPrompt',
      ...config,
    };
  }

  createSummaryStage(config: {
    id: string;
    direction: SupportJourneyDirection;
    heading: string;
    body: string;
    timestamp?: string;
    status?: SupportJourneyStageStatus;
  }): SupportJourneySummaryStage {
    return {
      kind: 'summary',
      ...config,
    };
  }

  cloneStage<TStage extends SupportJourneyStage>(stage: TStage): TStage {
    return { ...stage };
  }
}
