import { ensureArray } from '@shared/utils/array.util';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { Gender, SupportTicketStatus, UserType } from '@shared/enums';
import {
  SupportHubTicketDetailDTO,
  SupportHubTicketRoleDTO,
  SupportHubTicketUserDTO,
} from './support-hub-ticket-detail.dto';
import {
  SupportHubTicketDetail,
  SupportHubTicketUser,
} from './support-hub-ticket-detail.interface';

export const SUPPORT_HUB_TICKET_DETAIL_MAP_FROM_DTO = new (class {
  ticketDetail(dto: SupportHubTicketDetailDTO): SupportHubTicketDetail {
    // Build a map of userId -> roles from all ticket escalation personnels
    const userRolesMap = this.buildUserRolesMap(dto.ticketEscalations);
    const users = ensureArray(dto.user);
    const initiatorDetailUser =
      users.find((user) => user.id === dto.createdBy) ?? users.at(0);
    const initiatorRoles = initiatorDetailUser
      ? ensureArray(initiatorDetailUser.roles).map((role) =>
          getLocalizedName(role).trim(),
        )
      : [];
    const normalizedInitiatorRoles = initiatorRoles.filter(
      (role) => role.length > 0,
    );
    const roleDisplayNameCandidates = (() => {
      if (normalizedInitiatorRoles.length) {
        return normalizedInitiatorRoles;
      }

      if (initiatorDetailUser?.role) {
        const singleRole = getLocalizedName(initiatorDetailUser.role).trim();
        return singleRole ? [singleRole] : [];
      }

      return [];
    })();
    const rolesDisplayName = roleDisplayNameCandidates.join(', ');

    const resolvedStatus = dto.status === SupportTicketStatus.RESOLVED;
    const resolvedByInitiator = resolvedStatus && dto.isResolved === true;
    const resolvedByAssignee = resolvedStatus && dto.isResolved === false;

    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      isResolved: dto.isResolved,
      resolvedByInitiator,
      resolvedByAssignee,
      schoolId: dto.schoolId,
      createdByType: dto.createdByType,
      createdBy: dto.createdBy ?? null,
      ticketEscalationId: dto.ticketEscalationId,
      firstEscalationLevelNumber: dto.firstEscalationLevelNumber,
      currentEscalationLevelNumber: dto.currentEscalationLevelNumber,
      lastEscalationLevelNumber: dto.lastEscalationLevelNumber,
      supportTypeId: dto.supportTypeId,
      supportCategoryId: dto.supportCategoryId,
      ticketActivity: this.ticketActivity(
        dto.ticketActivity,
        dto.createdBy,
        userRolesMap,
      ),
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
        level: this.toOptionalNameIdentifiable(dto.schoolStructure.level),
        class: this.toOptionalNameIdentifiable(dto.schoolStructure.class),
      },
      supportTypes: ensureArray(dto.supportTypes).map((type) => ({
        id: type.id,
        displayName: getLocalizedName(type),
        icon: type.icon,
      })),
      supportCategories: ensureArray(dto.supportCategories).map((category) => ({
        id: category.id,
        displayName: getLocalizedName(category),
        icon: category.icon,
      })),
      initiator: this.supportTicketUser(initiatorDetailUser),
      userDisplayName: (() => {
        return initiatorDetailUser
          ? getLocalizedFullName(initiatorDetailUser)
          : '';
      })(),
      rolesDisplayName,
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
            profileColor: personnel.user.profileColor,
            personnelId: personnel.personnelId,
            displayName: getLocalizedFullName(personnel.user),
            roles: ensureArray(personnel.roles).map((role) => ({
              id: role.id,
              displayName: getLocalizedName(role),
            })),
          })),
        }),
      ),
      attachments: dto.attachments ? ensureArray(dto.attachments) : null,
      students: ensureArray(dto.students).map((student) =>
        COMMON_MAP_FROM_DTO.fullNameIdentifiable(student),
      ),
      customFields: ensureArray(dto.metadata?.customFields).map((field) => ({
        id: field.id,
        label: getLocalizedName({
          arName: field.arLabel,
          enName: field.enLabel,
        }),
        value: field.value,
      })),
    };
  }

  private ticketActivity(
    dto: SupportHubTicketDetailDTO['ticketActivity'],
    createdBy: number,
    userRolesMap: Map<number, string>,
  ): SupportHubTicketDetail['ticketActivity'] {
    return ensureArray(dto).map((activity) => {
      const metadata = activity.metadata ?? {};
      const metadataUser = metadata.user ?? null;
      const personnels = ensureArray(metadata.personnels);
      const addedPersonnels = ensureArray(metadata.addedPersonnels);
      const removedPersonnels = ensureArray(metadata.removedPersonnels);
      const currentLevel = metadata.currentLevelNumber ?? null;
      const previousLevel = metadata.previousLevelNumber ?? null;

      // Build user object from metadata user and roles from escalation personnels
      const userId = typeof metadataUser?.id === 'number' ? metadataUser.id : 0;
      const userDisplayName = this.getDisplayNameFromMetadata(metadataUser);
      const userRole = this.getRoleFromMetadata(
        metadataUser,
        userRolesMap,
        userId,
      );

      return {
        id: activity.id,
        status: activity.status,
        performedBy: metadataUser
          ? {
              id: userId,
              displayName: userDisplayName,
            }
          : null,
        performedById: activity.userId,
        isPerformedByInitiator: activity.userId === createdBy,
        description: activity.description,
        createdAt: activity.createdAt,
        attachments: ensureArray(activity.attachments),
        escalationChange:
          currentLevel !== null &&
          previousLevel !== null &&
          currentLevel !== previousLevel
            ? {
                fromLevel: previousLevel,
                toLevel: currentLevel,
              }
            : null,
        notifiedPersonnel: personnels.map((personnel) => ({
          id: personnel.id,
          displayName: this.getDisplayNameFromMetadata(personnel),
        })),
        addedPersonnels: addedPersonnels.map((personnel) => ({
          id: personnel.id,
          displayName: this.getDisplayNameFromMetadata(personnel),
          role: this.toOptionalTrimmed(
            this.getRoleFromMetadata(
              personnel,
              userRolesMap,
              typeof personnel?.id === 'number' ? personnel.id : undefined,
            ),
          ),
        })),
        removedPersonnels: removedPersonnels.map((personnel) => ({
          id: personnel.id,
          displayName: this.getDisplayNameFromMetadata(personnel),
          role: this.toOptionalTrimmed(
            this.getRoleFromMetadata(
              personnel,
              userRolesMap,
              typeof personnel?.id === 'number' ? personnel.id : undefined,
            ),
          ),
        })),
        user: {
          id: userId,
          displayName: userDisplayName,
          role: userRole,
        },
      };
    });
  }

  private getDisplayNameFromMetadata(
    entity: {
      arName?: string | null;
      enName?: string | null;
      arFullName?: string | null;
      enFullName?: string | null;
    } | null,
  ): string {
    if (!entity) {
      return '';
    }

    const arFullName = entity.arFullName ?? null;
    const enFullName = entity.enFullName ?? null;
    const arName = entity.arName ?? null;
    const enName = entity.enName ?? null;

    return (
      (arFullName && enFullName
        ? getLocalizedFullName({ arFullName, enFullName })
        : null) ||
      (arName && enName ? getLocalizedName({ arName, enName }) : null) ||
      arFullName ||
      enFullName ||
      arName ||
      enName ||
      ''
    );
  }

  private getRoleFromMetadata(
    entity: {
      role?: string | null;
      roles?: SupportHubTicketRoleDTO[] | null;
    } | null,
    userRolesMap: Map<number, string>,
    userId?: number,
  ): string {
    const metadataRoles = ensureArray(entity?.roles)
      .map((role) => getLocalizedName(role).trim())
      .filter((role) => role.length > 0);
    if (metadataRoles.length) {
      return metadataRoles.join(', ');
    }

    const metadataRole = entity?.role;
    if (typeof metadataRole === 'string') {
      const trimmedRole = metadataRole.trim();
      if (trimmedRole.length > 0) {
        return trimmedRole;
      }
    }

    if (userId != null && userRolesMap.has(userId)) {
      return userRolesMap.get(userId) ?? '';
    }

    return '';
  }

  private supportTicketUser(
    dto: SupportHubTicketUserDTO | undefined,
  ): SupportHubTicketUser {
    if (!dto) {
      return {
        id: 0,
        displayName: '',
        type: UserType.STUDENT,
        gender: Gender.MALE,
        nationalId: '',
        displayPhoneNumber: '',
      };
    }

    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      userTypeId: dto.userTypeId,
      type: dto.type,
      gender: dto.gender,
      nationalId: dto.nationalId,
      displayPhoneNumber: `${dto.countryCode}${dto.phoneNumber}`,
      role: (() => {
        const localizedRoles = ensureArray(dto.roles)
          .map((role) => getLocalizedName(role).trim())
          .filter((name) => name.length > 0);

        if (localizedRoles.length) {
          return {
            displayName: localizedRoles.join(', '),
          };
        }

        if (dto.role) {
          const singleRole = getLocalizedName(dto.role).trim();
          if (singleRole) {
            return {
              displayName: singleRole,
            };
          }
        }

        return undefined;
      })(),
    };
  }

  private toOptionalNameIdentifiable(
    dto: { id?: number; arName: string; enName: string } | null | undefined,
  ) {
    if (!dto || dto.id == null) {
      return null;
    }

    return COMMON_MAP_FROM_DTO.nameIdentifiable(
      dto as {
        id: number;
        arName: string;
        enName: string;
      },
    );
  }

  private buildUserRolesMap(
    ticketEscalations: SupportHubTicketDetailDTO['ticketEscalations'],
  ): Map<number, string> {
    const userRolesMap = new Map<number, string>();

    ensureArray(ticketEscalations).forEach((escalation) => {
      ensureArray(escalation.ticketEscalationPersonnels).forEach(
        (personnel) => {
          const userId = personnel.user?.id;
          if (userId && !userRolesMap.has(userId)) {
            const roles = ensureArray(personnel.roles)
              .map((role) => getLocalizedName(role))
              .filter((name) => name.length > 0)
              .join(', ');
            userRolesMap.set(userId, roles);
          }
        },
      );
    });

    return userRolesMap;
  }

  private toOptionalTrimmed(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
})();
