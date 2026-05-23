import { ObjId } from '@shared/interfaces/common.interface';
import { inject } from '@angular/core';
import { PickupRequestTableStatus } from '@shared/enums';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { PickupResponse } from '@shared/dto-transformation/pick-up/pickup.interface';

export interface IPickupRequestItem {
  id: ObjId | null;
  fullName: string;
  levelName: string;
  levelId: string;
  className: string;
  classId: string;
  nationalId: string;
  endTime: string | null;
  guardianName: string;
  guardianPhoneNumber: string;
  status: PickupRequestTableStatus;
  pickupRequestId: number | null;
}

export function mapPickupRequestsToListItems(
  data: PickupResponse[],
): IPickupRequestItem[] {
  return data.map((request: PickupResponse) => {
    return {
      id: request.id,
      fullName: request.displayName,
      levelName: request.schoolStructure.level.displayName,
      levelId: request.schoolStructure.level.id?.toString(),
      className: request.schoolStructure.class.displayName,
      classId: request.schoolStructure.class.id?.toString(),
      nationalId: request.nationalId,
      endTime: request.pickupRequest?.createdAt ?? null,
      guardianName: request.guardian.displayName,
      guardianPhoneNumber: request.guardian.displayPhoneNumber,
      status: request.pickupRequest
        ?.status as unknown as PickupRequestTableStatus,
      pickupRequestId: request.pickupRequest?.id ?? null,
    };
  });
}

export function createPickupRequestsDateRenderer() {
  const datePipe = inject(HesTimePipe);
  return (params: any) => {
    const data = params.data as IPickupRequestItem;
    return datePipe.transform(data.endTime as string);
  };
}
