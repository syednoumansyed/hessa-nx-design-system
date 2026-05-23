import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  SubCategoryDetailDTO,
  SupportCategoryDTO,
  SupportTicketDetailDTO,
  SupportTicketListItemDTO,
  SupportTicketTypeDTO,
  SupportTicketUserDTO,
  SupportTypeCustomFieldDTO,
  SupportTypeDTO,
  TicketEscalationDTO,
} from './ticket-dto';
import {
  SubCategoryDetail,
  SupportCategory,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketType,
  SupportTicketUser,
  SupportType,
  SupportTypeCustomField,
  TicketEscalation,
} from './ticket.interface';
import { ensureArray } from '@shared/utils/array.util';
import { COMMON_MAP_FROM_DTO } from '../common';

export const TICKET_MAP_FROM_DTO = new (class {
  /**
   * Transform support type DTO to interface - unified method for both list and detail
   */
  supportType(dto: SupportTypeDTO): SupportType {
    return {
      id: dto.id,
      arName: dto.arName,
      enName: dto.enName,
      displayName: getLocalizedName(dto),
      accessLevel: dto.accessLevel,
      isForArticle: dto.isForArticle,
      isForTicket: dto.isForTicket,
      createdAt: dto.createdAt,
      // Fields from list API
      categoryCount: dto.categoryCount,
      createdBy: dto.createdBy
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : undefined,
      // Fields from detail API
      arDescription: dto.arDescription,
      enDescription: dto.enDescription,
      icon: dto.icon,
      allowPrivateRequest: dto.allowPrivateRequest,
      customFields: dto.customFields
        ? ensureArray(dto.customFields).map((cf) =>
            this.supportTypeCustomField(cf),
          )
        : undefined,
    };
  }

  supportTypes(dto: SupportTypeDTO[]): SupportType[] {
    return ensureArray(dto).map((item) => this.supportType(item));
  }

  subCategory(dto: SubCategoryDetailDTO): SubCategoryDetail {
    return {
      ...this.supportType(dto),
      supportTypeId: dto.supportTypeId,
    };
  }

  subCategories(dto: SubCategoryDetailDTO[]): SubCategoryDetail[] {
    return ensureArray(dto).map((subCategory) => this.subCategory(subCategory));
  }

  supportTicketTypes(dto: SupportTicketTypeDTO[]): SupportTicketType[] {
    return ensureArray(dto).map((type) => ({
      id: type.id,
      displayName: getLocalizedName(type),
    }));
  }

  supportCategories(dto: SupportCategoryDTO[]): SupportCategory[] {
    return ensureArray(dto).map((type) => ({
      id: type.id,
      displayName: getLocalizedName(type),
    }));
  }

  supportTicketListItems(
    dto: SupportTicketListItemDTO[],
  ): SupportTicketListItem[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      schoolId: item.schoolId,
      title: item.title,
      description: item.description,
      status: item.status,
      supportType: {
        id: item.supportType.id,
        displayName: getLocalizedName({
          arName: item.supportType.supportTypeArName,
          enName: item.supportType.supportTypeEnName,
        }),
      },
      supportCategory: {
        id: item.supportCategory.id,
        displayName: getLocalizedName({
          arName: item.supportCategory.categoryArName,
          enName: item.supportCategory.categoryEnName,
        }),
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      ticketEscalation: this.ticketEscalation(item.ticketEscalation),
      firstEscalationLevelNumber: item.firstEscalationLevelNumber,
      currentEscalationLevelNumber: item.currentEscalationLevelNumber,
      lastEscalationLevelNumber: item.lastEscalationLevelNumber,
      createdBy: item.createdBy
        ? COMMON_MAP_FROM_DTO.createdBy(item.createdBy)
        : null,
    }));
  }

  ticketEscalation(dto: TicketEscalationDTO): TicketEscalation {
    return {
      id: dto.id,
      supportTypeId: dto.supportTypeId,
      schoolId: dto.schoolId,
      levelNumber: dto.levelNumber,
      days: dto.days,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      ticketEscalationPersonnels: ensureArray(
        dto.ticketEscalationPersonnels,
      ).map((personnel) => ({
        id: personnel.id,
        status: personnel.status,
        personnel: {
          id: personnel.personnel.id,
          displayName: getLocalizedFullName(personnel.personnel),
        },
        personnelId: personnel.personnelId,
        ticketEscalationId: personnel.ticketEscalationId,
      })),
    };
  }

  supportTicketDetail(dto: SupportTicketDetailDTO): SupportTicketDetail {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      isResolved: dto.isResolved,
      schoolId: dto.schoolId,
      createdByType: dto.createdByType,
      createdBy: dto.createdBy ?? null,
      ticketEscalationId: dto.ticketEscalationId,
      firstEscalationLevelNumber: dto.firstEscalationLevelNumber,
      currentEscalationLevelNumber: dto.currentEscalationLevelNumber,
      lastEscalationLevelNumber: dto.lastEscalationLevelNumber,
      supportTypeId: dto.supportTypeId,
      supportCategoryId: dto.supportCategoryId,
      ticketActivity: this.ticketActivity(dto.ticketActivity),
      createdAt: dto.createdAt,
      schoolStructure: {
        company: COMMON_MAP_FROM_DTO.nameIdentifiable(
          dto.schoolStructure.company,
        ),
        campus: COMMON_MAP_FROM_DTO.nameIdentifiable(
          dto.schoolStructure.campus,
        ),
        school: COMMON_MAP_FROM_DTO.nameIdentifiable(
          dto.schoolStructure.school,
        ),
      },
      supportTypes: ensureArray(dto.supportTypes).map((type) => ({
        id: type.id,
        displayName: getLocalizedName(type),
      })),
      supportCategories: ensureArray(dto.supportCategories).map((category) => ({
        id: category.id,
        displayName: getLocalizedName(category),
      })),
      users: ensureArray(dto.user).map((user) => this.supportTicketUser(user)),
      user: this.supportTicketUser(ensureArray(dto.user)?.[0]),
      userDisplayName:
        ensureArray(dto.user) && dto.user.length > 0
          ? getLocalizedFullName(dto.user[0])
          : '',
      roles: ensureArray(dto.roles).map((role) => ({
        id: role.id,
        displayName: getLocalizedName(role),
      })),
      rolesDisplayName: ensureArray(dto.user)
        .map((user) => ({
          displayName: getLocalizedFullName(user),
        }))
        .join(', '),
      ticketEscalations: ensureArray(dto.ticketEscalations).map(
        (escalation) => ({
          id: escalation.id,
          days: escalation.days,
          levelNumber: escalation.levelNumber,
          ticketEscalationPersonnels: ensureArray(
            escalation.ticketEscalationPersonnels,
          ).map((personnel) => ({
            id: personnel.id,
            userId: personnel.user.id,
            displayName: getLocalizedFullName(personnel.user),
          })),
        }),
      ),
      attachments: dto.attachments ? ensureArray(dto.attachments) : null,
    };
  }

  ticketActivity(
    dto: SupportTicketDetailDTO['ticketActivity'],
  ): SupportTicketDetail['ticketActivity'] {
    return ensureArray(dto).map((activity) => ({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      userId: activity.userId,
      metadata: {
        currentLevelNumber: activity.metadata?.currentLevelNumber ?? null,
        previousLevelNumber: activity.metadata?.previousLevelNumber ?? null,
        personnels: ensureArray(activity.metadata?.personnels).map(
          (personnel) => ({
            id: personnel?.id ?? 0,
            displayName: getLocalizedFullName(personnel),
            enName:
              (personnel as { enFullName?: string; enName?: string })
                ?.enFullName ??
              (personnel as { enFullName?: string; enName?: string })?.enName ??
              null,
            arName:
              (personnel as { arFullName?: string; arName?: string })
                ?.arFullName ??
              (personnel as { arFullName?: string; arName?: string })?.arName ??
              null,
            role: (personnel as { role?: string | null })?.role ?? null,
          }),
        ),
        user: activity.metadata?.user
          ? {
              id: activity.metadata.user.id,
              displayName: getLocalizedFullName(activity.metadata.user),
              enName:
                (
                  activity.metadata.user as {
                    enFullName?: string;
                    enName?: string;
                  }
                )?.enFullName ??
                (
                  activity.metadata.user as {
                    enFullName?: string;
                    enName?: string;
                  }
                )?.enName ??
                null,
              arName:
                (
                  activity.metadata.user as {
                    arFullName?: string;
                    arName?: string;
                  }
                )?.arFullName ??
                (
                  activity.metadata.user as {
                    arFullName?: string;
                    arName?: string;
                  }
                )?.arName ??
                null,
              role:
                (activity.metadata.user as { role?: string | null })?.role ??
                null,
            }
          : null,
      },
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      description: activity.description,
      attachments: activity.attachments
        ? ensureArray(activity.attachments)
        : null,
    }));
  }

  supportTicketUser(dto: SupportTicketUserDTO): SupportTicketUser {
    return {
      displayName: getLocalizedFullName(dto),
      userTypeId: dto.userTypeId,
      id: dto.id,
      gender: dto.gender,
      nationalId: dto.nationalId,
      displayPhoneNumber: `${dto.countryCode}${dto.phoneNumber}`,
    };
  }

  /**
   * Transform support type custom field DTO to interface
   */
  supportTypeCustomField(
    dto: SupportTypeCustomFieldDTO,
  ): SupportTypeCustomField {
    return {
      id: dto.id,
      labelDisplayName: getLocalizedName({
        arName: dto.arLabel,
        enName: dto.enLabel,
      }),
      descriptionDisplayName: getLocalizedName({
        arName: dto.arDescription ?? '',
        enName: dto.enDescription ?? '',
      }),
      arLabel: dto.arLabel,
      enLabel: dto.enLabel,
      arDescription: dto.arDescription,
      enDescription: dto.enDescription,
      isRequired: dto.required,
    };
  }
})();
