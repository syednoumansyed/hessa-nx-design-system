import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  WritableSignal,
  computed,
  inject,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ITicketDetailActivity } from '@shared/interfaces/support-tickets.interface';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TicketDetailsComponent } from '@pages/support-tickets/components/ticket-details/ticket-details.component';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import {
  HelpCenterSupportTicketsService,
  HelpCenterSupportTicketsService as MySupportTicketService,
} from '../../../../data-access/support-tickets.service';
import { SupportTicketActivityComponent } from '../../../../../support-tickets/components/support-ticket-activity/support-ticket-activity.component';
import { FaIconComponentsProps } from '@shared/types';
import { faXmark, faCircleCheck } from '@fortawesome/pro-regular-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import { openEscalationModal } from '@pages/support-tickets/escalation-resolve-modal';
import { ModalController } from '@ionic/angular/standalone';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { switchMap } from 'rxjs';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { SupportTicketStatus } from '@shared/enums';
import { SupportTicketDetail } from '@shared/dto-transformation';

@Component({
  selector: 'app-my-ticket-details-dialog',
  templateUrl: './my-ticket-details-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    TicketDetailsComponent,
    SupportTicketActivityComponent,
  ],
})
export class MyTicketDetailsDialogComponent implements OnInit {
  private readonly unreadCountService = inject(UnreadNotificationService);
  private readonly supportTicketService = inject(SupportTicketsService);
  private readonly supportTicketsService = inject(
    HelpCenterSupportTicketsService,
  );
  private readonly mySupportTicketService = inject(MySupportTicketService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalCtrl = inject(ModalController);
  private toastr = inject(HesToasterService);

  @Input() ticketDetails: WritableSignal<SupportTicketDetail>;
  @Input() closeModal: () => void;

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };

  readonly faCircleCheck: FaIconComponentsProps = {
    icon: faCircleCheck,
    class: 'text-[#12B76A] text-xl',
  };

  ticketDetailActivities = computed<ITicketDetailActivity[]>(() => {
    const ticketDetails = this.ticketDetails();

    if (!ticketDetails) {
      return [];
    }
    // return ticket activities and only show the ones that are done by the current user or are resolved by admin
    return this.supportTicketService
      .mapTicketDetailActivities(ticketDetails)
      .filter(
        (activity) =>
          activity.activityType === SupportTicketStatus.RESOLVED ||
          activity.isCurrUSer,
      );
  });

  isticketResolvedByAdmin = computed<boolean>(() => {
    const ticketDetailActivities = this.ticketDetailActivities();

    if (!ticketDetailActivities.length) {
      return false;
    }

    return (
      ticketDetailActivities.pop()?.activityType ===
      SupportTicketStatus.RESOLVED
    );
  });

  isMobile = isMobile();

  SupportTicketStatus = SupportTicketStatus;

  constructor() {}

  ngOnInit() {
    this.unreadCountService.loadUnread();
  }

  OpenEscalationConfirmationDialog() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'support_ticket.escalate_ticket.title',
        ),
        modalMessage: this.translocoService.translate(
          'support_ticket.escalate_this_ticket.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'support_ticket.escalate.btn',
        ),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.onEscalate();
      },
      () => {},
    );
  }

  onEscalate() {
    openEscalationModal({
      modalCtrl: this.modalCtrl,
      closeModal: () => this.modalCtrl.dismiss(),
      onEscalate: (description, attachments) => {
        const attachmentsToUpload = attachments ?? [];
        this.supportTicketsService
          .uploadFile(attachmentsToUpload)
          .pipe(
            switchMap((uploadedAttachments: any) => {
              const attachmentKeys =
                uploadedAttachments?.map((file: any) => file.key) || [];
              const payload: any = {
                id: this.ticketDetails()?.id.toString(),
                description: description,
                ...(attachmentKeys.length && { attachments: attachmentKeys }),
                schoolStructureId: this.ticketDetails().schoolId,
              };
              return this.supportTicketService.escalateTicket(
                payload.id,
                payload.description,
                payload.schoolStructureId,
                payload.attachments,
              );
            }),
          )
          .subscribe({
            next: () => {
              this.refetchTicketDetails();
              this.modalCtrl.dismiss();
              this.toastr.success(
                this.translocoService.translate(
                  'api.success.ticket.escalation.found',
                ),
              );
            },
            error: (err) => {
              this.toastr.showBackendError(err);
              this.modalCtrl.dismiss();
              this.openEscalationLimitReachedModal();
            },
          });
      },
    });
  }

  openEscalationLimitReachedModal() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'support_tickets.limit_reached.title',
        ),
        modalMessage: this.translocoService.translate(
          'support_tickets.limit_reached.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.ok.btn'),
      },
      () => {},
      () => {},
    );
  }

  resolveMyTicket() {
    this.mySupportTicketService
      .resolveMyTicket(this.ticketDetails()?.id)
      .subscribe({
        next: () => {
          this.refetchTicketDetails();
        },
        error: ({ error }) => {
          this.toastr.error(
            !!error.message
              ? error.message
              : this.translocoService.translate('global.wrong_msg.title'),
          );
        },
      });
  }

  refetchTicketDetails() {
    this.supportTicketService
      .getTicketDetailAsInitiator(this.ticketDetails()?.id)
      .subscribe({
        next: (res) => {
          this.ticketDetails.set(res);
        },
      });
  }
}
