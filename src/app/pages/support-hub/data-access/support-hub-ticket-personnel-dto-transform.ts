import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';
import { PersonnelDTO } from '@shared/dto-transformation/user-managment/personnel/personnel-dto';
import { SupportHubTicketPersonnel } from './support-hub-ticket-personnel.interface';

export const SUPPORT_HUB_TICKET_PERSONNEL_MAP_FROM_DTO = new (class {
  personnelList(dtos: PersonnelDTO[]): SupportHubTicketPersonnel[] {
    return ensureArray(dtos).map((dto) => this.personnel(dto));
  }

  personnel(dto: PersonnelDTO): SupportHubTicketPersonnel {
    return {
      id: dto.id,
      userId: dto.userId,
      displayName: getLocalizedFullName(dto),
      roles: ensureArray(dto.roles)
        .map((role) => getLocalizedName(role))
        .join(', '),
      profileColor: dto.profileColor,
    };
  }
})();
