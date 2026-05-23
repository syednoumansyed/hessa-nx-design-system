import { Component, inject, input, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamStyle } from '@pages/course-management/data-access/lms-exam.dto';
import { IonButton } from '@ionic/angular/standalone';
import { QuestionFormControlGeneratorComponent } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import { CMSExamService } from '@pages/course-management/data-access/cms-exam.service';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-preview-exam',
  templateUrl: './preview-exam.component.html',
  styleUrls: ['./preview-exam.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    FormsModule,
    ReactiveFormsModule,
    TranslocoDirective,
    QuestionFormControlGeneratorComponent,
    HessaBtnDirective,
  ],
})
export class PreviewExamComponent implements OnInit, DsModalContentComponent {
  examService = inject(CMSExamService);
  private readonly fb = inject(FormBuilder);
  readonly ExamStyle = ExamStyle;
  currentQuestionIndex = signal(0);
  examId = input<number>(0);
  examQuestions = this.examService.examQuestions;
  examDetails = this.examService.examDetails;
  examQuestionForm = this.fb.group({});

  closeModal?: (data?: unknown, role?: string) => void;

  ngOnInit() {
    this.getExamQuestions();
  }

  getExamQuestions() {
    const id = this.examId();
    if (id) {
      this.examService.getExam(id).subscribe({
        next: (examResponse) => {
          const questions = examResponse.data?.questions;
          if (!questions) {
            this.closeModal?.();
            return;
          }

          this.examService.updateExamDetails(examResponse.data);
          this.examService.mapAllQuestions(questions, false);
          this.examQuestions().forEach((question) => {
            this.examQuestionForm.addControl(
              question.formControlName,
              this.fb.control(question.submittedAnswer ?? null),
            );
          });
        },
      });
    }
  }

  nextQuestion() {
    this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
  }

  previousQuestion() {
    this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
  }
}
