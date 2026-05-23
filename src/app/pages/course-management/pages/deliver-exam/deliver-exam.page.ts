import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { QuestionFormControlGeneratorComponent } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import {
  ExamStyle,
  StudentSubmissionStatus,
} from '@pages/course-management/data-access/lms-exam.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { debounceTime } from 'rxjs';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from '@shared/services/feedback.service';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { UserEventService } from '@shared/services/user-event.service';

@Component({
  selector: 'app-deliver-exam',
  templateUrl: './deliver-exam.page.html',
  styleUrls: ['./deliver-exam.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    CommonModule,
    FormsModule,
    HessaBtnDirective,
    QuestionFormControlGeneratorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
})
export class DeliverExamPage implements OnInit {
  layoutUIControlService = inject(LayoutUiControlService);
  route = inject(ActivatedRoute);
  examService = inject(LMSExamService);
  translocoService = inject(TranslocoService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly userEventService = inject(UserEventService);
  private router = inject(Router);
  private toaster = inject(HesToasterService);
  readonly ExamStyle = ExamStyle;
  currentQuestionIndex = signal(0);
  examId = input<number>();
  studentScope = inject(StudentSelectionScopeService);
  examQuestions = this.examService.examQuestions;
  examDetails = this.examService.examDetails;
  timeRemaining = this.examService.remainingTime;
  isSubmissionDisabled = this.examService.isSubmissionDisabled;
  viewCorrectAnswer = this.examService.viewCorrectAnswers;
  examQuestionForm: FormGroup;

  constructor() {}

  ngOnInit() {
    this.getExamQuestions();
  }

  ionViewWillEnter() {
    this.layoutUIControlService.hideBreadcrumb();
    this.layoutUIControlService.showWebBackBtn();
  }

  ionViewWillLeave() {
    this.layoutUIControlService.showBreadcrumb();
    this.layoutUIControlService.hideWebBackBtn();
  }

  getExamQuestions() {
    const studentId = this.studentScope.selectedStudent()?.id;
    const examId = this.examId();
    if (examId && studentId) {
      this.examService.getExamQuestions(examId, studentId).subscribe({
        next: (_questions) => {
          this.examQuestionForm = this.fb.group({});
          if (
            this.examDetails()?.examStatus !==
            StudentSubmissionStatus.IN_PROGRESS
          ) {
            this.router.navigate(['../'], { relativeTo: this.route });
          }
          this.examService.setupRemainingTimeUpdate();
          this.examQuestions().forEach((question) => {
            this.examQuestionForm.addControl(
              question.formControlName,
              this.fb.control(question.submittedAnswer ?? null),
            );
          });
          this.subscribeToFormChanges();
        },
      });
    }
  }

  subscribeToFormChanges() {
    this.examQuestions().forEach((item) => {
      const questionId = item.id; // Capture the current item.id
      const questionType = item.questionType;
      this.examQuestionForm
        .get(item.formControlName)
        ?.valueChanges.pipe(debounceTime(1200))
        .subscribe((value) => {
          if (questionType === 'ESSAY') {
            // Save the answer only after 1.2 seconds
            const examId = this.examId();
            if (examId) {
              this.examService
                .saveAnswer(examId, questionId, undefined, value)
                .subscribe();
            }
          } else {
            const examId = this.examId();
            if (examId) {
              this.examService
                .saveAnswer(examId, questionId, value)
                .subscribe();
            }
          }
        });
    });
  }

  showConfirmationModal() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'course_management.submit_exam.title',
        ),
        modalMessage: this.translocoService.translate(
          'course_management.sure_submit_exam.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.submit.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => this.submitExam(),
      () => {},
    );
  }

  submitExam() {
    const studentId = this.studentScope.selectedStudent()?.id;
    const examId = this.examId();
    if (examId && studentId) {
      this.examService.finishExam(examId, studentId).subscribe({
        next: () => {
          // Navigate to results page
          this.displaySuccessModal();
        },
        error: (err) => {
          this.toaster.showBackendError(err);
        },
      });
    }
  }

  displaySuccessModal() {
    const viewCorrectAnswer = this.examDetails()?.isViewCorrectAnswer;
    this.feedbackService.openFeedbackModal(
      {
        type: 'success',
        modalTitle: this.translocoService.translate(
          'content_management.exam_successfully_submitted.txt',
        ),
        primaryBtnStr: viewCorrectAnswer
          ? this.translocoService.translate('content_management.view_exam.btn')
          : this.translocoService.translate('global.ok.btn'),
        secondaryBtnStr: viewCorrectAnswer
          ? this.translocoService.translate('global.cancel.btn')
          : undefined,
      },
      () => {
        viewCorrectAnswer
          ? this.router.navigate([`../result`], { relativeTo: this.route })
          : this.router.navigate(['../'], { relativeTo: this.route });
      },
      () => this.router.navigate(['../'], { relativeTo: this.route }),
    );
  }

  nextQuestion() {
    this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
  }

  previousQuestion() {
    this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
  }
}
