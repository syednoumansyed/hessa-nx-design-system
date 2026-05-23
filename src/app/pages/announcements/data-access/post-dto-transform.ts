import { ensureArray } from '@shared/utils/array.util';
import {
  AnnouncementRolesDTO,
  AnnouncementUserDTO,
  PostAuthorDetailsDTO,
  PostDataDTO,
  ViewPosDatatDTO,
} from './post.dto';
import {
  AnnouncementRole,
  AnnouncementUser,
  Post,
  PostAuthorDetail,
  ViewPost,
} from './post.interface';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { UserProfileColors } from '@shared/enums';

export const ANOUNCEMENT_POST_MAP_FROM_DTO = new (class {
  post(dto: PostDataDTO): Post {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      status: dto.status,
      type: dto.type,
      academicYearId: dto.academicYearId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      viewsCount: dto.viewsCount,
      sendCount: dto.sendCount,
      createdBy: {
        ...COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.createdBy),
        profileColor: dto.createdBy.profileColor as UserProfileColors,
      },
      updatedBy: dto.updatedBy
        ? COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.updatedBy)
        : null,
      attachments: dto.attachments,
      targets: this.postTargets(dto.targets),
      targetRoles: this.postTargetRoles(dto.targetRoles),
    };
  }

  posts(dto: PostDataDTO[]): Post[] {
    return ensureArray(dto).map((item) => {
      return this.post(item);
    });
  }

  postTargets(dto: PostDataDTO['targets']): Post['targets'] {
    return ensureArray(dto).map((target) => ({
      displayName: getLocalizedName(target),
      type: target.type,
      entityId: target.entityId,
      parentId: target.parentId,
    }));
  }

  postTargetRoles(dto: PostDataDTO['targetRoles']): Post['targetRoles'] {
    return ensureArray(dto).map((role) => ({
      id: role.id,
      displayName: getLocalizedName(role),
    }));
  }

  userFeedPosts(dto: ViewPosDatatDTO[]): ViewPost[] {
    return ensureArray(dto).map((item) => {
      return {
        ...this.post(item),
        viewed: item.viewed,
        createdFor: ensureArray(item.createdFor).map((cf) => {
          return typeof cf === 'string' ? cf : getLocalizedFullName(cf);
        }),
        reactions: ensureArray(item.reactions),
      };
    });
  }

  authorDetails(dto: PostAuthorDetailsDTO): PostAuthorDetail {
    const { schoolStructure } = dto;
    const { companies, campuses, schools } = schoolStructure;
    return {
      displayName: getLocalizedFullName(dto),
      nationalId: dto.nationalId,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      gender: dto.gender,
      profileColor: dto.profileColor as UserProfileColors,
      userId: dto.userId,
      personnelId: dto.personnelId,
      roles: COMMON_MAP_FROM_DTO.displayNameIdentifiables(dto.roles),
      countryCode: dto.countryCode,
      schoolStructure: {
        companies: COMMON_MAP_FROM_DTO.displayNameIdentifiables(companies),
        campuses: COMMON_MAP_FROM_DTO.displayNameIdentifiables(campuses),
        schools: COMMON_MAP_FROM_DTO.displayNameIdentifiables(schools),
      },
    };
  }

  announcementUsers(dto: AnnouncementUserDTO[]): AnnouncementUser[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      displayName: getLocalizedFullName(item),
      displayedValue: `${item.countryCode || ''} ${item.phoneNumber || ''}`,
      value: item.id,
      countryCode: item.countryCode,
      phoneNumber: item.phoneNumber,
      userId: item.userId,
      roleId: item.roleId,
    }));
  }

  announcementRoles(dto: AnnouncementRolesDTO[]): AnnouncementRole[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      displayName: getLocalizedName(item),
      selected: item.selected,
    }));
  }
})();
