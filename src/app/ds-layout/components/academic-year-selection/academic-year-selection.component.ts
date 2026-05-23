import { Component, inject, input, OnInit } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'ds-academic-year-selection',
  templateUrl: './academic-year-selection.component.html',
  styleUrls: ['./academic-year-selection.component.scss'],
  standalone: true,
  imports: [NgIcon, NgClass, TranslocoPipe],
})
export class AcademicYearSelectionComponent implements OnInit {
  private academicYearsScopeService = inject(AcademicYearsScopeService);

  selectedAcademicYear = this.academicYearsScopeService.selectedAcademicYear;
  selectedSemester = this.academicYearsScopeService.selectedSemester;
  collapsed = input<boolean>(false);

  constructor() {}

  ngOnInit() {}
}
