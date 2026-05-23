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
import { TranslocoDirective } from '@jsverse/transloco';
import { StudentsService } from '@pages/user-management/students/students.service';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-cms-assignment-result',
  templateUrl: './cms-assignment-result.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    QuestionFormControlGeneratorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [CMSAssignmentsService],
})
export class CmsAssignmentResultPage implements OnInit {
  private studentsService = inject(StudentsService);
  private assignmentService = inject(CMSAssignmentsService);
  private readonly fb = inject(FormBuilder);
  assignmentId = input<number>();
  studentId = input<number>();
  assignmentDetails = signal<any>(undefined);
  assignmentQuestionForm = this.fb.group({});
  studentData = signal<Student | undefined>(undefined);
  isLoading = signal<Boolean>(true);
  assignmentQuestions = this.assignmentService.assignmentQuestions;

  constructor() {}

  ngOnInit() {
    this.getAssignmentQuestions();
  }

  getStudentData(id: number) {
    this.studentsService.getStudent(id).subscribe({
      next: (student) => {
        this.studentData.set(student);
      },
    });
  }

  getAssignmentQuestions() {
    const assignmentId = this.assignmentId();
    const studentId = this.studentId();
    if (assignmentId && studentId) {
      this.assignmentService
        .getCmsAssignmentQuestions(assignmentId, studentId)
        .subscribe({
          next: (questions) => {
            this.assignmentDetails.set(questions.data);
            if (
              questions.data.submissionData.status ===
              StudentSubmissionStatus.SUBMITTED
            ) {
              this.getStudentData(questions.data.submissionData.studentId);
              this.assignmentQuestions().forEach(
                (question: IQuestionFormControlConfig) => {
                  this.assignmentQuestionForm.addControl(
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
