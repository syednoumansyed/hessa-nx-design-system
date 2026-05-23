// base-question.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FileUploadService } from '@shared/services/file-upload.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { removeEmptyOrNull } from '@shared/utils/remove-empty-null.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { QuestionTypeEnum } from './question-enum';
import { QuestionFormService } from './question-form.service';
import {
  QuestionDTO,
  QuestionPayload,
  QuestionResponseDTO,
} from './question.dto';

export type ActiveStatePlayload =
  | {
      actionType: 'add';
      payload: null;
    }
  | {
      actionType: 'view';
      payload: QuestionDTO;
    }
  | {
      actionType: 'edit';
      payload: QuestionDTO;
    }
  | {
      actionType: 'view-parent';
      payload?: null;
    };

export type QuestionParentId = {
  examId?: number;
  assignmentId?: number;
};
@Injectable({
  providedIn: 'root',
})
export class QuestionsManagerService {
  private readonly http = inject(HttpClient);
  private readonly questionFromService = inject(QuestionFormService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly toasterService = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);

  private readonly questionParentIdSource =
    new BehaviorSubject<QuestionParentId | null>(null);
  readonly questionParentId$ = this.questionParentIdSource.asObservable();

  private readonly questionsSource = new BehaviorSubject<QuestionDTO[]>([]);
  private readonly activeStateSource = new BehaviorSubject<ActiveStatePlayload>(
    {
      actionType: 'view-parent',
    },
  );
  readonly activeState$ = this.activeStateSource.pipe(
    switchMap((state) => {
      if (state.actionType === 'view' || state.actionType === 'edit') {
        this.isLoadingQuestionDetailSource.next(true);
        return this.getQuestion(state.payload.id!).pipe(
          map((questionResp) => {
            return {
              ...state,
              payload: questionResp,
            };
          }),
          finalize(() => {
            this.isLoadingQuestionDetailSource.next(false);
          }),
        );
      }
      return of(state);
    }),
    shareReplay(1),
  );

  readonly activeQuestionId$ = this.activeStateSource.pipe(
    map((state) => state.payload?.id ?? null),
  );
  protected isLoadingQuestionsSource = new BehaviorSubject<boolean>(false);
  readonly isLoadingQuestions$ = this.isLoadingQuestionsSource.asObservable();

  protected showLoaderSource = new BehaviorSubject<boolean>(false);
  readonly showLoader$ = this.showLoaderSource.asObservable();

  private isLoadingQuestionDetailSource = new BehaviorSubject<boolean>(false);
  readonly isLoadingQuestionDetail$ =
    this.isLoadingQuestionDetailSource.asObservable();
  readonly questions$ = this.questionsSource.asObservable();

  readonly isNewParentId$: Observable<boolean> = this.questionParentId$.pipe(
    map((id) => id === null),
  );

  private readonly isPublishSource = new BehaviorSubject<boolean>(false);
  readonly isPublish$ = this.isPublishSource.asObservable();

  readonly canModifyQuestions$: Observable<boolean> = combineLatest([
    this.isNewParentId$,
    this.isPublish$,
  ]).pipe(
    map(([isNewParentId, isPublished]) => {
      return !isNewParentId && !isPublished;
    }),
  );
  readonly reFetchParentSource = new Subject<void>();
  readonly reFetchParent$ = this.reFetchParentSource.asObservable();

  readonly isViewState$ = this.activeState$.pipe(
    map((state) => state.actionType === 'view'),
  );

  addNewQuestion() {
    this.activeStateSource.next({ actionType: 'add', payload: null });
  }

  viewQuestion(question: QuestionDTO): void {
    this.activeStateSource.next({ actionType: 'view', payload: question });
  }

  editQuestion(): void {
    const { payload } = this.activeStateSource.getValue();
    if (payload) {
      this.activeStateSource.next({
        actionType: 'edit',
        payload,
      });
    }
  }

  selectParent() {
    this.activeStateSource.next({ actionType: 'view-parent' });
  }

  setParentId(parentId: QuestionParentId) {
    this.questionParentIdSource.next(parentId);
  }

  setQuestions(questions: QuestionDTO[]) {
    this.questionsSource.next(questions);
  }

  reFetchParent() {
    this.reFetchParentSource.next();
  }

  onSave() {
    const form = this.questionFromService.form;
    const attchments = form.controls.attachments.value ?? [];
    this.showLoaderSource.next(true);
    this.uploadFile(attchments)
      .pipe(
        switchMap((attchmentsResp) => {
          form.controls.attachments.setValue(attchmentsResp);
          const formValue = form.value;
          const attachmentsKey = attchmentsResp.map((i) => ({
            path: i.key,
            name: i.extension,
          }));
          const payload = this.getQuestionPayload({
            ...formValue,
            isAttachmentAllowed:
              formValue.isAttachmentAllowed === 'true' ? true : false,
            attachments: attachmentsKey,
          } as QuestionPayload);
          const { id, ...restPayload } = payload;
          if (id) {
            return this.onUpdateQuestion(id, restPayload);
          }
          return this.onCreateQuestion(restPayload);
        }),
        finalize(() => {
          this.showLoaderSource.next(false);
        }),
      )
      .subscribe({
        next: (resp) => {
          this.viewQuestion(resp);
          this.reFetchParentSource.next();
        },
        error: (error) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  private getQuestion(id: number) {
    return this.http
      .get<QuestionResponseDTO>(`${ApiUrl.v1BE}/courses/cms/questions/${id}`)
      .pipe(map((resp) => resp.data));
  }
  private onCreateQuestion(payload: QuestionPayload) {
    return this.http
      .post<QuestionResponseDTO>(
        `${ApiUrl.v1BE}/courses/cms/questions`,
        payload,
      )
      .pipe(
        map((resp) => resp.data),
        tap(() => {
          this.toasterService.success(
            this.transloco.translate('global.successfully_added_question.txt'),
          );
        }),
      );
  }

  private onUpdateQuestion(questionId: number, payload: QuestionPayload) {
    return this.http
      .put<QuestionResponseDTO>(
        `${ApiUrl.v1BE}/courses/cms/questions/${questionId}`,
        payload,
      )
      .pipe(
        map((resp) => resp.data),
        tap(() => {
          this.toasterService.success(
            this.transloco.translate(
              'user_manual.successfully_updated_question.txt',
            ),
          );
        }),
      );
  }

  onDeleteQuestion(questionId: number) {
    return this.http.delete(
      `${ApiUrl.v1BE}/courses/cms/questions/${questionId}`,
    );
  }

  uploadFile(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/courses/cms/questions/file/upload`,
      attachments,
    );
  }

  public setPublish(value: boolean) {
    this.isPublishSource.next(value);
  }

  private getQuestionPayload(value: QuestionPayload) {
    const payload = {
      ...this.questionParentIdSource.getValue(),
      ...value,
    };
    if (payload.type === QuestionTypeEnum.essay) {
      delete payload.questionOptions;
    } else {
      delete payload.isAttachmentAllowed;
      delete payload.modelAnswer;
    }
    return removeEmptyOrNull(payload) as QuestionPayload;
  }
}
