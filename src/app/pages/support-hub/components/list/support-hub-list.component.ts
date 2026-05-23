import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { DsInputComponent } from '@ds/input/input.component';
import {
  SupportTicketCardComponent,
  SupportTicketCardConfig,
  SupportTicketMenuSelection,
} from '../ticket-card/support-ticket-card.component';
import {
  SupportHubFiltersChange,
  SupportHubFiltersComponent,
} from '../filters/support-hub-filters.component';
import { IonSkeletonText } from '@ionic/angular/standalone';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'app-support-hub-list',
  standalone: true,
  imports: [
    CommonModule,
    DsInputComponent,
    SupportHubFiltersComponent,
    SupportTicketCardComponent,
    IonSkeletonText,
    DsTranslatePipe,
  ],
  templateUrl: './support-hub-list.component.html',
})
export class SupportHubListComponent {
  readonly heading = input<string>('Support tickets');
  readonly tickets = input<ReadonlyArray<SupportTicketCardConfig>>([]);

  readonly showSearch = input<boolean>(false);
  readonly showFilters = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly showClosedSplitter = input<boolean>(false);

  readonly searchPlaceholder = input<string>('Search tickets');
  readonly searchIcon = input<any>();
  readonly selectedTicketId = input<string | null>(null);

  readonly searchChanged = output<string>();
  readonly filtersChanged = output<SupportHubFiltersChange>();
  readonly ticketSelected = output<SupportTicketCardConfig>();
  readonly ticketMenuItemSelected = output<SupportTicketMenuSelection>();

  protected readonly skeletonPlaceholders = [0, 1];
  protected readonly skeletonCardSections = {
    header: [{ classes: 'h-3 w-20' }, { classes: 'h-3 w-24' }],
    meta: {
      title: { classes: 'h-5 w-48' },
      badges: [
        { classes: 'h-6 w-24 rounded-ds-2xl' },
        { classes: 'h-6 w-20 rounded-ds-2xl' },
      ],
      trailing: { classes: 'h-10 w-10 rounded-ds-full' },
    },
    body: [
      { classes: 'h-4 w-full' },
      { classes: 'h-4 w-4/5' },
      { classes: 'h-4 w-2/3' },
    ],
    school: {
      icon: { classes: 'h-8 w-8 rounded-ds-md' },
      lines: [{ classes: 'h-4 w-2/3' }, { classes: 'h-5 w-1/2' }],
    },
    footer: [
      { classes: 'h-4 w-32' },
      { classes: 'h-8 w-8 rounded-ds-full' },
      { classes: 'h-4 w-24' },
    ],
  } as const;

  protected handleSearchChange(term: string): void {
    this.searchChanged.emit(term);
  }

  protected handleFiltersChanged(filters: SupportHubFiltersChange): void {
    this.filtersChanged.emit(filters);
  }

  protected handleTicketSelected(ticket: SupportTicketCardConfig): void {
    this.ticketSelected.emit(ticket);
  }

  protected handleTicketMenuItemSelected(
    selection: SupportTicketMenuSelection,
  ): void {
    this.ticketMenuItemSelected.emit(selection);
  }

  protected readonly firstResolvedIndex = computed(() => {
    if (!this.showClosedSplitter()) {
      return -1;
    }

    return this.tickets().findIndex((ticket) => ticket.isResolved === true);
  });
}
