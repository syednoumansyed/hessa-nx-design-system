import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { Router, RouterModule } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';

@Component({
  selector: 'app-school-structure-nav-item',
  templateUrl: './school-structure-nav-item.component.html',
  styleUrls: ['./school-structure-nav-item.component.scss'],
  standalone: true,
  imports: [CommonModule, HesIconComponent, RouterModule],
})
export class SchoolStructureNavItemComponent implements OnInit {
  isMobile = isMobile();

  showChildren = signal(false);

  layoutService = inject(LayoutService);
  schoolStructureScope = inject(SchoolStructureScopeService);
  router = inject(Router);

  selectedSchoolScope = this.schoolStructureScope.selectedSchoolStructureItem;

  collapseIcon = signal({
    src: 'assets/icons/collapse.svg',
    class: 'text-2xl',
  });

  expandIcon = signal({
    src: 'assets/icons/expand.svg',
    class: 'text-2xl',
  });

  @Input() item: sideMenuSchoolStructureItem;
  @Input() firstLevel: boolean = false;
  @Input() isCollapsed: boolean = false;
  @Input() expand: boolean = false;
  @Input() isNavItem: boolean = true;
  @Input() onClickItem: (item: sideMenuSchoolStructureItem) => void;

  isScopeSelected = computed(() => {
    return this.selectedSchoolScope()?.path === this.item.path;
  });

  ngOnInit(): void {
    if (this.router.url === '/' + this.item.path) {
      this.toggleShowChildren();
    }
    this.showChildren.set(this.isChildSelected(this.item));
  }

  toggleShowChildren() {
    this.showChildren.set(!this.showChildren());
  }

  handleClick() {
    this.toggleShowChildren();
    if (!this.onClickItem) {
      if (!this.isNavItem && this.item.hasAccess) {
        this.schoolStructureScope.updateSelectedStructure(this.item);
      }
    } else {
      this.onClickItem(this.item);
    }
  }

  isChildSelected(item: sideMenuSchoolStructureItem): boolean {
    const selectedScope = this.selectedSchoolScope();

    // If the selected scope is a company or the current item is a school, return false early
    if (selectedScope?.type === 'company' || item.type === 'school') {
      return false;
    }

    // Use early return when the path matches or a child is selected
    return item.children.some(
      (childItem) =>
        childItem.path === selectedScope?.path ||
        this.isChildSelected(childItem),
    );
  }

  onRouterLinkActive(isActive: boolean) {
    if (isActive && this.isNavItem) {
      this.layoutService.setSelectedSchoolStructureNavItem(this.item);
    }
  }
}
