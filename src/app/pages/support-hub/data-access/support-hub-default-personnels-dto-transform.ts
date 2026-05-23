import { SupportHubDefaultPersonnelsDTO } from './support-hub-default-personnels.dto';
import { SupportHubTicketPersonnel } from './support-hub-ticket-personnel.interface';
import { UserProfileColors } from '@shared/enums';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';

function normalizeProfileColor(color: string | null): UserProfileColors {
  const key = (color ?? '').toUpperCase();
  // Map backend string to enum if possible; default to NEUTRAL
  return (UserProfileColors as any)[key] ?? UserProfileColors.NEUTRAL;
}

export const SUPPORT_HUB_DEFAULT_PERSONNELS_DTO_TRANSFORM = {
  personnels(dto: SupportHubDefaultPersonnelsDTO): SupportHubTicketPersonnel[] {
    const list = dto.personnels ?? [];
    return list.map((item) => {
      const user = item.personnel?.user;
      const fullNameIdent = user
        ? COMMON_MAP_FROM_DTO.fullNameIdentifiable({
            id: user.id,
            arFullName: user.arFullName ?? '',
            enFullName: user.enFullName ?? '',
          })
        : {
            id: item.personnel?.userId ?? 0,
            displayName: 'Unknown',
            arFullName: 'Unknown',
            enFullName: 'Unknown',
          };
      const displayName = fullNameIdent.displayName;
      const profileColor = normalizeProfileColor(user?.profileColor ?? null);
      return {
        id: item.id,
        userId: item.personnel?.userId ?? 0,
        displayName,
        roles: '',
        profileColor,
      };
    });
  },
};
