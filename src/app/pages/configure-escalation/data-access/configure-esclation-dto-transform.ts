import { get } from 'lodash';
import { EscalationTypeDetailsDTO } from './configure-escalation.dto';
import { EscalationTypeDetails } from './configure-escalation.interface';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';

export const CONFIGURE_ESCLATION_MAP_FROM_DTO = new (class {
  escalationTypeDetail(dto: EscalationTypeDetailsDTO): EscalationTypeDetails {
    return {
      supportType: {
        id: dto.supportType.id,
        displayName: getLocalizedName(dto.supportType),
      },
      escalations: ensureArray(dto.escalations).map((escalation) => ({
        id: escalation.id,
        days: escalation.days,
        levelNumber: escalation.levelNumber,
        personnels: ensureArray(escalation.personnels).map((personnel) => ({
          personnelId: personnel.id,
          displayName: getLocalizedFullName(personnel.user),
        })),
      })),
    };
  }

  escalationTypeDetails(
    dto: EscalationTypeDetailsDTO[],
  ): EscalationTypeDetails[] {
    return dto.map((item) => this.escalationTypeDetail(item));
  }
})();
