import {
  Component,
  Input,
  OnInit,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgIcon } from '@ng-icons/core';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-ds-school-structure-nav-item',
  templateUrl: './ds-school-structure-nav-item.component.html',
  styleUrls: ['./ds-school-structure-nav-item.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, NgClass],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class DsSchoolStructureNavItemComponent implements OnInit {
  /* ------------ Inputs ------------ */
  @Input({ required: true }) item!: sideMenuSchoolStructureItem;
  @Input() firstLevel = false;
  @Input() isLastSibling = false;
  @Input() isCollapsed = false;
  @Input() expand = false;
  @Input() isNavItem = true;
  @Input() onClickItem?: (item: sideMenuSchoolStructureItem) => void;
  @Input() disabled = false;
  @Input() scopeSelection = false;

  @Output() selectionComplete = new EventEmitter<sideMenuSchoolStructureItem>();
  @Output() close = new EventEmitter<void>();

  /* ------------ State ------------ */
  isMobile = isMobile();
  showChildren = signal(false);

  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  selectedSchoolScope = this.schoolStructureScope.selectedSchoolStructureItem;

  /* icon fallbacks */
  collapseIcon = { src: 'assets/icons/collapse.svg', class: 'text-2xl' };
  expandIcon = { src: 'assets/icons/expand.svg', class: 'text-2xl' };

  /* ------------ Computed ------------ */
  isScopeSelected = computed(
    () => this.selectedSchoolScope()?.path === this.item.path,
  );

  // Auto-expand if this node contains the selected item
  shouldAutoExpand = computed(() => {
    return this.isChildSelected(this.item) || this.isScopeSelected();
  });

  /* ------------ Lifecycle ------------ */
  ngOnInit() {
    if (this.router.url === '/' + this.item.path) {
      this.showChildren.set(true);
    }
    if (this.expand) {
      this.showChildren.set(this.isChildSelected(this.item));
    }

    // Auto-expand if this node contains the selected item
    if (this.shouldAutoExpand()) {
      this.showChildren.set(true);
    }
  }

  /* ------------ UI helpers ------------ */
  toggleShowChildren() {
    this.showChildren.set(!this.showChildren());
  }

  isChildSelected(item: sideMenuSchoolStructureItem): boolean {
    const selectedScope = this.selectedSchoolScope();

    // If no selected scope, return false
    if (!selectedScope) {
      return false;
    }

    // If the selected scope is a company or the current item is a school, return false early
    if (selectedScope?.type === 'company' || item.type === 'school') {
      return false;
    }

    // Check if any child matches the selected scope or contains it
    return (
      item.children?.some(
        (childItem) =>
          childItem.path === selectedScope?.path ||
          this.isChildSelected(childItem),
      ) ?? false
    );
  }

  toggleChildren(event: Event) {
    event.stopPropagation(); // Prevent event bubbling to parent click handler
    this.toggleShowChildren();
  }

  handleClick() {
    // Block selection if disabled OR item.hasAccess is false
    if (this.disabled || !this.item.hasAccess) {
      return;
    }

    if (!this.onClickItem) {
      if (!this.isNavItem && this.item.hasAccess) {
        if (this.scopeSelection) {
          this.schoolStructureScope.updateSelectedStructure(this.item);
          this.selectionComplete.emit(this.item);
        } else {
          this.layoutService.setSelectedSchoolStructureNavItem(this.item);
          this.router.navigate(['/' + this.item.path]);
          this.close.emit();
        }
      }
    } else {
      this.onClickItem(this.item);
    }
  }

  /* recursive helper */
  childDisabled(child: sideMenuSchoolStructureItem) {
    return !child.hasAccess;
  }
}
