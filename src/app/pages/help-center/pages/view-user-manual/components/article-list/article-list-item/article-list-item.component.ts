import { CommonModule } from '@angular/common';
import { Component, inject, input, signal, computed } from '@angular/core';
import { UserManualListControllerService } from '../../../utils/user-manual-list-controller.service';
import { tap } from 'rxjs';
import { HelpCenterDocumentListItem } from '@pages/help-center/data-access/documentation.interface';

@Component({
  selector: 'app-article-list-item',
  templateUrl: './article-list-item.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ArticleListItemComponent {
  private readonly listControllerService = inject(
    UserManualListControllerService,
  );

  language = input<string>();

  expended = input();
  userManual = input.required<HelpCenterDocumentListItem>();

  private readonly _isExpended = signal<boolean>(false);

  isExpended = computed(() => this._isExpended() || this.expended());
  readonly activeArticle$ = this.listControllerService.activeListItem$.pipe(
    tap((resp) => {
      if (resp?.typeId === this.userManual()?.id) {
        if (resp?.typeId === this.userManual()?.id) {
          this._isExpended.set(true);
        }
      }
    }),
  );

  onToggle() {
    this._isExpended.set(!this.isExpended());
  }

  onActiveArticle(articleId: number) {
    this.listControllerService.setActiveListItem({
      typeId: this.userManual().id,
      articleId,
    });
  }
}
