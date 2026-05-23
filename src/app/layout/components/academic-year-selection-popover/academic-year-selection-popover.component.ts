import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
} from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { faCalendarDays } from '@fortawesome/pro-duotone-svg-icons';
import {
  IonPopover,
  IonContent,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { LayoutService } from '@layout/layout.service';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { TranslocoModule } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import { randomId } from '@shared/utils/randomId';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';

@Component({
  selector: 'app-academic-year-popover',
  standalone: true,
  imports: [
    IonLabel,
    IonItem,
    IonPopover,
    CommonModule,
    FontAwesomeModule,
    IonContent,
    IonAccordion,
    IonAccordionGroup,
    IonList,
    TranslocoModule,
  ],
  templateUrl: './academic-year-selection-popover.component.html',
  styleUrls: ['./academic-year-selection-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicYearSelectionPopoverComponent {
  isMainPopover = input<boolean>(false);
  faCalendarDays = faCalendarDays;
  faChevronDown = faChevronDown;
  isOpen = computed(() => {
    const isShow = this.layoutService.showAcademicYearPopover();
    return isShow && this.isMainPopover();
  });
  isMobile = isMobile();
  displayTargetRef = contentChild<ElementRef>('academicYearDisplayTarget');

  academicYears = this.academicYearService.academicYears;
  selectedSemester = this.academicYearService.selectedSemester;
  selectedAcademicYear = this.academicYearService.selectedAcademicYear;

  targetId = randomId();

  constructor(
    private layoutService: LayoutService,
    private academicYearService: AcademicYearsScopeService,
  ) {}

  OnPopoverDismiss() {
    this.layoutService.updateAcademicYearPopover(false);
  }

  onSemesterSelect(semester: SemesterDTO, academicYear: AcademicYearItem) {
    this.academicYearService.updateSelectedSemester(semester);
    this.academicYearService.updateSelectedAcademicYear(academicYear);
  }
}
