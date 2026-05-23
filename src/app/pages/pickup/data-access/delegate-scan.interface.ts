import { Gender } from '@shared/enums';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { PickupRequestStatus } from '@shared/enums';
import { DelegateStatus } from '@pages/pickup/data-access/delegate.interface';

export type DelegateStudentStatus =
  | 'allowed'
  | 'already_requested'
  | 'absent'
  | 'on_leave'
  | 'in_process'
  | 'left_school'
  | 'picked'
  | 'not_allowed';

export interface DelegateStudent {
  id: number;
  displayName: string;
  imageUrl: string | null;
  level: string;
  className: string;
  status: DelegateStudentStatus;
  isSelected: boolean;
  attendanceStatus: AttendanceStatus | null;
  pickupStatus: PickupRequestStatus | null;
}

export interface DelegateInfo {
  id: string;
  displayName: string;
  imageUrl: string | null;
  validTill: string | null;
  isExpiringSoon: boolean;
  expiryDate: string | null;
  students: DelegateStudent[];
  isRequestAllowed: boolean;
  status: DelegateStatus;
  isInactive: boolean;
}

export interface DelegateScanResult {
  delegateId: string;
}
