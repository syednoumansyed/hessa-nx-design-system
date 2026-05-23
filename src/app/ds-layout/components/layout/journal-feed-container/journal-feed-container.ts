import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed,
  input,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TuiLoaderModule } from '@taiga-ui/core';
import { StudentsJournalsService } from 'src/app/ds-layout/services/student-journals.service';
import { DsJournalFeedComponent } from '@ds/journal-feed/journal-feed.component';
import { JournalCardData } from '@ds-layout/services/student-journals.interface';
import { JournalType } from '@shared/enums';
import { switchMap, of, tap, catchError } from 'rxjs';

@Component({
  selector: 'journal-feed-wrapper',
  templateUrl: './journal-feed-container.html',
  standalone: true,
  imports: [CommonModule, TuiLoaderModule, DsJournalFeedComponent],
})
export class JournalFeedWrapperComponent implements OnInit {
  studentId = input<number>();

  private readonly studentsJournalsService = inject(StudentsJournalsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly journals = signal<JournalCardData[]>([]);
  readonly isLoading = signal(false);

  readonly weeklyJournals = computed(() =>
    this.journals().filter((journal) => journal.type === JournalType.WEEKLY),
  );

  readonly dailyJournals = computed(() =>
    this.journals().filter((journal) => journal.type === JournalType.DAILY),
  );

  readonly weeklyJournalsData = computed(() => this.weeklyJournals());

  readonly dailyJournalsData = computed(() => this.dailyJournals());

  private readonly studentId$ = toObservable(this.studentId);

  constructor() {
    this.studentId$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap((studentId) => {
          if (!studentId) {
            return of([] as JournalCardData[]);
          }
          return this.studentsJournalsService
            .getLatestJournalForStudent(studentId)
            .pipe(catchError(() => of([] as JournalCardData[])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((journals) => {
        this.journals.set(journals);
        if (journals.length > 0) {
          this.studentsJournalsService.setHasJournals(true);
        }
        this.isLoading.set(false);
      });
  }

  ngOnInit() {}

  onJournalClick(journalCardData: JournalCardData) {
    if (journalCardData.id) {
      this.router.navigate(['/journal/view', journalCardData.id]);
    }
  }

  hasJournals(): boolean {
    return this.journals().length > 0;
  }

  hasNewJournals(): boolean {
    return this.journals().some(
      (journal) => journal.viewedByGuardian === false,
    );
  }

  getDailyTitle(): string {
    return 'Daily Journals';
  }

  refresh() {
    const studentId = this.studentId();
    if (!studentId) return;
    this.isLoading.set(true);
    this.studentsJournalsService
      .getLatestJournalForStudent(studentId)
      .subscribe({
        next: (journals) => {
          this.journals.set(journals);
          if (journals.length > 0) {
            this.studentsJournalsService.setHasJournals(true);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.journals.set([]);
          this.isLoading.set(false);
        },
      });
  }
}
