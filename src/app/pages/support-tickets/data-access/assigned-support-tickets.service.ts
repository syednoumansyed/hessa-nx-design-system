import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';
import {
  SupportCategory,
  SupportTicketListItem,
  SupportTicketListItemDTO,
  SupportTicketType,
  TICKET_MAP_FROM_DTO,
} from '@shared/dto-transformation';
import { IPaginatedResponse, IPagination } from '@shared/interfaces';
import {
  IAssignedSupportTicketListItem,
  ISupportTicketQueryParams,
} from '@shared/interfaces/support-tickets.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AssignedSupportTicketsService {
  private _supportTickets = signal<IAssignedSupportTicketListItem[]>([]);
  readonly supportTickets = this._supportTickets.asReadonly();

  private _supportTicketsPagination = signal<IPagination | null>(null);
  readonly supportTicketsPagination =
    this._supportTicketsPagination.asReadonly();

  private _ticketTypes = signal<SupportTicketType[]>([]);
  readonly ticketTypes = this._ticketTypes.asReadonly();

  private _ticketCategories = signal<SupportCategory[]>([]);
  readonly ticketCategories = this._ticketCategories.asReadonly();

  readonly ticketCategoriesDropdownList = computed(() => {
    return this.ticketCategories().map((type) => {
      return {
        value: type.id,
        displayedValue: type.displayName,
      };
    });
  });

  constructor(private http: HttpClient) {}

  getMyAssignedTickets(
    params: ISupportTicketQueryParams,
  ): Observable<SupportTicketListItem[]> {
    //TODO: Remove schoolId will check
    const { schoolId, ...filteredParams } = params;
    return this.http
      .get<IPaginatedResponse<SupportTicketListItemDTO[]>>(
        `${ApiUrl.v1BE}/tickets/assigned`,
        {
          params: {
            ...DEFAULT_PARAM,
            ...filteredParams,
          },
        },
      )
      .pipe(
        map((res) => {
          const mapData = TICKET_MAP_FROM_DTO.supportTicketListItems(res.data);
          const assignedTickets =
            this.mapISupportTicketListItemToIAssignedSupportTicketListItem(
              mapData,
            );
          this._supportTickets.set(assignedTickets);
          this._supportTicketsPagination.set(res.paginate);
          return mapData;
        }),
      );
  }

  mapISupportTicketListItemToIAssignedSupportTicketListItem(
    data: SupportTicketListItem[],
  ): IAssignedSupportTicketListItem[] {
    return data.map((item) => {
      return {
        id: item.id,
        createdAt: item.createdAt,
        supportType: item.supportType.displayName,
        supportCategory: item.supportCategory.displayName,
        title: item.title,
        firstEscalationLevelNumber: item.firstEscalationLevelNumber,
        currentEscalationLevelNumber: item.currentEscalationLevelNumber,
        lastEscalationLevelNumber: item.lastEscalationLevelNumber,
        createdByName: item?.createdBy?.displayName || '-',
        assignedTo: item.ticketEscalation.ticketEscalationPersonnels
          .map((p) => p.personnel.displayName)
          .join(', '),
        status: item.status,
      };
    });
  }
}
