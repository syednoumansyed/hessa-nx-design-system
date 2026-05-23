import { Gender, PickupRequestStatus } from '@shared/enums';
import { NameLocalizedEntityDTO } from '../shared/localized-entity.interface';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';

export interface PickupDelegatorDTO {
  id: number;
  arFullName: string | null;
  enFullName: string | null;
  nationalId: string;
}

export interface PickupResponseDTO {
  id: number;
  userId: number;
  arFullName: string | null;
  enFullName: string | null;
  preferredName: string;
  gender: Gender;
  imageUrl: string | null;
  nationalId?: string;
  pickupDelegator: PickupDelegatorDTO | null;
  schoolStructure: {
    class: NameLocalizedEntityDTO;
    level: NameLocalizedEntityDTO;
    school: NameLocalizedEntityDTO;
    campus: {
      id: number;
      arName: string | null;
      enName: string | null;
      latitude: string;
      longitude: string;
    };
  };
  guardian: {
    id: number;
    userId: number;
    arFullName: string | null;
    enFullName: string | null;
    gender: Gender;
    phoneNumber: string;
    countryCode: string;
  };
  endTime: string | null;
  pickupRequest: PickupRequestDTO | null;
  insidePickupRadius?: boolean;
  isAvatar: boolean;
  attendanceStatus: AttendanceStatus | null;
}

export interface PickupRequestDTO {
  id: number | null;
  status: PickupRequestStatus | null;
  createdAt: string | null;
  deniedOptionId?: number | null;
  pickupDelegatorId: number | null;
  reason: string | null;
}

export interface TimelineDTO {
  id: number;
  status: PickupRequestStatus;
  reason: string | null;
  createdBy?:
    | number
    | null
    | { id: number; arFullName: string; enFullName: string };
  updatedBy?:
    | number
    | null
    | { id: number; arFullName: string; enFullName: string };
  createdAt: string;
  updatedAt?: Date | null;
  deniedOption: DenialReasonDTO;
}

export interface DenialReasonDTO {
  id: number;
  title: string;
  description: string;
  url: string;
  createdBy: number;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolLocationDTO {
  id: number;
  lat: number;
  lng: number;
  arName: string;
  enName: string;
  radius: number;
}
