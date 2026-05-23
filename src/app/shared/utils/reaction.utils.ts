import { ReactionData, ReactionType } from '@ds/react/types/react.types';

export function updateReactionLocally(
  reactions: ReactionData[],
  reactionType: ReactionType,
  isAdding: boolean,
): ReactionData[] {
  const updatedReactions = [...reactions];
  const existingIndex = updatedReactions.findIndex(
    (r) => r.type === reactionType,
  );

  if (isAdding) {
    if (existingIndex >= 0) {
      updatedReactions[existingIndex] = {
        ...updatedReactions[existingIndex],
        isReacted: true,
        count: updatedReactions[existingIndex].count + 1,
      };
    } else {
      updatedReactions.push({
        type: reactionType,
        isReacted: true,
        count: 1,
      });
    }
  } else {
    if (existingIndex >= 0) {
      const currentReaction = updatedReactions[existingIndex];
      if (currentReaction.count <= 1) {
        updatedReactions.splice(existingIndex, 1);
      } else {
        updatedReactions[existingIndex] = {
          ...currentReaction,
          isReacted: false,
          count: currentReaction.count - 1,
        };
      }
    }
  }

  return updatedReactions;
}
