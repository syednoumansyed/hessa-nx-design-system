import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { buildHttpParams } from '@shared/utils/build-http-params.utils';
import { Observable, catchError, map, of } from 'rxjs';
import { SupportHubTicketDTO } from './support-hub-initiated-tickets.dto';
import {
  SupportHubTicket,
  SupportHubTicketEscalation,
  SupportHubTicketEscalationPersonnel,
  SupportHubTicketsQueryParams,
} from './support-hub-initiated-tickets.interface';
import { SUPPORT_HUB_TICKETS_MAP_FROM_DTO } from './support-hub-initiated-tickets-dto-transform';
import { HesLogService } from '@shared/services/hes-log.service';
import { SupportTicketPayload } from '@shared/interfaces/support-tickets.interface';
import { SupportTicketStatus } from '@shared/enums';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { FileUploadService } from '@shared/services/file-upload.service';
import { SupportHubTicketDetailDTO } from './support-hub-ticket-detail.dto';
import { SupportHubTicketDetail } from './support-hub-ticket-detail.interface';
import { SUPPORT_HUB_TICKET_DETAIL_MAP_FROM_DTO } from './support-hub-ticket-detail-dto-transform';
import { PersonnelDTO } from '@shared/dto-transformation/user-managment/personnel/personnel-dto';
import { SupportHubTicketPersonnel } from './support-hub-ticket-personnel.interface';
import { SUPPORT_HUB_TICKET_PERSONNEL_MAP_FROM_DTO } from './support-hub-ticket-personnel-dto-transform';
import {
  SubmitTicketFeedbackPayload,
  SupportTicketFeedback,
} from '../components/ticket-feedback-modal/data-access/support-ticket-feedback.interface';
import { SupportTicketFeedbackDTO } from '../components/ticket-feedback-modal/data-access/support-ticket-feedback.dto';
import { SUPPORT_TICKET_FEEDBACK_MAP_FROM_DTO } from '../components/ticket-feedback-modal/data-access/support-ticket-feedback-dto-transform';
import { FullNameLocalizedIdentifiable } from '@shared/dto-transformation';
import { UpdateCategoryPayload } from '@pages/support-hub/components/category-modal/category-update-wizard-modal.component';
import { SupportHubDefaultPersonnelsDTO } from './support-hub-default-personnels.dto';
import { SUPPORT_HUB_DEFAULT_PERSONNELS_DTO_TRANSFORM } from './support-hub-default-personnels-dto-transform';
import { SupportHubEscalationPersonnelDTO } from './support-hub-escalation-personnel.dto';
import { SupportHubEscalationPersonnel } from './support-hub-escalation-personnel.interface';
import { SUPPORT_HUB_ESCALATION_PERSONNEL_MAP_FROM_DTO } from './support-hub-escalation-personnel-dto-transform';

type SupportHubTicketDetailEscalation =
  SupportHubTicketDetail['ticketEscalations'][number];
type SupportHubTicketDetailEscalationPersonnel =
  SupportHubTicketDetailEscalation['ticketEscalationPersonnels'][number];

@Injectable({ providedIn: 'root' })
export class SupportHubTicketsService {
  private readonly _initiatedTickets = signal<SupportHubTicket[]>([]);
  readonly initiatedTickets = this._initiatedTickets.asReadonly();

  private readonly _assignedTickets = signal<SupportHubTicket[]>([]);
  readonly assignedTickets = this._assignedTickets.asReadonly();

  private readonly _initiatedTicketsPagination = signal<IPagination | null>(
    null,
  );
  readonly initiatedTicketsPagination =
    this._initiatedTicketsPagination.asReadonly();

