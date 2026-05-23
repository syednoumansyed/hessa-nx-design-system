import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';
import { IResponse } from '@shared/interfaces';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { closestTo, isWithinInterval, parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearsScopeService {
  private _academicYears = signal<AcademicYearItem[]>([]);
  public readonly academicYears = this._academicYears.asReadonly();

  public createSemestersByAcademicYearId = computed(() => {
    return (academicYearId: number) => {
      const academicYear = this.academicYears().find(
        (i) => i.id === academicYearId,
      );
      return academicYear?.semesters ?? [];
    };
  });

  public AcademicYearsListing = computed(() =>
    this.academicYears().map((item) => ({
      value: item.id,
      displayedValue: item.name,
    })),
  );
  private _selectedAcademicYear = signal<AcademicYearItem | null>(null);
  public readonly selectedAcademicYear =
    this._selectedAcademicYear.asReadonly();

  public readonly selectedAcademicYearSemesters =
    computed<Array<SemesterDTO> | null>(
      () => this.selectedAcademicYear()?.semesters ?? null,
    );

  public readonly currentOrNearestAcademicYear = computed(() => {
    return this.findCurrentOrNearestAcademicYearOrSemester(
      this.academicYears(),
    );
  });

  private _selectedSemester = signal<SemesterDTO | null>(null);
  public readonly selectedSemester = this._selectedSemester.asReadonly();

  constructor(private http: HttpClient) {}

  fetchAllAcademicYears() {
    return this.http.get<IResponse<AcademicYearItem[]>>(
      `${ApiUrl.v1BE}/academic-years/all`,
    );
  }

  updateAcademicYearsListing(academicYears: AcademicYearItem[]) {
    this._academicYears.set(academicYears);
  }

  updateSelectedAcademicYear(academicYear: AcademicYearItem) {
    this._selectedAcademicYear.set(academicYear);
  }

  updateSelectedAcademicYearbyId(academicYearId: number) {
    const academicYear = this.academicYears().find(
      (i) => i.id === academicYearId,
    );
    this._selectedAcademicYear.set(academicYear ?? null);
  }

  updateSelectedSemester(semester: SemesterDTO) {
    this._selectedSemester.set(semester);
  }

  findAcademicYearBySemesterId(semesterId: number) {
    return this._academicYears().find((i: AcademicYearItem) => {
      return i.semesters.find(
        (semester) => semester.id.toString() === semesterId.toString(),
      );
    });
  }

  findCurrentOrNearestAcademicYearOrSemester<
    T extends SemesterDTO | AcademicYearItem,
  >(array: T[]): T | undefined {
    const today = new Date();
    const currentInterval = array.find((interval) =>
      isWithinInterval(today, {
        start: parseISO(interval.startDate),
        end: parseISO(interval.endDate),
      }),
    );
    if (currentInterval) {
      return currentInterval;
    }

    const endDates = array.map((interval) => parseISO(interval.endDate));
    const nearestEndDate = closestTo(today, endDates);

    return array.find(
      (interval) => interval.endDate === nearestEndDate?.toISOString(),
    );
  }

  isCurrentSelectedAcademicYearActive() {
    const selectedAcademicYear = this.selectedAcademicYear();
    if (selectedAcademicYear) {
      const today = new Date();
      return isWithinInterval(today, {
        start: parseISO(selectedAcademicYear.startDate),
        end: parseISO(selectedAcademicYear.endDate),
      });
    } else return false;
  }

  resetState() {
    this._academicYears.set([]);
    this._selectedAcademicYear.set(null);
    this._selectedSemester.set(null);
  }
}
