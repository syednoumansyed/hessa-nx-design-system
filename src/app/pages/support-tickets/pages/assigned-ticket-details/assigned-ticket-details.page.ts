import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ITicketDetailActivity } from '@shared/interfaces/support-tickets.interface';
import { HesButtonModule } from '../../../../ui-kit/hes-button/hes-button.module';
import { ActivatedRoute } from '@angular/router';
import { TicketInitiatorComponent } from '@pages/support-tickets/components/ticket-initiator/ticket-initiator.component';
import { TicketDetailsComponent } from '@pages/support-tickets/components/ticket-details/ticket-details.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { isMobile } from '@shared/utils/platform';
import { SupportTicketActivityComponent } from '@pages/support-tickets/components/support-ticket-activity/support-ticket-activity.component';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  openDeEscalationModal,
  openEscalationModal,
  openResolveModal,
} from '@pages/support-tickets/escalation-resolve-modal';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { HelpCenterSupportTicketsService } from '@pages/help-center/data-access/support-tickets.service';
import { switchMap } from 'rxjs';
import {
  HesLadderComponent,
  HesLadderConfig,
} from '@ui-kit/hes-ladder/hes-ladder.component';
import { AuthService } from '@auth/auth.service';
import { createReassignModal } from '@pages/support-tickets/modals/reassign-ticket.modal';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SupportTicketStatus } from '@shared/enums';
import { SupportTicketDetail } from '@shared/dto-transformation';

@Component({
  selector: 'app-assigned-ticket',
  templateUrl: './assigned-ticket-details.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    TranslocoDirective,
    HesButtonModule,
    TicketInitiatorComponent,
    TicketDetailsComponent,
    SupportTicketActivityComponent,
    HesLadderComponent,
    RbacDirective,
    NgClass,
    IonIcon,
  ],
})
export class AssignedTicketDetailsPage implements OnInit {
  private rbcService = inject(RoleBaseAccessControlService);
  private supportTicketService = inject(SupportTicketsService);
  private readonly supportTicketsService = inject(
    HelpCenterSupportTicketsService,
  );
  private schoolScopeService = inject(SchoolStructureScopeService);
  private unreadNotificationService = inject(UnreadNotificationService);
  private translocoService = inject(TranslocoService);
  private activatedRoute = inject(ActivatedRoute);
  private modalCtrl = inject(ModalController);
  private toastr = inject(HesToasterService);
  private auth = inject(AuthService);
  /**
   * The ID of the ticket.
   * @type {string | null}
   */
  @Input() id: string | null = null;

  readonly reassignModal = createReassignModal();
  currentLang = this.translocoService.getActiveLang();

  ticketDetails = signal<SupportTicketDetail | undefined>(undefined);

  isAllowToPerformAction = computed<boolean>(() => {
    const currentUser = this.auth.user();
    const { ticketEscalations, ticketEscalationId, status } =
      this.ticketDetails() || {};

    // Deny action if the ticket status is resolved
    if (status === SupportTicketStatus.RESOLVED) return false;

    // Allow action if the user is a Super Admin
    if (this.rbcService.isSuperAdmin()) return true;

    // Check if the current user is assigned to the ticket escalation
    const currentEscalation = ticketEscalations?.find(
      (escalation) => escalation.id === ticketEscalationId,
    );
    const isUserAssignedToEscalation =
      currentEscalation?.ticketEscalationPersonnels.some(
        (personnel) => personnel.userId === currentUser?.id,
      );

    return !!isUserAssignedToEscalation;
  });

  escalationLadderConfig = computed<HesLadderConfig | null>(() => {
    const ticket = this.ticketDetails();
    if (!ticket?.ticketEscalations) {
      return null;
    }
    const currentLoginUser = this.auth.user();
    return {
      title: this.translocoService.translate(
        'support_tickets.escalation_ladder.title',
      ),
      activeLevel: this.getActiveLevel(),
      steps: ticket.ticketEscalations.map((escalation) => {
        const levelNumber = escalation.levelNumber;
        const title = escalation.ticketEscalationPersonnels
          .map((item) =>
            item.userId === currentLoginUser?.id
              ? this.translocoService.translate('global.you.txt')
              : item.displayName,
          )
          .join(', ');

        return {
          levelNumber,
          title,
          stepDetail: this.getStepDetail(levelNumber),
        };
      }),
    };
  });

  ticketDetailActivities = computed<ITicketDetailActivity[]>(() => {
    const ticketDetails = this.ticketDetails();
    if (!ticketDetails) {
      return [];
    }
    return this.supportTicketService.mapTicketDetailActivities(ticketDetails);
  });

  isMobile = isMobile();

  escalationPermissionId = RESOURCE_PERMISSION.supportTicket.escalateTicket;
  resolvePermissionId = RESOURCE_PERMISSION.supportTicket.resolveTicket;
  reassignPermissionId = RESOURCE_PERMISSION.supportTicket.reassign;
  deEscalatePermissionId = RESOURCE_PERMISSION.supportTicket.deEscalate;

  constructor() {}

  ngOnInit() {
    this.unreadNotificationService.loadUnreadForSelectedAcademicYear();
    this.ticketDetails.set(this.activatedRoute.snapshot.data['ticketDetails']);
  }

