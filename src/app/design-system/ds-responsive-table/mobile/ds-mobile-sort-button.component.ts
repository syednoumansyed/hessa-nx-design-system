import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '@ds/button/button.component';
import { faArrowDownArrowUp } from '@fortawesome/pro-solid-svg-icons';
import { DsSortState } from '../ds-responsive-table.model';

/**
 * Mobile sort button component
 * Shows a sort icon button that triggers opening the sort selection sheet
 * Uses ds-button with custom colors
 */
@Component({
  selector: 'ds-mobile-sort-button',
  standalone: true,
  imports: [CommonModule, DsButtonComponent],
  template: `
    <ds-button
      variant="tertiary"
      size="lg"
      [iconStart]="sortIcon"
      [title]="ariaLabel()"
      (click)="onClick()"
    />
  `,
  styles: `
    :host ::ng-deep {
      ds-button button {
        background-color: var(--surface-primary) !important;
        border-color: var(--stroke-color-mid-emphasis) !important;
        color: var(--icon-high-emphasis) !important;

        &:hover {
          background-color: var(--surface-secondary) !important;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileSortButtonComponent {
  /** Current sort state (null if no sort applied) */
  readonly currentSort = input<DsSortState | null>(null);

  /** Emitted when button is clicked */
  readonly sortButtonClick = output<void>();

  /** Sort icon */
  protected readonly sortIcon = faArrowDownArrowUp;

  /** Whether there's an active sort */
  protected readonly hasActiveSort = computed(
    () => this.currentSort() !== null,
  );

  /** Accessible label for the button */
  protected readonly ariaLabel = computed(() => {
    const sort = this.currentSort();
    if (sort) {
      const direction = sort.direction === 'asc' ? 'ascending' : 'descending';
      return `Sort active: ${sort.field} ${direction}. Click to change sort.`;
    }
    return 'Open sort options';
  });

  protected onClick(): void {
    this.sortButtonClick.emit();
  }
}
