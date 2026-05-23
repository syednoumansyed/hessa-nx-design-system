import {
  Component,
  computed,
  effect,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { HesDateViewerComponent } from '@ui-kit/hes-date-viewer/hes-date-viewer.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { IAttachment } from '@shared/interfaces/attachment';
import { HesAttachmentPreviewComponent } from '../../../../ui-kit/hes-attachment-form-control/attachment-preview/attachment-preview.component';
import { HesAttachmentFormControlComponent } from '@ui-kit/hes-attachment-form-control/hes-attachment-form-control.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { isAfter, isBefore, isWithinInterval, parseISO } from 'date-fns';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { FeedbackService } from '@shared/services/feedback.service';
import { map, switchMap } from 'rxjs';
import { SubmissionStatusComponent } from '../../components/submission-status/submission-status.component';
import { LayoutService } from '@layout/layout.service';
import { LMSAssignmentService } from '@pages/course-management/data-access/lms/lms-assignment.service';
import { AssignmentType } from '../assigments/assignment-form/assignment-form.page';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { PageTitleService } from '@layout/page-title.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { UserType } from '@shared/enums';
import { AuthService } from '@auth/auth.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { UserEventService } from '@shared/services/user-event.service';

@Component({
  selector: 'app-assignment-details',
  templateUrl: './assignment-details.page.html',
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    HesDateViewerComponent,
    HesButtonModule,
    HesAttachmentPreviewComponent,
    HesAttachmentFormControlComponent,
    TranslocoDirective,
    RbacDirective,
    SubmissionStatusComponent,
  ],
  providers: [EnumLangPipe],
})
export class AssignmentDetailsPage implements OnInit {
  worksheetAnswerAttachment: FormControl;
  attachments = signal<IAttachmentControlValue[] | undefined>(undefined);
  protected readonly authService = inject(AuthService);
  private readonly assignmentService = inject(LMSAssignmentService);
  private enumLangPipe = inject(EnumLangPipe);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly feedbackService = inject(FeedbackService);
  private readonly layoutService = inject(LayoutService);
  private readonly layoutUiService = inject(LayoutUiControlService);
  private readonly userEventService = inject(UserEventService);
  private readonly toastr = inject(HesToasterService);
  protected readonly rbac = inject(RoleBaseAccessControlService);
  protected readonly UserType = UserType;
  readonly isGuardianUser = signal(
    this.authService?.user()?.type === UserType.GUARDIAN,
  );
  readonly isStudentUser = signal(
    this.authService?.user()?.type === UserType.STUDENT,
  );
  isSubmitting = signal(false);
  protected readonly viewDeliveredAssignmentPermissionId =
    RESOURCE_PERMISSION.COURSE_CONTENT.READ.VIEW_DELIVERED_ASSIGNMENT;
  protected readonly startAssignmentPermissionId =
    RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.START_ASSIGNMENT;
  protected readonly studentSubmissionStatus = StudentSubmissionStatus;

  assignmentDetails = this.assignmentService.assignmentDetails;

  assignmentDetailsGridData = computed(() => {
    const assignmentDetails = this.assignmentDetails()!;
    return [
      {
        title: this.transloco.translate('global.title.label'),
        value: assignmentDetails?.title,
      },
      {
        title: this.transloco.translate('global.status.title'),
        value: assignmentDetails?.submissionData.status ?? '',
        type: 'badge',
      },
      {
        title: this.transloco.translate(
          'content_management.publishing_date_time.title',
        ),
        value: assignmentDetails?.publishingDate,
        type: 'date',
      },
      {
        title: this.transloco.translate(
          'content_management.Assignment_type.label',
        ),
        value: this.enumLangPipe.transform(assignmentDetails?.type),
      },
      {
        title: this.transloco.translate(
          'content_management.due_date_time.label',
        ),
        value: assignmentDetails?.dueDate,
        type: 'date',
      },
      {},
      {
        title: this.transloco.translate('global.description.label'),
        value: assignmentDetails?.description,
        type: 'paragraph',
      },
    ];
  });

  isWorksheet = computed(() => {
    return this.assignmentDetails()?.type === AssignmentType.WORKSHEET;
  });

  worksheet = computed<IAttachment[] | undefined>(() => {
    return this.assignmentDetails()?.attachments;
  });

