import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { IResponse } from '@shared/interfaces';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '@auth/auth.service';
import { TranslocoService } from '@jsverse/transloco';
import { IQuestionFormControlConfig } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { isPast } from 'date-fns';
import {
  AnswerPayload,
  QuestionDTO,
  QuestionType,
  StudentAssignmentDTO,
  StudentAssignmentQuestionsDTO,
  StudentSubmissionStatus,
} from './lms-assignment.dto';

@Injectable()
export class LMSAssignmentService {
  private readonly auth = inject(AuthService);
  private http = inject(HttpClient);
  private fileUploadService = inject(FileUploadService);
  private transloco = inject(TranslocoService);

  private readonly _assignmentQuestions = signal<IQuestionFormControlConfig[]>(
    [],
  );
  assignmentQuestions = this._assignmentQuestions.asReadonly();

  private readonly _assignmentDetails = signal<StudentAssignmentDTO | null>(
    null,
  );
  assignmentDetails = this._assignmentDetails.asReadonly();

  isSubmissionDisabled = computed<boolean>(() => {
    if (
      this.assignmentDetails()?.submissionData.status ===
      StudentSubmissionStatus.SUBMITTED
    )
      return true;
    else if (this.assignmentDetails()?.dueDate) {
      return isPast(new Date(this.assignmentDetails()!.dueDate));
    } else return false;
  });

  viewCorrectAnswers = computed<boolean>(() => {
    return (
      !!this.assignmentDetails()?.isViewCorrectAnswer ||
      this.auth.isUserPersonnel()
    );
  });

  constructor() {}

  getAssignmentDetails(assignmentId: number, studentId: number) {
    return this.http
      .get<IResponse<StudentAssignmentDTO>>(
        `${ApiUrl.v1BE}/courses/lms/assignments/${assignmentId}`,
        {
          params: {
            studentId,
          },
        },
      )
      .pipe(
        map((res) => {
          this._assignmentDetails.set(res.data);
          return res;
        }),
        catchError((err) => {
          return of(err);
        }),
      );
  }

  getAssignmentQuestions(assignmentId: number, studentId: number) {
    return this.http
      .get<IResponse<StudentAssignmentQuestionsDTO>>(
        `${ApiUrl.v1BE}/courses/lms/assignments/${assignmentId}/questions`,
        {
          params: {
            studentId,
          },
        },
      )
      .pipe(
        map((res) => {
          this._assignmentQuestions.set(
            this.mapAssignmentQuestions(res.data.questions),
          );
          return res;
        }),
        catchError((err) => {
          return of(err);
        }),
      );
  }

  mapAssignmentQuestions(
    data: QuestionDTO[],
  ): Array<IQuestionFormControlConfig> {
    const list: IQuestionFormControlConfig[] = data.map((item, i) => {
      return {
        id: item.id,
        isExam: false,
        order: i + 1,
        totalQuestions: data.length,
        question: item.text,
        questionType: item.type,
        showCorrectAnswer: this.viewCorrectAnswers(),
        // TODO rename property to reflect what it does
        // disabling interaction
        showSubmission: this.isSubmissionDisabled(),
        attachment: item.attachments?.[0],
        formControlName: `question_${item.id}`,
        allowAttachmentAsEssayAnswer: item.isAttachmentAllowed,
        modelEssayAnswer: item.modelAnswer,
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

  startAssignment(assignmentId: number, studentId: number) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/assignments/${assignmentId}/submission`,
      {
        studentId,
        status: StudentSubmissionStatus.IN_PROGRESS,
      },
    );
  }

  submitAssignment(
    assignmentId: number,
    studentId: number,
    attachments?: string[],
  ) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/assignments/${assignmentId}/submission`,
      {
        studentId,
        status: StudentSubmissionStatus.SUBMITTED,
        ...(attachments?.length && { attachments }),
      },
    );
  }

  submitAnswer(assignmentId: number, payload: AnswerPayload) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/lms/assignments/${assignmentId}/answer`,
      {
        ...payload,
      },
    );
  }

  uploadAttachments(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/courses/lms/answers/file/upload`,
      attachments,
    );
  }

  translate(key: string) {
    return this.transloco.translate(key);
  }

  translateGlobal(key: string) {
    return this.transloco.translate(key);
  }
}
