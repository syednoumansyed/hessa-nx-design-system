import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { QuestionListItemComponent } from '../question-list-item/question-list-item.component';
import { QuestionsManagerService } from '../data-access/questions-manager.service';
import { take, tap, map } from 'rxjs';
import { IonButton } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  standalone: true,
  imports: [
    IonButton,
    CommonModule,
    NoDataCardComponent,
    QuestionListItemComponent,
    TranslocoDirective,
  ],
})
export class QuestionListComponent implements OnInit {
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly translocoService = inject(TranslocoService);
  readonly questions$ = this.questionManagerService.questions$.pipe(
    tap((res) => {}),
  );
  readonly isParentNew$ = this.questionManagerService.isNewParentId$;

  readonly isMobile = isMobile();
  readonly isLoading$ = this.questionManagerService.isLoadingQuestions$;
  constructor() {}

  ngOnInit() {}

  readonly noDataBtnConfig$ =
    this.questionManagerService.canModifyQuestions$.pipe(
      map((can) => {
        return {
          label: this.translate('content_management.add_questions.btn'),
          onAction: () => {
            this.onAddQuestion();
          },
          disabled: !can,
        };
      }),
    );

  onAddQuestion() {
    this.questionManagerService.isNewParentId$
      .pipe(take(1))
      .subscribe((isNew) => {
        if (!isNew) {
          this.questionManagerService.addNewQuestion();
        }
      });
  }

  private translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }
}
