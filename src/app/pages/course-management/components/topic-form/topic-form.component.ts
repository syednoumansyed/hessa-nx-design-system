import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  Optional,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ModalController,
  AnimationController,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '../../../../shared/components/form-control-generator/form-control-generator.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  faPlus,
  faEllipsisVertical,
  faTrashCan,
} from '@fortawesome/pro-regular-svg-icons';
import { openAddAttachmentDialog } from '@pages/course-management/components/add-attachment-dialog/add-attachment-dialog';
import {
  TopicContent,
  TopicItemComponent,
} from '@pages/course-management/components/topic-item/topic-item.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import type { Animation } from '@ionic/angular';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { LayoutService } from '@layout/layout.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesActionSheetComponent } from '../../../../ui-kit/hes-action-sheet/hes-action-sheet.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { CMSCourseContentService } from '@pages/course-management/data-access/cms/cms-course-content.service';
import {
  CourseTopicDTO,
  CourseTopicPayload,
} from '@pages/course-management/data-access/course-content.dto';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  ExamStyle,
  StudentSubmissionStatus,
} from '@pages/course-management/data-access/lms-exam.dto';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { AssignmentStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { AssignmentType } from '@pages/course-management/data-access/cms/cms-assignment.dto';
import { getAttachmentCategory } from '@shared/utils/get-attachmentType.util';
import { distinctUntilChanged, startWith } from 'rxjs';
import { isWithinInterval, parseISO } from 'date-fns';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { HesSubscription } from '@utils/hes-subscription.util';
import { UserEventService } from '@shared/services/user-event.service';
import { formatToHesDate } from '@shared/utils/date';

export type TopicFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  semester: FormControl<number | null>;
  weekId: FormControl<number | null>;

  videos: FormControl<Array<{
    isNew?: boolean;
    title: string;
    publishingDate?: string | null;
    attachment: IAttachmentControlUploadedValue;
  }> | null>;
  attachments: FormControl<Array<{
    isNew?: any;
    title: string;
    publishingDate?: string | null;
    attachment: IAttachmentControlUploadedValue;
  }> | null>;
  assignments: FormControl<Array<{
    title: string;
    assignmentId: number;
    progress: number;
    status: AssignmentStatus | StudentSubmissionStatus;
    publishingDate?: string | null;
    assignmentType: AssignmentType;
  }> | null>;
  exams: FormControl<Array<{
    title: string;
    examId: number;
    progress: number;
    isOffline: boolean;
    publishingDate?: string | null;
    status: StudentSubmissionStatus;
  }> | null>;
}>;

export type TopicFormValue = {
  title: string;
  description: string;
  semester: number | null;
  videos: Array<{
    title: string;
    attachment: IAttachmentControlValue;
  }> | null;
  attachments: Array<{
    title: string;
    attachment: IAttachmentControlValue;
  }> | null;
  assignments: Array<{
    title: string;
    assignmentId: number;
    progress: number;
    assignmentType: AssignmentType;
  }> | null;
  exams: Array<{
    title: string;
    examId: number;
    progress: number;
    isOffline: boolean;
    status?: AssignmentStatus | StudentSubmissionStatus;
  }> | null;
};

