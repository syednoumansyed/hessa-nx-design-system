import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { QuestionFormControlGeneratorComponent } from '../../components/question-form-control-generator/question-form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { switchMap } from 'rxjs';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutService } from '@layout/layout.service';
import { AnswerPayload } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { LMSAssignmentService } from '@pages/course-management/data-access/lms/lms-assignment.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { QuestionType } from '@pages/course-management/data-access/lms-exam.dto';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { UserEventService } from '@shared/services/user-event.service';

@Component({
  selector: 'app-assignment-questions',
  templateUrl: './assignment-questions.page.html',
  styleUrls: ['./assignment-questions.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    QuestionFormControlGeneratorComponent,
    HesButtonModule,
    TranslocoDirective,
  ],
})
export class AssignmentQuestionsPage implements OnInit {
  private readonly assignmentService = inject(LMSAssignmentService);
  private readonly fb = inject(FormBuilder);
  private readonly feedbackService = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  student = inject(StudentSelectionScopeService).selectedStudent;
  private readonly layoutService = inject(LayoutService);
  private readonly layoutUiService = inject(LayoutUiControlService);
  private readonly toastr = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);
  private readonly userEventService = inject(UserEventService);

  assignmentQuestions = this.assignmentService.assignmentQuestions;
  assignmentDetails = this.assignmentService.assignmentDetails;
  isSubmissionDisabled = this.assignmentService.isSubmissionDisabled;

  assignmentQuestionForm = this.fb.group({});

  isSubmitting = signal(false);

  @Input() assignmentId: string;

  subjectTitle = inject(CourseListService)
    .mappedCoursesList()
    .find((c) => c.courseId === +this.route.snapshot.params['courseId'])?.title;

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.assignmentQuestions().forEach((question) => {
      this.assignmentQuestionForm.addControl(
        question.formControlName,
        this.fb.control(question.submittedAnswer ?? null, [
          Validators.required,
        ]),
      );
    });
  }

  ionViewWillEnter() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.layoutUiService.showWebBackBtn();
  }
  ionViewWillLeave() {
    this.layoutUiService.hideWebBackBtn();
  }

  onValueChange(data: any) {
    const questionConfig = this.assignmentQuestions().find(
      (q) => q.id === data.questionId,
    );
    const questionType = questionConfig?.questionType;

    if (
      questionType === QuestionType.ESSAY &&
      questionConfig?.allowAttachmentAsEssayAnswer
    ) {
      const newFiles = data.value.filter(
        (item: IAttachmentControlValue) => item instanceof File,
      );
      this.layoutService.showProgressBar();
      this.isSubmitting.set(true);
      this.assignmentService
        .uploadAttachments(newFiles)
        .pipe(
          switchMap((uploadedFiles) => {
            const payload: AnswerPayload = {
              questionId: data.questionId,
              attachments: uploadedFiles.map((i) => i.key),
              answerText: '  ',
            };
            return this.assignmentService.submitAnswer(
              +this.assignmentId,
              payload,
            );
          }),
        )
        .subscribe({
          next: () => {
            this.userEventService.markCourseAsUpdated();
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
          },
          error: () => {
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
          },
        });
    } else {
      const payload: AnswerPayload = {
        questionId: data.questionId,
        ...((questionType === QuestionType.MCQ ||
          questionType === QuestionType.TRUE_OR_FALSE) && {
          questionOptionId: data.value,
        }),
        ...(questionType === QuestionType.ESSAY &&
          !questionConfig?.allowAttachmentAsEssayAnswer && {
            answerText: data.value,
          }),
      };
      this.layoutService.showProgressBar();
      this.isSubmitting.set(true);
      this.assignmentService
        .submitAnswer(+this.assignmentId, payload)
        .subscribe({
          next: () => {
            this.userEventService.markCourseAsUpdated();
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
          },
          error: () => {
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
          },
        });
    }
  }

  submitAssignment() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.assignmentService.translate(
          'content_management.submit_assignment.label',
        ),
        modalMessage: this.assignmentService.translate(
          'content_management.submit_assignment.txt',
        ),
        primaryBtnStr:
          this.assignmentService.translateGlobal('global.submit.btn'),
        secondaryBtnStr:
          this.assignmentService.translateGlobal('global.cancel.btn'),
      },
      () => {
        this.layoutService.showProgressBar();
        this.isSubmitting.set(true);
        this.assignmentService
          .submitAssignment(+this.assignmentId, this.student()?.id!)
          .subscribe({
            next: () => {
              this.layoutService.hideProgressBar();
              this.userEventService.markCourseAsUpdated();
              this.isSubmitting.set(false);
              this.feedbackService.openFeedbackModal(
                {
                  type: 'success',
                  modalTitle: this.assignmentService.translate(
                    'content_management.submit_assignment_successfully.txt',
                  ),
                  primaryBtnStr: this.assignmentService.translate(
                    'content_management.view_assignment.btn',
                  ),
                  secondaryBtnStr:
                    this.assignmentService.translateGlobal('global.cancel.btn'),
                },
                () => {
                  // refetch assignment
                  this.assignmentService
                    .getAssignmentDetails(
                      +this.assignmentId,
                      this.student()?.id!,
                    )
                    .subscribe();
                  this.assignmentService
                    .getAssignmentQuestions(
                      +this.assignmentId,
                      this.student()?.id!,
                    )
                    .subscribe();
                },
                () => {
                  this.router.navigate(['../../../'], {
                    relativeTo: this.route,
                  });
                },
              );
            },
            error: () => {
              this.layoutService.hideProgressBar();
              this.isSubmitting.set(false);
              this.toastr.error(
                this.transloco.translate(
                  'content_management.submission_error.txt',
                ),
                this.transloco.translate('global.wrong_msg.title'),
              );
            },
          });
      },
      () => {},
    );
  }
}
