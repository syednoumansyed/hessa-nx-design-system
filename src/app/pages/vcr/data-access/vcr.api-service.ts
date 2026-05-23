import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { cleanObject } from '@shared/utils/clean-object.util';
import { map, Observable } from 'rxjs';
import {
  AttendancePayload,
  StudentVCRAttendanceDTO,
  VCRAttendanceDTO,
} from '../data-access/attendance.dto';
import {
  LectureRecordingUploadPayload,
  UpdateUploadTitlePayload,
  VCRLecturesResponseDTO,
  VCRRecordingResponseDTO,
  VCRRecordingsResponseDTO,
} from './manage-recording.dto';
import {
  VirtualClassroomDTO,
  VirtualClassroomListResponseDTO,
  VirtualClassroomPayloadDTO,
  VirtualClassroomRequestPayload,
  VirtualClassroomResponseDTO,
} from './vcr.dto';
import { VirtualClassroom, VirtualClassroomResponse } from './vcr.interface';
import { VCR_MAP_FROM_DTO } from './vcr-dto-transform';
import { VCR_ATTENDANCE_MAP_FROM_DTO } from './attendance-dto-transform';
import { StudentVCRAttendance, VCRAttendance } from './attendance.interface';

@Injectable({
  providedIn: 'root',
})
export class VcrAPIService {
  // #region injection
  private readonly httpClient = inject(HttpClient);
  // #endregion

  // #region private properties
  // #endregion

  getUploadVideoUrl(): string {
    return `${ApiUrl.v1BE}/vcrs/video/upload`;
  }

  uploadingLectureRecoding(
    lectureId: number,
    payload: LectureRecordingUploadPayload,
  ): Observable<unknown> {
    return this.httpClient.post(
      `${ApiUrl.v1BE}/vcrs/lectures/${lectureId}/recordings`,
      payload,
    );
  }

  updateUploadedRecordingTitle(
    lectureId: number,
    recordingId: string,
    payload: UpdateUploadTitlePayload,
  ): Observable<unknown> {
    return this.httpClient.put(
      `${ApiUrl.v1BE}/vcrs/lectures/${lectureId}/recordings/${recordingId}`,
      payload,
    );
  }

  fetchRecordingsByLectureId(
    lectureId: number,
  ): Observable<VCRRecordingResponseDTO['data']> {
    return this.httpClient
      .get<VCRRecordingResponseDTO>(
        `${ApiUrl.v1BE}/vcrs/lectures/${lectureId}/recordings`,
      )
      .pipe(map((resp) => resp.data));
  }

  fetchVCRById(id: number): Observable<VirtualClassroomDTO> {
    return this.httpClient.get<VirtualClassroomDTO>(
      `${ApiUrl.v1BE}/vcrs/${id}`,
    );
  }

  fetchLecturesByVcrId(vcrId: number): Observable<VCRLecturesResponseDTO> {
    return this.httpClient.get<VCRLecturesResponseDTO>(
      `${ApiUrl.v1BE}/vcrs/${vcrId}/sessions`,
    );
  }

  fetchVCRAttendances(vcrId: number): Observable<VCRAttendance[]> {
    return this.httpClient
      .get<
        IResponse<VCRAttendanceDTO[]>
      >(`${ApiUrl.v1BE}/vcrs/${vcrId}/attendances`)
      .pipe(
        map((resp) => VCR_ATTENDANCE_MAP_FROM_DTO.vcrsAttendance(resp.data)),
      );
  }

  fetchVCRAttendancesByLectureId(
    vcrId: number,
    lectureId: number,
  ): Observable<StudentVCRAttendance[]> {
    return this.httpClient
      .get<
        IResponse<StudentVCRAttendanceDTO[]>
      >(`${ApiUrl.v1BE}/vcrs/${vcrId}/attendances/${lectureId}/students`)
      .pipe(
        map((resp) =>
          VCR_ATTENDANCE_MAP_FROM_DTO.studentVCRAttendances(resp.data),
        ),
      );
  }

  fetchRcordingsByVcrId(
    vcrId: number,
  ): Observable<VCRRecordingsResponseDTO['data']> {
    return this.httpClient
      .get<VCRRecordingsResponseDTO>(`${ApiUrl.v1BE}/vcrs/${vcrId}/recordings`)
      .pipe(map((resp) => resp.data));
  }

  fetchVCRList(
    payload: VirtualClassroomRequestPayload,
    isPersonnel = true,
  ): Observable<IPaginatedResponse<VirtualClassroom[]>> {
    const params = cleanObject(payload);
    return this.httpClient
      .get<VirtualClassroomListResponseDTO>(
        `${ApiUrl.v1BE}/vcrs/${isPersonnel ? 'personnels' : 'students'}`,
        {
          params,
        },
      )
      .pipe(
        map((response) => {
          return {
            ...response,
            data: VCR_MAP_FROM_DTO.virtualClassrooms(response.data),
          };
        }),
      );
  }

  markAttendance(
    vcrId: number,
    lectureId: number,
    attendance: AttendancePayload,
  ): Observable<StudentVCRAttendanceDTO[]> {
    return this.httpClient
      .put<
        IResponse<StudentVCRAttendanceDTO[]>
      >(`${ApiUrl.v1BE}/vcrs/${vcrId}/attendances/${lectureId}/mark`, attendance)
      .pipe(map((resp) => resp.data));
  }

  saveLinkClick(vcrId: number, lectureId: number) {
    return this.httpClient
      .put<
        IResponse<StudentVCRAttendanceDTO[]>
      >(`${ApiUrl.v1BE}/vcrs/${vcrId}/attendances/${lectureId}/click`, {})
      .pipe(map((resp) => resp.data));
  }

  addVirtualClassroom(
    payload: VirtualClassroomPayloadDTO,
  ): Observable<VCRLecturesResponseDTO> {
    return this.httpClient.post<VCRLecturesResponseDTO>(
      `${ApiUrl.v1BE}/vcrs`,
      payload,
    );
  }

  updateVirtualClassroom(
    id: number,
    payload: VirtualClassroomPayloadDTO,
  ): Observable<VCRLecturesResponseDTO> {
    return this.httpClient.put<VCRLecturesResponseDTO>(
      `${ApiUrl.v1BE}/vcrs/${id}`,
      payload,
    );
  }

  deleteVirtualClassroom(id: number): Observable<VCRLecturesResponseDTO> {
    return this.httpClient.delete<VCRLecturesResponseDTO>(
      `${ApiUrl.v1BE}/vcrs/${id}`,
    );
  }

  //Replace with Real API
  deleteRecording(
    lectureId: ObjId,
    id: ObjId,
  ): Observable<VCRLecturesResponseDTO> {
    return this.httpClient.delete<VCRLecturesResponseDTO>(
      `${ApiUrl.v1BE}/vcrs/lectures/${lectureId}/recordings/${id}`,
    );
  }

  getVirtualClassroomById(id: number): Observable<VirtualClassroomResponse> {
    return this.httpClient
      .get<IResponse<VirtualClassroomResponseDTO>>(`${ApiUrl.v1BE}/vcrs/${id}`)
      .pipe(
        map((response) => {
          return {
            totalItems: response.data.totalItems,
            data: VCR_MAP_FROM_DTO.virtualClassrooms(response.data.data),
          };
        }),
      );
  }
}
