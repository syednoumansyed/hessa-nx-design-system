import {
  Component,
  ElementRef,
  computed,
  contentChild,
  inject,
  input,
  ViewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { IonPopover, IonContent, IonButton } from '@ionic/angular/standalone';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { SchoolStructureNavItemComponent } from '../school-structure-nav-item/school-structure-nav-item.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@layout/layout.service';
import { hasMultipleEntities } from '@shared/utils/school-structure';
import { TranslocoDirective } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import { randomId } from '@shared/utils/randomId';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-school-scope-selection-popover',
  templateUrl: './school-scope-selection-popover.component.html',
  styles: `
    ion-popover.hes-popover {
      // todo add variable for page padding
      --popover-width: calc(100% - 2rem);
      --empty-space: calc(100% - var(--popover-width));

      --width: var(--popover-width);
      &.ios {
        --offset-x: calc(var(--empty-space) / 2);
      }
      @media screen and (min-width: 480px) {
        --width: 25rem;
        --min-width: 25rem;
      }
    }
  `,
  standalone: true,
  imports: [
    HesIconComponent,
    FontAwesomeModule,
    HesCheckboxModule,
    SchoolStructureNavItemComponent,
    CommonModule,
    IonPopover,
    IonContent,
    TranslocoDirective,
    HesButtonModule,
  ],
})
export class SchoolScopeSelectionPopoverComponent {
  private readonly auth = inject(AuthService);
  @ViewChild('popover') popover: IonPopover;
  schoolStructureScope = inject(SchoolStructureScopeService);
  layoutService = inject(LayoutService);

  isMobile = isMobile();
  displayTargetRef = contentChild<ElementRef>('schoolScopeDisplayTarget');

  showClearBtn = input(true);
  isOpen = computed(() => {
    const isShow = this.layoutService.showSchoolScopeSelectionPopover();
    return isShow && this.isMainPopover();
  });
  public isStructureSelectionSaved =
    this.schoolStructureScope.isStructureSelectionSaved();
  targetId = randomId();
  isMainPopover = input<boolean>(false);

  filteredSchoolStructure =
    this.schoolStructureScope.userScopedSchoolStructureTillSchool;

  iconPath = computed(() => {
    return (
      this.schoolStructureScope.selectedSchoolStructureItem()?.hesIcon.src ??
      'assets/icons/company.svg'
    );
  });

  isDisabled = computed<boolean>(() => {
    const schoolStructure =
      this.schoolStructureScope.userScopedSchoolStructure();
    return (
      !hasMultipleEntities(schoolStructure, 'school') ||
      !this.auth.isUserPersonnel()
    );
  });

  OnPopoverDismiss() {
    this.layoutService.updateSchoolSelectionPopover(false);
    this.popover.dismiss();
  }

  isStructureDefaultSet(event: CustomEvent) {
    this.schoolStructureScope.setStructureSelectionSaved(event.detail.checked);
  }

  onClear() {
    this.schoolStructureScope.updateSelectedStructure(null); // Clear the selection
    this.OnPopoverDismiss();
  }
}