  isSubmitDisabled = computed<boolean>(() => {
    const currentDate = new Date();
    const dueDate = parseISO(this.assignmentDetails()?.dueDate ?? '');
    const publishingDate = this.assignmentDetails()?.publishingDate;
    const status = this.assignmentDetails()?.submissionData?.status;
    const isSubmitted = status === StudentSubmissionStatus.SUBMITTED;

    if (!publishingDate || !dueDate) return true;
    const isSubmissionOpen =
      isBefore(currentDate, dueDate) && isAfter(currentDate, publishingDate);

    if (this.assignmentDetails()?.type === AssignmentType.WORKSHEET) {
      return (
        !this.attachments()?.length ||
        !isSubmissionOpen ||
        this.isSubmitting() ||
        isSubmitted
      );
    }

    return (
      this.isSubmitting() ||
      (!(isSubmitted && this.assignmentDetails()?.isViewCorrectAnswer) &&
        !isSubmissionOpen) ||
      !this.isStudentUser()
    );
  });

  student = inject(StudentSelectionScopeService).selectedStudent;

  @Input() assignmentId: string;

  subjectTitle = inject(CourseListService)
    .mappedCoursesList()
    .find((c) => c.courseId === +this.route.snapshot.params['courseId'])?.title;
  pageTitleService = inject(PageTitleService);

  constructor(private breadcrumbService: BreadcrumbService) {
    effect(() => {
      const assignmentDetails = this.assignmentDetails();
      if (this.isWorksheet()) {
        this.worksheetAnswerAttachment = new FormControl(
          assignmentDetails?.worksheet.attachments,
          [Validators.required],
        );
      }
    });
  }
  ngOnInit() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
  }
  ionViewWillEnter() {
    this.layoutUiService.showWebBackBtn();
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
    this.refetchAssignmentDetails();
  }

  ionViewWillLeave() {
    this.layoutUiService.hideWebBackBtn();
  }

  onStartAssignment() {
    if (
      this.assignmentDetails()?.submissionData?.status ===
        StudentSubmissionStatus.SUBMITTED ||
      this.assignmentDetails()?.submissionData?.status ===
        StudentSubmissionStatus.IN_PROGRESS
    ) {
      this.router.navigate(['questions'], { relativeTo: this.route });
    } else {
      this.layoutService.showProgressBar();
      this.isSubmitting.set(true);

      this.assignmentService
        .startAssignment(+this.assignmentId, this.student()?.id!)
        .subscribe({
          next: (_res) => {
            this.userEventService.markCourseAsUpdated();
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
            this.router.navigate(['questions'], { relativeTo: this.route });
          },
          error: (_res) => {
            this.layoutService.hideProgressBar();
            this.isSubmitting.set(false);
            this.toastr.error(
              this.transloco.translate('global.wrong_msg.title'),
            );
          },
        });
    }
  }

  onAttachmentsChange(attachments: IAttachmentControlValue[]) {
    this.attachments.set(attachments);
  }

  submitWorksheetAssignment() {
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
        this.isSubmitting.set(true);
        this.layoutService.showProgressBar();
        this.assignmentService
          .uploadAttachments(this.attachments()!)
          .pipe(
            switchMap((uploadedFiles) => {
              return this.assignmentService.submitAssignment(
                +this.assignmentId,
                this.student()?.id!,
                uploadedFiles.map((i) => i.key),
              );
            }),
            map((res) => {
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
                  this.isSubmitting.set(true);
                  this.layoutService.showProgressBar();
                  this.assignmentService
                    .getAssignmentDetails(
                      +this.assignmentId,
                      this.student()?.id!,
                    )
                    .subscribe({
                      next: (_res) => {
                        this.layoutService.hideProgressBar();
                        this.isSubmitting.set(false);
                      },
                      error: (_res) => {
                        this.layoutService.hideProgressBar();
                        this.isSubmitting.set(false);
                      },
                    });
                },
                () => {
                  this.router.navigate(['../..'], {
                    relativeTo: this.route,
                  });
                },
              );
              return res;
            }),
          )
          .subscribe({
            next: (_res) => {
              this.layoutService.hideProgressBar();
              this.isSubmitting.set(false);
            },
            error: (_res) => {
              this.layoutService.hideProgressBar();
              this.isSubmitting.set(false);
            },
          });
      },
      () => {},
    );
  }

  refetchAssignmentDetails() {
    this.assignmentService
      .getAssignmentDetails(this.assignmentDetails()?.id!, this.student()?.id!)
      .subscribe();
  }
}
