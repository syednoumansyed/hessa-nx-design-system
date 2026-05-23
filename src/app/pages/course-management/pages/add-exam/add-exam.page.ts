import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { IonButton } from '@ionic/angular/standalone';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { QuestionsManagerService } from '@pages/course-management/components/question-wrapper/data-access/questions-manager.service';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { QuestionWrapperComponent } from '@pages/course-management/components/question-wrapper/question-wrapper.component';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  ExamStyle,
  QuestionDto,
} from '@pages/course-management/data-access/lms-exam.dto';
import { CMSExamService } from '@pages/course-management/data-access/cms-exam.service';
import {
  AddExamPayloadDTO,
  ExamData,
} from '@pages/course-management/data-access/cms-exam.dto';
import { formatDateToUnixWithTime } from '@utils/date';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionDTO } from '@pages/course-management/components/question-wrapper/data-access/question.dto';
import { QuestionTypeEnum } from '@pages/course-management/components/question-wrapper/data-access/question-enum';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  RbacDirective,
  RbacSomeDirective,
} from '@shared/role-bace-acces-controller/rbac.directive';
import { QuestionFormService } from '@pages/course-management/components/question-wrapper/data-access/question-form.service';

@Component({
  selector: 'app-add-exam',
  templateUrl: './add-exam.page.html',
  standalone: true,
  imports: [
    IonButton,
    TranslocoDirective,
    QuestionWrapperComponent,
    HessaBtnDirective,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    RbacSomeDirective,
    RbacDirective,
  ],
  providers: [QuestionsManagerService, QuestionFormService],
})
export class AddExamPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private _location = inject(Location);
  private readonly toasterService = inject(HesToasterService);
  private examService = inject(CMSExamService);
  private readonly layoutUiControlService = inject(LayoutUiControlService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  examId = input<number>();
  topicId = input<number>();
  private translocoService = inject(TranslocoService);
  private fb = inject(NonNullableFormBuilder);
  addExamPermission = RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.EXAM;
  ediExamPermission = RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.EXAM;
  onlineExamFields = [
    'startDate',
    'duration',
    'noOfAttempts',
    'viewCorrectAnswers',
  ];
  examStyle = signal('');
  isEditMode = signal(!!this.examId());

  form = this.fb.group({
    title: this.fb.control('', Validators.required),
    examStyle: this.fb.control('', Validators.required),
    description: this.fb.control('', Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    dueDate: this.fb.control<Date | null>(null, Validators.required),
    duration: this.fb.control(30, Validators.required),
    noOfAttempts: this.fb.control(-1, Validators.required),
    viewCorrectAnswers: this.fb.control('', Validators.required),
  });

  additionalFieldsConfig = computed<IControl[]>(() => {
    if (this.examStyle() !== ExamStyle.OFFLINE) {
      return [
        {
          label: this.translocoService.translate(
            'content_management.start_date_time.label',
          ),
          type: 'date-time',
          placeholder: this.translate(
            'global.select_start_date_time.placeholder',
          ),
          formControlName: 'startDate',
          required: true,
        },
        {
          label: this.translocoService.translate(
            'content_management.due_date_time.label',
          ),
          placeholder: this.translate('global.select_due_date.placeholder'),
          type: 'date-time',
          formControlName: 'dueDate',
          required: true,
        },
        {
          label: this.translocoService.translate(
            'content_management.duration.label',
          ),
          type: 'input',
          placeholder: this.translocoService.translate(
            'content_management.select_duration.placeholder',
          ),
          inputType: 'number',
          formControlName: 'duration',
          required: true,
        },
        {
          label: this.translocoService.translate(
            'content_management.number_of_attempts.label',
          ),
          type: 'searchable-select',
          formControlName: 'noOfAttempts',
          placeholder: this.translocoService.translate(
            'content_management.select_number.placeholder',
          ),
          required: true,
          selectValues: [
            { displayedValue: '1', value: 1 },
            { displayedValue: '2', value: 2 },
            { displayedValue: '3', value: 3 },
          ],
        },
        {
          label: this.translocoService.translate(
            'content_management.view_correct_answers.label',
          ),
          type: 'searchable-select',
          formControlName: 'viewCorrectAnswers',
          required: true,
          placeholder: this.translocoService.translate('global.select.btn'),
          selectValues: [
            {
              displayedValue: this.translocoService.translate('global.yes.btn'),
              value: 'yes',
            },
            {
              displayedValue: this.translocoService.translate('global.no.btn'),
              value: 'no',
            },
          ],
        },
      ];
    } else {
      return [
        {
          label: this.translocoService.translate(
            'content_management.due_date_time.label',
          ),
          placeholder: this.translocoService.translate(
            'announcements.select_date_time.placeholder',
          ),
          type: 'date-time',
          formControlName: 'dueDate',
          required: true,
        },
      ];
    }
  });
  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('global.title.label'),
        type: 'input',
        formControlName: 'title',
        placeholder: this.translocoService.translate(
          'global.enter_title.placeholder',
        ),
        required: true,
      },
      {
        label: this.translocoService.translate(
          'content_management.exam_style.label',
        ),
        type: 'searchable-select',
        formControlName: 'examStyle',
        placeholder: this.translocoService.translate(
          'content_management.select_exam_style.placeholder',
        ),
        required: true,
        isEnumTranslate: true,
        selectValues: [
          { displayedValue: ExamStyle.CLASSIC, value: ExamStyle.CLASSIC },
          {
            displayedValue: ExamStyle.QUESTION_BY_QUESTION,
            value: ExamStyle.QUESTION_BY_QUESTION,
          },
          { displayedValue: ExamStyle.OFFLINE, value: ExamStyle.OFFLINE },
        ],
      },
      {
        label: this.translocoService.translate('global.description.label'),
        type: 'textarea',
        placeholder: this.translocoService.translate(
          'global.enter_description.placeholder',
        ),
        formControlName: 'description',
        required: true,
      },
      ...this.additionalFieldsConfig(),
    ];
  });

  constructor() {}

  ionViewWillEnter() {
    const examId = this.examId();
    if (examId) {
      this.setQuestionParent(examId);
      this.fetchQuestions(examId);
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
    this.layoutUiControlService.hideWebBackBtn();
  }

  private setQuestionParent(id: number) {
    this.questionManagerService.setParentId({
      examId: id,
    });
  }

  convertQuestionType(questions: QuestionDto[]): QuestionDTO[] {
    return questions.map((question) => {
      return {
        id: question?.id,
        examId: question.examId,
        assignmentId: question?.assignmentId,
        text: question.text,
        type: this.convertStringToQuestionType(question.type),
        attachments: question?.attachments,
        modelAnswer: question?.modelAnswer,
        questionOptionId: question.answer?.questionOptionId,
        answerText: question.answer?.answerText,
        isAttachmentAllowed: question.isAttachmentAllowed ?? false,
        options: question?.options?.map((option) => {
          return {
            text: option.text,
            isCorrect: option.isCorrect,
          };
        }),
      };
    });
  }

  private fetchQuestions(examId: number) {
    this.examService.getExam(examId).subscribe((examResponse) => {
      const { questions } = examResponse.data;
      const questionsConverted = this.convertQuestionType(questions ?? []);
      this.questionManagerService.setQuestions(questionsConverted);
      this.setExamForm(examResponse.data);
    });
  }

  convertStringToQuestionType(type: string): QuestionTypeEnum {
    if (type === 'TRUE_OR_FALSE') {
      return QuestionTypeEnum.trueFalse;
    } else if (type === 'MCQ') {
      return QuestionTypeEnum.mcq;
    } else {
      return QuestionTypeEnum.essay;
    }
  }

  setExamForm(exam: ExamData) {
    this.form.patchValue({
      title: exam.title,
      examStyle: exam.style,
      description: exam.description,
      startDate: exam.startDate ? new Date(exam.startDate) : null,
      dueDate: exam.dueDate ? new Date(exam.dueDate) : null,
      duration: (exam.duration ?? 0) / 60,
      noOfAttempts: exam.allowedAttempts,
      viewCorrectAnswers: exam.isViewCorrectAnswer ? 'yes' : 'no',
    });
  }

  ngOnInit() {
    const examId = this.examId();
    if (examId) {
      this.form.disable();
      this.questionManagerService.reFetchParent$.subscribe(() => {
        const examId = this.examId();
        if (examId) {
          this.fetchQuestions(examId);
        }
      });
    }
    this.form.get('examStyle')?.valueChanges.subscribe((value) => {
      this.examStyle.set(value);
      Object.keys(this.form.controls).forEach((controlName) => {
        const control = this.form.get(controlName);
        if (control) {
          if (this.onlineExamFields.includes(controlName)) {
            if (this.examStyle() === ExamStyle.OFFLINE) {
              // If controlName is defined and included in onlineExamFields, mark not required
              control.setValidators(null);
            } else {
              // If controlName is defined and included in onlineExamFields, mark required
              control.setValidators(Validators.required);
            }
            control.updateValueAndValidity();
          }
        }
      });
    });
  }

  onCancel() {
    this._location.back();
  }

  onSave() {
    const data = this.form.value;
    const topicId = this.topicId();
    if (topicId) {
      // Validate due date must be after start date for online exams
      if (
        this.examStyle() !== ExamStyle.OFFLINE &&
        data.startDate &&
        data.dueDate &&
        data.dueDate <= data.startDate
      ) {
        this.toasterService.error(
          this.translate('course_management.due_date_alert.txt'),
        );
        return;
      }

      const payload: AddExamPayloadDTO = {
        topicId,
        title: data.title || '',
        description: data.description || '',
        examStyle: data.examStyle || 'CLASSIC',
        allowedAttempts: +(data.noOfAttempts ?? 1),
        isViewCorrectAnswer: data.viewCorrectAnswers === 'yes',
        startDate: data.startDate
          ? formatDateToUnixWithTime((data.startDate! as Date).toISOString())
          : 0,
        dueDate: formatDateToUnixWithTime(
          (data.dueDate! as Date).toISOString(),
        ),
        duration: +(data.duration ?? 0) * 60,
      };

      if (this.examStyle() === ExamStyle.OFFLINE) {
        // delete non needed properties
        delete payload.startDate;
        delete payload.duration;
        delete payload.allowedAttempts;
        // delete payload.isViewCorrectAnswer;
      }

      const examId = this.examId();
      if (examId) {
        this.examService.updateExam(examId, payload).subscribe({
          next: (examData) => {
            let toastMsg = this.translate(
              'content_management.exam_updated_successfully.txt',
            );
            this.toasterService.success(this.translate(toastMsg));
            this.setExamForm(examData.data);
          },
          error: (err) => {
            this.displayError(err);
          },
        });
      } else {
        this.examService.addExam(payload).subscribe({
          next: (examData) => {
            let toastMsg = this.translate(
              'content_management.exam_successfully_submitted.txt',
            );
            this.toasterService.success(this.translate(toastMsg));
            this.router.navigate(['../' + examData.data.id], {
              relativeTo: this.route,
              replaceUrl: true,
            });
          },
          error: (err) => {
            this.displayError(err);
          },
        });
      }
    }
  }

  displayError(err: any) {
    const type = err.error?.error?.details?.[0]?.type;
    if (type === 'dueDate.invalidRange') {
      this.toasterService.error(
        this.translate('course_management.due_date_alert.txt'),
      );
    } else if (type === 'date.min') {
      this.toasterService.error(this.translate('global.start_date_alert.txt'));
    } else {
      this.toasterService.showBackendError(err);
    }
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  protected readonly ExamStyle = ExamStyle;

  enableEditMode() {
    this.isEditMode.set(true);
    this.form.enable();
  }
}
