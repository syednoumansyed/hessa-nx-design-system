import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { IQuestionFormControlConfig } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import {
  QuestionDTO,
  QuestionType,
  StudentAssignmentDTO,
  StudentAssignmentQuestionsDTO,
} from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Observable, catchError, map, of } from 'rxjs';
import {
  CMSAssignmentDTO,
  CMSAssignmentPayload,
  CMSAssignmentResponseDTO,
  CMSAssignmentResponsePreviewDTO,
} from './cms-assignment.dto';

@Injectable({
  providedIn: 'root',
})
export class CMSAssignmentsService {
  private http = inject(HttpClient);
  private readonly fileUploadService = inject(FileUploadService);
  constructor() {}

  private readonly _assignmentQuestions = signal<IQuestionFormControlConfig[]>(
    [],
  );
  assignmentQuestions = this._assignmentQuestions.asReadonly();

  private readonly _assignmentDetails = signal<StudentAssignmentDTO | null>(
    null,
  );
  assignmentDetails = this._assignmentDetails.asReadonly();

  getAssignment(id: ObjId): Observable<CMSAssignmentDTO> {
    return this.http
      .get<CMSAssignmentResponseDTO>(
        `${ApiUrl.v1BE}/courses/cms/assignments/${id}`,
      )
      .pipe(map((res) => res.data));
  }

  createAssignment(
    assignment: CMSAssignmentPayload,
  ): Observable<CMSAssignmentDTO> {
    return this.http
      .post<CMSAssignmentResponseDTO>(
        `${ApiUrl.v1BE}/courses/cms/assignments`,
        assignment,
      )
      .pipe(map((res) => res.data));
  }

  updateAssignment(
    assignmentId: number,
    assignment: CMSAssignmentPayload,
  ): Observable<CMSAssignmentDTO> {
    return this.http
      .put<CMSAssignmentResponseDTO>(
        `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}`,
        assignment,
      )
      .pipe(map((res) => res.data));
  }

  deleteAssignment(assignmentId: number, withSubmission: boolean = false) {
    return this.http.delete(
      `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}${withSubmission ? '/submissions' : ''}`,
    );
  }

  publishAssignment(id: number) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/cms/assignments/${id}/publish`,
      { publish: true },
    );
  }

  uploadFile(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/courses/cms/assignments/file/upload`,
      attachments,
    );
  }

  getAssignmentsStudentsProgress(
    assignmentId: number,
    params: { academicYearId: number; classId?: number },
  ) {
    return this.http.get(
      `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}/students`,
      {
        params,
      },
    );
  }

  getCmsStudentAssignmentSubmission(assignmentId: number, studentId: number) {
    return this.http.get(
      `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}/student?studentId=${studentId}`,
    );
  }

  getCmsAssignmentQuestions(assignmentId: number, studentId: number) {
    return this.http
      .get<IResponse<StudentAssignmentQuestionsDTO>>(
        `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}/questions`,
        {
          params: {
            studentId,
          },
        },
      )
      .pipe(
        map((res) => {
          const isResultView = true;
          this._assignmentQuestions.set(
            this.mapAssignmentQuestions(res.data.questions, isResultView),
          );
          return res;
        }),
        catchError((err) => {
          return of(err);
        }),
      );
  }

  getAssignmentQuestions(assignmentId: number) {
    return this.http
      .get<CMSAssignmentResponsePreviewDTO>(
        `${ApiUrl.v1BE}/courses/cms/assignments/${assignmentId}/preview`,
      )
      .pipe(
        map((res) => {
          return {
            title: res.data.title,
            questions: res.data.questions,
          };
        }),
      );
  }

  mapAssignmentQuestions(
    data: QuestionDTO[],
    isResultView = false,
  ): Array<IQuestionFormControlConfig> {
    const list: IQuestionFormControlConfig[] = data.map((item, i) => {
      return {
        id: item.id,
        isExam: false,
        order: i + 1,
        totalQuestions: data.length,
        question: item.text,
        questionType: item.type,
        showCorrectAnswer: true,
        showSubmission: true,
        attachment: item.attachments?.[0],
        formControlName: `question_${item.id}`,
        allowAttachmentAsEssayAnswer: item.isAttachmentAllowed,
        modelEssayAnswer: item.modelAnswer,
        isResultView: isResultView,
        options:
          item.options?.map((option) => {
            return {
              value: option.id,
              displayedValue: option.text,
              correctAnswer: !!option.isCorrect,
            };
          }) ?? [],
        submittedAnswer: this.mapSubmittedAnswer(item),
        submittedAttachments: item.answer?.attachments,
      };
    });
    return list;
  }

  mapSubmittedAnswer(question: QuestionDTO) {
    if (
      question.type === QuestionType.MCQ ||
      question.type === QuestionType.TRUE_OR_FALSE
    ) {
      return question.answer?.questionOptionId;
    } else if (!question.isAttachmentAllowed) {
      return question.answer?.answerText;
    } else return question.answer?.attachments;
  }

  publishAttachment(id: number) {
    return this.http
      .put<CMSAssignmentResponseDTO>(
        `${ApiUrl.v1BE}/attachments/${id}/publish`,
        { publish: true },
      )
      .pipe(map((res) => res.data));
  }
}
