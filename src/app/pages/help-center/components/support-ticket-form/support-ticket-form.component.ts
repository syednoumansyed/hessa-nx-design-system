import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { IonSpinner } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import { HelpCenterSupportTicketsService } from '../../data-access/support-tickets.service';
import { finalize, switchMap } from 'rxjs';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SupportTicketPayload } from '@shared/interfaces/support-tickets.interface';
import { TICKET_SUPPORT_TYPE } from '@pages/help-center/constants/helo-center.constant';
import { SupportTicketsService } from '@shared/services/support-tickets.service';

interface IControlWithCharCount extends IControl {
  charCount?: number;
  charLimit?: number;
}

@Component({
  selector: 'app-support-ticket-form',
  templateUrl: './support-ticket-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesButtonModule,
    IonSpinner,
  ],
})
export class SupportTicketFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly supportTicketsService = inject(SupportTicketsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly helpCenterSupportTicketsService = inject(
    HelpCenterSupportTicketsService,
  );
  private readonly toasterService = inject(HesToasterService);
  private readonly schoolScropeService = inject(SchoolStructureScopeService);
  @Input() closeModal: (isreload: boolean) => void = () => {};

  readonly titleMaxLength = 100;
  readonly titleCharCount = signal<number>(0);

  form = this.fb.group({
    title: this.fb.control<string>('', [
      Validators.required,
      Validators.maxLength(this.titleMaxLength),
    ]),
    description: this.fb.control<string>('', Validators.required),
    supportTypeId: this.fb.control<number | null>(null, Validators.required),
    supportCategoryId: this.fb.control<number | null>(
      null,
      Validators.required,
    ),
    attachments: this.fb.control<Array<IAttachmentControlValue>>([]),
  });

  supportTypes = signal<ISelectValue[]>([]);
  supportCategories = signal<ISelectValue[]>([]);
  loading = signal<boolean>(false);
  formConfig = computed<IControlWithCharCount[]>(() => {
    return [
      {
        label: this.translate('support_ticket.category_req.label'),
        placeholder: this.translate('support_ticket.select_type.dropdown'),
        formControlName: 'supportTypeId',
        type: 'searchable-select',
        required: true,
        selectValues: this.supportTypes(),
      },
      {
        label: this.translate('support_tickets.sub_category_title.label'),
        placeholder: this.translate('support_ticket.select_category.dropdown'),
        formControlName: 'supportCategoryId',
        type: 'searchable-select',
        required: true,
        selectValues: this.supportCategories(),
      },
      {
        label: this.translate('global.title_req.label'),
        type: 'input',
        formControlName: 'title',
        required: true,
        placeholder: this.translate('global.enter_title.placeholder'),
        charCount: this.titleCharCount(),
        charLimit: this.titleMaxLength,
      },
      {
        label: this.translate('global.description_req.label'),
        type: 'textarea',
        formControlName: 'description',
        required: true,
        placeholder: this.translate('global.enter_description.placeholder'),
        subLabel: this.translate('support_ticket.description_details.label'),
      },
      {
        type: 'file',
        label: this.translocoService.translate('global.attachments.label'),
        formControlName: 'attachments',
        placeholder: this.translocoService.translate(
          'support_ticket.upload_attachments.btn',
        ),
        required: false,
        isMultiple: true,
        acceptFileTypes: ['FILES', 'IMAGES'],
        maxSizeInMB: 1024,
      },
    ];
  });
  readonly cancelIcon: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };
  constructor() {}

  ngOnInit() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.titleCharCount.set(value?.length ?? 0);
      });

    this.supportTicketsService
      .getSupportsTypesSelectValue()
      .subscribe((types) => {
        const filteredTypes = types?.filter(
          (type) => type?.displayedValue !== TICKET_SUPPORT_TYPE.SUPPORT,
        );
        this.supportTypes.set(filteredTypes);
      });

    this.form.controls.supportTypeId.valueChanges
      .pipe(
        switchMap((value) =>
          this.supportTicketsService.getSupportsCategoriesSelectValue(value!),
        ),
      )
      .subscribe((resp) => {
        this.supportCategories.set(resp);
      });
  }

  onSave() {
    this.loading.set(true);
    const attachments = this.form.value.attachments ?? [];
    this.helpCenterSupportTicketsService
      .uploadFile(attachments)
      .pipe(
        switchMap((attachments) => {
          this.form.controls.attachments.setValue(attachments);
          let payload: SupportTicketPayload = {
            ...this.getRestPayload(),
            ...(attachments?.length && {
              attachments: attachments.map((i) => i.key),
            }),
          };

          return this.helpCenterSupportTicketsService.createTicket(payload);
        }),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toasterService.success(
            this.translate('support_ticket.ticket_successfully_submitted.txt'),
          );
          this.closeModal(true);
        },
        error: (error) => {
          this.toasterService.showBackendError(error);
        },
      });
  }

  getRestPayload(): SupportTicketPayload {
    const value = this.form.value;
    return {
      title: value.title,
      description: value.description!,
      supportTypeId: value.supportTypeId!,
      supportCategoryId: value.supportCategoryId!,
      schoolId: this.schoolScropeService.selectedSchoolStructureItem()!.id,
    };
  }
  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
