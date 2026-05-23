import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

export interface ExtendedEndTime {
  id: ObjId;
  type: string;
  school: {
    displayName: string;
  };
  startDateTime: string;
  endDateTime: string;
  endTime: string;
}

export type ExtendedTimeResponse = IPaginatedResponse<ExtendedEndTime[]>;
