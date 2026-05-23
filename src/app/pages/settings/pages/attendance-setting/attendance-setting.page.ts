import { Component, inject, Injector, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ExtendTimeListComponent } from '@pages/settings/components/extend-time-list/extend-time-list.component';
import { AttendanceEndTimeService } from '../../attendance-end-time.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { GlobalEndTimeComponent } from '@pages/settings/components/global-end-time/global-end-time.component';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { ExtendTimeFormComponent } from '@pages/settings/components/extend-time-form/extend-time-form.component';
import { IExtendTimePayload } from '@pages/settings/data-access/attendance-end-time.dto';
import { HttpErrorResponse } from '@angular/common/http';
import { ExtendedEndTime } from '@pages/settings/data-access/attendance-end-time.interface';

@Component({
  selector: 'app-attendance-setting',
  templateUrl: './attendance-setting.page.html',
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoDirective,
    HesButtonModule,
    GlobalEndTimeComponent,
    ExtendTimeListComponent,
  ],
})
export class AttendanceSettingPage implements OnInit {
  // #region Injectables
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly toaster = inject(HesToasterService);
  private readonly attendanceEndTimeService = inject(AttendanceEndTimeService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly injector = inject(Injector);
  // #endregion

  // #region Public Properties
  readonly faPlus = faPlus;
  readonly loading = signal<boolean>(false);
  extendedEndTime: ExtendedEndTime[] = [];
  // #endregion

  // #region Public Methods
  constructor() {
    toObservable(this.schoolScopeService.selectedSchoolStructureItem)
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(() => {
        this.fetchExtendedEndTime();
      });
  }

  ngOnInit(): void {
    this.fetchExtendedEndTime();
  }

  addException(): void {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(ExtendTimeFormComponent, this.injector),
        {
          dismissible: false,
          closeable: false,
        },
      )
      .subscribe({
        complete: () => {
          this.fetchExtendedEndTime();
        },
      });
  }

  onItemDeleted(): void {
    this.fetchExtendedEndTime();
  }
  // #endregion

  // #region Private Methods
  private fetchExtendedEndTime(): void {
    this.loading.set(true);
    const payload: IExtendTimePayload = this.fetchExtendedEndTimePayload();

    this.attendanceEndTimeService.fetchExtendedEndTime(payload).subscribe({
      next: (response) => {
        this.extendedEndTime = response.data;
      },
      error: (err: HttpErrorResponse) => {
        this.extendedEndTime = [];
        if (err.status !== 404) {
          this.toaster.showBackendError(err);
        }
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private fetchExtendedEndTimePayload(): IExtendTimePayload {
    const payload: IExtendTimePayload = {};
    const selectedType =
      this.schoolScopeService.selectedSchoolStructureItem()?.type;
    const id = this.schoolScopeService.selectedSchoolStructureItem()?.id;
    if (selectedType === 'school') {
      payload.schoolId = id;
    } else if (selectedType === 'campus') {
      payload.campusId = id;
    } else {
      payload.companyId = id;
    }
    payload.pageNumber = 1;
    payload.itemsPerPage = 200;
    return payload;
  }
}
