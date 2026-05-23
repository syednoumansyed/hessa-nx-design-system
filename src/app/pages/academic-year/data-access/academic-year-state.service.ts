import { Injectable, inject, signal, computed } from '@angular/core';
import {
  AcademicYearDTO,
  CreateAcademicYearPayloadDTO,
  GlobalHolidayDTO,
  HolidayDTO,
  HolidayPayloadDTO,
  SemesterDTO,
  SemesterPayloadDTO,
} from './academic-year.dto';
import { ListDTO } from '../components/item-list-card/item-list-card.component';
import { AcademicYearApiService } from './academic-year-api.service';
import { TuiDialogContext } from '@taiga-ui/core';
import { TranslocoService } from '@jsverse/transloco';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { isAfter, isBefore, startOfDay } from 'date-fns';

export interface MappedAcademicYearDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class AcademicYearStateService {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly academicYearApiService = inject(AcademicYearApiService);
  private readonly translocoService = inject(TranslocoService);
  private readonly hesToasterService = inject(HesToasterService);

  // Private signals for state management
  private readonly _pastAcademicYears = signal<AcademicYearDTO[]>([]);
  private readonly _globalHolidays = signal<GlobalHolidayDTO[]>([]);
  private readonly _academicYear = signal<MappedAcademicYearDTO | null>(null);
  private readonly _semesterListData = signal<SemesterDTO[]>([]);
  private readonly _mappedSemesterListData = computed(() => {
    return this.semesterToListDTO(this._semesterListData());
  });
  private readonly _holidaysListData = signal<HolidayDTO[]>([]);
  private readonly _mappedHolidaysListData = computed(() => {
    return this.holidayToListDTO(this._holidaysListData());
  });

  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly pastAcademicYears = this._pastAcademicYears.asReadonly();
  readonly globalHolidays = this._globalHolidays.asReadonly();
  readonly academicYear = this._academicYear.asReadonly();
  readonly semesterListData = this._semesterListData.asReadonly();
  readonly mappedSemesterListData = this._mappedSemesterListData;
  readonly holidaysListData = this._holidaysListData.asReadonly();
  readonly mappedHolidaysListData = this._mappedHolidaysListData;
  readonly isAcademicYearEnded = computed(() => {
    const academicYear = this.academicYear();
    if (!academicYear) return false;
    const endExclusive = new Date(academicYear.endDate);
    const today = startOfDay(new Date());
    const endExclusiveDay = startOfDay(endExclusive);
    return !isBefore(today, endExclusiveDay);
  });

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly hasData = computed(() => this._academicYear() !== null);
  readonly semesterCount = computed(() => this._semesterListData().length);
  readonly holidayCount = computed(() => this._holidaysListData().length);

  currentLang = computed(() => {
    return this.translocoService.getActiveLang();
  });

  fetchGlobalHolidays() {
    this.academicYearApiService.getAllGlobalHolidays().subscribe({
      next: (resp) => {
        this._globalHolidays.set(resp);
      },
      error: () => {
        this._globalHolidays.set([]);
      },
    });
  }

  fetchAllPastAcademicYears() {
    this.academicYearApiService.getAllAcademicYears(true).subscribe({
      next: (resp) => {
        this._pastAcademicYears.set(resp.data);
      },
      error: () => {
        this._pastAcademicYears.set([]);
      },
    });
  }

  fetchAcademicYearData(academicYearId: string = 'current') {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService
      .fetchAcademicYearById(academicYearId)
      .subscribe({
        next: (resp) => {
          this.mapAndSetData(resp);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._academicYear.set(null);
          this._semesterListData.set([]);
          this._holidaysListData.set([]);
          this._error.set('Failed to fetch academic year data');
          this._isLoading.set(false);
        },
      });
  }

  manageRouterNavigation(
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    if (context) {
      context.completeWith(true);
    } else {
      router.navigate(['/academic-year']);
    }
  }

