import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { AnnouncementDTO } from './announcements.dto';
import { Announcement } from './announcements.interface';
import { getLocalizedName } from '@shared/utils/localization.util';

export const ANNOUNCEMENTS_MAP_FROM_DTO = new (class {
  announcement(dto: AnnouncementDTO): Announcement {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      status: dto.status,
      type: dto.type,
      viewsCount: dto.viewsCount,
      sendCount: dto.sendCount,
      createdBy: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.createdBy),
      attachments: dto.attachments,
      targets: dto.targets.map((target) => ({
        displayName: getLocalizedName(target),
        type: target.type,
        entityId: target.entityId,
      })),
      targetRoles: dto.targetRoles.map((role) => ({
        id: role.id,
        displayName: getLocalizedName(role),
      })),
      createdAt: dto.createdAt,
    };
  }

  announcements(dtos: AnnouncementDTO[]): Announcement[] {
    return dtos.map((dto) => this.announcement(dto));
  }
})();
