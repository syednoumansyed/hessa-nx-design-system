import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  inject,
  Input,
  computed,
  contentChild,
} from '@angular/core';
import { IonicModule, IonPopover, ModalController } from '@ionic/angular';
import { randomId } from '@utils/randomId';
import { LayoutService } from '@layout/layout.service';
import { AuthService } from '@auth/auth.service';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { AcademicYearTreeComponent } from '../academic-year-tree/academic-year-tree.component';
import { AcademicYearBottomSheetComponent } from '../academic-year-bottom-sheet/academic-year-bottom-sheet.component';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';

@Component({
  selector: 'ds-academic-year-selector',
  templateUrl: './academic-year-selector.component.html',
  styleUrls: ['./academic-year-selector.component.scss'],
  standalone: true,
  imports: [IonicModule, AcademicYearTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicYearSelectorComponent {
  /* DI */
  private modalCtrl = inject(ModalController);
  private auth = inject(AuthService);
  private layoutService = inject(LayoutService);
  private academicYearService = inject(AcademicYearsScopeService);

  academicYears = this.academicYearService.academicYears;
  selectedSemester = this.academicYearService.selectedSemester;
  selectedAcademicYear = this.academicYearService.selectedAcademicYear;

  /* view refs */
  @ViewChild('popover') popover!: IonPopover;
  displayTargetRef = contentChild<ElementRef>('academicYearDisplayTarget');

  /* state */
  isMobileOrTablet = this.layoutService.isMobileOrTablet;
  targetId = randomId();
  @Input() showClearBtn = true;

  isDisabled = computed(() => {
    return this.academicYears().length === 0;
  });

  /* handlers */
  async onTriggerClick() {
    if (this.isDisabled()) return;

    if (this.isMobileOrTablet()) {
      const modal = await this.modalCtrl.create({
        component: AcademicYearBottomSheetComponent,
        breakpoints: [0, 0.3, 0.5, 0.9], // Add more granular breakpoints
        initialBreakpoint: 0.5, // Start smaller
        cssClass: 'academic-year-sheet',
        canDismiss: true,
        handleBehavior: 'cycle',
        showBackdrop: true,
      });
      await modal.present();
    }
  }

  onPopoverDismiss() {
    this.layoutService.updateAcademicYearPopover(false);
  }

  onSemesterSelect(semester: SemesterDTO, academicYear: AcademicYearItem) {
    if (this.layoutService.isMobileOrTablet()) {
      this.modalCtrl.dismiss();
    } else {
      this.popover.dismiss();
    }
    this.academicYearService.updateSelectedSemester(semester);
    this.academicYearService.updateSelectedAcademicYear(academicYear);
  }
}