  private readonly _assignedTicketsPagination = signal<IPagination | null>(
    null,
  );
  readonly assignedTicketsPagination =
    this._assignedTicketsPagination.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly logServices: HesLogService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  loadInitiatedTickets(
    params: SupportHubTicketsQueryParams,
    append: boolean = false,
  ): Observable<SupportHubTicket[]> {
    const httpParams = buildHttpParams({
      order: 'desc',
      ...params,
    });

    return this.http
      .get<IPaginatedResponse<SupportHubTicketDTO[]>>(
        `${ApiUrl.v1BE}/tickets/initiated`,
        {
          params: httpParams,
        },
      )
      .pipe(
        map((response) => {
          const tickets = SUPPORT_HUB_TICKETS_MAP_FROM_DTO.initiated(
            response.data,
          );
          if (append) {
            this._initiatedTickets.set([
              ...this._initiatedTickets(),
              ...tickets,
            ]);
          } else {
            this._initiatedTickets.set(tickets);
          }
          this._initiatedTicketsPagination.set(response.paginate);
          return tickets;
        }),
      );
  }

  getCategoryDefaultPersonnel(
    schoolId: number,
    categoryId: number,
  ): Observable<SupportHubTicketPersonnel[]> {
    return this.http
      .get<
        IResponse<SupportHubDefaultPersonnelsDTO>
      >(`${ApiUrl.v2BE}/tickets/default-personnels/${schoolId}/${categoryId}`)
      .pipe(
        map((res) =>
          SUPPORT_HUB_DEFAULT_PERSONNELS_DTO_TRANSFORM.personnels(res.data),
        ),
      );
  }

  resetInitiatedTickets(error?: HttpErrorResponse): void {
    if (error) {
      this.logServices.error('fetch-initiated-tickets[Support-hub]', error);
    }
    this._initiatedTickets.set([]);
    this._initiatedTicketsPagination.set(null);
  }

  loadAssignedTickets(
    params: SupportHubTicketsQueryParams,
    append: boolean = false,
  ): Observable<SupportHubTicket[]> {
    const httpParams = buildHttpParams({
      order: 'desc',
      assigneeStatus: params.assigneeStatus ?? 'ALL',
      ...params,
    });

    return this.http
      .get<IPaginatedResponse<SupportHubTicketDTO[]>>(
        `${ApiUrl.v1BE}/tickets/assigned`,
        {
          params: httpParams,
        },
      )
      .pipe(
        map((response) => {
          const tickets = SUPPORT_HUB_TICKETS_MAP_FROM_DTO.assigned(
            response.data,
          );
          if (append) {
            this._assignedTickets.set([...this._assignedTickets(), ...tickets]);
          } else {
            this._assignedTickets.set(tickets);
          }
          this._assignedTicketsPagination.set(response.paginate);
          return tickets;
        }),
      );
  }

  loadEscalationPersonnels(
    params: Pick<
      SupportHubTicketsQueryParams,
      'companyIds' | 'schoolIds' | 'campusIds'
    >,
  ): Observable<IResponse<SupportHubEscalationPersonnel[]>> {
    const httpParams = buildHttpParams(params);
    return this.http
      .get<IResponse<SupportHubEscalationPersonnelDTO[]>>(
        `${ApiUrl.v2BE}/tickets/escalation-personnels`,
        {
          params: httpParams,
        },
      )
      .pipe(
        map((response) => ({
          ...response,
          data: SUPPORT_HUB_ESCALATION_PERSONNEL_MAP_FROM_DTO.personnels(
            response.data,
          ),
        })),
      );
  }

  updateTicketCategory(
    ticket: SupportHubTicket,
    payload: UpdateCategoryPayload,
  ): Observable<any> {
    return this.http.put(
      `${ApiUrl.v2BE}/tickets/${ticket.id}/category`,
      payload,
    );
  }

  resetAssignedTickets(error?: HttpErrorResponse): void {
    if (error) {
      this.logServices.error('fetch-assigned-tickets[Support-hub]', error);
    }
    this._assignedTickets.set([]);
    this._assignedTicketsPagination.set(null);
  }

  updateTicketStatus(ticketId: number, status: SupportTicketStatus): void {
    const updateStatus = (tickets: SupportHubTicket[]) =>
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket,
      );

