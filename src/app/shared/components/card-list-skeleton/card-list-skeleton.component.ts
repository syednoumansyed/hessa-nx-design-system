import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { isMobile } from '@shared/utils/platform';
import { CardListItemSkeletonComponent } from '../card-list-item-skeleton/card-list-item-skeleton.component';

@Component({
  selector: 'app-card-list-skeleton',
  templateUrl: './card-list-skeleton.component.html',
  standalone: true,
  imports: [CommonModule, CardListItemSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardListSkeletonComponent {
  isMobile = isMobile();
}
