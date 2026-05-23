import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import {
  IQuestionFormControlConfig,
  QuestionFormControlGeneratorComponent,
} from '../question-form-control-generator/question-form-control-generator.component';
import { IonHeader, IonToolbar, IonContent } from '@ionic/angular/standalone';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { faAngleLeft } from '@fortawesome/pro-light-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { CMSAssignmentPreviewDTO } from '@pages/course-management/data-access/cms/cms-assignment.dto';
import { map } from 'rxjs';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-cms-assignment-preview',
  templateUrl: './cms-assignment-preview.component.html',
  standalone: true,
  imports: [
    IonToolbar,
    IonHeader,
    CommonModule,
    ReactiveFormsModule,
    QuestionFormControlGeneratorComponent,
    HesIconComponent,
    IonContent,
    FaIconComponent,
  ],
})
export class CmsAssignmentPreviewComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cmsAssignmentService = inject(CMSAssignmentsService);
  @Input() assignmentId: number;
  assignmentQuestionForm = this.fb.group({});
  assignmentQuestions = signal<IQuestionFormControlConfig[]>([]);
  assignmentTitle = signal<string>('');
  protected readonly faClose = faClose;
  readonly angleLeft: FaIconComponentsProps = {
    icon: faAngleLeft,
    size: 'xl',
  };
  isMobile = isMobile();
  @Input()
  closeFn: () => void;

  constructor() {}

  ngOnInit() {
    this.cmsAssignmentService
      .getAssignmentQuestions(this.assignmentId!)
      .pipe(
        map((data) => ({
          title: data.title,
          questions: this.mapAssignmentQuestions(data.questions),
        })),
      )
      .subscribe((resp) => {
        this.assignmentTitle.set(resp.title);
        this.assignmentQuestions.set(resp.questions);
        resp.questions.forEach((question) => {
          this.assignmentQuestionForm.addControl(
            question.formControlName,
            this.fb.control(null, []),
          );
        });
      });
  }

  onCloseModal() {
    this.closeFn?.();
  }

  mapAssignmentQuestions(
    data: CMSAssignmentPreviewDTO[],
  ): Array<IQuestionFormControlConfig> {
    const list: IQuestionFormControlConfig[] = data?.map((item, i) => {
      return {
        id: item.id!,
        isExam: false,
        order: i + 1,
        totalQuestions: data.length,
        question: item.text,
        questionType: item.type,
        showCorrectAnswer: false,
        showSubmission: true,
        attachment: item.attachments?.[0],
        formControlName: `question_${item.id}`,
        allowAttachmentAsEssayAnswer: item.isAttachmentAllowed,
        modelEssayAnswer: item.modelAnswer,
        options:
          item.options?.map((option) => {
            return {
              value: option.id,
              displayedValue: option.text,
              correctAnswer: !!option.isCorrect,
            };
          }) ?? [],
      };
    });
    return list;
  }

  closeModal() {
    this.closeFn();
  }
}
