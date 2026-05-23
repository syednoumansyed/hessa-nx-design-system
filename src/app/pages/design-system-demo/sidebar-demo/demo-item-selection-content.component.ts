import { Component, inject, input, signal } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsSidebarService } from '@ds/sidebar';
import { DemoAddItemContentComponent } from './demo-add-item-content.component';
import { faPlus, faCheck } from '@fortawesome/pro-solid-svg-icons';

const AVAILABLE_ITEMS = [
  'Mathematics',
  'Science',
  'English',
  'Arabic',
  'History',
  'Geography',
  'Art',
  'Physical Education',
];

/**
 * Layer 2: Item selection list with an "Add New Item" action.
 * Opens as the second sidebar/modal-sheet in the stack.
 */
@Component({
  selector: 'app-demo-item-selection-content',
  standalone: true,
  imports: [DsButtonComponent, DsIconComponent],
  template: `
    <div class="flex flex-col gap-ds-lg">
      <ds-button
        variant="tertiary"
        size="md"
        [fullWidth]="true"
        [iconStart]="faPlus"
        (click)="openAddItem()"
      >
        Add New Item
      </ds-button>

      <div class="flex flex-col gap-ds-sm">
        @for (item of allItems(); track item) {
          <button
            type="button"
            class="flex w-full items-center gap-ds-md rounded-ds-md border px-ds-lg py-ds-md text-left transition-colors"
            [class.border-primary-base]="isSelected(item)"
            [class.bg-primary-ghost]="isSelected(item)"
            [class.border-stroke-cool-black-04]="!isSelected(item)"
            [class.hover:bg-bg-surface-secondary]="!isSelected(item)"
            (click)="toggleItem(item)"
          >
            <div
              class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-ds-sm border-2 transition-colors"
              [class.border-primary-base]="isSelected(item)"
              [class.bg-primary-base]="isSelected(item)"
              [class.border-stroke-cool-black-08]="!isSelected(item)"
            >
              @if (isSelected(item)) {
                <app-ds-icon [icon]="faCheck" size="xs" class="text-white" />
              }
            </div>
            <span class="content-md-default text-emphasis-high">{{
              item
            }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class DemoItemSelectionContentComponent {
  private sidebarService = inject(DsSidebarService);

  closeModal!: (data?: unknown, role?: string) => void;

  readonly selectedItems = input<string[]>([]);

  readonly allItems = signal<string[]>([...AVAILABLE_ITEMS]);
  private readonly selected = signal<Set<string>>(new Set());

  protected readonly faPlus = faPlus;
  protected readonly faCheck = faCheck;

  ngOnInit(): void {
    this.selected.set(new Set(this.selectedItems()));
  }

  isSelected(item: string): boolean {
    return this.selected().has(item);
  }

  toggleItem(item: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  async openAddItem(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: DemoAddItemContentComponent,
      headerConfig: {
        title: 'Add New Item',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Add' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
      closeBehavior: 'all',
    });

    const result = await ref.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const newItem = result.data as string;
      this.allItems.update((items) => [...items, newItem]);
      this.selected.update((s) => {
        const next = new Set(s);
        next.add(newItem);
        return next;
      });
    }
  }

  onPrimaryClick(): void {
    this.closeModal([...this.selected()], 'confirm');
  }

  onBackClick(): void {
    this.closeModal([...this.selected()], 'back');
  }

  onSecondaryClick(): void {
    this.closeModal([...this.selected()], 'back');
  }
}