@Component({
  selector: 'app-topic-form',
  templateUrl: './topic-form.component.html',
  styleUrls: ['./topic-form.component.scss'],
  standalone: true,
  imports: [
    HesButtonModule,
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    FormControlGeneratorComponent,
    TopicItemComponent,
    HesActionSheetComponent,
    RbacDirective,
    IonIcon,
  ],
})
export class TopicFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('topicDetails', { read: ElementRef }) topicDetailsRef: ElementRef;

  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasterService = inject(HesToasterService);
  private readonly layout = inject(LayoutService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly courseListService = inject(CourseListService);
  private readonly cmsAssignmentService = inject(CMSAssignmentsService);
  private readonly userEventService = inject(UserEventService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );

  private readonly weeks = signal<ISelectValue[]>([]);
  private readonly subscription = new HesSubscription();
  isMobile = this.layout.isMobileOrTablet;

  addVideoPermissionId = RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.VIDEO;
  addAttachmentPermissionId =
    RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.ATTACHMENT;

  assignmentAddPermission =
    RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.ASSIGNMENT;
  isLMS = input(false);

  topic = input<CourseTopicDTO>();
  isNew = computed(() => {
    // if video, attachment, assignment or exam anything has any new item
    const video =
      (this.videosContent()?.length ?? 0) -
      (this.topic()?.viewedVideoCount ?? 0);
    const attachment =
      (this.attachmentsContent()?.length ?? 0) -
      (this.topic()?.viewedAttachmentCount ?? 0);
    const assignment =
      (this.assignmentsContent()?.length ?? 0) -
      (this.topic()?.viewedAssignmentCount ?? 0);
    const exam =
      (this.examsContent()?.length ?? 0) - (this.topic()?.viewedExamCount ?? 0);
    return video || attachment || assignment || exam;
  });

  onTopicUpdate = output<boolean>();
  onRemoved = output<number>();

  onExpanded = output<boolean>();

  private expandingAnimation: Animation;
  topicForm: TopicFormGroup;

  faPlus = faPlus;
  faEllipsisVertical = faEllipsisVertical;

  isExpanded = model(false);
  selectedAcademicYearSemesters = computed(() => {
    if (this.isSemesterEditable()) {
      const year = this.academicYearScopeService.currentOrNearestAcademicYear();
      let semesters = year?.semesters ?? [];
      semesters = semesters.filter((semester) => {
        const today = new Date();
        return parseISO(semester.endDate) >= today;
      });
      return semesters;
    } else {
      const academicYear =
        this.academicYearScopeService.findAcademicYearBySemesterId(
          this.topic()?.semesterId ?? 0,
        );
      return academicYear?.semesters ?? [];
    }
  });

  isTitleEditable = signal(false);
  isSemesterEditable = signal(false);
  isDescriptionEditable = signal(false);
  contentEdited = signal(false);

  showFormButtons = computed(() => {
    return (
      (this.isTitleEditable() ||
        this.isSemesterEditable() ||
        this.isDescriptionEditable() ||
        this.contentEdited() ||
        !this.topic()) &&
      !this.isLMS() &&
      this.rbac.hasPermission(RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.TOPIC)
    );
  });

  topicFormConfig = computed<IControl[]>(() => {
    if (!this.isLMS())
      return [
        {
          label: this.transloco.translate('global.title.label'),
          placeholder: this.transloco.translate(
            'content_management.enter_topic_name.placeholder',
          ),
          type: 'input',
          formControlName: 'title',
          required: true,
          isEditableControl:
            !!this.topic() &&
            !this.isLMS() &&
            this.rbac.hasPermission(
              RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.TOPIC,
            ),
          isEditable: this.isTitleEditable,
          errorMessage: {
            maxlength: this.transloco.translate(
              'global.validation.max_length',
              {
                chars: 250,
                label: this.transloco
                  .translate('global.title.label')
                  .toLocaleLowerCase(),
              },
            ),
          },
        },
        {
          label: this.transloco.translate('global.semester.title'),
          placeholder: this.transloco.translate(
            'global.select_semester.placeholder',
          ),
          type: 'searchable-select',
          formControlName: 'semester',
          selectValues: this.selectedAcademicYearSemesters()?.map(
            (semester) => {
              return {
                value: semester.id,
                displayedValue: semester.name,
              };
            },
          ) as ISelectValue[],
          required: true,
          isEditableControl:
            !!this.topic() &&
            !this.isLMS() &&
            this.rbac.hasPermission(
              RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.TOPIC,
            ),
          isEditable: this.isSemesterEditable,
        },
        {
          label: this.transloco.translate('week.txt'),
          placeholder: this.transloco.translate('week.placeholder'),
          type: 'searchable-select',
          formControlName: 'weekId',
          selectValues: this.weeks() as ISelectValue[],
          required: true,
          isEditableControl:
            !!this.topic() &&
            !this.isLMS() &&
            this.rbac.hasPermission(
              RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.TOPIC,
            ),
          isEditable: this.isSemesterEditable,
        },
        {
          label: this.transloco.translate('global.description.label'),
          placeholder: this.transloco.translate(
            'global.enter_description.placeholder',
          ),
          type: 'editor',
          formControlName: 'description',
          required: true,
          isEditableControl:
            !!this.topic() &&
            !this.isLMS() &&
            this.rbac.hasPermission(
              RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.TOPIC,
            ),
          isEditable: this.isDescriptionEditable,
          editorConfig: {
            allowImgUpload: true,
            preview: false,
            allowYoutubeExtension: true,
            uploadAsNonBinary: true,
          },
          maxLength: 4000,
          uploadImageUrl: '/courses/cms/topics/file/upload/public',
        },
      ];
    else
      return [
        {
          label: this.transloco.translate('global.description.label'),
          placeholder: this.transloco.translate(
            'global.enter_description.placeholder',
          ),
          type: 'editor',
          formControlName: 'description',
          required: true,
          isEditableControl: !!this.topic() && !this.isLMS(),
          isEditable: this.isDescriptionEditable,
          editorConfig: {
            allowImgUpload: true,
            previewOnly: true,
          },
        },
      ];
  });

  TopicActions: IAction[] = [
    {
      iconProps: { icon: faTrashCan, flip: 'horizontal' },
      text: this.transloco.translate('global.delete.btn'),
      onClick: (_data) => {
        this.feedbackService.openFeedbackModal(
          {
            type: 'error',
            modalTitle: this.transloco.translate(
              'content_management.topic_delete_msg.title',
            ),
            modalMessage: this.transloco.translate(
              'content_management.topic_delete_msg.txt',
            ),
            primaryBtnStr: this.transloco.translate('global.delete.btn'),
            secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
          },
          () => {
            this.isLoading.set(true);
            this.layout.showProgressBar();
            this.courseContentService
              .deleteCourseTopic(this.topic()!.id)
              .subscribe({
                next: () => {
                  this.isLoading.set(false);
                  this.layout.hideProgressBar();
                  this.toasterService.success(
                    this.transloco.translate(
                      'content_management.topic_delete_successfully.txt',
                    ),
                    '',
                  );
                  this.onRemoved.emit(this.topic()!.id);
                },
                error: () => {
                  this.isLoading.set(false);
                  this.layout.hideProgressBar();
                  this.toasterService.error(
                    this.transloco.translate('global.wrong_msg.title'),
                    this.transloco.translate('global.adding_error.txt'),
                  );
                },
              });
          },
        );
      },
      hasPermission: () => {
        if (!this.isLMS()) {
          return this.rbac.hasPermission(
            RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.TOPIC,
          );
        } else return false;
      },
    },
  ];

  displayedWeek = computed(() => {
    const week = this.topic()?.week;
    if (week) {
      return `${this.translate('week.txt')} ${week.weekNumber} (${formatToHesDate(week.startDate)} - ${formatToHesDate(week.endDate)})`;
    }
    return '';
  });

  selectedSemesterId = signal<string | null>(
    this.academicYearScopeService.selectedSemester()?.id ?? null,
  );

  isLoading = signal(false);

  // content already added to topic + to be added/uploaded
  attachmentsContent = signal<TopicContent[] | null>(null);
  videosContent = signal<TopicContent[] | null>(null);
  examsContent = signal<TopicContent[] | null>(null);
  assignmentsContent = signal<TopicContent[] | null>(null);

  constructor(
    private animationCtrl: AnimationController,
    @Optional() private courseContentService: CMSCourseContentService,
  ) {
    toObservable(this.topic)
      .pipe(takeUntilDestroyed())
      .subscribe((topic) => {
        if (this.topicForm) {
          this.topicForm.patchValue({
            title: topic?.title ?? '',
            description: topic?.description ?? '',
            semester:
              topic?.semesterId ??
              Number(this.selectedAcademicYearSemesters()?.[0]?.id),
            videos: topic ? this.getTopicVideos(topic) : null,
            assignments: topic ? this.getTopicAssignments(topic) : null,
            attachments: topic ? this.getTopicAttachments(topic) : null,
            exams: topic ? this.getTopicExams(topic) : null,
          });
        }
      });
  }

  ngOnInit() {
    if (!this.topic()) {
      this.isSemesterEditable.set(true);
      this.isExpanded.set(true);
    }
    this.topicForm = this.createTopicFormGroup(this.topic());
    this.topicForm.controls.semester.valueChanges
      .pipe(
        startWith(this.topicForm.controls.semester.value),
        distinctUntilChanged(),
      )
      .subscribe((semesterId) => {
        this.selectedSemesterId.set(semesterId?.toString() ?? null);
        this.fetchWeeks();
      });

    this.topicForm.controls.attachments.valueChanges.subscribe((v) => {
      this.attachmentsContent.set(
        v?.map((v) => {
          return {
            type: 'Attachment',
            name: v.title,
            isNew: v.isNew,
            id: +(v.attachment as IAttachmentControlUploadedValue).id!,
            topicId: this.topic()?.id,
            attachment: v.attachment,
            publishingDate: v?.attachment?.publishingDate ?? null,
            isPublished: !!(v.attachment as IAttachmentControlUploadedValue)
              .publishingDate,
          };
        }) ?? null,
      );
    });
    this.topicForm.controls.videos.valueChanges.subscribe((v) => {
      this.videosContent.set(
        v?.map((v) => {
          return {
            type: 'video',
            name: v.title,
            isNew: v.isNew,
            id: +(v.attachment as IAttachmentControlUploadedValue).id!,
            attachment: v.attachment,
            topicId: this.topic()?.id,
            publishingDate: v.attachment?.publishingDate ?? null,
            isPublished: !!(v.attachment as IAttachmentControlUploadedValue)
              .publishingDate,
          };
        }) ?? null,
      );
    });
    this.topicForm.controls.exams.valueChanges.subscribe((v) => {
      this.examsContent.set(
        v?.map((v) => {
          return {
            type: 'exam',
            name: v.title,
            isOfflineExam: v.isOffline,
            submissionPercentage: v.progress,
            id: v.examId,
            status: v.status,
            publishingDate: v?.publishingDate ?? null,
            isPublished: !!v.publishingDate,
            topicId: this.topic()?.id,
          };
        }) ?? null,
      );
    });
    this.topicForm.controls.assignments.valueChanges.subscribe((v) => {
      this.assignmentsContent.set(
        v?.map((v) => {
          return {
            topicId: this.topic()?.id,
            type: 'assignment',
            name: v.title,
            submissionPercentage: v.progress,
            id: v.assignmentId,
            publishingDate: v?.publishingDate ?? null,
            isPublished: !!v.publishingDate,
            status: v.status,
            assignmentType: v.assignmentType,
          };
        }) ?? null,
      );
    });
  }

  ngAfterViewInit() {
    if (this.topic()) this.createExpandingAnimation();
    this.subscription.add = this.userEventService.courseUpdated$.subscribe(
      () => {
        this.refreshTopicDetails();
      },
    );
  }

  private createExpandingAnimation() {
    this.expandingAnimation = this.animationCtrl
      .create()
      .addElement(this.topicDetailsRef.nativeElement)
      .duration(200)
      .iterations(1)
      .fromTo('opacity', '0', '1')
      .fromTo('display', 'hidden', 'flex')
      .fromTo('transform', 'translateY(-1000px)', 'translateY(0px)');
  }

  updateTopic(topicId: number, successMessage?: string, errMsg?: string) {
    const topic = this.topicForm.value;
    this.isLoading.set(true);
    this.layout.showProgressBar();
    const formVal = topic;
    const payload: CourseTopicPayload = {
      semesterId: formVal.semester!,
      description: formVal.description!,
      title: formVal.title!,
      courseId: this.route.snapshot.params['courseId'],
      weekId: formVal.weekId!,
    };
    this.courseContentService.updateCourseTopic(topicId, payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.layout.hideProgressBar();
        this.toasterService.success(
          successMessage ??
            this.transloco.translate(
              'content_management.topic_updated_successfully.txt',
            ),
          '',
        );
        this.isDescriptionEditable.set(false);
        this.isSemesterEditable.set(false);
        this.isTitleEditable.set(false);
        this.topicForm.markAsUntouched();
        this.refreshTopicDetails();
        this.contentEdited.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.layout.hideProgressBar();
        this.toasterService.error(
          this.transloco.translate('global.wrong_msg.title'),
          errMsg ?? this.transloco.translate('global.adding_error.txt'),
        );
      },
    });
  }

  createTopic() {
    this.isLoading.set(true);
    this.layout.showProgressBar();

    const formVal = this.topicForm.value;
    const payload: CourseTopicPayload = {
      semesterId: formVal.semester!,
      description: formVal.description!,
      title: formVal.title!,
      courseId: this.route.snapshot.params['courseId'],
      weekId: formVal.weekId!,
    };
    return this.courseContentService.addCourseTopic(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.layout.hideProgressBar();
        this.toasterService.success(
          this.transloco.translate(
            'content_management.topic_added_successfully.txt',
          ),
          '',
        );
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {
        this.isLoading.set(false);
        this.layout.hideProgressBar();
        this.toasterService.error(
          this.transloco.translate('global.wrong_msg.title'),
          this.transloco.translate('global.adding_error.txt'),
        );
      },
    });
  }

  async openAddAttachmentDialog() {
    const attachmentModal = await openAddAttachmentDialog({
      modalCtrl: this.modalCtrl,
      isVideo: false,
      topic: this.topic()!,
    });

    const { data, role } = await attachmentModal.onWillDismiss();

    if (role === 'confirm') {
      this.refreshTopicDetails();
    }
  }

  async openAddVideoDialog() {
    const attachmentModal = await openAddAttachmentDialog({
      modalCtrl: this.modalCtrl,
      isVideo: true,
      topic: this.topic()!,
    });

    const { data, role } = await attachmentModal.onWillDismiss();

    if (role === 'confirm') {
      this.refreshTopicDetails();
    }
  }

  removeAttachment(index: number) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.transloco.translate(
          'content_management.delete_attachment.txt',
        ),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () => {
        const attachments = [
          ...(this.topicForm.controls.attachments.value ?? []),
        ];
        const id = attachments[index]?.attachment?.id;
        if (id) {
          this.courseContentService.deleteAttachment(id).subscribe({
            next: () => {
              attachments.splice(index, 1);
              this.topicForm.controls.attachments.setValue(attachments);
              this.updateTopic(this.topic()?.id!);
              this.toasterService.success(
                this.transloco.translate(
                  'content_management.delete_attachment_successfully.txt',
                ),
              );
            },
            error: (error) => {
              this.toasterService.showBackendError(error);
            },
          });
        }
      },
    );
  }

  removeVideo(index: number) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.transloco.translate(
          'content_management.delete_video.txt',
        ),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () => {
        const videos = [...(this.topicForm.controls.videos.value ?? [])];
        const id = videos[index]?.attachment?.id;
        const message = this.transloco.translate(
          'content_management.delete_video_successfully.txt',
        );
        const errMsg = this.transloco.translate('global.delete_wrong_msg.txt');
        if (id) {
          this.courseContentService.deleteAttachment(id).subscribe({
            next: () => {
              videos.splice(index, 1);
              this.contentEdited.set(true);
              this.topicForm.controls.videos.setValue(videos);
              this.updateTopic(this.topic()?.id!);
              this.toasterService.success(message);
            },
            error: (error) => {
              const errMsg = this.transloco.translate(
                'global.delete_wrong_msg.txt',
              );
              this.toasterService.error(errMsg);
            },
          });
        }
      },
    );
  }

  toggleIsExpanded() {
    if (this.isMobile() && !this.isLMS()) {
      this.onExpanded.emit(true);
      return null;
    } else {
      this.isExpanded.update((v) => !v);
      this.onExpanded.emit(this.isExpanded());
      if (this.isExpanded()) {
        return this.expandingAnimation.direction('normal').play();
      }
      return this.expandingAnimation.direction('reverse').play();
    }
  }

  refreshTopicDetails() {
    this.onTopicUpdate.emit(true);
    this.courseListService.populateCourses({}, true)?.subscribe();
  }

  onAddAssignment() {
    if (this.isMobile())
      this.router.navigate(['assignments', 'add'], {
        relativeTo: this.route,
      });
    else
      this.router.navigate([this.topic()?.id, 'assignments', 'add'], {
        relativeTo: this.route,
      });
  }

  private createTopicFormGroup(topic?: CourseTopicDTO): TopicFormGroup {
    return this.fb.group({
      title: this.fb.nonNullable.control(topic?.title ?? '', [
        Validators.required,
        Validators.maxLength(250),
      ]),
      description: this.fb.nonNullable.control(topic?.description ?? '', [
        Validators.required,
        Validators.maxLength(4000),
      ]),
      semester: this.fb.control<number | null>(
        topic?.semesterId ??
          Number(this.selectedAcademicYearSemesters()?.[0]?.id) ??
          null,
        [Validators.required],
      ),
      weekId: this.fb.control<number | null>(topic?.weekId ?? null, [
        Validators.required,
      ]),
      attachments: this.fb.control<Array<{
        title: string;
        isNew?: boolean;
        attachment: IAttachmentControlUploadedValue;
      }> | null>(topic ? this.getTopicAttachments(topic) : null),
      videos: this.fb.control<Array<{
        title: string;
        isNew?: boolean;
        attachment: IAttachmentControlUploadedValue;
      }> | null>(topic ? this.getTopicVideos(topic) : null),
      assignments: this.fb.control<Array<{
        title: string;
        assignmentId: number;
        progress: number;
        status: AssignmentStatus | StudentSubmissionStatus;
        assignmentType: AssignmentType;
      }> | null>(topic ? this.getTopicAssignments(topic) : null),
      exams: this.fb.control<Array<{
        title: string;
        examId: number;
        progress: number;
        isOffline: boolean;
        status: StudentSubmissionStatus;
      }> | null>(topic ? this.getTopicExams(topic) : null),
    });
  }

  private getTopicAttachments(topic: CourseTopicDTO) {
    const allowedCategories = new Set(['image', 'pdf', 'ppt']);
    return (
      topic.attachments
        ?.filter((item) => {
          const category = getAttachmentCategory(item);
          return category === null ? false : allowedCategories.has(category);
        })
        .map((item) => ({
          title: item.name,
          attachment: item,
          isNew: item?.viewStatus === 'NEW',
        })) ?? []
    );
  }

  private getTopicVideos(topic: CourseTopicDTO) {
    return (
      topic.attachments?.filter((i) => getAttachmentCategory(i) === 'video') ??
      []
    ).map((item) => {
      return {
        title: item.name,
        isNew: item?.viewStatus === 'NEW',
        attachment: item,
      };
    });
  }

  private getTopicAssignments(topic: CourseTopicDTO) {
    return topic.assignments?.map((item) => {
      return {
        title: item.title,
        assignmentId: item.id,
        progress: item.submissionPercentage,
        publishingDate: item.publishingDate,
        status: item.submissionData ? item.submissionData.status : item.status,
        assignmentType: item.type,
      };
    });
  }

  private getTopicExams(topic: CourseTopicDTO) {
    return topic.exams?.map((item) => {
      return {
        title: item.title,
        examId: item.id,
        progress: item.submissionPercentage,
        isOffline: item.style === ExamStyle.OFFLINE,
        publishingDate: item.publishingDate,
        status: item.submissionData
          ? item.submissionData?.status
          : StudentSubmissionStatus.PENDING,
      };
    });
  }

  onSave() {
    this.topic() ? this.updateTopic(this.topic()!.id) : this.createTopic();
  }

  onCancel() {
    const controls = this.topicForm.controls;
    const formVal: { [key: string]: any } = this.topicForm.value;
    let hasValue = false;

    for (const key in controls) {
      if (formVal[key]) {
        hasValue = true;
        break;
      }
    }

    if (hasValue) {
      this.feedbackService.openFeedbackModal(
        {
          type: 'error',
          modalTitle: this.transloco.translate(
            'content_management.sure_want_to_cancel.title',
            {},
          ),
          modalMessage: this.transloco.translate(
            'content_management.content_discarded.txt',
            {},
          ),
          primaryBtnStr: this.transloco.translate(
            'content_management.discard.btn',
            {},
          ),
          secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
        },
        () => {
          this.cancelAddUpdateTopic();
        },
        () => {},
      );
    } else {
      this.cancelAddUpdateTopic();
    }
  }

  private cancelAddUpdateTopic() {
    this.isDescriptionEditable.set(false);
    this.isSemesterEditable.set(false);
    this.isTitleEditable.set(false);
    this.contentEdited.set(false);

    const topic = this.topic();
    if (topic) {
      this.topicForm.patchValue({
        title: topic.title,
        description: topic.description,
        semester: topic.semesterId,
        weekId: topic.weekId,
        videos: this.getTopicVideos(topic),
        attachments: this.getTopicAttachments(topic),
        assignments: this.getTopicAssignments(topic),
        exams: this.getTopicExams(topic),
      });
      this.topicForm.markAsUntouched();
    } else {
      this.topicForm.reset();
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  translate(key: string, params: Object = {}): string {
    return this.transloco.translate(key, params);
  }

  onAddExam() {
    if (this.isMobile())
      this.router.navigate(['exams', 'add'], {
        relativeTo: this.route,
      });
    else
      this.router.navigate([this.topic()?.id, 'exams', 'add'], {
        relativeTo: this.route,
      });
  }

  removeAssignment(tc: TopicContent) {
    const hasDeleteAssignmentWithSubmissionPermission = this.rbac.hasPermission(
      RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.ASSIGNMENT_WITH_SUBMISSION,
    );
    const hasDeleteAssignmentPermission = this.rbac.hasPermission(
      RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.ASSIGNMENT,
    );
    const confirmationMessage =
      tc.submissionPercentage != 0 &&
      hasDeleteAssignmentWithSubmissionPermission
        ? 'content_management.delete_assignment_submission.txt'
        : 'content_management.delete_assignment.txt';
    if (
      !hasDeleteAssignmentPermission &&
      !hasDeleteAssignmentWithSubmissionPermission
    ) {
      return;
    }
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate(confirmationMessage),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () => {
        this.showDeleteConfirmationDialog(
          tc.id!,
          hasDeleteAssignmentWithSubmissionPermission,
        );
      },
    );
  }

  showDeleteConfirmationDialog(id: number, withSubmission: boolean) {
    this.cmsAssignmentService.deleteAssignment(id, withSubmission).subscribe({
      next: () => {
        this.refreshTopicDetails();
        this.toasterService.success(
          this.translate(
            'content_management.delete_assignment_successfully.txt',
          ),
        );
      },
      error: (error) => {
        this.toasterService.showBackendError(error);
      },
    });
  }

  fetchWeeks() {
    if (!this.selectedSemesterId()) {
      this.weeks.set([]);
      return;
    }
    this.courseContentService
      .getWeeksListForDropdown({
        topicId: this.topic()?.id!,
        courseId: this.route.snapshot.params['courseId'],
        semesterId: this.selectedSemesterId()!,
      })
      .subscribe({
        next: (weeks) => {
          this.weeks.set(weeks);
        },
        error: (error) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
