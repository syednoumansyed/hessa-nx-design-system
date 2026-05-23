import { Gender, PickupRequestBy, PickupRequestStatus } from '@shared/enums';
import { DisplayIdentifiable } from '../../interfaces/identifiable.interface';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';

export interface PickupRequest {
  id: number | null;
  status: PickupRequestStatus | null;
  createdAt: string | null;
  deniedOptionId: number | null;
}

export interface PickupDelegator {
  id: number;
  displayName: string;
  nationalId: string;
}

export interface PickupResponse {
  id: number;
  displayName: string;
  gender: Gender;
  imageUrl: string | null;
  nationalId: string;
  pickupDelegator: PickupDelegator | null;
  pickedByName: string;
  pickedByType: PickupRequestBy;
  schoolStructure: {
    class: DisplayIdentifiable;
    level: DisplayIdentifiable;
    school: DisplayIdentifiable;
    campus: {
      id: number;
      displayName: string;
      latitude: number;
      longitude: number;
    };
  };
  guardian: {
    id: number;
    userId: number;
    displayName: string;
    gender: Gender;
    displayPhoneNumber: string;
  };
  endTime: string | null;
  pickupRequest: PickupRequest | null;
  insidePickupRadius: boolean;
  isAvatar: boolean;
  attendanceStatus: AttendanceStatus | null;
}

export interface GuardianPickupParams {
  date: string;
}

export interface PersonnelPickupParams {
  paginate?: boolean;
  pickupRequestId?: number;
  searchText?: string;
  status?: PickupRequestStatus;
  guardianId?: number;
  studentId?: number;
  campusIds?: number[];
  schoolIds?: number[];
  levelIds?: number[];
  classIds?: number[];
  date?: string;
  academicYearId?: number;
}
export interface Timeline {
  id: number;
  status: PickupRequestStatus;
  reason: string | null;
  // createdBy?: number | null | { id: number; displayName: string };
  // updatedBy?: number | null | { id: number; displayName: string };
  createdAt: string;
  updatedAt?: Date | null;
  deniedOption: DenialReason;
}

export interface SocketRequestPayload {
  schoolId: number;
  students: PickupResponse[];
  guardian: {
    fullName: string;
    gender: Gender;
    phoneNumber: string;
    id: number;
    userId: number;
  };
  pickupRequest: PickupRequest | null;
}

export interface SchoolLocation {
  id: number;
  lat: number;
  lng: number;
  displayName: string;
  radius: number;
}

export interface PickupTab {
  id: PickupRequestStatus;
  label: string;
  count: number;
}

export interface DenialReason {
  id: number;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchPickupRequestsParams {
  page: number;
  pageSize: number;
  date: string;
  levelId?: number;
  classId?: number;
  status?: PickupRequestStatus;
}

// Socket payload interfaces for guardian emit
export interface GuardianPickupEmitPayload {
  studentId: number;
  status: PickupRequestStatus;
}

// Socket payload interface for delegate pickup emit
export interface DelegatePickupEmitPayload {
  studentId: number;
  pickupDelegatorId: number;
  status: PickupRequestStatus;
}

// Socket payload interfaces for guardian receive
export interface GuardianPickupReceivePayload {
  studentId?: number;
  pickupRequestId?: number;
  status: PickupRequestStatus;
  deniedOptionId?: number;
}
