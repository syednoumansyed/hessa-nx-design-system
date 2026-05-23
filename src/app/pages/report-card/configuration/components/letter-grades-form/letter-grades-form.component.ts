import { Component, inject, input, OnInit, output } from '@angular/core';
import { LetterGradeItemFormComponent } from './letter-grade-item-form/letter-grade-item-form.component';
import {
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isMobile } from '@shared/utils/platform';
import { TranslocoDirective } from '@jsverse/transloco';
import { createGradeFormGroup } from '../grades-scale-form/grades-scale-form';

@Component({
  selector: 'app-letter-grades-form',
  templateUrl: './letter-grades-form.component.html',
  standalone: true,
  imports: [
    LetterGradeItemFormComponent,
    ReactiveFormsModule,
    CommonModule,
    TranslocoDirective,
  ],
})
export class LetterGradesFormComponent implements OnInit {
  // #region inputs and outputs
  gradeForm = input.required<FormGroup>();
  isView = input.required<boolean>();
  // #endregion
  // #region Injectors
  private readonly fb = inject(NonNullableFormBuilder);
  private createGradeGroup = createGradeFormGroup();
  // #endregion

  // #region Protacted Properties
  protected isMobile = isMobile();
  // #endregion
  constructor() {}

  ngOnInit() {}

  // #region Protected Methods

  protected removeLastGrade() {
    if (this.grades.length === 1) {
      this.grades.clear();
      this.grades.push(this.createGradeGroup());
    } else if (this.grades.length > 1) {
      this.grades.removeAt(this.grades.length - 1);
    }
  }
  protected get grades(): FormArray {
    return this.gradeForm().get('grades') as FormArray;
  }

  get gradeControls(): FormGroup[] {
    return (this.gradeForm().get('grades') as FormArray)
      .controls as FormGroup[];
  }

  // #endregion
}
