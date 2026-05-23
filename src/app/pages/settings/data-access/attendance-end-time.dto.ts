import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

export interface IGlobalEndTime {
  id: ObjId;
  endTime: string;
}

export interface ExtendedEndTimeDTO {
  id: ObjId;
  type: string;
  school: {
    arName: string;
    enName: string;
  };
  startDateTime: string;
  endDateTime: string;
  endTime: string;
}

export interface ISchoolEndTimePayload {
  schoolId: ObjId;
  startDateTime: string;
  endDateTime: string;
  endTime: string;
}

export interface IExtendTimePayload {
  companyId?: ObjId;
  campusId?: ObjId;
  schoolId?: ObjId;
  pageNumber?: number;
  itemsPerPage?: number;
}

export type GlobalEndTimeResponseDTO = IResponse<IGlobalEndTime>;
export type ExtendedTimeResponseDTO = IPaginatedResponse<ExtendedEndTimeDTO[]>;
