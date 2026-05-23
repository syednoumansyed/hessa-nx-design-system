import { ensureArray } from '@shared/utils/array.util';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  SupportHubTicketDTO,
  SupportHubTicketEscalationDTO,
  SupportHubTicketEscalationPersonnelDTO,
} from './support-hub-initiated-tickets.dto';
import {
  SupportHubTicket,
  SupportHubTicketEscalation,
  SupportHubTicketEscalationPersonnel,
} from './support-hub-initiated-tickets.interface';
import {
  COMMON_MAP_FROM_DTO,
  FullNameLocalizedIdentifiable,
  FullNameLocalizedIdentifiableDTO,
} from '@shared/dto-transformation';

export const SUPPORT_HUB_TICKETS_MAP_FROM_DTO = new (class {
  initiated(dto: SupportHubTicketDTO[]): SupportHubTicket[] {
    return this.tickets(dto, true);
  }

  assigned(dto: SupportHubTicketDTO[]): SupportHubTicket[] {
    return this.tickets(dto, false);
  }

  private tickets(
    dto: SupportHubTicketDTO[],
    isInitiatorTicket: boolean,
  ): SupportHubTicket[] {
    return ensureArray(dto).map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      hideInitiatorName: ticket.hideInitiatorName,
      schoolId: ticket.schoolId,
      status: ticket.status,
      isResolved: ticket.isResolved,
      supportType: {
        id: ticket.supportType.id,
        displayName: getLocalizedName({
          arName: ticket.supportType.supportTypeArName,
          enName: ticket.supportType.supportTypeEnName,
        }),
        icon: ticket.supportType.icon ?? null,
      },
      supportCategory: {
        id: ticket.supportCategory.id,
        displayName: getLocalizedName({
          arName: ticket.supportCategory.categoryArName,
          enName: ticket.supportCategory.categoryEnName,
        }),
        icon: ticket.supportCategory.icon ?? null,
      },
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: COMMON_MAP_FROM_DTO.fullNameIdentifiable(ticket.createdBy),
      updatedBy: ticket.updatedBy
        ? COMMON_MAP_FROM_DTO.fullNameIdentifiable(ticket.updatedBy)
        : null,
      firstEscalationLevelNumber: ticket.firstEscalationLevelNumber,
      currentEscalationLevelNumber: ticket.currentEscalationLevelNumber,
      lastEscalationLevelNumber: ticket.lastEscalationLevelNumber,
      ticketEscalation: this.mapTicketEscalation(ticket.ticketEscalation),
      ticketEscalations: this.mapTicketEscalations(ticket.ticketEscalations),
      students: this.students(ensureArray(ticket.students)),
      isInitiatorTicket,
    }));
  }

  private mapTicketEscalation(
    dto: SupportHubTicketEscalationDTO | null | undefined,
  ): SupportHubTicketEscalation | null {
    if (!dto) {
      return null;
    }

    return {
      id: dto.id,
      supportTypeId: dto.supportTypeId,
      schoolId: dto.schoolId,
      levelNumber: dto.levelNumber,
      days: dto.days,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
      ticketEscalationPersonnels: ensureArray(
        dto.ticketEscalationPersonnels,
      ).map((personnel) => this.personnel(personnel)),
    };
  }

  private mapTicketEscalations(
    dtos: SupportHubTicketEscalationDTO[] | null | undefined,
  ): SupportHubTicketEscalation[] {
    return ensureArray(dtos)
      .map((item) => this.mapTicketEscalation(item))
      .filter((item): item is SupportHubTicketEscalation => item !== null);
  }

  private personnel(
    dto: SupportHubTicketEscalationPersonnelDTO,
  ): SupportHubTicketEscalationPersonnel {
    const sourcePerson = dto.personnel ?? dto.user;
    const personnelId = dto.personnelId ?? dto.userId ?? sourcePerson?.id ?? 0;
    const displayName =
      dto.displayName ??
      sourcePerson?.enFullName ??
      sourcePerson?.arFullName ??
      '';

    const mappedPerson: FullNameLocalizedIdentifiable = sourcePerson
      ? COMMON_MAP_FROM_DTO.fullNameIdentifiable(sourcePerson)
      : {
          id: personnelId,
          arFullName: displayName,
          enFullName: displayName,
          displayName,
        };

    return {
      id: dto.id,
      status: dto.status ?? null,
      personnel: mappedPerson,
      personnelId,
      ticketEscalationId: dto.ticketEscalationId ?? null,
    };
  }

  private students(
    dtos: FullNameLocalizedIdentifiableDTO[],
  ): { id: number; displayName: string }[] {
    return dtos.map((dto) => ({
      id: dto.id,
      displayName: getLocalizedFullName({
        arFullName: dto.arFullName,
        enFullName: dto.enFullName,
      }),
    }));
  }
})();
