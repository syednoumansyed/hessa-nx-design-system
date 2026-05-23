import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { QuestionWrapperComponent } from '../../../components/question-wrapper/question-wrapper.component';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { IonButton } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { QuestionsManagerService } from '../../../components/question-wrapper/data-access/questions-manager.service';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Idropdown } from '@shared/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CMSAssignmentsService } from '../../../data-access/cms/cms-assignments.service';

import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, switchMap } from 'rxjs';
import {
  CMSAssignmentDTO,
  CMSAssignmentPayload,
} from '../../../data-access/cms/cms-assignment.dto';
import { formatDateToUnixWithTime } from '@shared/utils/date';
import { HesAttachmentPreviewComponent } from '@ui-kit/hes-attachment-form-control/attachment-preview/attachment-preview.component';
import { QuestionFormService } from '@pages/course-management/components/question-wrapper/data-access/question-form.service';

export enum AssignmentType {
  QUESTION = 'QUESTION',
  WORKSHEET = 'WORKSHEET',
}

@Component({
  selector: 'appp-assignment-form',
  templateUrl: './assignment-form.page.html',
  standalone: true,
  imports: [
    IonButton,
    CommonModule,
    FormsModule,
    QuestionWrapperComponent,
    HesButtonModule,
    ReactiveFormsModule,
    FormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesAttachmentPreviewComponent,
  ],
  providers: [QuestionsManagerService, QuestionFormService],
})
export class AssignmentFormPage implements OnInit {
  private readonly layoutUiControlService = inject(LayoutUiControlService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly assignmentsService = inject(CMSAssignmentsService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toasterService = inject(HesToasterService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly locationService = inject(Location);

  readonly topicId = input<number>();
  readonly assignmentId = input<number>();

  readonly isWorksheet = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly assignmentForm = this.fb.group({
    title: this.fb.control('', [
      Validators.required,
      Validators.maxLength(150),
    ]),
    assignmentType: this.fb.control<AssignmentType>(
      AssignmentType.QUESTION,
      Validators.required,
    ),
    dueDate: this.fb.control<Date | string | null>(null, Validators.required),
    description: this.fb.control<string>('', [
      Validators.required,
      Validators.maxLength(4000),
    ]),

    isViewCorrectAnswer: this.fb.control<string>('true'),
    attachments: this.fb.control<Array<IAttachmentControlValue>>([]),
  });

  readonly isQuestionListShow$ =
    this.assignmentForm.controls.assignmentType.valueChanges.pipe(
      map((value) => value === AssignmentType.QUESTION),
    );
  readonly isEditBtnClick = signal<boolean>(false);

  readonly isReadonlyInput = computed<boolean>(() => {
    const isEditBtnClick = this.isEditBtnClick();
    if (this.assignmentId()) {
      return !isEditBtnClick;
    }
    return false;
  });

  isPublish = signal<boolean>(false);
  readonly assignmentFormConfig = computed<IControl[]>(() => {
    const isWorksheet = this.isWorksheet();
    const content: IControl = isWorksheet
      ? {
          type: 'file',
          label: this.translocoService.translate('global.attachments.label'),
          formControlName: 'attachments',
          placeholder: this.translocoService.translate(
            'global.file_attachments.placeholder',
          ),
          required: false,
          isMultiple: true,
          acceptFileTypes: ['FILES'],
          maxSizeInMB: 1024,
          readonly: this.isPublish(),
        }
      : {
          label: this.translate(
            'content_management.view_correct_answers.label',
          ),
          placeholder: 'No',
          formControlName: 'isViewCorrectAnswer',
          readonly: this.isPublish(),
          type: 'searchable-select',
          required: false,
          selectValues: <Idropdown[]>[
            {
              value: 'true',
              displayedValue: this.translocoService.translate('global.yes.btn'),
            },
            {
              value: 'false',
              displayedValue: this.translocoService.translate('global.no.btn'),
            },
          ],
        };

    return [
      {
        label: this.translocoService.translate('global.title_req.label'),
        placeholder: this.translate(
          'content_management.enter_assignment_title.placeholder',
        ),
        formControlName: 'title',
        required: true,
        type: 'input',
        inputType: 'text',
        readonly: this.isPublish(),
        errorMessage: {
          maxlength: this.translocoService.translate(
            'global.validation.max_length',
            {
              chars: 250,
              label: this.translocoService
                .translate('global.title_req.label')
                .toLocaleLowerCase(),
            },
          ),
        },
      },
      {
        label: this.translate('content_management.Assignment_type.label'),
        placeholder: '',
        formControlName: 'assignmentType',
        type: 'searchable-select',
        required: false,

        selectValues: <Idropdown[]>[
          {
            value: AssignmentType.QUESTION,
            displayedValue: this.translate(
              'content_management.questions.label',
            ),
          },
          {
            value: AssignmentType.WORKSHEET,
            displayedValue: this.translate('enum.WORKSHEET'),
          },
        ],
        readonly: this.isPublish(),
      },
      {
        label: this.translate('content_management.due_date_time.label'),
        placeholder: this.translocoService.translate(
          'global.select_due_date.placeholder',
        ),
        type: 'date-time',
        formControlName: 'dueDate',
        required: true,
      },
      {
        label: this.translocoService.translate('global.description.label'),
        type: 'textarea',
        formControlName: 'description',
        required: true,
        placeholder: this.translocoService.translate(
          'global.enter_description.placeholder',
        ),
        errorMessage: {
          maxlength: this.translocoService.translate(
            'global.validation.max_length',
            {
              chars: 4000,
              label: this.translocoService
                .translate('global.description.label')
                .toLocaleLowerCase(),
            },
          ),
        },
      },
      content,
    ];
  });
  constructor() {
    this.assignmentForm.controls.assignmentType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.isWorksheet.set(value === AssignmentType.WORKSHEET);
      });
  }

  async ionViewWillEnter() {
    const assignmentId = this.assignmentId();
    if (assignmentId) {
      this.setQuestionParent(assignmentId);
      this.fetchAssignment(assignmentId);
    } else {
      // To make sure there is no old data in service
      this.questionManagerService.setQuestions([]);
    }
    this.questionManagerService.selectParent();
    this.layoutUiControlService.hideBreadcrumb();
    this.layoutUiControlService.showWebBackBtn();
  }

  ionViewWillLeave() {
    this.layoutUiControlService.showBreadcrumb();
    this.questionManagerService.setQuestions([]);
    this.layoutUiControlService.hideWebBackBtn();
  }

  ngOnInit() {
    if (this.assignmentId()) {
      this.questionManagerService.reFetchParent$.subscribe(() => {
        this.fetchAssignment(this.assignmentId()!);
      });
    }
  }

  onCancel() {
    if (this.assignmentId()) {
      this.isEditBtnClick.set(false);
    } else {
      this.locationService.back();
    }
  }

  onSave() {
    this.loading.set(true);
    const attchments = this.isQuestionType()
      ? []
      : (this.assignmentForm.value.attachments ?? []);

    this.assignmentsService
      .uploadFile(attchments)
      .pipe(
        switchMap((attchmentsResp) => {
          this.assignmentForm.controls.attachments.setValue(attchmentsResp);
          const assignment = {
            ...this.getAssignmentPayload(),
            ...(attchmentsResp?.length && {
              attachments: attchmentsResp.map((i) => ({
                path: i.key,
                name: i.extension,
              })),
            }),
          };
          if (assignment.assignmentType === 'QUESTION') {
            delete assignment.attachments;
          }
          let savedApi$ = this.assignmentsService.createAssignment(assignment);
          if (this.assignmentId()) {
            savedApi$ = this.assignmentsService.updateAssignment(
              this.assignmentId()!,
              assignment,
            );
          }
          return savedApi$;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ id }) => {
          let toastMesg = this.translate(
            'content_management.assignment_added_successfully.txt',
          );
          if (this.assignmentId()) {
            toastMesg = this.translate(
              'content_management.assignment_updated_successfully.txt',
            );
          }
          this.toasterService.success(toastMesg);
          if (this.assignmentId()) {
            this.isEditBtnClick.set(false);
          } else {
            this.navigateToAssignment(id);
          }
        },
        error: (error) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  onEdit() {
    this.isEditBtnClick.set(true);
  }

  private navigateToAssignment(assigmentId: string) {
    this.router.navigate(['..', assigmentId], {
      relativeTo: this.activatedRoute,
      replaceUrl: true,
    });
  }

  private getAssignmentPayload(): CMSAssignmentPayload {
    const { attachments, ...restValue } = this.assignmentForm.value;
    return {
      ...restValue,
      dueDate: formatDateToUnixWithTime(
        (restValue.dueDate! as Date).toISOString(),
      ),
      topicId: +this.topicId()!,
      ...(restValue.assignmentType === AssignmentType.WORKSHEET && {
        attachments,
      }),
      isViewCorrectAnswer: restValue.isViewCorrectAnswer === 'true',
    } as unknown as CMSAssignmentPayload;
  }

  private translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }

  private setAssigmentForm(value: CMSAssignmentDTO) {
    this.assignmentForm.patchValue({
      title: value.title,
      assignmentType: value.type as AssignmentType,
      dueDate: value.dueDate ? new Date(value.dueDate) : null,
      description: value.description,
      isViewCorrectAnswer: value.isViewCorrectAnswer ? 'true' : 'false',
      attachments:
        value.type === AssignmentType.QUESTION ? [] : (value.attachments ?? []),
    });
  }

  private setQuestionParent(id: number) {
    this.questionManagerService.setParentId({
      assignmentId: id,
    });
  }

  private fetchAssignment(assignmentId: number) {
    this.assignmentsService
      .getAssignment(assignmentId)
      .subscribe((assigmentResp) => {
        const { questions } = assigmentResp;
        this.questionManagerService.setQuestions(
          Array.isArray(questions) ? questions : [],
        );
        this.setAssigmentForm(assigmentResp);
        this.isPublish.set(!!assigmentResp.publishingDate);
        this.questionManagerService.setPublish(this.isPublish());
      });
  }

  private isQuestionType() {
    return this.assignmentForm.value.assignmentType === AssignmentType.QUESTION;
  }
}
