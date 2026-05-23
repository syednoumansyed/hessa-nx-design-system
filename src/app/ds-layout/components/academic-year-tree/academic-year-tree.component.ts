import {
  Component,
  computed,
  EventEmitter,
  inject,
  Output,
  signal,
  OnInit,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgIcon } from '@ng-icons/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { isRtl } from '@utils/platform';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';

@Component({
  standalone: true,
  selector: 'app-academic-year-tree',
  templateUrl: './academic-year-tree.component.html',
  imports: [NgIcon],
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
export class AcademicYearTreeComponent implements OnInit {
  private academicYearService = inject(AcademicYearsScopeService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  isRTL = isRtl();

  @Output() onAcademicYearSelection: EventEmitter<{
    semester: SemesterDTO;
    academicYear: AcademicYearItem;
  }> = new EventEmitter<{
    academicYear: AcademicYearItem;
    semester: SemesterDTO;
  }>();
  academicYears = this.academicYearService.academicYears;
  selectedSemester = this.academicYearService.selectedSemester;
  selectedAcademicYear = this.academicYearService.selectedAcademicYear;
  selectedSchoolScope = this.schoolStructureScope.selectedSchoolStructureItem;

  /* expand / collapse state */
  private expanded = signal<Set<number>>(new Set());

  // Computed property to auto-expand the year containing the selected semester
  private autoExpandedYears = computed(() => {
    const selectedSem = this.selectedSemester();
    const selectedAcademicYear = this.selectedAcademicYear();

    if (selectedSem && selectedAcademicYear) {
      return new Set([selectedAcademicYear.id]);
    }
    return new Set<number>();
  });

  // Combined expanded state (manual + auto)
  private allExpanded = computed(() => {
    const manual = this.expanded();
    const auto = this.autoExpandedYears();
    return new Set([...manual, ...auto]);
  });

  isExpanded = (id: number) => this.allExpanded().has(id);

  // Check if a semester is selected
  isSemesterSelected = (semesterId: string) => {
    const selectedSem = this.selectedSemester();
    return selectedSem?.id.toString() === semesterId.toString();
  };

  toggle(id: number) {
    const s = new Set(this.expanded());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expanded.set(s);
  }

  /* click on a semester */
  select(sem: SemesterDTO, academicYear: AcademicYearItem) {
    this.onAcademicYearSelection.emit({
      academicYear: academicYear,
      semester: sem,
    });
  }

  ngOnInit() {
    // Initialize expanded state with the selected academic year
    const selectedAcademicYear = this.selectedAcademicYear();
    if (selectedAcademicYear) {
      this.expanded.set(new Set([selectedAcademicYear.id]));
    }
  }
}
