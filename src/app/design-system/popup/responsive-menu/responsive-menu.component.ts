import { CommonModule, NgClass } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LayoutService } from '@layout/layout.service';
import { DsMenuComponent } from '../ds-menu.component';
import { PopupItem } from '../types/popup.interface';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIconComponent } from '@ds/icon/icon.component';
import { booleanAttribute } from '@angular/core';
import { DsModalService } from '@ds/modal';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'ds-responsive-menu',
  standalone: true,
  templateUrl: './responsive-menu.component.html',
  imports: [CommonModule, DsMenuComponent, DsIconComponent, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsResponsiveMenuComponent implements AfterContentInit {
  private readonly layoutService = inject(LayoutService);
  private readonly modalService = inject(DsModalService);

  @ContentChild(ElementRef) private projectedTrigger?: ElementRef<HTMLElement>;

  readonly items = input.required<ReadonlyArray<PopupItem>>();
  readonly selectedValues = input<ReadonlyArray<string>>([]);
  readonly triggerClass = input<string | ReadonlyArray<string> | null>(null);
  readonly triggerAriaLabel = input<string | null>(null);
  readonly triggerDisabled = input(false, { transform: booleanAttribute });
  readonly triggerType = input<'button' | 'div'>('button');
  readonly defaultTriggerIcon = input(faEllipsisVertical);

  readonly closeSheetOnSelect = input(true, {
    transform: booleanAttribute,
  });

  readonly menuOpened = output<void>();
  readonly menuClosed = output<void>();
  readonly itemSelected = output<PopupItem>();
  readonly selectedItemsChange = output<PopupItem[]>();

  protected readonly isMobileOrTablet = this.layoutService.isMobileOrTablet;
  protected readonly hasProjectedTrigger = signal(false);

  protected readonly desktopItems = computed(() => [...this.items()]);
  protected readonly desktopSelectedValues = computed(() => [
    ...this.selectedValues(),
  ]);

  protected readonly triggerClasses = computed(() => {
    const value = this.triggerClass();
    if (!value && !this.hasProjectedTrigger()) {
      return [
        'flex',
        'h-10',
        'w-10',
        'items-center',
        'justify-center',
        'rounded-ds-full',
        'bg-surface-action',
        'text-icon-high',
      ];
    }
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? [...value] : [value];
  });

  protected readonly visibleItems = computed(() =>
    this.items().filter((item) => item.visible !== false),
  );

  protected getItemTextClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    const hasCustomColor =
      !!item.textClass || item.state === 'success' || item.state === 'danger';
    this.appendClasses(classes, item.textClass);
    if (item.state === 'success') {
      classes.push('text-content-success');
    }
    if (item.state === 'danger') {
      classes.push('text-content-error');
    }
    if (!hasCustomColor) {
      classes.push('text-emphasis-high');
    }
    return classes;
  }

  protected getItemIconClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    const hasCustomColor =
      !!item.iconClass || item.state === 'success' || item.state === 'danger';
    this.appendClasses(classes, item.iconClass);
    if (item.state === 'success') {
      classes.push('text-icon-success');
    }
    if (item.state === 'danger') {
      classes.push('text-icon-error');
    }
    if (!hasCustomColor) {
      classes.push('text-emphasis-high');
    }
    return classes;
  }

  private appendClasses(
    target: string[],
    value?: string | ReadonlyArray<string> | null,
  ): void {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      target.push(value);
      return;
    }
    if (Array.isArray(value)) {
      target.push(...value.filter(Boolean));
    }
  }

  protected onTriggerClick(): void {
    if (!this.isMobileOrTablet()) {
      return;
    }
    if (this.triggerDisabled()) {
      return;
    }
    this.menuOpened.emit();
    void this.openMobileSheet();
  }

  protected onDesktopItemSelected(item: PopupItem): void {
    this.itemSelected.emit(item);
  }

  ngAfterContentInit(): void {
    this.hasProjectedTrigger.set(!!this.projectedTrigger);
  }

  private async openMobileSheet(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: DsResponsiveMenuSheetComponent,
      componentProps: {
        items: this.visibleItems(),
        closeOnSelect: this.closeSheetOnSelect(),
        onItemSelected: (item: PopupItem) => {
          if (item.action) {
            item.action();
          }
          this.itemSelected.emit(item);
          this.selectedItemsChange.emit([item]);
        },
      },
      size: 'lg',
      contentClass: 'p-0',
      backdropDismiss: true,
    });

    await modalRef.onDismiss();
    this.menuClosed.emit();
  }
}

