import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { DsAcceptFileType } from '@ds/attachment/attachment-type.constant';
import { ModalController } from '@ionic/angular/standalone';
import {
  SupportHubTicket,
  SupportHubTicketEscalation,
  SupportHubTicketEscalationPersonnel,
} from '../../data-access/support-hub-initiated-tickets.interface';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { UserProfileColors } from '@shared/enums';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { firstValueFrom } from 'rxjs';
import { ensureArray } from '@shared/utils/array.util';

interface EscalationPersonnelViewModel {
  readonly id: string;
  readonly name: string;
  readonly role: string | null;
  readonly avatarColor: UserProfileColors;
}

export interface SupportTicketDeescalatePayload {
  readonly message: string;
  readonly attachments: ReadonlyArray<DsAttachmentControlValue>;
}

@Component({
  selector: 'app-support-ticket-deescalate-modal',
  standalone: true,
  templateUrl: './support-ticket-deescalate-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsAttachmentFormControlComponent,
    DsTextareaComponent,
    DsTranslatePipe,
    AvatarComponent,
  ],
})
export class SupportTicketDeescalateModalComponent implements DsModalContentComponent {
  private readonly modalController = inject(ModalController);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translateService = inject(HesTranslateService);
  private readonly supportTicketsService = inject(SupportTicketsService);

