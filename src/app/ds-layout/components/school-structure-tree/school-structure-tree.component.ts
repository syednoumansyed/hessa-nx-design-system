import {
  Component,
  computed,
  contentChild,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { DsCheckboxComponent } from '../../../design-system/checkbox/checkbox.component';
import { DsSchoolStructureNavItemComponent } from '../ds-school-structure-nav-item/ds-school-structure-nav-item.component';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { IonicModule, IonPopover, ModalController } from '@ionic/angular';
import { NgClass, NgIf } from '@angular/common';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';
import { Router } from '@angular/router';
import { randomId } from '@utils/randomId';
import { hasMultipleEntities, StructureDepth } from '@utils/school-structure';
import { isMobile } from '@utils/platform';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';

@Component({
  selector: 'app-school-structure-tree',
  templateUrl: './school-structure-tree.component.html',
  standalone: true,
  imports: [
    DsCheckboxComponent,
    DsSchoolStructureNavItemComponent,
    HessaBtnDirective,
    IonicModule,
    NgIf,
    NgClass,
    TranslocoDirective,
    TranslocoPipe,
  ],
})
export class SchoolStructureTreeComponent implements OnInit {
  /* ------------- DI + refs ------------- */
  private readonly auth = inject(AuthService);
  readonly schoolStructureScope = inject(SchoolStructureScopeService);
  @Input() onClose?: () => void;

  @Output() close = new EventEmitter<void>();
  @Output() selectionComplete = new EventEmitter<sideMenuSchoolStructureItem>();
  @Input() scopeSelection = false;
  /** Optional max depth for the tree. If not provided, shows full depth. */
  @Input() maxDepth?: StructureDepth;

  displayTargetRef = contentChild<ElementRef>('schoolScopeDisplayTarget');

  /* ------------- UI state ------------- */
  isMobile = isMobile();
  targetId = randomId();
  showClearBtn = true;

  // Internal state for programmatic control
  private _isOpen = signal(false);

  iconPath = computed(
    () =>
      this.schoolStructureScope.selectedSchoolStructureItem()?.hesIcon.src ??
      'assets/icons/company.svg',
  );

  isDisabled = computed(() => {
    const s = this.schoolStructureScope.userScopedSchoolStructure();
    return !hasMultipleEntities(s, 'school') || !this.auth.isUserPersonnel();
  });

  /* ------------- data ------------- */
  getFilteredSchoolStructure(): sideMenuSchoolStructureItem[] {
    if (this.maxDepth !== undefined) {
      return this.schoolStructureScope.getUserScopedSchoolStructureTillDepth(
        this.maxDepth,
      );
    }
    return this.schoolStructureScope.userScopedSchoolStructure();
  }

  isStructureSelectionSaved =
    this.schoolStructureScope.isStructureSelectionSaved();

  constructor() {}

  ngOnInit() {}

  onClear() {
    this.schoolStructureScope.updateSelectedStructure(null);
  }

  isStructureDefaultSet(event: boolean) {
    this.schoolStructureScope.setStructureSelectionSaved(event);
  }

  dismiss() {
    if (this.onClose) {
      this.onClose();
    }
    this.close.emit();
  }
}
