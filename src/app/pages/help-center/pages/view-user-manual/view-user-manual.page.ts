import {
  Component,
  inject,
  signal,
  TemplateRef,
  viewChild,
  computed,
} from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { isMobile } from '@shared/utils/platform';
import { FaIconComponentsProps } from '@shared/types';
import { faPen, faTrashCan } from '@fortawesome/pro-light-svg-icons';
import {
  IonContent,
  IonSegmentButton,
  IonSegment,
  IonSpinner,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ArticleListComponent } from './components/article-list/article-list.component';
import {
  faPlus,
  faSearch,
  IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { DocumentationService } from '@pages/help-center/data-access/documentation.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HesSubscription } from '../../../../shared/utils/hes-subscription.util';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { UserManualListControllerService } from './utils/user-manual-list-controller.service';
import { finalize, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { DocumentControlPanelComponent } from '../../components/document-control-panel/document-control-panel.component';
import { TemplateProjectionService } from '@shared/services/template-projection.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { HelpCenterDocumentListItem } from '@pages/help-center/data-access/documentation.interface';
@Component({
  selector: 'app-view-user-manual',
  templateUrl: './view-user-manual.page.html',
  standalone: true,
  imports: [
    HessaInputComponent,
    NoDataCardComponent,
    IonSegment,
    IonSegmentButton,
    IonContent,
    IonSpinner,
    ArticleListComponent,
    HesButtonModule,
    ReactiveFormsModule,
    ArticleDetailComponent,
    DocumentControlPanelComponent,
    TranslocoDirective,
    TranslocoPipe,
    AsyncPipe,
    NgClass,
  ],
})
export class ViewUserManualPage {
  private readonly translocoService = inject(TranslocoService);
  private readonly userManualApiService = inject(DocumentationService);
  private readonly projectionService = inject(TemplateProjectionService);
  private rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  readonly isAddPermission = signal<boolean>(false);
  readonly noDataBtnConfig = signal<NoDataBtnInterface>({
    label: '',
    onAction: () => {},
  });
  isMobile = isMobile();
  readonly iconPrefix: IconDefinition = faSearch;
  readonly projectedTemplate = viewChild('projectedTemplate', {
    read: TemplateRef,
  });

  readonly languageCtrl = new FormControl<string>(
    this.translocoService.getActiveLang(),
  );
  localLanguage = signal<string>(this.languageCtrl.value!);
  searchCtrl = new FormControl<string>('');
  addNewArticlePermission = RESOURCE_PERMISSION.helpCenter.CREATE;
  readonly userManuals = signal<HelpCenterDocumentListItem[] | null>(null);
  isUserManualExist = computed(() => {
    const userManuals = this.userManuals();
    return userManuals?.some((userManual) => !!userManual.articles);
  });

  readonly userManualListController = inject(UserManualListControllerService);
  readonly activeType$ = this.userManualListController.activeListItem$;
  private readonly subscription = new HesSubscription();
  constructor() {
    this.translocoService.load('ar').subscribe();
    this.languageCtrl = new FormControl(this.translocoService.getActiveLang());
    this.languageCtrl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.userManualListController.setActiveListItem(null);
      this.fetchUserManual();
    });

    this.searchCtrl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(500), distinctUntilChanged())
      .subscribe((val) => {
        this.localLanguage.set(val!);
        this.fetchUserManual();
      });
  }
  readonly faPen: FaIconComponentsProps = {
    icon: faPen,
    size: 'lg',
  };
  readonly faTrash: FaIconComponentsProps = {
    icon: faTrashCan,
    size: 'lg',
  };
  readonly plusIcon: FaIconComponentsProps = {
    icon: faPlus,
    size: 'lg',
  };

  isAdminView = signal<boolean>(false);
  numberSkeleton = Array(8).fill(0);
  isLoading = signal<boolean>(false);
  isSearcing$ = this.searchCtrl.valueChanges.pipe(
    debounceTime(500),
    distinctUntilChanged(),
    map((val) => !!val),
  );
  ionViewDidEnter() {
    this.fetchUserManual();
    if (!this.isMobile)
      this.projectionService.renderTemplate(this.projectedTemplate()!);
  }

  ngOnInit() {
    const isAdminPermission = this.rbacService.hasSomePermission([
      RESOURCE_PERMISSION.helpCenter.CREATE,
      RESOURCE_PERMISSION.helpCenter.UPDATE,
      RESOURCE_PERMISSION.helpCenter.DELETE,
    ]);
    this.isAdminView.set(isAdminPermission);
    this.isAddPermission.set(
      this.rbacService.hasPermission(RESOURCE_PERMISSION.helpCenter.CREATE),
    );

    this.isAdminView.set(isAdminPermission);

    this.noDataBtnConfig.set({
      label: this.translate('support_ticket.add_new_article.btn'),
      onAction: () => this.navigateToCreateDocument(),
    });
  }

  fetchUserManual() {
    this.isLoading.set(true);
    this.userManuals.set(null);
    this.userManualApiService
      .fetchDocuments({
        language: this.languageCtrl.value!,
        searchText: this.searchCtrl.value!,
        articleType: 'ARTICLE',
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (resp) => {
          this.userManuals.set(resp.filter((i) => !!i.articles?.length));
          const userManuals = this.userManuals();
          if (userManuals?.length) {
            this.onSelectUserManual(userManuals[0]);
          } else {
            this.userManualListController.setActiveListItem(null);
          }
        },
        error: () => {
          this.userManuals.set([]);
          this.userManualListController.setActiveListItem(null);
        },
      });
  }

  afterDeleteArticle(obj?: { deleteId?: number }) {
    const { deleteId } = obj || {};
    if (deleteId) {
      this.userManualListController.setActiveListItem(null);
    }
    this.fetchUserManual();
  }

  onSelectUserManual(value: HelpCenterDocumentListItem) {
    this.userManualListController.setActiveListItem({
      typeId: value.id,
      articleId: value?.articles?.[0]?.id || null,
      data: value,
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private navigateToCreateDocument() {
    this.router.navigate(['/help-center/user-manual/documentation/create']);
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
