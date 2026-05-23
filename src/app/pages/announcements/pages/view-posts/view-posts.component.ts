import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { PreviewPostCardComponent } from '../../components/preview-post-card/preview-post-card.component';
import { AnnouncementService } from '../../data-access/announcement.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { UserFeedPayload } from '@pages/announcements/data-access/post.dto';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoModule } from '@jsverse/transloco';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { pipe, skip, Subject, takeUntil } from 'rxjs';
import { TuiLoaderModule } from '@taiga-ui/core';
import { JournalFeedWrapperComponent } from '../../../../ds-layout/components/layout/journal-feed-container/journal-feed-container';
import { AuthService } from '@auth/auth.service';
import { LayoutService } from '@layout/layout.service';
import { ViewPost } from '@pages/announcements/data-access/post.interface';
import { HesLogService } from '@shared/services/hes-log.service';
import { UserType } from '@shared/enums';
import { StudentsJournalsService } from '@ds-layout/services/student-journals.service';

const itemsPerPage = 10;
@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  standalone: true,
  imports: [
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    CommonModule,
    PreviewPostCardComponent,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    TranslocoDirective,
    NoDataCardComponent,
    TranslocoModule,
    TuiLoaderModule,
    IonRefresher,
    IonRefresherContent,
    JournalFeedWrapperComponent,
  ],
})
export class ViewPostsComponent implements OnInit, OnDestroy {
  private readonly annoucementService = inject(AnnouncementService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );

  private readonly auth = inject(AuthService);
  readonly layoutService = inject(LayoutService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly studentsJournalsService = inject(StudentsJournalsService);
  private readonly logService = inject(HesLogService);
  private pageNumber = signal<number>(1);
  readonly feeds = signal<ViewPost[]>([]);
  @ViewChild('journalFeedWrapper')
  journalFeedWrapper?: JournalFeedWrapperComponent;
  isGuardianUser = computed(() => this.auth.user()?.type === UserType.GUARDIAN);
  isLoading = signal(false);
  selectedStudent = computed(() =>
    this.studentSelectionScope.selectedStudent(),
  );
  private destroy$ = new Subject<void>();

  constructor() {
    toObservable(this.academicYearsScopeService.selectedAcademicYear)
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetPage();
        this.loadMoreData();
      });

    // Listen to student selection changes (skip initial null/default value)
    toObservable(this.studentSelectionScopeService.selectedStudent)
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetPage();
        this.loadMoreData();
      });
  }
  ngOnInit() {}
  ionViewWillEnter() {
    this.resetPage();
    this.loadMoreData();
    // If the journal feed is currently hidden (hasJournals=false), re-check the API
    // in case journals were published while the user was on another page.
    // We call the API directly rather than resetting hasJournals to null, because
    // toggling the signal would cause a layout switch that destroys/recreates the
    // router-outlet and triggers an infinite loop.
    if (
      this.isGuardianUser() &&
      this.studentsJournalsService.hasJournals() === false
    ) {
      this.studentsJournalsService.checkHasJournals(
        this.studentSelectionScope.selectedStudent()?.id,
      );
    }
  }

  handleRefresh(event: RefresherCustomEvent) {
    try {
      this.pageNumber.set(1);
      this.loadMoreData(event.target as HTMLIonRefresherElement, true);
      if (this.journalFeedWrapper) {
        this.journalFeedWrapper.refresh();
      } else if (
        this.isGuardianUser() &&
        this.studentsJournalsService.hasJournals() === false
      ) {
        this.studentsJournalsService.checkHasJournals(
          this.studentSelectionScope.selectedStudent()?.id,
        );
      }
    } finally {
      event.detail.complete();
    }
  }

  loadMoreData(
    event?: InfiniteScrollCustomEvent | HTMLIonRefresherElement,
    refresh: boolean = false,
  ) {
    const academicYearId =
      this.academicYearsScopeService.selectedAcademicYear()?.id;
    if (academicYearId) {
      this.isLoading.set(true);
      const params: UserFeedPayload = {
        academicYearId,
        pageNumber: this.pageNumber(),
        itemsPerPage,
      };
      const selectedStudent =
        this.studentSelectionScopeService.selectedStudent();
      if (selectedStudent) params.studentId = selectedStudent.id.toString();
      this.annoucementService.fetchUserFeeds(params).subscribe({
        next: (resp) => {
          if (refresh) {
            this.feeds.set([]);
          }
          this.feeds.update((feeds) => [...feeds, ...resp.data]);
          this.pageNumber.update((v) => ++v);
          if (event) {
            if (event instanceof CustomEvent) {
              event.target?.complete();
              if (resp.data.length < itemsPerPage) {
                event.target.disabled = true;
              }
            } else {
              event.complete();
            }
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.logService.error('fetchUserFeeds[ViewPostsComponent]', error);
          this.feeds.set([]);
          this.isLoading.set(false);
          this.pageNumber.set(1);
        },
      });
    }
  }

  private resetPage() {
    this.feeds.set([]);
    this.pageNumber.set(1);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
