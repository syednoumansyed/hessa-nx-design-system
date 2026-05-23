import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  AssessmentAnswerPayload,
  AssessmentAssignmentResponseDto,
  AssessmentExamResponseDto,
} from '../../data-access/assessment.dto';
import { inject, Injectable } from '@angular/core';
import { DsObjId } from '@ds/common.types';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  ExamDetailResponseDto,
  StudentSubmissionStatus,
} from '../types/lms-exam.dto';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { FileUploadService } from '@shared/services/file-upload.service';

@Injectable({
  providedIn: 'root',
})
export class AssessmentApiService {
  private readonly http = inject(HttpClient);
  private readonly fileUploadService = inject(FileUploadService);
  getExamDetail(params: {
    id: DsObjId;
    studentId: DsObjId;
  }): Observable<ExamDetailResponseDto['data']> {
    return this.http
      .get<ExamDetailResponseDto>(
        ApiUrl.v2BE + `/courses/lms/exams/${params.id}`,
        {
          params: {
            studentId: params.studentId,
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  getAssignmentDetail(params: {
    id: DsObjId;
    studentId: DsObjId;
  }): Observable<AssessmentAssignmentResponseDto['data']> {
    return this.http
      .get<AssessmentAssignmentResponseDto>(
        ApiUrl.v2BE + `/courses/lms/assignments/${params.id}`,
        {
          params: {
            studentId: params.studentId,
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  getExamData(params: {
    id: DsObjId;
    studentId: DsObjId;
  }): Observable<AssessmentExamResponseDto> {
    return this.http.get<AssessmentExamResponseDto>(
      ApiUrl.v2BE + `/courses/lms/exams/${params.id}/questions`,
      {
        params: {
          studentId: params.studentId,
        },
      },
    );
  }

  getAssignmentData(params: {
    id: DsObjId;
    studentId: DsObjId;
  }): Observable<AssessmentAssignmentResponseDto> {
    return this.http.get<AssessmentAssignmentResponseDto>(
      ApiUrl.v2BE + `/courses/lms/assignments/${params.id}/questions`,
      {
        params: {
          studentId: params.studentId,
        },
      },
    );
  }

  getAssessment(args: {
    id: DsObjId;
    type: 'exam' | 'assignment';
    studentId: DsObjId;
  }): Observable<AssessmentExamResponseDto | AssessmentAssignmentResponseDto> {
    if (args.type === 'exam') {
      return this.getExamData({
        id: args.id,
        studentId: args.studentId,
      });
    } else {
      return this.getAssignmentData({
        id: args.id,
        studentId: args.studentId,
      });
    }
  }
  submitExamAnswer(id: number, payload: AssessmentAnswerPayload) {
    return this.http.put(
      ApiUrl.v2BE + `/courses/lms/exams/${id}/answer`,
      payload,
    );
  }

  submitAssignmentAnswer(id: number, payload: AssessmentAnswerPayload) {
    return this.http.put(
      ApiUrl.v2BE + `/courses/lms/assignments/${id}/answer`,
      payload,
    );
  }

  onSubmitExam(args: {
    id: DsObjId;
    studentId: DsObjId;
    attachments?: string[];
  }) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/exams/${args.id}/submission`,
      {
        studentId: args.studentId,
        status: StudentSubmissionStatus.SUBMITTED,
        ...(args.attachments?.length && { attachments: args.attachments }),
      },
    );
  }

  onSubmitAssignment(args: {
    id: DsObjId;
    studentId: DsObjId;
    attachments?: { path: string; name?: string }[];
  }) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/assignments/${args.id}/submission`,
      {
        studentId: args.studentId,
        status: StudentSubmissionStatus.SUBMITTED,
        ...(args.attachments?.length && { attachments: args.attachments }),
      },
    );
  }

  onStartExam(args: { id: DsObjId; studentId: DsObjId }) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/exams/${args.id}/submission`,
      {
        studentId: args.studentId,
        status: StudentSubmissionStatus.IN_PROGRESS,
      },
    );
  }

  onStartAssignment(args: { id: DsObjId; studentId: DsObjId }) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/assignments/${args.id}/submission`,
      {
        studentId: args.studentId,
        status: StudentSubmissionStatus.IN_PROGRESS,
      },
    );
  }

  uploadAttachments(attachments: DsAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v2BE}/courses/lms/answers/file/upload`,
      attachments,
    );
  }
}
