import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkMenuModule } from '@angular/cdk/menu';
import { PopupItem } from '../types/popup.interface';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faChevronRight, faCheck } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'ds-submenu',
  standalone: true,
  imports: [CommonModule, CdkMenuModule, DsTranslatePipe, DsIconComponent],
  templateUrl: './ds-submenu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSubmenuComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: PopupItem[] = [];
  @Input() selectedValues: string[] = [];
  @Output() itemSelected = new EventEmitter<PopupItem>();

  private itemIdCounter = 0;
  private cdr = inject(ChangeDetectorRef);
  private selectionTimeout?: number;
  public checkIcon = faCheck;
  public arrowIcon = faChevronRight;
  get visibleItems(): PopupItem[] {
    return this.items.filter((item) => item.visible !== false);
  }
  ngOnInit() {
    this.processItems();
    this.updateSelection();
  }

  ngOnChanges() {
    this.processItems();
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    this.selectionTimeout = window.setTimeout(() => {
      this.updateSelection();
    }, 0);
  }

  public get overlayPosition() {
    const isRtl =
      document.dir === 'rtl' || document.documentElement.dir === 'rtl';

    return [
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'top',
        offsetX: isRtl ? -12 : 12,
      },
    ];
  }

  private processItems() {
    this.ensureItemIds(this.items);
  }

  private ensureItemIds(items: PopupItem[]) {
    items.forEach((item) => {
      if (!item.id) {
        item.id = `item-${++this.itemIdCounter}`;
      }
      if (item.children) {
        this.ensureItemIds(item.children);
      }
    });
  }

  private updateSelection() {
    if (!this.selectedValues || this.selectedValues.length === 0) return;

    this.clearAllSelections(this.items);

    this.selectedValues.forEach((value) => {
      this.setSelectedItem(this.items, value);
    });

    this.cdr.markForCheck();
  }

  private clearAllSelections(items: PopupItem[]) {
    items.forEach((item) => {
      item.selected = false;
      if (item.children) {
        this.clearAllSelections(item.children);
      }
    });
  }

  private setSelectedItem(items: PopupItem[], value: string): boolean {
    for (const item of items) {
      if (item.id === value) {
        item.selected = true;
        return true;
      }
      if (item.children && this.setSelectedItem(item.children, value)) {
        return true;
      }
    }
    return false;
  }

  private clearSiblingSelections(
    items: PopupItem[],
    selectedItemId: string,
    parentLevel: PopupItem[] = items,
  ) {
    for (const item of parentLevel) {
      if (item.id === selectedItemId) {
        parentLevel.forEach((sibling) => {
          if (sibling.id !== selectedItemId) {
            sibling.selected = false;
          }
        });
        return true;
      }
      if (item.children) {
        if (this.clearSiblingSelections(items, selectedItemId, item.children)) {
          return true;
        }
      }
    }
    return false;
  }

  hasChildren(item: PopupItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  trackByFn(index: number, item: PopupItem): any {
    return item.id || index;
  }

  onItemSelected(item: PopupItem): void {
    if (!item.id) return;

    if (item.action && typeof item.action === 'function') item.action();

    if (item.selectable) {
      this.clearSiblingSelections(this.items, item.id);
      item.selected = true;
    } else this.itemSelected.emit(item);
    this.cdr.markForCheck();
  }

  getItemClass(item: PopupItem): string {
    const classes = [];
    if (item.state && item.state !== 'default') {
      classes.push(item.state);
    }
    return classes.join(' ');
  }

  ngOnDestroy() {
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
  }

  protected getTextClasses(item: PopupItem): string[] {
    const classes: string[] = [];
    this.appendClasses(classes, item.textClass);
    if (item.state === 'success') {
      classes.push('text-content-success');
    }
    if (item.state === 'danger') {
      classes.push('text-content-error');
    }
    return classes;
  }

  protected getIconClasses(item: PopupItem): string[] {
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
      classes.push('text-icon-low');
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
}
