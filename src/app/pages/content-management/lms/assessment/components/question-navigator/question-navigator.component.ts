import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { AssessmentApiService } from '../../data-access/assessment.service';
import {
  AssessmentAnswerPayload,
  AssessmentAssignmentDataDto,
  AssessmentExamDataDto,
  AssessmentQuestionDto,
  AssessmentQuestionType,
} from '../../../data-access/assessment.dto';
import { AssessmentTimerComponent } from '../assessment-timer/assessment-timer.component';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  QuestionStatusChipComponent,
  QuestionStatus,
} from '../question-status-chip/question-status-chip.component';
import { ActionListService } from '@shared/services/action-list.service';
import { DsActionListConfig } from '@ds/action-list';
import { faCircleCheck, faWarning } from '@fortawesome/pro-solid-svg-icons';
import { QuestionDisplayComponent } from '../question-display/question-display/question-display.component';
import { ButtonVariant, DsButtonComponent } from '@ds/button/button.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  AssessmentSubmitConfig,
  createAssessmentSubmitModal,
} from '../assessment-submit/assessment-submit.component';
import { CommonModule } from '@angular/common';
import { AssessmentSuccessComponent } from '../after-assessment/after-assessment.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { DsObjId } from '@ds/common.types';
import {
  map,
  Observable,
  of,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

@Component({
  selector: 'app-question-navigator',
  templateUrl: './question-navigator.component.html',
  standalone: true,
  imports: [
    AssessmentTimerComponent,
    QuestionStatusChipComponent,
    QuestionDisplayComponent,
    DsButtonComponent,
    TranslocoDirective,
    CommonModule,
    AssessmentSuccessComponent,
    ReactiveFormsModule,
    DsIconComponent,
  ],
})
export class QuestionNavigatorComponent implements OnInit {
  assignmentId = input<DsObjId | null>(null);
  examId = input<DsObjId | null>(null);
  onClose = input<() => void>(() => {});

  // #region inject
  private readonly destroyRef = inject(DestroyRef);
  private readonly assessmentService = inject(AssessmentApiService);
  private readonly actionListService = inject(ActionListService);
  private readonly translateService = inject(HesTranslateService);
  private readonly submitAssessmentModal = createAssessmentSubmitModal();
  private readonly toaster = inject(HesToasterService);
  private readonly fb = inject(FormBuilder);
  private readonly studentSelectScope = inject(StudentSelectionScopeService);
  // #endregion

  // #region Properties
  assessmentData = signal<
    AssessmentExamDataDto | AssessmentAssignmentDataDto | null
  >(null);
  showAfterAssessment = signal<boolean>(false);
  submittingAnswerLoading = signal<boolean>(false);
  title = computed(() => {
    return this.assessmentData()?.title || '';
  });

  answerForm = this.fb.group({
    answerText: [''], // for essay
    attachments: this.fb.control<DsAttachmentControlValue[]>([]),
    questionOptionId: this.fb.control<number | null>(null), // for mcq/true-false
  });

  isAssignment = computed(() => {
    return this.assignmentId() != null;
  });

  // Timer properties computed from assessment data
  dueDate = computed(() => {
    const data = this.assessmentData();
    return data?.dueDate || null;
  });

  duration = computed(() => {
    const data = this.assessmentData();
    // Only exams have duration, assignments use due date
    return data && 'duration' in data && data.duration ? data.duration : 0;
  });

  remainingDuration = computed(() => {
    if (this.assignmentId()) {
      return Infinity;
    }
    const totalDuration = this.duration();
    const timeSpent = this.assessmentData()?.submissionData?.timeSpent || 0;

    // Both duration and timeSpent are in seconds
    // Calculate remaining duration in seconds, ensuring it doesn't go below 0
    const remaining = Math.max(0, totalDuration - timeSpent);

    return remaining;
  });

  questions = computed<AssessmentQuestionDto[]>(() => {
    const data = this.assessmentData();
    return data?.questions ?? [];
  });

  activeQuestionIndex = signal<number>(0);

  activeQuestion = computed(() => {
    return this.questions()?.[this.activeQuestionIndex()] || null;
  });

  isAssessmentSubmitted = computed(() => {
    return (
      this.assessmentData()?.submissionData?.status ===
      AssessmentStudentSubmissionStatus.SUBMITTED
    );
  });

  isAssessmentMissed = computed(() => {
    return (
      this.assessmentData()?.submissionData?.status ===
      AssessmentStudentSubmissionStatus.MISSED
    );
  });

  isViewMode = computed(() => {
    return this.isAssessmentSubmitted() || this.isAssessmentMissed();
  });

  hasScores = computed(() => {
    const stats = this.assessmentData()?.submissionData?.submissionStats;
    return stats?.correctAnswers != null;
  });

  isTimerShow = computed(() => {
    return (
      (this.remainingDuration() > 0 || this.assignmentId()) &&
      this.dueDate() &&
      !this.isViewMode()
    );
  });
  // #endregion

  //  xmarks-icon
  xMarks = faCircleXmark;

  constructor() {}

  ngOnInit() {
    this.showAfterAssessment.set(false);
    this.fetchAssessment().subscribe();
    this.setupFormChangeHandling();
  }

  private setupFormChangeHandling() {
    if (this.isViewMode()) return;
    // Subscribe to answerText changes with debounce for textarea
    this.answerForm.controls.answerText.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value: string | null) => {
        if (value && value.trim().length > 0) {
          this.saveCurrentAnswer();
        }
      });

    // Subscribe to other form controls without debounce
    this.answerForm.controls.questionOptionId.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value: number | null) => {
        if (value != null) {
          this.saveCurrentAnswer();
        }
      });

    // Subscribe to attachments changes without debounce
    this.answerForm.controls.attachments.valueChanges
      .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe((value: DsAttachmentControlValue[] | null) => {
        if (value && value.length > 0) {
          this.saveCurrentAnswer();
        }
      });
  }

  private saveCurrentAnswer() {
    const question = this.activeQuestion();
    if (!question || this.submittingAnswerLoading()) {
      return;
    }

    // Validate answer before submission
    if (!this.isAnswerValid(question)) {
      return;
    }

    this.submittingAnswerLoading.set(true);

    this.getAnswerPayloadForQuestion(question)
      .pipe(
        switchMap((answer) => {
          if (this.examId()) {
            return this.assessmentService.submitExamAnswer(
              this.assessmentData()!.id,
              answer,
            );
          } else {
            return this.assessmentService.submitAssignmentAnswer(
              this.assessmentData()!.id,
              answer,
            );
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.submittingAnswerLoading.set(false);
        },
        error: (error) => {
          this.submittingAnswerLoading.set(false);
          this.toaster.showBackendError(error);
        },
      });
  }

  fetchAssessment() {
    if (this.assignmentId()) {
      return this.fetchAssignmentData();
    }
    return this.fetchExamData();
  }

  onDisplayQuestionEventFire() {
    this.fetchAssessment().subscribe();
  }
  onDone() {
    this.onClose()();
  }

  onTimeUp() {
    const config: AssessmentSubmitConfig = {
      title: this.translateService.t('time_up.title'),
      summary: this.getSubmitSummary(),
      primaryAction: {
        text: this.translateService.t('global.okay.btn'),
        action: () => {
          this.showAfterAssessment.set(true);
        },
      },
    };
    // this.onSubmitAssessment();
    this.submitAssessmentModal(config);
  }

  fetchAssignmentData() {
    return this.assessmentService
      .getAssessment({
        id: this.assignmentId()!,
        type: 'assignment',
        studentId: this.studentSelectScope.selectedStudentId()!,
      })
      .pipe(
        tap(({ data }) => {
          this.assessmentData.set(data);
        }),
      );
  }

  fetchExamData() {
    return this.assessmentService
      .getAssessment({
        id: this.examId()!,
        type: 'exam',
        studentId: this.studentSelectScope.selectedStudentId()!,
      })
      .pipe(
        tap(({ data }) => {
          this.assessmentData.set(data);
        }),
      );
  }

  onQuestionStatusClick(index: number) {
    this.reloadAssessment();
    if (index !== this.activeQuestionIndex()) {
      this.activeQuestionIndex.set(index);
      this.answerForm.reset();
    }
  }

  onQuestionStatusAllClick() {
    const config: DsActionListConfig['items'] =
      this.questions()?.map((question, index) => ({
        id: question.id?.toString(),
        title: question.modelAnswer || question.text,
        endIconConfig: {
          showArrow: true,
          icon: question.answer ? faCircleCheck : faWarning,
          cssClass: question.answer ? 'text-icon-success' : 'text-icon-warning',
          size: 'lg',
          disableRtlRotate: true,
        },
      })) ?? [];
    if (config) {
      this.actionListService.show({
        title: `${this.translateService.t('all_questions.txt')} (${this.questions()?.length ?? 0})`,
        items: config,
        onItemAction: (_, index) => {
          this.activeQuestionIndex.set(index);
          this.reloadAssessment();
        },
        activeItemIndex: this.activeQuestionIndex(),
      });
    }
  }

  nextQuestion() {
    this.reloadAssessment();
    this.handleNextQuestion();
  }

  /**
   * Returns the answer payload for the given question type
   */
  private getAnswerPayloadForQuestion(
    question: AssessmentQuestionDto,
  ): Observable<AssessmentAnswerPayload> {
    const { answerText, attachments, questionOptionId } = this.answerForm.value;
    if (question.type === AssessmentQuestionType.ESSAY) {
      // upload files if any, otherwise return empty array
      const files = attachments ?? [];
      if (files.length > 0) {
        return this.assessmentService.uploadAttachments(files).pipe(
          map((uploadedFiles) => ({
            questionId: question.id,
            answerText: answerText ?? undefined,
            attachments: uploadedFiles.map((f, i) => ({
              path: f.key,
              name: files[i].name,
            })),
          })),
        );
      } else {
        // no files, just return text
        return of({
          questionId: question.id,
          answerText: answerText ?? undefined,
        });
      }
    } else {
      // MCQs / others → no file upload
      return of({
        questionId: question.id,
        questionOptionId: questionOptionId ?? undefined,
      });
    }
  }

  /**
   * Validates if the answer is provided for the current question type
   */
  private isAnswerValid(question: AssessmentQuestionDto): boolean {
    const { answerText, attachments, questionOptionId } = this.answerForm.value;

    switch (question.type) {
      case AssessmentQuestionType.ESSAY:
        // For essay questions, either text or attachments must be provided
        const hasText = Boolean(answerText && answerText.trim().length > 0);
        const hasAttachments = Boolean(attachments && attachments.length > 0);
        return hasText || hasAttachments;

      case AssessmentQuestionType.MCQ:
      case AssessmentQuestionType.TRUE_OR_FALSE:
        // For MCQ and True/False questions, an option must be selected
        return questionOptionId !== null && questionOptionId !== undefined;

      default:
        // For unknown question types, assume no validation needed
        return true;
    }
  }

  previousQuestion() {
    this.reloadAssessment();
    if (this.activeQuestionIndex() > 0) {
      this.activeQuestionIndex.set(this.activeQuestionIndex() - 1);
    }
  }

  readonly isNextDisabled = computed(() => {
    return this.activeQuestionIndex() === (this.questions()?.length ?? 0) - 1;
  });

  readonly isPreviousDisabled = computed(() => {
    return this.activeQuestionIndex() === 0;
  });

  readonly isLastQuestion = computed(() => {
    return this.activeQuestionIndex() === (this.questions()?.length ?? 0) - 1;
  });

  readonly getNextButtonText = computed<{
    text: string;
    variant: ButtonVariant;
  }>(() => {
    return this.isLastQuestion() && !this.isViewMode()
      ? {
          text: this.translateService.t('global.submit.btn'),
          variant: 'primary',
        }
      : {
          text: this.translateService.t('global.next.btn'),
          variant: 'secondary',
        };
  });

  getQuestionStatus(index: number): QuestionStatus {
    if (this.activeQuestionIndex() === index) {
      return 'current';
    }

    const question = this.questions()[index];
    const questionView = question?.questionView;

    // If no questionView data, default to 'not-visited'
    if (!questionView) {
      return 'not-visited';
    }

    // If both displayed and viewed are false, it's not visited
    if (!questionView.displayed && !questionView.viewed) {
      return 'not-visited';
    }

    // If both displayed and viewed are true, it's attempted
    if (questionView.displayed && questionView.viewed && question.answer) {
      return 'attempted';
    }

    // Otherwise, it's visited
    return 'visited';
  }

  private getSubmitConfig(): AssessmentSubmitConfig {
    return {
      title: this.translateService.t('submit_exam_assignment.title'),
      summary: this.getSubmitSummary(),
      primaryAction: {
        text: this.translateService.t('yes_submit.btn'),

        action: () => {
          this.onSubmitAssessment();
        },
      },
      secondaryAction: {
        text: this.translateService.t('do_not_submit.btn'),
      },
    };
  }

  private getSubmitSummary(): AssessmentSubmitConfig['summary'] {
    const questions = this.questions() || [];
    const total = questions.length;

    const attempted = questions.filter((q) => {
      if (!q.answer) return false;

      switch (q.type) {
        case AssessmentQuestionType.ESSAY:
          // For essay questions, check if either answerText or attachments exist
          const hasText =
            q.answer.answerText && q.answer.answerText.trim().length > 0;
          const hasAttachments =
            q.answer.attachments && q.answer.attachments.length > 0;
          return hasText || hasAttachments;

        case AssessmentQuestionType.MCQ:
        case AssessmentQuestionType.TRUE_OR_FALSE:
          // For MCQ and True/False questions, check if questionOptionId is selected
          return (
            q.answer.questionOptionId !== null &&
            q.answer.questionOptionId !== undefined
          );

        default:
          // For unknown question types, assume answered if answer object exists
          return true;
      }
    }).length;

    return {
      total,
      attempted,
      notAttempted: total - attempted,
    };
  }

  private handleNextQuestion() {
    if (this.isLastQuestion()) {
      if (this.isViewMode()) {
        if (this.hasScores()) {
          this.showAfterAssessment.set(true);
        }
        return;
      } else {
        this.reloadAssessment(() => {
          this.submitAssessmentModal(this.getSubmitConfig());
        });
      }
      return;
    }
    if (this.activeQuestionIndex() < (this.questions()?.length || 0) - 1) {
      this.activeQuestionIndex.set(this.activeQuestionIndex() + 1);
      this.answerForm.reset();
    }
  }

  private onSubmitAssessment() {
    this.submittingAnswerLoading.set(true);

    const submitObservable = this.examId()
      ? this.assessmentService.onSubmitExam({
          id: this.assessmentData()?.id!,
          studentId: this.assessmentData()?.submissionData?.studentId!,
        })
      : this.assessmentService.onSubmitAssignment({
          id: this.assessmentData()?.id!,
          studentId: this.assessmentData()?.submissionData?.studentId!,
        });

    submitObservable.subscribe({
      next: () => {
        this.submittingAnswerLoading.set(false);
        this.showAfterAssessment.set(true);
      },
      error: (error: any) => {
        this.submittingAnswerLoading.set(false);
        this.toaster.showBackendError(error);
      },
    });
  }

  reloadAssessment(cb?: () => void) {
    if (!this.isViewMode()) {
      this.fetchAssessment().subscribe({
        complete: () => {
          if (cb) cb();
        },
      });
    }
  }
}
