import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import {
  LmsExamDto,
  QuestionDto,
  QuestionResponseDTO,
  QuestionType,
  StudentSubmissionStatus,
} from '@pages/course-management/data-access/lms-exam.dto';
import { IResponse } from '@shared/interfaces';
import { FileUploadService } from '@shared/services/file-upload.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { UserEventService } from '@shared/services/user-event.service';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { isPast } from 'date-fns';
import { interval, map, of, startWith, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { IQuestionFormControlConfig } from '../components/question-form-control-generator/question-form-control-generator.component';

@Injectable({
  providedIn: 'root',
})
export class LMSExamService {
  constructor(private http: HttpClient) {}

  private readonly auth = inject(AuthService);
  private readonly toaster = inject(HesToasterService);
  private readonly translate = inject(HesTranslateService);
  private readonly userEventService = inject(UserEventService);
  private fileUploadService = inject(FileUploadService);

  private readonly _examDetails = signal<LmsExamDto | null>(null);
  public examDetails = this._examDetails.asReadonly();
  studentScope = inject(StudentSelectionScopeService);
  private readonly _examQuestions = signal<IQuestionFormControlConfig[]>([]);
  examQuestions = this._examQuestions.asReadonly();

  private readonly _assignmentDetails = signal<any | null>(null);

  submissionInProgress = signal(false);

  viewCorrectAnswers = computed<boolean>(() => {
    return (
      (!!this.examDetails()?.isViewCorrectAnswer &&
        isPast(new Date(this.examDetails()?.dueDate!))) ||
      this.auth.isUserPersonnel()
    );
  });

  private intervalSubscription: Subscription | null = null;
  private submissionTriggeredByTimer = false;
  remainingTime = signal<string>('');

  getExamDetails(examId: number, studentId: number) {
    return this.http.get<IResponse<LmsExamDto>>(
      `${ApiUrl.v1BE}/courses/lms/exams/${examId}`,
      {
        params: {
          studentId,
        },
      },
    );
  }

  updateExamDetails(examDetails: LmsExamDto) {
    this._examDetails.set(examDetails);
  }

  startExam(examId: number, studentId: number) {
    return this.http
      .put<IResponse<LmsExamDto>>(
        `${ApiUrl.v1BE}/courses/lms/exams/${examId}/submission`,
        {
          studentId,
          status: 'IN_PROGRESS',
        },
      )
      .pipe(
        tap((res) => {
          // Reset state for re-take
          this.userEventService.markCourseAsUpdated();
          this.submissionTriggeredByTimer = false;
          this.clearRemainingTimeUpdate(); // stop any existing interval
          this.updateExamDetails(res.data); // make sure to update exam state
          this.setupRemainingTimeUpdate(); // start timer
        }),
      );
  }

  setupRemainingTimeUpdate() {
    if (this.intervalSubscription) return; // Prevent duplicate intervals

    this.intervalSubscription = interval(1000)
      .pipe(
        startWith(0),
        switchMap(() => {
          const examDetails = this._examDetails();
          if (!examDetails || !examDetails.submissionData) {
            return of('N/A');
          }
          const duration = examDetails.duration * 1000;
          const updatedAt = new Date(
            examDetails.submissionData.updatedAt,
          ).getTime();
          const endTime = updatedAt + duration;
          const currentTime = Date.now();
          const remaining = endTime - currentTime;

          if (remaining <= 0) {
            const studentId = this.studentScope.selectedStudent()?.id;
            if (
              examDetails.submissionData.status !== 'SUBMITTED' &&
              studentId &&
              !this.submissionTriggeredByTimer
            ) {
              this.submissionTriggeredByTimer = true;

              this.finishExam(examDetails.id, studentId).subscribe({
                next: () => {
                  this.toaster.success(
                    this.translate.t(
                      'content_management.exam_successfully_submitted.txt',
                    ),
                  );
                  this.clearRemainingTimeUpdate();
                },
                error: (err) => {
                  this.toaster.showBackendError(err);
                },
              });
            }
            return of('00:00:00');
          }

          const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
            .toString()
            .padStart(2, '0');
          const minutes = Math.floor((remaining / (1000 * 60)) % 60)
            .toString()
            .padStart(2, '0');
          const seconds = Math.floor((remaining / 1000) % 60)
            .toString()
            .padStart(2, '0');

          return of(`${hours}:${minutes}:${seconds}`);
        }),
      )
      .subscribe((timeString) => {
        this.remainingTime.set(timeString);
      });
  }

  clearRemainingTimeUpdate() {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }
  }

  isSubmissionDisabled = computed<boolean>(() => {
    if (
      this.examDetails()?.submissionData?.status ===
      StudentSubmissionStatus.SUBMITTED
    )
      return true;
    else if (this.examDetails()?.dueDate) {
      return isPast(new Date(this.examDetails()!.dueDate));
    } else return false;
  });

  mapAllQuestions(questions: QuestionDto[], isResultView: boolean) {
    const questionControls = questions.map((question, index) => {
      return {
        id: question.id,
        questionType: question.type,
        question: question.text,
        isExam: true,
        totalQuestions: questions.length,
        order: index + 1,
        essayAnswer: question.answer?.answerText,
        attachment: question.attachments?.[0],
        submittedAnswer: this.mapSubmittedAnswer(question),
        allowAttachmentAsEssayAnswer:
          question.type === QuestionType.ESSAY && question.isAttachmentAllowed,
        submittedAttachments: question.answer?.attachments,
        formControlName: `question_${question.id}`, // Example: dynamic formControlName based on question id
        showCorrectAnswer: isResultView && this.viewCorrectAnswers(),
        modelEssayAnswer: question.modelAnswer,
        showSubmission: this.isSubmissionDisabled(),
        isResultView: isResultView,
        options: question.options
          ? question.options.map((option) => {
              return {
                id: option.questionId,
                displayedValue: option.text,
                value: option.id,
                correctAnswer: option.isCorrect,
              };
            })
          : [],
      };
    });
    this._examQuestions.set(questionControls);
  }

  mapSubmittedAnswer(question: QuestionDto) {
    if (
      question.type === QuestionType.MCQ ||
      question.type === QuestionType.TRUE_OR_FALSE
    ) {
      return question.answer?.questionOptionId;
    } else if (!question.isAttachmentAllowed) {
      return question.answer?.answerText;
    } else return question.answer?.attachments;
  }

  getExamQuestions(examId: number, studentId: number, isResultView = false) {
    return this.http
      .get<IResponse<QuestionResponseDTO>>(
        `${ApiUrl.v1BE}/courses/lms/exams/${examId}/questions`,
        {
          params: {
            studentId,
          },
        },
      )
      .pipe(
        map((res) => {
          const examDetails: LmsExamDto = {
            ...res.data,
            examStatus: res.data?.submissionData.status, // Add the missing examStatus property
            timeSpent: res.data?.submissionData?.timeSpent ?? 0, // Add the missing timeSpent property
          };
          this.updateExamDetails(examDetails);
          this.mapAllQuestions(res.data.questions, isResultView);
          return res;
        }),
      );
  }

  saveAnswer(
    examId: number,
    questionId: number,
    questionOptionId?: number,
    answerText?: any,
  ) {
    if (Array.isArray(answerText)) {
      const newFiles = answerText.filter(
        (item: IAttachmentControlValue) => item instanceof File,
      );
      // If the answerText is an array of files, upload them as attachments
      return this.uploadAttachments(newFiles as IAttachmentControlValue[]).pipe(
        switchMap((uploadedFiles) => {
          const attachments = uploadedFiles.map((i) => i.key);
          return this.http.put<IResponse<LmsExamDto>>(
            `${ApiUrl.v1BE}/courses/lms/exams/${examId}/answer`,
            {
              questionId,
              attachments,
              answerText: '  ', // Placeholder for essay answers
            },
          );
        }),
      );
    }

    return this.http
      .put<IResponse<LmsExamDto>>(
        `${ApiUrl.v1BE}/courses/lms/exams/${examId}/answer`,
        {
          questionId,
          questionOptionId,
          answerText,
        },
      )
      .pipe(
        map((res) => {
          this.userEventService.markCourseAsUpdated();
          const questions = this._examQuestions().map((question) => {
            if (question.id === questionId) {
              return {
                ...question,
                answer: {
                  answerText,
                  questionOptionId,
                },
              };
            }
            return question;
          });
          this._examQuestions.set(questions);
          return res;
        }),
      );
  }

  getCmsExamQuestions(examId: number, studentId: number, isResultView = true) {
    return this.http
      .get<IResponse<QuestionResponseDTO>>(
        `${ApiUrl.v1BE}/courses/cms/exams/${examId}/questions`,
        {
          params: {
            studentId,
          },
        },
      )
      .pipe(
        map((res) => {
          const examDetails: LmsExamDto = {
            ...res.data,
            examStatus: res.data?.submissionData.status, // Add the missing examStatus property
            timeSpent: res.data?.submissionData?.timeSpent ?? 0, // Add the missing timeSpent property
          };
          this.updateExamDetails(examDetails);
          this.mapAllQuestions(res.data.questions, isResultView);
          return res;
        }),
      );
  }

  finishExam(examId: number, studentId: number) {
    this.submissionInProgress.set(true);
    return this.http
      .put<IResponse<LmsExamDto>>(
        `${ApiUrl.v1BE}/courses/lms/exams/${examId}/submission`,
        {
          studentId,
          status: 'SUBMITTED',
        },
      )
      .pipe(
        switchMap((res) => {
          this.clearRemainingTimeUpdate();
          this.userEventService.markCourseAsUpdated();
          return this.getExamDetails(examId, studentId).pipe(
            tap((examDetails) => {
              this.updateExamDetails(examDetails.data);
              this.submissionInProgress.set(false);
              this.submissionTriggeredByTimer = false; // Reset for future exams
            }),
            map(() => res),
          );
        }),
      );
  }

  getExamStudentsProgress(
    examId: number,
    params: { academicYearId: number; classId?: number },
  ) {
    return this.http.get(
      `${ApiUrl.v1BE}/courses/cms/exams/${examId}/students`,
      {
        params,
      },
    );
  }

  uploadAttachments(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/courses/lms/answers/file/upload`,
      attachments,
    );
  }
}