  addAcademicYear(
    payload: CreateAcademicYearPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.addAcademicYear(payload).subscribe({
      next: (resp) => {
        this.fetchAcademicYearData(resp.data.id.toString());
        this.hesToasterService.success(
          this.hesTranslateService.t(
            'academic_year.academic_year_created_successfully.alert',
          ),
        );
        this.manageRouterNavigation(context, router);
      },
      error: (err) => {
        this._error.set('Failed to add academic year');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  updateAcademicYear(
    academicId: string,
    payload: CreateAcademicYearPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService
      .updateAcademicYear(academicId, payload)
      .subscribe({
        next: (resp) => {
          this.fetchAcademicYearData(resp.data.id.toString());
          this.hesToasterService.success(
            this.hesTranslateService.t('api.academic.year.created'),
          );
          this._isLoading.set(false);
          this.manageRouterNavigation(context, router);
        },
        error: (err) => {
          this._error.set('Failed to update academic year');
          this._isLoading.set(false);
          this.hesToasterService.showBackendError(err);
        },
      });
  }

  addSemester(
    payload: SemesterPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.addSemester(payload).subscribe({
      next: (resp) => {
        const data = resp.data;
        this.addSemesterToState(data);
        this._isLoading.set(false);
        this.hesToasterService.success(
          this.hesTranslateService.t('api.semesters.found'),
        );
        this.manageRouterNavigation(context, router);
      },
      error: (err) => {
        this._error.set('Failed to add semester');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  updateSemester(
    semesterId: string,
    payload: SemesterPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.updateSemester(semesterId, payload).subscribe({
      next: (resp) => {
        const data = resp.data;
        this.updateSemesterInState(data);
        this._isLoading.set(false);
        this.hesToasterService.success(
          this.hesTranslateService.t('api.semester.updated'),
        );
        this.manageRouterNavigation(context, router);
      },
      error: (err) => {
        this._error.set('Failed to update semester');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  deleteSemester(semesterId: string, context?: TuiDialogContext<any, any>) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.deleteSemester(Number(semesterId)).subscribe({
      next: () => {
        this.removeSemesterFromState(semesterId);
        this._isLoading.set(false);
        this.hesToasterService.success(
          this.hesTranslateService.t(
            'academic_enrolment.delete_semester_successfully.txt',
          ),
        );
        if (context) {
          context.completeWith(true);
        }
      },
      error: (err) => {
        this._error.set('Failed to delete semester');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  addHoliday(
    payload: HolidayPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.addHoliday(payload).subscribe({
      next: (resp) => {
        const data = resp.data;
        this.addHolidayToState(data);
        this._isLoading.set(false);

        this.hesToasterService.success(
          this.hesTranslateService.t(
            'academic_year.holiday_added_successfully.txt',
          ),
        );

        this.manageRouterNavigation(context, router);
      },
      error: (err) => {
        this._error.set('Failed to add holiday');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  updateHoliday(
    holidayId: string,
    payload: HolidayPayloadDTO,
    context?: TuiDialogContext<any, any> | null,
    router?: any,
  ) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.updateHoliday(holidayId, payload).subscribe({
      next: (resp) => {
        const data = resp.data;
        this.updateHolidayInState(data);
        this._isLoading.set(false);
        this.hesToasterService.success(
          this.hesTranslateService.t(
            'academic_year.holiday_updated_successfully.txt',
          ),
        );
        this.manageRouterNavigation(context, router);
      },
      error: (err) => {
        this._error.set('Failed to update holiday');
        this._isLoading.set(false);
        this.hesToasterService.showBackendError(err);
      },
    });
  }

  deleteHoliday(holidayId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    this.academicYearApiService.deleteHoliday(Number(holidayId)).subscribe({
      next: () => {
        this.removeHolidayFromState(holidayId);
        this._isLoading.set(false);
        this.hesToasterService.success(
          this.hesTranslateService.t(
            'academic_year.holiday_deleted_successfully.txt',
          ),
        );
      },
      error: (err) => {
        this._error.set('Failed to delete holiday');
        this._isLoading.set(false);
      },
    });
  }

  refreshData() {
    this.fetchAcademicYearData();
  }

  addSemesterToState(semester: SemesterDTO) {
    this._semesterListData.update((semesters) => [...semesters, semester]);
  }

  updateSemesterInState(updatedSemester: SemesterDTO) {
    this._semesterListData.update((semesters) =>
      semesters.map((semester) =>
        semester.id === updatedSemester.id ? updatedSemester : semester,
      ),
    );
  }

  removeSemesterFromState(semesterId: string) {
    this._semesterListData.update((semesters) =>
      semesters.filter(
        (semester) => semester.id.toString() !== semesterId.toString(),
      ),
    );
  }

  addHolidayToState(holiday: HolidayDTO) {
    this._holidaysListData.update((holidays) => [...holidays, holiday]);
  }

  updateHolidayInState(updatedHoliday: HolidayDTO) {
    this._holidaysListData.update((holidays) =>
      holidays.map((holiday) =>
        holiday.id === updatedHoliday.id ? updatedHoliday : holiday,
      ),
    );
  }

  removeHolidayFromState(holidayId: string) {
    this._holidaysListData.update((holidays) =>
      holidays.filter(
        (holiday) => holiday.id.toString() !== holidayId.toString(),
      ),
    );
  }

  clearState() {
    this._academicYear.set(null);
    this._semesterListData.set([]);
    this._holidaysListData.set([]);
    this._error.set(null);
  }

  private mapAndSetData(data: AcademicYearDTO) {
    const academicYearDTO: MappedAcademicYearDTO = {
      id: data.id.toString(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    const semesters = data.semesters;
    const holidays = data.holidays;

    this._academicYear.set(academicYearDTO);
    this._semesterListData.set(semesters);
    if (holidays) {
      this._holidaysListData.set(holidays);
    }
  }

  semesterToListDTO(semesters: SemesterDTO[]): ListDTO[] {
    return semesters.map((semester) => ({
      id: semester.id.toString(),
      title: semester.name,
      dateFrom: semester.startDate,
      dateTo: semester.endDate,
      isCurrent: semester.isCurrentSemester,
    }));
  }

  holidayToListDTO(holidays: HolidayDTO[]): ListDTO[] {
    return holidays.map((holiday) => {
      const title =
        this.currentLang() === 'ar'
          ? holiday.globalHoliday?.arName ?? holiday.arName ?? 'Error Holiday'
          : holiday.globalHoliday?.enName ?? holiday.enName ?? 'Error Holiday';

      return {
        id: holiday.id.toString(),
        title,
        dateFrom: holiday.startDate,
        dateTo: holiday.endDate || '',
      };
    });
  }
}