  refetchTicketDetails() {
    this.supportTicketService.getTicketDetailsAsAssignee(this.id!).subscribe({
      next: (res) => {
        this.ticketDetails.set(res);
      },
      error: (_err) => {
        this.toastr.error(
          this.translocoService.translate('global.wrong_msg.title'),
        );
      },
    });
  }

  onEscalate() {
    openEscalationModal({
      modalCtrl: this.modalCtrl,
      closeModal: () => this.modalCtrl.dismiss(),
      onEscalate: (description: any, attachments: File[]) => {
        const attachmentsToUpload = attachments ?? [];
        this.supportTicketsService
          .uploadFile(attachmentsToUpload)
          .pipe(
            switchMap((uploadedAttachments) => {
              const attachmentKeys =
                uploadedAttachments?.map((file) => file.key) || [];
              const payload: any = {
                description: description,
                ...(attachmentKeys.length && { attachments: attachmentKeys }),
                schoolStructureId:
                  this.schoolScopeService.selectedSchoolStructureItem()?.id!,
              };
              return this.supportTicketService.escalateTicket(
                this.id!,
                payload.description,
                payload.schoolStructureId,
                payload.attachments,
              );
            }),
          )
          .subscribe({
            next: () => {
              this.modalCtrl.dismiss();
              this.toastr.success(
                this.translocoService.translate(
                  'api.success.ticket.escalation.found',
                ),
              );
              this.refetchTicketDetails();
            },
            error: (_err) => {
              this.toastr.showBackendError(_err);
            },
          });
      },
    });
  }

  onDeEscalate() {
    openDeEscalationModal({
      modalCtrl: this.modalCtrl,
      deEscalate: true,
      closeModal: () => this.modalCtrl.dismiss(),
      onDeEscalate: (description: string, attachments: File[]) => {
        const attachmentsToUpload = attachments ?? [];
        this.supportTicketsService
          .uploadFile(attachmentsToUpload)
          .pipe(
            switchMap((uploadedAttachments) => {
              const attachmentKeys =
                uploadedAttachments?.map((file) => file.key) || [];
              const payload: any = {
                description: description,
                ...(attachmentKeys.length && { attachments: attachmentKeys }),
                schoolStructureId:
                  this.schoolScopeService.selectedSchoolStructureItem()?.id!,
                deEscalate: true,
              };
              return this.supportTicketService.escalateTicket(
                this.id!,
                payload.description,
                payload.schoolStructureId,
                payload.attachments,
                payload.deEscalate,
              );
            }),
          )
          .subscribe({
            next: () => {
              this.modalCtrl.dismiss();
              this.toastr.success(
                this.translocoService.translate(
                  'api.success.ticket.deescalation.found',
                ),
              );
              this.refetchTicketDetails();
            },
            error: (_err) => {
              this.toastr.showBackendError(_err);
            },
          });
      },
    });
  }

  onResolve() {
    openResolveModal({
      modalCtrl: this.modalCtrl,
      closeModal: () => this.modalCtrl.dismiss(),
      isResolve: true,
      onResolve: (description: any, attachments: File[]) => {
        const attachmentsToUpload = attachments ?? [];
        this.supportTicketsService
          .uploadFile(attachmentsToUpload)
          .pipe(
            switchMap((uploadedAttachments) => {
              const attachmentKeys =
                uploadedAttachments?.map((file) => file.key) || [];
              const payload: any = {
                description: description,
                ...(attachmentKeys.length && { attachments: attachmentKeys }),
                schoolStructureId:
                  this.schoolScopeService.selectedSchoolStructureItem()?.id!,
              };
              return this.supportTicketService.resolveTicket(
                this.id!,
                payload.description,
                payload.schoolStructureId,
                payload.attachments,
              );
            }),
          )
          .subscribe({
            next: () => {
              this.modalCtrl.dismiss();
              this.toastr.success(
                this.translocoService.translate(
                  'support_tickets.ticket_successfully_resolved.txt',
                  {},
                ),
              );
              this.refetchTicketDetails();
            },
            error: (_err) => {
              this.toastr.error(
                this.translocoService.translate('global.wrong_msg.title'),
                this.translocoService.translate(
                  'support_ticket.assigning_the_ticket_error_msg.txt',
                ),
              );
            },
          });
      },
    });
  }

  onReassign() {
    this.reassignModal({
      ticketId: this.id!,
      afterReassigned: () => {
        this.refetchTicketDetails();
      },
    });
  }

  isInitialLevel = computed(() => {
    const details = this.ticketDetails();
    return (
      !!details &&
      details.currentEscalationLevelNumber ===
        details.firstEscalationLevelNumber
    );
  });

  isLastLevel = () => {
    const details = this.ticketDetails();
    if (!details) {
      return false;
    }
    return (
      details.currentEscalationLevelNumber === details.lastEscalationLevelNumber
    );
  };

  private getActiveLevel(): number {
    const { ticketEscalations, ticketEscalationId } =
      this.ticketDetails() || {};
    return (
      ticketEscalations?.find((i) => i.id === ticketEscalationId)
        ?.levelNumber ?? -1
    );
  }

  private getStepDetail(levelNumber: number): string {
    if (levelNumber === 0) {
      return this.translocoService.translate(
        'support_ticket.default_escalation_level.title',
      );
    }
    return `${this.translocoService.translate('support_ticket.escalation_levels.title')} ${levelNumber}`;
  }
}
