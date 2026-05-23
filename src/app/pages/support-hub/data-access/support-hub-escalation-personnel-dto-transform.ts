import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedFullName } from '@shared/utils/localization.util';
import { SupportHubEscalationPersonnelDTO } from './support-hub-escalation-personnel.dto';
import { SupportHubEscalationPersonnel } from './support-hub-escalation-personnel.interface';

export const SUPPORT_HUB_ESCALATION_PERSONNEL_MAP_FROM_DTO = new (class {
  personnels(
    dtos: SupportHubEscalationPersonnelDTO[],
  ): SupportHubEscalationPersonnel[] {
    return ensureArray(dtos).map((dto) => this.personnel(dto));
  }

  personnel(
    dto: SupportHubEscalationPersonnelDTO,
  ): SupportHubEscalationPersonnel {
    const preferredName = (dto.preferredName ?? '').trim();
    const localizedName = getLocalizedFullName(dto);
    return {
      id: dto.id,
      userId: dto.userId,
      profileColor: dto.profileColor,
      displayName: localizedName || preferredName,
    };
  }
})();
