import {
  Component,
  OnInit,
  computed,
  OnDestroy,
  signal,
  inject,
} from '@angular/core';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { StructureDepth } from '@shared/utils/school-structure';
import { formatDate } from 'date-fns';
import { ReportFilterComponent } from '../report-filter/report-filter.component';
import { CommonModule } from '@angular/common';
import { ReportExporter } from '@pages/reports/report.interface';
import { BaseReportComponent } from '../report-base.component';
import { IPagination } from '@shared/interfaces';
import { AnnouncementUserQueryParams } from '@pages/announcements/data-access/post.dto';
import { getAnnouncementRestTarget } from '@pages/announcements/utils/announcement-rest-target-map.util';
import { DefaultRoles } from '@shared/enums';
import { InfiniteScrollCustomEvent } from '@ionic/core';
import { ReportsService } from '@pages/reports/reports.service';
@Component({
  selector: 'app-sms-class-level-report',
  templateUrl: './sms-class-level-report.component.html',
  standalone: true,
  imports: [ReportFilterComponent, CommonModule],
  providers: [ReportsService],
})
export class SmsClassLevelReportComponent
  extends BaseReportComponent
  implements OnInit, OnDestroy, ReportExporter
{
  private readonly reportsService = inject(ReportsService);

  sendersList = signal([]);

  studentUsersList = signal<any>([]);
  readonly studentUserParams = signal<Partial<AnnouncementUserQueryParams>>({
    pageNumber: 1,
    itemsPerPage: 10,
  });

  protected readonly studentUsersPage = signal<IPagination | undefined>(
    undefined,
  );

  guardianUsersList = signal<any>([]);
  readonly guardianUserParams = signal<Partial<AnnouncementUserQueryParams>>({
    pageNumber: 1,
    itemsPerPage: 10,
  });
  protected readonly guardianUsersPage = signal<IPagination | undefined>(
    undefined,
  );

  personnelUsersList = signal<any>([]);
  readonly personnelUserParams = signal<Partial<AnnouncementUserQueryParams>>({
    pageNumber: 1,
    itemsPerPage: 10,
  });
  protected readonly personnelUsersPage = signal<IPagination | undefined>(
    undefined,
  );

  override ngOnInit(): void {
    super.ngOnInit();
    this.reportsService.getSmsSendersList().subscribe((senders) => {
      this.sendersList.set(senders);
    });

    this.subscription.add = this.form
      .get('targets')
      ?.valueChanges.subscribe(() => {
        this.fetchStudentUsers({
          params: this.getStudentUserParam(),
        });
        this.fetchGuardianUsers({
          params: this.getGuardianUserParam(),
        });
        this.fetchPersonnelUsers({
          params: this.getPersonnelUserParam(),
        });
      });

    this.subscription.add = this.form
      .get('students')
      ?.valueChanges.subscribe(() => {
        this.form.get('guardians')?.setValue(null, { emitEvent: false });
        this.form.get('personnels')?.setValue(null, { emitEvent: false });
      });

    this.subscription.add = this.form
      .get('guardians')
      ?.valueChanges.subscribe(() => {
        this.form.get('students')?.setValue(null, { emitEvent: false });
        this.form.get('personnels')?.setValue(null, { emitEvent: false });
      });

    this.subscription.add = this.form
      .get('personnels')
      ?.valueChanges.subscribe(() => {
        this.form.get('students')?.setValue(null, { emitEvent: false });
        this.form.get('guardians')?.setValue(null, { emitEvent: false });
      });
  }

  private getStudentUserParam() {
    const targetSchool = this.form.get('targets')?.value;
    return {
      ...this.studentUserParams(),
      targets: getAnnouncementRestTarget(targetSchool ?? []),
      roleId: 1,
      arRoleName: DefaultRoles.STUDENT,
    };
  }

  private getGuardianUserParam() {
    const targetSchool = this.form.get('targets')?.value;
    return {
      ...this.guardianUserParams(),
      targets: getAnnouncementRestTarget(targetSchool ?? []),
      roleId: 2,
      arRoleName: DefaultRoles.GUARDIAN,
    };
  }

  private getPersonnelUserParam() {
    const targetSchool = this.form.get('targets')?.value;
    return {
      ...this.personnelUserParams(),
      targets: getAnnouncementRestTarget(targetSchool ?? []),
    };
  }

  fetchStudentUsers(args: {
    params: AnnouncementUserQueryParams;
    loadMore?: boolean;
    event?: InfiniteScrollCustomEvent;
  }) {
    const { loadMore = false, event, params } = args;
    this.reportsService.getUsers(params).subscribe({
      next: (res) => {
        if (loadMore) {
          const nextList: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.studentUsersList.update((list) => {
            return list.concat(nextList);
          });

          event?.target.complete();
        } else {
          const list: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.studentUsersList.set(list);
        }
        this.studentUsersPage.set(res.paginate);
      },
      error: (err) => {
        this.studentUsersList.set([]);
        this.studentUsersPage.set(err.error.paginate);
      },
    });
  }

  fetchGuardianUsers(args: {
    params: AnnouncementUserQueryParams;
    loadMore?: boolean;
    event?: InfiniteScrollCustomEvent;
  }) {
    const { loadMore = false, event, params } = args;
    this.reportsService.getUsers(params).subscribe({
      next: (res) => {
        if (loadMore) {
          const nextList: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.guardianUsersList.update((list) => {
            return list.concat(nextList);
          });
          event?.target.complete();
        } else {
          const list: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.guardianUsersList.set(list);
        }
        this.guardianUsersPage.set(res.paginate);
      },
      error: (err) => {
        this.guardianUsersList.set([]);
        this.guardianUsersPage.set(err.error.paginate);
      },
    });
  }

  fetchPersonnelUsers(args: {
    params: AnnouncementUserQueryParams;
    loadMore?: boolean;
    event?: InfiniteScrollCustomEvent;
  }) {
    const { loadMore = false, event, params } = args;
    this.reportsService.getUsers(params).subscribe({
      next: (res) => {
        if (loadMore) {
          const nextList: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.personnelUsersList.update((list) => {
            return list.concat(nextList);
          });
          event?.target.complete();
        } else {
          const list: any = res.data.map((n) => ({
            value: {
              id: n.userId,
              fullName: n.displayName,
            },
            displayedValue: n.displayName,
          }));
          this.personnelUsersList.set(list);
        }
        this.personnelUsersPage.set(res.paginate);
      },
      error: (err) => {
        this.personnelUsersList.set([]);
        this.personnelUsersPage.set(err.error.paginate);
      },
    });
  }

  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
        schoolStructureControlConfig: {
          depth: StructureDepth.CLASS,
        },
      },
      {
        label: this.translate.t('global.content.label'),
        type: 'input',
        formControlName: 'content',
        required: false,
        placeholder: this.translate.t(
          'announcements.enter_content.placeholder',
        ),
      },
      {
        label: this.translate.t('reports.sender.title'),
        type: 'searchable-select',
        placeholder: this.translate.t('reports.select_sender.title'),
        formControlName: 'senders',
        selectValues: this.sendersList(),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.student.txt'),
        placeholder: this.translate.t('global.select_student.label'),
        type: 'searchable-select',
        selectValues: this.studentUsersList(),
        formControlName: 'students',
        required: false,
        isMultiple: true,
        searchableSelectObject: {
          pagination: this.studentUsersPage(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.studentUserParams.update((params) => ({
              ...params,
              pageNumber: +params.pageNumber! + 1,
            }));
            this.fetchStudentUsers({
              loadMore: true,
              event: ev,
              params: this.getStudentUserParam(),
            });
          },
          onSearchChanged: (value: string) => {
            this.studentUserParams.update(({ searchText, ...restParams }) => ({
              ...restParams,
              ...(value && { searchText: value }),
              pageNumber: 1,
            }));
            this.fetchStudentUsers({
              params: this.getStudentUserParam(),
            });
          },
          showChips: true,
          showClearBtn: true,
        },
      },
      {
        label: this.translate.t('global.guardian.txt'),
        placeholder: this.translate.t('global.select_guardian.label'),
        type: 'searchable-select',
        selectValues: this.guardianUsersList(),
        formControlName: 'guardians',
        required: false,
        isMultiple: true,
        searchableSelectObject: {
          pagination: this.guardianUsersPage(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.guardianUserParams.update((params) => ({
              ...params,
              pageNumber: +params.pageNumber! + 1,
            }));
            this.fetchGuardianUsers({
              loadMore: true,
              event: ev,
              params: this.getGuardianUserParam(),
            });
          },
          onSearchChanged: (value: string) => {
            this.guardianUserParams.update(({ searchText, ...restParams }) => ({
              ...restParams,
              ...(value && { searchText: value }),
              pageNumber: 1,
            }));
            this.fetchGuardianUsers({
              params: this.getGuardianUserParam(),
            });
          },
          showChips: true,
          showClearBtn: true,
        },
      },
      {
        label: this.translate.t('global.personnel.txt'),
        placeholder: this.translate.t('global.select_personnel.label'),
        type: 'searchable-select',
        selectValues: this.personnelUsersList(),
        formControlName: 'personnels',
        required: false,
        isMultiple: true,
        searchableSelectObject: {
          pagination: this.personnelUsersPage(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.personnelUserParams.update((params) => ({
              ...params,
              pageNumber: +params.pageNumber! + 1,
            }));
            this.fetchPersonnelUsers({
              loadMore: true,
              event: ev,
              params: this.getPersonnelUserParam(),
            });
          },
          onSearchChanged: (value: string) => {
            this.personnelUserParams.update(
              ({ searchText, ...restParams }) => ({
                ...restParams,
                ...(value && { searchText: value }),
                pageNumber: 1,
              }),
            );
            this.fetchPersonnelUsers({
              params: this.getPersonnelUserParam(),
            });
          },
          showChips: true,
          showClearBtn: true,
        },
      },
    ];
  });

  exportReport() {
    const formVal = this.form.getRawValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['content'] && {
        content: formVal['content'],
      }),
      ...(formVal['senders']?.length && {
        senders: formVal['senders'].map((sender: any) => ({
          id: sender.id,
          name: sender.fullName,
        })),
      }),
      ...(formVal['students']?.length && {
        students: formVal['students'].map((student: any) => ({
          id: student.id,
          name: student.fullName,
        })),
      }),
      ...(formVal['guardians']?.length && {
        guardians: formVal['guardians'].map((guardian: any) => ({
          id: guardian.id,
          name: guardian.fullName,
        })),
      }),
      ...(formVal['personnels']?.length && {
        personnels: formVal['personnels'].map((personnel: any) => ({
          id: personnel.id,
          name: personnel.fullName,
        })),
      }),
    };
  }

  getApiRoute(): string {
    return 'sms-report-at-class-level';
  }
}
