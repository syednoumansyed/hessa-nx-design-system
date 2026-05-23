import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  TemplateRef,
  inject,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupItem } from './types/popup.interface';
import { DsSubmenuComponent } from './ds-submenu-component/ds-submenu.component';
import { CdkMenuModule, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faChevronRight, faCheck } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'ds-menu',
  standalone: true,
  imports: [
    CommonModule,
    DsSubmenuComponent,
    CdkMenuModule,
    DsIconComponent,
    DsTranslatePipe,
    CdkMenuTrigger,
  ],
  templateUrl: './ds-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMenuComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() items: PopupItem[] = [];
  @Input() menuPosition: ConnectedPosition[] | undefined;
  @Input() selectedValues: string[] = []; // Changed to array for multiple values
  @Output() itemSelected = new EventEmitter<PopupItem>();
  @Output() selectedItemsChange = new EventEmitter<PopupItem[]>(); // Changed to array
  @Output() menuOpened = new EventEmitter<void>();
  @Output() menuClosed = new EventEmitter<void>();
  @ViewChild(CdkMenuTrigger) menuTrigger!: CdkMenuTrigger;
  public isMenuOpen = false;

  @ViewChildren('submenuTemplate', { read: TemplateRef })
  submenuTemplates!: QueryList<TemplateRef<any>>;
  flattenedItems: PopupItem[] = [];
  submenuRefs = new Map<string, TemplateRef<any>>();
  private itemIdCounter = 0;
  private cdr = inject(ChangeDetectorRef);
  private selectionTimeout?: number;
  protected readonly scrollStrategy =
    inject(Overlay).scrollStrategies.reposition();
  public arrowIcon = faChevronRight;
  public checkIcon = faCheck;

  get visibleItems(): PopupItem[] {
    return this.items.filter((item) => item.visible !== false);
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

  ngOnInit() {
    this.processItems();
    this.updateSelection();
  }

  ngAfterViewInit() {
    this.updateSubmenuRefs();
    this.checkForMenuTrigger();

    // Rebuild submenu refs when templates change (e.g. items added dynamically)
    this.submenuTemplates.changes.subscribe(() => {
      this.updateSubmenuRefs();
      this.cdr.markForCheck();
    });
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

  private checkForMenuTrigger() {
    if (this.menuTrigger) {
      this.menuTrigger.opened.subscribe(() => {
        this.isMenuOpen = true;
        this.menuOpened.emit();
        this.cdr.markForCheck();
      });

      this.menuTrigger.closed.subscribe(() => {
        this.isMenuOpen = false;
        this.menuClosed.emit();
        this.cdr.markForCheck();
      });
    }
  }

  private updateSubmenuRefs() {
    this.submenuRefs.clear();
    const itemsWithChildren = this.items.filter((item) =>
      this.hasChildren(item),
    );
    this.submenuTemplates.forEach((template, index) => {
      if (itemsWithChildren[index]) {
        this.submenuRefs.set(itemsWithChildren[index].id!, template);
      }
    });
  }

  private processItems() {
    this.flattenedItems = this.flattenItems(this.items);
    this.ensureItemIds(this.items);
  }

  private flattenItems(items: PopupItem[]): PopupItem[] {
    const flattened: PopupItem[] = [];
    items.forEach((item) => {
      flattened.push(item);
      if (item.children) {
        flattened.push(...this.flattenItems(item.children));
      }
    });
    return flattened;
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

    // Clear all selections first
    this.clearAllSelections(this.items);

    // Set each selected value
    this.selectedValues.forEach((value) => {
      this.setSelectedItem(this.items, value);
    });

    // Emit the selected items whenever selection updates
    const selectedItems = this.getSelectedItems();
    this.selectedItemsChange.emit(selectedItems);

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

  // New method: Clear selection only within the same submenu level
  private clearSiblingSelections(
    items: PopupItem[],
    selectedItemId: string,
    parentLevel: PopupItem[] = items,
  ) {
    // Find the selected item and its siblings
    for (const item of parentLevel) {
      if (item.id === selectedItemId) {
        // Clear selections of siblings at this level
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

      const currentSelections = this.getSelectedItems();
      this.selectedValues = currentSelections.map((i) => i.id!);

      this.itemSelected.emit(item);
      this.selectedItemsChange.emit(currentSelections);
    } else {
      this.itemSelected.emit(item);
    }

    this.cdr.markForCheck();
  }

  getItemClass(item: PopupItem): string {
    const classes = [];
    if (item.state && item.state !== 'default') {
      classes.push(item.state);
    }
    return classes.join(' ');
  }

  public getSelectedItems(): PopupItem[] {
    const selected: PopupItem[] = [];
    this.findSelectedItems(this.items, selected);
    return selected;
  }

  private findSelectedItems(items: PopupItem[], selected: PopupItem[]) {
    items.forEach((item) => {
      if (item.selected) {
        selected.push(item);
      }
      if (item.children) {
        this.findSelectedItems(item.children, selected);
      }
    });
  }

  public getSelectedItem(): PopupItem | null {
    const selectedItems = this.getSelectedItems();
    return selectedItems.length > 0 ? selectedItems[0] : null;
  }

  public getSelectedItemTitle(): string {
    const selectedItem = this.getSelectedItem();
    return selectedItem ? selectedItem.title : '';
  }

  public getSelectedItemsByCategory(): { [key: string]: PopupItem } {
    const result: { [key: string]: PopupItem } = {};
    this.findSelectedItemsByCategory(this.items, result, []);
    return result;
  }

  private findSelectedItemsByCategory(
    items: PopupItem[],
    result: { [key: string]: PopupItem },
    path: string[],
  ) {
    items.forEach((item) => {
      if (item.selected) {
        const categoryPath = path.length > 0 ? path.join('.') : 'root';
        result[categoryPath] = item;
      }
      if (item.children) {
        this.findSelectedItemsByCategory(item.children, result, [
          ...path,
          item.id || item.title,
        ]);
      }
    });
  }

  onMenuOpened(): void {
    this.isMenuOpen = true;
    this.menuOpened.emit();
  }

  onMenuClosed(): void {
    this.isMenuOpen = false;
    this.menuClosed.emit();
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
