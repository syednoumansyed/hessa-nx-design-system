import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { map } from 'rxjs';
import { QuestionsManagerService } from '../data-access/questions-manager.service';
import { QuestionDTO } from '../data-access/question.dto';
import { isMobile } from '@shared/utils/platform';
import { FaIconComponentsProps } from '@shared/types';
import { IonItem, IonPopover, IonList } from '@ionic/angular/standalone';
import { FeedbackService } from '../../../../../shared/services/feedback.service';
import { HesToasterService } from '../../../../../shared/services/hes-toaster.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import {
  faAngleLeft,
  faAngleRight,
  faEllipsisVertical,
} from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-question-list-item',
  templateUrl: './question-list-item.component.html',
  standalone: true,
  imports: [
    IonList,
    IonPopover,
    IonItem,
    CommonModule,
    HesIconComponent,
    TranslocoDirective,
  ],
})
export class QuestionListItemComponent {
  private readonly questionManagerService = inject(QuestionsManagerService);
  private feedbackService = inject(FeedbackService);
  private toasterService = inject(HesToasterService);
  private translocoService = inject(TranslocoService);
  readonly canModifyQuestions$ =
    this.questionManagerService.canModifyQuestions$;

  question = input<QuestionDTO>();
  isMobile = isMobile();
  idx = input<number>(0);
  readonly ellipsisVertical: FaIconComponentsProps = {
    icon: faEllipsisVertical,
    size: 'xl',
  };
  isActive$ = this.questionManagerService.activeQuestionId$.pipe(
    map((id) => id === this.question()?.id),
  );

  onToggle() {
    const question = this.question();
    if (question) {
      this.questionManagerService.viewQuestion(question);
    }
  }

  onDeleteQuestionClick() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate(
          'global.delete_question.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.onDeleteQuestion();
      },
    );
  }

  onDeleteQuestion() {
    const id = this.question()?.id;
    if (id) {
      this.questionManagerService.onDeleteQuestion(id).subscribe({
        next: () => {
          this.questionManagerService.reFetchParent();
          this.toasterService.success(
            this.translocoService.translate(
              'global.successfully_question_deleted.txt',
            ),
          );
        },
        error: (error) => {
          this.toasterService.showBackendError(error);
        },
      });
    }
  }
}
