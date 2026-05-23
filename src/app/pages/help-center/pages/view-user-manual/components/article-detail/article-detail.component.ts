import {
  Component,
  OnInit,
  inject,
  input,
  signal,
  output,
} from '@angular/core';
import { IonSkeletonText, IonImg } from '@ionic/angular/standalone';
import { DocumentationService } from '@pages/help-center/data-access/documentation.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  ActiveListItem,
  UserManualListControllerService,
} from '../../utils/user-manual-list-controller.service';
import { finalize, map, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { isMobile } from '@shared/utils/platform';
import { FaIconComponentsProps } from '@shared/types';
import { faPen, faPlus, faTrashCan } from '@fortawesome/pro-light-svg-icons';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { createVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import {
  HelpCenterDocument,
  HelpCenterDocumentListItem,
  HelpCenterDocumentListItemArticles,
} from '@pages/help-center/data-access/documentation.interface';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  standalone: true,
  imports: [
    IonImg,
    IonSkeletonText,
    IonSkeletonText,
    HesButtonModule,
    CommonModule,
    RouterModule,
    HesButtonModule,
    TranslocoDirective,
    RbacDirective,
  ],
})
export class ArticleDetailComponent implements OnInit {
  language = input<string | null>();
  refresh = output<{ deleteId: number }>();
  private readonly articleApiService = inject(DocumentationService);
  private readonly activeListItemService = inject(
    UserManualListControllerService,
  );
  private videoDialog = createVideoDialog();
  private readonly feedbackService = inject(FeedbackService);
  readonly isLoading = signal<boolean>(false);

  readonly activeArticle$ = this.activeListItemService.activeListItem$.pipe(
    switchMap((activeListItem) => {
      if (activeListItem) {
        this.isLoading.set(true);
        return this.articleApiService
          .fetchDocumentationById(activeListItem.articleId!)
          .pipe(finalize(() => this.isLoading.set(false)));
      }
      return of(null);
    }),
  );

  readonly activeType$ = this.activeListItemService.activeListItem$;

  readonly nextArticle$ = this.activeListItemService.activeListItem$.pipe(
    map((activeType) => {
      return this.getArticle(activeType);
    }),
  );
  readonly previous$ = this.activeListItemService.activeListItem$.pipe(
    map((activeType) => {
      return this.getArticle(activeType, false);
    }),
  );
  translocoService = inject(TranslocoService);
  toaster = inject(HesToasterService);
  isMobile = isMobile();
  readonly faPen: FaIconComponentsProps = {
    icon: faPen,
    size: 'sm',
  };
  readonly faTrash: FaIconComponentsProps = {
    icon: faTrashCan,
    size: 'sm',
  };
  readonly plusIcon: FaIconComponentsProps = {
    icon: faPlus,
    size: 'sm',
  };
  readonly IconForward: FaIconComponentsProps = {
    icon: faAngleRight,
    size: 'lg',
  };
  readonly IconBackword: FaIconComponentsProps = {
    icon: faAngleLeft,
    size: 'lg',
  };

  numberSkeleton = Array(8).fill(0);

  readonly addPermission = RESOURCE_PERMISSION.helpCenter.CREATE;
  readonly editPermission = RESOURCE_PERMISSION.helpCenter.UPDATE;
  readonly deletePermission = RESOURCE_PERMISSION.helpCenter.DELETE;
  constructor() {}
  ngOnInit() {}

  openVideo(attachments: HelpCenterDocument['attachments']) {
    const [attachment] = attachments ?? [];
    if (attachment?.title && attachment.url) {
      this.videoDialog({
        title: attachment.title,
        src: attachment.url,
      });
    }
  }

  async onDeleteClick(id: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('user_manual.delete_article.txt'),

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
    this.articleApiService.deleteDocumentation(id).subscribe(() => {
      this.refresh.emit({ deleteId: id });
      this.toaster.success(
        this.translate('user_manual.successfully_article_deleted.txt'),
      );
    });
  }

  onSelectedArticle(
    article: HelpCenterDocumentListItemArticles,
    activeListItem: ActiveListItem,
  ) {
    this.activeListItemService.setActiveListItem({
      ...activeListItem,
      articleId: article.id,
    });
  }

  private getArticle(activeListItem: ActiveListItem | null, isNext = true) {
    if (!activeListItem) {
      return null;
    }
    const selectArticle = activeListItem.articleId;
    const articles = activeListItem.data?.articles;
    if (selectArticle && articles?.length) {
      const selectArticleIndex = articles.findIndex(
        (article) => article.id === selectArticle,
      );
      const articleIdx = isNext
        ? selectArticleIndex + 1
        : selectArticleIndex - 1;
      if (selectArticleIndex > -1 && articles[articleIdx]) {
        return articles[articleIdx];
      }
    }
    return null;
  }
}
