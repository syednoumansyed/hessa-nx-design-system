import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { DocumentationService } from '@pages/help-center/data-access/documentation.service';
import { ArticleListItemComponent } from './article-list-item/article-list-item.component';
import { IonSkeletonText } from '@ionic/angular/standalone';
import { HelpCenterDocumentListItemDTO } from '@pages/help-center/data-access/documentation-dto';
import { HelpCenterDocumentListItem } from '@pages/help-center/data-access/documentation.interface';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  standalone: true,
  imports: [IonSkeletonText, CommonModule, ArticleListItemComponent],
})
export class ArticleListComponent {
  language = input<string | null>();
  userManuals = input<HelpCenterDocumentListItem[] | null>();
  isLoading = input<boolean>();
  isSearch = input<boolean>();
  private readonly articleApiService = inject(DocumentationService);
  readonly skeletonRepeat = new Array(3).fill(0);
}
