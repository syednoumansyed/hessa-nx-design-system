import { computed, inject, Injectable, Input, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ExamData } from '@pages/course-management/data-access/cms-exam.dto';
import { CMSExamService } from '@pages/course-management/data-access/cms-exam.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Injectable()
export class CMSOfflineExamDetailsService {
  //#region Injected Services
  private readonly transloco = inject(TranslocoService);
  private examService = inject(CMSExamService);
  private hesTranslateService = inject(HesTranslateService);
  //#endregion

  //#region Signals & Computed Properties
  readonly offlineExamDetails = signal<ExamData | null>(null);
  readonly offlineExamData = computed(() => {
    const offlineExamDetails = this.offlineExamDetails()!;
    if (!offlineExamDetails) {
      return [];
    }

    return [
      {
        title: this.transloco.translate('global.title.label'),
        value: offlineExamDetails?.title,
      },
      {
        title: this.transloco.translate('content_management.attempts.title'),
        value: offlineExamDetails?.allowedAttempts ?? '---',
      },
      {
        title: this.transloco.translate('global.start_date_time.title'),
        value: offlineExamDetails?.startDate || '',
        type: 'date',
      },
      {
        title: this.transloco.translate('global.status.title'),
        value: this.hesTranslateService.enumT('enum.PENDING'),
        type: 'badge',
      },
      {
        title: this.transloco.translate(
          'content_management.due_date_time.label',
        ),
        value: offlineExamDetails?.dueDate,
        type: 'date',
      },
      {
        title: this.transloco.translate('content_management.duration.label'),
        value: offlineExamDetails?.duration ?? '---',
      },
      {
        title: this.transloco.translate('global.description.label'),
        value: offlineExamDetails?.description,
        type: 'paragraph',
      },
    ];
  });
  //#endregion

  //#region Public Methods
  getOfflineExamData(examId: ObjId): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.examService.getExam(examId).subscribe({
        next: (exam) => {
          this.offlineExamDetails.set(exam.data);
          resolve(this.offlineExamData());
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
  //#endregion
}