    const initiated = this._initiatedTickets();
    if (initiated.length) {
      this._initiatedTickets.set(updateStatus(initiated));
    }

    const assigned = this._assignedTickets();
    if (assigned.length) {
      this._assignedTickets.set(updateStatus(assigned));
    }
  }

  uploadTicketAttachments(
    attachments: IAttachmentControlValue[],
  ): Observable<IAttachmentControlUploadedValue[]> {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/tickets/file/upload`,
      attachments,
    );
  }

  createTicket(payload: SupportTicketPayload) {
    return this.http.post(`${ApiUrl.v1BE}/tickets`, payload);
  }

  getTicketDetailsAsAssignee(
    ticketId: string,
  ): Observable<SupportHubTicketDetail> {
    return this.http
      .get<
        IResponse<SupportHubTicketDetailDTO>
      >(`${ApiUrl.v1BE}/tickets/assigned/${ticketId}`)
      .pipe(
        map((res) =>
          SUPPORT_HUB_TICKET_DETAIL_MAP_FROM_DTO.ticketDetail(res.data),
        ),
      );
  }

  getTicketDetailAsInitiator(
    ticketId: number,
  ): Observable<SupportHubTicketDetail> {
    return this.http
      .get<
        IResponse<SupportHubTicketDetailDTO>
      >(`${ApiUrl.v1BE}/tickets/initiated/${ticketId}`)
      .pipe(
        map((res) =>
          SUPPORT_HUB_TICKET_DETAIL_MAP_FROM_DTO.ticketDetail(res.data),
        ),
      );
  }

  getTicketPersonnels(
    schoolId: number,
    params?: {
      searchText?: string;
      pageNumber?: number;
      itemsPerPage?: number;
    },
  ): Observable<{
    personnels: SupportHubTicketPersonnel[];
    pagination: IPagination;
  }> {
    const httpParams = buildHttpParams(params ?? {});

    return this.http
      .get<
        IPaginatedResponse<PersonnelDTO[]>
      >(`${ApiUrl.v1BE}/tickets/re-assign/personnels/${schoolId}`, { params: httpParams })
      .pipe(
        map((res) => {
          const personnels =
            SUPPORT_HUB_TICKET_PERSONNEL_MAP_FROM_DTO.personnelList(res.data);
          return {
            personnels,
            pagination: res.paginate,
          };
        }),
      );
  }

  reAssignTicket(
    ticketId: number,
    payload: {
      supportTypeId: number;
      supportCategoryId: number;
      personnelIds?: number[];
      unassignedPersonnelIds?: number[];
    },
  ): Observable<unknown> {
    return this.http.put(
      `${ApiUrl.v1BE}/tickets/${ticketId}/re-assign`,
      payload,
    );
  }

  submitTicketResolvedFeedback(
    payload: SubmitTicketFeedbackPayload,
  ): Observable<IResponse<SupportTicketFeedbackDTO>> {
    return this.http.post<IResponse<SupportTicketFeedbackDTO>>(
      `${ApiUrl.v2BE}/ticket-feedback`,
      payload,
    );
  }

  getTicketFeedback(
    ticketId: number,
  ): Observable<SupportTicketFeedback | null> {
    return this.http
      .get<
        IResponse<SupportTicketFeedbackDTO[]>
      >(`${ApiUrl.v2BE}/ticket-feedback/ticket/${ticketId}`)
      .pipe(
        map((response) =>
          SUPPORT_TICKET_FEEDBACK_MAP_FROM_DTO.first(response.data ?? null),
        ),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }

          this.logServices.error('fetch-ticket-feedback[Support-hub]', error);
          return of(null);
        }),
      );
  }

  reopenTicketAsInitiator(
    ticketId: number,
    payload: { description: string; schoolId: number },
  ): Observable<unknown> {
    return this.http.put(`${ApiUrl.v1BE}/tickets/${ticketId}/re-open`, payload);
  }

  resolveTicketAsInitiator(ticketId: number): Observable<unknown> {
    return this.http.put(`${ApiUrl.v1BE}/tickets/${ticketId}/status`, {
      isResolved: true,
    });
  }

  refreshTicket(
    ticketId: number,
    isInitiatorTicket: boolean,
  ): Observable<SupportHubTicket | null> {
    const load$ = isInitiatorTicket
      ? this.getTicketDetailAsInitiator(ticketId)
      : this.getTicketDetailsAsAssignee(String(ticketId));

    return load$.pipe(
      map((detail) =>
        this.applyDetailToTicketStores(detail, isInitiatorTicket),
      ),
    );
  }

  /**
   * Fetches a ticket by ID and prepends it to the appropriate list.
   * Used for deep linking when the ticket is not in the currently loaded pages.
   * Tries initiated endpoint first, falls back to assigned endpoint.
   * Throws error if ticket is not found in either endpoint.
   */
  fetchAndPrependTicket(ticketId: number): Observable<SupportHubTicket> {
    // Try initiated endpoint first
    return this.getTicketDetailAsInitiator(ticketId).pipe(
      map((detail) => this.prependTicketFromDetail(detail, true)),
      catchError(() => {
        // If initiated fails, try assigned endpoint
        return this.getTicketDetailsAsAssignee(String(ticketId)).pipe(
          map((detail) => this.prependTicketFromDetail(detail, false)),
          // Don't catch here - let the error propagate if both endpoints fail
        );
      }),
    );
  }

  /**
   * Converts a ticket detail to a list ticket and prepends it to the appropriate list.
   */
  private prependTicketFromDetail(
    detail: SupportHubTicketDetail,
    isInitiatorTicket: boolean,
  ): SupportHubTicket {
    const ticket = this.convertDetailToTicket(detail, isInitiatorTicket);

    if (isInitiatorTicket) {
      const current = this._initiatedTickets();
      // Only prepend if not already in list
      if (!current.some((t) => t.id === ticket.id)) {
        this._initiatedTickets.set([ticket, ...current]);
      }
    } else {
      const current = this._assignedTickets();
      // Only prepend if not already in list
      if (!current.some((t) => t.id === ticket.id)) {
        this._assignedTickets.set([ticket, ...current]);
      }
    }

    return ticket;
  }

  /**
   * Converts a SupportHubTicketDetail to a SupportHubTicket for list display.
   */
  private convertDetailToTicket(
    detail: SupportHubTicketDetail,
    isInitiatorTicket: boolean,
  ): SupportHubTicket {
    const supportType = detail.supportTypes.find(
      (type) => type.id === detail.supportTypeId,
    );
    const supportCategory = detail.supportCategories.find(
      (category) => category.id === detail.supportCategoryId,
    );

    const escalations = this.mapDetailEscalations(detail);
    const currentEscalation =
      escalations.find(
        (item) => item.levelNumber === detail.currentEscalationLevelNumber,
      ) ?? null;

    return {
      id: detail.id,
      title: detail.title,
      description: detail.description,
      hideInitiatorName: false,
      schoolId: detail.schoolId,
      status: detail.status,
      supportType: {
        id: detail.supportTypeId,
        displayName: supportType?.displayName ?? '',
      },
      supportCategory: {
        id: detail.supportCategoryId,
        displayName: supportCategory?.displayName ?? '',
      },
      createdAt: detail.createdAt,
      updatedAt: null,
      createdBy: {
        id: detail.createdBy ?? detail.initiator?.id ?? 0,
        displayName: detail.initiator?.displayName ?? detail.userDisplayName,
      },
      updatedBy: null,
      firstEscalationLevelNumber: detail.firstEscalationLevelNumber,
      currentEscalationLevelNumber: detail.currentEscalationLevelNumber,
      lastEscalationLevelNumber: detail.lastEscalationLevelNumber,
      ticketEscalation: currentEscalation,
      ticketEscalations: escalations,
      students: detail.students ?? [],
      isInitiatorTicket,
    };
  }

  private applyDetailToTicketStores(
    detail: SupportHubTicketDetail,
    isInitiatorTicket: boolean,
  ): SupportHubTicket | null {
    let updated: SupportHubTicket | null = null;

    const updateCollection = (
      tickets: SupportHubTicket[],
      setCollection: (value: SupportHubTicket[]) => void,
    ): void => {
      const index = tickets.findIndex((ticket) => ticket.id === detail.id);
      if (index === -1) {
        return;
      }

      const merged = this.mergeTicketWithDetail(
        tickets[index],
        detail,
        isInitiatorTicket,
      );
      const next = tickets.slice();
      next[index] = merged;
      setCollection(next);
      updated = merged;
    };

    updateCollection(this._initiatedTickets(), (value) =>
      this._initiatedTickets.set(value),
    );
    updateCollection(this._assignedTickets(), (value) =>
      this._assignedTickets.set(value),
    );

    return updated;
  }

  private mergeTicketWithDetail(
    existing: SupportHubTicket,
    detail: SupportHubTicketDetail,
    isInitiatorTicket: boolean,
  ): SupportHubTicket {
    const supportTypeName =
      detail.supportTypes.find((type) => type.id === detail.supportTypeId)
        ?.displayName ?? existing.supportType.displayName;

    const supportCategoryName = detail.supportCategories.find(
      (category) => category.id === detail.supportCategoryId,
    )?.displayName;

    const escalations = this.mapDetailEscalations(detail);
    const currentEscalation =
      escalations.find(
        (item) => item.levelNumber === detail.currentEscalationLevelNumber,
      ) ?? null;

    const students = detail.students.map((student) => ({
      id: student.id,
      displayName: student.displayName,
    }));

    return {
      ...existing,
      title: detail.title,
      description: detail.description,
      status: detail.status,
      supportType: {
        id: detail.supportTypeId,
        displayName: supportTypeName,
      },
      supportCategory: {
        id: detail.supportCategoryId,
        displayName:
          supportCategoryName ?? existing.supportCategory.displayName,
      },
      isResolved: detail.isResolved,
      firstEscalationLevelNumber: detail.firstEscalationLevelNumber,
      currentEscalationLevelNumber: detail.currentEscalationLevelNumber,
      lastEscalationLevelNumber: detail.lastEscalationLevelNumber,
      ticketEscalations: escalations.length
        ? escalations
        : existing.ticketEscalations,
      ticketEscalation: currentEscalation ?? existing.ticketEscalation,
      students: students.length ? students : existing.students,
      isInitiatorTicket,
    };
  }

  private mapDetailEscalations(
    detail: SupportHubTicketDetail,
  ): SupportHubTicketEscalation[] {
    return detail.ticketEscalations.map((escalation) => ({
      id: escalation.id,
      supportTypeId: null,
      schoolId: null,
      levelNumber: escalation.levelNumber,
      days: escalation.days ?? null,
      createdAt: null,
      updatedAt: null,
      createdBy: null,
      updatedBy: null,
      ticketEscalationPersonnels: escalation.ticketEscalationPersonnels.map(
        (personnel) =>
          this.mapDetailEscalationPersonnel(personnel, escalation.id),
      ),
    }));
  }

  private mapDetailEscalationPersonnel(
    personnel: SupportHubTicketDetailEscalationPersonnel,
    escalationId: number,
  ): SupportHubTicketEscalationPersonnel {
    const name = (personnel.displayName ?? '').trim();
    const normalizedName = name.length ? name : 'Unknown';

    return {
      id: personnel.id,
      status: null,
      personnel: this.toLocalizedFullName(personnel.userId, normalizedName),
      personnelId: personnel.userId,
      ticketEscalationId: escalationId,
    };
  }

  private toLocalizedFullName(
    id: number,
    displayName: string,
  ): FullNameLocalizedIdentifiable {
    return {
      id,
      displayName,
      arFullName: displayName,
      enFullName: displayName,
    };
  }
}
