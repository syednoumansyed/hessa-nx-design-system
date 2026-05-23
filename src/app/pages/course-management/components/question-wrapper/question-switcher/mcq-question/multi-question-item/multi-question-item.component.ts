import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faXmark } from '@fortawesome/pro-light-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  QuestionFormService,
  QuestionOption,
} from '../../../data-access/question-form.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { QuestionsManagerService } from '../../../data-access/questions-manager.service';
import { map, startWith } from 'rxjs';
import { isMobile } from '@shared/utils/platform';
@Component({
  selector: 'app-multi-question-item',
  templateUrl: './multi-question-item.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormControlGeneratorComponent,
    FontAwesomeModule,
    TranslocoDirective,
  ],
  providers: [],
})
export class MultiQuestionItemComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly questionFormService = inject(QuestionFormService);
  form = input<QuestionOption>();
  idx = input<number>(0);
  isReadonly = input<boolean>(false);
  removed = output();
  markAsCorrect = output<number>();
  xMark = faXmark;
  readonly isViewState$ = this.questionManagerService.isViewState$;
  questionConfig = computed<IControl>(() => {
    return {
      label: '',
      placeholder: this.translate(
        'content_management.enter_answer.placeholder',
      ),
      type: 'input',
      formControlName: 'text',
      required: true,
      readonly: this.isReadonly(),
    };
  });
  isShowRemoveButton$ =
    this.questionFormService.form.controls.questionOptions.valueChanges.pipe(
      startWith(this.questionFormService.form.controls.questionOptions.value),
      map((options) => {
        return options.length > 2;
      }),
    );
  isMobile = isMobile();
  constructor() {}

  ngOnInit() {}
  onRemove() {
    this.removed.emit();
  }

  onMarkAsCorrect() {
    this.markAsCorrect.emit(this.idx());
  }

  translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }
}
