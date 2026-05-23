import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IQuestionFormControlConfig,
  QuestionFormControlGeneratorComponent,
} from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import { IonContent } from '@ionic/angular/standalone';
import { SecondsToMinHrsPipe } from '@shared/pipes/secondsToMinHours.pipe';
import { TranslocoDirective } from '@jsverse/transloco';
import { StudentsService } from '@pages/user-management/students/students.service';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-cms-exam-result',
  templateUrl: './cms-exam-result.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    QuestionFormControlGeneratorComponent,
    ReactiveFormsModule,
    SecondsToMinHrsPipe,
    TranslocoDirective,
  ],
  providers: [],
})
export class CmsExamResultPage implements OnInit {
  private studentsService = inject(StudentsService);
  private examService = inject(LMSExamService);
  private readonly fb = inject(FormBuilder);
  examId = input<number>();
  studentId = input<number>();
  examQuestions = this.examService.examQuestions;
  examDetails = this.examService.examDetails;
  examQuestionForm = this.fb.group({});
  studentData = signal<Student | undefined>(undefined);
  isLoading = signal<Boolean>(true);

  constructor() {}

  ngOnInit() {
    this.getExamQuestions();
  }

  getStudentData(id: number) {
    this.studentsService.getStudent(id).subscribe({
      next: (student) => {
        this.studentData.set(student);
      },
    });
  }

  getExamQuestions() {
    const examId = this.examId();
    const studentId = this.studentId();
    if (examId && studentId) {
      this.examService.getCmsExamQuestions(examId, studentId, true).subscribe({
        next: (questions) => {
          if (
            questions.data.submissionData.status ===
            StudentSubmissionStatus.SUBMITTED
          ) {
            this.getStudentData(questions.data.submissionData.studentId);
            this.examQuestions().forEach(
              (question: IQuestionFormControlConfig) => {
                this.examQuestionForm.addControl(
                  question.formControlName,
                  this.fb.control(
                    question.submittedAnswer ?? null,
                    Validators.required,
                  ),
                );
              },
            );
            this.isLoading.set(false);
          }
        },
      });
    }
  }
}
