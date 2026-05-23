import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectableOptionGroupComponent } from '@ds/selectable-option/selectable-option-group.component';
import { SelectableOptionGroupConfig } from '@ds/selectable-option/selectable-option.types';
import { AssessmentQuestionDto } from '@pages/content-management/lms/data-access/assessment.dto';

@Component({
  selector: 'app-true-false-display',
  templateUrl: './true-false-display.component.html',
  standalone: true,
  imports: [SelectableOptionGroupComponent, ReactiveFormsModule],
})
export class TrueFalseDisplayComponent {
  question = input<AssessmentQuestionDto>();
  form = input.required<FormGroup>();
  config = input.required<SelectableOptionGroupConfig>();
}
