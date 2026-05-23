import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DsSelectOptionCreatorComponent,
  QuestionOption,
} from '@ds/option-creator/select-option-creator/select-option-creator.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Component({
  selector: 'app-option-creator-demo',
  templateUrl: './option-creator-demo.component.html',
  standalone: true,
  imports: [CommonModule, DsSelectOptionCreatorComponent],
})
export class OptionCreatorDemoComponent {
  private toast = inject(HesToasterService);

  // Example 1: Geography question with single correct answer
  existingQuestionOptions: QuestionOption[] = [
    { text: 'Paris', isCorrect: true },
    { text: 'London', isCorrect: false },
    { text: 'Berlin', isCorrect: false },
    { text: 'Madrid', isCorrect: false },
  ];

  // Example 2: Programming question with multiple correct answers
  customQuestionOptions: QuestionOption[] = [
    { text: 'JavaScript', isCorrect: true },
    { text: 'Python', isCorrect: true },
    { text: 'HTML', isCorrect: false },
    { text: 'Assembly', isCorrect: false },
  ];

  trueAndFalseQuestionOptions: QuestionOption[] = [
    { text: 'TRUE', isCorrect: false },
    { text: 'FALSE', isCorrect: true },
  ];

  onOptionCreatorChange(options: QuestionOption[], demoType: string) {
    console.log(`${demoType} - Options changed:`, options);
  }
}
