import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';
import {
  SupportTicketListItem,
  SupportTicketListItemDTO,
  TICKET_MAP_FROM_DTO,
} from '@shared/dto-transformation';
import { IPaginatedResponse, IPagination } from '@shared/interfaces';
import {
  ISupportTicketQueryParams,
  SupportTicketPayload,
} from '@shared/interfaces/support-tickets.interface';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HelpCenterSupportTicketsService {
  private _supportTickets = signal<SupportTicketListItem[]>([]);
  readonly supportTickets = this._supportTickets.asReadonly();

  private _supportTicketsPagination = signal<IPagination | null>(null);
  readonly supportTicketsPagination =
    this._supportTicketsPagination.asReadonly();

  constructor(
    private http: HttpClient,
    private readonly fileUploadService: FileUploadService,
  ) {}

  getMyInitiatedTickets(
    params: ISupportTicketQueryParams,
  ): Observable<SupportTicketListItem[]> {
    return this.http
      .get<IPaginatedResponse<SupportTicketListItemDTO[]>>(
        `${ApiUrl.v1BE}/tickets/initiated`,
        {
          params: {
            ...DEFAULT_PARAM,
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          const data = TICKET_MAP_FROM_DTO.supportTicketListItems(res.data);
          this._supportTickets.set(data);
          this._supportTicketsPagination.set(res.paginate);
          return data;
        }),
      );
  }

  deleteTicketById(id: number) {
    return this.http.delete(`${ApiUrl.v1BE}/tickets/${id}`);
  }

  uploadFile(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadFiles(
      `${ApiUrl.v1BE}/tickets/file/upload`,
      attachments,
    );
  }

  createTicket(payload: SupportTicketPayload) {
    return this.http.post(`${ApiUrl.v1BE}/tickets`, payload);
  }

  /**
   * Resolves a support ticket by initiator.
   * @param ticketId - The ID of the ticket.
   * @returns A promise that resolves to the HTTP response from the server.
   */
  resolveMyTicket(ticketId: number) {
    return this.http.put(`${ApiUrl.v1BE}/tickets/${ticketId}/status`, {
      isResolved: true,
    });
  }

  getTicketAssigneesByTarget(params: {
    targets: { entityId: number; type: string; name: string }[];
  }) {
    return this.http
      .post(`${ApiUrl.v1BE}/tickets/assignees`, params)
      .pipe(map((res: any) => res.data));
  }

  getTicketInitiatorsByTarget(params: {
    targets: { entityId: number; type: string; name: string }[];
  }) {
    return this.http
      .post(`${ApiUrl.v1BE}/tickets/initiators`, params)
      .pipe(map((res: any) => res.data));
  }
}
