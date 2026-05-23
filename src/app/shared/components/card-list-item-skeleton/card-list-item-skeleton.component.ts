import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { isMobile } from '@shared/utils/platform';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-card-list-item-skeleton',
  templateUrl: './card-list-item-skeleton.component.html',
  standalone: true,
  imports: [IonSkeletonText, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardListItemSkeletonComponent {
  isMobile = isMobile();
}
