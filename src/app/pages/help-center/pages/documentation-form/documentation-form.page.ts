import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';

import { ArticleTypeEnum } from '../../utils/article-type.enum';
import { of, finalize, map, switchMap, tap } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { DocumentationService } from '../../data-access/documentation.service';
import { EditorImageUploadService } from '@ui-kit/hes-editor/editor-image-upload.service';
import { Router } from '@angular/router';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
import { HelpCenterSupportTicketsService } from '../../data-access/support-tickets.service';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HelpCenterDocumentRequest } from '@pages/help-center/data-access/documentation-dto';
import { HelpCenterDocument } from '@pages/help-center/data-access/documentation.interface';

@Component({
  selector: 'app-documentation-form',
  templateUrl: './documentation-form.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonSpinner,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    TranslocoPipe,
    HesButtonModule,
  ],
})
export class DocumentationFormPage implements OnInit, OnDestroy {
  docId = input<number>();
  private destroyRef$ = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly fb = inject(NonNullableFormBuilder);
  private location = inject(Location);
  private readonly supportTicketsService = inject(
    HelpCenterSupportTicketsService,
  );
  private readonly documentService = inject(DocumentationService);
  private readonly editorImageUploadService = inject(EditorImageUploadService);
  private readonly toasterService = inject(HesToasterService);
  private readonly router = inject(Router);
  private readonly ticketTypeService = inject(TicketTypeService);

  readonly isArticle = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly form = this.fb.group(
    {
      articleType: this.fb.control<string>('', [Validators.required]),
      isPrivate: this.fb.control<string>('', [Validators.required]),
      supportCategoryId: this.fb.control<number | null>(null, [
        Validators.required,
      ]),
      language: this.fb.control<string | null>(null, [Validators.required]),
      title: this.fb.control<string>('', [
        Validators.required,
        Validators.maxLength(30),
      ]),
      faqContent: this.fb.control<string>(''),
      articleContent: this.fb.control<string>(''),
      videoTitle: this.fb.control<string | null>(''),
      attachments: this.fb.control<IAttachmentControlValue[] | null>(null),
    },
    { validators: [videoAttachmentValidator] },
  );

  readonly supportCategories = signal<ISelectValue[]>([]);

  readonly formConfig = computed<IControl[]>(() => {
    const isArticle = this.isArticle();
    const supportCategories = this.supportCategories();
    const content: IControl[] = isArticle
      ? [
          {
            type: 'editor',
            label: this.translate('support_ticket.details.label'),
            formControlName: 'articleContent',
            placeholder: this.translate('user_manual.enter_answer.placeholder'),
            required: false,
            uploadImageUrl: '/articles/file/upload/public',
          },
          {
            label: this.translate('global.video.title'),
            type: 'input',
            formControlName: 'videoTitle',
            required: false,
            placeholder: this.translate('global.video.placeholder'),
          },
          {
            type: 'file',
            formControlName: 'attachments',
            placeholder: this.translate('global.video_formats.txt'),
            required: false,
            acceptFileTypes: ['VIDEOS'],
            maxSizeInMB: 1024,
            isMultiple: false,
          },
        ]
      : [
          {
            type: 'textarea',
            label: this.translate('support_ticket.details.label'),
            formControlName: 'faqContent',
            placeholder: this.translate('user_manual.enter_answer.placeholder'),
            required: true,
          },
        ];

    return [
      {
        label: this.userManualTranslation('user_manual.type.label'),
        type: 'radio',
        formControlName: 'articleType',
        required: true,
        selectValues: [
          {
            displayedValue: this.userManualTranslation('global.question.txt'),
            value: ArticleTypeEnum.question,
          },
          {
            displayedValue: this.userManualTranslation(
              'user_manual.article.txt',
            ),
            value: ArticleTypeEnum.article,
          },
        ],
      },
      {
        label: this.translate('support_ticket.audience.title'),
        type: 'radio',
        formControlName: 'isPrivate',
        required: true,
        selectValues: [
          {
            displayedValue: this.userManualTranslation(
              'user_manual.public.txt',
            ),
            value: 'false',
          },
          {
            displayedValue: this.userManualTranslation(
              'user_manual.private.txt',
            ),
            value: 'true',
          },
        ],
      },
      {
        label: this.translate('global.title.label'),
        type: 'input',
        formControlName: 'title',
        required: true,
        placeholder: this.translate('global.enter_title.placeholder'),
        errorMessage: {
          maxlength: this.translate('global.validation.max_length', {
            chars: 30,
            label: this.translate('global.title.label'),
          }),
        },
      },
      {
        label: this.translate('support_ticket.category.dropdown'),
        placeholder: this.translate('support_ticket.select_category.dropdown'),
        formControlName: 'supportCategoryId',
        type: 'searchable-select',
        required: true,
        selectValues: supportCategories,
      },
      {
        label: this.translate('support_ticket.language.label'),
        type: 'searchable-select',
        formControlName: 'language',
        required: true,
        placeholder: this.translocoService.translate(
          'global.select_language.dropdown',
        ),
        selectValues: [
          {
            displayedValue: 'English',
            value: 'en',
          },
          {
            displayedValue: 'اللغة العربية',
            value: 'ar',
          },
        ],
      },
      ...content,
    ];
  });

