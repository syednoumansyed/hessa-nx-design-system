import {
  Component,
  OnInit,
  computed,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  contentChild,
  Input,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { IonicModule, IonPopover, ModalController } from '@ionic/angular';
import { AuthService } from '@auth/auth.service';
import { randomId } from '@shared/utils/randomId';
import { hasMultipleEntities } from '@utils/school-structure';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { SchoolSelectorBottomSheetComponent } from '../school-selector-bottom-sheet/school-selector-bottom-sheet.component';
import { SchoolStructureTreeComponent } from '../school-structure-tree/school-structure-tree.component';

@Component({
  selector: 'app-school-selector',
  templateUrl: './school-selector.component.html',
  styleUrls: ['./school-selector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    HesIconComponent,
    TranslocoDirective,
    SchoolStructureTreeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class SchoolSelectorComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    // Remove all the navigation mode logic
  }

  /* ------------- DI + refs ------------- */
  readonly schoolStructureScope = inject(SchoolStructureScopeService);
  readonly layoutService = inject(LayoutService);
  readonly auth = inject(AuthService);
  private readonly modalCtrl = inject(ModalController);

  @ViewChild('popover') popover!: IonPopover;
  displayTargetRef = contentChild<ElementRef>('schoolScopeDisplayTarget');

  /* ------------- UI state ------------- */
  isMobileOrTablet = this.layoutService.isMobileOrTablet;
  targetId = randomId();
  showClearBtn = true;
  @Input() isMainPopover = false;
  @Input() displayMode: 'popover' | 'bottomsheet' = 'popover';
  @Input() side = 'end'; // Default side for popover, can be overridden
  @Input() alignment = 'start';

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

  isStructureSelectionSaved =
    this.schoolStructureScope.isStructureSelectionSaved();

  /* ------------- events ------------- */
  onPopoverDismiss() {
    this._isOpen.set(false);
    this.layoutService.updateSchoolSelectionPopover(false);
  }

  onClear() {
    this.schoolStructureScope.updateSelectedStructure(null);
    this.popover.dismiss();
  }

  onItemClick(item: any) {
    this.schoolStructureScope.updateSelectedStructure(item);
    this.popover.dismiss();
  }

  // trigger click handler
  async onTriggerClick(ev: Event) {
    if (this.isDisabled()) {
      return;
    }
    if (this.isMobileOrTablet()) {
      // 👉 bottom-sheet
      const modal = await this.modalCtrl.create({
        component: SchoolSelectorBottomSheetComponent,
        breakpoints: [0, 0.4, 0.6, 0.8, 1],
        initialBreakpoint: 0.8,
        handle: true,
        handleBehavior: 'cycle',
        showBackdrop: true,
        cssClass: 'school-selector-sheet', // customise in global.scss
      });
      await modal.present();
    }
  }

  ngOnDestroy(): void {
    // Close any open popover when component is destroyed
    if (this.popover) {
      try {
        this.popover.dismiss();
      } catch (error) {
        // Handle case where popover is already dismissed or doesn't exist
        console.debug(
          'School selector popover already dismissed or not found:',
          error,
        );
      }
    }

    // Reset internal state
    this._isOpen.set(false);

    // Ensure layout service state is also reset
    this.layoutService.updateSchoolSelectionPopover(false);
  }
}
