import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import {
  DsSelectOptionCreatorItemComponent,
  TrueFalseOption,
} from '../multiple-select-item/select-option-creator-item.component';
import { DsObjId } from '@ds/common.types';
import { DsButtonComponent } from '@ds/button/button.component';
import { TranslocoService } from '@jsverse/transloco';
export type OptionCreatorType = 'TRUE_OR_FALSE' | 'MCQ' | 'MULTI_SELECT';

export interface QuestionOption {
  id?: DsObjId;
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'ds-select-option-creator',
  templateUrl: './select-option-creator.component.html',
  imports: [
    ReactiveFormsModule,
    DsButtonComponent,
    DsSelectOptionCreatorItemComponent,
  ],
})
export class DsSelectOptionCreatorComponent implements OnInit {
  questionOptions = input<QuestionOption[]>();
  optionsChange = output<QuestionOption[]>();
  type = input<OptionCreatorType>('MCQ');
  readonly isMultSelect = computed(() => this.type() === 'MULTI_SELECT');
  readonly isTrueOrFalse = computed(() => this.type() === 'TRUE_OR_FALSE');
  readonly addIcon = faPlus;
  private readonly fb = inject(FormBuilder);

  destroyRef$ = inject(DestroyRef);
  translationService = inject(TranslocoService);
  optionsForm = this.fb.group({
    options: this.fb.array([]),
  });

  get optionsArray() {
    return this.optionsForm.get('options') as FormArray;
  }

  get optionFormGroups(): FormGroup[] {
    return this.optionsArray.controls as FormGroup[];
  }

  constructor() {}

  ngOnInit() {
    this.initializeOptions();

    // Set up global form subscription to emit changes with debounce
    this.optionsForm.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef$))
      .subscribe(() => {
        const options = this.optionsArray.value as QuestionOption[];
        this.optionsChange.emit(options);
      });
  }

  private initializeOptions() {
    let options = this.questionOptions();
    if (this.type() === 'TRUE_OR_FALSE') {
      const trueText = this.translationService.translate('global.true.txt');
      const falseText = this.translationService.translate('global.false.txt');
      // Find by TrueFalseOption enum, but set translated text for rendering
      const trueOptionRaw = options?.find(
        (o) => o.text === TrueFalseOption.TRUE,
      );
      const falseOptionRaw = options?.find(
        (o) => o.text === TrueFalseOption.FALSE,
      );
      const trueOption = trueOptionRaw
        ? { ...trueOptionRaw, text: trueText }
        : { text: trueText, isCorrect: false };
      const falseOption = falseOptionRaw
        ? { ...falseOptionRaw, text: falseText }
        : { text: falseText, isCorrect: false };
      this.addOption(trueOption);
      this.addOption(falseOption);
    } else {
      if (options && options.length > 0) {
        // Use existing options from input
        options.forEach((option) => {
          this.addOption(option);
        });
      } else {
        // Create default 4 options for new questions
        for (let i = 0; i < 4; i++) {
          this.addOption({ text: '', isCorrect: false });
        }
      }
    }
  }
  private addOption(option: QuestionOption = { text: '', isCorrect: false }) {
    const optionForm = this.fb.group({
      text: [option.text],
      isCorrect: [option.isCorrect],
    });

    this.optionsArray.push(optionForm);
  }

  addNewOption() {
    if (this.type() === 'TRUE_OR_FALSE') return;
    this.addOption();
  }

  removeOption(index: number) {
    if (this.type() === 'TRUE_OR_FALSE') return;
    if (this.optionsArray.length > 1) {
      this.optionsArray.removeAt(index);
    }
  }

  getOptionValue(index: number) {
    return this.optionsArray.at(index)?.value;
  }

  // Called when an option is selected in single select mode
  onSingleSelect(selectedIndex: number) {
    this.optionFormGroups.forEach((group, idx) => {
      if (idx !== selectedIndex) {
        group.get('isCorrect')?.setValue(false, { emitEvent: false });
      } else {
        group.get('isCorrect')?.setValue(true, { emitEvent: false });
      }
    });
  }
}
