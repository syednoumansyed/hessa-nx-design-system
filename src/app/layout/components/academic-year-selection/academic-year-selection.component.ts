import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { LayoutService } from '@layout/layout.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { saxCalendarBulk } from '@ng-icons/iconsax/bulk';
@Component({
  selector: 'app-academic-year-selection',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: `./academic-year-selection.component.html`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ saxCalendarBulk })],
})
export class AcademicYearSelectionComponent implements OnInit {
  selectedAcademicYear = this.academicYearsScopeService.selectedAcademicYear;
  selectedSemester = this.academicYearsScopeService.selectedSemester;
  collapsed = input<boolean>(false);

  constructor(
    private academicYearsScopeService: AcademicYearsScopeService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {}
}
