import { ReactionType } from '@ds/react/types/react.types';

export interface ReactionRemoveResponse {
  targetId: string;
  targetType: string;
  reactionType: ReactionType;
}

export interface ReactionAddResponse {
  data: {
    createdAt: string;
    createdBy: number;
    id: number;
    reactionType: ReactionType;
    targetId: number;
    targetType: string;
    tenantId: number;
    updatedAt: string | null;
    updatedBy: number | null;
    userId: number;
    userType: string;
    userTypeId: number;
  };
  message: string;
  messageRef: string;
}

export type ReactionToggleResponse =
  | ReactionAddResponse
  | ReactionRemoveResponse;

export interface UIReactionData {
  type: ReactionType;
  isReacted: boolean;
  count: number;
}

export interface UIReactionConfig {
  type: ReactionType;
  svgIcon: string;
  label: string;
}
