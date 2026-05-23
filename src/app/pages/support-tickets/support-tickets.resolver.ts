import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SupportTicketsService } from '@shared/services/support-tickets.service';

export const supportTicketsTypesResolver: ResolveFn<any> = (_route, _state) => {
  const supportTicketsService = inject(SupportTicketsService);
  return supportTicketsService.getSupportsTypes();
};

export const supportTicketCaterogiesResolver: ResolveFn<any> = (
  _route,
  _state,
) => {
  const supportTicketsService = inject(SupportTicketsService);
  return supportTicketsService.getSupportsCategories();
};

export const supportTicketDetailsResolver: ResolveFn<any> = (route, _state) => {
  const supportTicketsService = inject(SupportTicketsService);

  const schoolScopeService = inject(SchoolStructureScopeService);

  const ticketId = route.paramMap.get('id');

  const selectedSchoolId: number | undefined =
    schoolScopeService.selectedSchoolStructureItem()?.id;

  if (selectedSchoolId && ticketId) {
    return supportTicketsService.getTicketDetailsAsAssignee(ticketId);
  }
  return undefined;
};
