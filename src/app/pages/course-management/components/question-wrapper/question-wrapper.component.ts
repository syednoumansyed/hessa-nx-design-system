import {
  Component,
  HostBinding,
  OnInit,
  TemplateRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { IonContent, IonModal } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesTabGroupComponent } from '@ui-kit/tab/hes-tab-group/hes-tab-group.component';
import { HesTabComponent } from '@ui-kit/tab/hes-tab/hes-tab.component';
import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { QuestionListComponent } from './question-list/question-list.component';
import { QuestionSwitcherComponent } from './question-switcher/question-switcher.component';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { QuestionsManagerService } from './data-access/questions-manager.service';
import { map, take } from 'rxjs';
import { QuestionFormService } from './data-access/question-form.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-question-wrapper',
  templateUrl: './question-wrapper.component.html',
  standalone: true,
  imports: [
    IonContent,
    HesButtonModule,
    HesTabComponent,
    HesTabGroupComponent,
    QuestionListComponent,
    QuestionSwitcherComponent,
    TranslocoDirective,
    IonModal,
    NgClass,
    AsyncPipe,
    NgTemplateOutlet,
  ],
})
export class QuestionWrapperComponent implements OnInit {
  @HostBinding('class') className = 'h-full';
  bodyTempRef = input<TemplateRef<any>>();
  ctaTempRef = input<TemplateRef<any>>();
  mainTabTitle = input<string>();
  title = input<string>();
  titlePlaceholder = input<string>();
  isQuestionListShow = input<boolean>(false);
  isParentEdit = input<boolean>();
  isModalOpen = signal<boolean>(false);
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly questionFromService = inject(QuestionFormService);
  readonly questions$ = this.questionManagerService.questions$;
  readonly isParentSelected$ = this.questionManagerService.activeState$.pipe(
    map((state) => {
      return state.actionType === 'view-parent';
    }),
  );
  readonly showLoader$ = this.questionManagerService.showLoader$;
  readonly actionType$ = this.questionManagerService.activeState$.pipe(
    map((state) => state.actionType),
  );

  readonly isParentNew$ = this.questionManagerService.isNewParentId$;
  readonly canModifyQuestions$ =
    this.questionManagerService.canModifyQuestions$;
  faPlus = faPlus;
  isMobile = isMobile();
  form = this.questionFromService.form;
  constructor() {}

  ngOnInit() {
    if (this.isMobile) {
      // TODO: unsubscribe;
      this.questionManagerService.activeState$.subscribe(async (state) => {
        if (state.actionType === 'add' || state.actionType === 'view') {
          this.toggleQuestionSwitcherModal();
        }
      });
    }
  }
  toggleQuestionSwitcherModal() {
    this.isModalOpen.update((v) => !v);
  }
  closeQuestionSwitcherModal = () => {
    this.isModalOpen.set(false);
  };

  onAddNewQuestion() {
    this.questionManagerService.addNewQuestion();
  }

  onSelectParent() {
    this.questionManagerService.selectParent();
  }

  onEditState() {
    this.questionManagerService.editQuestion();
  }

  onSave() {
    this.questionManagerService.onSave();
  }
  onCancel() {
    // TODO: should move to last step
    this.questionManagerService.activeState$
      .pipe(take(1))
      .subscribe(({ actionType, payload }) => {
        if (actionType === 'edit') {
          this.questionManagerService.viewQuestion(payload);
        } else {
          this.questionManagerService.selectParent();
        }
      });
  }
}
