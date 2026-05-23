import { UserType } from '@shared/enums';

export enum ReactionType {
  LIKE = 'LIKE',
  CLAP = 'CLAP',
  PRAYING = 'PRAYING',
  HEART = 'HEART',
  MOTIVATED = 'MOTIVATED',
  THINKING = 'THINKING',
  IDEA = 'IDEA',
}

export enum TargetType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  POST = 'POST',
  COMMENT = 'COMMENT',
}

export interface ReactionUserRole {
  id: number;
  arName: string;
  enName: string;
}

export interface ReactionUser {
  id: number;
  arFullName: string | null;
  enFullName: string | null;
  profileColor: string;
  preferredName: string | null;
  imageUrl: string | null;
  userType: UserType;
  roles: ReactionUserRole[];
}

// Clean UI interface - no backend concerns
export interface ReactionData {
  type: ReactionType;
  isReacted: boolean;
  count: number;
  users?: ReactionUser[];
}

export interface ReactionConfig {
  type: ReactionType;
  svgIcon: string;
  label: string;
}

export const REACTION_CONFIGS: ReactionConfig[] = [
  {
    type: ReactionType.LIKE,
    svgIcon: 'like-react',
    label: 'announcement.emotion.like',
  },
  {
    type: ReactionType.CLAP,
    svgIcon: 'clap-react',
    label: 'announcement.emotion.celebrating',
  },
  {
    type: ReactionType.PRAYING,
    svgIcon: 'pray-react',
    label: 'announcement.emotion.pray_for_you',
  },
  {
    type: ReactionType.HEART,
    svgIcon: 'love-react',
    label: 'announcement.emotion.love',
  },
  {
    type: ReactionType.MOTIVATED,
    svgIcon: 'strong-react',
    label: 'announcement.emotion.motivated',
  },
  {
    type: ReactionType.THINKING,
    svgIcon: 'confused-react',
    label: 'announcement.emotion.confused',
  },
  {
    type: ReactionType.IDEA,
    svgIcon: 'insightful-react',
    label: 'announcement.emotion.insightful',
  },
];

export const reactionMappingForCometChat = {
  [ReactionType.LIKE]: '👍',
  [ReactionType.CLAP]: '👏',
  [ReactionType.PRAYING]: '🙏',
  [ReactionType.HEART]: '❤️',
  [ReactionType.MOTIVATED]: '💪',
  [ReactionType.THINKING]: '🤔',
  [ReactionType.IDEA]: '💡',
};