  private readonly subscription = new HesSubscription();

  ngOnInit() {
    this.editorImageUploadService.setImages([]);
    if (this.docId()) {
      this.documentService
        .fetchDocumentationById(this.docId()!)
        .subscribe((resp) => {
          this.patchForm(resp);
        });
    }
    this.fetchSuportCategories();
    this.subscription.add = this.form.controls.articleType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((value) => {
        this.isArticle.set(value === ArticleTypeEnum.article);
        this.updateValidator();
      });
  }

  fetchSuportCategories() {
    this.ticketTypeService
      .getArticleCategoriesSelectValue()
      .pipe(
        map((categories) => {
          this.supportCategories.set(categories);
          return categories;
        }),
      )
      .subscribe();
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private userManualTranslation(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
  onCancel() {
    this.location.back();
  }

  uploadVideo() {
    const attachments = this.form.controls.attachments.value;
    const isArticle =
      this.form.get('articleType')?.value === ArticleTypeEnum.article;
    if (attachments?.length && isArticle) {
      return this.documentService.uploadVideo(attachments).pipe(
        tap((resp) => {
          this.form.controls.attachments.setValue(resp);
        }),
      );
    }
    return of([]);
  }

  onSubmit() {
    this.loading.set(true);
    const rest = this.getRest();

    const obs$ = this.uploadVideo().pipe(
      switchMap(() => this.saveDocumentation()),
    );
    obs$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        let toastMesg =
          rest.articleType === ArticleTypeEnum.question
            ? 'global.successfully_added_question.txt'
            : 'user_manual.successfully_added_article.txt';
        if (this.docId()) {
          toastMesg =
            rest.articleType === ArticleTypeEnum.question
              ? 'user_manual.successfully_updated_question.txt'
              : 'user_manual.successfully_updated_article.txt';
        }
        this.toasterService.success(this.userManualTranslation(toastMesg));
        if (rest.articleType === ArticleTypeEnum.article) {
          this.router.navigate(['/help-center/user-manual']);
        } else {
          this.router.navigate(['/help-center/faqs']);
        }
      },
      error: (error) => {
        this.toasterService.showBackendError(error);
      },
    });
  }

  private saveDocumentation() {
    let savedApi$ = this.documentService.createDocumentation(this.getRest());
    if (this.docId()) {
      savedApi$ = this.documentService.updateDocumentation(
        this.docId()!,
        this.getRest(),
      );
    }
    return savedApi$;
  }
  private updateValidator() {
    const isArticle = this.isArticle();
    if (isArticle) {
      this.form.controls.articleContent.setValidators([Validators.required]);
      this.form.controls.faqContent.clearValidators();
    } else {
      this.form.controls.faqContent.setValidators([Validators.required]);
      this.form.controls.articleContent.clearValidators();
    }
    this.form.controls.articleContent.updateValueAndValidity();
    this.form.controls.faqContent.updateValueAndValidity();
  }
  private getRest(): HelpCenterDocumentRequest {
    const value = this.form.value;
    const attachments = this.getRestAttachment();
    return {
      title: value.title!,
      isPrivate: value.isPrivate === 'true' ? true : false,
      supportCategoryId: value.supportCategoryId!,
      content:
        value.articleType === ArticleTypeEnum.article
          ? value.articleContent!
          : value.faqContent!,
      articleType: value.articleType!,
      language: value.language!,
      ...(attachments && { attachments }),
    };
  }

  private getRestAttachment(): Array<{ name: string; path: string }> {
    const { attachments, videoTitle } = this.form.value;
    const [attachment] = attachments ?? [];
    if (!attachment && !videoTitle) {
      return [];
    }

    return [
      {
        name: videoTitle!,
        path: (attachment as IAttachmentControlUploadedValue).key!,
      },
    ];
  }

  private patchForm(data: HelpCenterDocument) {
    this.form.patchValue({
      articleType: data.articleType,
      isPrivate: data.isPrivate ? 'true' : 'false',
      supportCategoryId: data.category.id,
      language: data.language,
      title: data.title,
      faqContent:
        data.articleType === ArticleTypeEnum.question ? data.content : '',
      articleContent:
        data.articleType === ArticleTypeEnum.article ? data.content : '',
      videoTitle: data.attachments?.[0]?.title ?? '',
      attachments: data.attachments,
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

export const videoAttachmentValidator: ValidatorFn = (
  formGroup: AbstractControl,
): ValidationErrors | null => {
  // Check the article type first.
  const articleType = formGroup.get('articleType')?.value;
  if (articleType !== ArticleTypeEnum.article) {
    // For FAQs (or other non-article types), skip validation.
    return null;
  }
  const videoTitle = formGroup.get('videoTitle')?.value;
  const attachments = formGroup.get('attachments')?.value;
  const isVideoTitleProvided = videoTitle && videoTitle.trim() !== '';
  const isAttachmentsProvided =
    attachments && Array.isArray(attachments) && attachments.length > 0;

  if (isVideoTitleProvided && !isAttachmentsProvided) {
    return {
      attachmentRequired: true,
    };
  }
  if (isAttachmentsProvided && !isVideoTitleProvided) {
    return {
      videoTitleRequired: true,
    };
  }

  return null;
};
