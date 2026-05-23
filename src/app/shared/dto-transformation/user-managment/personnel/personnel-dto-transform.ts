import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  AssociatePersonnelDataDTO,
  PersonnelDTO,
  SubjectAssociationDTO,
} from './personnel-dto';
import {
  AssociatePersonnelData,
  Personnel,
  SubjectAssociation,
} from './personnel.interface';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation/common/common-dto-transform';
import { ensureArray } from '@shared/utils/array.util';
import { getFirstObjectOrNull } from '@shared/utils/get-first-object-or-null.util';
import { UserType } from '@shared/enums';
import { isNonEmptyObject } from '@shared/utils/is-non-empty-object.util';

export const PERSONNEL_MAP_FROM_DTO = new (class {
  personnel(dto: PersonnelDTO): Personnel {
    // Example: handle connected profiles, levels, etc.
    const studentConnectedProfile = COMMON_MAP_FROM_DTO.connectedProfile(
      dto.connectedStudent,
    );
    const guardianConnectedProfile = COMMON_MAP_FROM_DTO.connectedProfile(
      dto.connectedGuardian,
    );
    const userEvents = COMMON_MAP_FROM_DTO.userEvents(dto.userEvent);
    const lastUserEvent = getFirstObjectOrNull(userEvents);
    return {
      id: dto.id,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      displayPreferredName: dto.preferredName ?? getLocalizedFullName(dto),
      preferredName: dto.preferredName,
      displayName: getLocalizedFullName(dto),
      profileColor: dto.profileColor,
      employeeIdentifier: dto.employeeIdentifier,
      passportNumber: dto.passportNumber ?? null,
      passportExpiryDate: dto.passportExpiryDate ?? null,
      startDate: dto.startDate,
      email: dto.email,
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      displayPhoneNumber: `${dto.countryCode} ${dto.phoneNumber}`,
      nationalId: dto.nationalId,
      nationalityId: dto.nationalityId,
      nationality: dto.nationality
        ? COMMON_MAP_FROM_DTO.nameIdentifiable(dto.nationality)
        : null,
      gender: dto.gender,
      type: dto.type ?? UserType.PERSONNEL,
      dateOfBirth: dto.dateOfBirth ?? null,
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      createdBy: isNonEmptyObject(dto.createdBy)
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : null,
      userId: dto.userId,
      connectedGuardian: guardianConnectedProfile,
      connectedStudent: studentConnectedProfile,
      userEvent: userEvents,
      lastUserEvent,
      roles: ensureArray(dto.roles).map((role) => ({
        id: role.id,
        displayName: getLocalizedName(role),
      })),
      levels: COMMON_MAP_FROM_DTO.namesIdentifiable(dto.levels),
      campuses: ensureArray(dto.campuses).map((c) => ({
        id: c.id,
        displayName: getLocalizedName(c),
        companyId: c.companyId,
      })),
      companies: ensureArray(dto.companies).map((c) => ({
        id: c.id,
        displayName: getLocalizedName(c),
        parentId: c.parentId,
      })),
      schools: ensureArray(dto.schools).map((s) => ({
        id: s.id,
        displayName: getLocalizedName(s),
        campusId: s.campusId,
      })),
      displayRoleNames: function (): string {
        return this.roles.map((r) => r.displayName).join(', ');
      },
    };
  }

  personnels(dtos: PersonnelDTO[]): Personnel[] {
    return ensureArray(dtos).map((personnel) => this.personnel(personnel));
  }

  subjectAssociations(dtos: SubjectAssociationDTO[]): SubjectAssociation[] {
    return ensureArray(dtos).map((dto) => ({
      subjectId: dto.subjectId,
      displayName: getLocalizedName(dto),
      iconUrl: dto.url,
      hasCourse: dto.hasCourse ?? false,
    }));
  }

  associatePersonnel(dto: AssociatePersonnelDataDTO): AssociatePersonnelData {
    return {
      schools: ensureArray(dto.schools).map((s) => ({
        id: s.id,
        displayName: getLocalizedName(s),
        campusId: s.campusId,
      })),
      campuses: ensureArray(dto.campuses).map((c) => ({
        id: c.id,
        displayName: getLocalizedName(c),
        companyId: c.companyId,
      })),
      companies: ensureArray(dto.companies).map((c) => ({
        id: c.id,
        displayName: getLocalizedName(c),
        parentId: c.parentId,
      })),
    };
  }
})();