@Component({
  selector: 'ds-responsive-menu-sheet',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsTranslatePipe],
  template: `
    <div class="flex flex-col gap-ds-sm px-ds-xl py-8">
      <div class="flex flex-col gap-ds-sm py-ds-xs">
        @for (item of items(); track item.id ?? item.title) {
          <button
            type="button"
            class="flex h-12 w-full items-center gap-ds-lg rounded-ds-md px-ds-2xl text-left transition-colors duration-150 ease-in-out"
            [ngClass]="getItemContainerClasses(item)"
            [disabled]="isItemDisabled(item)"
            (click)="onSelect(item)"
          >
            @if (item.icon) {
              <app-ds-icon
                [ngClass]="getItemIconClasses(item)"
                [icon]="item.icon"
                [size]="'xl'"
              ></app-ds-icon>
            }
            <span
              class="content-md-default"
              [ngClass]="getItemTextClasses(item)"
            >
              {{ item.title | dsTranslate }}
            </span>
          </button>
        }
      </div>
    </div>
  `,
})
export class DsResponsiveMenuSheetComponent implements DsModalContentComponent {
  readonly items = input.required<ReadonlyArray<PopupItem>>();
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  readonly onItemSelected = input<(item: PopupItem) => void>();
  closeModal?: (data?: unknown, role?: string) => void;

  protected isItemDisabled(item: PopupItem): boolean {
    return typeof item.disabled === 'function'
      ? item.disabled()
      : !!item.disabled;
  }

  protected getItemContainerClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    if (this.isItemDisabled(item)) {
      classes.push('opacity-40', 'cursor-not-allowed');
    } else if (item.selected) {
      classes.push('bg-success-50');
    } else {
      classes.push('hover:bg-surface-hover', 'focus-visible:bg-surface-hover');
    }
    return classes;
  }

  protected getItemTextClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    if (item.selected) {
      classes.push('text-content-success');
      return classes;
    }
    const hasCustomColor =
      !!item.textClass || item.state === 'success' || item.state === 'danger';
    this.appendClasses(classes, item.textClass);
    if (item.state === 'success') {
      classes.push('text-content-success');
    }
    if (item.state === 'danger') {
      classes.push('text-content-error');
    }
    if (!hasCustomColor) {
      classes.push('text-emphasis-high');
    }
    return classes;
  }

  protected getItemIconClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    if (item.selected) {
      classes.push('text-icon-success');
      return classes;
    }
    const hasCustomColor =
      !!item.iconClass || item.state === 'success' || item.state === 'danger';
    this.appendClasses(classes, item.iconClass);
    if (item.state === 'success') {
      classes.push('text-icon-success');
    }
    if (item.state === 'danger') {
      classes.push('text-icon-error');
    }
    if (!hasCustomColor) {
      classes.push('text-emphasis-high');
    }
    return classes;
  }

  protected onSelect(item: PopupItem): void {
    if (this.isItemDisabled(item)) return;
    this.onItemSelected()?.(item);
    if (this.closeOnSelect()) {
      this.closeModal?.(null, 'confirm');
    }
  }

  private appendClasses(
    target: string[],
    value?: string | ReadonlyArray<string> | null,
  ): void {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      target.push(value);
      return;
    }
    if (Array.isArray(value)) {
      target.push(...value.filter(Boolean));
    }
  }
}
