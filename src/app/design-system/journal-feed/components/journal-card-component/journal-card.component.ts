import { Component, input, output } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { JournalCardData } from '@ds-layout/services/student-journals.interface';

@Component({
  selector: 'ds-journal-card',
  templateUrl: './journal-card.component.html',
  standalone: true,
  imports: [DsIconComponent, AvatarComponent, TimeAgoPipe, DsTranslatePipe],
})
export class DsJournalCardComponent {
  journal = input.required<JournalCardData>();
  cardClicked = output<JournalCardData>();

  protected readonly arrowIcon = faChevronRight;

  onCardClick() {
    this.cardClicked.emit(this.journal());
  }
}
