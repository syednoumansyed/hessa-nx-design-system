import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsJournalCardComponent } from './components/journal-card-component/journal-card.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsJournalMobileCardComponent } from './components/journal-mobile-card-component/journal-mobile-card.component';
import { LayoutService } from '@layout/layout.service';
import { JournalCardData } from '@ds-layout/services/student-journals.interface';

@Component({
  selector: 'ds-journal-feed',
  templateUrl: './journal-feed.component.html',
  standalone: true,
  imports: [
    CommonModule,
    DsChipComponent,
    DsJournalCardComponent,
    DsTranslatePipe,
    DsJournalMobileCardComponent,
  ],
})
export class DsJournalFeedComponent {
  weeklyJournals = input<JournalCardData[]>([]);
  dailyJournals = input<JournalCardData[]>([]);
  allJournals = input<JournalCardData[]>([]);
  showNewChip = input<boolean>(false);
  journalClicked = output<JournalCardData>();

  private readonly layoutService = inject(LayoutService);

  protected readonly isMobile = this.layoutService.isMobileOrTablet;

  shouldShowNewChipForMobile(journal: JournalCardData): boolean {
    return !journal.viewed;
  }

  onJournalClick(journal: JournalCardData) {
    this.journalClicked.emit(journal);
  }
}
