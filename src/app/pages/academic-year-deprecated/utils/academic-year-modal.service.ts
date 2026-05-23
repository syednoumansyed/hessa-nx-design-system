import { Inject, Injectable, Injector, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AcademicYearFormComponent } from '../components/academic-year-form/academic-year-form.component';
import { Subject } from 'rxjs';
import { SemesterFromComponent } from '../components/semester-from/semester-from.component';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { AcademicYearApiService } from '../data-access/academic-year.api-service';
import { TranslocoService } from '@jsverse/transloco';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearModalService {
  private readonly modalCtrl = inject(ModalController);
  private readonly academicApiService = inject(AcademicYearApiService);
  private readonly onSuccessAcademicSource$ = new Subject<void>();
  readonly onSuccessAcademic$ = this.onSuccessAcademicSource$.asObservable();
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toasterService = inject(HesToasterService);
  constructor(
    @Inject(TuiDialogService)
    private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
  ) {}

  async showAcademicForm(academicId?: number, isView = false) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(AcademicYearFormComponent, this.injector),
        {
          dismissible: true,
          data: {
            academicId: academicId,
            isView: isView,
            onRefresh: this.onSuccessAcademicSource$,
            deleteAcademic: () => {
              if (academicId) this.deleteAcademicConfirmationModal(academicId);
            },
          },
        },
      )
      .subscribe();
  }

  async showSemesterForm(
    academicId?: number,
    semesterId?: number,
    isView = false,
  ) {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(SemesterFromComponent, this.injector),
        {
          dismissible: true,
          data: {
            semesterId,
            academicId,
            onRefresh: this.onSuccessAcademicSource$,
            isView,
            deleteSemester: (id: number) => {
              this.deleteSemesterConfirmationModal(id);
            },
          },
        },
      )
      .subscribe();
  }

  async viewAcademic(academicId: number) {
    this.showAcademicForm(academicId, true);
  }
  async viewSemester(academicId: number, semesterId: number) {
    this.showSemesterForm(academicId, semesterId, true);
  }

  deleteAcademicConfirmationModal(academicId: number) {
    this.genericModalSerivce.show(
      () => {
        this.onDeleteAcademic(academicId);
      },
      {
        modalTitle: this.translate(
          'academic_enrolment.academic_year_delete_msg.text',
        ),
        modalMessage: '',
        primaryBtnStr: this.translate('global.delete.btn'),
      },
    );
  }

  private onDeleteAcademic(id: number) {
    this.academicApiService.deleteAcademic(id).subscribe({
      next: (resp) => {
        this.onSuccessAcademicSource$.next();
        this.toasterService.success(
          this.translate('academic_enrolment.delete_successfully.txt'),
        );
      },
      error: (errorResp) => {
        this.toasterService.showBackendError(errorResp);
      },
    });
  }

  deleteSemesterConfirmationModal(semesterId: number) {
    this.genericModalSerivce.show(
      () => {
        this.onDeleteSemester(semesterId);
      },
      {
        modalTitle: this.translate(
          'academic_enrolment.semester_delete_msg.text',
        ),
        modalMessage: '',
        primaryBtnStr: this.translate('global.delete.btn'),
      },
    );
  }

  private onDeleteSemester(semesterId: number) {
    this.academicApiService.deleteSemester(semesterId).subscribe({
      next: (resp) => {
        this.modalCtrl.dismiss();
        this.onSuccessAcademicSource$.next();
        this.toasterService.success(
          '',
          this.translate('academic_enrolment.delete_semester_successfully.txt'),
        );
      },
      error: (errResp) => {
        this.toasterService.showBackendError(errResp);
      },
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
