import { Component, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { QuestionFormControlGeneratorComponent } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';

@Component({
  selector: 'app-exam-result',
  templateUrl: './exam-result.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    QuestionFormControlGeneratorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
})
export class ExamResultPage implements OnInit {
  layoutUIControlService = inject(LayoutUiControlService);
  examService = inject(LMSExamService);
  private readonly fb = inject(FormBuilder);
  examId = input<number>();
  studentScope = inject(StudentSelectionScopeService);
  examQuestions = this.examService.examQuestions;
  examDetails = this.examService.examDetails;
  examQuestionForm: FormGroup;

  constructor() {}

  ngOnInit() {
    this.getExamQuestions();
  }

  ionViewWillEnter() {
    this.layoutUIControlService.hideBreadcrumb();
    this.layoutUIControlService.showWebBackBtn();
  }

  ionViewWillLeave() {
    this.layoutUIControlService.showBreadcrumb();
    this.layoutUIControlService.hideWebBackBtn();
  }

  getExamQuestions() {
    const studentId = this.studentScope.selectedStudent()?.id;
    const examId = this.examId();
    if (examId && studentId) {
      this.examService.getExamQuestions(examId, studentId, true).subscribe({
        next: (_questions) => {
          this.examQuestionForm = this.fb.group({});
          this.examQuestions().forEach((question) => {
            this.examQuestionForm.addControl(
              question.formControlName,
              this.fb.control(
                question.submittedAnswer ?? null,
                Validators.required,
              ),
            );
          });
        },
      });
    }
  }
}
