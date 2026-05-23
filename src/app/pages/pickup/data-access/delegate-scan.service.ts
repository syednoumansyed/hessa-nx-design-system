import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IResponse } from '@shared/interfaces';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  DelegateInfo,
  DelegateStudent,
  DelegateStudentStatus,
} from './delegate-scan.interface';
import {
  DelegateScanResponseDTO,
  DelegateStudentDTO,
} from './delegate-scan.dto';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TranslocoService } from '@jsverse/transloco';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { PickupRequestStatus } from '@shared/enums';
import { DelegateStatus } from '@pages/pickup/data-access/delegate.interface';

export interface ParsedQrData {
  delegatorId: string;
  guardianId: string;
  expiry: number;
}

export type ScanError =
  | 'invalid_qr'
  | 'expired'
  | 'network_error'
  | 'not_found';

@Injectable({
  providedIn: 'root',
})
export class DelegateScanService {
  private readonly _currentDelegate = signal<DelegateInfo | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _pendingDelegateInfo = signal<DelegateInfo | null>(null);

  private readonly toaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);

  readonly currentDelegate = this._currentDelegate.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly pendingDelegateInfo = this._pendingDelegateInfo.asReadonly();

  constructor(private readonly http: HttpClient) {}

  updateStudentSelection(studentId: number, isSelected: boolean): void {
    const current = this._currentDelegate();
    if (!current) return;

    const updatedStudents = current.students.map((student) =>
      student.id === studentId ? { ...student, isSelected } : student,
    );

    this._currentDelegate.set({
      ...current,
      students: updatedStudents,
    });
  }

  getSelectedStudents(): DelegateStudent[] {
    const current = this._currentDelegate();
    if (!current) return [];

    return current.students.filter(
      (student) => student.isSelected && student.status === 'allowed',
    );
  }

  resetDelegate(): void {
    this._currentDelegate.set(null);
  }

  setPendingDelegate(delegate: DelegateInfo): void {
    this._pendingDelegateInfo.set(delegate);
  }

  clearPendingDelegate(): void {
    this._pendingDelegateInfo.set(null);
  }

  /**
   * Parse QR code URL to extract delegator information
   * Expected format: https://nx.dev.ncle.dev/pickup-delegation?delegatorId=6&guardianId=1&expiry=1769817600000
   */
  parseQrUrl(qrValue: string): ParsedQrData | null {
    try {
      // Check if it's a URL
      const url = new URL(qrValue);

      // Verify the path contains pickup-delegation
      if (!url.pathname.includes('pickup-delegation')) {
        return null;
      }

      const delegatorId = url.searchParams.get('delegatorId');
      const guardianId = url.searchParams.get('guardianId');
      const expiryStr = url.searchParams.get('expiry');

      if (!delegatorId) {
        return null;
      }

      return {
        delegatorId,
        guardianId: guardianId || '',
        expiry: expiryStr ? parseInt(expiryStr, 10) : 0,
      };
    } catch {
      // Not a valid URL, return null
      return null;
    }
  }

  /**
   * Check if the QR code has expired based on the expiry timestamp
   */
  isQrExpired(expiry: number): boolean {
    if (!expiry) return false;
    return Date.now() > expiry;
  }

  /**
   * Call the scan API to validate and get delegator information
   */
  async scanDelegator(delegatorId: string): Promise<DelegateInfo> {
    this._isLoading.set(true);
    try {
      const response = await lastValueFrom(
        this.http
          .get<
            IResponse<DelegateScanResponseDTO>
          >(`${ApiUrl.v2BE}/pickup-delegators/${delegatorId}/scan`)
          .pipe(map((res) => this.mapScanResponseToDelegate(res.data))),
      );

      this._currentDelegate.set(response);
      return response;
    } catch (error) {
      this.toaster.error(
        this.transloco.translate('general.qr_code_invalid.txt'),
        this.transloco.translate('general.qr_code_invalid.title'),
      );
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  private mapScanResponseToDelegate(
    dto: DelegateScanResponseDTO,
  ): DelegateInfo {
    // Check if expiry date is within 3 days
    const isExpiringSoon = dto.expiryDate
      ? new Date(dto.expiryDate).getTime() - Date.now() <
        3 * 24 * 60 * 60 * 1000
      : false;

    // Format expiry date for display
    const formattedExpiryDate = dto.expiryDate
      ? new Date(dto.expiryDate).toLocaleDateString()
      : null;

    const status = (dto.status as DelegateStatus) || 'ACTIVE';

    return {
      id: String(dto.id),
      displayName: getLocalizedFullName(dto),
      imageUrl: dto.url || null,
      validTill: formattedExpiryDate,
      isExpiringSoon,
      expiryDate: formattedExpiryDate,
      students: dto.students.map((student) =>
        this.mapStudentFromScanDTO(student),
      ),
      isRequestAllowed: dto.isRequestAllowed,
      status,
      isInactive: status === 'INACTIVE',
    };
  }

  private mapStudentFromScanDTO(dto: DelegateStudentDTO): DelegateStudent {
    const attendanceStatus = dto.attendanceStatus as AttendanceStatus | null;
    const pickupStatus = dto.pickupStatus as PickupRequestStatus | null;
    const status = this.mapPickupStatus(pickupStatus, attendanceStatus);

    return {
      id: dto.studentId,
      displayName: getLocalizedFullName(dto),
      imageUrl: dto.url || null,
      level: getLocalizedName({
        enName: dto.enLevelName,
        arName: dto.arLevelName,
      }),
      className: getLocalizedName({
        enName: dto.enClassName,
        arName: dto.arClassName,
      }),
      status,
      isSelected: status === 'allowed',
      attendanceStatus,
      pickupStatus,
    };
  }

  /**
   * Determine the student's pickup status based on attendance and pickup request status.
   *
   * Rules:
   * - AttendanceStatus: null, PRESENT, LATE_ARRIVAL, EXCUSED = allows request
   * - AttendanceStatus: ABSENT, ON_LEAVE = not allowed
   * - PickupRequestsStatus: null, DENIED = allows request
   * - PickupRequestsStatus: REQUESTED, IN_PROCESS, LEFT_SCHOOL, PICKED = not allowed
   */
  private mapPickupStatus(
    pickupStatus: PickupRequestStatus | null,
    attendanceStatus: AttendanceStatus | null,
  ): DelegateStudentStatus {
    // Check attendance status first - ABSENT and ON_LEAVE are not allowed
    if (attendanceStatus === AttendanceStatus.ABSENT) {
      return 'absent';
    }

    if (attendanceStatus === AttendanceStatus.ON_LEAVE) {
      return 'on_leave';
    }

    // Check pickup status - null and DENIED are allowed, everything else is not
    if (pickupStatus) {
      const status = pickupStatus.toUpperCase() as PickupRequestStatus;

      if (status === PickupRequestStatus.REQUESTED) {
        return 'already_requested';
      }

      if (status === PickupRequestStatus.IN_PROCESS) {
        return 'in_process';
      }

      if (status === PickupRequestStatus.LEFT_SCHOOL) {
        return 'left_school';
      }

      if (status === PickupRequestStatus.PICKED) {
        return 'picked';
      }

      // DENIED allows request - fall through to allowed
      if (status === PickupRequestStatus.DENIED) {
        return 'allowed';
      }
    }

    // Default: allowed for pickup (null attendance with allowed statuses, or null pickup status)
    return 'allowed';
  }
}
