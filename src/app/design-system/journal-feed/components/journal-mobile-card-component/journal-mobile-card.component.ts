import { Component, input, output } from '@angular/core';
import { DsChipComponent } from '@ds/chip/chip.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';
import { JournalCardData } from '@ds-layout/services/student-journals.interface';

@Component({
  selector: 'ds-journal-mobile-card',
  templateUrl: './journal-mobile-card.component.html',
  standalone: true,
  imports: [
    DsChipComponent,
    AvatarComponent,
    TimeAgoPipe,
    DsTranslatePipe,
    DsIconComponent,
  ],
})
export class DsJournalMobileCardComponent {
  journal = input.required<JournalCardData>();
  showNewChip = input<boolean>(false);
  cardClicked = output<JournalCardData>();

  protected readonly arrowIcon = faChevronRight;

  onCardClick() {
    this.cardClicked.emit(this.journal());
  }
}
