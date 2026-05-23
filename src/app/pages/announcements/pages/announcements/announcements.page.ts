import {
  Component,
  OnDestroy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { AnnouncementsService } from '../../announcements.service';
import { AnnouncementsColDefService } from '../../announcements-col-def.service';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { ITableModel } from '@ui-kit/hes-table/model';
import {
  IAnnouncementListItem,
  IAnnouncementQueryParams,
} from '@shared/interfaces/announcements.interface';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { CreateAnnouncementModalService } from '../../utils/create-announcement-modal.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { Subscription } from 'rxjs';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { formatDate } from '@shared/utils/date';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.page.html',
  standalone: true,
  providers: [AnnouncementsColDefService],
  imports: [
    HesTableComponent,
    IonContent,
    TranslocoDirective,
    ListingHeaderComponent,
  ],
})
export class AnnouncementsPages implements OnDestroy, OnInit {
  createAnnouncementPermissions = [
    RESOURCE_PERMISSION.announcement.announcementCreatePost,
    RESOURCE_PERMISSION.announcement.announcementCreateSms,
    RESOURCE_PERMISSION.announcement.announcementCreateNotification,
  ];
  columns = this.AnnouncementsColDefService.columns;
  announcementsList = this.announcementsService.announcementsList;
  announcementsPagination = this.announcementsService.announcementsPagination;
  private academicYearsScopeService = inject(AcademicYearsScopeService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);

  isLoading = signal(false);
  selectedDate = signal<Date | null>(null);

  noRowsOverlayComponentParams = computed(() => {
    if (this.selectedDate()) {
      return {
        imgSrc: 'assets/illustrations/no_data.svg',
        subTitle: this.translocoService.translate(
          'announcements.no_announcements_for_date.txt',
        ),
      };
    }
    return this.AnnouncementsColDefService.noRowsOverlayComponentParams;
  });
  private subscripiton = new Subscription();
  private isNavigatingToCreateAnnouncement = false;

  constructor(
    private announcementsService: AnnouncementsService,
    private AnnouncementsColDefService: AnnouncementsColDefService,
    private createAnnouncementModalService: CreateAnnouncementModalService,
  ) {
    toObservable(this.academicYearsScopeService.selectedAcademicYear)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.onTableModelChanged();
      });

    // Listen to router events to detect when user returns from creating announcements
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event: NavigationEnd) => {
        // If we were navigating to create an announcement, and now we're back to announcement page
        if (
          this.isNavigatingToCreateAnnouncement &&
          event.url.includes('/announcements') &&
          !event.url.includes('/post') &&
          !event.url.includes('/sms') &&
          !event.url.includes('/notification')
        ) {
          this.isNavigatingToCreateAnnouncement = false;
          // Refresh the table when returning from announcement creation
          this.onTableModelChanged();
        }
      });
  }

  ngOnInit() {
    this.subscripiton.add(
      this.AnnouncementsColDefService.refresh$.subscribe(() => {
        this.onTableModelChanged();
      }),
    );
    this.subscripiton.add(
      this.AnnouncementsColDefService.createClicked$.subscribe(() => {
        this.isNavigatingToCreateAnnouncement = true;
      }),
    );
  }

  onDateFilterChange(date: Date | null) {
    this.selectedDate.set(date);
    this.onTableModelChanged();
  }

  onTableModelChanged(event?: ITableModel<IAnnouncementListItem>) {
    const selectedDate = this.selectedDate();
    let newParams: IAnnouncementQueryParams = {
      academicYearId: this.academicYearsScopeService
        .selectedAcademicYear()
        ?.id?.toString(),
      ...(selectedDate && {
        date: formatDate(selectedDate.toISOString(), 'yyyy-MM-dd'),
      }),
    };
    if (event) {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      newParams = {
        ...newParams,
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber.toString() }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage.toString() }),
      };
    }
    this.isLoading.set(true);
    this.announcementsService.getAnnouncements(newParams).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onAddAnnouncement() {
    this.isNavigatingToCreateAnnouncement = true;
    this.createAnnouncementModalService.showCreateAnnouncementModal();
  }

  ngOnDestroy(): void {
    this.subscripiton.unsubscribe();
  }
}
