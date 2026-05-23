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
import { faArrowTurnUp } from '@fortawesome/pro-solid-svg-icons';
import {
  SupportHubTicket,
  SupportHubTicketEscalation,
  SupportHubTicketEscalationPersonnel,
} from '../../data-access/support-hub-initiated-tickets.interface';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors, UserType } from '@shared/enums';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { ensureArray } from '@shared/utils/array.util';
import { firstValueFrom } from 'rxjs';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

export interface SupportTicketEscalatePayload {
  readonly message: string;
  readonly attachments: ReadonlyArray<DsAttachmentControlValue>;
}

interface EscalationPersonnelViewModel {
  readonly id: string;
  readonly name: string;
  readonly role: string | null;
  readonly avatarColor: UserProfileColors;
}

@Component({
  selector: 'app-support-ticket-escalate-modal',
  standalone: true,
  templateUrl: './support-ticket-escalate-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsAttachmentFormControlComponent,
    DsTextareaComponent,
    AvatarComponent,
    DsTranslatePipe,
  ],
})
export class SupportTicketEscalateModalComponent implements DsModalContentComponent {
  private readonly modalController = inject(ModalController);
  private readonly fb = inject(FormBuilder);
  private readonly supportTicketsService = inject(SupportTicketsService);
  private readonly translateService = inject(HesTranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ticket = input<SupportHubTicket | null>(null);
  readonly onSubmit = input<
    | ((payload: SupportTicketEscalatePayload) => Promise<void> | void)
    | undefined
  >(undefined);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly escalateIcon = faArrowTurnUp;
  protected readonly isSubmitting = signal(false);
  readonly primaryButtonLoading = this.isSubmitting;
  readonly primaryButtonDisabled = signal(true);
  protected readonly attachmentAcceptTypes: DsAcceptFileType = [
    'IMAGES',
    'FILES',
  ];
  protected readonly attachmentMaxSizeMb = 5;
  private readonly fallbackEscalations = signal<
    SupportHubTicketEscalation[] | null
  >(null);
  private readonly isLoadingEscalations = signal(false);
  private readonly initiatorRoleLabel = signal<string | null>(null);

  private readonly avatarPalette: readonly UserProfileColors[] = [
    UserProfileColors.BRAND,
    UserProfileColors.EMERALD,
    UserProfileColors.BLUE,
    UserProfileColors.CORAL,
    UserProfileColors.TEAL,
    UserProfileColors.PURPLE,
    UserProfileColors.INDIGO,
    UserProfileColors.GREEN,
    UserProfileColors.YELLOW,
  ];

  protected readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(1000)]],
    attachments: this.fb.nonNullable.control<DsAttachmentControlValue[]>([]),
  });

  constructor() {
    effect(
      () => {
        const ticket = this.ticket();
        if (!ticket) {
          this.fallbackEscalations.set(null);
          return;
        }

        const targetLevel = this.resolveNextEscalationLevel(ticket);
        if (targetLevel === null) {
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
        void this.fetchEscalations(ticket, targetLevel);
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
    effect(
      () => {
        const ticket = this.ticket();
        this.initiatorRoleLabel.set(null);
        if (!ticket) {
          return;
        }
        void this.loadInitiatorRole(ticket);
      },
      { allowSignalWrites: true },
    );
  }

  private readonly targetEscalation = computed(
    (): SupportHubTicketEscalation | null => {
      const ticket = this.ticket();
      if (!ticket) {
        return null;
      }

      const targetLevelNumber = this.resolveNextEscalationLevel(ticket);
      if (targetLevelNumber === null) {
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
    },
  );

  protected readonly escalationLevelLabel = computed(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return null;
    }

    const targetLevelNumber = this.resolveNextEscalationLevel(ticket);
    if (targetLevelNumber === null) {
      return null;
    }

    return this.translateService.translate(
      'support.ticket.escalation.to_level',
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

  protected readonly escalationHint = computed(() => {
    const roleLabel = this.initiatorRoleLabel();
    if (!roleLabel) {
      return null;
    }
    return this.translateService.translate('support.form.escalate.hint', {
      roleName: roleLabel,
    });
  });

  protected trackByPerson(
    _: number,
    person: EscalationPersonnelViewModel,
  ): string {
    return person.id;
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

  private resolveNextEscalationLevel(ticket: SupportHubTicket): number | null {
    const current = ticket.currentEscalationLevelNumber;
    if (current === null || current === undefined) {
      const fallback = ticket.ticketEscalation?.levelNumber;
      return fallback ?? null;
    }

    const nextLevel = current + 1;

    if (
      ticket.lastEscalationLevelNumber !== null &&
      ticket.lastEscalationLevelNumber !== undefined &&
      nextLevel > ticket.lastEscalationLevelNumber
    ) {
      return null;
    }

    return nextLevel;
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
      console.error('Failed to escalate ticket', error);
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

  private resolvePersonnelName(
    personnel: SupportHubTicketEscalationPersonnel,
  ): string {
    if (!personnel?.personnel) {
      return '';
    }

    return (
      personnel.personnel.displayName?.trim() ||
      personnel.personnel.enFullName?.trim() ||
      personnel.personnel.arFullName?.trim() ||
      ''
    );
  }

  private async fetchEscalations(
    ticket: SupportHubTicket,
    targetLevel: number,
  ): Promise<void> {
    try {
      const detail = await firstValueFrom(
        ticket.isInitiatorTicket
          ? this.supportTicketsService.getTicketDetailAsInitiator(ticket.id)
          : this.supportTicketsService.getTicketDetailsAsAssignee(
              ticket.id.toString(),
            ),
      );
      if (!this.initiatorRoleLabel()) {
        this.initiatorRoleLabel.set(this.resolveInitiatorRoleLabel(detail));
      }

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

      if (mappedEscalations.length) {
        this.fallbackEscalations.set(mappedEscalations);
      } else {
        this.fallbackEscalations.set(null);
      }
    } catch (error) {
      console.error('Failed to load escalation levels', error);
      this.fallbackEscalations.set(null);
    } finally {
      this.isLoadingEscalations.set(false);
    }
  }

  private async loadInitiatorRole(ticket: SupportHubTicket): Promise<void> {
    try {
      const detail = await firstValueFrom(
        ticket.isInitiatorTicket
          ? this.supportTicketsService.getTicketDetailAsInitiator(ticket.id)
          : this.supportTicketsService.getTicketDetailsAsAssignee(
              ticket.id.toString(),
            ),
      );
      this.initiatorRoleLabel.set(this.resolveInitiatorRoleLabel(detail));
    } catch {
      this.initiatorRoleLabel.set(null);
    }
  }

  private resolveInitiatorRoleLabel(
    detail: {
      initiator?: { type?: UserType | null } | null;
      createdByType?: UserType | null;
    } | null,
  ): string | null {
    const initiatorType =
      detail?.initiator?.type ?? detail?.createdByType ?? null;

    switch (initiatorType) {
      case UserType.STUDENT:
        return this.translateService.t('global.student.txt');
      case UserType.GUARDIAN:
        return this.translateService.t('enum.GUARDIAN');
      case UserType.PERSONNEL:
      default:
        return null;
    }
  }
}