  readonly ticket = input<SupportHubTicket | null>(null);
  readonly onSubmit = input<
    | ((payload: SupportTicketDeescalatePayload) => Promise<void> | void)
    | undefined
  >(undefined);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly isSubmitting = signal(false);
  readonly primaryButtonLoading = this.isSubmitting;
  readonly primaryButtonDisabled = signal(true);
  protected readonly attachmentAcceptTypes: DsAcceptFileType = [
    'IMAGES',
    'FILES',
  ];
  protected readonly attachmentMaxSizeMb = 5;
  private readonly avatarPalette: UserProfileColors[] = [
    UserProfileColors.CORAL,
    UserProfileColors.GREEN,
    UserProfileColors.INDIGO,
    UserProfileColors.TEAL,
    UserProfileColors.BRAND,
  ];
  private readonly fallbackEscalations = signal<
    SupportHubTicketEscalation[] | null
  >(null);
  private readonly isLoadingEscalations = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(1000)]],
    attachments: this.fb.nonNullable.control<DsAttachmentControlValue[]>([]),
  });

  protected readonly messageControl = computed(
    () => this.form.controls.message,
  );

  protected readonly ticketTitle = computed(() => {
    const ticket = this.ticket();
    return (
      ticket?.supportCategory?.displayName?.trim() ??
      ticket?.title?.trim() ??
      ''
    );
  });

  private readonly targetEscalation =
    computed<SupportHubTicketEscalation | null>(() => {
      const ticket = this.ticket();
      if (!ticket) {
        return null;
      }

      const current = ticket.currentEscalationLevelNumber;
      if (current === null || current === undefined) {
        return null;
      }

      const targetLevelNumber = current - 1;
      if (targetLevelNumber < 0) {
        return null;
      }

      const byCollection = ticket.ticketEscalations?.find(
        (escalation) => escalation.levelNumber === targetLevelNumber,
      );
      if (byCollection) {
        return byCollection;
      }

      const fallback = this.fallbackEscalations()?.find(
        (escalation) => escalation.levelNumber === targetLevelNumber,
      );
      if (fallback) {
        return fallback;
      }

      const singleEscalation = ticket.ticketEscalation;
      if (
        singleEscalation &&
        singleEscalation.levelNumber === targetLevelNumber
      ) {
        return singleEscalation;
      }

      return null;
    });

  protected readonly escalationLevelLabel = computed(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return null;
    }

    const current = ticket.currentEscalationLevelNumber;
    if (current === null || current === undefined) {
      return null;
    }

    const targetLevelNumber = current - 1;
    if (targetLevelNumber < 0) {
      return null;
    }

    if (targetLevelNumber === 0) {
      return this.translateService.translate(
        'support.ticket.deescalation.to_default_level',
      );
    }

    return this.translateService.translate(
      'support.ticket.deescalation.to_level',
      {
        levelNumber: targetLevelNumber,
      },
    );
  });

  protected readonly escalationPersonnels = computed<
    EscalationPersonnelViewModel[]
  >(() => {
    const personnels =
      this.targetEscalation()?.ticketEscalationPersonnels ?? [];

    return personnels
      .map((personnel, index) => {
        const name = this.resolvePersonnelName(personnel);
        if (!name) {
          return null;
        }

        const role = personnel.status?.trim() || null;

        return {
          id: String(personnel.personnelId ?? personnel.id),
          name,
          role,
          avatarColor:
            this.avatarPalette[index % this.avatarPalette.length] ??
            UserProfileColors.NEUTRAL,
        } satisfies EscalationPersonnelViewModel;
      })
      .filter((person): person is EscalationPersonnelViewModel => !!person);
  });

  constructor() {
    effect(
      () => {
        const ticket = this.ticket();
        if (!ticket) {
          this.fallbackEscalations.set(null);
          return;
        }

        const current = ticket.currentEscalationLevelNumber;
        if (current === null || current === undefined) {
          this.fallbackEscalations.set(null);
          return;
        }

        const targetLevel = current - 1;
        if (targetLevel < 0) {
          this.fallbackEscalations.set(null);
          return;
        }

        const hasTargetInTicket =
          ticket.ticketEscalations?.some(
            (escalation) => escalation.levelNumber === targetLevel,
          ) ?? false;

        if (hasTargetInTicket) {
          this.fallbackEscalations.set(null);
          return;
        }

        const fallback = this.fallbackEscalations();
        if (
          fallback?.some((escalation) => escalation.levelNumber === targetLevel)
        ) {
          return;
        }

        if (this.isLoadingEscalations()) {
          return;
        }

        this.isLoadingEscalations.set(true);
        void this.fetchEscalations(ticket);
      },
      { allowSignalWrites: true },
    );
    this.primaryButtonDisabled.set(this.form.invalid || this.isSubmitting());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.primaryButtonDisabled.set(
          this.form.invalid || this.isSubmitting(),
        );
      });
    effect(() => {
      this.primaryButtonDisabled.set(this.form.invalid || this.isSubmitting());
    });
  }

  onPrimaryClick(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.handleSubmit();
  }

  onSecondaryClick(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
      return;
    }
    void this.modalController.dismiss(null, 'cancel');
  }

  protected trackByPerson(
    _: number,
    person: EscalationPersonnelViewModel,
  ): string {
    return person.id;
  }

  private resolvePersonnelName(
    personnel: SupportHubTicketEscalationPersonnel | null | undefined,
  ): string | null {
    const name = personnel?.personnel?.displayName?.trim();
    return name?.length ? name : null;
  }

  private async fetchEscalations(ticket: SupportHubTicket): Promise<void> {
    try {
      const detail = await firstValueFrom(
        ticket.isInitiatorTicket
          ? this.supportTicketsService.getTicketDetailAsInitiator(ticket.id)
          : this.supportTicketsService.getTicketDetailsAsAssignee(
              ticket.id.toString(),
            ),
      );

      const mappedEscalations = ensureArray(detail.ticketEscalations).map(
        (escalation): SupportHubTicketEscalation => ({
          id: escalation.id,
          supportTypeId: null,
          schoolId: null,
          levelNumber: escalation.levelNumber,
          days: escalation.days ?? null,
          createdAt: null,
          updatedAt: null,
          createdBy: null,
          updatedBy: null,
          ticketEscalationPersonnels: ensureArray(
            escalation.ticketEscalationPersonnels,
          ).map((personnel) => {
            const displayName = personnel.displayName?.trim() ?? '';
            const identifier = personnel.userId ?? personnel.id;

            return {
              id: personnel.id,
              status: null,
              personnel: {
                id: identifier,
                arFullName: displayName,
                enFullName: displayName,
                displayName,
              },
              personnelId: identifier,
              ticketEscalationId: escalation.id,
            } satisfies SupportHubTicketEscalationPersonnel;
          }),
        }),
      );

      this.fallbackEscalations.set(
        mappedEscalations.length ? mappedEscalations : null,
      );
    } catch (error) {
      console.error('Failed to load de-escalation levels', error);
      this.fallbackEscalations.set(null);
    } finally {
      this.isLoadingEscalations.set(false);
    }
  }

  protected async handleSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    const submitHandler = this.onSubmit();

    if (!submitHandler || this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      await Promise.resolve(
        submitHandler({
          message: this.form.controls.message.value.trim(),
          attachments: [...this.form.controls.attachments.value],
        }),
      );
    } catch (error) {
      console.error('Failed to de-escalate ticket', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onClose(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
      return;
    }
    void this.modalController.dismiss(null, 'cancel');
  }
}
