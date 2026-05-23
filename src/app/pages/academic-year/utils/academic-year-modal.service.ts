import { Inject, Injectable, Injector, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { ManageAcademicYearComponent } from '../components/manage-academic-year/manage-academic-year.component';
import { ViewSemesterWeeksComponent } from '../components/view-semester-weeks/view-semester-weeks.component';
import { ManageSemesterComponent } from '../components/manage-semester/manage-semester.component';
import { ManageHolidaysComponent } from '../components/manage-holidays/manage-holidays.component';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearModalService {
  private readonly modalCtrl = inject(ModalController);
  isMobile = isMobile();
  closeModal = () => this.modalCtrl.dismiss();

  constructor(
    @Inject(TuiDialogService)
    private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
  ) {}

  async openManageAcademicYearDialog(academicYearId?: string) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(ManageAcademicYearComponent, this.injector),
        {
          dismissible: true,
          data: {
            isMobile: this.isMobile,
            academicYearId,
          },
        },
      )
      .subscribe();
  }

  async openSemesterWeeksDialog(
    semesterId: number,
    isViewOnly: boolean = false,
  ) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(ViewSemesterWeeksComponent, this.injector),
        {
          dismissible: true,
          data: {
            isMobile: this.isMobile,
            semesterId,
            isViewOnly,
          },
        },
      )
      .subscribe();
  }

  async openManageSemesterDialog(academicYearId: number, semesterId?: number) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(ManageSemesterComponent, this.injector),
        {
          dismissible: true,
          data: {
            isMobile: this.isMobile,
            academicYearId,
            semesterId,
          },
        },
      )
      .subscribe();
  }

  async openManageHolidayDialog(academicYearId: number, holidayId?: number) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(ManageHolidaysComponent, this.injector),
        {
          dismissible: true,
          data: {
            isMobile: this.isMobile,
            academicYearId,
            holidayId: holidayId?.toString() || null,
          },
        },
      )
      .subscribe();
  }
}
