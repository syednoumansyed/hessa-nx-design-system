import { PickupRequestStatus } from '@shared/enums';
import { PickupResponse } from '@shared/dto-transformation/pick-up/pickup.interface';

export interface UpdatePickupParams {
  status: PickupRequestStatus;
  deniedOptionId?: number | null;
}

/**
 * Immutable status update for a PickupResponse.
 */
export function updatePickupStatus(
  pickup: PickupResponse,
  { status, deniedOptionId = null }: UpdatePickupParams,
): PickupResponse {
  const timestamp = new Date().toISOString();

  const updatedPickupRequest = {
    id: pickup.pickupRequest?.id ?? null,
    status,
    deniedOptionId,
    createdAt: timestamp,
  };

  return {
    ...pickup,
    pickupRequest: updatedPickupRequest,
  };
}
