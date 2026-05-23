import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { TranslocoService } from '@jsverse/transloco';
import { IResponse } from '@shared/interfaces';
import {
  IReassignTicketPayload,
  ITicketDetailActivity,
} from '@shared/interfaces/support-tickets.interface';
import { Observable, map } from 'rxjs';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  SupportCategory,
  SupportTicketDetail,
  SupportTicketType,
} from '@shared/dto-transformation/ticket/ticket.interface';
import {
  SupportCategoryDTO,
  SupportTicketDetailDTO,
  SupportTicketTypeDTO,
  TICKET_MAP_FROM_DTO,
} from '@shared/dto-transformation';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';

@Injectable({
  providedIn: 'root',
})
export class SupportTicketsService {
  private translocoService = inject(TranslocoService);

  private readonly auth = inject(AuthService);

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

  currUserId = this.auth.user()?.id;

  constructor(private http: HttpClient) {}

  getTicketDetailsAsAssignee(
    ticketId: string,
  ): Observable<SupportTicketDetail> {
    return this.http
      .get<
        IResponse<SupportTicketDetailDTO>
      >(`${ApiUrl.v1BE}/tickets/assigned/${ticketId}`)
      .pipe(map((res) => TICKET_MAP_FROM_DTO.supportTicketDetail(res.data)));
  }

  getTicketDetailAsInitiator(
    ticketId: number,
  ): Observable<SupportTicketDetail> {
    return this.http
      .get<
        IResponse<SupportTicketDetailDTO>
      >(`${ApiUrl.v1BE}/tickets/initiated/${ticketId}`)
      .pipe(map((res) => TICKET_MAP_FROM_DTO.supportTicketDetail(res.data)));
  }

  reassignTicket(ticketId: string, params: IReassignTicketPayload) {
    return this.http.put(
      `${ApiUrl.v1BE}/tickets/${ticketId}/re-assign`,
      params,
    );
  }

  getSupportsTypes(): Observable<SupportTicketType[]> {
    return this.http
      .get<IResponse<SupportTicketTypeDTO[]>>(`${ApiUrl.v1BE}/tickets/types`)
      .pipe(
        map((res) => {
          const types = TICKET_MAP_FROM_DTO.supportTicketTypes(res.data);
          this._ticketTypes.set(types);
          return types;
        }),
      );
  }

  getSupportsCategories(supportTypeId?: number): Observable<SupportCategory[]> {
    return this.http
      .get<IResponse<SupportCategoryDTO[]>>(
        `${ApiUrl.v1BE}/tickets/categories`,
        {
          params: {
            ...(supportTypeId && { supportTypeId }),
          },
        },
      )
      .pipe(
        map((res) => {
          const categories = TICKET_MAP_FROM_DTO.supportCategories(res.data);
          this._ticketCategories.set(categories);
          return categories;
        }),
      );
  }

  escalateTicket(
    ticketId: string,
    description: string,
    schoolId: number,
    attachments?: string[],
    deEscalate: boolean = false,
  ) {
    return this.http.put<IResponse<any>>(
      `${ApiUrl.v1BE}/tickets/${ticketId}/escalate`,
      { description, schoolId, attachments, deEscalate },
    );
  }

  resolveTicket(
    ticketId: string,
    description: string,
    schoolId: number,
    attachments?: string[],
  ) {
    return this.http.put<IResponse<any>>(
      `${ApiUrl.v1BE}/tickets/${ticketId}/resolve`,
      { description, schoolId, attachments },
    );
  }

  mapTicketDetailActivities(ticketDetails: SupportTicketDetail) {
    const activities: ITicketDetailActivity[] = [];
    activities.push({
      fullName: ticketDetails.userDisplayName,
      initiator: true,
      activityDate: ticketDetails.createdAt,
    });
    ticketDetails.ticketActivity?.forEach((activity) => {
      const metadata = activity.metadata ?? {};
      const metadataUser = metadata.user ?? null;
      const actorName =
        metadataUser?.displayName ??
        (metadataUser as { enName?: string | null })?.enName ??
        (metadataUser as { arName?: string | null })?.arName ??
        ticketDetails.userDisplayName;

      activities.push({
        fullName: actorName,
        isCurrUSer: activity.userId === this.currUserId,
        activityDate: activity.createdAt,
        activityType: activity.status,
        description: activity.description,
        attachments: activity.attachments,
        newLevelNumber:
          metadata.currentLevelNumber != null
            ? metadata.currentLevelNumber
            : undefined,
      });
    });
    const reversedActivities = activities.slice().reverse();
    return reversedActivities;
  }

  getSupportsTypesSelectValue(): Observable<ISelectValue[]> {
    return this.getSupportsTypes().pipe(
      map((types) => {
        return types.map((type) => {
          return {
            displayedValue: type.displayName,
            value: type.id,
          };
        });
      }),
    );
  }

  getSupportsCategoriesSelectValue(
    supportTypeId: number,
  ): Observable<ISelectValue[]> {
    return this.getSupportsCategories(supportTypeId).pipe(
      map((categories) => {
        return categories.map((category) => {
          return {
            displayedValue: category.displayName,
            value: category.id,
          };
        });
      }),
    );
  }
}
