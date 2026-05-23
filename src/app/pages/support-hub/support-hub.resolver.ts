import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { SupportHubTicketsService } from './data-access/support-hub-tickets.service';
import { catchError, forkJoin, map, of } from 'rxjs';

export interface SupportHubTicketPresence {
  hasInitiated: boolean;
  hasAssigned: boolean;
}

export const supportHubTicketPresenceResolver: ResolveFn<
  SupportHubTicketPresence
> = (_route, _state) => {
  const ticketsService = inject(SupportHubTicketsService);

  const initiated$ = ticketsService
    .loadInitiatedTickets({ pageNumber: 1, itemsPerPage: 1 })
    .pipe(catchError(() => of([])));

  const assigned$ = ticketsService
    .loadAssignedTickets({ pageNumber: 1, itemsPerPage: 1 })
    .pipe(catchError(() => of([])));

  return forkJoin([initiated$, assigned$]).pipe(
    map(([initiated, assigned]) => ({
      hasInitiated: initiated.length > 0,
      hasAssigned: assigned.length > 0,
    })),
  );
};
