import { Component, computed, inject, Input } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { isRtl } from '@shared/utils/platform';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';
import {
  findItemWithParents,
  StructureDepth,
} from '@shared/utils/school-structure';
import { ModalController } from '@ionic/angular/standalone';
import { SchoolSelectorBottomSheetComponent } from '../school-selector-bottom-sheet/school-selector-bottom-sheet.component';

@Component({
  selector: 'app-selected-school-info',
  standalone: true,
  imports: [DsIconComponent],
  template: `
    @if (isMobileOrTablet() && isVisible() && selectedSchoolInfo()) {
      <div
        class="cursor-pointer border-b border-t bg-white px-4 py-3"
        (click)="openSchoolSelector()"
      >
        <div class="flex items-center gap-ds-md">
          <app-ds-icon
            [icon]="'school-duotone-lg'"
            [cssClass]="'text-surface-pastel-foreground-indigo'"
            size="40"
          ></app-ds-icon>

          <div class="min-w-0 flex-1">
            @if (companyCampusLabel()) {
              <p class="content-md-mid-emphasis truncate text-emphasis-mid">
                {{ companyCampusLabel() }}
              </p>
            }
            @if (selectedSchoolInfo()?.school) {
              <p class="heading-h5-high-emphasis truncate text-emphasis-high">
                {{ selectedSchoolInfo()?.school }}
              </p>
            }
          </div>

          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-pastels-purple-200"
          >
            <app-ds-icon
              [icon]="isRtl ? faChevronLeft : faChevronRight"
              [cssClass]="'text-emphasis-high'"
              size="md"
            ></app-ds-icon>
          </div>
        </div>
      </div>
    }
  `,
})
export class SelectedSchoolInfoComponent {
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly layoutService = inject(LayoutService);
  private readonly modalController = inject(ModalController);

  /** Optional max depth for the school structure selector. If not provided, shows full depth. */
  @Input() maxDepth?: StructureDepth;

  protected readonly isRtl = isRtl();
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faChevronRight = faChevronRight;

  readonly isMobileOrTablet = this.layoutService.isMobileOrTablet;
  readonly isVisible = this.layoutService.isSelectedSchoolInfoVisible;

  readonly selectedSchoolInfo = computed(() => {
    const selectedItem =
      this.schoolStructureScopeService.selectedSchoolStructureItem();
    if (!selectedItem) return null;

    const structure =
      this.schoolStructureScopeService.userScopedSchoolStructure();
    const hierarchy = findItemWithParents(structure, selectedItem);

    if (!hierarchy || hierarchy.length === 0) return null;

    let company: string | null = null;
    let campus: string | null = null;
    let school: string | null = null;

    for (const item of hierarchy) {
      if (item.type === 'company' || item.type === 'sub-company') {
        company = item.name;
      } else if (item.type === 'campus') {
        campus = item.name;
      } else if (item.type === 'school') {
        school = item.name;
      }
    }

    return { company, campus, school };
  });

  protected readonly companyCampusLabel = computed(() => {
    const info = this.selectedSchoolInfo();
    if (!info) return null;

    const { company, campus } = info;
    if (company && campus) {
      return `${company} - ${campus}`;
    }
    return company || campus || null;
  });

  async openSchoolSelector(): Promise<void> {
    const modal = await this.modalController.create({
      component: SchoolSelectorBottomSheetComponent,
      componentProps: {
        maxDepth: this.maxDepth,
      },
      breakpoints: [0, 0.4, 0.6, 0.8, 1],
      initialBreakpoint: 0.8,
      handle: true,
      handleBehavior: 'cycle',
      showBackdrop: true,
      cssClass: 'school-selector-sheet',
    });
    await modal.present();
  }
}
