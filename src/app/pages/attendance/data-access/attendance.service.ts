import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { formatDate, isSameDay } from 'date-fns';
import { catchError, map, Observable, of } from 'rxjs';
import {
  AbsenceAttendanceListItemDTO,
  AttendanceListItemDTO,
  AttendanceStatus,
  AttendanceStatusHistoryDTO,
  ConfirmationStatus,
  MarkAttendancePayload,
  StudentAttendanceDTO,
  StudentAttendanceListQueryParams,
  classAttendanceListQueryParams,
  confirmAttendanceListQueryParams,
} from './attendance.dto';
import {
  AbsenceAttendanceListItem,
  AttendanceListItem,
  AttendanceStatusHistory,
  IClassAttendance,
  IClassAttendanceAbsence,
  IStudentAttendance,
  StudentAttendance,
} from './attendance.interface';
import { ATTENDANCE_MAP_FROM_DTO } from './attendance-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private readonly translate = inject(HesTranslateService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly _absenceAttendanceList = signal<IClassAttendanceAbsence[]>(
    [],
  );
  private readonly _classAttendanceList = signal<IClassAttendance[]>([]);
  classAttendanceList = this._classAttendanceList.asReadonly();
  absenceAttendanceList = this._absenceAttendanceList.asReadonly();
  private readonly _classAttendancePagination = signal<IPagination | null>(
    null,
  );
  readonly classAttendancePagination =
    this._classAttendancePagination.asReadonly();

  private readonly _selectedDate = signal<Date>(new Date());
  selectedDate = this._selectedDate.asReadonly();

  private readonly _selectedLevel = signal<number | null>(null);
  selectedLevel = this._selectedLevel.asReadonly();

  private readonly _selectedClass = signal<number | null>(null);
  selectedClass = this._selectedClass.asReadonly();

  viewAttendanceActive = signal<boolean>(false);
  isMarkAttendanceAllowed = signal<boolean>(false);

  readonly studentAttendanceList = computed<IStudentAttendance[]>(() => {
    const studentAttendanceMap = this.studentAttendanceMap();
    const studentAttendanceList = Array.from(studentAttendanceMap.values());
    return studentAttendanceList;
  });

  private readonly studentAttendanceMap = signal<
    Map<number, IStudentAttendance>
  >(new Map<number, IStudentAttendance>());

  constructor() {}

  getClassAttendanceList(
    params: classAttendanceListQueryParams,
  ): Observable<IPaginatedResponse<AttendanceListItemDTO[]>> {
    if (
      !this.schoolStructureListingService.selectedLevel() &&
      params?.levelId
    ) {
      this.schoolStructureListingService.updateSelectedLevel(params?.levelId);
    }
    return this.http
      .get<IPaginatedResponse<AttendanceListItemDTO[]>>(
        `${ApiUrl.v1BE}/attendances/class`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          const data = ATTENDANCE_MAP_FROM_DTO.classAttendanceList(res.data);
          this.updateClassAttendanceList(this.mapClassAttendanceList(data));
          this._classAttendancePagination.set(res.paginate);
          return res;
        }),
        catchError((err) => {
          this.clearClassAttendanceList();
          return of(err);
        }),
      );
  }

  checkMarkAttendanceStatus() {
    const schoolId = this.schoolStructureListingService.selectedSchool()?.id;
    if (!schoolId) return;
    this.http
      .get<
        IResponse<{ isMarkAttendanceAllowed: boolean }>
      >(`${ApiUrl.v1BE}/attendances/${schoolId}/attendance`)
      .subscribe((res) => {
        this.isMarkAttendanceAllowed.set(res.data.isMarkAttendanceAllowed);
      });
  }

  getConfirmAttendanceList(
    params: confirmAttendanceListQueryParams,
  ): Observable<AbsenceAttendanceListItem[]> {
    return this.http
      .get<IResponse<AbsenceAttendanceListItemDTO[]>>(
        `${ApiUrl.v1BE}/attendances/confirm`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          const mapData = ATTENDANCE_MAP_FROM_DTO.absenceAttendanceList(
            res.data,
          );
          this.updateAbsenceAttendanceList(
            this.mapAbsenceAttendanceList(mapData),
          );
          return mapData;
        }),
        catchError(() => {
          this.updateAbsenceAttendanceList([]);
          return of([]);
        }),
      );
  }

  mapClassAttendanceList(data: AttendanceListItem[]) {
    const classAttendanceList: IClassAttendance[] = data.map((item) => {
      return {
        class: item.displayClassName,
        classId: item.classId,
        status: item.status,
        level: item.displayLevelName,
        levelId: item.levelId,
        date: item.date,
        markedBy: item.displayMarkedBy,
      };
    });
    return classAttendanceList;
  }

  clearClassAttendanceList() {
    this._classAttendanceList.set([]);
  }

  getClassStudentsAttendanceList(
    params: StudentAttendanceListQueryParams,
  ): Observable<StudentAttendance[]> {
    return this.http
      .get<IResponse<StudentAttendanceDTO[]>>(
        `${ApiUrl.v1BE}/attendances/students`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          const mappedFromDTO = ATTENDANCE_MAP_FROM_DTO.studentAttendanceList(
            res.data,
          );
          const studentAttendanceList =
            this.mapStudentAttendanceList(mappedFromDTO);
          const studentAttendanceMap = studentAttendanceList.reduce(
            (map, item) => {
              map.set(item.id, item);
              return map;
            },
            new Map<number, IStudentAttendance>(),
          );
          this.studentAttendanceMap.set(studentAttendanceMap);
          return mappedFromDTO;
        }),
      );
  }

  mapStudentAttendanceList(data: StudentAttendance[]) {
    const isToday = isSameDay(this.selectedDate(), new Date());
    const studentAttendanceList: IStudentAttendance[] = data.map((item) => {
      // For today: default to PRESENT when no attendance record exists
      // For past dates: keep null so the UI shows disabled/blurred statuses
      const defaultStatus = isToday ? AttendanceStatus.PRESENT : null;
      return {
        id: item.studentId,
        name: item.displayName,
        nationalId: item.nationalId,
        imageUrl: item.imageUrl,
        checkIn: item.attendance?.checkIn,
        checkOut: item.attendance?.checkOut,
        date: item.attendance?.date,
        attendance: item.attendance?.attendanceStatus ?? defaultStatus,
        attendanceType: item.attendance?.type,
        reason: item.attendance?.reason,
      };
    });
    return studentAttendanceList;
  }

  updateClassAttendanceList(data: IClassAttendance[]) {
    this._classAttendanceList.set(data);
  }

  updateSelectedDate(date: Date) {
    this._selectedDate.set(date);
  }

  updateSelectedLevel(level: number) {
    this._selectedLevel.set(level);
  }

  updateSelectedClass(classId: number) {
    this._selectedClass.set(classId);
  }

  updateStudentAttendance(
    studentId: number,
    status: AttendanceStatus,
    reason?: string,
  ) {
    this.studentAttendanceMap.update((map) => {
      const oldAttendance = map.get(studentId);
      const { reason: oldReason, ...rest } = oldAttendance!;
      map.set(studentId, {
        ...rest!,
        attendance: status,
        ...(reason && status === AttendanceStatus.ON_LEAVE && { reason }),
      });
      return new Map(map);
    });
  }

  markAttendance(schoolId: number) {
    const payload: MarkAttendancePayload = {
      schoolId: schoolId,
      levelId: this.selectedLevel()!,
      classId: this.selectedClass()!,
      academicYearId: this.academicYearScopeService.selectedAcademicYear()!.id,
      date: formatDate(this.selectedDate().toISOString(), 'yyyy-MM-dd'),
      attendanceData: this.studentAttendanceList()
        .filter((item) => item.attendance != null)
        .map((item) => {
          return {
            studentId: item.id,
            status: item.attendance!,
            ...(item.reason && { reason: item.reason }),
          };
        }),
    };
    return this.http.post(`${ApiUrl.v1BE}/attendances/mark`, {
      ...payload,
    });
  }

  markAbsent(ids: number[], isNotify: boolean) {
    return this.http.post(`${ApiUrl.v1BE}/attendances/confirm`, {
      ids,
      isNotify,
    });
  }

  mapAbsenceAttendanceList(data: AbsenceAttendanceListItem[]) {
    const classAttendanceList: IClassAttendanceAbsence[] = data.map((item) => {
      const level = this.schoolStructureListingService
        .levelsList()
        .find((level) => level.id === item.attendance.levelId);

      // Derive firstConfirmedStatus and latestConfirmationStatus from statusHistory
      // statusHistory is sorted by createdAt DESC (newest first)
      const sortedHistory = item.statusHistory || [];
      const firstEntry =
        sortedHistory.length > 0
          ? sortedHistory[sortedHistory.length - 1]
          : null;
      const latestEntry = sortedHistory.length > 0 ? sortedHistory[0] : null;

      const firstConfirmedStatus = firstEntry?.status || undefined;
      const latestConfirmationStatus =
        latestEntry?.confirmationStatus ||
        item.attendance.confirmationStatus ||
        'PENDING';

      return {
        class: item?.class.displayName || '',
        status:
          ConfirmationStatus[
            latestConfirmationStatus as keyof typeof ConfirmationStatus
          ],
        level: level?.name || '',
        attendance: item.attendance.attendanceStatus,
        guardian: item.guardians
          ? item.guardians.map((guardian) => guardian.displayName).join('<br>')
          : '',
        phone: item.guardians
          ? item.guardians
              .map((guardian) => guardian.displayPhoneNumber)
              .join('<br>')
          : '',
        fullName: item.displayName,
        type: item.attendance.type,
        id: item.attendance.id,
        // Derived from statusHistory
        latestConfirmationStatus,
        firstConfirmedStatus,
        statusHistory: item.statusHistory,
      };
    });
    return classAttendanceList;
  }

  updateAbsenceAttendanceList(data: IClassAttendanceAbsence[]) {
    this._absenceAttendanceList.set(data);
  }

  /**
   * Returns the localized name based on the active language
   */
  private getLocalizedName(
    arName: string | null | undefined,
    enName: string | null | undefined,
  ): string | undefined {
    return this.translate.getActiveLang() === 'ar'
      ? arName || enName || undefined
      : enName || arName || undefined;
  }

  /**
   * Fetches the attendance status history timeline for a specific attendance record
   */
  getAttendanceHistory(
    attendanceId: number,
  ): Observable<AttendanceStatusHistory[]> {
    return this.http
      .get<
        IResponse<AttendanceStatusHistoryDTO[]>
      >(`${ApiUrl.v1BE}/attendances/${attendanceId}/history`)
      .pipe(
        map((res) => {
          return res.data.map((item) => ({
            id: item.id,
            attendanceId: item.attendanceId,
            status: item.status,
            reason: item.reason,
            confirmationStatus: item.confirmationStatus,
            isSmsSent: item.isSmsSent,
            smsContent: item.smsContent,
            markedByName: this.getLocalizedName(
              item.markedByArName,
              item.markedByEnName,
            ),
            confirmedByName: this.getLocalizedName(
              item.confirmedByArName,
              item.confirmedByEnName,
            ),
            createdAt: item.createdAt,
            smsSentAt: item.smsSentAt,
            smsDeliveredAt: item.smsDeliveredAt,
          }));
        }),
        catchError(() => of([])),
      );
  }
}
