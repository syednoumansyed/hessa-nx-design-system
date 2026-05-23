import { areIsoDatesOnSameDay, parseIsoToEpochMs } from '@shared/utils/date';
import { SupportTicketDetailStage } from './support-ticket-detail-stage.model';

/**
 * Computes the set of stage indices where a date separator chip should appear.
 * A separator is shown for the first stage and whenever the day changes between
 * consecutive stages.
 */
export const computeDateSeparatorIndices = (
  stages: readonly SupportTicketDetailStage[],
): Set<number> => {
  const indices = new Set<number>();

  for (let i = 0; i < stages.length; i++) {
    const timestamp = stages[i].timestamp;
    if (!timestamp || parseIsoToEpochMs(timestamp) === 0) continue;

    if (i === 0) {
      indices.add(i);
      continue;
    }

    const prevTimestamp = stages[i - 1]?.timestamp;
    if (
      !prevTimestamp ||
      parseIsoToEpochMs(prevTimestamp) === 0 ||
      !areIsoDatesOnSameDay(timestamp, prevTimestamp)
    ) {
      indices.add(i);
    }
  }

  return indices;
};
