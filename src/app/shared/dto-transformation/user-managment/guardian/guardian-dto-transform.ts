import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  GuardianCampusDTO,
  GuardianDTO,
  GuardianStudentDTO,
} from './guardian-dto';
import {
  Guardian,
  GuardianCampus,
  GuardianStudent,
} from './guardian.interface';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation/common/common-dto-transform';
import { isNonEmptyObject } from '@shared/utils/is-non-empty-object.util';
import { STUDENT_MAP_FROM_DTO } from '../student';
import { ensureArray } from '@shared/utils/array.util';
import { getFirstObjectOrNull } from '@shared/utils/get-first-object-or-null.util';
import { UserType } from '@shared/enums';

export const GUARDIAN_MAP_FROM_DTO = new (class {
  guardian(dto: GuardianDTO): Guardian {
    const personnelProfile = isNonEmptyObject(dto.connectedPersonnel)
      ? COMMON_MAP_FROM_DTO.connectedProfile(dto.connectedPersonnel)
      : null;
    const studentProfile = isNonEmptyObject(dto.connectedStudents)
      ? COMMON_MAP_FROM_DTO.connectedProfile(dto.connectedStudents)
      : null;
    const level = getFirstObjectOrNull(dto.levels);
    const classe = getFirstObjectOrNull(dto.classes);
    const campus = getFirstObjectOrNull(dto.campuses);
    const company = getFirstObjectOrNull(dto.companies);
    const school = getFirstObjectOrNull(dto.schools);
    return {
      id: dto.id,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      profileColor: dto.profileColor,
      displayPreferredName: dto.preferredName ?? getLocalizedFullName(dto),
      preferredName: dto.preferredName,
      displayName: getLocalizedFullName(dto),
      email: dto.email,
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      displayPhoneNumber: `${dto.countryCode} ${dto.phoneNumber}`,
      nationalId: dto.nationalId,
      gender: dto.gender,
      type: dto.type ?? UserType.GUARDIAN,
      status: dto.status,
      createdAt: dto.createdAt,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
      tenantId: dto.tenantId,
      userId: dto.userId,
      connectedPersonnel: personnelProfile,
      connectedStudents: studentProfile,
      students: this.guardianStudents(dto.students),
      academicYears: dto.academicYears,
      userEvent: dto.userEvent,
      level: level ? COMMON_MAP_FROM_DTO.nameIdentifiable(level) : null,
      classe: classe ? COMMON_MAP_FROM_DTO.nameIdentifiable(classe) : null,
      campus: this.guardianCampus(campus),
      company: company ? COMMON_MAP_FROM_DTO.nameIdentifiable(company) : null,
      school: school ? COMMON_MAP_FROM_DTO.nameIdentifiable(school) : null,
      companies: ensureArray(dto.companies).map((c) =>
        COMMON_MAP_FROM_DTO.nameIdentifiable(c),
      ),
      campuses: this.guardianCampuses(ensureArray(dto.campuses)),
      schools: ensureArray(dto.schools).map((s) =>
        COMMON_MAP_FROM_DTO.nameIdentifiable(s),
      ),
    };
  }

  guardianStudent(dto: GuardianStudentDTO): GuardianStudent {
    return {
      ...STUDENT_MAP_FROM_DTO.student(dto),
      studentRelationship: dto.studentRelationship,
      guardianRelationship: dto.guardianRelationship,
    };
  }

  guardianStudents(dtos: GuardianStudentDTO[]): GuardianStudent[] {
    return ensureArray(dtos).map((dto) => this.guardianStudent(dto));
  }

  guardianCampus(dto: GuardianCampusDTO | null): GuardianCampus | null {
    if (!dto) {
      return null;
    }
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
  }

  guardianCampuses(dto: GuardianCampusDTO[]): GuardianCampus[] {
    return ensureArray(dto)
      .map((item) => this.guardianCampus(item))
      .filter((campus): campus is GuardianCampus => campus !== null);
  }

  guardians(dto: GuardianDTO[]): Guardian[] {
    return ensureArray(dto).map((item) => this.guardian(item));
  }
})();
