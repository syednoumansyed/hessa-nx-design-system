import { CommonModule } from '@angular/common';
import {
  Component,
  TemplateRef,
  inject,
  signal,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IconDefinition,
  faPlus,
  faSearch,
} from '@fortawesome/pro-regular-svg-icons';
import {
  IonContent,
  IonAccordion,
  IonItem,
  IonLabel,
  IonAccordionGroup,
  IonButton,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { DocumentationService } from '@pages/help-center/data-access/documentation.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TemplateProjectionService } from '@shared/services/template-projection.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { computed, OnInit } from '@angular/core';
import { HesSubscription } from '../../../../shared/utils/hes-subscription.util';
import { DocumentControlPanelComponent } from '@pages/help-center/components/document-control-panel/document-control-panel.component';
import { isMobile } from '@shared/utils/platform';
import { HelpCenterDocumentListItem } from '@pages/help-center/data-access/documentation.interface';
import { NewlinePipe } from '@pages/chat/pipe/new-line.pipe';
@Component({
  selector: 'app-view-faq',
  templateUrl: './view-faq.page.html',
  standalone: true,
  imports: [
    DocumentControlPanelComponent,
    NoDataCardComponent,
    IonButton,
    IonAccordionGroup,
    IonLabel,
    IonItem,
    IonAccordion,
    IonContent,
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    RouterModule,
    NewlinePipe,
    HessaInputComponent,
    HessaInputComponent,
    ReactiveFormsModule,
    RbacDirective,
    TranslocoPipe,
    IonSkeletonText,
  ],
})
export class ViewFaqPage implements OnInit, OnDestroy {
  isMobile = isMobile();
  private readonly translocoService = inject(TranslocoService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toaster = inject(HesToasterService);
  private readonly router = inject(Router);
  private readonly faqApiService = inject(DocumentationService);
  private readonly projectionService = inject(TemplateProjectionService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  readonly faqs = signal<HelpCenterDocumentListItem[] | null>(null);
  readonly isArticleExist = computed(() => {
    const faqs = this.faqs();
    return faqs?.some((faq) => !!faq.articles);
  });

  readonly isAddPermission = signal<boolean>(false);
  readonly noDataBtnConfig = signal<NoDataBtnInterface>({
    label: '',
    onAction: () => {},
  });
  readonly isLoading = signal<boolean>(false);
  readonly iconPrefix: IconDefinition = faSearch;
  readonly faPlus = faPlus;
  readonly projectedTemplate = viewChild('projectedTemplate', {
    read: TemplateRef,
  });
  readonly languageCtrl = new FormControl<string>(
    this.translocoService.getActiveLang(),
  );
  readonly searchCtrl = new FormControl<string>('');
  readonly isAdminView = signal<boolean>(false);
  readonly addNewQuestionPermission = RESOURCE_PERMISSION.helpCenter.CREATE;
  readonly editQuestionPermission = RESOURCE_PERMISSION.helpCenter.UPDATE;
  readonly deleteQuestionPermission = RESOURCE_PERMISSION.helpCenter.DELETE;

  readonly skeletonRepeat = new Array(3).fill(0);
  private readonly subscription = new HesSubscription();

  constructor() {
    this.translocoService.load('ar').subscribe();
    this.languageCtrl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.fetchFAQs();
    });

    this.searchCtrl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(500), distinctUntilChanged())
      .subscribe((val) => {
        this.fetchFAQs();
      });
  }

  ngOnInit() {
    const isAdminPermission = this.rbacService.hasSomePermission([
      RESOURCE_PERMISSION.helpCenter.CREATE,
      RESOURCE_PERMISSION.helpCenter.UPDATE,
      RESOURCE_PERMISSION.helpCenter.DELETE,
    ]);

    this.isAddPermission.set(
      this.rbacService.hasPermission(RESOURCE_PERMISSION.helpCenter.CREATE),
    );

    this.isAdminView.set(isAdminPermission);

    this.noDataBtnConfig.set({
      label: this.translate('user_manual.add_faq.title'),
      onAction: () => this.navigateToCreateDocument(),
    });
  }

  ionViewDidEnter() {
    this.fetchFAQs();
    if (!this.isMobile) {
      this.projectionService.renderTemplate(this.projectedTemplate()!);
    }
  }

  async onDeleteClick(id: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('global.delete_question.txt'),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.onDelete(id);
      },
    );
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  onDelete(id: number) {
    this.faqApiService.deleteDocumentation(id).subscribe(() => {
      this.fetchFAQs();
      this.toaster.success(
        this.translate('global.successfully_question_deleted.txt'),
      );
    });
  }

  fetchFAQs() {
    this.isLoading.set(true);
    this.faqApiService
      .fetchDocuments({
        language: this.languageCtrl.value!,
        searchText: this.searchCtrl.value!,
        articleType: 'QUESTION',
      })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (resp) => {
          this.faqs.set(resp?.filter((i) => !!i.articles?.length));
        },
        error: () => {
          this.faqs.set([]);
        },
      });
  }

  private navigateToCreateDocument() {
    this.router.navigate(['./help-center/faqs/documentation/create']);
  }

  ionViewDidLeave() {
    this.projectionService.clearTemplate();
  }

  ngOnDestroy() {
    // Also clear template here in case ionViewDidLeave doesn't trigger
    // (e.g., when navigating via Angular router instead of Ionic NavController)
    this.projectionService.clearTemplate();
    this.subscription.unsubscribe();
  }
}
