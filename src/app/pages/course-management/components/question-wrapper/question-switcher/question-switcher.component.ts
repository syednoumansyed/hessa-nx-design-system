import {
  Component,
  computed,
  inject,
  Input,
  input,
  OnInit,
} from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { TrueFalseQuestionComponent } from './true-false-question/true-false-question.component';
import { McqQuestionComponent } from './mcq-question/mcq-question.component';
import { EssayQuestionComponent } from './essay-question/essay-question.component';
import { QuestionsManagerService } from '../data-access/questions-manager.service';
import { QuestionTypeEnum } from '../data-access/question-enum';
import { QuestionFormService } from '../data-access/question-form.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isMobile } from '@shared/utils/platform';
import { FaIconComponentsProps } from '@shared/types';
import {
  faAngleLeft,
  faEllipsisVertical,
} from '@fortawesome/pro-light-svg-icons';
import { map, take } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';

@Component({
  selector: 'app-question-switcher',
  templateUrl: './question-switcher.component.html',
  standalone: true,
  imports: [
    IonSpinner,
    IonToolbar,
    IonHeader,
    IonSpinner,
    AsyncPipe,
    NgTemplateOutlet,
    FormControlGeneratorComponent,
    IonContent,
    ReactiveFormsModule,
    TrueFalseQuestionComponent,
    McqQuestionComponent,
    EssayQuestionComponent,
    TranslocoDirective,
    HesButtonModule,
    NoDataCardComponent,
  ],
})
export class QuestionSwitcherComponent implements OnInit {
  private readonly questionFromService = inject(QuestionFormService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  private translocoService = inject(TranslocoService);
  questionType = QuestionTypeEnum;
  readonly form = this.questionFromService.form;
  readonly isMobile = isMobile();
  readonly angleLeft: FaIconComponentsProps = {
    icon: faAngleLeft,
    size: 'xl',
  };
  readonly ellipsisVertical: FaIconComponentsProps = {
    icon: faEllipsisVertical,
    size: 'xl',
  };

  closeFn = input<() => void>();
  @Input()
  titlePlaceholder?: string;
  @Input()
  title?: string;
  readonly actionType$ = this.questionManagerService.activeState$.pipe(
    map((state) => state.actionType),
  );
  readonly isDetailLoading$ =
    this.questionManagerService.isLoadingQuestionDetail$;
  readonly isViewState$ = this.questionManagerService.isViewState$;
  constructor() {
    this.questionManagerService.activeState$
      .pipe(takeUntilDestroyed())
      .subscribe(({ actionType, payload }) => {
        if (actionType === 'add') {
          this.form.reset();
        } else {
          this.form.patchValue({
            type: payload?.type || 'new',
            id: payload?.id || null,
          });
        }
      });
  }

  ngOnInit() {}

  switcherConfig = computed<IControl>(() => {
    return {
      placeholder: this.translate(
        'content_management.select_question_type.title',
      ),
      type: 'searchable-select' as const,
      selectValues: [
        {
          value: 'new',
          displayedValue: this.translate(
            'content_management.select_question_type.title',
          ),
        },
        ...this.QUESTION_TYPE,
      ],
      formControlName: 'type',
      required: false,
    };
  });

  onChangeQuestionType = (event: string, control: FormControl) => {};

  translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }
  onCloseModal() {
    const fn = this.closeFn();
    if (fn) {
      fn();
    }
  }

  onAddNewQuestion() {
    this.questionManagerService.addNewQuestion();
  }

  onSelectParent() {
    this.questionManagerService.selectParent();
  }

  onEditState() {
    this.questionManagerService.editQuestion();
  }

  onSave() {
    this.questionManagerService.onSave();
  }
  onCancel() {
    // TODO: should move to last step
    this.questionManagerService.activeState$
      .pipe(take(1))
      .subscribe(({ actionType, payload }) => {
        if (actionType === 'edit') {
          this.questionManagerService.viewQuestion(payload);
        } else {
          this.questionManagerService.selectParent();
        }
      });
  }

  readonly QUESTION_TYPE: ISelectValue[] = [
    {
      value: QuestionTypeEnum.trueFalse,
      displayedValue: this.translate('content_management.true_or_false.txt'),
    },
    {
      value: QuestionTypeEnum.mcq,
      displayedValue: this.translate('content_management.multiple_choice.txt'),
    },
    {
      value: QuestionTypeEnum.essay,
      displayedValue: this.translate('content_management.essay.txt'),
    },
  ];
}
